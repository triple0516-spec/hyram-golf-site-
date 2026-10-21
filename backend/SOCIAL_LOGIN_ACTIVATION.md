# Customer social login activation — 2026-10-21

## Verified diagnosis
- Previously `login.html` contained only the OWNER email form; `signup.html` was disabled.
- Public Auth settings returned `external.kakao=false`, `external.facebook=false`, email enabled, signup not disabled. This is not an OAuth success test.
- Supabase management connection and provider developer apps are not available in this task.

## Prepared implementation
- Customer login/signup entry, separate `owner-login.html`, dedicated PKCE customer client/storage, verified-user callback, logout.
- Existing OWNER client, callback, RPC and database authorization remain separate.
- All three social release flags remain false. Buttons explain availability; no simulated authentication.
- Customer OAuth never grants OWNER or a paid membership and does not expose orders or reservations.

## Required operator configuration
1. Connect the existing Supabase project `ekjbssnlurwriomgqlgw`.
2. For Kakao and Facebook, register/confirm the HYRAM developer application and configure its client ID and secret only in Supabase Auth provider settings. Never put secrets in HTML, Git, or chat.
3. Provider callback: `https://ekjbssnlurwriomgqlgw.supabase.co/auth/v1/callback` (use the exact dashboard URL).
4. Add exact allowed customer return URLs:
   - `https://hyramgolf.kr/auth/member-callback.html`
   - `https://www.hyramgolf.kr/auth/member-callback.html`
   Retain OWNER callback allowlist separately. Set Site URL to `https://hyramgolf.kr`.
5. Confirm Kakao product activation, required consent fields and Facebook live/public app availability, privacy and data-deletion configuration.
6. NAVER is NOT a built-in Supabase provider. The prepared identifier is `custom:naver`. Before enabling, validate custom OAuth availability, NAVER app registration, callback, PKCE compatibility and nested NAVER `response.id` / email mapping. If generic custom OAuth cannot map NAVER userinfo correctly, implement a reviewed server-side identity adapter; do not flatten unverified client data or issue tokens in the browser. NAVER remains BLOCKED until this is proven.
7. Verify actual data collection and retention against privacy notice before opening new account creation publicly.
8. Enable a provider flag only after staging real authentication tests. This draft does not activate any provider or change server settings.

## Release evidence required per provider
- Consent accepted and denied, new/returning user, expired code, logout, refresh/session expiry.
- Customer cannot access `/admin/` or OWNER database privileges.
- Bare/www host and Galaxy Chrome/Samsung Internet tests.
- Confirm server user identity; never treat a rendered button or redirect alone as PASS.
- Unit callback tests: 8/8 PASS with mocks. OWNER static guards: PASS. Real OAuth/DB authorization: BLOCKED/NOT TESTED.

## References
- https://supabase.com/docs/guides/auth/social-login/auth-kakao
- https://supabase.com/docs/guides/auth/social-login/auth-facebook
- https://supabase.com/docs/guides/auth/custom-oauth-providers
- https://developers.naver.com/docs/login/overview/overview.md
