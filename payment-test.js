import { getClient } from './auth/client.mjs';

async function server(body) {
  const client = await getClient();
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) throw new Error('먼저 HYRAM 관리자 계정으로 로그인해 주세요.');
  const { data, error } = await client.functions.invoke('toss-test', { body });
  if (error || data?.error) throw new Error(data?.message || data?.error || '테스트 승인 서버에 연결하지 못했습니다.');
  return data;
}
// Publishable, test-only client key. Never add a secret key to this file.
const CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
const AMOUNT = 1000;
const statusNode = document.querySelector('#status');
const button = document.querySelector('#pay');
const params = new URLSearchParams(location.search);
const result = params.get('result');
// Remove gateway identifiers from the address bar; do not persist paymentKey.
if (location.search) history.replaceState(null, '', location.pathname);

async function main() {
  if (result) {
    button.hidden = true;
    if (result === 'fail') {
      statusNode.textContent = '테스트 결제가 취소되었거나 실패했습니다. ' + (params.get('code') || '') + ' ' + (params.get('message') || '다시 시도해 주세요.');
      return;
    }
    let pending;
    try { pending = JSON.parse(sessionStorage.getItem('hyram-test-order') || 'null'); } catch (_) { /* no trusted local state */ }
    if (result !== 'success' || !pending || pending.orderId !== params.get('orderId') || params.get('amount') !== String(AMOUNT) || !params.get('paymentKey')) {
      statusNode.textContent = '테스트 응답을 확인할 수 없습니다. 결제나 주문이 확정되지 않았습니다.';
      return;
    }
    try {
      const approved = await server({ action: 'confirm', orderId: pending.orderId, amount: Number(params.get('amount')), paymentKey: params.get('paymentKey') });
      if (approved.status !== 'DONE' || approved.orderId !== pending.orderId || approved.amount !== AMOUNT || approved.test !== true) throw new Error('승인 응답 확인이 필요합니다.');
      sessionStorage.removeItem('hyram-test-order');
      statusNode.textContent = '테스트 결제 승인을 확인했습니다. 실제 청구나 상품 주문은 발생하지 않습니다.';
    } catch (error) { statusNode.textContent = '테스트 승인 미확정: ' + error.message + ' 관리자 확인 전 재결제하지 마세요.'; }
    return;
  }
  try {
    if (!CLIENT_KEY.startsWith('test_gck_')) throw new Error('테스트 전용 키가 필요합니다.');
    if (typeof TossPayments !== 'function') throw new Error('토스 결제 SDK를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.');
    const widgets = TossPayments(CLIENT_KEY).widgets({ customerKey: TossPayments.ANONYMOUS });
    await widgets.setAmount({ currency: 'KRW', value: AMOUNT });
    await Promise.all([
      widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
      widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' })
    ]);
    statusNode.textContent = '테스트 결제 화면이 준비되었습니다. 실제 금액은 청구되지 않습니다.';
    button.disabled = false;
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const order = await server({ action: 'create' });
        if (order.amount !== AMOUNT || !order.orderId) throw new Error('테스트 주문 금액을 확인해 주세요.');
        const orderId = order.orderId;
        sessionStorage.setItem('hyram-test-order', JSON.stringify({ orderId }));
        const callback = new URL('payment-test.html', location.href);
        await widgets.requestPayment({ orderId, orderName: 'HYRAM 연동 테스트 (판매 주문 아님)', successUrl: callback.href + '?result=success', failUrl: callback.href + '?result=fail' });
      } catch (error) {
        statusNode.textContent = '테스트 결제를 진행하지 못했습니다. ' + (error.message || '다시 시도해 주세요.');
      } finally { button.disabled = false; }
    });
  } catch (error) { statusNode.textContent = '결제 화면 연결 오류: ' + error.message; }
}
main();
