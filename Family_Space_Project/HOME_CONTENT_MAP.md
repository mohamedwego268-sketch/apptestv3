# Nekbaar Home Dashboard — Product Content Map

## Product journey

The Home dashboard is the family's starting point. It should help a parent move through one clear journey:

**اعرف ← سجّل ← تابع ← افهم ← اتصرف**

Every card must answer three questions:
1. What does this help the family understand?
2. Which real family or child data does it use?
3. What is the next useful action, and where does that action lead?

This is a content and experience plan. It does not authorize database schema changes, RLS changes, production-data edits, or authentication changes.

## Six connected content tracks

| Track | Main purpose | Correct context | Existing destination / action | Current status |
|---|---|---|---|---|
| Medical & health | Health history, growth, allergies, vaccinations, appointments and care follow-up | Individual child | `medical`, `children`, child life record | Existing foundation; connect to age and child profile |
| Educational development | Age-aware learning, language, curiosity, school readiness, learning frustration and interests | Individual child | Child profile, learning content, stories and games | Existing content is spread across Home, stories and games; needs one clear learning path |
| Sports & physical activity | Movement, play, coordination, interests and age-appropriate activities | Individual child | Home activities, games and add-to-routine action | Existing activity suggestions; connect to child's real interests and saved routine |
| Psychological & emotional wellbeing | Parent support, child feelings, emotional history and practical parenting guidance | Parents at family level; feelings and history per child | Parenting support center, notifications, child life record | Strong foundation exists; household check-in currently isn't saved |
| Religious & ethical values | Everyday values, kindness, honesty, gratitude, respect, responsibility and age-appropriate spiritual habits | Family guidance with age-aware child examples | New editorial Home content track; optional routine action | Missing as a distinct, coherent track; add without assuming a family's beliefs or imposing one practice |
| Daily life & healthy habits | Sleep, food, hydration, hygiene, routines, family coordination and everyday records | Family routines plus individual child records | `routine`, `calendar`, `children`, child life record | Existing foundation; unify actions and avoid duplicate quick logs |

## Family level vs. individual child level

### Family-level information
- Parent wellbeing and support for mother and father.
- Household energy and shared responsibility coordination.
- Family routines, calendar, reminders and shared tasks.
- Shared values, family rituals and general guidance.

### Individual child information
- Age and developmental stage.
- Emotional check-ins and the child's own emotional history.
- Health and growth records.
- Learning, interests, hobbies, sports and activities.
- Sleep, food, hydration and daily-life records.

Never attach a family-level reflection to a child's private record. Never use one child's age, mood, interests or history to generate another child's recommendation. A child-specific action must identify the selected child before it can save.

## Existing Home areas and their intended role

| Home area | Role in the journey | Next action / destination | Review rule |
|---|---|---|---|
| Personalized welcome | Establish active parent, family location and the day's context | Family management, child profiles, routine, calendar or health | Use real account data; never invent a parent or child |
| Parent wellbeing message | A short, non-clinical supportive moment | Dedicated parent support / notifications | Keep separate from task reminders |
| Family quick access | Entry to primary family workflows | `family`, `routine`, `calendar`, `children`, `medical`, `services`, `notifications`, `community`, `media`, `chat`, `assistant`, `wishes` | Avoid duplicating the app's primary navigation |
| Daily parenting compass | Time-aware guidance with a practical next step | Read the current guidance aloud or add its action to the family routine | Uses device speech synthesis; do not imply a recorded presenter or uploaded audio |
| Section tools | Fast access to routine, calendar, children, bedtime and store | Existing page routes and callbacks | Keep one source of navigation |
| Family video preview | A preview of the real internal video feed | `media` | Only show available/reviewed media; no fake playback |
| Practical family ideas | Small actions that can be tried today | Matching health, child profile or routine destination | CTA must match the advice |
| Child daily log | Sleep, meal, mood and care check-ins | Save against selected child; open child profile | Never show success unless persistence succeeds |
| Child interests & activities | Discover and nurture real interests | `children` and add activity to `routine` | Empty state should help create or complete a child profile |
| Bedtime stories | Age- and interest-aware stories | Selected real child, story library and routine | No sample identities or false AI/save claims |
| Daily care essentials | Meals, hydration, movement and daily care | Save to child record, `medical` or `routine` as appropriate | No invented health targets; age-aware guidance |
| Parenting support center | Parent wellbeing, child emotional check-in and six parenting situations | Parent support, child record and family routine | Preserve seven emotional states and all six scenarios |
| Learning games | Age-aware play and learning | `games` via the Home learning track | Keep one clear entry point; do not add a second Home teaser that repeats the same destination |
| Visual parenting gallery | Short editorial guidance | Daily parenting compass or relevant content | Clearly distinguish general guidance from clinical advice |
| Store showcase | Family products and services | `services` with selected category | Category IDs must match the catalog |

## Psychological and parenting support requirements

- Preserve the existing three daily support messages for mothers and three for fathers.
- Keep parent support messages independent from routine notifications and reminder preferences.
- Parent wellbeing should cover pressure, exhaustion, rest, asking for help, responsibility sharing and family coordination.
- Keep the household wellbeing reflection separate from every child's emotional record.
- Preserve all seven existing child mood IDs, labels, responses and their current child-specific save behavior.
- Preserve all six existing parenting scenarios: anger/outbursts, screen-time transitions, nursery/school anxiety, sibling conflict, bedtime resistance and learning frustration.
- Each scenario must retain practical steps, suggested dialogue, things to avoid and when to seek professional support.
- Use supportive, non-diagnostic language. Do not present the app as a replacement for clinical or emergency care.

## Verified findings from the current main branch

- `HomeDashboardSection.tsx` is a large, single component (about 2,487 lines) containing navigation, content data, state and many interactions. Improve it incrementally; do not rewrite it wholesale.
- The current Home quick-access grid contains 12 destinations. It is useful, but must be checked against the global navigation so the same choices are not repeated without a clear reason.
- `ParentingSupportCenter.tsx` already contains seven child emotional states and six parenting scenarios.
- Household energy and responsibility-sharing choices are currently component-local state. The UI explicitly says these choices are not saved or sent. Do not silently claim they are recorded.
- A child emotional check-in is saved through `createChildLifeRecord` against that child's remote ID. It correctly refuses to claim success when the child profile is not linked to the family database or the save fails.
- `NotificationsCenterSection.tsx` renders parent support messages separately from routine notifications.
- `generateThreeDailyNotifications` contains three support messages for mother and three for father, in addition to routine reminders.
- The Home daily audio brief uses the device speech engine; it is not a real uploaded audio episode.
- The official website is already present in the canonical metadata and contact page as `https://www.nekbaar.com/`. Keep it consistent; do not add competing domains.

## Scope decisions

- Keep existing valuable features and integrations, but do not preserve duplicate, misleading, dead or out-of-scope UI just because it exists.
- Do not introduce a new route when an existing page or a clear in-page content section is sufficient.
- The religious and ethical values track should be editorial and age-aware, culturally respectful and non-prescriptive. Do not assume a family's religion or beliefs.
- Keep mock/demo content clearly identified and out of personalized recommendations. Never use fake family data to fill a real user's dashboard.
- No production schema, RLS, authentication, or data migrations in this content phase.

## Staged delivery and acceptance

### Stage 1 — Content map and audit
- [x] Inspect current Home dashboard, parenting support, notifications, child profile shape and child-life save path.
- [x] Separate existing functionality from missing tracks and unsaved UI state.
- [x] Define the family-vs-child data boundary.
- [x] Record the current content/navigation map here.

### Stage 2 — Home information architecture
- [x] Arrange the Home around the family journey, not a long collection of unrelated accordions; the three journey groups now organize daily child follow-up, support/learning/growth, and family ideas/resources.
- [x] Make the six content tracks discoverable without duplicating global navigation.
- [x] Give each section one clear primary action and a useful secondary action only when needed; the six track cards and the consolidated sections now lead to existing, relevant actions.
- [x] Add the missing religious and ethical values track with respectful, age-aware content.
- [x] Keep parent support distinct from child emotional wellbeing and routine reminders.

### Stage 3 — Content and interaction completion
- [x] Connect educational, sports, health, emotional, values and daily-life tracks to age-aware child or family context and their correct destinations.
- [x] Keep child selection synchronized between Home and the parenting support center; child-specific records target the selected child's remote profile.
- [x] Add per-child duplicate-write protection, loading states, and accurate success/error feedback to Home sleep, meal, care, hydration and sports logs; preserve the mood check-in's own save/error state.
- [x] Keep household reflection explicitly temporary and clearly state that answers are not saved or sent.
- [x] Verify story personalization uses the selected child's real profile; video feed queries only approved public internal assets; daily tip uses device speech synthesis with no fake recording duration.

### Stage 4 — Cleanup and UX quality
- [x] Remove the duplicate 12-item Home shortcut grid after confirming destinations remain available in global navigation.
- [x] Remove arbitrary mood cycling and simulated audio waveform/timer; clean stale podcast naming and extract learning/values content into focused components.
- [x] Apply RTL/LTR direction and responsive layouts to new track sections; use 44px minimum touch targets for new learning, values and parent-support actions, with visible keyboard focus.
- [x] Keep the official slogan unchanged: **مساحة تجمعنا.. وبحبهم نكبر**.

### Stage 5 — Verification
- [x] Run Home-focused regression tests (36/36 passed).
- [x] Run TypeScript checks and production build.
- [x] Review the final diff; all changes are committed to `main` only.
- [x] Record the remaining deployment and Supabase preview blockers clearly.

## Stage 2 implementation log

- [x] Added a six-track Home navigator for health, learning, movement, emotional wellbeing, values and daily life.
- [x] Replaced the duplicated 12-item Home quick-access grid; all existing destinations remain in the app-wide navigation and mobile bottom navigation.
- [x] Added age-aware values activities for 0–2, 2–5 and 5–8 years, with actions that can be added to the family routine.
- [x] Kept spiritual and religious habits explicitly family-selected and non-prescriptive.
- [x] Connected track cards to existing pages or the correct in-page accordion sections.
- [x] Automated Checks on commit `1d9e285`: unit/security contract tests, TypeScript verification and production build all passed.
- [ ] Supabase Preview check is currently blocked by the repository's remote/local migration-version mismatch (`Remote migration versions not found in local migrations directory`). No migrations or production database changes were made in this stage.

## Stage 2–3 implementation progress

- [x] Added a dedicated learning and curiosity section with age-aware activities for 0–2, 2–5, 5–8 and unknown-age profiles.
- [x] Each learning activity can be added to the selected child's family routine; the section links to the child's interests/profile and existing learning games.
- [x] Replaced arbitrary mood-emoji cycling in the Home quick log with a direct path to the full seven-state emotional check-in.
- [x] The Home-selected child is passed into ParentingSupportCenter, and child selection changes sync back to Home; the existing save path writes to that child's `emotional_social` record.
- [x] The parent wellbeing card now has separate direct links to the parenting support center and parent support messages.
- [x] The family journey is visible above the six tracks, and the movement track opens the exact sports activity card rather than a generic section.
- [x] Home sleep, meal, care, hydration and sports actions now prevent duplicate in-flight saves and show loading feedback.
- [x] Increased new learning and values actions to 44px minimum touch targets.
- [x] Consolidated the duplicate time-aware daily tip into the Daily Parenting Compass. The compass now owns the single read-aloud action and routine CTA; device speech synthesis remains, with no recorded-audio claim.
- [x] Added regression tests for learning age stages, values track, selected-child emotional check-in, and honest read-aloud behavior.
- [x] Complete the Home content information architecture around the six connected tracks and the family journey; retain useful sections and global navigation.
- [ ] Final browser screenshot/interaction review remains pending. The latest production deployment for `main` (`56850cd`) is READY; the connected browser is currently unavailable, so use the existing deployment for visual review when browser access is restored rather than creating another deployment.
- [x] Review core Home child-log persistence and loading/error behavior; household reflection remains explicitly unsaved and no success is shown before persistence.
- [x] Latest verified code commit `46b254b` passed CI: 37/37 unit and security tests, TypeScript verification and production build; production build retains a non-blocking large JavaScript chunk warning.
- [ ] Supabase Preview remains blocked by the existing remote/local migration-version mismatch (`Remote migration versions not found in local migrations directory`). No database migrations or production data changes were made.
- [ ] Vercel's free deployment API quota is exhausted for the current 24-hour window (`api-deployments-free-per-day`). The latest READY production deployment is the visually equivalent Home build at commit `375a555`; final interaction polish committed after it is in `main` and passes CI, but a fresh deployment must wait for the quota reset.

## Execution order

Finish the Home content map and experience before switching to unrelated store or backend work. Only make backend changes when required for a completed Home interaction and only within the approved existing data contract. No production migrations or RLS changes without explicit approval.


## Expert content network — product and publishing rules

The expert network is an editorial layer across the six existing tracks, not a seventh track and not a duplicate navigation system.

- The six-track Home navigator routes into existing health, learning, movement/daily care, emotional support and values destinations. The former specialist-review panel was removed from the public Home because it contained only a preparation notice and repeated the same six track labels; keep specialist discovery hidden until real reviewed content is ready.
- Specialist discovery is not currently rendered on Home. When real reviewed content is ready, publish it with verified contributor identity and credentials; never invent expert names, credentials, ratings, articles, videos, consultations or appointment availability.
- A contributor profile may show a verified-expert badge only after an administrator has reviewed identity, current credentials, professional scope and evidence. Unverified contributors must be labelled accurately.
- Every published item carries: stable content ID, title, summary, author/contributor ID, specialty, track, child age band, audience (parent/family/child), format, publication availability state, publication/review state, reviewer, review date, source references, safety note, related content IDs and next action.
- Supported formats: articles, short videos, real audio, Q&A, practical family activities and visual guides. Never simulate media playback or imply an expert recorded audio where none exists.
- Health, psychological, developmental and safety content requires editorial/specialist review before publication. General education is not diagnosis or a substitute for professional or emergency care.
- Family data and child records are never shared with experts by default. Any future referral or question workflow requires explicit, specific guardian consent and a minimal-data handoff.
- The Home discovery cards route to existing tracks until a real, reviewed expert catalogue exists. The new section does not create fake experts or a non-functional booking flow.

## Feature release and public communication boundaries

- Do not frame future features around commercial access or pricing.
- Do not publish pricing, billing, trial, or payment-provider claims.
- A feature that is not ready must be labelled neutrally as **“قريبًا”** / **“Coming soon”**, without suggesting a commercial condition.
- Do not collect photos or other sensitive child information for a feature before its launch and consent flow are ready.
- Future feature release requires product, privacy, safety, editorial and technical readiness review before public availability.
- Keep access and release decisions out of public-facing copy unless the product owner explicitly approves a clear, accurate announcement.

## Home content work — latest implementation checkpoint

- [x] Added explicit next-step cues to each of the six Home tracks: health record, age-fit learning activity, movement activity, child emotional check-in, values habit and daily routine.
- [x] Prioritized three practical family actions ahead of passive video browsing, with direct actions for bedtime routine, child emotional check-in and health records.
- [x] Clarified the video-library label as content available inside Nekbaar (not an admin-only area) and corrected CTA arrow direction in Arabic and English.
- [x] Clarified the specialist-review panel heading so it does not imply that a verified expert catalogue or reviewed content is already live.
- [x] Kept each cue attached to its existing verified destination; no new duplicate routes or data flows were introduced.

- [x] Added an expert-network discovery layer across the existing six tracks without adding a seventh track or inventing verified experts.
- [x] Added a neutral “قريبًا” teaser for future illustrated stories; it requests no photo and does not enable generation.
- [x] Kept the existing text-based bedtime story library separate from the future photo-based illustrated story feature.

- [x] Removed the static specialist-review placeholder from the public Home while retaining the specialist publishing and safety requirements in this internal map.
- [x] Corrected bedtime-story copy: the current story builder uses a deterministic template with the child’s name, chosen theme and value; it is not labelled as AI-generated. Removed the unrelated BPM display and corrected English story line breaks.
- [x] Removed the separate Home games teaser: its age-labelled cards all opened the same Games page and duplicated the Games link already available inside the age-aware Learning track. The dedicated Games page and its global navigation remain unchanged.
- [x] Complete the next Home information-hierarchy pass: organize the page into family-journey groups and remove the empty specialist-discovery placeholder from the public Home.
- [x] Removed the duplicate Home daily-tip content/card and its obsolete accordion state; preserved read-aloud functionality inside the Daily Parenting Compass.
- [x] Moved practical family ideas and the approved video preview under the “Ideas and family resources” group so the three Home journey groups match the actual content order.
- [x] Replaced the in-memory-only child “cheer” counter (which reset on refresh and was not shared or saved) with a real child-profile action to update interests; retained the routine action for activities.
- [x] Renamed the interests section to describe what it actually contains; it no longer implies a developmental-milestone tracker.
- [x] Removed the now-empty audio toggle from the welcome header and simplified the tools drawer after consolidation.
- [ ] Complete a repository-wide unused/duplicate-code audit and remove only code with verified zero references and no runtime, migration, test or historical dependency. A targeted review of `HomeDashboardSection.tsx` imports and all 11 component-local state pairs found no unused imports or state; no speculative deletion was made.
- [x] Verify the latest Home consolidation code with CI (37/37 unit/security tests, TypeScript verification and production build passed on `c444bf6`; the subsequent `56850cd` commit only updates this content map). The latest Vercel production deployment for `56850cd` is READY.
- [ ] Complete browser-level RTL/LTR, mobile and keyboard interaction review when a preview deployment is available.


### Public messaging boundary — illustrated stories

- The public Home teaser must use only the neutral label **“قريبًا”** / **“Coming soon”**.
- Do not include commercial-access or pricing language in the illustrated-stories teaser or any other public-facing copy for this feature.
- Do not imply the feature is available today and do not request a child photo before launch.
- Commercial entitlement planning, if retained in internal product documentation, must never leak into customer-facing copy until an explicit product decision is made.


## Daily guidance consolidation — 2026-11-03

- [x] Removed the separate morning/afternoon/evening read-aloud card because its guidance substantially repeated the Daily Parenting Compass.
- [x] Kept the time-aware Compass as the single source of daily guidance, including its child-contextual advice, optional routine action and device read-aloud control.
- [x] Removed obsolete audio-card state, data and welcome-header toggle; the tools drawer no longer reserves an empty grid for the removed control.
- [x] Run and verify CI for the consolidation commits: 37/37 unit/security tests, TypeScript verification and production build passed on `c444bf6`; later `56850cd` contains documentation only.
- [ ] Complete browser-level RTL/LTR, mobile and keyboard interaction review using the existing READY production deployment when the connected browser is available. The current browser connection is unavailable; no new deployment is authorized or required for this review.


- [x] Grouped practical family ideas and the available video preview beneath the final Home journey heading; the three section headings now follow the content they introduce.
- [x] Removed the temporary, local-only cheer counter from child interest cards and replaced it with a direct profile update action.
- [x] Clarified the child interests section title to avoid implying that milestones are being tracked.


- [x] Updated the read-aloud regression contract to assert the Daily Parenting Compass control and its explicit device-voice label.
- [x] Latest Home consolidation CI on commit `c444bf6`: 37/37 unit/security tests passed, TypeScript verification passed and production build passed.
