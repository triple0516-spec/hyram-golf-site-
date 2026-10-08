# HYRAM GOLF Security Gate

Automated checks run on every push to main and every pull request.

## Automated gate
- Secret exposure scan: PASS only when workflow succeeds
- Dangerous DOM/JS sink scan: PASS only when workflow succeeds
- Payment secret in public client scan: PASS only when workflow succeeds
- Backend/payment security architecture documents: PASS only when workflow succeeds

## Release blockers
These are **not** converted to PASS by the static gate:
- Server-side payment amount/order validation: BLOCKED until backend is deployed and tested
- Toss test payment / cancel / failure flow: BLOCKED until merchant credentials and backend are ready
- Database authorization/RLS runtime test: NOT TESTED
- Authentication/session security: NOT TESTED
- Rate limiting / abuse controls: NOT TESTED
- Production penetration test: NOT TESTED

A green static-security-gate means only the automated static checks above passed. It is not a claim that payment or the whole service is penetration-tested.
