import { processPayment } from './core.mjs';

const env = (name: string) => Deno.env.get(name) || '';
const origins = new Set(['https://hyramgolf.kr', 'https://www.hyramgolf.kr']);
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': origins.has(origin) ? origin : 'null', 'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  const respond = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
  if (!origins.has(origin)) return respond({ error: 'ORIGIN_DENIED' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return respond({ error: 'METHOD_NOT_ALLOWED' }, 405);
  const secret = env('TOSS_TEST_SECRET_KEY');
  const url = env('SUPABASE_URL');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  const tester = env('HYRAM_TEST_USER_ID');
  if (!/^test_(gsk|sk)_/.test(secret) || !serviceKey || !url || !tester) {
    return respond({ error: 'TEST_SERVER_NOT_CONFIGURED' }, 503);
  }
  try {
    const token = req.headers.get('authorization') || '';
    if (!token.startsWith('Bearer ')) return respond({ error: 'LOGIN_REQUIRED' }, 401);
    const auth = await fetch(url + '/auth/v1/user', { headers: { apikey: serviceKey, Authorization: token }, signal: AbortSignal.timeout(10000) });
    if (!auth.ok) return respond({ error: 'LOGIN_REQUIRED' }, 401);
    const user = await auth.json();
    if (user.id !== tester) return respond({ error: 'TEST_USER_ONLY' }, 403);
    const text = await req.text();
    if (text.length > 4096) return respond({ error: 'REQUEST_TOO_LARGE' }, 413);
    const body = JSON.parse(text);
    if (!body || typeof body !== 'object') return respond({ error: 'INVALID_REQUEST' }, 400);
    const db = async (path: string, method = 'GET', payload?: unknown) => {
      const response = await fetch(url + '/rest/v1/' + path, { method,
        headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }), signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('DATABASE_UNAVAILABLE');
      return await response.json();
    };
    const filter = (id: string, owner: string) => 'hyram_test_orders?id=eq.' + encodeURIComponent(id) + '&user_id=eq.' + encodeURIComponent(owner);
    const result = await processPayment(body, user.id, {
      create: async (owner: string) => {
        const rows = await db('hyram_test_orders', 'POST', { user_id: owner, amount: 1000 });
        if (!rows[0]) throw new Error('DATABASE_UNAVAILABLE');
        return rows[0];
      },
      get: async (id: string, owner: string) => (await db(filter(id, owner)))[0],
      claim: async (id: string, owner: string, key: string) => (await db(filter(id, owner) + '&status=eq.created', 'PATCH', { status: 'processing', payment_key: key })).length === 1,
      complete: async (id: string, owner: string) => {
        const rows = await db(filter(id, owner) + '&status=eq.processing', 'PATCH', { status: 'done', approved_at: new Date().toISOString() });
        if (rows.length !== 1) throw new Error('DATABASE_UNAVAILABLE');
      },
      confirm: async (payload: { orderId: string }) => {
        const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
          method: 'POST', headers: { Authorization: 'Basic ' + btoa(secret + ':'), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('GATEWAY_CONFIRM_UNCERTAIN');
        return await response.json();
      }
    });
    return respond(result);
  } catch (error) {
    // Do not return upstream responses, keys, tokens, or payment identifiers.
    const code = error instanceof Error ? error.message : '';
    if (['INVALID_REQUEST', 'ORDER_MISMATCH'].includes(code)) return respond({ error: code }, 400);
    if (code === 'ORDER_PENDING_OR_EXPIRED') return respond({ error: code }, 409);
    return respond({ error: 'TEST_APPROVAL_UNCONFIRMED', message: '승인 결과를 확정할 수 없습니다. 관리자 확인 전 재결제하지 마세요.' }, 503);
  }
});
