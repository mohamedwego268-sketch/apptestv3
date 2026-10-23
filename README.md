# Family Space · مساحة الأسرة (3D-First Frontend Demo Release)

> **"كل حاجة لطفلك في مكان واحد — من أول يوم لحد 8 سنين"**  
> *Everything for your child in one place — from Day 1 to 8 years.*

**Family Space (`مساحة الأسرة`)** is a comprehensive, bilingual (**Arabic RTL & English LTR**), 3D-first family operating system, medical & child health hub, vertical reels & media studio, parents' community, permission-aware internal chat, AI parenting assistant, and local commerce platform designed for parents in **Egypt (`🇪🇬 EGP`)** and **Saudi Arabia (`🇸🇦 SAR`)**.

---

## ✨ Key Features in This Release

1. **Consistent Bilingual Typography & Responsive Design (`RTL` / `LTR`)**
   - Full Arabic (`dir="rtl"`) and English (`dir="ltr"`) support via the persistent top language switcher (`#top-language-switcher`).
   - Bidirectional (`ltr`) isolation and `tabular-nums` formatting on all phone numbers, prices, dates, times, and OTP codes so mixed Arabic/English text never breaks or clips.
   - Distinct visual personality per section (`Rose-Sky Sunset` Dashboard, `Clinical Emerald-Teal` Medical Hub, `Indigo-Violet` Reels Studio, `Coral-Amber` Parents' Community, `Royal Blue` Internal Chat, `Violet-Fuchsia` AI Assistant, and `Golden-Rose` Store).

2. **Reorganized Information Architecture**
   - **Dashboard (`home`)**: 3D interactive family hero, 4 KPI summary cards, nearest appointment, 3D child cards, and today's routine with live reminder badges.
   - **Children 3D (`children`)**: 3D character avatars (`Astronaut`, `Little Doctor`, `Creative Artist`, `Nature Explorer`, `Superhero`) + real photo upload preservation + cascade deletion preview.
   - **Daily Routine & Reminders (`routine`)**: Interactive task management with live visual reminder badges (`⚠️ تجاوز الموعد` Overdue, `⏰ اقترب الموعد` Approaching, `🕒 مجدول` Scheduled, `✓ مكتمل` Completed).
   - **Medical & Child Health Hub (`medical`)** *(Dedicated & separated from entertainment)*:
     - Local Doctors & Clinics Directory filtered by **Country & City** with instant appointment booking into the Family Calendar.
     - Child Vaccinations & Growth Records (`0–8 years`) with status tracking.
     - Peer-reviewed Medical & Psychological Guides.
   - **Media, Videos & Vertical Reels 9:16 (`media`)** *(Dedicated to video, reels & audio)*:
     - **Vertical Swipeable Reels (`9:16`)** with category filters, play/pause simulation, mute toggle, likes, saves, and specialist tips.
     - **16:9 Educational Video Library** & **Bedtime Audio Stories / Lullabies Studio**.
   - **Parents' Community (`community`)**:
     - Topic tabs (`Sleep`, `Nutrition`, `Behavior & Tantrums`, `Nurseries & Schools`, `Local Moms & Dads`), post composer, reactions (`Like`, `Helpful`), verified specialist replies, and live comment threads.
   - **Internal Chat & Messaging (`chat`)**:
     - Permission-aware messaging workspace with conversation list (`Co-Parent`, `Nursery Supervisor`, `Pediatric Clinic`, `Grandmother`, `Speech Specialist`), child-scope badges, quick reply chips, and simulated real-time responses.
   - **In-App AI Parenting Assistant (`assistant`)**:
     - Child-aware conversational assistant with quick prompt chips, structured 3-step action plans, and **1-click "Add to Daily Routine"** integration.
   - **3D Store, Cart & Local Services (`services`)**:
     - Products, nurseries, and pediatric services filtered by **Country (`EG`/`SA`)** and **City (`مدينتي`)** with dynamic currency (`EGP`/`SAR`) and simulated checkout.
   - **4-Step Registration, Login, Country & City Selection, Parent & Child Onboarding Wizard**:
     - Accessible anytime from the top header (`📍 City · Sign In & Setup`) or sidebar.
     - Step 1: Sign Up / Sign In + Simulated OTP (`123456`).
     - Step 2: Country (`🇪🇬 Egypt` / `🇸🇦 Saudi Arabia`) & **Dependent City Selection** with loading, search, and empty states.
     - Step 3: Parent Profile & Visual Theme (`Mother — Rose`, `Father — Aqua`, `High Contrast`).
     - Step 4: Child Profile & 3D Avatar Theme.

---

## 🚀 Quick Start & Local Development

### Prerequisites
- **Node.js** `>= 18.x`
- **npm** `>= 9.x`

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Unit Tests
```bash
npx tsx --test src/domain/familySpaceCore.test.ts
```

### 4. Build for Production / GitHub Pages
```bash
npm run build
```
The static production bundle is generated in `dist/`, and the standalone zero-build HTML prototype is also preserved at `public/prototype/index.html`.

---

## 🌐 Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In your GitHub repository, go to **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** (or deploy from the `dist` branch using `vite build`).
4. Because all core state is persisted in `localStorage` (`family-space-v1`) with relative/bundled SVG 3D assets, the entire frontend demo runs 100% client-side on GitHub Pages without requiring a backend server.

---

## 🔍 Real vs. Simulated Features in This Frontend Demo

| Feature | Status in Frontend Demo | Next-Phase Backend Target |
| :--- | :--- | :--- |
| **State Persistence (`family-space-v1`)** | **Real** (`localStorage` + JSON Export/Import) | Cloud SQL / Firestore sync |
| **Google Drive Backup & Vault** | **Real** (Google Identity Services OAuth 2.0 + Drive v3 API) | Multi-device token refresh |
| **Country -> Dependent City Filtering** | **Real** (Updates doctors, clinics, community & store) | Geo-indexed `/api/locations` |
| **Routine Reminders & Badges** | **Real** (Live clock + reference time presets) | Web Push / FCM notifications |
| **OTP Verification (`123456`)** | **Simulated** (Clearly labeled demo code `123456`) | Twilio / Firebase Phone Auth |
| **Internal Chat Replies** | **Simulated** (Auto-responder after 900ms) | WebSockets / Firestore real-time |
| **AI Parenting Assistant** | **Simulated** (Child-contextual local knowledge engine) | Server-side `/api/assistant` (`@google/genai`) |
| **Store Checkout & Doctor Booking** | **Simulated** (Creates local order / calendar event) | Stripe / Paymob / Tamara + Clinic Booking API |

See [`Family_Space_Project/BACKEND_INTEGRATION_BLUEPRINT.md`](./Family_Space_Project/BACKEND_INTEGRATION_BLUEPRINT.md) for the complete database schema and API endpoint specification for the backend phase.
