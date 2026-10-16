# HYRAM GOLF — 실시간 GPT 상담 + 휴대폰 본인확인 운영 게이트

## 구현 범위 (PR staging, NOT LIVE)
- static web: runtime-config.js, new login.html / signup.html / verify.html, verify.js, member.css.
- Cloudflare Worker: POST /api/chat, GET /api/identity/config, POST /api/identity/start, POST /api/identity/confirm, GET /health.
- GPT via OpenAI Responses API; secret only on Worker, store:false, input length + max output tokens, no confirmed booking or pricing claims, fail-closed missing configuration, allowed Origin only.
- PortOne V2 본인확인: random server-issued attempt ID and state, 10min expiry, state SHA-256 in D1, provider REST API VERIFIED check, one-time D1 conditional update. No collection of birthdate, phone, CI or DI in this prototype.
- Browser allows mobile redirect to /verify.html, using per-tab sessionStorage state; the callback's own success indication is never trusted.
- Cloudflare Rate Limiting binding for pre-auth requests (10 requests / minute by edge key). Add account/WAF rate limiting and quota policies before public launch.

## 정식 운영에 필요한 외부 작업
1. Cloudflare account with Worker deploy rights (GitHub Pages alone cannot hold OpenAI or PortOne secrets).
2. Provision and migrate D1: use backend/worker/migrations/0001_identity_attempts.sql.
3. Configure RATE_LIMIT binding from wrangler.jsonc and Cloudflare bot/WAF controls, plus spending alerts for OpenAI API.
4. Initially register only OPENAI_API_KEY as Cloudflare encrypted secret for GPT-only deployment. After PortOne identity provider contract, also register PORTONE_API_SECRET, PORTONE_STORE_ID and PORTONE_CHANNEL_KEY. No credential belongs in GitHub, HTML or chat.
5. Complete PortOne merchant onboarding / KCP or Danal identity channel activation and provider domain/redirect registration. Toss POS/PG keys do not substitute for PortOne identity credentials.
6. Generate Wrangler deployment configuration using actual D1 UUID (see GO_LIVE_CHECKLIST.md), migrate D1 and deploy Worker with OpenAI key. Check /health: GPT-only phase must return chatReady=true and identityReady=false; after provider activation identityReady=true. Review, then set HTTPS Worker host in runtime-config.js. Keep origin allow-list and callback URLs consistent.
7. Test real Galaxy Android, iPhone, PC (same-tab / redirect), success / cancel / expired / retry / replay, no PII exposed, and production analytics/abuse handling.
8. Real account sign-up/sign-in requires a separate authenticated user DB, protected session, account deletion, password recovery and privacy consent flows. This PR **does not create login accounts** even if phone identity check later becomes live.

## Run local checks
- node --check backend/worker/src/index.mjs
- node --check verify.js
- node --test backend/worker/test/*.test.mjs
- Existing HYRAM Security Gate and browser QA must PASS.

## Release decision
Do not merge this PR or enable live identity/GPT just from code; follow the staged go-live checklist and verify account ownership and deployment first. Required contract, Worker deployment, secrets, operating-domain QA and privacy review are NOT TESTED / BLOCKED. **No fake success banner.**

Reference: https://developers.portone.io/opi/ko/extra/identity-verification/readme-v2
OpenAI: https://developers.openai.com/api/reference/resources/responses/methods/create
Cloudflare: https://developers.cloudflare.com/workers/wrangler/configuration/

Full account-dependent operational checklist: backend/worker/GO_LIVE_CHECKLIST.md.
