# Family Space (مساحة الأسرة) — Browser QA & Verification Report (Max Mode 3D)

## 1. Automated Unit Tests (`src/domain/familySpaceCore.test.ts`)
- **Command**: `npx tsx --test src/domain/familySpaceCore.test.ts`
- **Status**: **10 / 10 PASS** (`0 failures`)
- **Coverage**:
  1. Legacy `family-space-v1` normalization, orphan detachment, and Max Mode state initialization (`parentAccounts.mother`, `parentAccounts.father`, `invitations`, `readNotificationIds`, `cart`).
  2. Child age stage classification (`0-2`, `2-5`, `5-8`) from Day 1 to 8 years.
  3. Country & currency formatting (`EG` -> `EGP`, `SA` -> `SAR`) without fake exchange rates.
  4. Dual Gregorian + Hijri (`Intl.DateTimeFormat`) date formatting.
  5. Cascading child deletion summary and linked record cleanup.
  6. Input validation for child profiles, wishes, and JSON backup imports.
  7. Nearest upcoming calendar event selection.
  8. Daily routine reminder time parsing (`parseTaskTimeMinutes`) and overdue/approaching classification (`getRoutineTaskReminder`).
  9. International phone number validation (`validatePhoneForCountry`) for Egypt (`+20`) and Saudi Arabia (`+966`).
  10. 3 Daily Parenting Notifications generator (`generateThreeDailyNotifications`) per parent (`morning`, `midday`, `evening`, and mandatory `security` alert).

## 2. Live Headless Chromium Verification (`playwright-cli`)
- **Desktop Viewport (`1440x900`) & Mobile Viewport (`390x844`)**:
  - **Console Errors / Page Errors**: `0 Errors, 0 Warnings`.
  - **Home Dashboard (`max3d-home-desktop.png`)**: Verified 3D Family Hero scene, Top Language Switcher (`#top-language-switcher`), 3D KPI cards, 3D Child Avatars (`عز` & `نور`), and Routine Reminders strip.
  - **Children 3D Profiles (`max3d-children.png`)**: Verified 3D gender/age/personality avatars, real photo upload preservation, and private parent-only health records.
  - **3 Daily Parenting Notifications (`max3d-notifications.png`)**: Verified separate Mother (`سارة`) and Father (`أحمد`) schedules, Morning/Midday/Evening cards, permanent Security alert, and Quiet Hours (`ساعات الهدوء`).
  - **Content, Medical & Interactive Media Hub (`max3d-media-hub.png`)**: Verified medical disclaimer, review badge, interactive Audio Story/Lullaby Player, 3D Video Player, and 3D Card Gallery.
  - **Interactive 3D Children's Games (`max3d-games.png`)**: Verified parent co-play approval toggle, child selector, 3D Memory Match, and 3D Shapes/Colors/Counting Studio.
  - **3D Store & Smart Shopping (`max3d-store.png`)**: Verified 3D product pedestals, collection filters, sorting, sponsored labeling, and Shopping Cart drawer.
  - **Family Identity & Invitations (`max3d-family-accounts.png`)**: Verified Mother & Father independent accounts (`+20`/`+966` + OTP `123456` + linked email) and child-scoped nursery/school invitations.
  - **Bottom International Settings (`max3d-settings-bottom.png` & `max3d-mobile-en.png`)**: Verified `#settings-international-bottom` at the bottom of the Settings page and clean responsive mobile layout in both Arabic (`RTL`) and English (`LTR`).
