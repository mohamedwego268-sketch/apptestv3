# Architecture Decision Log

## ADR-001 — Initial product direction
- Status: Accepted
- Decision: Build a parent-first family operating system, expanding gradually into content, services, and commerce.
- Reason: Prove recurring family value before investing in complex marketplace operations.

## ADR-002 — Initial platform and market
- Status: Accepted
- Decision: Responsive Web first; Egypt is the initial market.
- Future consideration: PWA installation and additional markets after validating requirements.

## ADR-003 — Solo execution strategy
- Status: Accepted
- Decision: Use a modular monolith for the first production backend rather than microservices.
- Reason: Lower operational burden for one builder while preserving clear module boundaries.

## ADR-004 — External AI integration
- Status: Accepted
- Decision: AI provider calls must go through a server-side adapter; API keys must never be embedded in frontend code.

## ADR-005 — Local-only work
- Status: Accepted
- Decision: Keep source files and project artifacts local. No upload, hosting, GitHub publication, or third-party workspace transfer without explicit approval.

## ADR-006 — Privacy by default
- Status: Accepted
- Decision: Family membership does not imply blanket access to all child data. Health and sensitive records require explicit scoped authorization.
