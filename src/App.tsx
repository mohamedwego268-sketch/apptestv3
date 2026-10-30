/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DEMO_OTP_CODE,
  FamilySpaceState,
  ChildProfile,
  RoutineTask,
  CalendarEvent,
  WishItem,
  FamilyMember,
  MediaContentItem,
  CommercialCatalogItem,
  MEDIA_CONTENT_CATALOG,
  COMMERCIAL_CATALOG,
  ParentThemeRole,
  CountryCode,
  LanguageCode,
  CurrencyCode,
  CalendarDisplayMode,
  TaskCadence,
  dateLocalISO,
  getSuggestedCurrencyForCountry,
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
  CheckoutPaymentMethodType,
  getPaymentMethodLabels,
  calculateCheckoutSummary,
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
} from './domain/familySpaceCore';
import { AvatarAccessoryTheme } from './domain/assetManifest3D';
import { t } from './domain/i18n';
import {
  loadFamilySpaceState,
  saveFamilySpaceState,
  exportFamilySpaceJsonBackup,
  resetFamilySpaceState,
} from './services/familyStorageService';
import {
  deleteChildFromSupabase,
  fetchFamilySpaceFromSupabase,
  isValidUuid,
  saveOnboardingChildrenToSupabase,
  syncFamilySpaceToSupabase,
  verifyAccountIdentityOtpInSupabase,
} from './services/supabaseService';
import { useMasterController } from './services/MasterAppController';
import { getLocalizedDocumentTitle, locText } from './utils/familyFormatters';
import { FamilyAppProvider, PageId } from './context/FamilyAppContext';
import { HomeDashboardSection } from './features/HomeDashboardSection';
import { ChildrenProfilesSection } from './features/ChildrenProfilesSection';
import { DailyRoutineSection } from './features/DailyRoutineSection';
import { FamilyCalendarSection } from './features/FamilyCalendarSection';
import { KidsWishesSection } from './features/KidsWishesSection';
import { ProfileSettingsSection } from './features/ProfileSettingsSection';
import { FamilyAppModals } from './components/modals/FamilyAppModals';
import { MedicalHealthSection } from './components/MedicalHealthSection';
import { MediaPlatformSection } from './components/MediaPlatformSection';
import { ParentsCommunitySection } from './components/ParentsCommunitySection';
import { InternalChatSection } from './components/InternalChatSection';
import { AiAssistantSection, AiModelId } from './components/AiAssistantSection';
import { OnboardingFlowModal } from './components/OnboardingFlowModal';
import {
  OnboardingFlowController,
  UserSessionProfile,
} from './services/OnboardingFlowController';
import { CommercialEcosystemSection } from './components/CommercialEcosystemSection';
import { FamilyPermissionsSection } from './components/FamilyPermissionsSection';
import { NotificationsCenterSection } from './components/NotificationsCenterSection';
import { InteractiveGamesSection } from './components/InteractiveGamesSection';
import { LegalAndContactSection } from './components/LegalAndContactSection';
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

const PREVIEW_ACCESS_BYPASS = true; // TEMP: remove after preview review; never merge this flag into production.

export default function App() {
  const [state, setState] = useState<FamilySpaceState>(() => loadFamilySpaceState());
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
  const [showInnerSettings, setShowInnerSettings] = useState<boolean>(true);
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
    }, 1400);
  }, [handleDismissSplashScreen]);

  useEffect(() => {
    if (!splashScreen.visible) return;
    splashFadeTimerRef.current = window.setTimeout(() => {
      handleDismissSplashScreen();
    }, 1200);
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

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLiveClockMinutes(now.getHours() * 60 + now.getMinutes());
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
  const [settingsCity, setSettingsCity] = useState<string>(
    state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')
  );
  const [settingsLanguage, setSettingsLanguage] = useState<LanguageCode>(state.language);
  const [settingsCurrency, setSettingsCurrency] = useState<CurrencyCode>(state.currency);
  const [settingsCalendarMode, setSettingsCalendarMode] = useState<CalendarDisplayMode>(
    state.calendarMode
  );
  const [currencySuggestionBanner, setCurrencySuggestionBanner] = useState<CurrencyCode | null>(
    null
  );

  // Bottom Settings Phone OTP Verification State
  const [settingsPhoneInput, setSettingsPhoneInput] = useState<string>(
    state.parentAccounts[state.activeParentAccount]?.phoneNumber || '1012345678'
  );
  const [settingsOtpStep, setSettingsOtpStep] = useState<boolean>(false);
  const [settingsOtpCode, setSettingsOtpCode] = useState<string>('');

  // Active Modals & Mandatory Auth Gateway / Smart Startup Profile Recognition (`OnboardingFlowController`)
  const [recognizedProfile, setRecognizedProfile] = useState<UserSessionProfile | null>(() =>
    OnboardingFlowController.getSavedProfile()
  );
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(
    () => (PREVIEW_ACCESS_BYPASS ? false : !Boolean(OnboardingFlowController.getSavedProfile()))
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
  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
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
    if (!saveFamilySpaceState(state)) {
      showToast('تعذر الحفظ في المتصفح. صدّر نسخة احتياطية من الإعدادات.');
    }
  }, [state]);

  // Autonomous Master Controller hook (`Initializing` | `Synced` | `Offline-Fallback` | `Error-Recovery`)
  const master = useMasterController();

  // Supabase loading & network fallback states driven by MasterAppController
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState<string | null>(null);

  const loadFromSupabase = React.useCallback(async () => {
    setSupabaseStatus('loading');
    setSupabaseErrorMsg(null);
    const { hydratedState, snapshot } = await master.controller.bootstrapWithAppState(state);
    setState(hydratedState);
    if (snapshot.lifecycleState === 'Offline-Fallback' && snapshot.retryTelemetry.lastError) {
      setSupabaseStatus('error');
      setSupabaseErrorMsg(snapshot.retryTelemetry.lastError);
    } else {
      setSupabaseStatus('ready');
    }
  }, [master.controller]);

  // Autonomous Bootstrapping & Hydration via MasterAppController on mount
  useEffect(() => {
    let isMounted = true;
    master.controller.bootstrapWithAppState(state).then(({ hydratedState, snapshot }) => {
      if (!isMounted) return;
      setState(hydratedState);
      if (snapshot.lifecycleState === 'Offline-Fallback' && snapshot.retryTelemetry.lastError) {
        setSupabaseStatus('error');
        setSupabaseErrorMsg(snapshot.retryTelemetry.lastError);
      } else {
        setSupabaseStatus('ready');
      }
    });
    return () => {
      isMounted = false;
    };
  }, [master.controller]);

  // Smart Startup Profile Recognition (`OnboardingFlowController.detectInitialState()`)
  useEffect(() => {
    if (PREVIEW_ACCESS_BYPASS) {
      setRecognizedProfile(null);
      setOnboardingModalOpen(false);
      return;
    }
    let active = true;
    OnboardingFlowController.detectInitialState().then(
      ({ step, profile, restoredChildren, draft }) => {
        if (!active) return;
        if (step === 'DASHBOARD' && profile) {
          setRecognizedProfile(profile);
          setOnboardingModalOpen(false);
          setActivePage('home');
          setState((prev) => {
            const nextCountry =
              profile.country === 'SA' || profile.country === 'EG' ? profile.country : prev.country;
            const nextRole =
              profile.role === 'dad' || profile.role === 'mom' ? profile.role : prev.role;
            const pid = nextRole === 'dad' ? 'father' : 'mother';
            const nextKids =
              Array.isArray(restoredChildren) && restoredChildren.length > 0
                ? restoredChildren.map((child, idx) => ({
                    id: child.id || idx + 1,
                    remoteId: child.remote_id,
                    name: child.name,
                    gender: child.gender === 'girl' ? ('girl' as const) : ('boy' as const),
                    birth: child.birth || '2022-05-14',
                    interests: child.interests || '',
                    emoji: child.gender === 'girl' ? '👧🏻' : '👦🏻',
                    avatarTheme:
                      child.avatar_theme || (child.gender === 'girl' ? 'artist' : 'astronaut'),
                    useIllustratedAvatar: true,
                  }))
                : prev.kids;
            return {
              ...prev,
              parentName: profile.fullName || prev.parentName,
              role: nextRole,
              country: nextCountry,
              city: profile.city || prev.city,
              currency: getSuggestedCurrencyForCountry(nextCountry),
              activeParentAccount: pid,
              parentAccounts: {
                ...prev.parentAccounts,
                [pid]: {
                  ...prev.parentAccounts[pid],
                  fullName: profile.fullName || prev.parentAccounts[pid].fullName,
                  country: nextCountry,
                  email: profile.email || prev.parentAccounts[pid].email,
                  phoneNumber: profile.phone || prev.parentAccounts[pid].phoneNumber,
                  emailVerified: Boolean(profile.emailVerified),
                  phoneVerified: Boolean(profile.phoneVerified),
                  onboardingCompleted: Boolean(profile.onboardingCompleted ?? true),
                },
              },
              kids: nextKids,
            };
          });
          showToast(
            state.language === 'en'
              ? `👋 Welcome back, ${profile.fullName}! Routed directly to your Family Dashboard.`
              : `👋 أهلاً بعودتك، ${profile.fullName}! تم التعرف على حسابك المحفوظ وتوجيهك مباشرة للوحة العائلة.`
          );
        } else if (step === 'WELCOME_PROFILE' || (draft && draft.currentStep)) {
          // Open Welcome & Auth Gateway for new/logged-out users or restore in-progress draft
          setOnboardingModalOpen(true);
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // Autonomous Debounced Sync & Battery Diagnostics Recomputation via MasterAppController
  useEffect(() => {
    const syncTimer = setTimeout(() => {
      void master.forceSyncNow(state);
    }, 1500);
    return () => clearTimeout(syncTimer);
  }, [
    master,
    state.kids,
    state.tasks,
    state.family,
    state.parentAccounts,
    state.city,
    state.country,
    state.currency,
  ]);

  // Sync settings inputs when state changes externally
  useEffect(() => {
    setSettingsParentName(state.parentName);
    setSettingsRole(state.role);
    setSettingsCountry(state.country);
    setSettingsCity(state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'));
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
  const todayISO = useMemo(() => dateLocalISO(new Date()), []);
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

  // Precise City/Governorate Dropdown Change Handler (SA & EG individual cities)
  const handleSelectPreciseCity = (combinedValue: string) => {
    const [countryRaw, cityVal] = combinedValue.split(':');
    const nextCountry: CountryCode = countryRaw === 'SA' ? 'SA' : 'EG';
    const cityObj =
      COUNTRY_CITIES_MAP[nextCountry].find(
        (c) => c.id === cityVal || c.id.startsWith(cityVal) || cityVal.startsWith(c.id)
      ) || COUNTRY_CITIES_MAP[nextCountry][0];
    const nextCurrency = getSuggestedCurrencyForCountry(nextCountry);

    setState((prev) => ({
      ...prev,
      country: nextCountry,
      city: cityObj.id,
      currency: nextCurrency,
      shippingAddress: {
        ...prev.shippingAddress,
        city: cityObj.id,
      },
    }));
    setUserCoords({ lat: cityObj.lat, lng: cityObj.lng });
    setGeoStatus('active');
    showToast(
      lang === 'en'
        ? `Location updated to ${cityObj.nameEn} (${nextCurrency}) — Nearby services sorted`
        : `تم تحديد المدينة: ${cityObj.nameAr} (${nextCurrency}) وترتيب الخدمات الأقرب إليك`
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
        country: nearest.country,
        city: nearest.city.id,
        currency: nextCurrency,
        shippingAddress: {
          ...prev.shippingAddress,
          city: nearest.city.id,
        },
      }));
      showToast(
        lang === 'en'
          ? fromGps
            ? `GPS Active: Nearest city ${nearest.city.nameEn} (${nearest.distanceKm} km) — Sorted by proximity`
            : `Location calibrated to ${nearest.city.nameEn} — Nearby clinics & stores sorted`
          : fromGps
          ? `تم تفعيل GPS: أقرب مدينة ${nearest.city.nameAr} (${nearest.distanceKm} كم) — تم ترتيب العيادات والمتاجر`
          : `تم ضبط الموقع على ${nearest.city.nameAr} وترتيب العيادات والمتاجر الأقرب إليك`
      );
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyDetectedCoords(pos.coords.latitude, pos.coords.longitude, true);
        },
        () => {
          const currentCityList = COUNTRY_CITIES_MAP[state.country];
          const currentCityObj =
            currentCityList.find((c) => c.id === state.city) || currentCityList[0];
          applyDetectedCoords(currentCityObj.lat, currentCityObj.lng, false);
        },
        { enableHighAccuracy: false, timeout: 4500, maximumAge: 60000 }
      );
    } else {
      const currentCityList = COUNTRY_CITIES_MAP[state.country];
      const currentCityObj =
        currentCityList.find((c) => c.id === state.city) || currentCityList[0];
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
        ? 'Child 3D profile saved!'
        : 'تم حفظ ملف الطفل وهويته ثلاثية الأبعاد بنجاح'
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

    setState((prev) => {
      if (editingTask) {
        return {
          ...prev,
          tasks: prev.tasks.map((tItem) =>
            tItem.id === editingTask.id
              ? { ...tItem, name, time, kidId, category, owner, cadence }
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
          },
        ],
      };
    });

    setTaskModalOpen(false);
    setEditingTask(null);
    showToast(editingTask ? 'تم تحديث المهمة' : 'تمت إضافة المهمة للروتين');
  };

  const handleToggleTask = (id: number, done: boolean) => {
    const targetTask = state.tasks.find((tItem) => tItem.id === id);
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((tItem) => (tItem.id === id ? { ...tItem, done } : tItem)),
    }));
    if (done) {
      const targetKid = targetTask?.kidId
        ? state.kids.find((k) => k.id === Number(targetTask.kidId))
        : null;
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
      tasks: prev.tasks.map((tItem) => ({ ...tItem, done: false })),
    }));
    showToast('تمت إعادة ضبط حالة مهام الروتين');
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
    const price = state.currency === 'SAR' ? priceSAR : priceEGP;
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

  const handleCompleteDemoCheckout = (
    paymentMethod: CheckoutPaymentMethodType = 'electronic_card'
  ) => {
    const sourceCart =
      state.cart.length > 0
        ? state.cart
        : [{ productId: 201, quantity: 1, selectedVariant: 'مجموعة 60 قطعة (2–6 سنوات)' }];

    const orderItems = sourceCart
      .map((ci) => {
        const prod = COMMERCIAL_CATALOG.find((p) => p.id === ci.productId);
        if (!prod) return null;
        const unitPrice = state.currency === 'SAR' ? prod.priceSAR : prod.priceEGP;
        return {
          productId: ci.productId,
          name: state.language === 'en' ? prod.nameEn : prod.name,
          quantity: ci.quantity,
          unitPrice,
          variant: ci.selectedVariant,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    const summary = calculateCheckoutSummary(sourceCart, state.currency, paymentMethod);
    const pmInfo = getPaymentMethodLabels(paymentMethod);
    const newOrder = {
      id: `FS-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      items: orderItems,
      totalAmount: summary.grandTotal,
      deliveryFee: summary.deliveryFee + summary.codFee,
      currency: state.currency,
      shippingAddress: state.shippingAddress,
      paymentMethod,
      paymentMethodLabelAr: pmInfo.labelAr,
      paymentMethodLabelEn: pmInfo.labelEn,
      status: 'confirmed_demo' as const,
    };

    setState((prev) => ({
      ...prev,
      cart: [],
      orders: [newOrder, ...prev.orders],
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
    const defaultCity = nextCountry === 'SA' ? 'الرياض' : 'القاهرة';
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
      parentName: settingsParentName.trim() || (isDad ? 'بابا (أحمد)' : 'ماما (مريم)'),
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
    const phoneCheck = validatePhoneForCountry(settingsPhoneInput, settingsCountry);
    if (!phoneCheck.valid) {
      showToast(
        lang === 'en'
          ? phoneCheck.errorEn || 'Invalid phone number'
          : phoneCheck.errorAr || 'رقم الهاتف غير صالح'
      );
      return;
    }

    const currentParent = state.parentAccounts[state.activeParentAccount];
    const phoneOrCountryChanged =
      settingsCountry !== state.country || phoneCheck.normalized !== currentParent.phoneNumber;

    if (phoneOrCountryChanged && !settingsOtpStep) {
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

    if (settingsOtpStep) {
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
            country: settingsCountry,
            phoneCode: settingsCountry === 'SA' ? '+966' : '+20',
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
          ? 'Country, City, Currency & Verified Phone updated!'
          : 'تم تحديث الدولة والمدينة والعملة وتوثيق رقم الهاتف الدولي بنجاح!'
        : lang === 'en'
        ? 'Country, City, Currency & Phone saved locally (SMS verification pending).'
        : 'تم حفظ الدولة والمدينة والعملة ورقم الهاتف محلياً (توثيق SMS عبر السحابة قيد التفعيل).'
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

  const handleResetAllData = () => {
    OnboardingFlowController.clearSession();
    setRecognizedProfile(null);
    const fresh = resetFamilySpaceState();
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
    { id: 'assistant', label: lang === 'en' ? '2. Smart AI Assistant' : '٢. مساعد نكبر الذكي', shortLabel: lang === 'en' ? 'AI Agent' : 'مساعد نكبر الذكي', iconId: 'assistant' },
    { id: 'children', label: lang === 'en' ? '3. Our Kids 3D' : '٣. أولادنا 3D', shortLabel: lang === 'en' ? 'Kids 3D' : 'أولادنا 3D', iconId: 'children' },
    { id: 'routine', label: lang === 'en' ? '4. Daily Routine' : '٤. الروتين اليومي', shortLabel: lang === 'en' ? 'Routine' : 'الروتين اليومي', iconId: 'routine' },
    { id: 'services', label: lang === 'en' ? '5. Quick Store' : '٥. المتجر السريع', shortLabel: lang === 'en' ? 'Store' : 'المتجر السريع', iconId: 'services' },
    { id: 'calendar', label: lang === 'en' ? '6. Calendar & Events' : '٦. التقويم والمواعيد', shortLabel: lang === 'en' ? 'Calendar' : 'التقويم والمواعيد', iconId: 'calendar' },
    { id: 'medical', label: lang === 'en' ? '7. Doctor & Clinic' : '٧. الدكتور والعيادة', shortLabel: lang === 'en' ? 'Clinic' : 'الدكتور والعيادة', iconId: 'health' },
    { id: 'media', label: lang === 'en' ? '8. Parenting Reels & Videos' : '٨. ريلز وفيديوهات التربية', shortLabel: lang === 'en' ? 'Reels' : 'ريلز التربية', iconId: 'video' },
    { id: 'community', label: lang === 'en' ? '9. Parents Gathering' : '٩. لمة الآباء', shortLabel: lang === 'en' ? 'Community' : 'لمة الآباء', iconId: 'star' },
    { id: 'chat', label: lang === 'en' ? '10. Family Chat' : '١٠. شات العيلة', shortLabel: lang === 'en' ? 'Chat' : 'شات العيلة', iconId: 'shield' },
    { id: 'family', label: lang === 'en' ? '11. Family & Permissions' : '١١. عيلتنا والصلاحيات', shortLabel: lang === 'en' ? 'Family' : 'عيلتنا والصلاحيات', iconId: 'family' },
    { id: 'settings', label: lang === 'en' ? '12. Settings & Control' : '١٢. الإعدادات والتحكم', shortLabel: lang === 'en' ? 'Settings' : 'الإعدادات والتحكم', iconId: 'settings' },
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

  const handleSelectParentProfile = (targetRole: 'mom' | 'dad') => {
    const isDad = targetRole === 'dad';
    const nextName = isDad ? 'بابا أحمد' : 'ماما مريم';
    setState((prev) => ({
      ...prev,
      role: targetRole,
      activeParentAccount: isDad ? 'father' : 'mother',
      parentName: nextName,
    }));
    showToast(
      isDad
        ? lang === 'en'
          ? 'Switched to Father View: Ahmad'
          : 'تم التبديل إلى حساب الأب: أحمد'
        : lang === 'en'
        ? 'Switched to Mother View: Maryam'
        : 'تم التبديل إلى حساب الأم: مريم'
    );
  };

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

  const isDashboardUnlocked = Boolean(recognizedProfile) || !onboardingModalOpen;

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
        className="mobile-app-shell max-w-[430px] mx-auto min-h-dvh w-full pt-safe pb-safe bg-slate-50 dark:bg-gray-900 shadow-2xl border-x border-gray-200/80 dark:border-[#1E3646] relative flex flex-col justify-start overflow-x-hidden pb-8 transition-all duration-300 ease-in-out"
      >
        {PREVIEW_ACCESS_BYPASS && (
          <div
            role="status"
            className="mx-3 mt-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[11px] font-bold text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
          >
            {lang === 'en'
              ? 'Preview mode · Registration temporarily skipped · Changes may be stored only on this device'
              : 'وضع المعاينة · تم تجاوز التسجيل مؤقتًا · قد تُحفظ التغييرات على هذا الجهاز فقط'}
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
              country={state.country}
              city={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
              userCoords={userCoords}
              onSelectCity={(cCode, cName) => handleSelectPreciseCity(`${cCode}:${cName}`)}
            />

            {/* Main Mobile Workspace Container */}
            <div className="w-full max-w-[430px] mx-auto px-3 pt-2.5 pb-6 flex-1">
              {/* Parent OS Quick Navigation Bar — Single Primary Navigation System Across Main Sections */}
              <nav
                id="parent-os-quick-dock"
                data-testid="parent-os-quick-dock"
                aria-label={lang === 'en' ? 'Parent OS Main Navigation' : 'شريط التنقل الرئيسي لأركان نكبر'}
                className="sticky top-[52px] z-30 bg-slate-50/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 mb-2 border-b border-gray-200/60 dark:border-[#1E3646]/70"
              >
                {(
                  [
                    { id: 'home', labelAr: '🏠 الرئيسية', labelEn: '🏠 Home' },
                    { id: 'media', labelAr: '🎬 الميديا والريلز', labelEn: '🎬 Media & Reels' },
                    { id: 'community', labelAr: '🤝 المجتمع', labelEn: '🤝 Community' },
                    { id: 'chat', labelAr: '💬 المحادثات', labelEn: '💬 Chat' },
                    { id: 'assistant', labelAr: '✨ المساعد الذكي', labelEn: '✨ AI Assistant' },
                    { id: 'medical', labelAr: '🩺 الرعاية الطبية', labelEn: '🩺 Medical' },
                    { id: 'routine', labelAr: '✅ الروتين', labelEn: '✅ Routine' },
                    {
                      id: 'services',
                      labelAr: cartItemCount > 0 ? `🛍️ المتجر (${cartItemCount})` : '🛍️ المتجر',
                      labelEn: cartItemCount > 0 ? `🛍️ Store (${cartItemCount})` : '🛍️ Store',
                    },
                    { id: 'settings', labelAr: '⚙️ الحساب', labelEn: '⚙️ Account' },
                  ] as Array<{ id: PageId; labelAr: string; labelEn: string }>
                ).map((item) => {
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid={`os-quick-pill-${item.id}`}
                      onClick={() => navigateTo(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`min-h-[36px] px-3 py-1 rounded-full text-xs font-extrabold border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                          : 'bg-[var(--color-surface)] dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#0d9488]'
                      }`}
                    >
                      {lang === 'en' ? item.labelEn : item.labelAr}
                    </button>
                  );
                })}
              </nav>

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
                  titleAr: 'ملفات الأطفال 3D',
                  titleEn: '3D Child Profiles',
                  badgeAr: `${state.kids.length} ملفات مسجلة`,
                  badgeEn: `${state.kids.length} Profiles`,
                  iconId: 'children',
                  tone: 'teal',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                calendar: {
                  titleAr: 'التقويم والمواعيد',
                  titleEn: 'Family Calendar',
                  badgeAr: `${state.events.length} مواعيد`,
                  badgeEn: `${state.events.length} Events`,
                  iconId: 'calendar',
                  tone: 'cyan',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                wishes: {
                  titleAr: 'أمنيات الأطفال',
                  titleEn: 'Kids Wishes',
                  badgeAr: `${state.wishes.length} أمنيات`,
                  badgeEn: `${state.wishes.length} Wishes`,
                  iconId: 'wishes',
                  tone: 'pink',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                games: {
                  titleAr: 'ألعاب الأطفال 3D',
                  titleEn: '3D Kids Games',
                  badgeAr: 'ترفيه تعليمي آمن',
                  badgeEn: 'Safe Learning Play',
                  iconId: 'games',
                  tone: 'lime',
                  parentPage: 'home',
                  parentLabelAr: 'رجوع',
                  parentLabelEn: 'Back',
                },
                family: {
                  titleAr: 'العائلة والصلاحيات',
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
                  titleAr: 'الإشعارات اليومية',
                  titleEn: 'Daily Notifications',
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
                  badgeAr: 'حماية بيانات الأسرة والطفل',
                  badgeEn: 'Family & Child Data Protection',
                  iconId: 'shield',
                  tone: 'teal',
                  parentPage: 'settings',
                  parentLabelAr: 'رجوع للحساب',
                  parentLabelEn: 'Back',
                },
                terms: {
                  titleAr: 'الشروط والأحكام وحقوق الملكية',
                  titleEn: 'Terms of Service & IP Rights',
                  badgeAr: 'السياسات وحقوق الملكية الفكرية',
                  badgeEn: 'Policies & Intellectual Property',
                  iconId: 'star',
                  tone: 'indigo',
                  parentPage: 'settings',
                  parentLabelAr: 'رجوع للحساب',
                  parentLabelEn: 'Back',
                },
                contact: {
                  titleAr: 'تواصل معنا',
                  titleEn: 'Contact Us',
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
                state={state}
                lang={lang}
                parentProfileSpec={parentProfileSpec}
                cartItemCount={cartItemCount}
                completedTasksCount={completedTasksCount}
                nearestEvent={nearestEvent}
                todayFormattedCombined={todayFormatted.combined}
                userCoords={userCoords}
                geoStatus={geoStatus}
                navigateTo={navigateTo}
                onSelectPreciseCity={handleSelectPreciseCity}
                onUseCurrentLocation={handleUseCurrentLocation}
                onAddToCart={handleAddToCart}
                onInspectCommercialItem={(item) => {
                  setSelectedModalVariant(item.variants?.[0] || '');
                  setActiveCommercialModal(item);
                }}
                onAddProductToWishes={(item) =>
                  handleQuickAddWish(item.name, item.priceEGP, item.priceSAR, item.emoji)
                }
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
                bedtimeMode={bedtimeMode}
                onToggleBedtimeMode={handleToggleBedtimeMode}
                onOpenStoreCategory={(catId: string) => {
                  setStoreInitialCategoryId(catId);
                  setStoreInitialOpenCheckout(false);
                  navigateTo('services');
                }}
                onReplaySplash={handleReplaySplashScreen}
                onAddVoiceMoment={handleAddVoiceMomentToChild}
                onToggleTaskDone={(taskId) => {
                  const target = state.tasks.find((tItem) => tItem.id === taskId);
                  if (target) {
                    handleToggleTask(taskId, !target.done);
                  }
                }}
              />
            )}

            {/* PAGE 2: CHILDREN PROFILES & 3D IDENTITY */}
            {activePage === 'children' && (
              <ChildrenProfilesSection
                state={state}
                lang={lang}
                onOpenAddChild={openAddChild}
                onOpenEditChild={openEditChild}
                onConfirmDeleteChild={(kidId) => setConfirmDeleteChildId(kidId)}
                onAddVoiceMoment={handleAddVoiceMomentToChild}
                onShowToast={showToast}
              />
            )}

            {/* PAGE 3: DAILY ROUTINE */}
            {activePage === 'routine' && (
              <DailyRoutineSection
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
              />
            )}

            {/* PAGE 4: FAMILY CALENDAR */}
            {activePage === 'calendar' && (
              <FamilyCalendarSection
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
              />
            )}

            {/* PAGE 5: WISHES & GOALS */}
            {activePage === 'wishes' && (
              <KidsWishesSection
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
              />
            )}

            {/* PAGE 6A: MEDICAL & CHILD HEALTH HUB */}
            {activePage === 'medical' &&
              (isTabLoading ? (
                <SectionSkeletonLoader section="medical" language={state.language} />
              ) : (
                <MedicalHealthSection
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
                  country={state.country}
                  city={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
                  currency={state.currency}
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
                  onBookDoctorAppointment={(doctorName, childId, date, time, note) => {
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
                    showToast(
                      lang === 'en'
                        ? `Appointment booked with ${doctorName} and added to Family Calendar!`
                        : `تم حجز الموعد مع «${doctorName}» وإضافته إلى التقويم الأسري!`
                    );
                  }}
                  onShowToast={showToast}
                />
              ))}

            {/* PAGE 6B: MEDIA, VIDEOS & VERTICAL REELS 9:16 HUB */}
            {activePage === 'media' && (
              <MediaPlatformSection
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
            )}

            {/* PAGE 6C: PARENTS' COMMUNITY */}
            {activePage === 'community' &&
              (isTabLoading ? (
                <SectionSkeletonLoader section="community" language={state.language} />
              ) : (
                <ParentsCommunitySection
                  parentName={state.parentName}
                  city={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
                  language={state.language}
                  onShowToast={showToast}
                />
              ))}

            {/* PAGE 6D: INTERNAL CHAT & MESSAGING */}
            {activePage === 'chat' && (
              <InternalChatSection
                language={state.language}
                darkMode={Boolean(state.darkMode)}
                onShowToast={showToast}
              />
            )}

            {/* PAGE 7: INTERACTIVE 3D CHILDREN'S GAMES */}
            {activePage === 'games' && (
              <InteractiveGamesSection
                kids={state.kids}
                language={state.language}
                onExitGamesToDashboard={() => navigateTo('home')}
              />
            )}

            {/* PAGE 8: COMMERCIAL ECOSYSTEM — 3D STORE, CART & SERVICES */}
            {activePage === 'services' &&
              (isTabLoading ? (
                <SectionSkeletonLoader section="services" language={state.language} />
              ) : (
                <CommercialEcosystemSection
                  country={state.country}
                  city={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
                  currency={state.currency}
                  language={state.language}
                  darkMode={Boolean(state.darkMode)}
                  cart={state.cart}
                  shippingAddress={state.shippingAddress}
                  orders={state.orders}
                  initialCategoryId={storeInitialCategoryId}
                  initialOpenCheckout={storeInitialOpenCheckout}
                  onAddProductToWishes={(item) =>
                    handleQuickAddWish(item.name, item.priceEGP, item.priceSAR, item.emoji)
                  }
                  onInspectCommercialItem={(item) => {
                    setSelectedModalVariant(item.variants?.[0] || '');
                    setActiveCommercialModal(item);
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
              ))}

            {/* PAGE 9: THREE DAILY PARENTING NOTIFICATIONS CENTER */}
            {activePage === 'notifications' && (
              <NotificationsCenterSection
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
              />
            )}

            {/* PAGE 10: IN-APP AI PARENTING ASSISTANT */}
            {activePage === 'assistant' && (
              <AiAssistantSection
                kids={state.kids}
                parentName={state.parentName}
                city={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
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
            )}

            {/* PAGE 11: FAMILY SPACE, ONBOARDING & PERMISSIONS */}
            {activePage === 'family' && (
              <FamilyPermissionsSection
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
              />
            )}

            {/* PAGE 12: PROFILE WITH SETTINGS INSIDE */}
            {activePage === 'settings' && (
              <ProfileSettingsSection
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
              />
            )}

            {/* PAGES 13–15: LEGAL POLICIES & DIGITAL CONTACT US */}
            {(activePage === 'privacy' || activePage === 'terms' || activePage === 'contact') && (
              <LegalAndContactSection
                pageType={activePage}
                language={state.language}
                parentName={state.parentName}
                darkMode={Boolean(state.darkMode)}
                onNavigateSubPage={(target) => navigateTo(target)}
                onShowToast={showToast}
              />
            )}

            {/* MINIMALIST OFFICIAL BRAND ICONS & LEGAL FOOTER */}
            <footer
              data-testid="minimalist-footer"
              className="pt-4 pb-2 border-t border-[var(--color-border)]/70 dark:border-[#1E3646] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-normal text-[var(--color-muted)]"
              aria-label={lang === 'en' ? 'Social Media, Policies & Support Footer' : 'تذييل التواصل الاجتماعي والسياسات'}
            >
              {/* Official Social Media Brand SVG Icons (Compact Single Row in Theme Colors) */}
              <div
                data-testid="social-media-footer-links"
                className="flex flex-nowrap items-center justify-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-0.5"
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

              {/* Copyright & Legal Links Row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                <div
                  data-testid="footer-brand-copyright"
                  className="inline-flex items-center gap-1.5 font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]"
                >
                  <span>
                    {lang === 'en'
                      ? 'نكبر (Nekbaar) © 2026'
                      : 'نكبر (Nekbaar) © 2026'}
                  </span>
                </div>
                <span aria-hidden="true" className="opacity-50">·</span>
                <button
                  type="button"
                  onClick={() => navigateTo('privacy')}
                  className={`hover:text-[var(--color-text)] hover:underline transition-colors cursor-pointer ${
                    activePage === 'privacy' ? 'text-[var(--color-text)] underline font-medium' : ''
                  }`}
                >
                  {lang === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}
                </button>
                <span aria-hidden="true" className="opacity-50">·</span>
                <button
                  type="button"
                  onClick={() => navigateTo('terms')}
                  className={`hover:text-[var(--color-text)] hover:underline transition-colors cursor-pointer ${
                    activePage === 'terms' ? 'text-[var(--color-text)] underline font-medium' : ''
                  }`}
                >
                  {lang === 'en' ? 'Terms & IP Rights' : 'الشروط وحقوق الملكية'}
                </button>
                <span aria-hidden="true" className="opacity-50">·</span>
                <button
                  type="button"
                  onClick={() => navigateTo('contact')}
                  className={`hover:text-[var(--color-text)] hover:underline transition-colors cursor-pointer ${
                    activePage === 'contact' ? 'text-[var(--color-text)] underline font-medium' : ''
                  }`}
                >
                  {lang === 'en' ? 'Contact Us' : 'تواصل معنا'}
                </button>
              </div>
            </footer>
          </main>
        </div>
          </>
        )}

        {/* Registration, Login, Country & City Selection, Parent & Child Onboarding Wizard */}
        <OnboardingFlowModal
          isOpen={onboardingModalOpen}
          isMandatoryGateway={!recognizedProfile}
          initialCountry={state.country}
          initialCity={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
          initialParentName={state.parentName}
          initialRole={state.role}
          language={state.language}
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
            childProfile,
            childrenProfiles,
            skippedForLater,
            persistedSession,
            syncedToDb,
          }) => {
            if (persistedSession) {
              setRecognizedProfile(persistedSession);
            }
            setState((prev) => {
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
                  : prev.kids;
              const genuineEmailVerified = Boolean(
                emailVerified ?? persistedSession?.emailVerified ?? false
              );
              const genuinePhoneVerified = Boolean(
                phoneVerified ?? persistedSession?.phoneVerified ?? false
              );
              return {
                ...prev,
                parentName,
                role,
                country,
                city,
                currency,
                activeParentAccount: pid,
                shippingAddress: {
                  ...prev.shippingAddress,
                  recipientName: parentName,
                  city,
                },
                parentAccounts: {
                  ...prev.parentAccounts,
                  [pid]: {
                    ...prev.parentAccounts[pid],
                    fullName: parentName,
                    country,
                    phoneCode: country === 'SA' ? '+966' : '+20',
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
              skippedForLater
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
        <FamilyAppModals
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
          onSelectPreciseCity={handleSelectPreciseCity}
          onUseCurrentLocation={handleUseCurrentLocation}
          geoStatus={geoStatus}
          bedtimeMode={bedtimeMode}
          onToggleBedtimeMode={handleToggleBedtimeMode}
          onSelectParentProfile={(role) => {
            handleSelectParentProfile(role);
            setRoleModalOpen(false);
          }}
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
          onQuickAddWish={handleQuickAddWish}
          confirmResetModal={confirmResetModal}
          onCloseConfirmResetModal={() => setConfirmResetModal(false)}
          onResetAllData={handleResetAllData}
        />

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
