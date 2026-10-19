import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processPayment } from '../supabase/functions/toss-test/core.mjs';
const id = '12345678-1234-1234-1234-123456789abc';
const body = { action: 'confirm', orderId: id, amount: 1000, paymentKey: 'test_payment' };
function fixture() {
  const row = { id, amount: 1000, status: 'created', created_at: new Date().toISOString() };
  let calls = 0;
  return { row, get calls() { return calls; }, deps: {
    create: async () => row,
    get: async (_, user) => user === 'owner' ? { ...row } : undefined,
    claim: async (_, user, key) => {
      if (row.status !== 'created') return false;
      row.status = 'processing'; row.payment_key = key; return true;
    },
    confirm: async () => { calls++; return { status: 'DONE', orderId: id, totalAmount: 1000, paymentKey: body.paymentKey, currency: 'KRW' }; },
    complete: async () => { row.status = 'done'; }
  } };
}
test('server creates fixed amount, ignoring submitted price', async () => {
  const f = fixture(); assert.equal((await processPayment({ action: 'create', amount: 1 }, 'owner', f.deps)).amount, 1000);
});
test('tampered amount and wrong owner never reach gateway', async () => {
  const f = fixture();
  await assert.rejects(processPayment({ ...body, amount: 1 }, 'owner', f.deps));
  await assert.rejects(processPayment(body, 'other', f.deps)); assert.equal(f.calls, 0);
});
test('parallel confirmation calls gateway once; completed retry is idempotent', async () => {
  const f = fixture(); const results = await Promise.allSettled([processPayment(body, 'owner', f.deps), processPayment(body, 'owner', f.deps)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1); assert.equal(f.calls, 1);
  assert.equal((await processPayment(body, 'owner', f.deps)).status, 'DONE'); assert.equal(f.calls, 1);
  await assert.rejects(processPayment({ ...body, paymentKey: 'other' }, 'owner', f.deps));
});
test('gateway timeout keeps order pending and rejects blind retry', async () => {
  const f = fixture(); f.deps.confirm = async () => { throw new Error('timeout'); };
  await assert.rejects(processPayment(body, 'owner', f.deps)); assert.equal(f.row.status, 'processing');
  await assert.rejects(processPayment(body, 'owner', f.deps), /PENDING/);
});
test('mismatched gateway amount is never recorded as done', async () => {
  const f = fixture(); f.deps.confirm = async () => ({ status: 'DONE', totalAmount: 1 });
  await assert.rejects(processPayment(body, 'owner', f.deps), /MISMATCH/); assert.equal(f.row.status, 'processing');
});
test('database failure after approval does not report completion', async () => {
  const f = fixture(); f.deps.complete = async () => { throw new Error('db unavailable'); };
  await assert.rejects(processPayment(body, 'owner', f.deps)); assert.equal(f.row.status, 'processing');
});
test('expired orders cannot be approved', async () => {
  const f = fixture(); f.row.created_at = '2020-01-01T00:00:00Z';
  await assert.rejects(processPayment(body, 'owner', f.deps), /EXPIRED/); assert.equal(f.calls, 0);
});
