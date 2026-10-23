# Family Space (مساحة الأسرة) — AI Handoff & Max Mode 3D Architecture Documentation

## 1. Core Product Promise & 6 Interconnected Pillars
**"كل حاجة لطفلك في مكان واحد — من أول يوم لحد 8 سنين"**

Family Space is a parent-managed family ecosystem built across **six interconnected pillars**:
1. **Family Operating System**: Child profiles (`0–8` years), 3D avatars + real uploaded photo support, daily routines with approaching/overdue visual reminders (`🔔 اقترب الموعد` / `⏰ تجاوز الموعد`), family calendar (Gregorian & Hijri), and wishes/savings goals.
2. **Parent, Child, Extended Family & Caregiver Collaboration**: Independent **Mother** and **Father** accounts with international phone validation (`+20` Egypt / `+966` Saudi Arabia), simulated OTP (`123456`), linked email verification, and child-scoped invitations (`pending`, `accepted`, `expired`, `cancelled`, `revoked`) for grandparents, uncles/aunts, nannies, nursery supervisors, and school teachers.
3. **Medical, Psychological & Educational Content Hub**: 10 core topics covering newborn care (`0–2`), preschool (`2–5`), and school transition (`5–8`), complete with medical disclaimer banners, review status badges (`مراجع علميًا`), and sponsored disclosure labels.
4. **Interactive Audio, Video & 3D Gallery Media**: Functional Web Audio API bedtime story/lullaby player (play/pause, seek, speed `0.75x–1.5x`, volume, transcript), 3D educational video player (play/pause, seek, mute, speed, captions `CC`), and 3D visual card gallery lightbox.
5. **Safe, Age-Appropriate Interactive 3D Children's Games**: Parent-supervised 3D educational games (**3D Memory & Vocabulary Match** and **3D Shapes, Colors & Counting Studio**) with parent co-play session approval and positive feedback.
6. **3D Commercial Ecosystem & Smart Shopping**: Search-first 3D store and service directory with collection filters (`الأكثر طلبًا`, `وصل حديثًا`, `عروض التوفير`), sorting, Product Detail Modal (variants, specifications, seller info), Shopping Cart drawer, demo shipping address, and simulated checkout confirmation.

---

## 2. 3D Asset Manifest (`/src/domain/assetManifest3D.ts` & `/src/components/ThreeDVisuals.tsx`)
Because AI image generation quota (`generate_image`) returned `RESOURCE_EXHAUSTED`, all 3D visual assets are rendered locally and deterministically using multi-layered 3D clay SVG lighting gradients (`radialGradient` specular highlights, ambient occlusion shadows, and rim lighting) paired with CSS 3D perspective scenes (`ThreeDInteractiveScene`):
- **`hero-family-3d-scene`**: 3D Family Command Center Hero Scene (Home Dashboard)
- **`child-3d-avatar-system`**: 3D Child Avatar System (`ThreeDChildAvatar`) differentiated by gender (`boy` / `girl`), age stage (`0-2`, `2-5`, `5-8`), and 6 personality/accessory themes (`astronaut`, `artist`, `scientist`, `athlete`, `reader`, `nature`), while preserving real uploaded child photos (`photoDataUrl`).
- **`navigation-3d-icon-family`**: 16 unified 3D clay icons (`ThreeDIcon`) across all navigation items, KPI cards, and badges.
- **`medical-wellness-3d-scene`**: 3D Medical & Psychological Reassurance Scene (Content Hub)
- **`commerce-podium-3d-scene`**: 3D Product & Educational Toy Podium Scene (Store & Games)

---

## 3. Functional vs. Simulated Boundaries (Honest Engineering Disclosure)
- **Fully Functional (Local Client State + `localStorage` `family-space-v1`)**:
  - Top Language Switcher (`#top-language-switcher`) on every page switching Arabic (`RTL`) and English (`LTR`).
  - Bottom International Settings (`#settings-international-bottom`) on the Settings page for Country (`EG`/`SA`), Calling Code (`+20`/`+966`), Currency (`EGP`/`SAR`), and Phone validation.
  - Child CRUD, 3D avatar customization, real photo upload (`FileReader` DataURL), and cascading delete confirmation.
  - Daily Routine CRUD + real-time approaching/overdue reminder badges and custom time simulator.
  - 3 Daily Parenting Notifications per parent (Morning, Midday, Evening + permanent Security alert) with per-parent preferences and Quiet Hours.
  - Interactive Audio Player (Web Audio API synthesis), Video Player, 3D Gallery, and 2 playable 3D Children's Games.
  - Shopping Cart, quantity controls, product variants, and JSON Backup/Restore.
- **Simulated (Requires Backend / Production Infrastructure)**:
  - SMS OTP delivery (`123456` demo code) and Email verification links.
  - Native mobile OS push notifications (`FCM` / `APNs`).
  - Live payment gateway processing and courier dispatch.
