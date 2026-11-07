/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DEMO_OTP_CODE,
  DEFAULT_SEED,
  normalizeAppData,
  FamilySpaceState,
  ChildProfile,
  RoutineTask,
  CalendarEvent,
  WishItem,
  FamilyMember,
  MediaContentItem,
  CommercialCatalogItem,
  DemoOrder,
  DemoServiceBooking,
  MEDIA_CONTENT_CATALOG,
  COMMERCIAL_CATALOG,
  ParentThemeRole,
  CountryCode,
  LanguageCode,
  CurrencyCode,
  CalendarDisplayMode,
  TaskCadence,
  dateLocalISO,
  convertCatalogPrice,
  getCountryDialCode,
  getCountryTimezone,
  getDefaultCityForCountry,
  getSuggestedCurrencyForCountry,
  isSupportedCountryCode,
  resolveCountryCode,
  formatGregorianAndHijri,
  getChildDeletionSummary,
  deleteChildCascade,
  getNearestUpcomingEvent,
  validateChildInput,
  validateWishInput,
  validateImportedJson,
  getDefaultPermissions,
  getRoutineTaskReminder,
  getRoutineRemindersSummary,
  TaskReminderInfo,
  generateThreeDailyNotifications,
  validatePhoneForCountry,
  COUNTRY_CITIES_MAP,
  resolveCityRegionId,
  resolveColorMode,
  SKELETON_LOAD_DURATION_MS,
  shouldTriggerSkeletonForTab,
  findNearestCityByCoords,
  getParentProfileThemeSpec,
  sanitizeUserText,
  isTaskVisibleForParentSession,
  VoiceVaultMoment,
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_CHILD_PHOTO_BYTES,
  validateAndSanitizeImageDataUrl,
  ChildColorThemeId,
  isValidChildColorTheme,
  getChildVisualIdentitySpec,
  isTaskCompletedOnDate,
  toggleTaskCompletionForDate,
  refreshTasksForCurrentDate,
} from './domain/familySpaceCore';
import { AvatarAccessoryTheme } from './domain/assetManifest3D';
import { createChildLifeRecord, type ChildLifeRecordType } from './services/childLifeRecordService';
import { t } from './domain/i18n';
import {
  createEmptyFamilySpaceState,
  loadFamilySpaceStateForFamily,
  saveFamilySpaceStateForFamily,
  exportFamilySpaceJsonBackup,
  resetFamilySpaceState,
} from './services/familyStorageService';
import {
  deleteChildFromSupabase,
  fetchFamilySpaceFromSupabase,
  isValidUuid,
  resolveVerifiedFamilyContext,
  supabaseClient,
  saveOnboardingChildrenToSupabase,
  syncFamilySpaceToSupabase,
  saveMyParentLocation,
  verifyAccountIdentityOtpInSupabase,
  linkCoParentAccountInSupabase,
} from './services/supabaseService';
import { useMasterController } from './services/MasterAppController';
import { getLocalizedDocumentTitle, locText } from './utils/familyFormatters';
import { FamilyAppProvider, PageId } from './context/FamilyAppContext';
import { HomeDashboardSection } from './features/HomeDashboardSection';
import type { AiModelId } from './components/AiAssistantSection';
import { OnboardingFlowModal } from './components/OnboardingFlowModal';
import {
  OnboardingFlowController,
  UserSessionProfile,
  hasVerifiedFamilyAccess,
} from './services/OnboardingFlowController';
import { HeaderBar } from './components/HeaderBar';
import {
  ThreeDIcon,
  ThreeDIconId,
  AiRobotHeadIcon,
} from './components/ThreeDVisuals';
import {
  FullScreenNavigationLoader,
  GlobalToastSnackbar,
  InnerScreenTopBar,
  InteractiveSplashScreen,
  PASTEL_CARD_TONES,
  SectionSkeletonLoader,
  TaskFestivalCelebrationOverlay,
} from './components/DesignSystem';
import { FamilySmartPlannerModal } from './components/FamilySmartPlannerModal';
const MedicalHealthSection = React.lazy(() => import('./components/MedicalHealthSection').then((module) => ({ default: module.MedicalHealthSection })));
const MediaPlatformSection = React.lazy(() => import('./components/MediaPlatformSection').then((module) => ({ default: module.MediaPlatformSection })));
const ParentsCommunitySection = React.lazy(() => import('./components/ParentsCommunitySection').then((module) => ({ default: module.ParentsCommunitySection })));
const InternalChatSection = React.lazy(() => import('./components/InternalChatSection').then((module) => ({ default: module.InternalChatSection })));
const AiAssistantSection = React.lazy(() => import('./components/AiAssistantSection').then((module) => ({ default: module.AiAssistantSection })));
const CommercialEcosystemSection = React.lazy(() => import('./components/CommercialEcosystemSection').then((module) => ({ default: module.CommercialEcosystemSection })));
const InteractiveGamesSection = React.lazy(() => import('./components/InteractiveGamesSection').then((module) => ({ default: module.InteractiveGamesSection })));
const ChildrenProfilesSection = React.lazy(() => import('./features/ChildrenProfilesSection').then((module) => ({ default: module.ChildrenProfilesSection })));
const DailyRoutineSection = React.lazy(() => import('./features/DailyRoutineSection').then((module) => ({ default: module.DailyRoutineSection })));
const FamilyCalendarSection = React.lazy(() => import('./features/FamilyCalendarSection').then((module) => ({ default: module.FamilyCalendarSection })));
const KidsWishesSection = React.lazy(() => import('./features/KidsWishesSection').then((module) => ({ default: module.KidsWishesSection })));
const ProfileSettingsSection = React.lazy(() => import('./features/ProfileSettingsSection').then((module) => ({ default: module.ProfileSettingsSection })));
const FamilyHomesSection = React.lazy(() => import('./features/FamilyHomesSection').then((module) => ({ default: module.FamilyHomesSection })));
const FamilyPermissionsSection = React.lazy(() => import('./components/FamilyPermissionsSection').then((module) => ({ default: module.FamilyPermissionsSection })));
const NotificationsCenterSection = React.lazy(() => import('./components/NotificationsCenterSection').then((module) => ({ default: module.NotificationsCenterSection })));
const LegalAndContactSection = React.lazy(() => import('./components/LegalAndContactSection').then((module) => ({ default: module.LegalAndContactSection })));
const FamilyAppModals = React.lazy(() => import('./components/modals/FamilyAppModals').then((module) => ({ default: module.FamilyAppModals })));

const PREVIEW_ACCESS_BYPASS = false; // Production and shared-preview builds must use the real authentication flow.

export default function App() {
  const [state, setState] = useState<FamilySpaceState>(() => createEmptyFamilySpaceState());
  const stateRef = React.useRef(state);
  const savingRoutineTaskIdsRef = React.useRef(new Set<number>());
  stateRef.current = state;
  const activeParentProfile = state.parentAccounts[state.activeParentAccount];
  const activeParentCountry = activeParentProfile?.country || state.country;
  const activeParentCity =
    activeParentProfile?.city || state.city || getDefaultCityForCountry(activeParentCountry);
  const activeParentCurrency = getSuggestedCurrencyForCountry(activeParentCountry);
  const activeParentViewState: FamilySpaceState = {
    ...state,
    country: activeParentCountry,
    city: activeParentCity,
    currency: activeParentCurrency,
  };
  const skipNextCloudSyncRef = React.useRef(false);
  const [activeFamilyStorageScope, setActiveFamilyStorageScope] = useState<string | null>(null);
  const [hydratedFamilyStorageScope, setHydratedFamilyStorageScope] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<PageId>('home');
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);
  const tabLoadingTimerRef = React.useRef<number | null>(null);
  const navFadeTimerRef = React.useRef<number | null>(null);
  const navHideTimerRef = React.useRef<number | null>(null);
  const [navLoader, setNavLoader] = useState<{
    visible: boolean;
    fadingOut: boolean;
    targetPage: PageId;
  }>({ visible: false, fadingOut: false, targetPage: 'home' });
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showInnerSettings, setShowInnerSettings] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'active'>('idle');
  const [bedtimeMode, setBedtimeMode] = useState<boolean>(false);
  const [splashScreen, setSplashScreen] = useState<{
    visible: boolean;
    fadingOut: boolean;
  }>(() => {
    try {
      const hasSession = Boolean(OnboardingFlowController.getSavedProfile());
      const seen = window.sessionStorage.getItem('nekbaar_splash_seen_v1') === '1';
      return { visible: hasSession && !seen, fadingOut: false };
    } catch {
      return { visible: false, fadingOut: false };
    }
  });
  const splashFadeTimerRef = React.useRef<number | null>(null);
  const splashHideTimerRef = React.useRef<number | null>(null);
  const [storeInitialCategoryId, setStoreInitialCategoryId] = useState<string | null>(null);
  const [storeInitialOpenCheckout, setStoreInitialOpenCheckout] = useState<boolean>(false);
  const [aiInitialModelId, setAiInitialModelId] = useState<AiModelId>('consultant');
  const [aiInitialHistoryOpen, setAiInitialHistoryOpen] = useState<boolean>(false);

  const handleDismissSplashScreen = React.useCallback(() => {
    if (splashFadeTimerRef.current) window.clearTimeout(splashFadeTimerRef.current);
    if (splashHideTimerRef.current) window.clearTimeout(splashHideTimerRef.current);
    try {
      window.sessionStorage.setItem('nekbaar_splash_seen_v1', '1');
    } catch {
      // Ignore storage restrictions
    }
    setSplashScreen((prev) => (prev.visible ? { visible: true, fadingOut: true } : prev));
    splashHideTimerRef.current = window.setTimeout(() => {
      setSplashScreen({ visible: false, fadingOut: false });
    }, 220);
  }, []);

  const handleReplaySplashScreen = React.useCallback(() => {
    if (splashFadeTimerRef.current) window.clearTimeout(splashFadeTimerRef.current);
    if (splashHideTimerRef.current) window.clearTimeout(splashHideTimerRef.current);
    setSplashScreen({ visible: true, fadingOut: false });
    splashFadeTimerRef.current = window.setTimeout(() => {
      handleDismissSplashScreen();
    }, 9000);
  }, [handleDismissSplashScreen]);

  useEffect(() => {
    if (!splashScreen.visible) return;
    splashFadeTimerRef.current = window.setTimeout(() => {
      handleDismissSplashScreen();
    }, 9000);
    return () => {
      if (splashFadeTimerRef.current) window.clearTimeout(splashFadeTimerRef.current);
      if (splashHideTimerRef.current) window.clearTimeout(splashHideTimerRef.current);
    };
  }, [handleDismissSplashScreen, splashScreen.visible]);

  const [festivalCelebration, setFestivalCelebration] = useState<{
    id: number;
    titleAr: string;
    titleEn: string;
    subtitleAr?: string;
    subtitleEn?: string;
  } | null>(null);

  useEffect(() => {
    if (!festivalCelebration) return;
    const tId = window.setTimeout(() => setFestivalCelebration(null), 2200);
    return () => window.clearTimeout(tId);
  }, [festivalCelebration]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      if (tabLoadingTimerRef.current) {
        window.clearTimeout(tabLoadingTimerRef.current);
      }
      if (navFadeTimerRef.current) {
        window.clearTimeout(navFadeTimerRef.current);
      }
      if (navHideTimerRef.current) {
        window.clearTimeout(navHideTimerRef.current);
      }
    };
  }, []);

  // Routine filters & Reminders state
  const [routineKidFilter, setRoutineKidFilter] = useState<string>('all');
  const [routineStatusFilter, setRoutineStatusFilter] = useState<'all' | 'open' | 'done'>('all');
  const [routineCadenceFilter, setRoutineCadenceFilter] = useState<'all' | TaskCadence>('all');
  const [routineReminderFilter, setRoutineReminderFilter] = useState<
    'all' | 'alerts' | 'overdue' | 'approaching'
  >('all');
  const [routineApproachingWindow, setRoutineApproachingWindow] = useState<number>(90);
  const [routineRefTimePreset, setRoutineRefTimePreset] = useState<string>('18:20');
  const [liveClockMinutes, setLiveClockMinutes] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [currentLocalDateISO, setCurrentLocalDateISO] = useState<string>(() =>
    dateLocalISO(new Date())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLiveClockMinutes(now.getHours() * 60 + now.getMinutes());
      const nextDateISO = dateLocalISO(now);
      setCurrentLocalDateISO((prevDateISO) => {
        if (prevDateISO !== nextDateISO) {
          setState((prevState) => ({
            ...prevState,
            tasks: refreshTasksForCurrentDate(prevState.tasks, nextDateISO),
          }));
          return nextDateISO;
        }
        return prevDateISO;
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calendar filters
  const [eventFrom, setEventFrom] = useState<string>('');
  const [eventTo, setEventTo] = useState<string>('');

  // Wishes child tab filter
  const [wishKidTab, setWishKidTab] = useState<string>('all');

  // Settings form state
  const [settingsParentName, setSettingsParentName] = useState<string>(state.parentName);
  const [settingsRole, setSettingsRole] = useState<ParentThemeRole>(state.role);
  const [settingsCountry, setSettingsCountry] = useState<CountryCode>(state.country);
  const [settingsCity, setSettingsCity] = useState<string>(() =>
    resolveCityRegionId(state.country, state.city)
  );

  // Keep account settings inputs synchronized after Auth/profile hydration and onboarding.
  useEffect(() => {
    setSettingsParentName(state.parentName || '');
    setSettingsRole(state.role);
    setSettingsCountry(state.country);
    setSettingsCity(resolveCityRegionId(state.country, state.city));
  }, [state.parentName, state.role, state.country, state.city]);
  const [settingsLanguage, setSettingsLanguage] = useState<LanguageCode>(state.language);
  const [settingsCurrency, setSettingsCurrency] = useState<CurrencyCode>(state.currency);
  const [settingsCalendarMode, setSettingsCalendarMode] = useState<CalendarDisplayMode>(
    state.calendarMode
  );
  const [currencySuggestionBanner, setCurrencySuggestionBanner] = useState<CurrencyCode | null>(
    null
  );

  // Keep the side-page country, city and currency controls aligned with the active family location.
  useEffect(() => {
    setSettingsCountry(state.country);
    setSettingsCity(resolveCityRegionId(state.country, state.city));
    setSettingsCurrency(state.currency);
  }, [state.country, state.city, state.currency]);

  // Bottom Settings Phone OTP Verification State
  const [settingsPhoneInput, setSettingsPhoneInput] = useState<string>(
    state.parentAccounts[state.activeParentAccount]?.phoneNumber || '1012345678'
  );
  const [settingsOtpStep, setSettingsOtpStep] = useState<boolean>(false);
  const [settingsOtpCode, setSettingsOtpCode] = useState<string>('');

  // Active Modals & Mandatory Auth Gateway / Smart Startup Profile Recognition (`OnboardingFlowController`)
  const [recognizedProfile, setRecognizedProfile] = useState<UserSessionProfile | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const previewModeRef = React.useRef<boolean>(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(
    () => !PREVIEW_ACCESS_BYPASS
  );
  const [showSmartGreetingBanner, setShowSmartGreetingBanner] = useState<boolean>(true);
  const [childModalOpen, setChildModalOpen] = useState<boolean>(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [childPhotoDraft, setChildPhotoDraft] = useState<string | undefined>(undefined);
  const [childUse3DAvatarDraft, setChildUse3DAvatarDraft] = useState<boolean>(true);
  const [confirmDeleteChildId, setConfirmDeleteChildId] = useState<number | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<RoutineTask | null>(null);

  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [smartPlannerModalOpen, setSmartPlannerModalOpen] = useState<boolean>(false);

  const [wishModalOpen, setWishModalOpen] = useState<boolean>(false);
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);

  const [personModalOpen, setPersonModalOpen] = useState<boolean>(false);
  const [permModalMember, setPermModalMember] = useState<FamilyMember | null>(null);

  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [activeMediaModal, setActiveMediaModal] = useState<MediaContentItem | null>(null);
  const [activeCommercialModal, setActiveCommercialModal] = useState<CommercialCatalogItem | null>(
    null
  );
  const [selectedModalVariant, setSelectedModalVariant] = useState<string>('');
  const [pendingServiceBooking, setPendingServiceBooking] = useState<CommercialCatalogItem | null>(null);
  const clearPendingServiceBooking = React.useCallback(() => setPendingServiceBooking(null), []);
  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  const handlePersonalLocationSaved = React.useCallback((country: CountryCode, city: string) => {
    setState((prev) => ({
      ...prev,
      parentAccounts: {
        ...prev.parentAccounts,
        [prev.activeParentAccount]: {
          ...prev.parentAccounts[prev.activeParentAccount],
          country,
          city,
          phoneCode: getCountryDialCode(country),
        },
      },
    }));
  }, []);

  const handleEnterPreviewMode = () => {
    // Bundled sample data only: no verified family scope, cloud hydration, or family storage writes.
    previewModeRef.current = true;
    setIsPreviewMode(true);
    setActiveFamilyStorageScope(null);
    setHydratedFamilyStorageScope(null);
    setRecognizedProfile(null);
    setSettingsOtpStep(false);
    setSettingsOtpCode('');
    setState(normalizeAppData({ ...DEFAULT_SEED, verifiedFamilyId: null }));
    setActivePage('home');
    setOnboardingModalOpen(false);
    showToast(lang === 'en' ? 'Preview mode · Sample data only' : 'وضع المراجعة · بيانات تجريبية فقط');
  };

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Sync theme, color mode (light/dark), direction, language, document title, and localStorage
  useEffect(() => {
    const colorMode = resolveColorMode(state.darkMode);
    document.documentElement.dataset.theme = state.role || 'mom';
    document.documentElement.dataset.colorMode = colorMode;
    document.documentElement.classList.toggle('dark', colorMode === 'dark');
    document.documentElement.lang = state.language === 'en' ? 'en' : 'ar';
    document.documentElement.dir = state.language === 'en' ? 'ltr' : 'rtl';
    document.title = getLocalizedDocumentTitle(state.language);
    if (activeFamilyStorageScope && !saveFamilySpaceStateForFamily(state, activeFamilyStorageScope)) {
      showToast('تعذر الحفظ في المتصفح. صدّر نسخة احتياطية من الإعدادات.');
    }
  }, [state, activeFamilyStorageScope]);

  // Autonomous Master Controller hook (`Initializing` | `Synced` | `Offline-Fallback` | `Error-Recovery`)
  const master = useMasterController();

  // Supabase loading & network fallback states driven by MasterAppController
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState<string | null>(null);

  const loadFromSupabase = React.useCallback(async () => {
    if (!activeFamilyStorageScope) {
      setHydratedFamilyStorageScope(null);
      setSupabaseStatus('ready');
      setSupabaseErrorMsg(null);
      return;
    }
    setHydratedFamilyStorageScope(null);
    setSupabaseStatus('loading');
    setSupabaseErrorMsg(null);
    const { hydratedState, snapshot } = await master.controller.bootstrapWithAppState(state);
    skipNextCloudSyncRef.current = true;
    setState(hydratedState);
    if (
      snapshot.lifecycleState === 'Offline-Fallback' ||
      hydratedState.verifiedFamilyId !== activeFamilyStorageScope
    ) {
      setSupabaseStatus('error');
      setSupabaseErrorMsg(snapshot.retryTelemetry.lastError || 'تعذر تحميل بيانات الأسرة من السحابة.');
    } else {
      setHydratedFamilyStorageScope(activeFamilyStorageScope);
      setSupabaseStatus('ready');
      setSupabaseErrorMsg(null);
    }
  }, [master.controller, activeFamilyStorageScope, state]);

  // Hydrate cloud data only after verified family ownership is active.
  useEffect(() => {
    if (!activeFamilyStorageScope) {
      setSupabaseStatus('ready');
      setSupabaseErrorMsg(null);
      return;
    }
    let isMounted = true;
    setHydratedFamilyStorageScope(null);
    setSupabaseStatus('loading');
    master.controller.bootstrapWithAppState(state).then(({ hydratedState, snapshot }) => {
      if (!isMounted) return;
      skipNextCloudSyncRef.current = true;
      setState(hydratedState);
      if (
        snapshot.lifecycleState === 'Offline-Fallback' ||
        hydratedState.verifiedFamilyId !== activeFamilyStorageScope
      ) {
        setSupabaseStatus('error');
        setSupabaseErrorMsg(snapshot.retryTelemetry.lastError || 'تعذر تحميل بيانات الأسرة من السحابة.');
      } else {
        setHydratedFamilyStorageScope(activeFamilyStorageScope);
        setSupabaseStatus('ready');
        setSupabaseErrorMsg(null);
      }
    }).catch((error: unknown) => {
      if (!isMounted) return;
      setSupabaseStatus('error');
      setSupabaseErrorMsg(error instanceof Error ? error.message : 'تعذر تحميل بيانات الأسرة من السحابة.');
    });
    return () => {
      isMounted = false;
    };
  }, [master.controller, activeFamilyStorageScope]);

  // Smart Startup Profile Recognition — require a verified family UUID before loading private data.
  useEffect(() => {
    if (PREVIEW_ACCESS_BYPASS) {
      setRecognizedProfile(null);
      setOnboardingModalOpen(false);
      return;
    }
    let active = true;
    OnboardingFlowController.detectInitialState().then(
      ({ step, profile, restoredChildren }) => {
        if (!active || previewModeRef.current) return;
        if (step === 'DASHBOARD' && profile && isValidUuid(profile.verifiedFamilyId)) {
          const familyState = loadFamilySpaceStateForFamily(profile.verifiedFamilyId);
          setActiveFamilyStorageScope(profile.verifiedFamilyId);
          setHydratedFamilyStorageScope(null);
          setRecognizedProfile(profile);
          setOnboardingModalOpen(false);
          setActivePage('home');
          const nextCountry = isSupportedCountryCode(profile.country)
            ? profile.country
            : familyState.country;
          const nextRole =
            profile.role === 'dad' || profile.role === 'mom' ? profile.role : familyState.role;
          const pid = nextRole === 'dad' ? 'father' : 'mother';
          const nextKids = Array.isArray(restoredChildren)
            ? restoredChildren.map((child, idx) => {
                const rawDetails = (child.profile_details || {}) as Record<string, unknown>;
                const rawExtra = (rawDetails.extra || {}) as Record<string, unknown>;
                const rawColor = isValidChildColorTheme(rawDetails.colorTheme)
                  ? rawDetails.colorTheme
                  : isValidChildColorTheme(rawExtra.colorTheme)
                  ? rawExtra.colorTheme
                  : undefined;
                return {
                  id: child.id || idx + 1,
                  remoteId: child.remote_id,
                  name: child.name,
                  gender: child.gender === 'girl' ? ('girl' as const) : ('boy' as const),
                  birth: child.birth || '2022-05-14',
                  interests: child.interests || '',
                  colorTheme: rawColor,
                  profileDetails: child.profile_details || {},
                  vaccinationsNote: child.vaccinations_note || undefined,
                  growthHeightCm:
                    typeof child.growth_height_cm === 'number' ? child.growth_height_cm : undefined,
                  growthWeightKg:
                    typeof child.growth_weight_kg === 'number' ? child.growth_weight_kg : undefined,
                  emoji: child.emoji || (child.gender === 'girl' ? '👧🏻' : '👦🏻'),
                  avatarTheme:
                    child.avatar_theme || (child.gender === 'girl' ? 'artist' : 'astronaut'),
                  useIllustratedAvatar: true,
                };
              })
            : familyState.kids;
          setState({
            ...familyState,
            parentName: profile.fullName || familyState.parentName,
            role: nextRole,
            country: nextCountry,
            city: profile.city || familyState.city || getDefaultCityForCountry(nextCountry),
            currency: getSuggestedCurrencyForCountry(nextCountry),
            activeParentAccount: pid,
            verifiedFamilyId: profile.verifiedFamilyId,
            parentAccounts: {
              ...familyState.parentAccounts,
              [pid]: {
                ...familyState.parentAccounts[pid],
                fullName: profile.fullName || familyState.parentAccounts[pid].fullName,
                country: nextCountry,
                city: profile.city || familyState.city || getDefaultCityForCountry(nextCountry),
                phoneCode: getCountryDialCode(nextCountry),
                email: profile.email || familyState.parentAccounts[pid].email,
                phoneNumber: profile.phone || familyState.parentAccounts[pid].phoneNumber,
                emailVerified: Boolean(profile.emailVerified),
                phoneVerified: Boolean(profile.phoneVerified),
                onboardingCompleted: Boolean(profile.onboardingCompleted ?? true),
              },
            },
            kids: nextKids,
          });
        } else {
          setActiveFamilyStorageScope(null);
    setHydratedFamilyStorageScope(null);
          setRecognizedProfile(null);
          setState(createEmptyFamilySpaceState());
          setOnboardingModalOpen(true);
          setActivePage('home');
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // Keep the visible workspace synchronized with real Supabase Auth transitions.
  useEffect(() => {
    return OnboardingFlowController.subscribeToAuthSessionChanges(({ event, authenticated }) => {
      if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !authenticated)) {
        setRecognizedProfile(null);
        setActiveFamilyStorageScope(null);
    setHydratedFamilyStorageScope(null);
        setState(createEmptyFamilySpaceState());
        setOnboardingModalOpen(true);
        setActivePage('home');
      }
    });
  }, []);

  // Persist shared and private workspace changes only after the verified cloud state is hydrated.
  useEffect(() => {
    if (
      !activeFamilyStorageScope ||
      hydratedFamilyStorageScope !== activeFamilyStorageScope ||
      isPreviewMode ||
      supabaseStatus !== 'ready' ||
      !isValidUuid(state.verifiedFamilyId) ||
      state.verifiedFamilyId !== activeFamilyStorageScope
    ) return;

    if (skipNextCloudSyncRef.current) {
      skipNextCloudSyncRef.current = false;
      return;
    }

    const syncTimer = window.setTimeout(() => {
      void master.forceSyncNow(state).then((synced) => {
        if (!synced) {
          setSupabaseErrorMsg('تعذر مزامنة بعض التغييرات حالياً. ستظل محفوظة محلياً وتُعاد المحاولة عند الاتصال.');
        } else {
          setSupabaseErrorMsg(null);
        }
      });
    }, 1200);

    const retryWhenOnline = () => {
      void master.forceSyncNow(stateRef.current).then((synced) => {
        if (synced) setSupabaseErrorMsg(null);
      });
    };
    window.addEventListener('online', retryWhenOnline);

    return () => {
      window.clearTimeout(syncTimer);
      window.removeEventListener('online', retryWhenOnline);
    };
  }, [
    master.forceSyncNow,
    activeFamilyStorageScope,
    hydratedFamilyStorageScope,
    supabaseStatus,
    isPreviewMode,
    state.verifiedFamilyId,
    state.activeParentAccount,
    state.parentName,
    state.role,
    state.country,
    state.city,
    state.currency,
    state.language,
    state.calendarMode,
    state.disputeFreezeActive,
    state.savedMediaIds,
    state.events,
    state.kids,
    state.tasks,
    state.wishes,
    state.family,
    state.parentAccounts,
    state.invitations,
    state.readNotificationIds,
    state.cart,
    state.recentlyViewedProductIds,
    state.shippingAddress,
    state.orders,
    state.darkMode,
    state.communityState,
    state.chatState,
  ]);

  // If the first cloud hydration failed while offline, hydrate before allowing any upload when connectivity returns.
  useEffect(() => {
    if (
      !activeFamilyStorageScope ||
      isPreviewMode ||
      hydratedFamilyStorageScope === activeFamilyStorageScope
    ) return;
    const retryHydration = () => { void loadFromSupabase(); };
    window.addEventListener('online', retryHydration);
    return () => window.removeEventListener('online', retryHydration);
  }, [activeFamilyStorageScope, hydratedFamilyStorageScope, isPreviewMode, loadFromSupabase]);

  // Other parent changes are hydrated immediately from the shared family workspace.
  useEffect(() => {
    const client = supabaseClient;
    if (!activeFamilyStorageScope || hydratedFamilyStorageScope !== activeFamilyStorageScope || !client || isPreviewMode) return;
    let active = true;
    let channel: ReturnType<typeof client.channel> | null = null;

    void resolveVerifiedFamilyContext(client).then((context) => {
      if (
        !active ||
        !context.authenticated ||
        !context.userId ||
        context.verifiedFamilyId !== activeFamilyStorageScope
      ) return;

      channel = client
        .channel(`family-shared-state-${activeFamilyStorageScope}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'family_shared_state',
            filter: `family_id=eq.${activeFamilyStorageScope}`,
          },
          async (payload) => {
            const newRow = payload.new as Record<string, unknown> | null;
            if (!newRow || newRow.updated_by === context.userId) return;
            const result = await fetchFamilySpaceFromSupabase(stateRef.current, client);
            if (!active || result.error) return;
            skipNextCloudSyncRef.current = true;
            setState(result.nextState);
          }
        )
        .subscribe();
    }).catch(() => {
      // Initial hydration remains the fallback if realtime cannot connect.
    });

    return () => {
      active = false;
      if (channel) void client.removeChannel(channel);
    };
  }, [activeFamilyStorageScope, hydratedFamilyStorageScope, isPreviewMode]);

  // Sync settings inputs when state changes externally
  useEffect(() => {
    setSettingsParentName(state.parentName);
    setSettingsRole(state.role);
    setSettingsCountry(state.country);
    setSettingsCity(state.city || getDefaultCityForCountry(state.country));
    setSettingsLanguage(state.language);
    setSettingsCurrency(state.currency);
    setSettingsCalendarMode(state.calendarMode);
    setSettingsPhoneInput(
      state.parentAccounts[state.activeParentAccount]?.phoneNumber || '1012345678'
    );
  }, [
    state.parentName,
    state.role,
    state.country,
    state.city,
    state.language,
    state.currency,
    state.calendarMode,
    state.activeParentAccount,
    state.parentAccounts,
  ]);

  const lang = state.language;
  const todayISO = currentLocalDateISO;
  const todayFormatted = useMemo(
    () => formatGregorianAndHijri(todayISO, state.country, state.language, state.calendarMode),
    [todayISO, state.country, state.language, state.calendarMode]
  );

  const nearestEvent = useMemo(
    () => getNearestUpcomingEvent(state.events, todayISO),
    [state.events, todayISO]
  );

  const completedTasksCount = useMemo(
    () => state.tasks.filter((tItem) => tItem.done).length,
    [state.tasks]
  );

  const activeParentNotifications = useMemo(
    () => generateThreeDailyNotifications(state, state.activeParentAccount),
    [state]
  );
  const unreadNotifCount = useMemo(
    () => activeParentNotifications.filter((n) => !n.read).length,
    [activeParentNotifications]
  );

  const cartItemCount = useMemo(
    () => state.cart.reduce((sum, item) => sum + item.quantity, 0),
    [state.cart]
  );

  const navigateTo = (page: PageId) => {
    if (tabLoadingTimerRef.current) {
      window.clearTimeout(tabLoadingTimerRef.current);
      tabLoadingTimerRef.current = null;
    }
    if (navFadeTimerRef.current) {
      window.clearTimeout(navFadeTimerRef.current);
      navFadeTimerRef.current = null;
    }
    if (navHideTimerRef.current) {
      window.clearTimeout(navHideTimerRef.current);
      navHideTimerRef.current = null;
    }

    if (page !== activePage) {
      const isHeavyTab = shouldTriggerSkeletonForTab(page);
      setNavLoader({ visible: true, fadingOut: false, targetPage: page });

      if (isHeavyTab) {
        setIsTabLoading(true);
        tabLoadingTimerRef.current = window.setTimeout(() => {
          setIsTabLoading(false);
          tabLoadingTimerRef.current = null;
        }, SKELETON_LOAD_DURATION_MS);
      } else {
        setIsTabLoading(false);
      }

      const renderReadyMs = SKELETON_LOAD_DURATION_MS;
      navFadeTimerRef.current = window.setTimeout(() => {
        setNavLoader((prev) => ({ ...prev, fadingOut: true }));
        navHideTimerRef.current = window.setTimeout(() => {
          setNavLoader((prev) => ({ ...prev, visible: false, fadingOut: false }));
          navHideTimerRef.current = null;
        }, 200);
        navFadeTimerRef.current = null;
      }, renderReadyMs);
    } else {
      setIsTabLoading(false);
    }

    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Instant Top Bar Language Toggle (Arabic RTL <-> English LTR)
  const handleToggleTopLanguage = () => {
    const nextLang: LanguageCode = state.language === 'ar' ? 'en' : 'ar';
    setState((prev) => ({ ...prev, language: nextLang }));
    showToast(
      nextLang === 'en'
        ? 'Language switched to English (LTR)'
        : 'تم التبديل إلى اللغة العربية (RTL)'
    );
  };

  // Instant Global Light/Dark Mode Toggle
  const handleToggleDarkMode = () => {
    const nextDark = !state.darkMode;
    setState((prev) => ({ ...prev, darkMode: nextDark }));
    showToast(
      nextDark
        ? lang === 'en'
          ? 'Dark Mode enabled — Deep Midnight Charcoal palette'
          : 'تم تفعيل الوضع الليلي الفحمي العميق'
        : lang === 'en'
        ? 'Light Mode enabled — Calm Teal & Warm Coral palette'
        : 'تم تفعيل الوضع النهاري المريح للعين'
    );
  };

  // Instant Warm Bedtime / Family Night Reading Mode Toggle
  const handleToggleBedtimeMode = () => {
    setBedtimeMode((prev) => {
      const next = !prev;
      showToast(
        next
          ? lang === 'en'
            ? '🌙 Warm Bedtime Focus Mode enabled — Low blue-light comfort filter active'
            : '🌙 تم تفعيل وضع هدوء المساء — إضاءة دافئة مريحة لعيونك وعيون طفلك قبل النوم'
          : lang === 'en'
          ? '☀️ Bedtime Focus Mode turned off'
          : '☀️ تم إيقاف وضع هدوء المساء والعودة للإضاءة الطبيعية'
      );
      return next;
    });
  };

  // Header and dashboard location controls update the active parent's private location,
  // never the shared family service-area fields.
  const handleSelectPreciseCity = (combinedValue: string) => {
    const separatorIndex = combinedValue.indexOf(':');
    if (separatorIndex < 0) return;

    const countryRaw = combinedValue.slice(0, separatorIndex);
    const cityRaw = combinedValue.slice(separatorIndex + 1);
    if (!isSupportedCountryCode(countryRaw)) return;

    const nextCountry: CountryCode = countryRaw;
    const cityId = resolveCityRegionId(nextCountry, cityRaw);
    const cityObj =
      COUNTRY_CITIES_MAP[nextCountry].find((city) => city.id === cityId) ||
      COUNTRY_CITIES_MAP[nextCountry][0];
    if (!cityObj) return;

    const nextCurrency = getSuggestedCurrencyForCountry(nextCountry);
    setState((prev) => ({
      ...prev,
      parentAccounts: {
        ...prev.parentAccounts,
        [prev.activeParentAccount]: {
          ...prev.parentAccounts[prev.activeParentAccount],
          country: nextCountry,
          city: cityObj.id,
          phoneCode: getCountryDialCode(nextCountry),
        },
      },
    }));
    setCurrencySuggestionBanner(null);
    setUserCoords({ lat: cityObj.lat, lng: cityObj.lng });
    setGeoStatus('active');
    if (state.verifiedFamilyId) {
      void saveMyParentLocation({
        country: nextCountry,
        city: cityObj.id,
        currency: nextCurrency,
        timezone: getCountryTimezone(nextCountry),
      }).then((result) => {
        if (result.error) showToast(result.error);
      });
    }
    showToast(
      lang === 'en'
        ? `Your location updated to ${cityObj.nameEn} (${nextCurrency}) — Nearby services sorted`
        : `تم تحديث موقع حسابك إلى ${cityObj.nameAr} (${nextCurrency}) وترتيب الخدمات الأقرب إليك`
    );
  };

  // Geolocation Permission Trigger ("Use my current location")
  const handleUseCurrentLocation = () => {
    setGeoStatus('locating');
    const applyDetectedCoords = (lat: number, lng: number, fromGps: boolean) => {
      const nearest = findNearestCityByCoords(lat, lng);
      const nextCurrency = getSuggestedCurrencyForCountry(nearest.country);
      setUserCoords({ lat, lng });
      setGeoStatus('active');
      setState((prev) => ({
        ...prev,
        parentAccounts: {
          ...prev.parentAccounts,
          [prev.activeParentAccount]: {
            ...prev.parentAccounts[prev.activeParentAccount],
            country: nearest.country,
            city: nearest.city.id,
            phoneCode: getCountryDialCode(nearest.country),
          },
        },
      }));
      if (state.verifiedFamilyId) {
        void saveMyParentLocation({
          country: nearest.country,
          city: nearest.city.id,
          currency: nextCurrency,
          timezone: getCountryTimezone(nearest.country),
        }).then((result) => {
          if (result.error) showToast(result.error);
        });
      }
      showToast(
        lang === 'en'
          ? fromGps
            ? `GPS Active: Your nearest city is ${nearest.city.nameEn} (${nearest.distanceKm} km)`
            : `Your location is set to ${nearest.city.nameEn} — Nearby services sorted`
          : fromGps
          ? `تم تحديد أقرب مدينة لحسابك: ${nearest.city.nameAr} (${nearest.distanceKm} كم)`
          : `تم ضبط موقع حسابك على ${nearest.city.nameAr} وترتيب الخدمات الأقرب إليك`
      );
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyDetectedCoords(pos.coords.latitude, pos.coords.longitude, true);
        },
        () => {
          const currentCityList = COUNTRY_CITIES_MAP[activeParentCountry];
          const currentCityObj =
            currentCityList.find((c) => c.id === activeParentCity) || currentCityList[0];
          applyDetectedCoords(currentCityObj.lat, currentCityObj.lng, false);
        },
        { enableHighAccuracy: false, timeout: 4500, maximumAge: 60000 }
      );
    } else {
      const currentCityList = COUNTRY_CITIES_MAP[activeParentCountry];
      const currentCityObj =
        currentCityList.find((c) => c.id === activeParentCity) || currentCityList[0];
      applyDetectedCoords(currentCityObj.lat, currentCityObj.lng, false);
    }
  };

  // Child CRUD handlers (with 3D Avatar Theme + Real Photo Upload Preservation)
  const openAddChild = () => {
    setEditingChild(null);
    setChildPhotoDraft(undefined);
    setChildUse3DAvatarDraft(true);
    setChildModalOpen(true);
  };

  const openEditChild = (kid: ChildProfile) => {
    setEditingChild(kid);
    setChildPhotoDraft(kid.photoDataUrl);
    setChildUse3DAvatarDraft(kid.photoDataUrl ? Boolean(kid.useIllustratedAvatar) : true);
    setChildModalOpen(true);
  };

  const handleChildPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      showToast(
        lang === 'en'
          ? 'Unsupported format. Please upload a JPG, PNG, or WebP photo.'
          : 'صيغة الصورة غير مدعومة أمنياً. يُسمح فقط بـ JPG أو PNG أو WebP.'
      );
      e.target.value = '';
      return;
    }
    if (file.size > MAX_CHILD_PHOTO_BYTES) {
      showToast(
        lang === 'en'
          ? 'Photo is too large (max 2 MB) to protect safe local storage.'
          : 'حجم الصورة يتجاوز الحد الآمن (٢ ميجابايت). يرجى اختيار صورة أصغر.'
      );
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const validation = validateAndSanitizeImageDataUrl(reader.result);
        if (!validation.valid || !validation.sanitized) {
          showToast(
            lang === 'en'
              ? validation.errorEn || 'Invalid image file'
              : validation.errorAr || 'ملف الصورة غير صالح'
          );
          return;
        }
        setChildPhotoDraft(validation.sanitized);
        setChildUse3DAvatarDraft(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChild = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = sanitizeUserText(String(fd.get('name') || ''), 80);
    const gender = fd.get('gender') === 'girl' ? 'girl' : 'boy';
    const birth = String(fd.get('birth') || '').trim();
    const interests = sanitizeUserText(String(fd.get('interests') || ''), 240);
    const bloodType = sanitizeUserText(String(fd.get('bloodType') || ''), 16);
    const vaccinationsNote = sanitizeUserText(String(fd.get('vaccinationsNote') || ''), 280);
    const healthNotePrivate = sanitizeUserText(String(fd.get('healthNotePrivate') || ''), 280);
    const growthHeightCm = Number(fd.get('growthHeightCm')) || undefined;
    const growthWeightKg = Number(fd.get('growthWeightKg')) || undefined;
    const avatarTheme =
      (String(fd.get('avatarTheme') || 'astronaut') as AvatarAccessoryTheme) || 'astronaut';
    const colorThemeRaw = String(fd.get('colorTheme') || '').trim();
    const colorTheme: ChildColorThemeId | undefined = isValidChildColorTheme(colorThemeRaw)
      ? colorThemeRaw
      : editingChild?.colorTheme;

    const validation = validateChildInput({ name, birth, interests }, todayISO);
    if (!validation.valid) {
      showToast(validation.error || 'بيانات غير صالحة');
      return;
    }

    const emoji = gender === 'girl' ? '👧🏻' : '👦🏻';
    const targetLocalId = editingChild
      ? editingChild.id
      : Date.now() + Math.floor(Math.random() * 100);
    const existingRemoteId = editingChild?.remoteId;
    const baseProfileDetails = editingChild?.profileDetails || {};
    const mergedProfileDetails = colorTheme
      ? {
          ...baseProfileDetails,
          colorTheme,
          extra: { ...(baseProfileDetails.extra || {}), colorTheme },
        }
      : baseProfileDetails;

    setState((prev) => {
      if (editingChild) {
        return {
          ...prev,
          kids: prev.kids.map((k) =>
            k.id === editingChild.id
              ? {
                  ...k,
                  name,
                  gender,
                  birth,
                  interests,
                  emoji,
                  bloodType,
                  vaccinationsNote,
                  healthNotePrivate,
                  growthHeightCm,
                  growthWeightKg,
                  avatarTheme,
                  colorTheme,
                  profileDetails: mergedProfileDetails,
                  photoDataUrl: childPhotoDraft,
                  useIllustratedAvatar: childPhotoDraft ? childUse3DAvatarDraft : true,
                }
              : k
          ),
        };
      }
      const newChild: ChildProfile = {
        id: targetLocalId,
        name,
        gender,
        birth,
        interests,
        emoji,
        bloodType,
        vaccinationsNote,
        healthNotePrivate,
        growthHeightCm,
        growthWeightKg,
        avatarTheme,
        colorTheme,
        profileDetails: mergedProfileDetails,
        photoDataUrl: childPhotoDraft,
        useIllustratedAvatar: childPhotoDraft ? childUse3DAvatarDraft : true,
      };
      return { ...prev, kids: [...prev.kids, newChild] };
    });

    const verifiedFamilyUuid =
      (isValidUuid(state.verifiedFamilyId) && state.verifiedFamilyId) ||
      (isValidUuid(recognizedProfile?.verifiedFamilyId) && recognizedProfile?.verifiedFamilyId) ||
      null;

    if (verifiedFamilyUuid) {
      const existingKidObj = state.kids.find((k) => k.id === targetLocalId);
      void saveOnboardingChildrenToSupabase({
        familyId: verifiedFamilyUuid,
        childrenList: [
          {
            id: targetLocalId,
            remoteId: isValidUuid(existingRemoteId) ? String(existingRemoteId) : undefined,
            name,
            birth,
            gender,
            interests,
            avatarTheme,
            profileDetails: mergedProfileDetails,
            vaccinationsNote: vaccinationsNote || existingKidObj?.vaccinationsNote,
            growthHeightCm: growthHeightCm ?? existingKidObj?.growthHeightCm,
            growthWeightKg: growthWeightKg ?? existingKidObj?.growthWeightKg,
          },
        ],
      }).then((saveRes) => {
        if (saveRes.synced && saveRes.savedChildren[0]?.remote_id) {
          const assignedRemoteId = saveRes.savedChildren[0].remote_id;
          setState((prev) => ({
            ...prev,
            kids: prev.kids.map((k) =>
              k.id === targetLocalId ? { ...k, remoteId: assignedRemoteId } : k
            ),
          }));
        }
      });
    }

    setChildModalOpen(false);
    setEditingChild(null);
    showToast(
      lang === 'en'
        ? 'Child 3D profile & color identity saved!'
        : 'تم حفظ ملف الطفل وهويته اللونية بنجاح'
    );
  };

  const handleChangeChildColorTheme = (kidId: number, colorTheme: ChildColorThemeId) => {
    if (!isValidChildColorTheme(colorTheme)) return;
    const targetKid = state.kids.find((k) => k.id === kidId);
    if (!targetKid) return;

    const updatedProfileDetails = {
      ...(targetKid.profileDetails || {}),
      colorTheme,
      extra: {
        ...(targetKid.profileDetails?.extra || {}),
        colorTheme,
      },
    };

    setState((prev) => ({
      ...prev,
      kids: prev.kids.map((k) =>
        k.id === kidId
          ? {
              ...k,
              colorTheme,
              profileDetails: updatedProfileDetails,
            }
          : k
      ),
    }));

    const verifiedFamilyUuid =
      (isValidUuid(state.verifiedFamilyId) && state.verifiedFamilyId) ||
      (isValidUuid(recognizedProfile?.verifiedFamilyId) && recognizedProfile?.verifiedFamilyId) ||
      null;

    if (verifiedFamilyUuid && !isPreviewMode) {
      void saveOnboardingChildrenToSupabase({
        familyId: verifiedFamilyUuid,
        childrenList: [
          {
            id: targetKid.id,
            remoteId: isValidUuid(targetKid.remoteId) ? String(targetKid.remoteId) : undefined,
            name: targetKid.name,
            birth: targetKid.birth,
            gender: targetKid.gender,
            interests: targetKid.interests,
            avatarTheme: targetKid.avatarTheme,
            profileDetails: updatedProfileDetails,
            vaccinationsNote: targetKid.vaccinationsNote,
            growthHeightCm: targetKid.growthHeightCm,
            growthWeightKg: targetKid.growthWeightKg,
          },
        ],
      });
    }

    const themeSpec = getChildVisualIdentitySpec(colorTheme);
    showToast(
      lang === 'en'
        ? `Updated ${targetKid.name}'s visual identity to ${themeSpec.labelEn}`
        : `تم تحديث الهوية البصرية لـ ${targetKid.name} إلى «${themeSpec.labelAr}»`
    );
  };

  const handleConfirmDeleteChild = () => {
    if (confirmDeleteChildId === null) return;
    const targetChild = state.kids.find((k) => k.id === confirmDeleteChildId);
    if (targetChild && isValidUuid(targetChild.remoteId)) {
      void deleteChildFromSupabase({
        remoteId: targetChild.remoteId,
        childName: targetChild.name,
      });
    }
    setState((prev) => deleteChildCascade(prev, confirmDeleteChildId));
    setConfirmDeleteChildId(null);
    showToast('تم حذف ملف الطفل والعناصر المرتبطة به');
  };

  // Routine Task CRUD
  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = sanitizeUserText(String(fd.get('name') || ''), 180);
    if (!name) {
      showToast('اكتب اسم المهمة قبل الحفظ');
      return;
    }
    const time = sanitizeUserText(String(fd.get('time') || ''), 40);
    const kidIdRaw = String(fd.get('kidId') || '');
    const kidId = kidIdRaw ? Number(kidIdRaw) : null;
    const category = sanitizeUserText(String(fd.get('category') || 'روتين عام'), 60);
    const owner = sanitizeUserText(String(fd.get('owner') || 'مشترك'), 60);
    const cadenceRaw = String(fd.get('cadence') || 'daily');
    const cadence: TaskCadence =
      cadenceRaw === 'weekly' || cadenceRaw === 'monthly' ? cadenceRaw : 'daily';
    const dayOfWeekRaw = fd.get('dayOfWeek');
    const dayOfWeekNum =
      dayOfWeekRaw !== null && String(dayOfWeekRaw).trim() !== '' ? Number(dayOfWeekRaw) : undefined;
    const dayOfWeek =
      typeof dayOfWeekNum === 'number' &&
      Number.isInteger(dayOfWeekNum) &&
      dayOfWeekNum >= 0 &&
      dayOfWeekNum <= 6
        ? dayOfWeekNum
        : undefined;
    const dayOfMonthRaw = fd.get('dayOfMonth');
    const dayOfMonthNum =
      dayOfMonthRaw !== null && String(dayOfMonthRaw).trim() !== '' ? Number(dayOfMonthRaw) : undefined;
    const dayOfMonth =
      typeof dayOfMonthNum === 'number' &&
      Number.isInteger(dayOfMonthNum) &&
      dayOfMonthNum >= 1 &&
      dayOfMonthNum <= 31
        ? dayOfMonthNum
        : undefined;

    setState((prev) => {
      if (editingTask) {
        return {
          ...prev,
          tasks: prev.tasks.map((tItem) =>
            tItem.id === editingTask.id
              ? {
                  ...tItem,
                  name,
                  time,
                  kidId,
                  category,
                  owner,
                  cadence,
                  dayOfWeek: cadence === 'weekly' ? (dayOfWeek ?? tItem.dayOfWeek ?? new Date().getDay()) : undefined,
                  dayOfMonth: cadence === 'monthly' ? (dayOfMonth ?? tItem.dayOfMonth ?? new Date().getDate()) : undefined,
                }
              : tItem
          ),
        };
      }
      return {
        ...prev,
        tasks: [
          ...prev.tasks,
          {
            id: Date.now() + Math.floor(Math.random() * 100),
            name,
            time,
            done: false,
            kidId,
            category,
            owner,
            cadence,
            dayOfWeek: cadence === 'weekly' ? (dayOfWeek ?? new Date().getDay()) : undefined,
            dayOfMonth: cadence === 'monthly' ? (dayOfMonth ?? new Date().getDate()) : undefined,
            completedDates: [],
          },
        ],
      };
    });

    setTaskModalOpen(false);
    setEditingTask(null);
    showToast(editingTask ? 'تم تحديث المهمة' : 'تمت إضافة المهمة للروتين');
  };

  const handleToggleTask = async (
    id: number,
    done: boolean,
    targetDateISO: string = todayISO
  ) => {
    const targetTask = state.tasks.find((tItem) => tItem.id === id);
    const alreadyCompletedOnTargetDate = targetTask
      ? isTaskCompletedOnDate(targetTask, targetDateISO)
      : false;
    const alreadyRecordedInHistory = Boolean(
      targetTask?.completedDates?.includes(targetDateISO)
    );

    if (done && (alreadyCompletedOnTargetDate || savingRoutineTaskIdsRef.current.has(id))) return;
    if (done) savingRoutineTaskIdsRef.current.add(id);
    try {
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((tItem) =>
          tItem.id === id
            ? toggleTaskCompletionForDate(tItem, done, targetDateISO)
            : tItem
        ),
      }));
      if (done) {
        const targetKid = targetTask?.kidId
          ? state.kids.find((k) => k.id === Number(targetTask.kidId))
          : null;
        const remoteChildId = targetTask?.remoteChildId || targetKid?.remoteId;
        const taskCategory = `${targetTask?.category || ''} ${targetTask?.name || ''}`.toLowerCase();
        const lifeRecordType: ChildLifeRecordType = /نوم|sleep|قيلولة/.test(taskCategory)
          ? 'sleep_log'
          : /أكل|طعام|شرب|وجبة|food|meal|nutrition|water/.test(taskCategory)
          ? 'nutrition'
          : /رياضة|حركة|sport|exercise|نشاط بدني/.test(taskCategory)
          ? 'sports'
          : /تعلم|دراسة|واجب|قراءة|education|study|homework/.test(taskCategory)
          ? 'education'
          : 'routine';
        if (
          !isPreviewMode &&
          !alreadyRecordedInHistory &&
          targetTask &&
          typeof remoteChildId === 'string' &&
          isValidUuid(remoteChildId)
        ) {
          const savedRecord = await createChildLifeRecord({
            childId: remoteChildId,
            recordType: lifeRecordType,
            title: `اكتملت مهمة: ${targetTask.name}`,
            notes: `تم تسجيل إكمال المهمة من الروتين اليومي · ${targetTask.category || 'روتين يومي'}`,
            occurredAt: new Date().toISOString(),
            details: {
              source: 'daily_routine',
              routineTaskId: targetTask.id,
              completedDate: targetDateISO,
              category: targetTask.category,
              scheduledTime: targetTask.time,
            },
          });
          if (savedRecord.error) {
            showToast(`تم تحديث الروتين، لكن تعذر حفظه في حكاية الطفل: ${savedRecord.error}`);
          }
        }
        setFestivalCelebration({
          id: Date.now(),
          titleAr: targetTask ? `برافو! اكتملت مهمة «${targetTask.name}» ✨` : 'برافو! اكتملت المهمة بنجاح ✨',
          titleEn: targetTask ? `Awesome! Completed "${targetTask.name}" ✨` : 'Awesome! Task completed ✨',
          subtitleAr: targetKid
            ? `👑 نجمة اليوم مضافة لـ ${targetKid.name}`
            : '🌟 خطوة جميلة في روتين العيلة اليوم',
          subtitleEn: targetKid
            ? `👑 Star of the Day milestone for ${targetKid.name}`
            : '🌟 Another great family milestone today',
        });
      }
    } finally {
      if (done) savingRoutineTaskIdsRef.current.delete(id);
    }
  };

  const handleDeleteTask = (id: number) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((tItem) => tItem.id !== id),
    }));
    showToast('تم حذف المهمة');
  };

  const handleResetTasks = () => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((tItem) =>
        toggleTaskCompletionForDate(tItem, false, todayISO)
      ),
    }));
    showToast('تمت إعادة ضبط حالة مهام اليوم');
  };

  // Calendar Event CRUD
  const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = sanitizeUserText(String(fd.get('title') || ''), 160);
    const date = String(fd.get('date') || '').trim();
    const time = sanitizeUserText(String(fd.get('time') || ''), 40);
    const type = sanitizeUserText(String(fd.get('type') || 'موعد عائلي'), 60);
    const childIdRaw = String(fd.get('childId') || '');
    const childId = childIdRaw ? Number(childIdRaw) : null;
    const repeatRaw = String(fd.get('repeat') || 'none');
    const repeat =
      repeatRaw === 'weekly' || repeatRaw === 'monthly' || repeatRaw === 'yearly'
        ? repeatRaw
        : 'none';
    const note = sanitizeUserText(String(fd.get('note') || ''), 300);

    if (!title) {
      showToast('اكتب اسم الحدث قبل الحفظ');
      return;
    }
    if (!date) {
      showToast('اختار تاريخ الحدث');
      return;
    }

    setState((prev) => {
      if (editingEvent) {
        return {
          ...prev,
          events: prev.events.map((ev) =>
            ev.id === editingEvent.id
              ? { ...ev, title, date, time, type, childId, repeat, note }
              : ev
          ),
        };
      }
      return {
        ...prev,
        events: [
          ...prev.events,
          {
            id: Date.now() + Math.floor(Math.random() * 100),
            title,
            date,
            time,
            type,
            childId,
            repeat,
            note,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    setEventModalOpen(false);
    setEditingEvent(null);
    showToast('تم حفظ الحدث على هذا الجهاز');
  };

  const handleDeleteEvent = (id: number) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((ev) => ev.id !== id),
    }));
    showToast('تم حذف الحدث من التقويم');
  };

  const handleSetEventRange = (days: number) => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    setEventFrom(dateLocalISO(start));
    setEventTo(dateLocalISO(end));
  };

  // Wishes CRUD
  const handleSaveWish = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = sanitizeUserText(String(fd.get('name') || ''), 160);
    const price = Number(fd.get('price'));
    const kid = Number(fd.get('kid'));
    const progress = Number(fd.get('progress') ?? 40);
    const goalType = sanitizeUserText(String(fd.get('goalType') || 'هدية / أمنية'), 80);
    const emoji = sanitizeUserText(String(fd.get('emoji') || '🎁'), 16);

    const validation = validateWishInput({ name, price, kid, progress }, state.kids);
    if (!validation.valid) {
      showToast(validation.error || 'بيانات غير صالحة');
      return;
    }

    setState((prev) => {
      if (editingWish) {
        return {
          ...prev,
          wishes: prev.wishes.map((w) =>
            w.id === editingWish.id
              ? { ...w, name, price, kid, progress, goalType, emoji, currency: prev.currency }
              : w
          ),
        };
      }
      return {
        ...prev,
        wishes: [
          ...prev.wishes,
          {
            id: Date.now() + Math.floor(Math.random() * 100),
            name,
            kid,
            price,
            currency: prev.currency,
            emoji,
            reserved: false,
            progress,
            goalType,
          },
        ],
      };
    });

    setWishModalOpen(false);
    setEditingWish(null);
    showToast(editingWish ? 'تم تحديث الأمنية' : 'تمت إضافة الأمنية');
  };

  const handleQuickAddWish = (name: string, priceEGP: number, priceSAR: number, emoji: string) => {
    if (!state.kids.length) {
      showToast('أضف ملف طفل أولًا لإضافة أمنية');
      return;
    }
    const price = convertCatalogPrice(priceEGP, priceSAR, state.currency);
    setState((prev) => ({
      ...prev,
      wishes: [
        ...prev.wishes,
        {
          id: Date.now() + Math.floor(Math.random() * 100),
          name,
          kid: prev.kids[0].id,
          price,
          currency: prev.currency,
          emoji,
          reserved: false,
          progress: 35,
          goalType: 'من المتجر والأفكار',
        },
      ],
    }));
    showToast(`تمت إضافة "${name}" إلى قائمة أمنيات ${state.kids[0].name}`);
  };

  const handleToggleWishReserve = (id: number) => {
    const targetWish = state.wishes.find((w) => w.id === id);
    const becomingReserved = targetWish ? !targetWish.reserved : false;
    setState((prev) => ({
      ...prev,
      wishes: prev.wishes.map((w) =>
        w.id === id
          ? { ...w, reserved: !w.reserved, progress: !w.reserved ? 100 : w.progress }
          : w
      ),
    }));
    if (becomingReserved && targetWish) {
      setFestivalCelebration({
        id: Date.now(),
        titleAr: `احتفال العيلة! اكتملت أمنية «${targetWish.name}» 🎁`,
        titleEn: `Family Goal Reached! "${targetWish.name}" Fulfilled 🎁`,
        subtitleAr: '🌟 فرحة جديدة مضافة لأهداف الأطفال',
        subtitleEn: '🌟 A joyful family goal achieved together',
      });
    } else {
      showToast('تم تحديث حالة حجز الأمنية');
    }
  };

  const handleUpdateWishProgress = (id: number, delta: number) => {
    const targetWish = state.wishes.find((w) => w.id === id);
    const prevProg = targetWish?.progress || 0;
    const nextProg = Math.max(0, Math.min(100, prevProg + delta));
    setState((prev) => ({
      ...prev,
      wishes: prev.wishes.map((w) => {
        if (w.id !== id) return w;
        return { ...w, progress: nextProg, reserved: nextProg === 100 ? true : w.reserved };
      }),
    }));
    if (prevProg < 100 && nextProg === 100 && targetWish) {
      setFestivalCelebration({
        id: Date.now(),
        titleAr: `مبروك! اكتمل ادخار أمنية «${targetWish.name}» ١٠٠٪ 🎉`,
        titleEn: `100% Goal Reached for "${targetWish.name}"! 🎉`,
        subtitleAr: '👑 إنجاز عائلي رائع النهارده',
        subtitleEn: '👑 Wonderful family savings milestone',
      });
    }
  };

  const handleDeleteWish = (id: number) => {
    setState((prev) => ({
      ...prev,
      wishes: prev.wishes.filter((w) => w.id !== id),
    }));
    showToast('تم حذف الأمنية');
  };

  // Shopping Cart & Simulated Checkout Handlers
  const handleAddToCart = (item: CommercialCatalogItem, variant?: string) => {
    setState((prev) => {
      const existing = prev.cart.find((c) => c.productId === item.id);
      const nextCart = existing
        ? prev.cart.map((c) =>
            c.productId === item.id ? { ...c, quantity: Math.min(20, c.quantity + 1) } : c
          )
        : [
            ...prev.cart,
            {
              productId: item.id,
              quantity: 1,
              selectedVariant: variant || item.variants?.[0],
            },
          ];
      return { ...prev, cart: nextCart };
    });
    showToast(
      lang === 'en'
        ? `Added "${item.nameEn}" to your family cart`
        : `أُضيف «${item.name}» إلى سلة التسوق`
    );
  };

  const handleUpdateCartQuantity = (productId: number, delta: number) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart
        .map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    }));
  };

  const handleRemoveFromCart = (productId: number) => {
    setState((prev) => ({
      ...prev,
      cart: prev.cart.filter((c) => c.productId !== productId),
    }));
  };

  const handleCompleteDemoCheckout = (order: DemoOrder) => {
    if (!isPreviewMode) {
      showToast(lang === 'en' ? 'Demo checkout is available only in preview mode.' : 'إتمام الطلب التجريبي متاح في وضع المعاينة فقط.');
      return;
    }
    if (!order.items.length || order.items.some((item) => !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      showToast(lang === 'en' ? 'The order details are invalid. Please review your cart.' : 'بيانات الطلب غير مكتملة أو غير صحيحة. راجع السلة وحاول مرة أخرى.');
      return;
    }

    setState((prev) => ({
      ...prev,
      cart: [],
      orders: [order, ...prev.orders],
    }));
  };

  const handleCompleteDemoServiceBooking = (booking: DemoServiceBooking) => {
    if (!isPreviewMode) {
      showToast(lang === 'en' ? 'Demo service bookings are available only in preview mode.' : 'حجوزات الخدمات التجريبية متاحة في وضع المعاينة فقط.');
      return;
    }
    if (!booking.id || !booking.serviceId || !booking.serviceName.trim() || !booking.beneficiary.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(booking.date) || !/^\d{2}:\d{2}$/.test(booking.time) || !Number.isFinite(booking.price) || booking.price < 0) {
      showToast(lang === 'en' ? 'The booking details are incomplete. Please review the form.' : 'بيانات الحجز غير مكتملة. راجع النموذج وحاول مرة أخرى.');
      return;
    }
    setState((prev) => ({
      ...prev,
      serviceBookings: [booking, ...prev.serviceBookings.filter((existing) => existing.id !== booking.id)],
    }));
  };

  // Family Members & Permissions
  const handleSavePerson = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = sanitizeUserText(String(fd.get('name') || ''), 80);
    if (!name) {
      showToast('اكتب اسم الفرد قبل الإضافة');
      return;
    }
    const role = sanitizeUserText(String(fd.get('role') || 'فرد آخر'), 60) || 'فرد آخر';
    const side = sanitizeUserText(String(fd.get('side') || 'الأسرة الأساسية'), 60) || 'الأسرة الأساسية';
    const isCore = role === 'الأب' || role === 'الأم';
    const basePerms = getDefaultPermissions(isCore);
    const perms = state.disputeFreezeActive
      ? { ...basePerms, health: false, privatePhotos: false }
      : basePerms;

    setState((prev) => ({
      ...prev,
      family: [
        ...prev.family,
        {
          id: Date.now() + Math.floor(Math.random() * 100),
          name,
          role,
          side,
          emoji: role.includes('جد') ? '👵🏻' : '👤',
          wishes: perms.wishes,
          events: perms.calendar,
          assignedKidIds: prev.kids.map((k) => k.id),
          permissions: perms,
        },
      ],
    }));
    setPersonModalOpen(false);
    showToast('أُضيف الفرد محليًا، لم تُرسل دعوة فعلية');
  };

  const handleSaveMemberPermissions = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!permModalMember) return;
    const fd = new FormData(e.currentTarget);
    const updatedPerms = {
      profile: fd.get('profile') === 'on',
      routine: fd.get('routine') === 'on',
      calendar: fd.get('calendar') === 'on',
      wishes: fd.get('wishes') === 'on',
      growth: fd.get('growth') === 'on',
      receiveReminders: fd.get('receiveReminders') === 'on',
      submitCareUpdates: fd.get('submitCareUpdates') === 'on',
      emergencyAccess: fd.get('emergencyAccess') === 'on',
      viewEducational: fd.get('viewEducational') === 'on',
      uploadReports: fd.get('uploadReports') === 'on',
      health: state.disputeFreezeActive ? false : fd.get('health') === 'on',
      privatePhotos: state.disputeFreezeActive ? false : fd.get('privatePhotos') === 'on',
    };

    setState((prev) => ({
      ...prev,
      family: prev.family.map((m) =>
        m.id === permModalMember.id
          ? {
              ...m,
              wishes: updatedPerms.wishes,
              events: updatedPerms.calendar,
              permissions: updatedPerms,
            }
          : m
      ),
    }));
    setPermModalMember(null);
    showToast('تم تحديث صلاحيات الفرد محليًا');
  };

  const handleDeletePerson = (id: number) => {
    setState((prev) => ({
      ...prev,
      family: prev.family.filter((m) => m.id !== id),
    }));
    showToast('تمت إزالة الفرد من قائمة العائلة');
  };

  // Settings & Internationalization handlers
  const handleCountryChangeInSettings = (nextCountry: CountryCode) => {
    setSettingsCountry(nextCountry);
    const defaultCity =
      COUNTRY_CITIES_MAP[nextCountry]?.[0]?.id || getDefaultCityForCountry(nextCountry);
    setSettingsCity(defaultCity);
    const suggested = getSuggestedCurrencyForCountry(nextCountry);
    if (settingsCurrency !== suggested) {
      setCurrencySuggestionBanner(suggested);
    } else {
      setCurrencySuggestionBanner(null);
    }
  };

  const handleSaveGeneralSettings = () => {
    const isDad = settingsRole === 'dad';
    setState((prev) => ({
      ...prev,
      parentName: settingsParentName.trim() || prev.parentName || (isDad ? 'الأب' : 'الأم'),
      role: settingsRole,
      activeParentAccount: isDad ? 'father' : 'mother',
      language: settingsLanguage,
      calendarMode: settingsCalendarMode,
    }));
    showToast(
      lang === 'en'
        ? 'Experience & language preferences saved'
        : 'تم حفظ تفضيلات التجربة واللغة والتقويم'
    );
  };

  const handleSaveBottomInternationalAndPhone = async () => {
    const currentParent = state.parentAccounts[state.activeParentAccount];
    const personalCountry = resolveCountryCode(currentParent.country, state.country);
    const phoneCheck = validatePhoneForCountry(settingsPhoneInput, personalCountry);
    if (!phoneCheck.valid) {
      showToast(
        lang === 'en'
          ? phoneCheck.errorEn || 'Invalid phone number'
          : phoneCheck.errorAr || 'رقم الهاتف غير صالح'
      );
      return;
    }

    const phoneOrCountryChanged = phoneCheck.normalized !== currentParent.phoneNumber;

    if (phoneOrCountryChanged && !settingsOtpStep && !isPreviewMode) {
      setSettingsOtpStep(true);
      showToast(
        lang === 'en'
          ? 'Please enter the mobile verification code (OTP) to confirm changes.'
          : 'يرجى إدخال رمز التحقق المرسل للجوال (OTP) لتأكيد التحديث.'
      );
      return;
    }

    let genuinePhoneVerified = Boolean(
      recognizedProfile?.phoneVerified && !phoneOrCountryChanged
    );

    if (settingsOtpStep && !isPreviewMode) {
      if (!settingsOtpCode.trim() || settingsOtpCode.trim().length < 4) {
        showToast(
          lang === 'en'
            ? 'Please enter the OTP verification code.'
            : 'يرجى إدخال رمز التحقق.'
        );
        return;
      }

      const verifyRes = await verifyAccountIdentityOtpInSupabase({
        email: currentParent.email,
        phone: phoneCheck.fullInternational,
        token: settingsOtpCode.trim(),
        type: 'sms',
      });

      if (verifyRes.verified && verifyRes.phoneVerified) {
        genuinePhoneVerified = true;
      } else if (settingsOtpCode.trim() !== DEMO_OTP_CODE) {
        showToast(
          verifyRes.error ||
            (lang === 'en'
              ? 'Incorrect OTP verification code. Please check and try again.'
              : 'رمز التحقق غير صحيح. يرجى التأكد والمحاولة مرة أخرى.')
        );
        return;
      }
    }

    setState((prev) => {
      const pid = prev.activeParentAccount;
      return {
        ...prev,
        country: settingsCountry,
        city: settingsCity,
        currency: settingsCurrency,
        shippingAddress: {
          ...prev.shippingAddress,
          city: settingsCity,
        },
        parentAccounts: {
          ...prev.parentAccounts,
          [pid]: {
            ...prev.parentAccounts[pid],
            phoneCode: getCountryDialCode(personalCountry),
            phoneNumber: phoneCheck.normalized,
            // Never mark phoneVerified true unless genuinely confirmed by Supabase Auth!
            phoneVerified: genuinePhoneVerified,
          },
        },
      };
    });
    setSettingsOtpStep(false);
    setSettingsOtpCode('');
    setCurrencySuggestionBanner(null);
    showToast(
      genuinePhoneVerified
        ? lang === 'en'
          ? 'Settings updated and phone number verified.'
          : 'تم تحديث الإعدادات والتحقق من رقم الجوال بنجاح.'
        : lang === 'en'
        ? 'Settings saved on this device. Phone verification is still pending.'
        : 'تم حفظ الإعدادات على هذا الجهاز. لم يكتمل التحقق من رقم الجوال بعد.'
    );
  };

  const handleExportJson = () => {
    if (exportFamilySpaceJsonBackup(state, todayISO)) {
      showToast('بدأ تنزيل نسخة بياناتك الاحتياطية بصيغة JSON');
    } else {
      showToast('تعذر تصدير البيانات من هذا المتصفح');
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const result = validateImportedJson(text);
      if (!result.valid || !result.data) {
        showToast(result.error || 'ملف غير صالح');
        return;
      }
      setState(result.data);
      showToast('تم استيراد البيانات والتحقق من سلامتها بنجاح');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSignOut = () => {
    previewModeRef.current = false;
    setIsPreviewMode(false);
    OnboardingFlowController.clearSession();
    master.controller.resetSessionState();
    setRecognizedProfile(null);
    setActiveFamilyStorageScope(null);
    setHydratedFamilyStorageScope(null);
    setState(createEmptyFamilySpaceState());
    setRoleModalOpen(false);
    setChildModalOpen(false);
    setOnboardingModalOpen(true);
    setActivePage('home');
  };

  const handleResetAllData = () => {
    OnboardingFlowController.clearSession();
    setRecognizedProfile(null);
    setActiveFamilyStorageScope(null);
    setHydratedFamilyStorageScope(null);
    const fresh = createEmptyFamilySpaceState();
    resetFamilySpaceState();
    setState(fresh);
    setConfirmResetModal(false);
    showToast('تمت استعادة البيانات الافتراضية للنموذج');
  };

  const kidMap = useMemo(
    () => Object.fromEntries(state.kids.map((k) => [String(k.id), k])),
    [state.kids]
  );

  const effectiveNowMinutes = useMemo(() => {
    if (routineRefTimePreset === '07:15') return 7 * 60 + 15;
    if (routineRefTimePreset === '15:45') return 15 * 60 + 45;
    if (routineRefTimePreset === '18:20') return 18 * 60 + 20;
    if (routineRefTimePreset === '20:30') return 20 * 60 + 30;
    return liveClockMinutes;
  }, [routineRefTimePreset, liveClockMinutes]);

  const routineRemindersSummary = useMemo(
    () =>
      getRoutineRemindersSummary(
        state.tasks,
        effectiveNowMinutes,
        routineApproachingWindow,
        state.language
      ),
    [state.tasks, effectiveNowMinutes, routineApproachingWindow, state.language]
  );

  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      if (!isTaskVisibleForParentSession(task, state.activeParentAccount)) {
        return false;
      }
      if (routineKidFilter !== 'all' && String(task.kidId || '') !== routineKidFilter) {
        return false;
      }
      if (routineStatusFilter === 'done' && !task.done) return false;
      if (routineStatusFilter === 'open' && task.done) return false;
      if (routineCadenceFilter !== 'all' && task.cadence !== routineCadenceFilter) return false;
      if (routineReminderFilter !== 'all') {
        const rem = getRoutineTaskReminder(
          task,
          effectiveNowMinutes,
          routineApproachingWindow,
          state.language
        );
        if (routineReminderFilter === 'alerts' && !rem.isAlert) return false;
        if (routineReminderFilter === 'overdue' && rem.status !== 'overdue') return false;
        if (routineReminderFilter === 'approaching' && rem.status !== 'approaching') return false;
      }
      return true;
    });
  }, [
    state.tasks,
    state.activeParentAccount,
    routineKidFilter,
    routineStatusFilter,
    routineCadenceFilter,
    routineReminderFilter,
    effectiveNowMinutes,
    routineApproachingWindow,
    state.language,
  ]);

  const renderReminderBadge = (reminder: TaskReminderInfo, compact = false) => {
    if (reminder.status === 'overdue') {
      return (
        <span
          data-reminder-badge="overdue"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-800 border border-red-200 whitespace-nowrap shrink-0"
        >
          <span>{reminder.badgeLabel}</span>
          {!compact && <span className="font-normal opacity-90">· {reminder.detailLabel}</span>}
        </span>
      );
    }
    if (reminder.status === 'approaching') {
      return (
        <span
          data-reminder-badge="approaching"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 whitespace-nowrap shrink-0"
        >
          <span>{reminder.badgeLabel}</span>
          {!compact && <span className="font-normal opacity-90">· {reminder.detailLabel}</span>}
        </span>
      );
    }
    if (reminder.status === 'scheduled') {
      return (
        <span
          data-reminder-badge="scheduled"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[var(--color-control-muted)] text-[var(--color-muted)] whitespace-nowrap shrink-0"
        >
          <span>{reminder.badgeLabel}</span>
          {!compact && <span className="font-normal">({reminder.detailLabel})</span>}
        </span>
      );
    }
    if (reminder.status === 'completed') {
      return (
        <span
          data-reminder-badge="completed"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0"
        >
          {reminder.badgeLabel}
        </span>
      );
    }
    return null;
  };

  // Filtered events for Calendar screen
  const isEventRangeReversed = Boolean(eventFrom && eventTo && eventFrom > eventTo);
  const filteredEvents = useMemo(() => {
    if (isEventRangeReversed) return [];
    return [...state.events]
      .filter((ev) => (!eventFrom || ev.date >= eventFrom) && (!eventTo || ev.date <= eventTo))
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  }, [state.events, eventFrom, eventTo, isEventRangeReversed]);

  // Filtered wishes
  const filteredWishes = useMemo(() => {
    if (wishKidTab === 'all') return state.wishes;
    return state.wishes.filter((w) => String(w.kid) === wishKidTab);
  }, [state.wishes, wishKidTab]);

  const navItems: {
    id: PageId;
    label: string;
    shortLabel: string;
    iconId: ThreeDIconId;
  }[] = [
    { id: 'home', label: lang === 'en' ? '1. Home' : '١. الرئيسية', shortLabel: lang === 'en' ? 'Home' : 'الرئيسية', iconId: 'home' },
    { id: 'assistant', label: lang === 'en' ? '2. AI Assistant' : '٢. مساعد نكبر الذكي', shortLabel: lang === 'en' ? 'AI Agent' : 'مساعد نكبر الذكي', iconId: 'assistant' },
    { id: 'children', label: lang === 'en' ? '3. Our Kids 3D' : '٣. ملفات الأطفال والنمو', shortLabel: lang === 'en' ? 'Kids 3D' : 'أولادنا 3D', iconId: 'children' },
    { id: 'routine', label: lang === 'en' ? '4. Daily Routine' : '٤. الروتين والمهام', shortLabel: lang === 'en' ? 'Routine' : 'الروتين اليومي', iconId: 'routine' },
    { id: 'services', label: lang === 'en' ? '5. Quick Store' : '٥. المتجر والاحتياجات', shortLabel: lang === 'en' ? 'Store' : 'المتجر السريع', iconId: 'services' },
    { id: 'calendar', label: lang === 'en' ? '6. Calendar & Events' : '٦. المواعيد والتذكيرات', shortLabel: lang === 'en' ? 'Calendar' : 'التقويم والمواعيد', iconId: 'calendar' },
    { id: 'medical', label: lang === 'en' ? '7. Doctor & Clinic' : '٧. الصحة والأطباء', shortLabel: lang === 'en' ? 'Clinic' : 'الدكتور والعيادة', iconId: 'health' },
    { id: 'media', label: lang === 'en' ? '8. Parenting Reels & Videos' : '٨. المحتوى والفيديوهات', shortLabel: lang === 'en' ? 'Reels' : 'ريلز التربية', iconId: 'video' },
    { id: 'community', label: lang === 'en' ? '9. Parents Gathering' : '٩. مجتمع الأهل', shortLabel: lang === 'en' ? 'Community' : 'لمة الآباء', iconId: 'star' },
    { id: 'chat', label: lang === 'en' ? '10. Family Chat' : '١٠. محادثات الأسرة', shortLabel: lang === 'en' ? 'Chat' : 'شات العيلة', iconId: 'shield' },
    { id: 'family', label: lang === 'en' ? '11. Family & Permissions' : '١١. أفراد الأسرة والصلاحيات', shortLabel: lang === 'en' ? 'Family' : 'عيلتنا والصلاحيات', iconId: 'family' },
    { id: 'settings', label: lang === 'en' ? '12. Settings & Control' : '١٢. الإعدادات', shortLabel: lang === 'en' ? 'Settings' : 'الإعدادات والتحكم', iconId: 'settings' },
    { id: 'wishes', label: t(lang, 'navWishes'), shortLabel: lang === 'en' ? 'Wishes' : 'الأمنيات', iconId: 'wishes' },
    { id: 'games', label: t(lang, 'navGames'), shortLabel: lang === 'en' ? '3D Games' : 'الألعاب', iconId: 'games' },
    { id: 'notifications', label: t(lang, 'navNotifications'), shortLabel: lang === 'en' ? 'Alerts' : 'الإشعارات', iconId: 'notifications' },
  ];

  const childToDelete = useMemo(
    () => (confirmDeleteChildId !== null ? state.kids.find((k) => k.id === confirmDeleteChildId) : null),
    [confirmDeleteChildId, state.kids]
  );
  const childDeleteSummary = useMemo(
    () => (confirmDeleteChildId !== null ? getChildDeletionSummary(state, confirmDeleteChildId) : null),
    [confirmDeleteChildId, state]
  );

  const parentProfileSpec = getParentProfileThemeSpec(
    state.role,
    state.parentName,
    state.darkMode
  );

  const handleAddVoiceMomentToChild = (kidId: number, moment: VoiceVaultMoment) => {
    setState((prev) => ({
      ...prev,
      kids: prev.kids.map((k) =>
        k.id === kidId
          ? {
              ...k,
              voiceMoments: [moment, ...(k.voiceMoments || [])],
            }
          : k
      ),
    }));
    showToast(
      lang === 'en'
        ? `🎙️ Saved 10s voice memory "${moment.title}" to child vault!`
        : `🎙️ تم حفظ اللقطة الصوتية «${moment.title}» في خزينة الطفل!`
    );
  };

  const isDashboardUnlocked = PREVIEW_ACCESS_BYPASS || isPreviewMode || hasVerifiedFamilyAccess(recognizedProfile);

  return (
    <FamilyAppProvider
      value={{
        state,
        setState,
        activePage,
        navigateTo,
        showToast,
      }}
    >
      <div
        data-testid="mobile-app-viewport-frame"
        className="mobile-app-shell max-w-[430px] mx-auto min-h-dvh w-full pt-safe pb-safe bg-slate-50 dark:bg-gray-900 shadow-2xl border-x border-gray-200/80 dark:border-[#1E3646] relative flex flex-col justify-start overflow-x-hidden pb-24 transition-all duration-300 ease-in-out"
      >
        {(PREVIEW_ACCESS_BYPASS || isPreviewMode) && (
          <div
            role="status"
            className="mx-3 mt-2 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-sky-50 px-3 py-2.5 text-center text-[11px] font-bold text-teal-900 shadow-sm dark:border-teal-800 dark:from-[#102b30] dark:via-[#12232b] dark:to-[#102c3b] dark:text-teal-100"
          >
            <div>
              {lang === 'en'
                ? 'Preview mode · Sample data only · Changes are not saved to a real family account'
                : 'وضع المراجعة · بيانات تجريبية فقط · التغييرات لا تُحفظ على حساب أسرة حقيقي'}
            </div>
            {isPreviewMode && (
              <button
                type="button"
                data-testid="preview-return-to-login-btn"
                onClick={() => {
                  previewModeRef.current = false;
                  setIsPreviewMode(false);
                  setState(createEmptyFamilySpaceState());
                  setOnboardingModalOpen(true);
                  setActivePage('home');
                }}
                className="mt-1.5 min-h-[36px] px-4 rounded-full border border-teal-700/20 bg-white/80 text-teal-800 font-extrabold dark:bg-[#183941] dark:text-teal-100"
              >
                {lang === 'en' ? 'Return to sign in' : 'العودة لتسجيل الدخول'}
              </button>
            )}
          </div>
        )}
        {isDashboardUnlocked && (
          <>
            <HeaderBar
              lang={lang}
              brandName={t(lang, 'brandName')}
              darkMode={Boolean(state.darkMode)}
              unreadNotifCount={unreadNotifCount}
              openTasksCount={state.tasks.filter((tItem) => !tItem.done).length}
              parentProfileSpec={{
                role: parentProfileSpec.role,
                displayNameAr: parentProfileSpec.displayNameAr,
                displayNameEn: parentProfileSpec.displayNameEn,
                badgeBgCss: parentProfileSpec.badgeBgCss,
                badgeTextCss: parentProfileSpec.badgeTextCss,
                badgeBorderCss: parentProfileSpec.badgeBorderCss,
              }}
              activePage={activePage}
              navItems={navItems.map((n) => ({ id: n.id, shortLabel: n.shortLabel }))}
              onNavigate={navigateTo}
              onToggleDarkMode={handleToggleDarkMode}
              onToggleLanguage={handleToggleTopLanguage}
              onOpenSmartPlanner={() => setSmartPlannerModalOpen(true)}
              onOpenProfileDrawer={() => setRoleModalOpen(true)}
              isScrolled={isScrolled}
              bedtimeMode={bedtimeMode}
              onToggleBedtimeMode={handleToggleBedtimeMode}
              country={activeParentCountry}
              city={activeParentCity}
              userCoords={userCoords}
              onSelectCity={(cCode, cName) => handleSelectPreciseCity(`${cCode}:${cName}`)}
            />

            {/* Main Mobile Workspace Container */}
            <div className="w-full max-w-[430px] mx-auto px-3 pt-2.5 pb-28 flex-1">
              {/* Main Viewport */}
              <main key={activePage} className="min-w-0 space-y-4 animate-page-enter transition-all duration-300 ease-in-out">
            {/* Unified Top App Bar with Functional Back Button for Sub-Pages Only (not Main Dock Sections) */}
            {(() => {
              const innerScreenMeta: Partial<
                Record<
                  PageId,
                  {
                    titleAr: string;
                    titleEn: string;
                    badgeAr: string;
                    badgeEn: string;
                    iconId: ThreeDIconId;
                    tone: keyof typeof PASTEL_CARD_TONES;
                    parentPage: PageId;
                    parentLabelAr: string;
                    parentLabelEn: string;
                  }
                >
              > = {
                children: {
                  titleAr: 'ملفات الأطفال',
                  titleEn: 'Child Profiles',
                  badgeAr: `${state.kids.length} ملف`,
                  badgeEn: `${state.kids.length} Profiles`,
                  iconId: 'children',
                  tone: 'teal',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                calendar: {
                  titleAr: 'تقويم الأسرة',
                  titleEn: 'Family Calendar',
                  badgeAr: `${state.events.length} موعد`,
                  badgeEn: `${state.events.length} Events`,
                  iconId: 'calendar',
                  tone: 'cyan',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                wishes: {
                  titleAr: 'أمنيات الأطفال',
                  titleEn: 'Kids’ Wishes',
                  badgeAr: `${state.wishes.length} أمنيات`,
                  badgeEn: `${state.wishes.length} Wishes`,
                  iconId: 'wishes',
                  tone: 'pink',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                games: {
                  titleAr: 'ألعاب الأطفال',
                  titleEn: 'Kids’ Games',
                  badgeAr: 'تعلم باللعب',
                  badgeEn: 'Learn Through Play',
                  iconId: 'games',
                  tone: 'lime',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                family: {
                  titleAr: 'أفراد الأسرة والصلاحيات',
                  titleEn: 'Family & Permissions',
                  badgeAr: `${state.family.length} أفراد`,
                  badgeEn: `${state.family.length} Members`,
                  iconId: 'family',
                  tone: 'purple',
                  parentPage: 'settings',
                  parentLabelAr: 'رجوع للحساب',
                  parentLabelEn: 'Back',
                },
                notifications: {
                  titleAr: 'التنبيهات',
                  titleEn: 'Notifications',
                  badgeAr: `${unreadNotifCount} غير مقروءة`,
                  badgeEn: `${unreadNotifCount} Unread`,
                  iconId: 'notifications',
                  tone: 'sky',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                privacy: {
                  titleAr: 'سياسة الخصوصية',
                  titleEn: 'Privacy Policy',
                  badgeAr: 'خصوصية الأسرة',
                  badgeEn: 'Family Privacy',
                  iconId: 'shield',
                  tone: 'teal',
                  parentPage: 'settings',
                  parentLabelAr: 'رجوع للحساب',
                  parentLabelEn: 'Back',
                },
                terms: {
                  titleAr: 'الشروط وحقوق الملكية',
                  titleEn: 'Terms & Ownership',
                  badgeAr: 'الشروط والسياسات',
                  badgeEn: 'Terms & Policies',
                  iconId: 'star',
                  tone: 'indigo',
                  parentPage: 'settings',
                  parentLabelAr: 'رجوع للحساب',
                  parentLabelEn: 'Back',
                },
                contact: {
                  titleAr: 'المساعدة والتواصل',
                  titleEn: 'Help & Contact',
                  badgeAr: 'قنوات الدعم الرقمي الرسمية',
                  badgeEn: 'Official Digital Support',
                  iconId: 'notifications',
                  tone: 'orange',
                  parentPage: 'settings',
                  parentLabelAr: 'رجوع للحساب',
                  parentLabelEn: 'Back',
                },
              };

              const currentInner = innerScreenMeta[activePage];
              if (!currentInner) return null;

              return (
                <InnerScreenTopBar
                  title={lang === 'en' ? currentInner.titleEn : currentInner.titleAr}
                  badge={lang === 'en' ? currentInner.badgeEn : currentInner.badgeAr}
                  iconId={currentInner.iconId}
                  tone={currentInner.tone}
                  language={state.language}
                  backLabel={lang === 'en' ? currentInner.parentLabelEn : currentInner.parentLabelAr}
                  onBack={() => navigateTo(currentInner.parentPage)}
                />
              );
            })()}

            {/* SUPABASE NETWORK ERROR FALLBACK BANNER */}
            {supabaseStatus === 'error' && supabaseErrorMsg && (
              <div
                role="status"
                aria-live="polite"
                data-testid="supabase-fallback-banner"
                className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-50/90 dark:bg-[#142430] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-amber-900 dark:text-amber-200 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-base">☁️</span>
                  <span>
                    {lang === 'en'
                      ? 'Working in offline-safe mode with local family profiles (Ahmad, Maryam, Hamza, Laila & Youssef).'
                      : 'يعمل التطبيق حالياً بالنسخة المحلية الآمنة لملفات العائلة (أحمد، مريم، حمزة، ليلى، ويوسف) لحين استعادة الاتصال.'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadFromSupabase}
                    className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-extrabold transition cursor-pointer"
                  >
                    {lang === 'en' ? 'Retry Sync' : 'إعادة المزامنة'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSupabaseErrorMsg(null)}
                    aria-label={lang === 'en' ? 'Dismiss notice' : 'إغلاق التنبيه'}
                    className="min-h-[48px] min-w-[48px] px-2 py-1 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-500/15 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* COMPACT ACCOUNT QUICK BAR */}
            {activePage === 'home' && showSmartGreetingBanner && (
              <div
                data-testid="smart-startup-profile-banner"
                className="mb-3 rounded-2xl border border-[#0d9488]/30 bg-teal-500/8 dark:bg-[#142430] px-3 py-2.5 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-[#0d9488] text-white flex items-center justify-center text-sm shadow-2xs shrink-0">
                    {recognizedProfile ? '👋' : '✨'}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC] truncate">
                      {recognizedProfile
                        ? lang === 'en'
                          ? `${recognizedProfile.fullName} · ${locText(recognizedProfile.city, lang)}`
                          : `${recognizedProfile.fullName} · ${recognizedProfile.city}`
                        : lang === 'en'
                        ? `Welcome, ${state.parentName}`
                        : `مرحباً، ${state.parentName}`}
                    </div>
                    <div className="text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] truncate">
                      {recognizedProfile
                        ? lang === 'en'
                          ? `${recognizedProfile.childrenCount} Children · ${
                              recognizedProfile.isCoParentLinked
                                ? 'Co-Parent Linked ✓'
                                : 'Co-Parent Link Available'
                            }`
                          : `${recognizedProfile.childrenCount} أطفال · ${
                              recognizedProfile.isCoParentLinked
                                ? 'تم ربط الشريك ✓'
                                : 'ربط الشريك متاح'
                            }`
                        : lang === 'en'
                        ? 'Complete your family setup'
                        : 'أكمل إعداد ملفات العائلة'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-testid="open-progressive-onboarding-btn"
                    onClick={() => setOnboardingModalOpen(true)}
                    className="h-9 px-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-extrabold transition cursor-pointer"
                  >
                    {recognizedProfile
                      ? lang === 'en'
                        ? 'Account'
                        : 'الحساب'
                      : lang === 'en'
                        ? 'Setup'
                        : 'الإعداد'}
                  </button>
                  {recognizedProfile && (
                    <button
                      type="button"
                      data-testid="sign-out-open-gateway-btn"
                      onClick={() => {
                        OnboardingFlowController.clearSession();
                        setRecognizedProfile(null);
                        setOnboardingModalOpen(true);
                        showToast(
                          lang === 'en'
                            ? 'Signed out successfully.'
                            : 'تم تسجيل الخروج بنجاح.'
                        );
                      }}
                      className="h-9 px-2.5 rounded-xl border border-slate-300 dark:border-[#1E3646] bg-white dark:bg-[#101D26] text-gray-900 dark:text-[#F8FAFC] text-[11px] font-semibold transition cursor-pointer"
                    >
                      {lang === 'en' ? 'Sign Out' : 'خروج'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSmartGreetingBanner(false)}
                    aria-label={lang === 'en' ? 'Dismiss' : 'إخفاء'}
                    className="h-9 w-8 rounded-lg text-xs font-bold text-[var(--color-muted)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* PAGE 1: HOME DASHBOARD */}
            {activePage === 'home' && (
              <HomeDashboardSection
                state={activeParentViewState}
                lang={lang}
                parentProfileSpec={parentProfileSpec}
                cartItemCount={cartItemCount}
                completedTasksCount={completedTasksCount}
                todayFormattedCombined={todayFormatted.combined}
                navigateTo={navigateTo}
                onOpenFamilyPlanner={() => setSmartPlannerModalOpen(true)}
                onAddToCart={handleAddToCart}
                onInspectCommercialItem={(item) => {
                  setSelectedModalVariant(item.variants?.[0] || '');
                  setActiveCommercialModal({ ...item, isDemoData: isPreviewMode });
                }}
                onAddProductToWishes={(item) =>
                  handleQuickAddWish(item.name, item.priceEGP, item.priceSAR, item.emoji)
                }
                onAddSuggestedRoutineTask={(
                  taskName,
                  timeStr,
                  kidId,
                  category = 'روتين يومي',
                  cadence = 'daily',
                  owner = 'مشترك',
                  dayOfWeek = new Date().getDay(),
                  dayOfMonth = new Date().getDate(),
                  daysOfWeek
                ) => {
                  setState((prev) => ({
                    ...prev,
                    tasks: [
                      {
                        id: Date.now() + Math.floor(Math.random() * 100),
                        name: taskName,
                        kidId,
                        category,
                        time: timeStr,
                        owner,
                        cadence,
                        dayOfWeek: cadence === 'weekly' ? dayOfWeek : undefined,
                        daysOfWeek:
                          cadence === 'weekly' && Array.isArray(daysOfWeek) && daysOfWeek.length > 0
                            ? daysOfWeek
                            : undefined,
                        dayOfMonth: cadence === 'monthly' ? dayOfMonth : undefined,
                        done: false,
                        completedDates: [],
                      },
                      ...prev.tasks,
                    ],
                  }));
                  showToast(
                    lang === 'en'
                      ? `Added "${taskName}" to Daily Routine!`
                      : `تمت إضافة «${taskName}» إلى الروتين اليومي!`
                  );
                }}
                onToggleRoutineTask={handleToggleTask}
                onUpdateRoutineTaskOwner={(taskId, owner) => {
                  setState((prev) => ({
                    ...prev,
                    tasks: prev.tasks.map((task) =>
                      task.id === taskId ? { ...task, owner } : task
                    ),
                  }));
                  showToast(
                    lang === 'en'
                      ? 'Task responsibility updated.'
                      : 'تم تحديث المسؤول عن المهمة.'
                  );
                }}
                onEditRoutineTask={(taskId, patch) => {
                  setState((prev) => ({
                    ...prev,
                    tasks: prev.tasks.map((task) => {
                      if (task.id !== taskId) return task;
                      const nextCadence = patch.cadence ?? task.cadence;
                      return {
                        ...task,
                        name: patch.name !== undefined ? sanitizeUserText(patch.name, 180) || task.name : task.name,
                        time: patch.time !== undefined ? sanitizeUserText(patch.time, 40) : task.time,
                        category:
                          patch.category !== undefined
                            ? sanitizeUserText(patch.category, 60) || task.category
                            : task.category,
                        owner:
                          patch.owner !== undefined
                            ? sanitizeUserText(patch.owner, 60) || task.owner
                            : task.owner,
                        kidId: patch.kidId !== undefined ? patch.kidId : task.kidId,
                        cadence: nextCadence,
                        dayOfWeek:
                          nextCadence === 'weekly'
                            ? patch.dayOfWeek ?? task.dayOfWeek ?? new Date().getDay()
                            : undefined,
                        daysOfWeek:
                          nextCadence === 'weekly' ? patch.daysOfWeek ?? task.daysOfWeek : undefined,
                        dayOfMonth:
                          nextCadence === 'monthly'
                            ? patch.dayOfMonth ?? task.dayOfMonth ?? new Date().getDate()
                            : undefined,
                      };
                    }),
                  }));
                }}
                onDeleteRoutineTask={(taskId) => {
                  setState((prev) => ({
                    ...prev,
                    tasks: prev.tasks.filter((task) => task.id !== taskId),
                  }));
                }}
                onRestoreRoutineTask={(restoredTask) => {
                  setState((prev) => {
                    if (prev.tasks.some((tItem) => tItem.id === restoredTask.id)) return prev;
                    return {
                      ...prev,
                      tasks: [restoredTask, ...prev.tasks],
                    };
                  });
                }}
                onChangeChildColorTheme={handleChangeChildColorTheme}
                onOpenEditChild={openEditChild}
                onShowToast={showToast}
                bedtimeMode={bedtimeMode}
                onToggleBedtimeMode={handleToggleBedtimeMode}
                onOpenStoreCategory={(catId: string) => {
                  setStoreInitialCategoryId(catId);
                  setStoreInitialOpenCheckout(false);
                  navigateTo('services');
                }}
                onReplaySplash={handleReplaySplashScreen}
              />
            )}

            {/* PAGE 2: CHILDREN PROFILES & 3D IDENTITY */}
            {activePage === 'children' && (
              <React.Suspense fallback={<SectionSkeletonLoader section="ChildrenProfilesSection" language={state.language} />}><ChildrenProfilesSection
                state={state}
                lang={lang}
                onOpenAddChild={openAddChild}
                onOpenEditChild={openEditChild}
                onConfirmDeleteChild={(kidId) => setConfirmDeleteChildId(kidId)}
                onAddVoiceMoment={handleAddVoiceMomentToChild}
                onChangeChildColorTheme={handleChangeChildColorTheme}
                onShowToast={showToast}
              /></React.Suspense>
            )}

            {/* PAGE 3: DAILY ROUTINE */}
            {activePage === 'routine' && (
              <React.Suspense fallback={<SectionSkeletonLoader section="DailyRoutineSection" language={state.language} />}><DailyRoutineSection
                state={state}
                lang={lang}
                completedTasksCount={completedTasksCount}
                routineReminderFilter={routineReminderFilter}
                setRoutineReminderFilter={setRoutineReminderFilter}
                routineApproachingWindow={routineApproachingWindow}
                setRoutineApproachingWindow={setRoutineApproachingWindow}
                routineRefTimePreset={routineRefTimePreset}
                setRoutineRefTimePreset={setRoutineRefTimePreset}
                routineCadenceFilter={routineCadenceFilter}
                setRoutineCadenceFilter={setRoutineCadenceFilter}
                routineKidFilter={routineKidFilter}
                setRoutineKidFilter={setRoutineKidFilter}
                routineStatusFilter={routineStatusFilter}
                setRoutineStatusFilter={setRoutineStatusFilter}
                routineRemindersSummary={routineRemindersSummary}
                filteredTasks={filteredTasks}
                kidMap={kidMap}
                effectiveNowMinutes={effectiveNowMinutes}
                renderReminderBadge={renderReminderBadge}
                onResetTasks={handleResetTasks}
                onOpenAddTask={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
                onOpenEditTask={(task) => {
                  setEditingTask(task);
                  setTaskModalOpen(true);
                }}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              /></React.Suspense>
            )}

            {/* PAGE 4: FAMILY CALENDAR */}
            {activePage === 'calendar' && (
              <React.Suspense fallback={<SectionSkeletonLoader section="FamilyCalendarSection" language={state.language} />}><FamilyCalendarSection
                state={state}
                lang={lang}
                todayFormattedCombined={todayFormatted.combined}
                eventFrom={eventFrom}
                setEventFrom={setEventFrom}
                eventTo={eventTo}
                setEventTo={setEventTo}
                isEventRangeReversed={isEventRangeReversed}
                filteredEvents={filteredEvents}
                kidMap={kidMap}
                onSetEventRange={handleSetEventRange}
                onChangeCalendarMode={(mode) =>
                  setState((prev) => ({
                    ...prev,
                    calendarMode: mode,
                  }))
                }
                onOpenAddEvent={() => {
                  setEditingEvent(null);
                  setEventModalOpen(true);
                }}
                onOpenEditEvent={(ev) => {
                  setEditingEvent(ev);
                  setEventModalOpen(true);
                }}
                onDeleteEvent={handleDeleteEvent}
              /></React.Suspense>
            )}

            {/* PAGE 5: WISHES & GOALS */}
            {activePage === 'wishes' && (
              <React.Suspense fallback={<SectionSkeletonLoader section="KidsWishesSection" language={state.language} />}><KidsWishesSection
                state={state}
                lang={lang}
                wishKidTab={wishKidTab}
                setWishKidTab={setWishKidTab}
                filteredWishes={filteredWishes}
                kidMap={kidMap}
                onOpenAddWish={() => {
                  if (!state.kids.length) {
                    showToast(
                      lang === 'en' ? 'Please add a child profile first' : 'أضف ملف طفل أولًا'
                    );
                    return;
                  }
                  setEditingWish(null);
                  setWishModalOpen(true);
                }}
                onOpenEditWish={(w) => {
                  setEditingWish(w);
                  setWishModalOpen(true);
                }}
                onUpdateWishProgress={handleUpdateWishProgress}
                onToggleWishReserve={handleToggleWishReserve}
                onDeleteWish={handleDeleteWish}
                onQuickAddWish={handleQuickAddWish}
              /></React.Suspense>
            )}

            {/* PAGE 6A: MEDICAL & CHILD HEALTH HUB */}
            {activePage === 'medical' &&
              (isTabLoading ? (
                <SectionSkeletonLoader section="medical" language={state.language} />
              ) : (
<React.Suspense fallback={<SectionSkeletonLoader section="medical" language={state.language} />}>                <MedicalHealthSection
                  kids={state.kids}
                  doctorsAndClinics={COMMERCIAL_CATALOG.filter(
                    (item) => item.category === 'doctor' || item.category === 'consultation'
                  )}
                  medicalArticles={MEDIA_CONTENT_CATALOG.filter(
                    (item) =>
                      item.topic === 'health' ||
                      item.topic === 'psychology' ||
                      item.topic === 'milestones'
                  )}
                  country={activeParentCountry}
                  city={activeParentCity}
                  currency={activeParentCurrency}
                  language={state.language}
                  savedMediaIds={state.savedMediaIds}
                  darkMode={Boolean(state.darkMode)}
                  onToggleSaveMedia={(id) => {
                    setState((prev) => {
                      const exists = prev.savedMediaIds.includes(id);
                      const next = exists
                        ? prev.savedMediaIds.filter((x) => x !== id)
                        : [...prev.savedMediaIds, id];
                      return { ...prev, savedMediaIds: next };
                    });
                    showToast(
                      lang === 'en'
                        ? 'Updated saved medical guides'
                        : 'تم تحديث قائمة الأدلة الطبية المحفوظة'
                    );
                  }}
                  onBookDoctorAppointment={async (doctorName, childId, date, time, note) => {
                    setState((prev) => ({
                      ...prev,
                      events: [
                        {
                          id: Date.now() + Math.floor(Math.random() * 100),
                          title: `${lang === 'en' ? 'Doctor Visit:' : 'موعد طبي:'} ${doctorName}`,
                          date,
                          time,
                          type: 'موعد طبي',
                          childId,
                          repeat: 'none',
                          note,
                        },
                        ...prev.events,
                      ],
                    }));
                    const appointmentKid = childId === null ? null : state.kids.find((kid) => kid.id === childId);
                    const remoteChildId = appointmentKid?.remoteId;
                    if (!isPreviewMode && typeof remoteChildId === 'string' && isValidUuid(remoteChildId)) {
                      const timeParts = time.match(/(\d{1,2}):(\d{2})/);
                      let appointmentHour = timeParts ? Number(timeParts[1]) : 12;
                      const appointmentMinute = timeParts ? Number(timeParts[2]) : 0;
                      if (/م|pm/i.test(time) && appointmentHour < 12) appointmentHour += 12;
                      if (/ص|am/i.test(time) && appointmentHour === 12) appointmentHour = 0;
                      const appointmentDate = new Date(
                        `${date}T${String(appointmentHour).padStart(2, '0')}:${String(appointmentMinute).padStart(2, '0')}:00`
                      );
                      const savedRecord = await createChildLifeRecord({
                        childId: remoteChildId,
                        recordType: 'medical_event',
                        title: `طلب موعد طبي: ${doctorName}`,
                        notes: note,
                        occurredAt: Number.isNaN(appointmentDate.getTime()) ? new Date().toISOString() : appointmentDate.toISOString(),
                        details: {
                          source: 'medical_appointment_request',
                          doctorName,
                          appointmentDate: date,
                          appointmentTime: time,
                          status: 'pending_confirmation',
                        },
                      });
                      if (savedRecord.error) {
                        showToast(`تمت إضافة الطلب للتقويم، لكن تعذر حفظه في حكاية الطفل: ${savedRecord.error}`);
                      }
                    }
                    showToast(
                      lang === 'en'
                        ? `Appointment request saved to your Family Calendar: ${doctorName}`
                        : `تمت إضافة طلب الموعد مع «${doctorName}» إلى تقويم الأسرة. الموعد غير مؤكد بعد.`
                    );
                  }}
                  onShowToast={showToast}
                />
                </React.Suspense>
              ))}

            {/* PAGE 6B: MEDIA, VIDEOS & VERTICAL REELS 9:16 HUB */}
            {activePage === 'media' && (
<React.Suspense fallback={<SectionSkeletonLoader section="media" language={state.language} />}>              <MediaPlatformSection
                savedMediaIds={state.savedMediaIds}
                language={state.language}
                onShowToast={showToast}
                onToggleSaveMedia={(id) => {
                  setState((prev) => {
                    const exists = prev.savedMediaIds.includes(id);
                    const next = exists
                      ? prev.savedMediaIds.filter((x) => x !== id)
                      : [...prev.savedMediaIds, id];
                    return { ...prev, savedMediaIds: next };
                  });
                  showToast('تم تحديث قائمة المحتوى المحفوظ');
                }}
                onSelectMediaModal={(item) => setActiveMediaModal(item)}
              />
              </React.Suspense>
            )}

            {/* PAGE 6C: PARENTS' COMMUNITY */}
            {activePage === 'community' &&
              (isTabLoading ? (
                <SectionSkeletonLoader section="community" language={state.language} />
              ) : (
<React.Suspense fallback={<SectionSkeletonLoader section="community" language={state.language} />}>                <ParentsCommunitySection
                  parentName={state.parentName}
                  city={activeParentCity}
                  language={state.language}
                  onShowToast={showToast}
                  initialPersistedState={state.communityState}
                  onPersistState={(value) => setState((prev) => ({ ...prev, communityState: value }))}
                />
                </React.Suspense>
              ))}

            {/* PAGE 6D: INTERNAL CHAT & MESSAGING */}
            {activePage === 'chat' && (
<React.Suspense fallback={<SectionSkeletonLoader section="chat" language={state.language} />}>              <InternalChatSection
                language={state.language}
                darkMode={Boolean(state.darkMode)}
                onShowToast={showToast}
                initialPersistedState={state.chatState}
                onPersistState={(value) => setState((prev) => ({ ...prev, chatState: value }))}
              />
              </React.Suspense>
            )}

            {/* PAGE 7: INTERACTIVE 3D CHILDREN'S GAMES */}
            {activePage === 'games' && (
<React.Suspense fallback={<SectionSkeletonLoader section="games" language={state.language} />}>              <InteractiveGamesSection
                kids={state.kids}
                language={state.language}
                onExitGamesToDashboard={() => navigateTo('home')}
              />
              </React.Suspense>
            )}

            {/* PAGE 8: COMMERCIAL ECOSYSTEM — 3D STORE, CART & SERVICES */}
            {activePage === 'services' &&
              (isTabLoading ? (
                <SectionSkeletonLoader section="services" language={state.language} />
              ) : (
<React.Suspense fallback={<SectionSkeletonLoader section="services" language={state.language} />}>                <CommercialEcosystemSection
                  country={activeParentCountry}
                  city={activeParentCity}
                  currency={activeParentCurrency}
                  language={state.language}
                  darkMode={Boolean(state.darkMode)}
                  cart={state.cart}
                  shippingAddress={state.shippingAddress}
                  orders={state.orders}
                  serviceBookings={state.serviceBookings}
                  onCompleteDemoServiceBooking={handleCompleteDemoServiceBooking}
                  initialCategoryId={storeInitialCategoryId}
                  initialOpenCheckout={storeInitialOpenCheckout}
                  allowDemoData={isPreviewMode}
                  pendingServiceBooking={pendingServiceBooking}
                  onConsumePendingServiceBooking={clearPendingServiceBooking}
                  onAddProductToWishes={(item) =>
                    handleQuickAddWish(item.name, item.priceEGP, item.priceSAR, item.emoji)
                  }
                  onInspectCommercialItem={(item) => {
                    setSelectedModalVariant(item.variants?.[0] || '');
                    setActiveCommercialModal({ ...item, isDemoData: isPreviewMode });
                  }}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onRemoveFromCart={handleRemoveFromCart}
                  onUpdateShippingAddress={(patch) =>
                    setState((prev) => ({
                      ...prev,
                      shippingAddress: { ...prev.shippingAddress, ...patch },
                    }))
                  }
                  onCompleteDemoCheckout={handleCompleteDemoCheckout}
                  onShowToast={showToast}
                />
                </React.Suspense>
              ))}

            {/* PAGE 9: THREE DAILY PARENTING NOTIFICATIONS CENTER */}
            {activePage === 'notifications' && (
              <React.Suspense fallback={<SectionSkeletonLoader section="NotificationsCenterSection" language={state.language} />}><NotificationsCenterSection
                state={state}
                language={state.language}
                onShowToast={showToast}
                onUpdateNotificationPrefs={(pid, patch) => {
                  setState((prev) => ({
                    ...prev,
                    parentAccounts: {
                      ...prev.parentAccounts,
                      [pid]: {
                        ...prev.parentAccounts[pid],
                        notificationPrefs: {
                          ...prev.parentAccounts[pid].notificationPrefs,
                          ...patch,
                        },
                      },
                    },
                  }));
                  showToast(
                    lang === 'en'
                      ? 'Updated parent notification preferences'
                      : 'تم تحديث إعدادات الإشعارات وساعات الهدوء'
                  );
                }}
                onToggleReadNotification={(notifId) => {
                  setState((prev) => {
                    const exists = prev.readNotificationIds.includes(notifId);
                    return {
                      ...prev,
                      readNotificationIds: exists
                        ? prev.readNotificationIds.filter((x) => x !== notifId)
                        : [...prev.readNotificationIds, notifId],
                    };
                  });
                }}
                onMarkAllRead={() => {
                  const ids = activeParentNotifications.map((n) => n.id);
                  setState((prev) => ({
                    ...prev,
                    readNotificationIds: Array.from(
                      new Set([...prev.readNotificationIds, ...ids])
                    ),
                  }));
                  showToast(
                    lang === 'en'
                      ? 'All daily notifications marked as read'
                      : 'تم تحديد جميع إشعارات اليوم كمقروءة'
                  );
                }}
              /></React.Suspense>
            )}

            {/* PAGE 10: IN-APP AI PARENTING ASSISTANT */}
            {activePage === 'assistant' && (
<React.Suspense fallback={<SectionSkeletonLoader section="assistant" language={state.language} />}>              <AiAssistantSection
                kids={state.kids}
                parentName={state.parentName}
                city={activeParentCity}
                language={state.language}
                darkMode={Boolean(state.darkMode)}
                initialModelId={aiInitialModelId}
                initialHistoryOpen={aiInitialHistoryOpen}
                onAddSuggestedRoutineTask={(taskName, timeStr, kidId) => {
                  setState((prev) => ({
                    ...prev,
                    tasks: [
                      {
                        id: Date.now() + Math.floor(Math.random() * 100),
                        name: taskName,
                        kidId,
                        category: 'تربية ونمو',
                        time: timeStr,
                        owner: prev.role === 'dad' ? 'الأب' : 'الأم',
                        cadence: 'daily',
                        done: false,
                      },
                      ...prev.tasks,
                    ],
                  }));
                  showToast(
                    lang === 'en'
                      ? `Added "${taskName}" to Daily Routine!`
                      : `تمت إضافة «${taskName}» إلى الروتين اليومي!`
                  );
                }}
                onShowToast={showToast}
              />
              </React.Suspense>
            )}

            {/* PAGE 11: FAMILY SPACE, ONBOARDING & PERMISSIONS */}
            {activePage === 'family' && (
              <React.Suspense fallback={<SectionSkeletonLoader section="FamilyPermissionsSection" language={state.language} />}><FamilyPermissionsSection
                family={state.family}
                kids={state.kids}
                parentAccounts={state.parentAccounts}
                invitations={state.invitations}
                disputeFreezeActive={state.disputeFreezeActive}
                language={state.language}
                activeParentAccount={state.activeParentAccount}
                onOpenAddPersonModal={() => setPersonModalOpen(true)}
                onOpenPermModal={(member) => setPermModalMember(member)}
                onDeletePerson={handleDeletePerson}
                onToggleDisputeFreeze={(active) => {
                  setState((prev) => ({ ...prev, disputeFreezeActive: active }));
                  showToast(
                    active
                      ? 'تم تفعيل تجميد الصلاحيات الحساسة لحين اتساق موافقة الوالدين'
                      : 'تم إلغاء تجميد الصلاحيات الحساسة'
                  );
                }}
                onUpdateParentAccount={(parentId, patch) => {
                  setState((prev) => ({
                    ...prev,
                    parentAccounts: {
                      ...prev.parentAccounts,
                      [parentId]: {
                        ...prev.parentAccounts[parentId],
                        ...patch,
                      },
                    },
                  }));
                }}
                onCreateInvitation={(inv) => {
                  setState((prev) => ({
                    ...prev,
                    invitations: [
                      {
                        ...inv,
                        id: Date.now() + Math.floor(Math.random() * 100),
                        createdAt: new Date().toISOString(),
                      },
                      ...prev.invitations,
                    ],
                  }));
                }}
                onCreateCoParentInvitation={async (payload) => {
                  const currentState = stateRef.current;
                  const activeProfile = currentState.parentAccounts[currentState.activeParentAccount];
                  const result = await linkCoParentAccountInSupabase({
                    familyId: currentState.verifiedFamilyId || '',
                    partnerRole: payload.partnerRole,
                    partnerName: payload.partnerName,
                    partnerPhone: payload.partnerPhone,
                    partnerEmail: payload.partnerEmail,
                    country: activeProfile?.country || currentState.country,
                    method: 'qr_token',
                  });
                  return {
                    success: result.invitationCreated === true && !result.error,
                    error: result.error,
                  };
                }}
                onUpdateInvitationStatus={(invitationId, status) => {
                  setState((prev) => {
                    const target = prev.invitations.find((i) => i.id === invitationId);
                    const nextInvitations = prev.invitations.map((i) =>
                      i.id === invitationId ? { ...i, status } : i
                    );
                    let nextFamily = prev.family;
                    if (status === 'accepted' && target) {
                      const alreadyInFamily = prev.family.some(
                        (f) => f.name === target.recipientName
                      );
                      if (!alreadyInFamily) {
                        nextFamily = [
                          ...prev.family,
                          {
                            id: Date.now() + Math.floor(Math.random() * 100),
                            name: target.recipientName,
                            role: target.roleLabel,
                            side: target.side,
                            wishes: target.permissions.wishes,
                            events: target.permissions.calendar,
                            emoji:
                              target.roleCategory === 'nursery' || target.roleCategory === 'teacher'
                                ? '👩‍🏫'
                                : '👤',
                            roleCategory: target.roleCategory,
                            phoneCountry: target.phoneCountry,
                            phoneNumber: target.phoneNumber,
                            assignedKidIds: target.assignedKidIds,
                            accessExpiresAt: target.expiresAt,
                            permissions: target.permissions,
                          },
                        ];
                      }
                    }
                    if (status === 'revoked' && target) {
                      nextFamily = prev.family.filter((f) => f.name !== target.recipientName);
                    }
                    return {
                      ...prev,
                      invitations: nextInvitations,
                      family: nextFamily,
                    };
                  });
                  showToast(
                    status === 'accepted'
                      ? 'تم قبول الدعوة وإضافة الفرد بصلاحيات الأطفال المحددة'
                      : status === 'revoked'
                      ? 'تم سحب الصلاحية وإيقاف الوصول فورًا'
                      : 'تم تحديث حالة الدعوة'
                  );
                }}
                onInstantJoinFamilyMember={(newMember) => {
                  setState((prev) => ({
                    ...prev,
                    family: [
                      {
                        ...newMember,
                        id: Date.now() + Math.floor(Math.random() * 100),
                      },
                      ...prev.family,
                    ],
                  }));
                  showToast(
                    lang === 'en'
                      ? `Linked ${newMember.name} (${newMember.role})!`
                      : `تمت الإضافة بنجاح — تم ربط «${newMember.name}» (${newMember.role}) بحساب الأسرة!`
                  );
                }}
                onShowToast={showToast}
              /></React.Suspense>
            )}

            {/* PAGE 12: PROFILE WITH SETTINGS INSIDE */}
            {activePage === 'settings' && (
              <React.Suspense fallback={<SectionSkeletonLoader section="ProfileSettingsSection" language={state.language} />}><ProfileSettingsSection
                state={state}
                parentProfileSpec={parentProfileSpec}
                unreadNotifCount={unreadNotifCount}
                showInnerSettings={showInnerSettings}
                onToggleShowInnerSettings={() => setShowInnerSettings((prev) => !prev)}
                onOpenOnboardingModal={() => setOnboardingModalOpen(true)}
                onNavigateTo={(page) => navigateTo(page)}
                onToggleDarkMode={handleToggleDarkMode}
                settingsParentName={settingsParentName}
                onChangeSettingsParentName={setSettingsParentName}
                settingsRole={settingsRole}
                onChangeSettingsRole={setSettingsRole}
                settingsLanguage={settingsLanguage}
                onChangeSettingsLanguage={setSettingsLanguage}
                settingsCalendarMode={settingsCalendarMode}
                onChangeSettingsCalendarMode={setSettingsCalendarMode}
                onSaveGeneralSettings={handleSaveGeneralSettings}
                onExportJson={handleExportJson}
                onImportJsonFile={handleImportJsonFile}
                onOpenConfirmResetModal={() => setConfirmResetModal(true)}
                onSignOut={handleSignOut}
                onShowToast={showToast}
                settingsCountry={settingsCountry}
                onCountryChangeInSettings={handleCountryChangeInSettings}
                settingsCity={settingsCity}
                onChangeSettingsCity={setSettingsCity}
                settingsCurrency={settingsCurrency}
                onChangeSettingsCurrency={(val) => {
                  setSettingsCurrency(val);
                  setCurrencySuggestionBanner(null);
                }}
                settingsPhoneInput={settingsPhoneInput}
                onChangeSettingsPhoneInput={setSettingsPhoneInput}
                currencySuggestionBanner={currencySuggestionBanner}
                onAcceptCurrencySuggestion={(currency) => {
                  setSettingsCurrency(currency);
                  setCurrencySuggestionBanner(null);
                }}
                settingsOtpStep={settingsOtpStep}
                settingsOtpCode={settingsOtpCode}
                onChangeSettingsOtpCode={setSettingsOtpCode}
                onSaveBottomInternationalAndPhone={handleSaveBottomInternationalAndPhone}
              /></React.Suspense>
            )}

            {activePage === 'settings' && (
              <React.Suspense fallback={<SectionSkeletonLoader section="FamilyHomesSection" language={state.language} />}><FamilyHomesSection
                state={state}
                onShowToast={showToast}
                onPersonalLocationSaved={handlePersonalLocationSaved}
              /></React.Suspense>
            )}

            {/* PAGES 13–15: LEGAL POLICIES & DIGITAL CONTACT US */}
            {(activePage === 'privacy' || activePage === 'terms' || activePage === 'contact') && (
              <React.Suspense fallback={<SectionSkeletonLoader section="LegalAndContactSection" language={state.language} />}><LegalAndContactSection
                pageType={activePage}
                language={state.language}
                parentName={state.parentName}
                darkMode={Boolean(state.darkMode)}
                onNavigateSubPage={(target) => navigateTo(target)}
                onShowToast={showToast}
              /></React.Suspense>
            )}

            {/* OFFICIAL BRAND, WEBSITE, SOCIAL & LEGAL FOOTER */}
            <footer
              data-testid="minimalist-footer"
              className="mt-2 pt-4 pb-8 border-t border-[var(--color-border)]/70 dark:border-[#1E3646] flex flex-col items-center gap-3 text-xs font-normal text-[var(--color-muted)]"
              aria-label={lang === 'en' ? 'Nekbaar website, social channels and legal links' : 'الموقع الرسمي وقنوات التواصل والسياسات'}
            >
                            <div
                              data-testid="social-media-footer-links"
                              className="flex flex-wrap items-center justify-center gap-2 max-w-full py-1"
                            >
                              {[
                                {
                                  id: 'facebook',
                                  name: 'Facebook',
                                  labelAr: 'فيسبوك',
                                  href: '#social-facebook',
                                  svg: (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.1H7.7v3h2.5V21h3.3z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'instagram',
                                  name: 'Instagram',
                                  labelAr: 'إنستجرام',
                                  href: '#social-instagram',
                                  svg: (
                                    <svg className="w-4 h-4 fill-none stroke-current stroke-[2]" viewBox="0 0 24 24" aria-hidden="true">
                                      <rect x="3" y="3" width="18" height="18" rx="5" />
                                      <circle cx="12" cy="12" r="4" />
                                      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'twitter-x',
                                  name: 'Twitter / X',
                                  labelAr: 'إكس (تويتر)',
                                  href: '#social-x',
                                  svg: (
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'tiktok',
                                  name: 'TikTok',
                                  labelAr: 'تيك توك',
                                  href: '#social-tiktok',
                                  svg: (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'youtube',
                                  name: 'YouTube',
                                  labelAr: 'يوتيوب',
                                  href: '#social-youtube',
                                  svg: (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M21.58 7.19a2.75 2.75 0 00-1.94-1.95C17.92 4.8 12 4.8 12 4.8s-5.92 0-7.64.44a2.75 2.75 0 00-1.94 1.95C2 8.9 2 12 2 12s0 3.1.42 4.81a2.75 2.75 0 001.94 1.95c1.72.44 7.64.44 7.64.44s5.92 0 7.64-.44a2.75 2.75 0 001.94-1.95C22 15.1 22 12 22 12s0-3.1-.42-4.81zM10 15.15V8.85L15.5 12 10 15.15z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'whatsapp',
                                  name: 'WhatsApp',
                                  labelAr: 'واتساب',
                                  href: '#social-whatsapp',
                                  svg: (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M12.04 2a9.9 9.9 0 00-8.53 14.9L2 22l5.25-1.38a9.9 9.9 0 104.79-18.62zm5.47 14.12c-.23.65-1.34 1.24-1.88 1.32-.5.07-1.13.1-1.83-.12a16.8 16.8 0 01-6.24-4.23c-1.57-1.82-2.4-3.5-2.4-4.78 0-1.26.67-1.9 1.02-2.25.25-.25.55-.32.73-.32h.54c.18 0 .42-.06.65.5.24.58.8 1.96.87 2.1.07.14.12.31.02.5-.1.2-.15.32-.3.5-.14.16-.3.36-.43.49-.14.14-.3.3-.13.59.17.3.76 1.25 1.63 2.02 1.12 1 2.06 1.31 2.36 1.46.3.14.47.12.64-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.76.83 2.06.98.3.15.5.22.58.35.07.12.07.72-.16 1.37z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'linkedin',
                                  name: 'LinkedIn',
                                  labelAr: 'لينكد إن',
                                  href: '#social-linkedin',
                                  svg: (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M6.94 5a2 2 0 11-4-.002 2 2 0 014 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'snapchat',
                                  name: 'Snapchat',
                                  labelAr: 'سناب شات',
                                  href: '#social-snapchat',
                                  svg: (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M12 2.5c-3.1 0-5.4 2.2-5.4 5.4v2.3c-.4.2-.9.3-1.4.3-.6 0-1.1.4-1.1.9 0 .6.6 1 1.4 1.2.1.4-.4 1.6-2 2.6-.4.2-.6.6-.5 1 .1.4.6.7 1.3.8.5.1.9.3 1.1.8.2.5.6.7 1.3.7.7 0 1.4-.2 2.3-.2.9 0 1.8.5 3 .5s2.1-.5 3-.5c.9 0 1.6.2 2.3.2.7 0 1.1-.2 1.3-.7.2-.5.6-.7 1.1-.8.7-.1 1.2-.4 1.3-.8.1-.4-.1-.8-.5-1-1.6-1-2.1-2.2-2-2.6.8-.2 1.4-.6 1.4-1.2 0-.5-.5-.9-1.1-.9-.5 0-1-.1-1.4-.3V7.9c0-3.2-2.3-5.4-5.4-5.4z" />
                                    </svg>
                                  ),
                                },
                                {
                                  id: 'telegram',
                                  name: 'Telegram',
                                  labelAr: 'تيليجرام',
                                  href: '#social-telegram',
                                  svg: (
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                      <path d="M21.4 3.4L2.7 10.6c-1.2.5-1.2 1.2-.2 1.5l4.8 1.5 11.1-7c.5-.3 1-.1.6.2l-9 8.1-.3 4.6c.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8L22.6 4.6c.3-1.2-.5-1.7-1.2-1.2z" />
                                    </svg>
                                  ),
                                },
                              ].map((social) => (
                                <a
                                  key={social.id}
                                  href={social.href}
                                  data-social-platform={social.id}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    showToast(
                                      lang === 'en'
                                        ? `Nekbaar official ${social.name} channel — ready for link customization`
                                        : `قناة نكبر الرسمية على ${social.labelAr} (${social.name})`
                                    );
                                  }}
                                  title={lang === 'en' ? social.name : social.labelAr}
                                  aria-label={lang === 'en' ? social.name : social.labelAr}
                                  className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-xl border border-teal-500/25 dark:border-[#1E3646] bg-teal-50/60 dark:bg-[#101D26] text-[#0d9488] dark:text-[#2DD4BF] hover:bg-[#0d9488] hover:text-white dark:hover:bg-[#0d9488] dark:hover:text-white flex items-center justify-center shadow-2xs transition-all active:scale-90"
                                >
                                  {social.svg}
                                </a>
                              ))}
                            </div>

              <div className="w-full flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
                <span
                  data-testid="footer-brand-copyright"
                  className="font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]"
                >
                  نكبر (Nekbaar) © 2027
                </span>
                <span aria-hidden="true" className="opacity-40">·</span>
                <a
                  href="https://www.nekbaar.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  data-testid="footer-official-website"
                  className="font-extrabold text-teal-700 dark:text-teal-300 hover:underline underline-offset-4"
                  aria-label={lang === 'en' ? 'Visit the official Nekbaar website' : 'زيارة الموقع الرسمي لنكبر'}
                >
                  www.nekbaar.com
                </a>
              </div>

              <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={() => navigateTo('privacy')}
                  className={`hover:text-[var(--color-text)] hover:underline underline-offset-4 transition-colors cursor-pointer ${
                    activePage === 'privacy' ? 'text-[var(--color-text)] underline font-extrabold' : ''
                  }`}
                >
                  {lang === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('terms')}
                  className={`hover:text-[var(--color-text)] hover:underline underline-offset-4 transition-colors cursor-pointer ${
                    activePage === 'terms' ? 'text-[var(--color-text)] underline font-extrabold' : ''
                  }`}
                >
                  {lang === 'en' ? 'Terms & IP Rights' : 'الشروط وحقوق الملكية'}
                </button>
              </div>

              <button
                type="button"
                data-testid="footer-contact-cta"
                onClick={() => navigateTo('contact')}
                className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-teal-600/30 bg-teal-50 px-5 py-2 font-extrabold text-teal-800 shadow-sm transition-colors hover:bg-teal-100 dark:border-teal-500/30 dark:bg-[#102b30] dark:text-teal-200 dark:hover:bg-[#153b40] ${
                  activePage === 'contact' ? 'ring-2 ring-teal-500/30' : ''
                }`}
              >
                <span aria-hidden="true">✉️</span>
                <span>{lang === 'en' ? 'Contact Us' : 'تواصل معنا'}</span>
              </button>
            </footer>
          </main>
        </div>

            {/* Super App Mobile Bottom Navigation Bar (Strictly 5 Elements with Central AI Agent FAB — Always Visible in Mobile Viewport) */}
            {(() => {
              const isHomeBranch = [
                'home',
                'medical',
                'media',
                'chat',
                'children',
                'routine',
                'calendar',
                'wishes',
                'games',
                'notifications',
              ].includes(activePage);
              const isProfileBranch = ['settings', 'family', 'privacy', 'terms', 'contact'].includes(
                activePage
              );

              return (
                <nav
                  data-testid="mobile-bottom-navigation-bar"
                  className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto z-40 border-t border-gray-200/80 dark:border-[#1E3646] glass-bottom-nav px-2 pt-1 pb-safe-nav grid grid-cols-5 items-end gap-1 shadow-[0_-6px_20px_-6px_rgba(42,36,51,0.12)]"
                  aria-label={lang === 'en' ? 'Mobile Bottom Navigation' : 'التنقل السفلي للموبايل'}
                >
                  {/* 1. Home */}
                  <button
                    type="button"
                    onClick={() => navigateTo('home')}
                    aria-current={activePage === 'home' ? 'page' : undefined}
                    className={`relative min-h-[40px] py-0.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] tracking-tight leading-tight font-bold active:scale-95 transition-all duration-200 min-w-0 ${
                      isHomeBranch
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold shadow-2xs'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {isHomeBranch && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 w-4 h-0.5 rounded-full bg-[var(--color-accent)]"
                      />
                    )}
                    <ThreeDIcon id="home" size={17} />
                    <span className="truncate max-w-full">{lang === 'en' ? 'Home' : 'الرئيسية'}</span>
                  </button>

                  {/* 2. Store */}
                  <button
                    type="button"
                    onClick={() => navigateTo('services')}
                    aria-current={activePage === 'services' ? 'page' : undefined}
                    className={`relative min-h-[40px] py-0.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] tracking-tight leading-tight font-bold active:scale-95 transition-all duration-200 min-w-0 ${
                      activePage === 'services'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold shadow-2xs'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {activePage === 'services' && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 w-4 h-0.5 rounded-full bg-[var(--color-accent)]"
                      />
                    )}
                    <div className="relative">
                      <ThreeDIcon id="services" size={17} />
                      {cartItemCount > 0 && (
                        <span className="absolute -top-1 -end-2 px-1 min-w-[14px] h-[14px] rounded-full bg-orange-600 text-white text-[8.5px] font-extrabold flex items-center justify-center tabular-nums">
                          {cartItemCount}
                        </span>
                      )}
                    </div>
                    <span className="truncate max-w-full">{lang === 'en' ? 'Store' : 'المتجر'}</span>
                  </button>

                  {/* 3. Central AI Robot Assistant FAB */}
                  <div className="flex flex-col items-center justify-end min-w-0">
                    <button
                      id="mobile-ai-robot-fab"
                      type="button"
                      onClick={() => navigateTo('assistant')}
                      aria-current={activePage === 'assistant' ? 'page' : undefined}
                      aria-label={lang === 'en' ? 'AI Agent' : 'مساعد الذكاء الاصطناعي'}
                      className="-mt-4 min-h-[42px] flex flex-col items-center justify-center group focus:outline-none active:scale-95 transition-all duration-200 max-w-full"
                    >
                      <span
                        className={`ai-robot-fab-pulse w-10 h-10 rounded-full flex items-center justify-center border-2 border-[var(--color-surface)] transition-all duration-200 active:scale-95 ${
                          activePage === 'assistant'
                            ? 'bg-gradient-to-tr from-[#0d9488] via-[#0e7490] to-[#FF8C61] ring-2 ring-[var(--color-accent-soft)] scale-105'
                            : 'bg-gradient-to-tr from-[#0d9488] via-[#0e7490] to-[#FF8C61] hover:scale-105'
                        }`}
                      >
                        <AiRobotHeadIcon size={22} onDarkSurface={true} />
                      </span>
                      <span
                        className={`mt-0.5 px-1 py-0.2 rounded-full text-[9px] tracking-tight font-extrabold leading-tight text-center whitespace-nowrap truncate max-w-full transition-colors ${
                          activePage === 'assistant'
                            ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)]'
                            : 'text-[var(--color-text)]'
                        }`}
                      >
                        {lang === 'en' ? 'AI Agent' : 'المساعد الذكي'}
                      </span>
                    </button>
                  </div>

                  {/* 4. Community */}
                  <button
                    type="button"
                    onClick={() => navigateTo('community')}
                    aria-current={activePage === 'community' ? 'page' : undefined}
                    className={`relative min-h-[40px] py-0.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] tracking-tight leading-tight font-bold active:scale-95 transition-all duration-200 min-w-0 ${
                      activePage === 'community'
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold shadow-2xs'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {activePage === 'community' && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 w-4 h-0.5 rounded-full bg-[var(--color-accent)]"
                      />
                    )}
                    <ThreeDIcon id="star" size={17} />
                    <span className="truncate max-w-full">
                      {lang === 'en' ? 'Community' : 'المجتمع'}
                    </span>
                  </button>

                  {/* 5. Profile */}
                  <button
                    type="button"
                    onClick={() => navigateTo('settings')}
                    aria-current={activePage === 'settings' ? 'page' : undefined}
                    className={`relative min-h-[40px] py-0.5 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] tracking-tight leading-tight font-bold active:scale-95 transition-all duration-200 min-w-0 ${
                      isProfileBranch
                        ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold shadow-2xs'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                    }`}
                  >
                    {isProfileBranch && (
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 w-4 h-0.5 rounded-full bg-[var(--color-accent)]"
                      />
                    )}
                    <ThreeDIcon id="settings" size={17} />
                    <span className="truncate max-w-full">{lang === 'en' ? 'Profile' : 'الحساب'}</span>
                  </button>
                </nav>
              );
            })()}
          </>
        )}

        {/* Registration, Login, Country & City Selection, Parent & Child Onboarding Wizard */}
        <OnboardingFlowModal
          isOpen={onboardingModalOpen}
          isMandatoryGateway={!recognizedProfile}
          initialCountry={state.country}
          initialCity={state.city || getDefaultCityForCountry(state.country)}
          initialParentName={state.parentName}
          initialRole={state.role}
          language={state.language}
          onToggleLanguage={(nextLang) => {
            setState((prev) => ({ ...prev, language: nextLang }));
            setSettingsLanguage(nextLang);
          }}
          onPreviewRequest={handleEnterPreviewMode}
          onClose={() => {
            if (recognizedProfile) {
              setOnboardingModalOpen(false);
            }
          }}
          onCompleteOnboarding={({
            parentName,
            role,
            country,
            city,
            currency,
            phoneNumber,
            email,
            emailVerified,
            phoneVerified,
            coParentInvitationPending,
            coParentEmail,
            childProfile,
            childrenProfiles,
            skippedForLater,
            persistedSession,
            syncedToDb,
          }) => {
            const verifiedFamilyUuid =
              persistedSession && isValidUuid(persistedSession.verifiedFamilyId)
                ? persistedSession.verifiedFamilyId.trim()
                : persistedSession && isValidUuid(persistedSession.familyId)
                ? String(persistedSession.familyId).trim()
                : null;
            previewModeRef.current = false;
            setIsPreviewMode(false);
            if (persistedSession) {
              setRecognizedProfile(persistedSession);
            }
            setActiveFamilyStorageScope(verifiedFamilyUuid);
            setHydratedFamilyStorageScope(null);
            setState((prev) => {
              const baseState = verifiedFamilyUuid
                ? loadFamilySpaceStateForFamily(verifiedFamilyUuid)
                : prev;
              const pid = role === 'dad' ? 'father' : 'mother';
              const nextKids =
                Array.isArray(childrenProfiles) && childrenProfiles.length > 0
                  ? childrenProfiles.map((item, idx) => ({
                      id: item.id || idx + 1,
                      remoteId: item.remoteId,
                      name: item.name,
                      gender: item.gender,
                      birth: item.birth,
                      interests: item.interests,
                      emoji: item.gender === 'girl' ? '👧🏻' : '👦🏻',
                      avatarTheme: item.avatarTheme,
                      useIllustratedAvatar: true,
                    }))
                  : childProfile?.name
                  ? [
                      {
                        id: 1,
                        name: childProfile.name,
                        gender: childProfile.gender,
                        birth: childProfile.birth,
                        interests: childProfile.interests,
                        emoji: childProfile.gender === 'girl' ? '👧🏻' : '👦🏻',
                        avatarTheme: childProfile.avatarTheme,
                        useIllustratedAvatar: true,
                      },
                    ]
                  : baseState.kids;
              const genuineEmailVerified = Boolean(
                emailVerified ?? persistedSession?.emailVerified ?? false
              );
              const genuinePhoneVerified = Boolean(
                phoneVerified ?? persistedSession?.phoneVerified ?? false
              );
              return {
                ...baseState,
                language: prev.language,
                verifiedFamilyId: verifiedFamilyUuid,
                parentName,
                role,
                country,
                city,
                currency,
                activeParentAccount: pid,
                shippingAddress: {
                  ...baseState.shippingAddress,
                  recipientName: parentName,
                  city,
                },
                parentAccounts: {
                  ...baseState.parentAccounts,
                  [pid]: {
                    ...baseState.parentAccounts[pid],
                    fullName: parentName,
                    country,
                    city,
                    phoneCode: getCountryDialCode(country),
                    phoneNumber,
                    phoneVerified: genuinePhoneVerified,
                    email,
                    emailVerified: genuineEmailVerified,
                    onboardingCompleted: !skippedForLater,
                  },
                },
                kids: nextKids,
              };
            });
            setOnboardingModalOpen(false);
            navigateTo('home');
            showToast(
              coParentInvitationPending
                ? lang === 'en'
                  ? `Invitation created for ${coParentEmail}. Ask the other parent to sign in with this exact verified email to join your family space.`
                  : `تم إنشاء دعوة ولي الأمر الآخر على ${coParentEmail}. اطلب منه التسجيل أو تسجيل الدخول بنفس البريد وتأكيده للانضمام لمساحة الأسرة.`
                : skippedForLater
                ? lang === 'en'
                  ? 'Progress saved locally! You can resume onboarding anytime from Settings.'
                  : 'تم حفظ تقدمك محلياً! يمكنك استكمال إعداد الحساب في أي وقت من الإعدادات.'
                : syncedToDb
                ? lang === 'en'
                  ? `Welcome ${parentName}! Session and children profiles synced to cloud database.`
                  : `أهلاً بك ${parentName}! تم تثبيت جلستك الدائمة ومزامنة ملفات الأطفال سحابياً بنجاح.`
                : lang === 'en'
                ? `Welcome ${parentName}! Saved locally on this device (cloud database sync unavailable).`
                : `أهلاً بك ${parentName}! تم حفظ بياناتك وأطفالك محلياً على هذا الجهاز (تعذرت المزامنة السحابية حالياً).`
            );
          }}
        />

        {/* Modular Modals Collection (Modals 1–11) */}
        <React.Suspense fallback={<SectionSkeletonLoader section="FamilyAppModals" language={state.language} />}><FamilyAppModals
          state={state}
          todayISO={todayISO}
          todayFormattedCombined={todayFormatted.combined}
          cartItemCount={cartItemCount}
          childModalOpen={childModalOpen}
          editingChild={editingChild}
          childPhotoDraft={childPhotoDraft}
          childUse3DAvatarDraft={childUse3DAvatarDraft}
          onCloseChildModal={() => setChildModalOpen(false)}
          onSaveChild={handleSaveChild}
          onChildPhotoUpload={handleChildPhotoUpload}
          onToggleChildUse3DAvatar={setChildUse3DAvatarDraft}
          childToDelete={childToDelete}
          childDeleteSummary={childDeleteSummary}
          onCancelDeleteChild={() => setConfirmDeleteChildId(null)}
          onConfirmDeleteChild={handleConfirmDeleteChild}
          taskModalOpen={taskModalOpen}
          editingTask={editingTask}
          onCloseTaskModal={() => setTaskModalOpen(false)}
          onSaveTask={handleSaveTask}
          eventModalOpen={eventModalOpen}
          editingEvent={editingEvent}
          onCloseEventModal={() => setEventModalOpen(false)}
          onSaveEvent={handleSaveEvent}
          wishModalOpen={wishModalOpen}
          editingWish={editingWish}
          onCloseWishModal={() => setWishModalOpen(false)}
          onSaveWish={handleSaveWish}
          personModalOpen={personModalOpen}
          onClosePersonModal={() => setPersonModalOpen(false)}
          onSavePerson={handleSavePerson}
          permModalMember={permModalMember}
          onClosePermModal={() => setPermModalMember(null)}
          onSaveMemberPermissions={handleSaveMemberPermissions}
          roleModalOpen={roleModalOpen}
          onCloseRoleModal={() => setRoleModalOpen(false)}
          onOpenOnboardingFromDrawer={() => {
            setRoleModalOpen(false);
            setOnboardingModalOpen(true);
          }}
          onOpenCartFromDrawer={() => {
            setRoleModalOpen(false);
            setStoreInitialOpenCheckout(true);
            navigateTo('services');
          }}
          onOpenWishesFromDrawer={() => {
            setRoleModalOpen(false);
            navigateTo('wishes');
          }}
          onToggleLanguageFromDrawer={handleToggleTopLanguage}
          onNavigateFromDrawer={(targetPage) => {
            setRoleModalOpen(false);
            navigateTo(targetPage);
          }}
          onOpenStoreCategoryFromDrawer={(catId) => {
            setRoleModalOpen(false);
            setStoreInitialCategoryId(catId);
            setStoreInitialOpenCheckout(false);
            navigateTo('services');
          }}
          onSelectAiSubActionFromDrawer={(action) => {
            setRoleModalOpen(false);
            if (action.modelId) {
              setAiInitialModelId(action.modelId);
            }
            setAiInitialHistoryOpen(Boolean(action.openHistory));
            navigateTo('assistant');
          }}
          onReplaySplashFromDrawer={() => {
            setRoleModalOpen(false);
            handleReplaySplashScreen();
          }}
          activePage={activePage}
          bedtimeMode={bedtimeMode}
          onToggleBedtimeMode={handleToggleBedtimeMode}
          onEnableHighContrast={() => {
            setState((prev) => ({ ...prev, role: 'high-contrast', darkMode: false }));
            setRoleModalOpen(false);
            showToast(lang === 'en' ? 'High Contrast mode enabled' : 'تم تفعيل وضع التباين العالي');
          }}
          onToggleDarkMode={handleToggleDarkMode}
          activeMediaModal={activeMediaModal}
          onCloseMediaModal={() => setActiveMediaModal(null)}
          activeCommercialModal={activeCommercialModal}
          selectedModalVariant={selectedModalVariant}
          onSelectModalVariant={setSelectedModalVariant}
          onCloseCommercialModal={() => setActiveCommercialModal(null)}
          onAddToCart={handleAddToCart}
          onBookService={(item) => {
            setActiveCommercialModal(null);
            setPendingServiceBooking(item);
            navigateTo('services');
          }}
          onQuickAddWish={handleQuickAddWish}
          confirmResetModal={confirmResetModal}
          onCloseConfirmResetModal={() => setConfirmResetModal(false)}
          onResetAllData={handleResetAllData}
        /></React.Suspense>

        {/* Dedicated Smart Family Calendar & To-Do List Modal ("مفكرة العيلة الذكية") */}
        <FamilySmartPlannerModal
          open={smartPlannerModalOpen}
          onClose={() => setSmartPlannerModalOpen(false)}
          lang={lang}
          darkMode={Boolean(state.darkMode)}
          role={state.role}
          parentName={state.parentName}
          kids={state.kids}
          events={state.events}
          tasks={state.tasks}
          onSaveEvent={(payload) => {
            setState((prev) => {
              if (payload.id !== undefined) {
                return {
                  ...prev,
                  events: prev.events.map((ev) =>
                    ev.id === payload.id
                      ? {
                          ...ev,
                          title: payload.title,
                          date: payload.date,
                          time: payload.time,
                          type: payload.type,
                          childId: payload.childId,
                          repeat: payload.repeat,
                          note: payload.note,
                        }
                      : ev
                  ),
                };
              }
              return {
                ...prev,
                events: [
                  {
                    id: Date.now() + Math.floor(Math.random() * 100),
                    title: payload.title,
                    date: payload.date,
                    time: payload.time,
                    type: payload.type,
                    childId: payload.childId,
                    repeat: payload.repeat,
                    note: payload.note,
                    createdAt: new Date().toISOString(),
                  },
                  ...prev.events,
                ],
              };
            });
            showToast(
              payload.id !== undefined
                ? lang === 'en'
                  ? 'Family occasion updated!'
                  : 'تم تحديث الموعد في مفكرة العيلة الذكية'
                : lang === 'en'
                ? 'New family occasion added to calendar!'
                : 'تمت إضافة الموعد الجديد لتقويم العيلة بنجاح'
            );
          }}
          onDeleteEvent={handleDeleteEvent}
          onSaveTask={(payload) => {
            setState((prev) => {
              if (payload.id !== undefined) {
                return {
                  ...prev,
                  tasks: prev.tasks.map((tItem) =>
                    tItem.id === payload.id
                      ? {
                          ...tItem,
                          name: payload.name,
                          time: payload.time,
                          kidId: payload.kidId,
                          category: payload.category,
                          owner: payload.owner,
                          cadence: payload.cadence,
                          scheduledDate: payload.scheduledDate ?? tItem.scheduledDate,
                        }
                      : tItem
                  ),
                };
              }
              return {
                ...prev,
                tasks: [
                  {
                    id: Date.now() + Math.floor(Math.random() * 100),
                    name: payload.name,
                    time: payload.time,
                    done: false,
                    kidId: payload.kidId,
                    category: payload.category,
                    owner: payload.owner,
                    cadence: payload.cadence,
                    scheduledDate: payload.scheduledDate,
                    completedDates: [],
                  },
                  ...prev.tasks,
                ],
              };
            });
            showToast(
              payload.id !== undefined
                ? lang === 'en'
                  ? 'Family task updated!'
                  : 'تم تحديث المهمة في قائمة مهام العيلة'
                : lang === 'en'
                ? 'Added new task to Family To-Do list!'
                : 'تمت إضافة المهمة الجديدة لقائمة مهام العيلة'
            );
          }}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />

        {/* Warm Bedtime / Night Reading Comfort Dimming Overlay */}
        {bedtimeMode && (
          <>
            <div
              id="bedtime-warm-dimmer-overlay"
              aria-hidden="true"
              className="fixed inset-0 z-[90] pointer-events-none transition-opacity duration-500"
              style={{
                background:
                  'radial-gradient(circle at 50% 30%, rgba(251, 146, 60, 0.16) 0%, rgba(180, 83, 9, 0.26) 65%, rgba(15, 23, 42, 0.38) 100%)',
                mixBlendMode: 'multiply',
              }}
            />
            <div className="fixed bottom-20 lg:bottom-5 start-4 z-[95] flex items-center gap-2 rounded-full border border-amber-400/60 bg-[#1C1917]/95 text-amber-200 px-3.5 py-1.5 text-[11px] font-extrabold shadow-lg backdrop-blur-md">
              <span>🛌</span>
              <span>
                {lang === 'en'
                  ? 'Warm Bedtime Reading Filter Active'
                  : 'وضع هدوء المساء الدافئ مفعّل لراحة العين'}
              </span>
              <button
                type="button"
                onClick={handleToggleBedtimeMode}
                className="ms-1 px-2 py-0.5 rounded-full bg-amber-500/25 hover:bg-amber-500 text-amber-100 hover:text-slate-950 transition-all cursor-pointer font-black"
              >
                {lang === 'en' ? 'Turn Off' : 'إيقاف'}
              </button>
            </div>
          </>
        )}

        {/* Full-Screen Center-Screen Navigation Transition Loader */}
        <FullScreenNavigationLoader
          visible={navLoader.visible}
          fadingOut={navLoader.fadingOut}
          language={state.language}
          labelAr={
            navLoader.targetPage === 'services'
              ? 'جاري فتح متجر الأسرة والخدمات...'
              : navLoader.targetPage === 'medical'
              ? 'جاري فتح الرعاية الطبية ومتابعة النمو...'
              : navLoader.targetPage === 'community'
              ? 'جاري فتح مجتمع الآباء والأمهات...'
              : navLoader.targetPage === 'assistant'
              ? 'جاري تجهيز المساعد الذكي...'
              : navLoader.targetPage === 'calendar' || navLoader.targetPage === 'routine'
              ? 'جاري فتح التقويم والروتين اليومي...'
              : 'جاري الانتقال...'
          }
          labelEn={
            navLoader.targetPage === 'services'
              ? 'Opening Family Store & Services...'
              : navLoader.targetPage === 'medical'
              ? 'Opening Medical Care & Growth...'
              : navLoader.targetPage === 'community'
              ? 'Opening Parents Community...'
              : navLoader.targetPage === 'assistant'
              ? 'Preparing Smart AI Assistant...'
              : navLoader.targetPage === 'calendar' || navLoader.targetPage === 'routine'
              ? 'Opening Schedule & Daily Routine...'
              : 'Switching View...'
          }
        />

        {/* Task & Goal Completion Festival Celebration (Confetti & Stars) */}
        <TaskFestivalCelebrationOverlay
          celebration={festivalCelebration}
          language={state.language}
        />

        {/* Minimalist Splash Screen (Boy & Girl Animated Illustration + Brand Name & Slogan) */}
        <InteractiveSplashScreen
          visible={splashScreen.visible}
          fadingOut={splashScreen.fadingOut}
          language={state.language}
          darkMode={Boolean(state.darkMode)}
          onSkipOrFinish={handleDismissSplashScreen}
        />

        {/* Global Toast / Snackbar Micro-feedback */}
        <GlobalToastSnackbar
          message={toastMsg}
          onClose={() => setToastMsg(null)}
          language={state.language}
        />
      </div>
    </FamilyAppProvider>
  );
}
