# Family Space — Design System v1.1

## Goal
Keep visual decisions separate from product behavior so colors, typography, icons, backgrounds, spacing, and component shape can evolve without rewriting features or changing stored data.

## Current implementation
The prototype remains a single portable HTML file. Its CSS starts with a clearly marked `DESIGN TOKENS` block in `prototype/index.html`. Existing component CSS uses compatibility aliases (`--bg`, `--card`, `--ink`, `--muted`, `--line`, `--accent`, `--soft`) so the migration can be incremental.

## Token groups
- Surfaces: `--color-page`, `--color-surface`, `--color-border`
- Text: `--color-text`, `--color-muted`
- Brand and states: `--color-accent`, `--color-accent-contrast`, `--color-accent-soft`, `--color-rose`, `--color-aqua`, `--color-lavender`, `--color-notice`
- Background art: `--color-hero-start`, `--color-hero-mid`, `--color-hero-end`
- Typography: `--font-ui`, `--font-size-base`, `--line-height-base`
- Shape and spacing: `--radius-card`, `--radius-control`, `--radius-small`, `--space-1` … `--space-5`

## Safe change rules
1. Change a token first; avoid find/replace of individual hex colors across the whole app.
2. Do not use a gender or parent role as a permission rule. Role color is cosmetic only. A child profile's accent is a separate visual setting.
3. Icons should use one consistent icon set in the production UI; current emoji are prototype placeholders and may render differently by device. Replace them through a central icon mapping/component, not scattered string edits.
4. User-facing wording should be centralized before production localization. Never use visible text as a data key or API identifier.
5. Preserve semantic HTML, visible focus, readable contrast, and reduced-motion/accessibility needs when changing visuals.
6. Validate at mobile and desktop widths after visual changes. Run JavaScript syntax checks and functional smoke tests for navigation, child CRUD, task CRUD, event CRUD, local save/export, and theme selection.
7. Never treat CSS/theme settings as access control. Sensitive child data must be protected by server-side authorization in production.

## Current themes
- `mom`: soft rose accent.
- `dad`: soft aqua accent.
- `high-contrast`: defined as a starter token set; a UI toggle is not yet exposed.

## Known limitation
Some prototype components still contain inline styles and literal colors. Tokenization is incremental, not yet complete. Search for hex colors in `prototype/index.html` before a full rebrand. Do not claim all visual values are centralized yet.

### Parent role palettes — 2026-10-22 update
- Parent role is controlled by `html[data-theme="mom"]` or `html[data-theme="dad"]`.
- Role-level tokens now include accent/contrast, soft accent, hero gradient, control-muted surface, icon tint, art gradient, task checkbox accent, mobile nav surface, and role badge foreground/background.
- Use `.role-tag` for labels whose color describes the active parent role. Do not use `.rose` or `.aqua` for role labels because those classes are intended to remain fixed semantic colors.
- Avoid inline `style` colors for role-dependent controls; add a semantic class or token instead.
- Child-specific colors remain independent from the parent role, as intended.
