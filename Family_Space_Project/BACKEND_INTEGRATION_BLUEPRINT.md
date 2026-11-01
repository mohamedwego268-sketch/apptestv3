# Family Space (`مساحة الأسرة`) — Next-Phase Backend & Database Integration Blueprint

This document maps every frontend module in the **Family Space** demo release to its production backend endpoints, database tables, and real-time services for the next phase of engineering.

---

## 1. User Authentication, Phone OTP & Co-Parent Linking
- **Frontend Touchpoints**:
  - `src/components/OnboardingFlowModal.tsx` (Step 1: Register / Login + OTP `123456`)
  - `src/components/FamilyPermissionsSection.tsx` (Dual-parent verification & caregiver invitations)
  - `src/App.tsx` (`#settings-international-bottom` verified phone change)
- **Production Backend Target**:
  - `POST /api/auth/register` & `POST /api/auth/login` (JWT / HttpOnly session cookies)
  - `POST /api/auth/otp/send` & `POST /api/auth/otp/verify` (Twilio Verify / Firebase Phone Auth for `+20` and `+966`)
  - **Database Tables**: `users`, `parent_accounts`, `otp_verifications`, `family_invitations`

## 2. Country, Dependent City & Localization Database
- **Frontend Touchpoints**:
  - `src/domain/familySpaceCore.ts` (`COUNTRY_CITIES_MAP`, `CountryCode`, `CityOption`)
  - `src/components/OnboardingFlowModal.tsx` (Step 2: Country -> Dependent City selector)
  - `src/App.tsx` (`#settingsCountry`, `#settingsCity`)
- **Production Backend Target**:
  - `GET /api/locations/countries` -> returns supported countries (`EG`, `SA`, calling codes, default currencies)
  - `GET /api/locations/cities?country=EG` -> returns localized cities/governorates with coordinates and service coverage flags
  - **Database Tables**: `countries`, `cities`, `service_zones`

## 3. Child Profiles, 3D Avatar Config & Granular Permissions
- **Frontend Touchpoints**:
  - `src/App.tsx` (Child CRUD, 3D avatar theme selector, real photo upload, cascade deletion preview)
  - `src/components/FamilyPermissionsSection.tsx` (12-permission matrix per caregiver + Dispute Freeze mode)
- **Production Backend Target**:
  - `GET / POST / PATCH / DELETE /api/children`
  - `PUT /api/family-members/:id/permissions` (RBAC middleware enforcing child-scoped access and Dispute Freeze locks)
  - **Database Tables**: `children`, `child_growth_logs`, `family_members`, `member_child_permissions`

## 4. Daily Routine, Tasks, Reminders & Family Calendar
- **Frontend Touchpoints**:
  - `src/App.tsx` (`RoutineTask`, `CalendarEvent`, `getRoutineTaskReminder`)
  - `src/components/NotificationsCenterSection.tsx` (3 daily scheduled notifications + quiet hours)
- **Production Backend Target**:
  - `GET / POST / PATCH / DELETE /api/routines/tasks`
  - `GET / POST / PATCH / DELETE /api/calendar/events`
  - Cron / Cloud Scheduler worker dispatching Web Push / FCM notifications at each parent's configured Morning, Midday, and Evening slots (respecting `quietHoursStart`–`quietHoursEnd`).
  - **Database Tables**: `routine_tasks`, `task_completions`, `calendar_events`, `notification_logs`

## 5. Medical Records, Vaccinations & Doctor Appointment Booking
- **Frontend Touchpoints**:
  - `src/components/MedicalHealthSection.tsx` (City-filtered doctors & clinics, booking modal, child vaccination & growth records, medical articles)
- **Production Backend Target**:
  - `GET /api/medical/doctors?country=EG&city=القاهرة&specialty=pediatrics`
  - `POST /api/medical/appointments` (Books clinic/telehealth slot and automatically inserts a linked `calendar_events` row)
  - `GET / PATCH /api/children/:id/vaccinations`
  - **Database Tables**: `doctors`, `doctor_time_slots`, `medical_appointments`, `child_vaccinations`

## 6. Parents' Community Posts, Reactions & Specialist Replies
- **Frontend Touchpoints**:
  - `src/components/ParentsCommunitySection.tsx` (Topic filtering, post composer, `Like`/`Helpful` counters, comments)
- **Production Backend Target**:
  - `GET / POST /api/community/posts?country=EG&topic=sleep`
  - `POST /api/community/posts/:id/comments`
  - `POST /api/community/posts/:id/reactions`
  - Moderation pipeline + verified badge check for pediatricians/specialists.
  - **Database Tables**: `community_posts`, `community_comments`, `community_reactions`

## 7. Real-Time Internal Chat & Caregiver Messaging
- **Frontend Touchpoints**:
  - `src/components/InternalChatSection.tsx` (Conversation list, child-scope badges, message thread, quick reply chips)
- **Production Backend Target**:
  - WebSocket (`Socket.IO`) or Firebase Firestore real-time listeners on `/conversations/{conversationId}/messages`.
  - Permission check verifying that a nursery supervisor or teacher can only message threads scoped to their `assignedKidIds`.
  - **Database Tables**: `chat_conversations`, `chat_participants`, `chat_messages`

## 8. In-App AI Parenting Assistant (`@google/genai`)
- **Frontend Touchpoints**:
  - `src/components/AiAssistantSection.tsx` (Child context selector, prompt chips, structured action cards, "Add to Routine")
- **Production Backend Target**:
  - `POST /api/assistant/chat` calling `@google/genai` (`gemini-2.5-flash`) with system instructions grounded in the selected child's age stage (`0-2`, `2-5`, `5-8`), medical disclaimers, and structured JSON output for `actionItems` and `suggestedRoutineTask`.
  - **Database Tables**: `ai_assistant_threads`, `ai_assistant_messages`

## 9. Media, Videos, Vertical Reels (`9:16`) & Audio Streaming
- **Frontend Touchpoints**:
  - `src/components/MediaPlatformSection.tsx` (Vertical swipeable `9:16` Reels viewer, `16:9` videos, bedtime audio stories)
- **Production Backend Target**:
  - Cloud Storage + CDN / HLS adaptive streaming (`m3u8`) for vertical reels and bedtime audio tracks.
  - `POST /api/media/:id/engagement` (persisting user likes, saves, and watch progress).
  - **Database Tables**: `media_assets`, `reels_feed`, `user_saved_media`

## 10. E-Commerce Catalog, Shopping Cart & Local Payment Gateways
- **Frontend Touchpoints**:
  - `src/components/CommercialEcosystemSection.tsx` (City-filtered products/services, cart drawer, shipping address, simulated checkout)
- **Production Backend Target**:
  - `GET /api/commerce/catalog?country=EG&city=القاهرة`
  - `POST /api/commerce/orders`
  - Payment gateway integration: **Paymob / Fawry** for Egypt (`EGP`) and **Moyasar / Tamara / Tabby** for Saudi Arabia (`SAR`).
  - **Database Tables**: `products`, `service_providers`, `carts`, `orders`, `order_items`, `payments`
