# Family Space — Local Project Workspace

**Local-only. Not deployed or uploaded.** Keep this folder as the editable source of truth. Do not publish or transfer externally without explicit owner approval.

## Start here
1. `PROJECT_CHARTER.md` — scope and non-negotiable constraints.
2. `DECISIONS.md` — accepted decisions.
3. `PROJECT_STATUS.md` — current stage, completed artifacts, and next steps.
4. `AI_HANDOFF.md` — portable brief for continuing with another AI model.

## Project files
- `prototype/index.html` — local interactive HTML prototype (demo-only).
- `docs/Architecture_v1.docx` — editable Word architecture document.
- `docs/Prototype_Code.docx` — editable Word copy of prototype source.
- `planning/PRODUCT_REQUIREMENTS.md` — MVP user outcomes and scope.
- `planning/DOMAIN_MODEL.md` — draft entities, relationships and authorization invariants.
- `planning/PERMISSIONS_MATRIX_DRAFT.md` — draft roles and data access.
- `planning/RISK_REGISTER.md` — risks and alert protocol.
- `design/DESIGN_SYSTEM_v1.md` — initial visual direction and screen inventory.

## How to continue with any AI
Share this folder or the relevant files manually with the other model. Include `AI_HANDOFF.md`, `PROJECT_CHARTER.md`, `DECISIONS.md`, `PROJECT_STATUS.md`, and the exact task. Ask the model to return editable files and a change report. Do not give any model permission to publish/deploy unless the owner explicitly changes the local-only rule.

## Important prototype limitation
The HTML prototype is a UX demonstration. Browser localStorage is not secure multi-user storage and does not provide real authentication, server-side authorization, cross-device sync, production AI, or real booking/payment.

## Safe change workflow
- Back up the current folder before broad edits.
- Keep one canonical working copy and document version changes.
- After each task update `PROJECT_STATUS.md` and `DECISIONS.md` if decisions changed.
- Report tests that were actually run; never mark unrun tests as passed.

## Current working controls
- `planning/PROBLEM_SOLUTION_LOG.md`: known problems, mitigations, and verification gaps.
- `planning/IMPLEMENTATION_PLAN_v1.md`: implementation gates and task completion checklist.
- Keep the project local only. Do not upload or deploy unless the owner explicitly changes that rule.


## Latest local prototype update (2026-10-22)
- Added family calendar page: create, edit, delete, and date-filter events.
- Events may be associated with a child or the whole family.
- Calendar repeat selections are descriptive only; no automatic recurrence or notifications.
- See `planning/CALENDAR_SPEC_v1.md` and `planning/PROBLEM_SOLUTION_LOG.md`.
- All work remains local; no deployment or upload.

- Dashboard now shows the nearest upcoming calendar event (in-app only; no push notifications).
