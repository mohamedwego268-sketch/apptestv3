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

## ADR-007 — Separate household management from child profiles
- Status: Accepted
- Decision: Treat the household as one management domain and every child as an independently managed profile. Shared household records (calendar events, shopping, meals, budgets, and chores) remain household-owned; child-specific health, education, sports, emotional, faith/value, and development records remain child-owned.
- Integration rule: Link shared events or expenses to a child only when relevant; do not duplicate records or merge child histories. The family home dashboard may summarize both domains while keeping their detailed workspaces separate.
- Privacy rule: Child-specific records remain scoped to the authorized child and caregiver permissions.

## ADR-008 — Parent wellbeing and psychosocial education are foundational
- Status: Accepted
- Decision: Make parent emotional support and practical parenting guidance core product capabilities, not secondary content. The notification center must always include supportive, non-judgmental messages for the active parent, independently of optional routine reminders.
- Safety rule: Support content is educational and encouraging, never a mental-health diagnosis or a substitute for professional care. Provide pathways to qualified support when appropriate; do not shame parents or imply that a difficult day is parental failure.

## ADR-009 — Expert-led content and trusted partnerships
- Status: Accepted
- Decision: Build a partner ecosystem with child-development and parenting centers, psychological support providers, qualified specialists, and vetted educational content creators.
- Governance: Verify partner identity and relevant qualifications; review clinical/psychological claims before publication; label sponsored content; disclose commercial relationships; moderate community content; and never share child or family records with partners without explicit, scoped family consent.
- Product direction: Partner contributions should enrich reviewed learning resources, workshops, referrals, and family programs without allowing partners to edit a child's private record or present promotional advice as clinical guidance.
