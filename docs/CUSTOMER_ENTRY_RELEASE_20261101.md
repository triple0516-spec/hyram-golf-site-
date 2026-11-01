# Customer entry and readable logo release

## Confirmed operating source

- Canonical repository: `triple0516-spec/hyram-golf-site-`, root static files, main branch.
- `CNAME` is `hyramgolf.kr`.
- The captured public homepage Git blob hash is `9829ee5ed20164b25405f7d61a2d23d7253c7dd5`, identical to this repository index.html at parent `ae26250df3f83ade62e53ddcbec23b5c84c3940d`.
- The parent has successful `pages build and deployment` and official-domain verification runs.
- `triple0516-spec/hyram-golf` is the app/older web repository; its PR #23 is design/source provenance, not the operating deployment target. Do not merge that PR to update this domain.

## Authorized UI change

Owner requested easier customer navigation, a readable main logo, source verification, and then explicitly instructed application. This release applies the reviewed Korean-first wordmark and entry UI to the confirmed operating source. Account, pricing, payment, database, domain and backend configurations are unchanged.

The homepage adds four task shortcuts and an identity-free local draft. Preparing or copying a draft does not send a message or confirm a booking. The explicit Kakao link still leads to the pre-existing group room; privacy guidance is retained. The detailed scheduling form is preserved under expandable disclosure and #reserve deep links open it.

Logos are applied statically to existing home, catalog, lesson, FAQ, refund, login and signup headers. Dark and light SVG lettering is outlined; no external font request is needed. The Noto font license accompanies the SVGs. The H symbol is an original drawing.

The homepage script parses only developer-owned static template literals, with user input written through textarea.value/textContent. It adds no API calls, storage, analytics or automatic message sending. Mobile layout prioritizes service choices rather than the old large campaign image; regression expectations are updated for this requested behavior.

## Verification and release evidence

- Local JS syntax, diff, discount/knowledge and auth static checks.
- PR CI: security, mobile/desktop 320/375/390/768/1280 where applicable, existing chat/catalog/lesson/form regressions and new short-form/clipboard-fallback checks.
- Main release: existing Pages deployment, then official-domain verification of both hostnames and byte-for-byte logo/CSS/JS against the merged source.
- Do not claim official publication until deployment and live checks pass.
- Real Galaxy Chrome/Samsung Internet and actual customer message delivery remain NOT TESTED.

Rollback uses a normal revert of the release commit in this repository, retaining the same CNAME and hosting settings.
