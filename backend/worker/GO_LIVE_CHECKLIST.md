# HYRAM GOLF — Cloudflare / OpenAI / PortOne deployment readiness

STATUS: CODE STAGED ONLY (Draft PR #4). Cloudflare account, D1 DB, secrets and PortOne channel have NOT been created.
Neither successful CI nor GitHub Pages build constitutes a working authenticated service.

## Phase 0 — completed in code
- [x] OpenAI Responses API Worker with input bounds, limited in-memory conversation history, store:false, allowlisted origins and rate limiting.
- [x] PortOne V2 browser identity request and redirect UI; Worker rechecks VERIFIED with PortOne REST API, verifies hashed state, expiry and single-use request.
- [x] Independent login/signup/verify preview pages; these do not create actual accounts or sessions.
- [x] D1 SQL migration and tests, no API secrets committed.
- [x] Deployment configuration preparation script with D1 UUID validation and no secret writes.
- [x] Gitignore excludes .env/.dev.vars and generated Worker production config.

## Phase 1 — Cloudflare owner creates account (no DNS transfer necessary)
1. Sign in to Cloudflare. Leave existing hyramgolf.kr and GitHub Pages DNS unchanged; use assigned Workers subdomain for the backend.
2. Create Worker named hyram-golf-api in dashboard, or authorize Wrangler login from trusted computer.
3. From backend/worker: install Node.js >=22 and Wrangler CLI; confirm with npx wrangler whoami.
4. Create D1: npx wrangler d1 create hyram-golf-identity.
5. Copy only D1 UUID (not credentials) and run:
   node scripts/prepare-deployment.mjs <actual-D1-UUID>
   This writes ignored local-only wrangler.production.jsonc and refuses to overwrite it.
6. Apply schema:
   npx wrangler d1 migrations apply hyram-golf-identity --remote --config wrangler.production.jsonc
7. In Worker Settings > Variables and Secrets, add secret OPENAI_API_KEY as type Secret (not plaintext variable); OpenAI platform API key is separate from ChatGPT Plus.
8. Review OpenAI API billing, budget alerts, Cloudflare usage and WAF/bot controls; do not send real customer data until a privacy review.
9. Deploy from backend/worker:
   npx wrangler deploy --config wrangler.production.jsonc
   Required OPENAI_API_KEY declaration means missing OpenAI secret blocks deploy.
10. GET /health must return status ok, chatReady true and identityReady false while the PortOne contract is pending.
11. After Worker deploy, set only the public HTTPS Worker base URL in repository root runtime-config.js. Do NOT set it to a made-up workers.dev hostname.
12. Before publishing the new frontend, test chat API response, fallback, cost/rate limits, 375px/390px browsers, same-origin and www origins, error handling and mobile network.
13. Merge/Pages publish only after checklist review. Avoid advertising live chat until HTTPS and actual response checks pass.

## Phase 2 — after PortOne contract
- HYRAM owner signs contract with identity provider KCP or Danal via PortOne; separate from payment terminal and payment gateway agreement.
- For KCP, configure V2 integration and allowed mobile redirect URLs in provider management.
- Add encrypted Cloudflare secrets PORTONE_API_SECRET, PORTONE_STORE_ID, PORTONE_CHANNEL_KEY. Worker reports identityReady only once configured with D1 and rate limiting.
- Test on actual phone: success, cancel, failure, redirect, retries, expiry, replay, provider downtime, rate limits.
- Publish reviewed privacy policy and third-party transfer/retention notices BEFORE real verification use. Never collect national ID numbers in the HYRAM website.
- Phone identity success does not create an account: a separate account/session/database implementation is needed for true signup/login.
- Validate store/channel match and provider result structure against the actual approved provider credentials before production enabling.

## Status
- Code / basic tests: READY FOR REVIEW, not deployed.
- Cloudflare account and permissions: BLOCKED (owner action).
- D1 and Worker deployment: BLOCKED (account).
- OpenAI API secret / platform billing: BLOCKED (owner action).
- PortOne contract and channel: BLOCKED (owner action).
- Real login/member records: NOT IMPLEMENTED.
- Actual end-to-end GPT and identity service: NOT TESTED.

Never share API secrets in messages, repository commits or browser JavaScript.

Official docs
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/d1/wrangler-commands/
- https://developers.portone.io/opi/ko/extra/identity-verification/readme-v2
- https://developers.openai.com/api/reference/resources/responses/methods/create
