# Test payment server setup — not deployed

Project: `ekjbssnlurwriomgqlgw`. This branch adds an owner-only, fixed KRW 1,000 test flow, not a production checkout.

1. In Supabase SQL Editor run `backend/db/test_payments.sql`. No anonymous or authenticated table access is granted.
2. In Authentication → Users, locate the account that will test and copy its UUID. Configure `HYRAM_TEST_USER_ID` with that UUID in Edge Functions → Secrets.
3. In the same Secrets screen, set `TOSS_TEST_SECRET_KEY` to the TEST secret paired with the checkout client key. Never paste the value into chat, Git, a screenshot or browser code. Merchant-specific keys are preferable; update the public client key to the matching test client when changing merchants. Live keys are refused.
4. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied by the Edge Functions environment. Do not add them to frontend files.
5. From this checkout deploy the function using the Supabase CLI: `supabase functions deploy toss-test --project-ref ekjbssnlurwriomgqlgw`. Keep JWT verification enabled. The function also validates the user token with Supabase Auth and allows only the configured test user. Deploy `index.ts` AND its imported `core.mjs`.
6. After review and deployment of the frontend, sign into HYRAM with the configured account, then visit `/payment-test.html` on the apex or www domain. Other origins are denied. Rendering the widget does not mean the server is deployed; creating a test order requires the server.
7. Verify approval in Toss and in `hyram_test_orders`. Then verify test cancellation in Toss merchant tools. This implementation does not offer a cancellation endpoint, live purchase, automatic fulfillment, webhooks or production reconciliation.

## Uncertain approvals
Orders enter `processing` atomically before the gateway request. A timeout, rejection, malformed response or DB write failure does not report success and blocks automated retry. An operator must look up the order in Toss, check its amount/payment key and reconcile the database or cancel the test transaction. Never reset a processing order blindly. Completed matching retries return the persisted result.

## Evidence
Local `node --test qa/test_payment_server.mjs`: tests the server core with mocked DB/gateway, including amount tampering, ownership, concurrency, expiry and uncertainty. This is not an executed database migration or a real gateway test. Deno deployment, SQL/RLS enforcement, authenticated frontend and Galaxy end-to-end remain NOT TESTED until project access is available.

References:
- https://supabase.com/docs/guides/functions/secrets
- https://docs.tosspayments.com/guides/v2/payment-widget/integration
