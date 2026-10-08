# Toss Payments test integration gate

Status: NOT TESTED. No real backend deployed and no transaction executed.

The user supplied Toss Payments documentation-prefixed test keys in chat. **Never copy the secret key into Git, static HTML, browser JS, logs, or a public issue.** Prefer newly issued merchant-specific keys from the Toss Payments developer console. Rotate any merchant secret that has been exposed.

## Architecture
1. Server creates an order with server-calculated price and immutable orderId.
2. Browser uses only a publishable test client key to request payment with Toss Payments SDK.
3. Redirect success contains paymentKey, orderId, amount; server loads saved order and compares orderId/amount before calling confirm.
4. Server calls POST https://api.tosspayments.com/v1/payments/confirm using HTTP Basic with the test secret in a server-only environment variable.
5. Server persists paymentKey, gateway status, amount, and transaction timestamps; responds with a verified result.
6. Cancellation is initiated only by an authenticated merchant/admin server action; call POST /v1/payments/{paymentKey}/cancel, then verify and persist the response.
7. Reconcile retry/idempotency and gateway errors; no client-side amount authority.

## Acceptance
- Test approval: NOT TESTED
- Rejected/tampered amount: NOT TESTED
- Failed payment: NOT TESTED
- Test cancellation: NOT TESTED
- Real merchant MID and operating keys: BLOCKED pending merchant review
- Live payment: BLOCKED until all gates pass

No payment button should be enabled in the public site yet.
