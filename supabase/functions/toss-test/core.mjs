// Test-only payment service. Dependencies isolate gateway/database I/O for tests.
export async function processPayment(body, userId, deps) {
  if (body.action === 'create') {
    const order = await deps.create(userId);
    return { orderId: order.id, amount: order.amount, orderName: 'HYRAM 연동 테스트 (판매 주문 아님)' };
  }
  if (body.action !== 'confirm' || typeof body.orderId !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(body.orderId) || body.amount !== 1000 ||
      typeof body.paymentKey !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(body.paymentKey)) {
    throw new Error('INVALID_REQUEST');
  }
  const order = await deps.get(body.orderId, userId);
  if (!order || order.amount !== body.amount) throw new Error('ORDER_MISMATCH');
  if (order.status === 'done') {
    if (order.payment_key !== body.paymentKey) throw new Error('ORDER_MISMATCH');
    return { status: 'DONE', orderId: order.id, amount: order.amount, test: true };
  }
  // Atomic claim prevents parallel confirmations. Uncertain outcomes remain locked
  // for operator reconciliation; never blindly retry a potentially approved charge.
  if (order.status !== 'created' || Date.now() - Date.parse(order.created_at) > 30 * 60 * 1000 ||
      !await deps.claim(order.id, userId, body.paymentKey)) throw new Error('ORDER_PENDING_OR_EXPIRED');
  const payment = await deps.confirm({ orderId: order.id, amount: order.amount, paymentKey: body.paymentKey });
  if (payment.status !== 'DONE' || payment.orderId !== order.id || payment.totalAmount !== order.amount ||
      payment.paymentKey !== body.paymentKey || payment.currency !== 'KRW') throw new Error('GATEWAY_RESPONSE_MISMATCH');
  await deps.complete(order.id, userId);
  return { status: 'DONE', orderId: order.id, amount: order.amount, test: true };
}
