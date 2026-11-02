# Nekbaar Home Dashboard — Content & Navigation Map

## Goal
The Home dashboard is the family's launchpad. Every actionable content block must lead to the next useful step, use the correct existing page route, and use real family/child data. This work is UI/content integration only; it does not authorize schema, RLS, production-data, or authentication changes.

## Home content map

| Home area | Purpose / source | Next action or destination | Completion rule |
|---|---|---|---|
| Personalized welcome | Active parent profile, city, current date | Family management, child profiles, routine, calendar, health, store | No invented parent or child identity |
| Parent wellbeing message | Time-aware supportive copy | Notifications center | Support messages remain separate from routine alerts |
| Family quick access | Main family workflows | `family`, `routine`, `calendar`, `children`, `medical`, `services`, `notifications`, `community`, `media`, `chat`, `assistant`, `wishes` | All routes must exist in PageId |
| Daily audio brief | Time-aware parenting guidance | Play / pause / replay / next tip in place | No autoplay; audio controls remain accessible |
| Section tools | Routine, calendar, child profiles, bedtime, cart | Existing page routes and callbacks | No duplicate or dead navigation |
| Family video preview | Internal reviewed video feed | `media` | Clear path to the complete media library |
| Practical family ideas | Three actionable editorial cards | `routine`, `children`, `medical` | Card CTA must match the advice |
| Child daily log | Sleep, meal, mood, care | Save to selected child's life record; open `children` | No fallback child IDs or false saved states |
| Daily parenting compass | Time-aware advice | Add a suggested task to `routine` | Child name comes from the selected real profile or generic copy |
| Child interests & activities | Interests, hobbies and sports from each profile | `children` and add activity to `routine` | Empty state routes to add/manage child profiles |
| Bedtime stories | Story generation and saved library | Real child profile, saved story, `routine` | No sample children, sample names, or false AI/save claims |
| Daily care essentials | Food, hydration log and sport | Save to child record, `medical`, or `routine` | Age-sensitive guidance; no invented targets |
| Parenting support center | Parent support, child emotion check-ins and situation guide | `notifications`, `children`, child record, `routine` | Non-diagnostic language and explicit save feedback |
| Learning games | Age-aware game entry cards | `games` | Empty state routes to child profiles |
| Visual parenting gallery | Five short educational cards | Daily parenting compass | Editorial cards remain clearly distinct from clinical advice |
| Store showcase | Catalog and six category shortcuts | `services` with the selected category | Category IDs must match catalog categories |

## Core route coverage
The Home quick-access grid covers the primary destinations: household management, routine, calendar, child profiles, health, store, notifications, community, media, chat, assistant, and wishes. The games destination remains available in the dedicated games section. Legal and account settings remain in the app-wide navigation rather than being duplicated as Home content.

## Current implementation checkpoints
- [x] Connect the Home quick-access grid to all primary family destinations.
- [x] Connect the Home video preview to the full media page.
- [x] Connect child daily log, child-interest and games empty states to child profiles.
- [x] Connect care essentials to the health record.
- [x] Connect parenting support to parent notifications and child profiles.
- [x] Connect the visual gallery to the daily parenting compass.
- [x] Remove unsupported synthetic wellness percentages from the child log card.
- [x] Keep age-based game suggestions generic until a real birth date exists.
- [x] Make story and game cards keyboard-accessible.
- [x] Replace the bedtime story library's hard-coded sample child selector with the real `state.kids` profiles.
- [ ] Validate every Home interaction on mobile RTL and English LTR.
- [x] Correct the story-generation service so child identity and age metadata come from the selected real profile; unknown birth dates remain explicitly unknown.
- [x] Consolidate story creation into one library flow, remove the duplicate Home generator, and show save success only after the save promise resolves.
- [ ] Run the final Home-focused regression, TypeScript, and production build checks.

## Work order — keep scope disciplined
1. Finish Home navigation and content-to-action wiring.
2. Verify empty states, no-child behavior, loading/error/success feedback, mobile layout, RTL and LTR.
3. Clean only the touched Home/story code: unused props/imports/state, duplicate handlers, stale sample content, and misleading copy. Preserve existing features.
4. Run tests, TypeScript, production build, and review the final diff.
5. Only after Home is complete, begin the separate backend roadmap: story persistence contract first, then child-life record consistency, then media/catalog integrations. No production migrations or RLS changes without explicit approval.
