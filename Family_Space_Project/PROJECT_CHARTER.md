# Family Space — Project Charter

## Purpose
Build a scalable, parent-first family platform that starts with family and child life management, then expands into trusted content, services, and commerce.

## Approved baseline decisions
- Platform: responsive Web application (PWA readiness can be considered later).
- Initial market: Egypt.
- Business model: hybrid, phased — family operating system first, then content, services, and commerce.
- AI: external provider accessed only through a server-side integration layer; never expose provider secrets in the browser.
- Execution: solo builder supported by AI tools.
- Hosting/deployment: local files only unless the owner explicitly changes this instruction. Do not upload to GitHub, hosting platforms, or third-party workspaces.

## Non-negotiable architecture principles
1. Design for future expansion without implementing unnecessary complexity prematurely.
2. Keep modules cohesive and loosely coupled; define explicit interfaces between modules.
3. Separate UI, domain/business rules, data access, and external integrations.
4. Use versioned APIs and database migrations; avoid ad-hoc schema changes.
5. Model families, memberships, roles, and per-child/per-data-category grants explicitly.
6. Enforce authorization on the server, not only by hiding UI elements.
7. Protect children's and health data with least-privilege access, auditability, retention controls, and privacy-by-default sharing.
8. Isolate external vendors behind adapters (AI, payments, maps, messaging) to reduce lock-in.
9. Support localization from the start: Arabic/RTL, Egypt-first settings, configurable currency/time zone, and future markets.
10. Include tests, error states, accessibility, documentation, backup/restore planning, and observability as part of implementation.
11. Clearly label mock/demo data and never present it as verified real-world data.
12. Keep the current HTML prototype as a UX reference, not as the production architecture.

## Suggested first production architecture
- Frontend: React + TypeScript, responsive Arabic-first interface.
- Backend: modular monolith API (e.g. NestJS/Node.js or an equivalent maintainable stack); do not begin with microservices.
- Database: PostgreSQL with migrations and tenant/family isolation rules.
- Authentication: established identity solution; secure sessions/tokens and account recovery.
- File storage: private object storage abstraction when needed.
- AI: server-side adapter with provider abstraction, usage limits, safety rules, and no client-side API keys.
- Background jobs/notifications: add when required; start with the simplest reliable implementation.
- Operations: automated tests, structured logs, error monitoring, backups, and documented restore drills before production.

## MVP scope
1. Authentication and account lifecycle.
2. Family creation and memberships/invitations.
3. Child profiles and carefully scoped access.
4. Daily routines and task completion.
5. Family calendar and basic notifications.
6. Privacy/settings and data export/deletion flows.
7. Content foundation and a controlled external-AI assistant integration after core privacy controls exist.

## Deferred until core usage and safeguards are validated
- Full multi-vendor marketplace, payment capture, refunds, commissions and vendor settlement.
- Real appointment booking integrations.
- Advanced subscriptions/loyalty.
- Complex recommendation/personalization systems.

## Current assets
- `prototype/index.html`: local interactive HTML prototype; demo-only data and features.
- `docs/Prototype_Code.docx`: Word copy of the prototype source.
- `docs/Architecture_v1.docx`: initial architecture document.

## Definition of done for each feature
- Requirements and user journey documented.
- Permissions and privacy implications specified.
- Data model/API contract defined where applicable.
- Loading, empty, success, error, and unauthorized states handled.
- Automated tests added for important behavior and authorization.
- Documentation and migration notes updated.
- No production secrets or real sensitive child data in the repository.

## Change control
Record important decisions in `DECISIONS.md`. Update this charter when an approved baseline changes. Never deploy or upload files without explicit owner approval.
