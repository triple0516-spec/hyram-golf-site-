# HYRAM GOLF backend gate

Current status: **NOT TESTED / BLOCKED until a backend project is provisioned.**

## Reservation API contract
POST /api/reservations
Content-Type: application/json

Fields: service, customerName, preferredDate, preferredTime, contactMethod, phone, memo, privacyConsent.

Expected success: HTTP 201 with a server-generated reservation id.
Validation failure: HTTP 400/422.
Server/database failure: HTTP 5xx. Never report a reservation as accepted when persistence fails.

## Security gate
- Database credentials/service-role secrets must exist only server-side.
- Browser code must never contain service-role keys or PG secret keys.
- TLS required in production.
- Validate service/contact enum values, phone format, input lengths, and privacyConsent.
- Rate-limit the public endpoint and add abuse protection before launch.
- No public read/update/delete access to reservation records.

## PASS evidence required
1. Create a backend project and PostgreSQL database.
2. Apply db/schema.sql.
3. Configure server secrets outside Git.
4. Deploy POST /api/reservations.
5. Submit one synthetic reservation through the site.
6. Confirm HTTP 201 and the exact persisted database row.
7. Confirm invalid request is rejected.
8. Confirm anonymous clients cannot read reservation rows.
9. Record evidence without exposing customer PII or secrets.

Only after all nine checks pass may the reservation DB/server gate be marked PASS.
