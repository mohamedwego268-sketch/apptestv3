/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  STORAGE_KEY,
  DEFAULT_SEED,
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
  normalizeAppData,
  dateLocalISO,
  calculateChildAge,
  getSuggestedCurrencyForCountry,
  formatCurrency,
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
  locText,
  calculateDistanceKm,
  findNearestCityByCoords,
  sortCatalogByCityAndProximity,
  getParentProfileThemeSpec,
} from './domain/familySpaceCore';
import {
  AVATAR_ACCESSORY_THEMES,
  AvatarAccessoryTheme,
  THREE_D_ASSET_MANIFEST,
} from './domain/assetManifest3D';
import { t } from './domain/i18n';
import { getCardBackgroundSpec, CardBackgroundKey } from './domain/cardBackgrounds';
import { MedicalHealthSection } from './components/MedicalHealthSection';
import { MediaPlatformSection } from './components/MediaPlatformSection';
import { ParentsCommunitySection } from './components/ParentsCommunitySection';
import { InternalChatSection } from './components/InternalChatSection';
import { AiAssistantSection } from './components/AiAssistantSection';
import { OnboardingFlowModal } from './components/OnboardingFlowModal';
import { CommercialEcosystemSection } from './components/CommercialEcosystemSection';
import { FamilyPermissionsSection } from './components/FamilyPermissionsSection';
import { NotificationsCenterSection } from './components/NotificationsCenterSection';
import { InteractiveGamesSection } from './components/InteractiveGamesSection';
import { LegalAndContactSection } from './components/LegalAndContactSection';
import {
  ThreeDChildAvatar,
  ThreeDIcon,
  ThreeDIconId,
  ThreeDInteractiveScene,
  AiRobotHeadIcon,
} from './components/ThreeDVisuals';
import {
  FriendlyEmptyState,
  GlobalToastSnackbar,
  InnerScreenTopBar,
  PrimaryCtaButton,
  PASTEL_CARD_TONES,
  SectionSkeletonLoader,
  SoftFilledIcon,
} from './components/DesignSystem';

type PageId =
  | 'home'
  | 'children'
  | 'routine'
  | 'calendar'
  | 'wishes'
  | 'medical'
  | 'media'
  | 'community'
  | 'chat'
  | 'games'
  | 'services'
  | 'notifications'
  | 'assistant'
  | 'family'
  | 'settings'
  | 'privacy'
  | 'terms'
  | 'contact';

export default function App() {
  const [state, setState] = useState<FamilySpaceState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return normalizeAppData({ ...structuredClone(DEFAULT_SEED), ...JSON.parse(saved) });
      }
    } catch {
      // Fallback to normalized default seed
    }
    return normalizeAppData(DEFAULT_SEED);
  });

  const [activePage, setActivePage] = useState<PageId>('home');
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);
  const tabLoadingTimerRef = React.useRef<number | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeBannerIdx, setActiveBannerIdx] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [showInnerSettings, setShowInnerSettings] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'active'>('idle');
  const [showAllHomeHubs, setShowAllHomeHubs] = useState<boolean>(false);
  const [homeFocusTab, setHomeFocusTab] = useState<'nearby' | 'children' | 'schedule'>('nearby');

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

  useEffect(() => {
    if (activePage !== 'home') return;
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % 4);
    }, 5000);
    return () => clearInterval(timer);
  }, [activePage]);

  // Calendar filters
  const [eventFrom, setEventFrom] = useState<string>('');
  const [eventTo, setEventTo] = useState<string>('');

  // Wishes child tab filter
  const [wishKidTab, setWishKidTab] = useState<string>('all');

  // Assistant state
  const [assistantTopic, setAssistantTopic] = useState<'sleep' | 'food' | 'play' | 'behavior' | 'health'>('sleep');
  const [assistantStage, setAssistantStage] = useState<'0-2' | '2-5' | '5-8'>('2-5');
  const [assistantQuestion, setAssistantQuestion] = useState<string>('');
  const [assistantAnswer, setAssistantAnswer] = useState<string | null>(null);

  // Settings form state
  const [settingsParentName, setSettingsParentName] = useState<string>(state.parentName);
  const [settingsRole, setSettingsRole] = useState<ParentThemeRole>(state.role);
  const [settingsCountry, setSettingsCountry] = useState<CountryCode>(state.country);
  const [settingsCity, setSettingsCity] = useState<string>(state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'));
  const [settingsLanguage, setSettingsLanguage] = useState<LanguageCode>(state.language);
  const [settingsCurrency, setSettingsCurrency] = useState<CurrencyCode>(state.currency);
  const [settingsCalendarMode, setSettingsCalendarMode] = useState<CalendarDisplayMode>(state.calendarMode);
  const [currencySuggestionBanner, setCurrencySuggestionBanner] = useState<CurrencyCode | null>(null);

  // Bottom Settings Phone OTP Verification State
  const [settingsPhoneInput, setSettingsPhoneInput] = useState<string>(
    state.parentAccounts[state.activeParentAccount]?.phoneNumber || '1012345678'
  );
  const [settingsOtpStep, setSettingsOtpStep] = useState<boolean>(false);
  const [settingsOtpCode, setSettingsOtpCode] = useState<string>('');

  // Active Modals
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(false);
  const [childModalOpen, setChildModalOpen] = useState<boolean>(false);
  const [editingChild, setEditingChild] = useState<ChildProfile | null>(null);
  const [childPhotoDraft, setChildPhotoDraft] = useState<string | undefined>(undefined);
  const [childUse3DAvatarDraft, setChildUse3DAvatarDraft] = useState<boolean>(true);
  const [confirmDeleteChildId, setConfirmDeleteChildId] = useState<number | null>(null);

  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<RoutineTask | null>(null);

  const [eventModalOpen, setEventModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [wishModalOpen, setWishModalOpen] = useState<boolean>(false);
  const [editingWish, setEditingWish] = useState<WishItem | null>(null);

  const [personModalOpen, setPersonModalOpen] = useState<boolean>(false);
  const [permModalMember, setPermModalMember] = useState<FamilyMember | null>(null);

  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [activeMediaModal, setActiveMediaModal] = useState<MediaContentItem | null>(null);
  const [activeCommercialModal, setActiveCommercialModal] = useState<CommercialCatalogItem | null>(null);
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

  // Sync theme, color mode (light/dark), direction, language, and localStorage
  useEffect(() => {
    const colorMode = resolveColorMode(state.darkMode);
    document.documentElement.dataset.theme = state.role || 'mom';
    document.documentElement.dataset.colorMode = colorMode;
    document.documentElement.classList.toggle('dark', colorMode === 'dark');
    document.documentElement.lang = state.language === 'en' ? 'en' : 'ar';
    document.documentElement.dir = state.language === 'en' ? 'ltr' : 'rtl';
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      showToast('تعذر الحفظ في المتصفح. صدّر نسخة احتياطية من الإعدادات.');
    }
  }, [state]);

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
    if (shouldTriggerSkeletonForTab(page) && page !== activePage) {
      setIsTabLoading(true);
      tabLoadingTimerRef.current = window.setTimeout(() => {
        setIsTabLoading(false);
        tabLoadingTimerRef.current = null;
      }, SKELETON_LOAD_DURATION_MS);
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
          ? '🌙 Dark Mode enabled — Eye-friendly charcoal palette'
          : '🌙 تم تفعيل الوضع الليلي المريح للعين'
        : lang === 'en'
        ? '☀️ Light Mode enabled — Calm Teal & Warm Coral palette'
        : '☀️ تم تفعيل الوضع النهاري المريح للعين'
    );
  };

  // Precise City/Governorate Dropdown Change Handler (SA & EG individual cities)
  const handleSelectPreciseCity = (combinedValue: string) => {
    const [countryRaw, cityVal] = combinedValue.split(':');
    const nextCountry: CountryCode = countryRaw === 'SA' ? 'SA' : 'EG';
    const cityObj = COUNTRY_CITIES_MAP[nextCountry].find((c) => c.id === cityVal) || COUNTRY_CITIES_MAP[nextCountry][0];
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
        ? `📍 Location updated to ${cityObj.nameEn} (${nextCurrency}) — Nearby services sorted`
        : `📍 تم تحديد المدينة: ${cityObj.nameAr} (${nextCurrency}) وترتيب الخدمات الأقرب إليك`
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
            ? `📍 GPS Active: Nearest city ${nearest.city.nameEn} (${nearest.distanceKm} km) — Sorted by proximity`
            : `📍 Location calibrated to ${nearest.city.nameEn} — Nearby clinics & stores sorted`
          : fromGps
          ? `📍 تم تفعيل GPS: أقرب مدينة ${nearest.city.nameAr} (${nearest.distanceKm} كم) — تم ترتيب العيادات والمتاجر`
          : `📍 تم ضبط الموقع على ${nearest.city.nameAr} وترتيب العيادات والمتاجر الأقرب إليك`
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
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setChildPhotoDraft(reader.result);
        setChildUse3DAvatarDraft(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChild = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const gender = fd.get('gender') === 'girl' ? 'girl' : 'boy';
    const birth = String(fd.get('birth') || '').trim();
    const interests = String(fd.get('interests') || '').trim();
    const bloodType = String(fd.get('bloodType') || '').trim();
    const vaccinationsNote = String(fd.get('vaccinationsNote') || '').trim();
    const healthNotePrivate = String(fd.get('healthNotePrivate') || '').trim();
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
        id: Date.now() + Math.floor(Math.random() * 100),
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

    setChildModalOpen(false);
    setEditingChild(null);
    showToast(lang === 'en' ? 'Child 3D profile saved!' : 'تم حفظ ملف الطفل وهويته ثلاثية الأبعاد بنجاح');
  };

  const handleConfirmDeleteChild = () => {
    if (confirmDeleteChildId === null) return;
    setState((prev) => deleteChildCascade(prev, confirmDeleteChildId));
    setConfirmDeleteChildId(null);
    showToast('تم حذف ملف الطفل والعناصر المرتبطة به');
  };

  // Routine Task CRUD
  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    if (!name) {
      showToast('اكتب اسم المهمة قبل الحفظ');
      return;
    }
    const time = String(fd.get('time') || '').trim();
    const kidIdRaw = String(fd.get('kidId') || '');
    const kidId = kidIdRaw ? Number(kidIdRaw) : null;
    const category = String(fd.get('category') || 'روتين عام');
    const owner = String(fd.get('owner') || 'مشترك');
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
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((tItem) => (tItem.id === id ? { ...tItem, done } : tItem)),
    }));
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
    const title = String(fd.get('title') || '').trim();
    const date = String(fd.get('date') || '').trim();
    const time = String(fd.get('time') || '').trim();
    const type = String(fd.get('type') || 'موعد عائلي');
    const childIdRaw = String(fd.get('childId') || '');
    const childId = childIdRaw ? Number(childIdRaw) : null;
    const repeatRaw = String(fd.get('repeat') || 'none');
    const repeat =
      repeatRaw === 'weekly' || repeatRaw === 'monthly' || repeatRaw === 'yearly'
        ? repeatRaw
        : 'none';
    const note = String(fd.get('note') || '').trim();

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
    const name = String(fd.get('name') || '').trim();
    const price = Number(fd.get('price'));
    const kid = Number(fd.get('kid'));
    const progress = Number(fd.get('progress') ?? 40);
    const goalType = String(fd.get('goalType') || 'هدية / أمنية').trim();
    const emoji = String(fd.get('emoji') || '🎁');

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
    setState((prev) => ({
      ...prev,
      wishes: prev.wishes.map((w) =>
        w.id === id
          ? { ...w, reserved: !w.reserved, progress: !w.reserved ? 100 : w.progress }
          : w
      ),
    }));
    showToast('تم تحديث حالة حجز الأمنية');
  };

  const handleUpdateWishProgress = (id: number, delta: number) => {
    setState((prev) => ({
      ...prev,
      wishes: prev.wishes.map((w) => {
        if (w.id !== id) return w;
        const nextProg = Math.max(0, Math.min(100, (w.progress || 0) + delta));
        return { ...w, progress: nextProg, reserved: nextProg === 100 ? true : w.reserved };
      }),
    }));
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
        ? `تمت الإضافة بنجاح — Added "${item.nameEn}" to your family cart`
        : `تمت الإضافة بنجاح — أُضيف «${item.name}» إلى سلة التسوق`
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

  const handleCompleteDemoCheckout = (paymentMethod: CheckoutPaymentMethodType = 'electronic_card') => {
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
    const name = String(fd.get('name') || '').trim();
    if (!name) {
      showToast('اكتب اسم الفرد قبل الإضافة');
      return;
    }
    const role = String(fd.get('role') || 'فرد آخر');
    const side = String(fd.get('side') || 'الأسرة الأساسية');
    const isCore = role === 'الأب' || role === 'الأم';
    const perms = getDefaultPermissions(isCore);

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
    showToast('تمت إزالة الفرد من النموذج');
  };

  // Assistant handler
  const handleAskAssistant = () => {
    if (!assistantQuestion.trim()) {
      showToast('اكتب سؤالك أولًا لعرض الإرشاد التربوي');
      return;
    }
    const responses: Record<string, string> = {
      sleep:
        'جرّبوا روتينًا هادئًا وثابتًا قبل النوم بـ 45 دقيقة (تخفيف الإضاءة، إيقاف الشاشات، حمام دافئ، وقصة قصيرة). انتظام موعد الاستيقاظ صباحًا يضبط الساعة البيولوجية للطفل. إذا استمرت صعوبات النوم أو صاحبتها أعراض تنفسية، راجعوا طبيب الأطفال.',
      food:
        'قدّموا أطعمة متنوعة بألوان وأشكال جذابة مناسبة لعمر الطفل دون ضغط أو إجبار، مع إشراك الطفل في اختيار الخضروات والفواكه. في حالة الاشتباه في حساسية طعام أو ضعف النمو، استشيروا طبيب الأطفال أو أخصائي التغذية.',
      play:
        'الأنشطة الحسية وألعاب الفك والتركيب والقراءة التفاعلية لمدة 20 دقيقة يوميًا تبني التركيز والمهارات اللغوية والحركية. شاركوا الطفل اللعب واصفوا ما يفعله بكلمات واضحة ومشجعة.',
      behavior:
        'سمّوا مشاعر الطفل بهدوء («أنا فاهم إنك زعلان لأن وقت اللعب انتهى»)، وضعوا حدودًا واضحة وثابتة دون صراخ، وامدحوا السلوك الإيجابي فور حدوثه لتعزيز الأمان العاطفي.',
      health:
        'احتفظوا بسجل التطعيمات ومنحنيات الطول والوزن محدثًا في ملف الطفل، وتابعوا الفحوصات الدورية للنظر والأسنان والسمع. هذا الإرشاد توعوي عام ولا يغني عن الفحص الطبي المتخصص.',
    };
    setAssistantAnswer(responses[assistantTopic] || responses.sleep);
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
    setState((prev) => ({
      ...prev,
      parentName: settingsParentName.trim() || 'ولي الأمر',
      role: settingsRole,
      language: settingsLanguage,
      calendarMode: settingsCalendarMode,
    }));
    showToast(
      lang === 'en'
        ? 'تم الحفظ بنجاح — Experience & language preferences saved'
        : 'تمت الإضافة والحفظ بنجاح — تم حفظ تفضيلات التجربة واللغة والتقويم'
    );
  };

  const handleSaveBottomInternationalAndPhone = () => {
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
          ? `OTP required to change phone/country. Enter demo code ${DEMO_OTP_CODE}`
          : `يتطلب تغيير الدولة أو رقم الهاتف رمز تحقق OTP. أدخل الرمز التجريبي ${DEMO_OTP_CODE}`
      );
      return;
    }

    if (settingsOtpStep && settingsOtpCode.trim() !== DEMO_OTP_CODE) {
      showToast(
        lang === 'en'
          ? `Invalid OTP code. Use ${DEMO_OTP_CODE}`
          : `رمز التحقق غير صحيح. استخدم الرمز التجريبي ${DEMO_OTP_CODE}`
      );
      return;
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
            phoneVerified: true,
          },
        },
      };
    });
    setSettingsOtpStep(false);
    setSettingsOtpCode('');
    setCurrencySuggestionBanner(null);
    showToast(
      lang === 'en'
        ? '✓ Country, City, Currency & Verified Phone updated!'
        : '✓ تم تحديث الدولة والمدينة والعملة وتوثيق رقم الهاتف الدولي بنجاح!'
    );
  };

  const handleExportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-space-backup-${todayISO}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      showToast('بدأ تنزيل نسخة بياناتك الاحتياطية بصيغة JSON');
    } catch {
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
    localStorage.removeItem(STORAGE_KEY);
    const fresh = normalizeAppData(DEFAULT_SEED);
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

  // Filtered tasks for Routine screen (including Reminder status filter)
  const filteredTasks = useMemo(() => {
    return state.tasks.filter((task) => {
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
    { id: 'home', label: t(lang, 'navHome'), shortLabel: lang === 'en' ? 'Home' : 'الرئيسية', iconId: 'home' },
    { id: 'children', label: t(lang, 'navChildren'), shortLabel: lang === 'en' ? 'Kids 3D' : 'الأطفال', iconId: 'children' },
    { id: 'routine', label: t(lang, 'navRoutine'), shortLabel: lang === 'en' ? 'Routine' : 'الروتين', iconId: 'routine' },
    { id: 'calendar', label: t(lang, 'navCalendar'), shortLabel: lang === 'en' ? 'Calendar' : 'التقويم', iconId: 'calendar' },
    { id: 'wishes', label: t(lang, 'navWishes'), shortLabel: lang === 'en' ? 'Wishes' : 'الأمنيات', iconId: 'wishes' },
    { id: 'medical', label: t(lang, 'navMedical'), shortLabel: lang === 'en' ? 'Medical' : 'الطب', iconId: 'health' },
    { id: 'media', label: t(lang, 'navMedia'), shortLabel: lang === 'en' ? 'Reels' : 'الريلز', iconId: 'video' },
    { id: 'community', label: t(lang, 'navCommunity'), shortLabel: lang === 'en' ? 'Community' : 'المجتمع', iconId: 'star' },
    { id: 'chat', label: t(lang, 'navChat'), shortLabel: lang === 'en' ? 'Chat' : 'المحادثات', iconId: 'shield' },
    { id: 'games', label: t(lang, 'navGames'), shortLabel: lang === 'en' ? '3D Games' : 'الألعاب', iconId: 'games' },
    { id: 'services', label: t(lang, 'navServices'), shortLabel: lang === 'en' ? 'Store' : 'المتجر', iconId: 'services' },
    { id: 'notifications', label: t(lang, 'navNotifications'), shortLabel: lang === 'en' ? 'Alerts' : 'الإشعارات', iconId: 'notifications' },
    { id: 'assistant', label: lang === 'en' ? 'AI Agent' : 'مساعد الذكاء الاصطناعي', shortLabel: lang === 'en' ? 'AI Agent' : 'مساعد الذكاء الاصطناعي', iconId: 'assistant' },
    { id: 'family', label: t(lang, 'navFamily'), shortLabel: lang === 'en' ? 'Family' : 'العائلة', iconId: 'family' },
    { id: 'settings', label: lang === 'en' ? 'Profile & Settings' : 'الحساب والإعدادات', shortLabel: lang === 'en' ? 'Profile' : 'الحساب', iconId: 'settings' },
    { id: 'privacy', label: lang === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية', shortLabel: lang === 'en' ? 'Privacy' : 'الخصوصية', iconId: 'shield' },
    { id: 'terms', label: lang === 'en' ? 'Terms & IP Rights' : 'الشروط وحقوق الملكية', shortLabel: lang === 'en' ? 'Terms & IP' : 'الشروط والملكية', iconId: 'star' },
    { id: 'contact', label: lang === 'en' ? 'Contact Us' : 'تواصل معنا', shortLabel: lang === 'en' ? 'Contact' : 'تواصل معنا', iconId: 'notifications' },
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
    state.darkMode,
    lang
  );

  const handleSelectParentProfile = (targetRole: 'mom' | 'dad') => {
    const isDad = targetRole === 'dad';
    const nextName = isDad ? 'بابا (أحمد)' : 'ماما (سارة)';
    setState((prev) => ({
      ...prev,
      role: targetRole,
      activeParentAccount: isDad ? 'father' : 'mother',
      parentName: nextName,
    }));
    showToast(
      isDad
        ? lang === 'en'
          ? 'Father Profile active — Teal & Slate Blue (Dad Ahmed)'
          : 'تم تفعيل حساب الأب (بابا أحمد) — سمة التييل والأزرق الأردوازي'
        : lang === 'en'
        ? 'Mother Profile active — Soft Coral & Warm Rose (Mom Sara)'
        : 'تم تفعيل حساب الأم (ماما سارة) — سمة المرجان الدافئ والوردي الناعم'
    );
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-24 lg:pb-8">
      {/* Top Bar Contract: Brand Wordmark (Nekbaar - نكبر) + Primary Nav + Minimal Theme/Lang/Profile Controls */}
      <header
        id="main-sticky-header"
        data-scrolled={isScrolled ? 'true' : 'false'}
        className="sticky top-0 z-30 border-b border-[var(--color-border)] glass-sticky-header"
      >
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Zone 1: Single-line Official Brand Wordmark (Nekbaar - نكبر) */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-extrabold tracking-tight text-[var(--color-text)] whitespace-nowrap shrink-0 text-start"
          >
            <ThreeDIcon id="home" size={22} />
            <span>{t(lang, 'brandName')}</span>
          </button>

          {/* Zone 2: Primary Single-Line Nav Links (Desktop) */}
          <nav
            className="hidden xl:flex items-center gap-3 text-xs font-bold text-[var(--color-muted)] min-w-0"
            aria-label="التنقل الرئيسي"
          >
            {(['home', 'medical', 'media', 'community', 'chat', 'assistant', 'services'] as PageId[]).map((pid) => {
              const item = navItems.find((n) => n.id === pid)!;
              const isActive = activePage === pid;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => navigateTo(pid)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'text-[var(--color-text)] border-[var(--color-accent)] font-extrabold'
                      : 'border-transparent hover:text-[var(--color-text)]'
                  }`}
                >
                  {item.shortLabel}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Zero-Clutter Minimal Sticky Controls (Dark Mode + Lang + Notifications + Color-Coded Parent Profile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Top Quick-Action Dark / Light Mode Toggle */}
            <button
              id="top-dark-mode-toggle"
              type="button"
              onClick={handleToggleDarkMode}
              aria-pressed={Boolean(state.darkMode)}
              aria-label={
                state.darkMode
                  ? lang === 'en'
                    ? 'Switch to Light Mode'
                    : 'التبديل إلى الوضع النهاري'
                  : lang === 'en'
                  ? 'Switch to Dark Mode'
                  : 'التبديل إلى الوضع الليلي'
              }
              className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold border whitespace-nowrap shrink-0 flex items-center gap-1 transition-all ${
                state.darkMode
                  ? 'border-teal-400/50 bg-teal-500/20 text-teal-200 hover:border-teal-300'
                  : 'border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] hover:border-[var(--color-accent)]'
              }`}
            >
              <span aria-hidden="true">{state.darkMode ? '☀️' : '🌙'}</span>
              <span className="hidden sm:inline">
                {state.darkMode
                  ? lang === 'en'
                    ? 'Light'
                    : 'نهاري'
                  : lang === 'en'
                  ? 'Dark'
                  : 'ليلي'}
              </span>
            </button>

            {/* Top Language Switcher (AR <-> EN) */}
            <button
              id="top-language-switcher"
              type="button"
              onClick={handleToggleTopLanguage}
              aria-label={lang === 'ar' ? 'Switch language to English' : 'التبديل إلى اللغة العربية'}
              className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] whitespace-nowrap shrink-0 hover:border-[var(--color-accent)]"
            >
              🌐 {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => navigateTo('notifications')}
              aria-label={t(lang, 'notifBtnLabel')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>🔔</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-contrast)] text-[10px] tabular-nums">
                {unreadNotifCount}
              </span>
            </button>

            {/* Color-Coded Parent Profile Drawer Trigger (Father Teal/Slate Blue vs. Mother Soft Coral/Warm Rose) */}
            <button
              id="open-profile-drawer-btn"
              type="button"
              data-parent-role={parentProfileSpec.role}
              onClick={() => setRoleModalOpen(true)}
              aria-label={lang === 'en' ? 'Open Profile & Quick Controls' : 'فتح درج الحساب والتحكم السريع'}
              style={{
                backgroundColor: parentProfileSpec.badgeBgCss,
                color: parentProfileSpec.badgeTextCss,
                borderColor: parentProfileSpec.badgeBorderCss,
              }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold border whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all"
            >
              <span aria-hidden="true">{state.role === 'dad' ? '👨🏻‍💼' : '👩🏻‍💼'}</span>
              <span className="hidden sm:inline">
                {lang === 'en' ? parentProfileSpec.displayNameEn : parentProfileSpec.displayNameAr}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container (Sidebar + Content Canvas) */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-7 pt-6 pb-8 grid grid-cols-1 lg:grid-cols-[256px_1fr] gap-7 items-start">
        {/* Sidebar Navigation with 3D Icon Family */}
        <aside className="hidden lg:block sticky top-20 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 soft-card-surface">
          <div className="pb-3.5 border-b border-[var(--color-border)] space-y-2.5">
            <div className="text-sm font-extrabold text-[var(--color-text)]">
              {lang === 'en' ? parentProfileSpec.greetingEn : parentProfileSpec.greetingAr}
            </div>
            <div
              style={{
                backgroundColor: parentProfileSpec.badgeBgCss,
                color: parentProfileSpec.badgeTextCss,
                borderColor: parentProfileSpec.badgeBorderCss,
              }}
              className="px-2.5 py-1 rounded-xl border text-[11px] font-extrabold inline-flex items-center gap-1.5"
            >
              <span aria-hidden="true">{state.role === 'dad' ? '🌊' : '🌸'}</span>
              <span>{lang === 'en' ? parentProfileSpec.roleBadgeEn : parentProfileSpec.roleBadgeAr}</span>
            </div>
            <button
              id="open-onboarding-wizard-btn"
              type="button"
              onClick={() => setOnboardingModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold bg-[var(--color-accent-soft)] text-[var(--color-role-text)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)] hover:text-white transition-colors"
            >
              {lang === 'en' ? '✨ Account & Profile Setup' : '✨ إعدادات الحساب السريعة'}
            </button>
          </div>

          <nav className="grid gap-1.5" aria-label={lang === 'en' ? 'Platform navigation' : 'قائمة أقسام المنصة'}>
            {navItems.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-start whitespace-nowrap ${
                    active
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-text)] font-extrabold shadow-2xs'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-control-muted)] hover:text-[var(--color-text)]'
                  }`}
                >
                  <ThreeDIcon id={item.iconId} size={22} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Viewport */}
        <main key={activePage} className="min-w-0 space-y-8 animate-page-enter">
          {/* Unified Top App Bar with Functional Back Button for all Nested / Inner Screens */}
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
              medical: {
                titleAr: 'الرعاية الطبية',
                titleEn: 'Medical Care',
                badgeAr: 'أطباء وعيادات وتطعيمات',
                badgeEn: 'Doctors, Clinics & Growth',
                iconId: 'health',
                tone: 'emerald',
                parentPage: 'home',
                parentLabelAr: 'رجوع',
                parentLabelEn: 'Back',
              },
              media: {
                titleAr: 'الميديا والريلز 9:16',
                titleEn: 'Educational Reels & Media',
                badgeAr: 'فيديوهات وبطاقات بصرية',
                badgeEn: 'Reels & Visual Guides',
                iconId: 'video',
                tone: 'indigo',
                parentPage: 'home',
                parentLabelAr: 'رجوع',
                parentLabelEn: 'Back',
              },
              chat: {
                titleAr: 'المحادثات المباشرة',
                titleEn: 'Direct Family & Expert Chat',
                badgeAr: 'تواصل فوري آمن',
                badgeEn: 'Direct Messaging',
                iconId: 'shield',
                tone: 'sky',
                parentPage: 'home',
                parentLabelAr: 'رجوع',
                parentLabelEn: 'Back',
              },
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
              routine: {
                titleAr: 'الروتين اليومي',
                titleEn: 'Daily Routine',
                badgeAr: `${completedTasksCount}/${state.tasks.length} مكتمل`,
                badgeEn: `${completedTasksCount}/${state.tasks.length} Done`,
                iconId: 'routine',
                tone: 'orange',
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

          {/* ================================================================
              PAGE 1: DECLUTTERED SUPER APP HOME
              1. Topmost Element: Main Topic / Core Value Proposition Hero + Precise City & GPS
              2. Core Family Hubs Grid (Primary 6 + Expandable)
              3. Segmented Tab View (Nearby Services & Store · Children · Schedule)
              ================================================================ */}
          {activePage === 'home' && (
            <section className="space-y-9" aria-label={lang === 'en' ? 'Home Dashboard' : 'الشاشة الرئيسية'}>
              {/* 1. VERY FIRST ELEMENT ON PAGE: Unobstructed Personalized Greeting & Core Value Proposition */}
              {(() => {
                const heroBgSpec = getCardBackgroundSpec(
                  state.role === 'dad' ? 'medical' : 'family',
                  state.darkMode
                );

                return (
                  <div
                    id="home-core-value-hero"
                    data-testid="home-core-value-hero"
                    data-parent-profile={parentProfileSpec.role}
                    style={{
                      backgroundImage: heroBgSpec.backgroundImageCss,
                      borderColor: parentProfileSpec.badgeBorderCss,
                    }}
                    className="image-bg-card rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-5"
                  >
                    <div className="space-y-4 max-w-3xl">
                      {/* Top Personalized Greeting Badge & Parent Profile Switcher (Zero City Clutter) */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            id="hero-parent-role-badge"
                            style={{
                              backgroundColor: parentProfileSpec.badgeBgCss,
                              color: parentProfileSpec.badgeTextCss,
                              borderColor: parentProfileSpec.badgeBorderCss,
                            }}
                            className="px-3.5 py-1 rounded-full text-xs font-extrabold border shadow-2xs inline-flex items-center gap-1.5"
                          >
                            <span aria-hidden="true">{state.role === 'dad' ? '🌊' : '🌸'}</span>
                            <span>
                              {lang === 'en'
                                ? parentProfileSpec.roleBadgeEn
                                : parentProfileSpec.roleBadgeAr}
                            </span>
                          </span>
                          <span className="image-card-badge px-3 py-1 rounded-full text-xs font-extrabold">
                            {t(lang, 'brandName')}
                          </span>
                        </div>

                        {/* Instant Parent Profile Switcher: Father (Teal/Slate Blue) vs. Mother (Soft Coral/Warm Rose) */}
                        <div
                          role="group"
                          aria-label={lang === 'en' ? 'Switch Parent Profile' : 'التبديل بين حساب الأب وحساب الأم'}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)]/90 backdrop-blur-md p-1 border border-[var(--color-border)] shadow-2xs"
                        >
                          <button
                            id="switch-parent-dad-btn"
                            type="button"
                            onClick={() => handleSelectParentProfile('dad')}
                            aria-pressed={state.role === 'dad'}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                              state.role === 'dad'
                                ? 'bg-[#0d9488] text-white shadow-2xs'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                            }`}
                          >
                            <span aria-hidden="true">👨🏻‍💼</span>
                            <span>{lang === 'en' ? 'Dad (Ahmed)' : 'بابا (أحمد)'}</span>
                          </button>
                          <button
                            id="switch-parent-mom-btn"
                            type="button"
                            onClick={() => handleSelectParentProfile('mom')}
                            aria-pressed={state.role !== 'dad'}
                            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all flex items-center gap-1 ${
                              state.role !== 'dad'
                                ? 'bg-[#E86A3D] text-white shadow-2xs'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                            }`}
                          >
                            <span aria-hidden="true">👩🏻‍💼</span>
                            <span>{lang === 'en' ? 'Mom (Sara)' : 'ماما (سارة)'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Absolute First Main Topic Heading: Personalized Greeting */}
                      <div className="space-y-2">
                        <h1
                          id="home-main-greeting-heading"
                          className="image-card-title text-2xl sm:text-4xl font-extrabold leading-tight"
                        >
                          {lang === 'en'
                            ? `${parentProfileSpec.greetingEn} 👋`
                            : `${parentProfileSpec.greetingAr} 👋`}
                        </h1>
                        <p className="image-card-title text-base sm:text-xl font-extrabold leading-snug">
                          {lang === 'en'
                            ? 'Nekbaar - نكبر · Everything Your Family Needs for Child Health, Daily Routines & Trusted Care'
                            : 'Nekbaar - نكبر · كل ما تحتاجه أسرتك لصحة طفلك، روتينه اليومي، وأفضل الأطباء والمتاجر الموثوقة'}
                        </p>
                      </div>

                      <p className="image-card-subtitle text-xs sm:text-sm font-semibold leading-relaxed max-w-2xl">
                        {lang === 'en'
                          ? 'Personalized for ages Day 1 to 8 Years · Instant pediatric booking, smart AI routine planning, and verified family stores.'
                          : 'تجربة هادئة ومخصصة لعمر طفلك من أول يوم حتى 8 سنوات · حجز أطباء معتمدين، مساعد ذكي للروتين، ومتجر متكامل لأسرتك.'}
                      </p>

                      <div className="pt-1 flex flex-wrap items-center gap-2.5">
                        <PrimaryCtaButton variant="teal" size="md" onClick={() => navigateTo('medical')}>
                          {lang === 'en' ? '🩺 Book Pediatrician' : '🩺 احجز موعد طبيب'}
                        </PrimaryCtaButton>
                        <PrimaryCtaButton variant="orange" size="md" onClick={() => navigateTo('services')}>
                          {lang === 'en' ? '🛍️ Explore Family Store' : '🛍️ تسوّق متجر الأسرة'}
                        </PrimaryCtaButton>
                        <button
                          type="button"
                          onClick={() => navigateTo('assistant')}
                          className="image-card-badge min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold hover:opacity-95 transition-opacity"
                        >
                          {lang === 'en' ? '✨ Smart AI Assistant' : '✨ المساعد الذكي AI'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. DECLUTTERED CORE HUBS GRID (Primary 6 Hubs + Optional Expand for Secondary Tools) */}
              <div className="space-y-5">
                <div className="section-heading-block">
                  <h2 className="section-heading-centered">
                    {lang === 'en' ? 'Core Family Hubs' : 'الأقسام والخدمات الرئيسية'}
                  </h2>
                  <p className="section-subtitle-centered">
                    {lang === 'en'
                      ? 'Focused access to your essential daily family services'
                      : 'وصول سريع ومرتب لأهم خدمات الأسرة والطفل بدون تشتيت'}
                  </p>
                </div>

                {(() => {
                  const allHubCards = [
                    {
                      id: 'medical' as PageId,
                      title: lang === 'en' ? 'Medical Care' : 'الرعاية الطبية',
                      subtitle: lang === 'en' ? 'Pediatricians & Growth' : 'أطباء الأطفال والنمو',
                      badge: lang === 'en' ? 'Doctors & Clinics' : 'أطباء وعيادات',
                    },
                    {
                      id: 'services' as PageId,
                      title: lang === 'en' ? 'Family Store' : 'المتجر والخدمات',
                      subtitle: lang === 'en' ? 'Toys, Apparel & Nurseries' : 'ألعاب ومستلزمات وحضانات',
                      badge:
                        cartItemCount > 0
                          ? lang === 'en'
                            ? `${cartItemCount} in Cart`
                            : `${cartItemCount} في السلة`
                          : lang === 'en'
                          ? 'Products & Offers'
                          : 'منتجات وحضانات',
                    },
                    {
                      id: 'assistant' as PageId,
                      title: lang === 'en' ? 'AI Agent' : 'مساعد الذكاء الاصطناعي',
                      subtitle: lang === 'en' ? 'Smart Routine & Advice' : 'إرشاد وتصميم روتين',
                      badge: lang === 'en' ? 'Chat & Create' : 'محادثة وإنشاء',
                    },
                    {
                      id: 'children' as PageId,
                      title: lang === 'en' ? 'Kids Profiles 3D' : 'ملفات الأطفال',
                      subtitle: lang === 'en' ? '3D Identity & Milestones' : 'هوية 3D ومتابعة النمو',
                      badge: `${state.kids.length} ${lang === 'en' ? 'Profiles' : 'ملفات مسجلة'}`,
                    },
                    {
                      id: 'routine' as PageId,
                      title: lang === 'en' ? 'Daily Routine' : 'الروتين اليومي',
                      subtitle: lang === 'en' ? 'Habits & Smart Alerts' : 'مهام وتذكيرات ذكية',
                      badge: `${completedTasksCount}/${state.tasks.length} ${lang === 'en' ? 'Done' : 'مكتمل'}`,
                    },
                    {
                      id: 'community' as PageId,
                      title: lang === 'en' ? 'Parents Community' : 'مجتمع الآباء',
                      subtitle: lang === 'en' ? 'Real Parent Experiences' : 'تجارب ونقاشات يومية',
                      badge: lang === 'en' ? 'Discussions' : 'تجارب ونقاشات',
                    },
                    {
                      id: 'media' as PageId,
                      title: lang === 'en' ? 'Media & Reels' : 'الميديا والريلز',
                      subtitle: lang === 'en' ? '60s Visual Parenting Tips' : 'نصائح بصرية سريعة',
                      badge: lang === 'en' ? '9:16 Videos' : 'فيديوهات 9:16',
                    },
                    {
                      id: 'calendar' as PageId,
                      title: lang === 'en' ? 'Calendar' : 'التقويم والمواعيد',
                      subtitle: lang === 'en' ? 'Gregorian & Hijri Sync' : 'تقويم ميلادي وهجري',
                      badge: `${state.events.length} ${lang === 'en' ? 'Events' : 'مواعيد'}`,
                    },
                    {
                      id: 'wishes' as PageId,
                      title: lang === 'en' ? 'Kids Wishes' : 'أمنيات الأطفال',
                      subtitle: lang === 'en' ? 'Family Gift Goals' : 'أهداف وهدايا الطفل',
                      badge: `${state.wishes.length} ${lang === 'en' ? 'Wishes' : 'أمنيات'}`,
                    },
                    {
                      id: 'chat' as PageId,
                      title: lang === 'en' ? 'Internal Chat' : 'المحادثات',
                      subtitle: lang === 'en' ? 'Family & Specialist Chat' : 'تواصل عائلي واستشاري',
                      badge: lang === 'en' ? 'Direct Messages' : 'تواصل مباشر',
                    },
                    {
                      id: 'games' as PageId,
                      title: lang === 'en' ? '3D Kids Games' : 'ألعاب الأطفال 3D',
                      subtitle: lang === 'en' ? 'Safe Educational Play' : 'لعب تعليمي آمن',
                      badge: lang === 'en' ? 'Interactive' : 'ترفيه تعليمي',
                    },
                    {
                      id: 'settings' as PageId,
                      title: lang === 'en' ? 'Profile & Settings' : 'الحساب والإعدادات',
                      subtitle: lang === 'en' ? 'Theme, City & Backup' : 'إدارة الحساب والمدينة',
                      badge: lang === 'en' ? 'Account & Prefs' : 'إدارة الحساب',
                    },
                  ];

                  const visibleCards = showAllHomeHubs ? allHubCards : allHubCards.slice(0, 6);

                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
                        {visibleCards.map((card) => {
                          const bgSpec = getCardBackgroundSpec(card.id, state.darkMode);
                          return (
                            <button
                              key={card.id}
                              type="button"
                              data-image-card="true"
                              onClick={() => navigateTo(card.id)}
                              style={{ backgroundImage: bgSpec.backgroundImageCss }}
                              className="image-bg-card group min-h-[126px] sm:min-h-[138px] rounded-[24px] p-4 sm:p-5 flex flex-col justify-between items-start text-start cursor-pointer"
                            >
                              <div className="w-full flex items-center justify-end">
                                <span className="image-card-badge px-2.5 py-1 rounded-xl text-[10.5px] font-extrabold tabular-nums">
                                  {card.badge}
                                </span>
                              </div>
                              <div className="mt-4 w-full space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="image-card-title text-sm sm:text-base font-extrabold truncate">
                                    {card.title}
                                  </span>
                                  <span className="text-sm font-extrabold opacity-80 group-hover:translate-x-0.5 transition-transform">
                                    {lang === 'en' ? '→' : '←'}
                                  </span>
                                </div>
                                <p className="image-card-subtitle text-[11px] font-semibold truncate">
                                  {card.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-center pt-1">
                        <button
                          id="toggle-all-home-hubs-btn"
                          type="button"
                          onClick={() => setShowAllHomeHubs((prev) => !prev)}
                          className="min-h-[38px] px-5 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-role-text)] hover:border-[var(--color-accent)] transition-colors"
                        >
                          {showAllHomeHubs
                            ? lang === 'en'
                              ? 'Show Essential Hubs Only (6)'
                              : 'عرض الأقسام الأساسية فقط (6)'
                            : lang === 'en'
                            ? 'Explore All Family Tools & Sections (12)'
                            : 'عرض جميع أدوات وأقسام المنصة (12)'}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 3. ORGANIZED SEGMENTED TABS FOR LOCAL PICKS, CHILDREN & SCHEDULE (Decluttered Flow) */}
              <div
                id="home-decluttered-tabs"
                data-testid="home-horizontal-carousel"
                className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 space-y-6 soft-card-surface"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
                  <div className="text-center sm:text-start">
                    <h2 className="text-lg sm:text-xl font-extrabold text-[var(--color-heading)]">
                      {lang === 'en'
                        ? 'Your Local Services & Family Snapshot'
                        : 'الخدمات القريبة وملخص الأسرة اليومي'}
                    </h2>
                    <p className="text-xs font-semibold text-[var(--color-muted)] mt-0.5">
                      {lang === 'en'
                        ? `Filtered for ${locText(state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'), lang)} · Switch tabs below`
                        : `مخصص لمدينة ${locText(state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'), lang)} · تنقّل بين التبويبات المنظمة`}
                    </p>
                  </div>

                  {/* Clean Internal Segmented Tabs */}
                  <div
                    role="tablist"
                    aria-label={lang === 'en' ? 'Home organized sections' : 'تبويبات الشاشة الرئيسية المنظمة'}
                    className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-[var(--color-control-muted)] p-1.5"
                  >
                    {[
                      {
                        id: 'nearby' as const,
                        label: lang === 'en' ? '📍 Nearby Store & Clinics' : '📍 الأقرب في مدينتك',
                      },
                      {
                        id: 'children' as const,
                        label: lang === 'en' ? `👧🏻 Kids (${state.kids.length})` : `👧🏻 الأطفال (${state.kids.length})`,
                      },
                      {
                        id: 'schedule' as const,
                        label: lang === 'en' ? '📅 Schedule & Routine' : '📅 المواعيد والروتين',
                      },
                    ].map((tab) => {
                      const active = homeFocusTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setHomeFocusTab(tab.id)}
                          className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                            active
                              ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-2xs'
                              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TAB 1: NEARBY SERVICES & STORE (Sorted dynamically by City & GPS Distance) */}
                {homeFocusTab === 'nearby' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--color-control-muted)] p-3 border border-[var(--color-border)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor="home-city-filter-select" className="text-xs font-extrabold text-[var(--color-text)]">
                          📍 {lang === 'en' ? 'City:' : 'المدينة:'}
                        </label>
                        <select
                          id="home-city-filter-select"
                          value={`${state.country}:${state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}`}
                          onChange={(e) => handleSelectPreciseCity(e.target.value)}
                          className="min-h-[36px] rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-accent)]"
                        >
                          <optgroup label={lang === 'en' ? '🇸🇦 Saudi Arabia (Cities)' : '🇸🇦 السعودية (المدن والمحافظات)'}>
                            {COUNTRY_CITIES_MAP.SA.map((c) => (
                              <option key={`sa-${c.id}`} value={`SA:${c.id}`}>
                                {lang === 'en' ? `${c.nameEn} — Saudi Arabia` : `${c.nameAr} — السعودية`}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label={lang === 'en' ? '🇪🇬 Egypt (Cities & Governorates)' : '🇪🇬 مصر (المدن والمحافظات)'}>
                            {COUNTRY_CITIES_MAP.EG.map((c) => (
                              <option key={`eg-${c.id}`} value={`EG:${c.id}`}>
                                {lang === 'en' ? `${c.nameEn} — Egypt` : `${c.nameAr} — مصر`}
                              </option>
                            ))}
                          </optgroup>
                        </select>

                        <button
                          id="use-current-location-btn"
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                            geoStatus === 'active'
                              ? 'bg-[#0d9488] text-white shadow-2xs'
                              : 'bg-[var(--color-surface)] text-[var(--color-role-text)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
                          }`}
                        >
                          <span aria-hidden="true">📍</span>
                          <span>
                            {geoStatus === 'locating'
                              ? lang === 'en'
                                ? 'Detecting GPS...'
                                : 'جاري تحديد موقعك...'
                              : geoStatus === 'active'
                              ? lang === 'en'
                                ? 'GPS Sorted (Closest)'
                                : 'مرتب حسب الأقرب (GPS)'
                              : lang === 'en'
                              ? 'Use my current location'
                              : 'استخدم موقعي الحالي'}
                          </span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigateTo('services')}
                        className="text-xs font-extrabold text-[var(--color-role-text)] hover:underline"
                      >
                        {lang === 'en' ? 'Open Full Store →' : 'عرض المتجر كاملًا ←'}
                      </button>
                    </div>

                    <div className="horizontal-scroll-row py-1">
                      {sortCatalogByCityAndProximity(
                        COMMERCIAL_CATALOG,
                        state.country,
                        state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'),
                        userCoords
                      )
                        .slice(0, 6)
                        .map((item) => {
                          const price = state.currency === 'SAR' ? item.priceSAR : item.priceEGP;
                          const itemBg = getCardBackgroundSpec(item.category, state.darkMode);
                          return (
                            <div
                              key={`home-carousel-${item.id}`}
                              className="w-[270px] sm:w-[295px] rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden soft-card-surface flex flex-col justify-between transition-transform duration-200 hover:scale-[1.02]"
                            >
                              <div
                                style={{ backgroundImage: itemBg.backgroundImageCss }}
                                className="image-bg-card !rounded-none !border-0 p-4 min-h-[108px] flex flex-col justify-between"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="image-card-badge px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold truncate">
                                    {locText(item.categoryLabel, lang)}
                                  </span>
                                  <span className="image-card-badge px-2 py-0.5 rounded-lg text-[10px] font-extrabold tabular-nums">
                                    📍 {locText(item.city, lang)} · {item.estimatedDistanceKm}{' '}
                                    {lang === 'en' ? 'km' : 'كم'}
                                  </span>
                                </div>
                                <h3 className="image-card-title text-sm sm:text-base font-extrabold line-clamp-1 mt-2">
                                  {lang === 'en' ? item.nameEn : item.name}
                                </h3>
                              </div>
                              <div className="p-4 flex items-center justify-between gap-2">
                                <div className="text-sm font-extrabold text-[var(--color-role-text)] tabular-nums">
                                  {formatCurrency(price, state.currency, state.language)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(item)}
                                    className="min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] active:scale-95 transition-transform"
                                  >
                                    {lang === 'en' ? '+ Add to Cart' : '+ أضف للسلة'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => navigateTo('services')}
                                    className="min-h-[36px] px-2.5 py-1.5 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)]"
                                  >
                                    {lang === 'en' ? 'View' : 'عرض'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* TAB 2: CHILDREN 3D PROFILES */}
                {homeFocusTab === 'children' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[var(--color-text)]">
                        {t(lang, 'yourChildren')}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigateTo('children')}
                        className="min-h-[34px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[var(--color-accent-soft)] text-[var(--color-role-text)]"
                      >
                        {t(lang, 'manageProfiles')}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {state.kids.map((kid) => {
                        const ageInfo = calculateChildAge(kid.birth, state.language);
                        const displayKidName = locText(kid.name, lang);
                        return (
                          <button
                            key={kid.id}
                            type="button"
                            onClick={() => navigateTo('children')}
                            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] p-4 flex items-center gap-3.5 text-start hover:border-[var(--color-accent)] hover:scale-[1.01] transition-all"
                          >
                            <ThreeDChildAvatar
                              name={displayKidName}
                              gender={kid.gender}
                              stageCode={ageInfo.stageCode}
                              accessoryTheme={kid.avatarTheme || 'astronaut'}
                              photoDataUrl={kid.photoDataUrl}
                              useIllustratedAvatar={kid.useIllustratedAvatar}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-extrabold text-sm text-[var(--color-text)] truncate">
                                {displayKidName}
                              </div>
                              <div className="text-xs text-[var(--color-muted)] tabular-nums truncate">
                                {ageInfo.label} · {locText(kid.interests, lang)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: UPCOMING SCHEDULE & ROUTINE */}
                {homeFocusTab === 'schedule' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nearestEvent ? (
                      <button
                        type="button"
                        onClick={() => navigateTo('calendar')}
                        style={{
                          backgroundImage: getCardBackgroundSpec('calendar', state.darkMode).backgroundImageCss,
                        }}
                        className="image-bg-card w-full rounded-2xl p-5 flex items-center justify-between gap-3 text-start"
                      >
                        <div className="min-w-0">
                          <span className="image-card-badge px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold">
                            {t(lang, 'nearestAppointment')}
                          </span>
                          <div className="image-card-title font-extrabold text-sm sm:text-base truncate mt-2">
                            {locText(nearestEvent.title, lang)}
                          </div>
                          <div className="image-card-subtitle text-xs tabular-nums truncate mt-1">
                            {nearestEvent.date} {nearestEvent.time ? `· ${locText(nearestEvent.time, lang)}` : ''}
                          </div>
                        </div>
                        <span className="image-card-badge px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0">
                          {t(lang, 'openCalendar')}
                        </span>
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-5 text-center text-xs text-[var(--color-muted)]">
                        {t(lang, 'noUpcomingEvents')}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => navigateTo('routine')}
                      style={{
                        backgroundImage: getCardBackgroundSpec('routine', state.darkMode).backgroundImageCss,
                      }}
                      className="image-bg-card w-full rounded-2xl p-5 flex items-center justify-between gap-3 text-start"
                    >
                      <div className="min-w-0">
                        <span className="image-card-badge px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold">
                          {lang === 'en' ? 'Daily Routine Progress' : 'إنجاز الروتين اليومي'}
                        </span>
                        <div className="image-card-title font-extrabold text-sm sm:text-base truncate mt-2">
                          {completedTasksCount} / {state.tasks.length}{' '}
                          {lang === 'en' ? 'Tasks Completed Today' : 'مهام مكتملة اليوم'}
                        </div>
                        <div className="image-card-subtitle text-xs truncate mt-1">
                          {todayFormatted.combined}
                        </div>
                      </div>
                      <span className="image-card-badge px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0">
                        {lang === 'en' ? 'Open Routine' : 'فتح الروتين'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 2: CHILDREN PROFILES & 3D IDENTITY (إدارة الأطفال 3D)
              ================================================================ */}
          {activePage === 'children' && (
            <section className="space-y-6" aria-label={lang === 'en' ? 'Children Profiles' : 'ملفات الأطفال'}>
              <div
                style={{ backgroundImage: getCardBackgroundSpec('children', state.darkMode).backgroundImageCss }}
                className="image-bg-card rounded-[24px] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4"
              >
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="image-card-badge px-3 py-1 rounded-xl text-xs font-extrabold">
                    {lang === 'en' ? '0–8 Years' : 'من أول يوم حتى 8 سنوات'}
                  </span>
                  <span className="image-card-badge px-3 py-1 rounded-xl text-xs font-extrabold">
                    {lang === 'en' ? '3D Avatar & Photo' : 'هوية 3D وصورة حقيقية'}
                  </span>
                </div>
                <h2 className="image-card-title text-xl sm:text-2xl font-extrabold text-center">
                  {lang === 'en' ? '3D Child Profiles & Growth' : 'ملفات الأطفال ومتابعة النمو'}
                </h2>
                <PrimaryCtaButton variant="teal" onClick={openAddChild}>
                  {lang === 'en' ? '+ Add Child Profile' : '+ إضافة طفل جديد'}
                </PrimaryCtaButton>
              </div>

              {state.kids.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--color-border)] p-8 text-center text-sm font-bold text-[var(--color-muted)]">
                  {lang === 'en'
                    ? 'No child profiles yet. Tap "+ Add Child Profile" to create the first profile.'
                    : 'لا توجد ملفات أطفال حاليًا. اضغط على «إضافة طفل جديد» لإنشاء الملف الأول.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {state.kids.map((kid, idx) => {
                    const ageInfo = calculateChildAge(kid.birth, state.language);
                    const kidTasksCount = state.tasks.filter((tItem) => Number(tItem.kidId) === kid.id).length;
                    const kidEventsCount = state.events.filter((ev) => Number(ev.childId) === kid.id).length;
                    const kidWishesCount = state.wishes.filter((w) => Number(w.kid) === kid.id).length;
                    const themeObj =
                      AVATAR_ACCESSORY_THEMES.find((th) => th.id === kid.avatarTheme) ||
                      AVATAR_ACCESSORY_THEMES[0];
                    const cardTone = idx % 2 === 0 ? PASTEL_CARD_TONES.teal : PASTEL_CARD_TONES.rose;
                    const displayKidName = locText(kid.name, lang);

                    return (
                      <div
                        key={kid.id}
                        className={`rounded-[24px] border ${cardTone.card} p-5 sm:p-6 shadow-2xs space-y-4`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <ThreeDChildAvatar
                              name={displayKidName}
                              gender={kid.gender}
                              stageCode={ageInfo.stageCode}
                              accessoryTheme={kid.avatarTheme || 'astronaut'}
                              photoDataUrl={kid.photoDataUrl}
                              useIllustratedAvatar={kid.useIllustratedAvatar}
                              size="lg"
                            />
                            <div>
                              <h3 className="text-lg font-extrabold text-[var(--color-text)]">
                                {displayKidName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${cardTone.badge} tabular-nums`}>
                                  {ageInfo.label}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-white/90 text-[var(--color-text)]">
                                  ✨{' '}
                                  {kid.photoDataUrl && !kid.useIllustratedAvatar
                                    ? lang === 'en'
                                      ? 'Real Photo'
                                      : 'صورة حقيقية'
                                    : lang === 'en'
                                    ? themeObj.labelEn
                                    : themeObj.labelAr}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Compact Visual Tags for Growth & Linked Counts */}
                        <div className="grid grid-cols-3 gap-2.5">
                          <div className="rounded-2xl bg-white/85 border border-white p-3 text-center">
                            <div className="text-[10px] font-bold text-[var(--color-muted)]">
                              {lang === 'en' ? 'Routine' : 'الروتين'}
                            </div>
                            <div className="text-sm font-extrabold text-[var(--color-text)] tabular-nums">
                              {kidTasksCount} {lang === 'en' ? 'tasks' : 'مهام'}
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white/85 border border-white p-3 text-center">
                            <div className="text-[10px] font-bold text-[var(--color-muted)]">
                              {lang === 'en' ? 'Events' : 'المواعيد'}
                            </div>
                            <div className="text-sm font-extrabold text-[var(--color-text)] tabular-nums">
                              {kidEventsCount} {lang === 'en' ? 'events' : 'موعد'}
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white/85 border border-white p-3 text-center">
                            <div className="text-[10px] font-bold text-[var(--color-muted)]">
                              {lang === 'en' ? 'Wishes' : 'الأمنيات'}
                            </div>
                            <div className="text-sm font-extrabold text-[var(--color-text)] tabular-nums">
                              {kidWishesCount} {lang === 'en' ? 'wishes' : 'أمنية'}
                            </div>
                          </div>
                        </div>

                        {/* Stage & Health Compact Card */}
                        <div className="rounded-2xl bg-white/85 border border-white p-4 space-y-1.5 text-xs">
                          <div className="font-extrabold text-[var(--color-text)] flex items-center justify-between gap-2">
                            <span>📈 {ageInfo.stageTitle}</span>
                            {(kid.growthHeightCm || kid.growthWeightKg) && (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 text-[10px] font-extrabold tabular-nums">
                                {kid.growthHeightCm ? `${kid.growthHeightCm} ${lang === 'en' ? 'cm' : 'سم'}` : ''}
                                {kid.growthHeightCm && kid.growthWeightKg ? ' · ' : ''}
                                {kid.growthWeightKg ? `${kid.growthWeightKg} ${lang === 'en' ? 'kg' : 'كجم'}` : ''}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-[var(--color-muted)]">
                            🎯 {locText(kid.interests || 'لم تحدد الاهتمامات بعد', lang)} · 🔒 {lang === 'en' ? 'Vaccinations:' : 'التطعيمات:'}{' '}
                            {locText(kid.vaccinationsNote || 'محدثة', lang)}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-black/5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditChild(kid)}
                            className="flex-1 min-h-[42px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] shadow-2xs"
                          >
                            {lang === 'en' ? '✏️ Edit 3D Profile / Photo' : '✏️ تعديل الملف والهوية 3D'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteChildId(kid.id)}
                            className="min-h-[42px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-red-200 bg-white text-red-700"
                          >
                            {lang === 'en' ? 'Delete' : 'حذف الملف'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ================================================================
              PAGE 3: DAILY ROUTINE (الروتين اليومي + التذكيرات)
              ================================================================ */}
          {activePage === 'routine' && (
            <section className="space-y-6" aria-label={lang === 'en' ? 'Daily Routine' : 'الروتين اليومي'}>
              {/* Top Action & Smart Reminders Warm Image Card */}
              <div
                className="image-bg-card rounded-[24px] p-5 sm:p-6 space-y-4"
                style={{
                  backgroundImage: getCardBackgroundSpec('routine', state.darkMode).backgroundImageCss,
                }}
                aria-label={lang === 'en' ? 'Daily Routine Reminders' : 'تذكيرات الروتين اليومي'}
              >
                <div className="flex flex-col items-center justify-center text-center gap-3 py-2">
                  <span className="image-card-badge px-3 py-1 rounded-full text-xs font-extrabold tabular-nums">
                    {lang === 'en' ? 'Completed:' : 'مكتمل:'} {completedTasksCount}/{state.tasks.length}
                  </span>
                  <h2 className="section-heading-centered image-card-title">
                    {lang === 'en' ? 'Daily Routine & Smart Reminders' : 'الروتين اليومي والتذكيرات الذكية'}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResetTasks}
                      className="min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-white bg-white/90 text-slate-900 whitespace-nowrap"
                    >
                      {lang === 'en' ? 'Reset Progress' : 'إعادة ضبط الإنجاز'}
                    </button>
                    <PrimaryCtaButton
                      variant="orange"
                      onClick={() => {
                        setEditingTask(null);
                        setTaskModalOpen(true);
                      }}
                    >
                      {lang === 'en' ? '+ Add Task' : '+ إضافة مهمة'}
                    </PrimaryCtaButton>
                  </div>
                </div>

                {/* Quick Reminder Status Filter Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/50">
                  <div
                    className="flex flex-wrap items-center gap-1.5"
                    role="group"
                    aria-label={lang === 'en' ? 'Filter by reminder status' : 'تصفية حسب حالة التذكير'}
                  >
                    <button
                      type="button"
                      onClick={() => setRoutineReminderFilter('all')}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors ${
                        routineReminderFilter === 'all'
                          ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-transparent'
                          : 'border-[var(--color-border)] bg-white text-[var(--color-text)]'
                      }`}
                    >
                      {lang === 'en' ? `All (${state.tasks.length})` : `الكل (${state.tasks.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutineReminderFilter('overdue')}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors tabular-nums ${
                        routineReminderFilter === 'overdue'
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      ⏰ {lang === 'en' ? `Overdue (${routineRemindersSummary.overdueCount})` : `تجاوزت الموعد (${routineRemindersSummary.overdueCount})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutineReminderFilter('approaching')}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-colors tabular-nums ${
                        routineReminderFilter === 'approaching'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      🔔 {lang === 'en' ? `Approaching (${routineRemindersSummary.approachingCount})` : `اقترب موعدها (${routineRemindersSummary.approachingCount})`}
                    </button>
                  </div>

                  {/* Compact Reminder Controls */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <select
                      id="routineLeadWindow"
                      aria-label={lang === 'en' ? 'Alert lead window' : 'التنبيه قبل الموعد بـ'}
                      value={routineApproachingWindow}
                      onChange={(e) => setRoutineApproachingWindow(Number(e.target.value))}
                      className="rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)]"
                    >
                      <option value={30}>{lang === 'en' ? 'Alert 30m before' : 'تنبيه قبل 30 دقيقة'}</option>
                      <option value={60}>{lang === 'en' ? 'Alert 60m before' : 'تنبيه قبل 60 دقيقة'}</option>
                      <option value={90}>{lang === 'en' ? 'Alert 90m before' : 'تنبيه قبل 90 دقيقة'}</option>
                      <option value={120}>{lang === 'en' ? 'Alert 120m before' : 'تنبيه قبل 120 دقيقة'}</option>
                    </select>
                    <select
                      id="routineRefTime"
                      aria-label={lang === 'en' ? 'Reference time' : 'الوقت المرجعي لحساب التذكيرات'}
                      value={routineRefTimePreset}
                      onChange={(e) => setRoutineRefTimePreset(e.target.value)}
                      className="rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-xs font-bold text-[var(--color-text)]"
                    >
                      <option value="live">{lang === 'en' ? 'Live Current Time' : 'الوقت الحالي تلقائيًا'}</option>
                      <option value="07:15">{lang === 'en' ? 'Morning (07:15 AM)' : 'صباحًا (07:15 ص)'}</option>
                      <option value="15:45">{lang === 'en' ? 'Afternoon (03:45 PM)' : 'عصرًا (03:45 م)'}</option>
                      <option value="18:20">{lang === 'en' ? 'Evening (06:20 PM)' : 'مساءً (06:20 م)'}</option>
                      <option value="20:30">{lang === 'en' ? 'Night (08:30 PM)' : 'ليلًا (08:30 م)'}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 soft-card-surface space-y-5">
                {/* Day / Week / Month Tabs & Filters */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-2xl" role="tablist" aria-label={lang === 'en' ? 'Routine cadence' : 'نطاق تكرار الروتين'}>
                    {[
                      { id: 'all', label: lang === 'en' ? 'All Periods' : 'كل الفترات' },
                      { id: 'daily', label: lang === 'en' ? 'Daily' : 'اليوم' },
                      { id: 'weekly', label: lang === 'en' ? 'Weekly' : 'الأسبوع' },
                      { id: 'monthly', label: lang === 'en' ? 'Monthly' : 'الشهر' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRoutineCadenceFilter(tab.id as typeof routineCadenceFilter)}
                        className={`px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                          routineCadenceFilter === tab.id
                            ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      id="routineKidFilter"
                      aria-label={lang === 'en' ? 'Filter by child' : 'عرض مهام'}
                      value={routineKidFilter}
                      onChange={(e) => setRoutineKidFilter(e.target.value)}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
                    >
                      <option value="all">{lang === 'en' ? 'All Kids & Family' : 'كل الأطفال والأسرة'}</option>
                      {state.kids.map((k) => (
                        <option key={k.id} value={String(k.id)}>
                          {locText(k.name, lang)}
                        </option>
                      ))}
                    </select>
                    <select
                      id="routineStatusFilter"
                      aria-label={lang === 'en' ? 'Task status' : 'حالة المهمة'}
                      value={routineStatusFilter}
                      onChange={(e) => setRoutineStatusFilter(e.target.value as 'all' | 'open' | 'done')}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-xs font-bold text-[var(--color-text)]"
                    >
                      <option value="all">{lang === 'en' ? 'All Statuses' : 'كل الحالات'}</option>
                      <option value="open">{lang === 'en' ? 'Open' : 'غير مكتملة'}</option>
                      <option value="done">{lang === 'en' ? 'Completed' : 'مكتملة'}</option>
                    </select>
                  </div>
                </div>

                {/* Tasks Grid Cards with Visual Reminder Badges */}
                {filteredTasks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-bold text-[var(--color-muted)]">
                    {lang === 'en' ? 'No tasks match the current filter.' : 'لا توجد مهام مطابقة للتصفية الحالية.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTasks.map((task) => {
                      const assignedKid = task.kidId ? kidMap[String(task.kidId)] : null;
                      const reminder = getRoutineTaskReminder(
                        task,
                        effectiveNowMinutes,
                        routineApproachingWindow,
                        state.language
                      );
                      return (
                        <div
                          key={task.id}
                          className={`rounded-2xl border p-4 flex items-center justify-between gap-3 transition-all ${
                            reminder.status === 'overdue'
                              ? 'bg-red-50/75 border-red-200'
                              : reminder.status === 'approaching'
                              ? 'bg-amber-50/75 border-amber-200'
                              : task.done
                              ? 'bg-emerald-50/50 border-emerald-200/70'
                              : 'bg-[var(--color-control-muted)]/55 border-[var(--color-border)]'
                          }`}
                        >
                          <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                              className="w-5 h-5 accent-[var(--color-task-accent)] shrink-0"
                            />
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`text-sm font-extrabold truncate ${
                                    task.done
                                      ? 'line-through text-[var(--color-muted)]'
                                      : 'text-[var(--color-text)]'
                                  }`}
                                >
                                  {locText(task.name, lang)}
                                </span>
                                {renderReminderBadge(reminder)}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-[var(--color-muted)]">
                                <span className="px-2 py-0.5 rounded-lg bg-white/90 text-[var(--color-text)]">
                                  {assignedKid ? locText(assignedKid.name, lang) : locText('الأسرة', lang)}
                                </span>
                                <span>· {locText(task.category, lang)}</span>
                                <span>· ⏰ {locText(task.time || 'مرن', lang)}</span>
                              </div>
                            </div>
                          </label>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTask(task);
                                setTaskModalOpen(true);
                              }}
                              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                            >
                              {lang === 'en' ? 'Edit' : 'تعديل'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              aria-label={`${lang === 'en' ? 'Delete task' : 'حذف المهمة'} ${locText(task.name, lang)}`}
                              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-red-200 bg-white text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 4: FAMILY CALENDAR (التقويم الأسري — ميلادي وهجري)
              ================================================================ */}
          {activePage === 'calendar' && (
            <section className="space-y-6" aria-label={lang === 'en' ? 'Family Calendar' : 'التقويم الأسري'}>
              <div
                style={{ backgroundImage: getCardBackgroundSpec('calendar', state.darkMode).backgroundImageCss }}
                className="image-bg-card rounded-[24px] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3"
              >
                <span className="image-card-badge px-3 py-1 rounded-xl text-xs font-extrabold tabular-nums">
                  {todayFormatted.combined}
                </span>
                <h2 className="image-card-title text-xl sm:text-2xl font-extrabold text-center">
                  {lang === 'en' ? 'Family Calendar (Gregorian & Hijri)' : 'التقويم والمواعيد (ميلادي وهجري)'}
                </h2>
                <PrimaryCtaButton
                  variant="teal"
                  onClick={() => {
                    setEditingEvent(null);
                    setEventModalOpen(true);
                  }}
                >
                  {lang === 'en' ? '+ Add New Event' : '+ إضافة حدث جديد'}
                </PrimaryCtaButton>
              </div>

              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 soft-card-surface space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetEventRange(0)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)]"
                    >
                      {lang === 'en' ? 'Today' : 'اليوم'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetEventRange(7)}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)]"
                    >
                      {lang === 'en' ? 'Next 7 Days' : 'الأيام السبعة القادمة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEventFrom('');
                        setEventTo('');
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                    >
                      {lang === 'en' ? `All Events (${state.events.length})` : `كل الأحداث (${state.events.length})`}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-2xl" role="group" aria-label={lang === 'en' ? 'Date display mode' : 'نظام عرض التاريخ'}>
                    {[
                      { id: 'both', label: lang === 'en' ? 'Gregorian & Hijri' : 'الميلادي والهجري' },
                      { id: 'gregorian', label: lang === 'en' ? 'Gregorian' : 'الميلادي' },
                      { id: 'hijri', label: lang === 'en' ? 'Hijri' : 'الهجري' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            calendarMode: mode.id as CalendarDisplayMode,
                          }))
                        }
                        className={`px-3 py-1 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                          state.calendarMode === mode.id
                            ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                            : 'text-[var(--color-muted)]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventFrom" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                      {lang === 'en' ? 'From Date' : 'من تاريخ'}
                    </label>
                    <input
                      id="eventFrom"
                      type="date"
                      value={eventFrom}
                      onChange={(e) => setEventFrom(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="eventTo" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                      {lang === 'en' ? 'To Date' : 'إلى تاريخ'}
                    </label>
                    <input
                      id="eventTo"
                      type="date"
                      value={eventTo}
                      onChange={(e) => setEventTo(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    />
                  </div>
                </div>

                {/* Events Grid Cards */}
                {isEventRangeReversed ? (
                  <div className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-5 text-center text-xs font-bold text-amber-900" role="status">
                    {lang === 'en'
                      ? 'Start date is after end date. Adjust the range to view events.'
                      : 'تاريخ البداية بعد تاريخ النهاية. عدّل نطاق التاريخ لعرض الأحداث.'}
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-bold text-[var(--color-muted)]">
                    {lang === 'en' ? 'No events in this date range.' : 'لا توجد أحداث في هذه الفترة.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEvents.map((ev) => {
                      const assignedKid = ev.childId ? kidMap[String(ev.childId)] : null;
                      const formattedDate = formatGregorianAndHijri(
                        ev.date,
                        state.country,
                        state.language,
                        state.calendarMode
                      );
                      const isMedical = ev.type === 'موعد طبي' || ev.type === 'تطعيم';
                      return (
                        <div
                          key={ev.id}
                          className={`rounded-[22px] border p-4 sm:p-5 flex items-start justify-between gap-3 shadow-2xs ${
                            isMedical
                              ? 'bg-emerald-50/80 border-emerald-200/80'
                              : 'bg-cyan-50/75 border-cyan-200/80'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-2xs flex items-center justify-center text-xl shrink-0"
                              aria-hidden="true"
                            >
                              {isMedical ? '🩺' : ev.type === 'عيد ميلاد' ? '🎂' : '📅'}
                            </div>
                            <div className="min-w-0 space-y-1">
                              <div className="font-extrabold text-sm text-[var(--color-text)]">
                                {locText(ev.title, lang)}
                              </div>
                              <div className="text-xs font-bold text-[var(--color-muted)] tabular-nums">
                                {formattedDate.combined}
                                {ev.time ? ` · ⏰ ${locText(ev.time, lang)}` : ''}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-white/90 text-[var(--color-text)]">
                                  {locText(ev.type, lang)}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-white/90 text-[var(--color-muted)]">
                                  {assignedKid ? `👶 ${locText(assignedKid.name, lang)}` : `👨‍👩‍👧‍👦 ${locText('الأسرة', lang)}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEvent(ev);
                                setEventModalOpen(true);
                              }}
                              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                            >
                              {lang === 'en' ? 'Edit' : 'تعديل'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev.id)}
                              aria-label={`${lang === 'en' ? 'Delete event' : 'حذف الحدث'} ${locText(ev.title, lang)}`}
                              className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-red-200 bg-white text-red-700"
                            >
                              {lang === 'en' ? 'Delete' : 'حذف'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 5: WISHES & GOALS (الأمنيات والأحلام)
              ================================================================ */}
          {activePage === 'wishes' && (
            <section className="space-y-6" aria-label={lang === 'en' ? 'Wishes & Gifts' : 'الأمنيات والهدايا'}>
              <div
                style={{ backgroundImage: getCardBackgroundSpec('wishes', state.darkMode).backgroundImageCss }}
                className="image-bg-card rounded-[24px] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-3"
              >
                <span className="image-card-badge px-3 py-1 rounded-xl text-xs font-extrabold tabular-nums">
                  {state.wishes.length} {lang === 'en' ? 'Saved Wishes' : 'أمنيات مسجلة'}
                </span>
                <h2 className="image-card-title text-xl sm:text-2xl font-extrabold text-center">
                  {lang === 'en' ? 'Kids Wishes & Family Gift Goals' : 'أمنيات الأطفال وأهداف الإهداء العائلي'}
                </h2>
                <PrimaryCtaButton
                  variant="orange"
                  onClick={() => {
                    if (!state.kids.length) {
                      showToast(lang === 'en' ? 'Please add a child profile first' : 'أضف ملف طفل أولًا');
                      return;
                    }
                    setEditingWish(null);
                    setWishModalOpen(true);
                  }}
                >
                  {lang === 'en' ? '+ Add Wish' : '+ إضافة أمنية'}
                </PrimaryCtaButton>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-[var(--color-control-muted)] p-1.5 rounded-2xl w-max max-w-full">
                <button
                  type="button"
                  onClick={() => setWishKidTab('all')}
                  className={`min-h-[38px] px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap ${
                    wishKidTab === 'all'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                      : 'text-[var(--color-muted)]'
                  }`}
                >
                  {lang === 'en' ? `All Kids (${state.wishes.length})` : `كل الأطفال (${state.wishes.length})`}
                </button>
                {state.kids.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setWishKidTab(String(k.id))}
                    className={`min-h-[38px] px-3.5 py-1.5 text-xs font-extrabold rounded-xl transition-colors whitespace-nowrap ${
                      wishKidTab === String(k.id)
                        ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                        : 'text-[var(--color-muted)]'
                    }`}
                  >
                    {k.emoji} {locText(k.name, lang)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredWishes.length === 0 ? (
                    <div className="sm:col-span-2 rounded-[24px] border border-dashed border-[var(--color-border)] p-6 text-center text-sm font-bold text-[var(--color-muted)]">
                      {lang === 'en' ? 'No wishes found for this selection.' : 'قائمة الأمنيات فارغة لهذا الاختيار.'}
                    </div>
                  ) : (
                    filteredWishes.map((w) => {
                      const kidObj = kidMap[String(w.kid)];
                      const prog = w.progress ?? (w.reserved ? 100 : 40);
                      return (
                        <div
                          key={w.id}
                          className="rounded-[24px] border border-pink-200/80 bg-pink-50/75 p-5 shadow-2xs flex flex-col justify-between gap-3.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-12 h-12 rounded-2xl bg-white/90 border border-white shadow-2xs flex items-center justify-center text-2xl shrink-0"
                                aria-hidden="true"
                              >
                                {w.emoji || '🎁'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-sm text-[var(--color-text)] truncate">
                                  {locText(w.name, lang)}
                                </div>
                                <div className="text-xs font-bold text-[var(--color-muted)] tabular-nums mt-0.5">
                                  {kidObj ? locText(kidObj.name, lang) : locText('الأسرة', lang)} ·{' '}
                                  {formatCurrency(w.price, w.currency || state.currency, state.language)}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold shrink-0 ${
                                w.reserved
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-white/90 text-pink-900'
                              }`}
                            >
                              {w.reserved ? (lang === 'en' ? 'Reserved ✅' : 'محجوزة ✅') : (lang === 'en' ? 'Available' : 'متاحة')}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-muted)] tabular-nums">
                              <span>{locText(w.goalType || 'خطة تحقيق الأمنية', lang)}</span>
                              <span className="font-extrabold text-[var(--color-text)]">{prog}%</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-white overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-200"
                                style={{
                                  width: `${prog}%`,
                                  backgroundColor: 'var(--color-accent)',
                                }}
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t border-pink-200/60 flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateWishProgress(w.id, 15)}
                                className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] tabular-nums"
                              >
                                +15%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleWishReserve(w.id)}
                                className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                              >
                                {w.reserved
                                  ? lang === 'en'
                                    ? 'Unreserve'
                                    : 'إلغاء الحجز'
                                  : lang === 'en'
                                  ? 'Reserve as Gift'
                                  : 'حجز كهدية'}
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingWish(w);
                                  setWishModalOpen(true);
                                }}
                                className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-white text-[var(--color-text)]"
                              >
                                {lang === 'en' ? 'Edit' : 'تعديل'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWish(w.id)}
                                aria-label={`${lang === 'en' ? 'Delete wish' : 'حذف الأمنية'} ${locText(w.name, lang)}`}
                                className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold border border-red-200 bg-white text-red-700"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Gift Ideas Pastel Card */}
                <div className="rounded-[24px] border border-amber-200/80 bg-amber-50/85 p-5 shadow-2xs space-y-3">
                  <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                    💡 {lang === 'en' ? 'Quick Gift Ideas' : 'أفكار هدايا سريعة'}
                  </h3>
                  <div className="space-y-2.5">
                    {[
                      { emoji: '📚', title: 'مجموعة قصص مصورة', egp: 120, sar: 35 },
                      { emoji: '🧩', title: 'لعبة تركيب خشبية', egp: 280, sar: 75 },
                      { emoji: '🎨', title: 'حقيبة ألوان مائية آمنة', egp: 150, sar: 42 },
                    ].map((idea) => {
                      const p = state.currency === 'SAR' ? idea.sar : idea.egp;
                      return (
                        <div
                          key={idea.title}
                          className="rounded-2xl border border-white bg-white/90 p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl" aria-hidden="true">{idea.emoji}</span>
                            <div>
                              <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                                {locText(idea.title, lang)}
                              </div>
                              <div className="text-[11px] font-bold text-amber-900 tabular-nums">
                                {formatCurrency(p, state.currency, state.language)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickAddWish(idea.title, idea.egp, idea.sar, idea.emoji)
                            }
                            className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold bg-amber-600 text-white whitespace-nowrap"
                          >
                            {lang === 'en' ? '+ Add' : '+ أضف'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGE 6A: MEDICAL & CHILD HEALTH HUB (الرعاية الطبية والأطباء)
              ================================================================ */}
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
                    lang === 'en' ? 'Updated saved medical guides' : 'تم تحديث قائمة الأدلة الطبية المحفوظة'
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
                      ? `✓ Appointment booked with ${doctorName} and added to Family Calendar!`
                      : `✓ تم حجز الموعد مع «${doctorName}» وإضافته إلى التقويم الأسري!`
                  );
                }}
                onShowToast={showToast}
              />
            ))}

          {/* ================================================================
              PAGE 6B: MEDIA, VIDEOS & VERTICAL REELS 9:16 HUB (الميديا والريلز)
              ================================================================ */}
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

          {/* ================================================================
              PAGE 6C: PARENTS' COMMUNITY (مجتمع الآباء والأمهات)
              ================================================================ */}
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

          {/* ================================================================
              PAGE 6D: INTERNAL CHAT & MESSAGING (المحادثات الداخلية)
              ================================================================ */}
          {activePage === 'chat' && (
            <InternalChatSection
              language={state.language}
              darkMode={Boolean(state.darkMode)}
              onShowToast={showToast}
            />
          )}

          {/* ================================================================
              PAGE 7: INTERACTIVE 3D CHILDREN'S GAMES
              ================================================================ */}
          {activePage === 'games' && (
            <InteractiveGamesSection
              kids={state.kids}
              language={state.language}
              onExitGamesToDashboard={() => navigateTo('home')}
            />
          )}

          {/* ================================================================
              PAGE 8: COMMERCIAL ECOSYSTEM — 3D STORE, CART & SERVICES
              ================================================================ */}
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

          {/* ================================================================
              PAGE 9: THREE DAILY PARENTING NOTIFICATIONS CENTER
              ================================================================ */}
          {activePage === 'notifications' && (
            <NotificationsCenterSection
              state={state}
              language={state.language}
              onSelectParentAccount={(pid) =>
                setState((prev) => ({ ...prev, activeParentAccount: pid }))
              }
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
                  readNotificationIds: Array.from(new Set([...prev.readNotificationIds, ...ids])),
                }));
                showToast(
                  lang === 'en'
                    ? 'All daily notifications marked as read'
                    : 'تم تحديد جميع إشعارات اليوم كمقروءة'
                );
              }}
            />
          )}

          {/* ================================================================
              PAGE 10: IN-APP AI PARENTING ASSISTANT (المساعد الذكي AI)
              ================================================================ */}
          {activePage === 'assistant' && (
            <AiAssistantSection
              kids={state.kids}
              parentName={state.parentName}
              city={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
              language={state.language}
              darkMode={Boolean(state.darkMode)}
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
                    ? `✓ Added "${taskName}" to Daily Routine!`
                    : `✓ تمت إضافة «${taskName}» إلى الروتين اليومي!`
                );
              }}
              onShowToast={showToast}
            />
          )}

          {/* ================================================================
              PAGE 11: FAMILY SPACE, ONBOARDING & PERMISSIONS (مساحة العائلة والحسابات)
              ================================================================ */}
          {activePage === 'family' && (
            <FamilyPermissionsSection
              family={state.family}
              kids={state.kids}
              parentAccounts={state.parentAccounts}
              invitations={state.invitations}
              disputeFreezeActive={state.disputeFreezeActive}
              language={state.language}
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
                          emoji: target.roleCategory === 'nursery' || target.roleCategory === 'teacher' ? '👩‍🏫' : '👤',
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
                    ? `تمت الإضافة بنجاح — Linked ${newMember.name} (${newMember.role})!`
                    : `تمت الإضافة بنجاح — تم ربط «${newMember.name}» (${newMember.role}) بحساب الأسرة!`
                );
              }}
              onShowToast={showToast}
            />
          )}

          {/* ================================================================
              PAGE 12: PROFILE (الحساب) WITH SETTINGS (الإعدادات) INSIDE
              ================================================================ */}
          {activePage === 'settings' && (
            <section className="space-y-6" aria-label="الحساب والإعدادات">
              {/* Profile Hero Warm Image Card with Father vs. Mother Visual Distinction */}
              <div
                className="image-bg-card rounded-[24px] p-5 sm:p-6 space-y-5"
                style={{
                  backgroundImage: getCardBackgroundSpec('settings', state.darkMode).backgroundImageCss,
                  borderColor: parentProfileSpec.badgeBorderCss,
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 rounded-3xl bg-white/90 border border-white shadow-sm flex items-center justify-center shrink-0">
                      <ThreeDIcon id="family" size={38} />
                    </div>
                    <div>
                      <span
                        style={{
                          backgroundColor: parentProfileSpec.badgeBgCss,
                          color: parentProfileSpec.badgeTextCss,
                          borderColor: parentProfileSpec.badgeBorderCss,
                        }}
                        className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-extrabold border shadow-2xs"
                      >
                        {lang === 'en' ? parentProfileSpec.roleBadgeEn : parentProfileSpec.roleBadgeAr}
                      </span>
                      <h2 className="image-card-title text-xl sm:text-2xl font-extrabold mt-1">
                        {lang === 'en' ? parentProfileSpec.greetingEn : parentProfileSpec.greetingAr}
                      </h2>
                      <div className="image-card-subtitle text-xs font-bold tabular-nums mt-0.5">
                        {t(lang, 'brandName')} ·{' '}
                        {state.country === 'SA'
                          ? lang === 'en'
                            ? 'Saudi Arabia'
                            : 'السعودية'
                          : lang === 'en'
                          ? 'Egypt'
                          : 'مصر'}{' '}
                        · {locText(state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'), lang)} · {state.currency}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <PrimaryCtaButton
                      variant="orange"
                      onClick={() => setOnboardingModalOpen(true)}
                    >
                      {lang === 'en' ? 'Edit Account & City' : 'تحديث الحساب والمدينة'}
                    </PrimaryCtaButton>
                    <button
                      type="button"
                      onClick={() => navigateTo('family')}
                      className="min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold border border-white bg-white/90 text-slate-900 shadow-2xs"
                    >
                      {lang === 'en' ? 'Family & Permissions' : 'العائلة والصلاحيات'}
                    </button>
                  </div>
                </div>

                {/* Quick Profile Image Background Grid Cards (Matching Home Screen Image Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                  {[
                    {
                      key: 'children',
                      onClick: () => navigateTo('children'),
                      badge: String(state.kids.length),
                      title: lang === 'en' ? 'Children Profiles' : 'ملفات الأطفال',
                    },
                    {
                      key: 'services',
                      onClick: () => navigateTo('services'),
                      badge: String(state.orders.length),
                      title: lang === 'en' ? 'Store Orders' : 'طلبات المتجر',
                    },
                    {
                      key: 'chat',
                      onClick: () => navigateTo('notifications'),
                      badge: String(unreadNotifCount),
                      title: lang === 'en' ? 'Notifications' : 'الإشعارات اليومية',
                    },
                    {
                      key: 'settings',
                      onClick: () => setShowInnerSettings((prev) => !prev),
                      badge: showInnerSettings
                        ? lang === 'en'
                          ? 'Open'
                          : 'مفتوحة'
                        : lang === 'en'
                        ? 'Show'
                        : 'عرض',
                      title: lang === 'en' ? 'App Settings' : 'الإعدادات',
                    },
                  ].map((pCard) => {
                    const spec = getCardBackgroundSpec(pCard.key, state.darkMode);
                    return (
                      <button
                        key={pCard.key}
                        type="button"
                        data-image-card="true"
                        onClick={pCard.onClick}
                        style={{ backgroundImage: spec.backgroundImageCss }}
                        className="image-bg-card rounded-2xl p-4 text-start flex flex-col justify-between min-h-[104px]"
                      >
                        <div className="flex items-center justify-end">
                          <span className="image-card-badge px-2.5 py-0.5 rounded-lg text-[10.5px] font-extrabold tabular-nums">
                            {pCard.badge}
                          </span>
                        </div>
                        <div className="image-card-title text-xs sm:text-sm font-extrabold mt-3">
                          {pCard.title}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dedicated Dark / Light Mode Accessibility Toggle Card in Profile (الحساب) */}
              <div
                id="profile-dark-mode-card"
                className="rounded-[24px] border border-indigo-200/85 bg-indigo-50/85 p-4 sm:p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-center text-2xl shrink-0">
                    {state.darkMode ? '🌙' : '☀️'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
                        {lang === 'en'
                          ? 'Dark Mode (الوضع الليلي المريح للعين)'
                          : 'الوضع الليلي المريح للعين (Dark Mode)'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-100 text-indigo-900">
                        {state.darkMode
                          ? lang === 'en'
                            ? 'Active · Charcoal Slate'
                            : 'مفعّل · رمادي داكن مريح'
                          : lang === 'en'
                          ? 'Light Mode · Pastel'
                          : 'الوضع النهاري · باستيل'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--color-muted)] mt-0.5">
                      {lang === 'en'
                        ? 'Switches the entire app instantly to deep charcoal & slate-blue tones with soft pastel contrast.'
                        : 'يُحوّل ألوان التطبيق فورًا إلى درجات الرمادي الفحمي والأزرق الداكن المريحة للعين مع الحفاظ على وضوح الأزرار.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    id="profile-dark-mode-switch"
                    type="button"
                    role="switch"
                    aria-checked={Boolean(state.darkMode)}
                    aria-label={
                      lang === 'en'
                        ? 'Toggle Dark Mode'
                        : 'تبديل الوضع الليلي والنهاري'
                    }
                    onClick={handleToggleDarkMode}
                    className={`min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 border shadow-2xs active:scale-95 transition-all ${
                      state.darkMode
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500'
                        : 'bg-white hover:border-[var(--color-accent)] text-[var(--color-text)] border-[var(--color-border)]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-9 h-5 rounded-full p-0.5 flex items-center transition-colors ${
                        state.darkMode ? 'bg-indigo-900/80 justify-end' : 'bg-slate-200 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs block" />
                    </span>
                    <span>
                      {state.darkMode
                        ? lang === 'en'
                          ? '🌙 Dark Mode On (Switch to Light)'
                          : '🌙 الوضع الليلي مفعّل (تبديل للنهاري)'
                        : lang === 'en'
                        ? '☀️ Enable Dark Mode'
                        : '🌙 تفعيل الوضع الليلي'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Inner Settings Section inside Profile Screen */}
              {showInnerSettings && (
                <div className="space-y-5" aria-label="الإعدادات داخل صفحة الحساب">
                  <div className="section-heading-block">
                    <h3 className="section-heading-centered">
                      {lang === 'en' ? 'Settings & Account Preferences' : 'الإعدادات وتخصيص الحساب'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* 1. Experience & Interface Preferences */}
                    <div className="rounded-[24px] border border-purple-200/80 bg-purple-50/75 p-5 shadow-2xs space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-extrabold text-[var(--color-text)]">
                          {lang === 'en' ? 'Theme, Language & Calendar' : 'السمة البصرية واللغة والتقويم'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-100 text-purple-900">
                          {lang === 'en' ? 'Preferences' : 'تفضيلات العرض'}
                        </span>
                      </div>

                      <div>
                        <label htmlFor="parentName" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                          {lang === 'en' ? 'Parent / Family Display Name' : 'اسم ولي الأمر / الأسرة'}
                        </label>
                        <input
                          id="parentName"
                          type="text"
                          maxLength={80}
                          value={settingsParentName}
                          onChange={(e) => setSettingsParentName(e.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
                        />
                      </div>

                      <div>
                        <label htmlFor="parentRole" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                          {lang === 'en' ? 'Visual Theme & Parent Mode' : 'نوع التجربة والسمة البصرية'}
                        </label>
                        <select
                          id="parentRole"
                          value={settingsRole}
                          onChange={(e) => setSettingsRole(e.target.value as ParentThemeRole)}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
                        >
                          <option value="mom">{lang === 'en' ? 'Mother Mode — Rose' : 'الأم — روز (Mother Mode)'}</option>
                          <option value="dad">{lang === 'en' ? 'Father Mode — Aqua' : 'الأب — أكوا (Father Mode)'}</option>
                          <option value="high-contrast">
                            {lang === 'en' ? 'High Contrast — Readability' : 'تباين عالٍ — لسهولة القراءة (High Contrast)'}
                          </option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="settingsLanguage" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                            {lang === 'en' ? 'Interface Language' : 'لغة الواجهة'}
                          </label>
                          <select
                            id="settingsLanguage"
                            value={settingsLanguage}
                            onChange={(e) => setSettingsLanguage(e.target.value as LanguageCode)}
                            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
                          >
                            <option value="ar">{t(lang, 'langAr')}</option>
                            <option value="en">{t(lang, 'langEn')}</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="settingsCalendarMode" className="block text-xs font-bold text-[var(--color-muted)] mb-1">
                            {lang === 'en' ? 'Calendar Date Display' : 'نظام عرض التاريخ'}
                          </label>
                          <select
                            id="settingsCalendarMode"
                            value={settingsCalendarMode}
                            onChange={(e) => setSettingsCalendarMode(e.target.value as CalendarDisplayMode)}
                            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
                          >
                            <option value="both">{t(lang, 'calendarBoth')}</option>
                            <option value="gregorian">{t(lang, 'calendarGregorian')}</option>
                            <option value="hijri">{t(lang, 'calendarHijri')}</option>
                          </select>
                        </div>
                      </div>

                      <PrimaryCtaButton variant="purple" onClick={handleSaveGeneralSettings}>
                        {lang === 'en' ? 'Save Experience Preferences' : 'حفظ تفضيلات التجربة واللغة'}
                      </PrimaryCtaButton>
                    </div>

                    {/* 2. Data Backup, Restore & Standalone Prototype Files */}
                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-emerald-200/80 bg-emerald-50/75 p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-extrabold text-[var(--color-text)]">
                            {lang === 'en' ? 'JSON Data Backup & Restore' : 'النسخ الاحتياطي واستيراد البيانات (JSON)'}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-100 text-emerald-900">
                            family-space-v1
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={handleExportJson}
                            className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] shadow-2xs"
                          >
                            {lang === 'en' ? '📥 Export JSON Backup' : '📥 تصدير نسخة JSON'}
                          </button>

                          <label className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] shadow-2xs cursor-pointer inline-flex items-center">
                            {lang === 'en' ? '📤 Import JSON File' : '📤 استيراد ملف JSON'}
                            <input
                              type="file"
                              accept="application/json,.json"
                              onChange={handleImportJsonFile}
                              className="sr-only"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setConfirmResetModal(true)}
                            className="min-h-[42px] px-4 py-2 rounded-2xl text-xs font-extrabold border border-red-200 bg-white text-red-800"
                          >
                            {lang === 'en' ? 'Reset Demo Data' : 'مسح وإعادة ضبط البيانات'}
                          </button>
                        </div>

                        <div className="pt-3 border-t border-emerald-200/60 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              showToast(
                                lang === 'en'
                                  ? `✓ Local Storage Integrity Verified: ${state.kids.length} Kids, ${state.family.length} Family Members, ${state.tasks.length} Tasks.`
                                  : `✓ تم فحص سلامة البيانات المحلية بنجاح: ${state.kids.length} أطفال، ${state.family.length} أفراد عائلة، و${state.tasks.length} مهام روتين.`
                              )
                            }
                            className="px-3 py-1.5 rounded-xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:border-[var(--color-accent)] active:scale-95 transition-all"
                          >
                            {lang === 'en' ? '🔍 Verify Local Data Integrity' : '🔍 فحص سلامة البيانات المحلية'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleExportJson();
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs active:scale-95 transition-all"
                          >
                            {lang === 'en' ? '📦 Download Full Family Snapshot' : '📦 تنزيل لقطة كاملة لبيانات الأسرة'}
                          </button>
                        </div>
                      </div>

                      {/* 3D Asset Manifest Registry */}
                      <div className="rounded-[24px] border border-sky-200/80 bg-sky-50/75 p-4 shadow-2xs space-y-2">
                        <div className="text-xs font-extrabold text-[var(--color-text)]">
                          {lang === 'en'
                            ? `🎨 3D Asset Manifest (${THREE_D_ASSET_MANIFEST.length} Asset Groups)`
                            : `🎨 سجل الأصول ثلاثية الأبعاد (${THREE_D_ASSET_MANIFEST.length} مجموعات)`}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                          {THREE_D_ASSET_MANIFEST.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-xl bg-white/85 px-2.5 py-1.5 flex items-center justify-between gap-2"
                            >
                              <span className="font-bold text-[var(--color-text)] truncate">
                                {lang === 'en' ? entry.titleEn : entry.titleAr}
                              </span>
                              <span className="text-emerald-800 font-extrabold shrink-0">{entry.renderEngine}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ==============================================================
                      BOTTOM OF SETTINGS PAGE: COUNTRY, CURRENCY & VERIFIED PHONE
                      ============================================================== */}
                  <div
                    id="settings-international-bottom"
                    className="rounded-[24px] border border-amber-200/80 bg-amber-50/85 p-5 sm:p-6 shadow-2xs space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-100 text-amber-900">
                          OTP: {DEMO_OTP_CODE}
                        </span>
                        <h3 className="text-base font-extrabold text-[var(--color-text)] mt-1">
                          {lang === 'en'
                            ? '🌍 Country, Calling Code, Currency & Verified Phone'
                            : '🌍 إعدادات الدولة، مفتاح الهاتف، العملة، وتوثيق الجوال'}
                        </h3>
                      </div>
                      <span className="px-3 py-1.5 rounded-xl bg-white text-xs font-extrabold text-[var(--color-text)] tabular-nums shadow-2xs">
                        {state.country === 'SA' ? '🇸🇦 +966 · SAR' : '🇪🇬 +20 · EGP'} · 📍{' '}
                        {locText(state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة'), lang)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div>
                        <label htmlFor="settingsCountry" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                          {lang === 'en' ? 'Country & Calling Code' : 'الدولة ومفتاح الاتصال الدولي'}
                        </label>
                        <select
                          id="settingsCountry"
                          value={settingsCountry}
                          onChange={(e) => handleCountryChangeInSettings(e.target.value as CountryCode)}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
                        >
                          <option value="EG">🇪🇬 {t(lang, 'countryEG')} (+20)</option>
                          <option value="SA">🇸🇦 {t(lang, 'countrySA')} (+966)</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="settingsCity" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                          {lang === 'en' ? 'City / Governorate' : 'المدينة / المحافظة'}
                        </label>
                        <select
                          id="settingsCity"
                          value={settingsCity}
                          onChange={(e) => setSettingsCity(e.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
                        >
                          {(COUNTRY_CITIES_MAP[settingsCountry] || []).map((cItem) => (
                            <option key={cItem.id} value={cItem.id}>
                              {lang === 'en' ? `${cItem.nameEn} (${cItem.regionEn})` : `${cItem.nameAr} (${cItem.regionAr})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="settingsCurrency" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                          {lang === 'en' ? 'Display Currency' : 'العملة المعتمدة للأسعار'}
                        </label>
                        <select
                          id="settingsCurrency"
                          value={settingsCurrency}
                          onChange={(e) => {
                            setSettingsCurrency(e.target.value as CurrencyCode);
                            setCurrencySuggestionBanner(null);
                          }}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
                        >
                          <option value="EGP">{t(lang, 'currencyEGP')}</option>
                          <option value="SAR">{t(lang, 'currencySAR')}</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="settingsPhoneInput" className="block text-xs font-bold text-[var(--color-text)] mb-1">
                          {lang === 'en'
                            ? `Verified Phone (${settingsCountry === 'SA' ? '+966' : '+20'})`
                            : `رقم هاتف الحساب الموثق (${settingsCountry === 'SA' ? '+966' : '+20'})`}
                        </label>
                        <input
                          id="settingsPhoneInput"
                          type="tel"
                          dir="ltr"
                          value={settingsPhoneInput}
                          onChange={(e) => setSettingsPhoneInput(e.target.value)}
                          placeholder={settingsCountry === 'SA' ? '512345678' : '1012345678'}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm tabular-nums"
                        />
                      </div>
                    </div>

                    {/* Suggested Currency Banner when Country switches */}
                    {currencySuggestionBanner && (
                      <div className="rounded-2xl bg-white p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                        <span>
                          اخترت {settingsCountry === 'SA' ? 'السعودية' : 'مصر'}. هل ترغب في التبديل إلى العملة المقترحة ({currencySuggestionBanner})؟
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSettingsCurrency(currencySuggestionBanner);
                            setCurrencySuggestionBanner(null);
                          }}
                          className="px-3.5 py-1.5 rounded-xl font-extrabold bg-amber-600 text-white whitespace-nowrap"
                        >
                          نعم، اعتمد {currencySuggestionBanner}
                        </button>
                      </div>
                    )}

                    {settingsOtpStep && (
                      <div className="rounded-2xl border border-amber-300 bg-white p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="text-amber-950 font-bold">
                          {lang === 'en'
                            ? `🔐 Enter OTP code (${DEMO_OTP_CODE}) to confirm update:`
                            : `🔐 أدخل رمز التحقق OTP التجريبي (${DEMO_OTP_CODE}) لتأكيد التحديث:`}
                        </div>
                        <input
                          type="text"
                          dir="ltr"
                          value={settingsOtpCode}
                          onChange={(e) => setSettingsOtpCode(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                          className="w-28 rounded-xl border border-amber-400 bg-amber-50 px-3 py-1.5 text-center font-extrabold tabular-nums"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <span className="text-xs font-bold text-amber-900">
                        {lang === 'en'
                          ? 'Supports Egyptian (+20) & Saudi (+966) mobile formats'
                          : 'يدعم التحقق القياسي للهاتف المصري (+20) والسعودي (+966)'}
                      </span>
                      <PrimaryCtaButton
                        variant="orange"
                        onClick={handleSaveBottomInternationalAndPhone}
                      >
                        {settingsOtpStep
                          ? lang === 'en'
                            ? 'Verify OTP & Save Settings'
                            : 'تأكيد رمز OTP وحفظ الدولة والهاتف'
                          : lang === 'en'
                          ? 'Save Country, City, Currency & Phone'
                          : 'حفظ إعدادات الدولة والمدينة والعملة والهاتف'}
                      </PrimaryCtaButton>
                    </div>
                  </div>
                </div>
              )}

              {/* ==============================================================
                  LEGAL POLICIES, INTELLECTUAL PROPERTY & DIGITAL CONTACT CARDS
                  (السياسات وحقوق الملكية وتواصل معنا داخل شاشة الحساب)
                  ============================================================== */}
              <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-2xs space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-teal-100 text-teal-950">
                      {lang === 'en' ? 'POLICIES & DIGITAL CARE' : 'السياسات وحقوق الملكية والدعم الرقمي'}
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-[var(--color-text)] mt-0.5">
                      {lang === 'en'
                        ? 'Legal Policies, Intellectual Property & Contact Us'
                        : 'سياسة الخصوصية، الشروط وحقوق الملكية، وتواصل معنا'}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 1. Privacy Policy Card */}
                  <button
                    type="button"
                    onClick={() => navigateTo('privacy')}
                    style={{
                      backgroundImage: getCardBackgroundSpec('privacy', state.darkMode).backgroundImageCss,
                    }}
                    className="image-bg-card p-5 text-start flex flex-col justify-between gap-3 min-h-[126px]"
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <SoftFilledIcon id="shield" size={26} />
                      <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        {lang === 'en' ? 'Privacy' : 'الخصوصية'}
                      </span>
                    </div>
                    <div>
                      <div className="image-card-title text-xs sm:text-sm font-extrabold">
                        {lang === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}
                      </div>
                      <div className="image-card-subtitle text-[11px] font-bold mt-0.5">
                        {lang === 'en'
                          ? 'Family & child data protection clauses'
                          : 'ضوابط حماية بيانات الأسرة والطفل'}
                      </div>
                    </div>
                  </button>

                  {/* 2. Terms of Service & IP Card */}
                  <button
                    type="button"
                    onClick={() => navigateTo('terms')}
                    style={{
                      backgroundImage: getCardBackgroundSpec('terms', state.darkMode).backgroundImageCss,
                    }}
                    className="image-bg-card p-5 text-start flex flex-col justify-between gap-3 min-h-[126px]"
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <SoftFilledIcon id="star" size={26} />
                      <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        {lang === 'en' ? 'Terms & IP' : 'حقوق الملكية'}
                      </span>
                    </div>
                    <div>
                      <div className="image-card-title text-xs sm:text-sm font-extrabold">
                        {lang === 'en'
                          ? 'Terms of Service & IP'
                          : 'الشروط والأحكام وحقوق الملكية'}
                      </div>
                      <div className="image-card-subtitle text-[11px] font-bold mt-0.5">
                        {lang === 'en'
                          ? 'Terms of use & intellectual property rights'
                          : 'شروط الاستخدام وحقوق الملكية الفكرية'}
                      </div>
                    </div>
                  </button>

                  {/* 3. Contact Us (Strictly Digital) Card */}
                  <button
                    type="button"
                    onClick={() => navigateTo('contact')}
                    style={{
                      backgroundImage: getCardBackgroundSpec('contact', state.darkMode).backgroundImageCss,
                    }}
                    className="image-bg-card p-5 text-start flex flex-col justify-between gap-3 min-h-[126px]"
                  >
                    <div className="flex items-center justify-between gap-2 w-full">
                      <SoftFilledIcon id="notifications" size={26} />
                      <span className="image-card-badge px-2.5 py-0.5 rounded-full text-[10px] font-extrabold">
                        {lang === 'en' ? 'Digital 24/7' : 'تواصل رقمي'}
                      </span>
                    </div>
                    <div>
                      <div className="image-card-title text-xs sm:text-sm font-extrabold">
                        {lang === 'en' ? 'Contact Us' : 'تواصل معنا'}
                      </div>
                      <div className="image-card-subtitle text-[11px] font-bold mt-0.5">
                        {lang === 'en'
                          ? 'Support email, phone & social channels'
                          : 'البريد، رقم خدمة العملاء، والتواصل الاجتماعي'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ================================================================
              PAGES 13–15: LEGAL POLICIES (PRIVACY, TERMS & IP) & DIGITAL CONTACT US
              ================================================================ */}
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

          {/* ================================================================
              UNIFIED FOOTER AREA (Accessible Links to Privacy, Terms & IP, and Contact Us)
              ================================================================ */}
          <footer
            className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
            aria-label={lang === 'en' ? 'Policies & Support Footer' : 'تذييل السياسات والتواصل'}
          >
            <div className="flex items-center gap-2 text-[var(--color-muted)] font-bold">
              <span>© 2026 {t(lang, 'brandName')}</span>
              <span aria-hidden="true">·</span>
              <span>{lang === 'en' ? 'All Rights Reserved' : 'جميع الحقوق محفوظة'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-extrabold">
              <button
                type="button"
                onClick={() => navigateTo('privacy')}
                className={`hover:underline transition-colors ${
                  activePage === 'privacy'
                    ? 'text-teal-700 underline'
                    : 'text-[var(--color-text)]'
                }`}
              >
                🔒 {lang === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}
              </button>
              <span aria-hidden="true" className="text-[var(--color-muted)]">·</span>
              <button
                type="button"
                onClick={() => navigateTo('terms')}
                className={`hover:underline transition-colors ${
                  activePage === 'terms'
                    ? 'text-indigo-700 underline'
                    : 'text-[var(--color-text)]'
                }`}
              >
                📜 {lang === 'en' ? 'Terms & IP Rights' : 'الشروط والأحكام وحقوق الملكية'}
              </button>
              <span aria-hidden="true" className="text-[var(--color-muted)]">·</span>
              <button
                type="button"
                onClick={() => navigateTo('contact')}
                className={`hover:underline transition-colors ${
                  activePage === 'contact'
                    ? 'text-orange-700 underline'
                    : 'text-[var(--color-text)]'
                }`}
              >
                🎧 {lang === 'en' ? 'Contact Us' : 'تواصل معنا'}
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Super App Mobile Bottom Navigation Bar (Strictly 5 Elements with Central AI Agent FAB) */}
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
        const isProfileBranch = [
          'settings',
          'family',
          'privacy',
          'terms',
          'contact',
        ].includes(activePage);

        return (
          <nav
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border)] glass-bottom-nav px-2 pt-1.5 pb-2 grid grid-cols-5 items-end gap-1 shadow-[0_-8px_24px_-6px_rgba(42,36,51,0.14)]"
            aria-label={lang === 'en' ? 'Mobile Bottom Navigation' : 'التنقل السفلي للموبايل'}
          >
            {/* 1. Home (الرئيسية) */}
            <button
              type="button"
              onClick={() => navigateTo('home')}
              aria-current={activePage === 'home' ? 'page' : undefined}
              className={`relative min-h-[48px] py-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold active:scale-95 transition-all ${
                isHomeBranch
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold shadow-2xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {isHomeBranch && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-5 h-1 rounded-full bg-[var(--color-accent)]"
                />
              )}
              <ThreeDIcon id="home" size={21} />
              <span className="truncate max-w-full">{lang === 'en' ? 'Home' : 'الرئيسية'}</span>
            </button>

            {/* 2. Store (المتجر) */}
            <button
              type="button"
              onClick={() => navigateTo('services')}
              aria-current={activePage === 'services' ? 'page' : undefined}
              className={`relative min-h-[48px] py-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold active:scale-95 transition-all ${
                activePage === 'services'
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold shadow-2xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {activePage === 'services' && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-5 h-1 rounded-full bg-[var(--color-accent)]"
                />
              )}
              <div className="relative">
                <ThreeDIcon id="services" size={21} />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -end-2 px-1 min-w-[15px] h-[15px] rounded-full bg-orange-600 text-white text-[9px] font-extrabold flex items-center justify-center tabular-nums">
                    {cartItemCount}
                  </span>
                )}
              </div>
              <span className="truncate max-w-full">{lang === 'en' ? 'Store' : 'المتجر'}</span>
            </button>

            {/* 3. Central Button (3rd out of 5): Dynamic AI Robot Assistant FAB (مساعد الذكاء الاصطناعي) */}
            <div className="flex flex-col items-center justify-end">
              <button
                id="mobile-ai-robot-fab"
                type="button"
                onClick={() => navigateTo('assistant')}
                aria-current={activePage === 'assistant' ? 'page' : undefined}
                aria-label={lang === 'en' ? 'AI Agent' : 'مساعد الذكاء الاصطناعي'}
                className="-mt-6 flex flex-col items-center justify-center group focus:outline-none"
              >
                <span
                  className={`ai-robot-fab-pulse w-14 h-14 rounded-full flex items-center justify-center border-4 border-[var(--color-surface)] transition-all active:scale-95 ${
                    activePage === 'assistant'
                      ? 'bg-gradient-to-tr from-[#0d9488] via-[#0e7490] to-[#FF8C61] ring-4 ring-[var(--color-accent-soft)] scale-105'
                      : 'bg-gradient-to-tr from-[#0d9488] via-[#0e7490] to-[#FF8C61] hover:scale-105'
                  }`}
                >
                  <AiRobotHeadIcon size={30} onDarkSurface={true} />
                </span>
                <span
                  className={`mt-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold leading-tight text-center whitespace-nowrap transition-colors ${
                    activePage === 'assistant'
                      ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)]'
                      : 'text-[var(--color-text)]'
                  }`}
                >
                  {lang === 'en' ? 'AI Agent' : 'المساعد الذكي'}
                </span>
              </button>
            </div>

            {/* 4. Community (المجتمع) */}
            <button
              type="button"
              onClick={() => navigateTo('community')}
              aria-current={activePage === 'community' ? 'page' : undefined}
              className={`relative min-h-[48px] py-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold active:scale-95 transition-all ${
                activePage === 'community'
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold shadow-2xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {activePage === 'community' && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-5 h-1 rounded-full bg-[var(--color-accent)]"
                />
              )}
              <ThreeDIcon id="star" size={21} />
              <span className="truncate max-w-full">{lang === 'en' ? 'Community' : 'المجتمع'}</span>
            </button>

            {/* 5. Profile (الحساب — with Settings inside) */}
            <button
              type="button"
              onClick={() => navigateTo('settings')}
              aria-current={activePage === 'settings' ? 'page' : undefined}
              className={`relative min-h-[48px] py-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold active:scale-95 transition-all ${
                isProfileBranch
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold shadow-2xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {isProfileBranch && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-5 h-1 rounded-full bg-[var(--color-accent)]"
                />
              )}
              <ThreeDIcon id="settings" size={21} />
              <span className="truncate max-w-full">{lang === 'en' ? 'Profile' : 'الحساب'}</span>
            </button>
          </nav>
        );
      })()}

      {/* Desktop Dynamic AI Robot Assistant Floating Action Button (FAB) */}
      <button
        id="desktop-ai-robot-fab"
        type="button"
        onClick={() => navigateTo('assistant')}
        aria-label={lang === 'en' ? 'AI Robot Assistant' : 'مساعد الذكاء الاصطناعي'}
        className="hidden lg:flex fixed bottom-6 end-6 z-40 items-center gap-2.5 pe-4 ps-2.5 py-2.5 rounded-full glass-bottom-nav border border-[var(--color-border)] shadow-xl hover:scale-105 active:scale-95 transition-all group"
      >
        <span className="ai-robot-fab-pulse w-12 h-12 rounded-full bg-gradient-to-tr from-[#0d9488] via-[#0e7490] to-[#FF8C61] flex items-center justify-center shrink-0">
          <AiRobotHeadIcon size={28} onDarkSurface={true} />
        </span>
        <span className="flex flex-col items-start text-start">
          <span className="text-xs font-extrabold text-[var(--color-text)] leading-tight">
            {lang === 'en' ? 'AI Parenting Agent' : 'المساعد الذكي AI'}
          </span>
          <span className="text-[10px] font-bold text-[#E86A3D] leading-tight">
            {lang === 'en' ? '✨ Instant Smart Plans' : '✨ خطط فورية مخصصة'}
          </span>
        </span>
      </button>

      {/* ====================================================================
          MODALS
          ==================================================================== */}

      {/* 0. Registration, Login, Country & City Selection, Parent & Child Onboarding Wizard */}
      <OnboardingFlowModal
        isOpen={onboardingModalOpen}
        initialCountry={state.country}
        initialCity={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
        initialParentName={state.parentName}
        initialRole={state.role}
        language={state.language}
        onClose={() => setOnboardingModalOpen(false)}
        onCompleteOnboarding={({
          parentName,
          role,
          country,
          city,
          currency,
          phoneNumber,
          email,
          childProfile,
        }) => {
          setState((prev) => {
            const pid = role === 'dad' ? 'father' : 'mother';
            const nextKids = childProfile?.name
              ? [
                  ...prev.kids,
                  {
                    id: Date.now() + Math.floor(Math.random() * 100),
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
                  phoneVerified: true,
                  email,
                  emailVerified: true,
                  onboardingCompleted: true,
                },
              },
              kids: nextKids,
            };
          });
          setOnboardingModalOpen(false);
          showToast(
            lang === 'en'
              ? `✓ Welcome ${parentName}! Location set to ${city} (${currency}).`
              : `✓ أهلًا بك ${parentName}! تم ضبط الموقع على ${city} (${currency}).`
          );
        }}
      />

      {/* 1. Add / Edit Child Modal (With 3D Avatar Theme + Real Photo Preservation) */}
      {childModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setChildModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="childModalTitle"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="childModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                {editingChild ? `تعديل ملف ${editingChild.name}` : 'إضافة ملف طفل جديد (هوية 3D أو صورة حقيقية)'}
              </h2>
              <button
                type="button"
                onClick={() => setChildModalOpen(false)}
                aria-label="إغلاق النافذة"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveChild} className="space-y-3">
              <div>
                <label htmlFor="kidNameInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  اسم الطفل *
                </label>
                <input
                  id="kidNameInput"
                  name="name"
                  required
                  maxLength={80}
                  defaultValue={editingChild?.name || ''}
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="kidGenderInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    النوع واللون المميز
                  </label>
                  <select
                    id="kidGenderInput"
                    name="gender"
                    defaultValue={editingChild?.gender || 'boy'}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <option value="boy">ولد — أكوا</option>
                    <option value="girl">بنت — روز</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="kidBirthInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    تاريخ الميلاد
                  </label>
                  <input
                    id="kidBirthInput"
                    name="birth"
                    type="date"
                    max={todayISO}
                    defaultValue={editingChild?.birth || ''}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* 3D Avatar Personality Theme & Real Photo Upload */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)] p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-[var(--color-text)]">
                  🎨 الهوية البصرية للطفل (شخصية ثلاثية الأبعاد 3D أو صورة حقيقية محفوظة)
                </div>

                <div>
                  <label htmlFor="kidAvatarThemeInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    سمة الشخصية ثلاثية الأبعاد (3D Character Theme)
                  </label>
                  <select
                    id="kidAvatarThemeInput"
                    name="avatarTheme"
                    defaultValue={editingChild?.avatarTheme || 'astronaut'}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs"
                  >
                    {AVATAR_ACCESSORY_THEMES.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.labelAr} ({th.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold cursor-pointer">
                    📷 رفع صورة حقيقية للطفل (تُحفظ محليًا)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleChildPhotoUpload}
                      className="sr-only"
                    />
                  </label>

                  {childPhotoDraft && (
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!childUse3DAvatarDraft}
                        onChange={(e) => setChildUse3DAvatarDraft(!e.target.checked)}
                        className="accent-[var(--color-accent)]"
                      />
                      <span>عرض الصورة الحقيقية المرفوعة بدلًا من المجسم 3D</span>
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="kidInterestsInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  الاهتمامات والأنشطة المفضلة
                </label>
                <input
                  id="kidInterestsInput"
                  name="interests"
                  maxLength={240}
                  defaultValue={editingChild?.interests || ''}
                  placeholder="مثلاً: المكعبات، الرسم، القصص، السباحة"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="kidHeightInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    الطول التقريبي (سم)
                  </label>
                  <input
                    id="kidHeightInput"
                    name="growthHeightCm"
                    type="number"
                    min={30}
                    max={180}
                    defaultValue={editingChild?.growthHeightCm || ''}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="kidWeightInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    الوزن التقريبي (كجم)
                  </label>
                  <input
                    id="kidWeightInput"
                    name="growthWeightKg"
                    type="number"
                    step="0.1"
                    min={1}
                    max={80}
                    defaultValue={editingChild?.growthWeightKg || ''}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[var(--color-control-muted)] p-3 space-y-2">
                <div className="text-xs font-bold text-[var(--color-text)]">
                  🔒 بيانات صحية وتطعيمات (خاصة بالوالدين افتراضيًا)
                </div>
                <div>
                  <label htmlFor="kidVaccinationInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    ملاحظات التطعيمات
                  </label>
                  <input
                    id="kidVaccinationInput"
                    name="vaccinationsNote"
                    maxLength={200}
                    defaultValue={editingChild?.vaccinationsNote || ''}
                    placeholder="مثلاً: مكتمل حتى عمر 3 سنوات"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="kidHealthInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    ملاحظات صحية أو حساسية
                  </label>
                  <input
                    id="kidHealthInput"
                    name="healthNotePrivate"
                    maxLength={240}
                    defaultValue={editingChild?.healthNotePrivate || ''}
                    placeholder="لا تستخدم بيانات طبية حساسة حقيقية أثناء التجربة"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChildModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                >
                  حفظ الملف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Delete Child Confirmation Modal (Cascade Warning) */}
      {childToDelete && childDeleteSummary && (
        <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delChildTitle"
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <h2 id="delChildTitle" className="text-lg font-bold text-[var(--color-text)]">
              تأكيد حذف ملف {childToDelete.name}؟
            </h2>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              {childDeleteSummary.total > 0
                ? `سيتم أيضًا حذف ${childDeleteSummary.relatedTasks} مهمة روتين و${childDeleteSummary.relatedEvents} موعد تقويم و${childDeleteSummary.relatedWishes} أمنية مرتبطة بهذا الطفل لمنع بقاء بيانات يتيمة.`
                : 'لا توجد عناصر مرتبطة بهذا الملف. هل تريد المتابعة في الحذف؟'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteChildId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteChild}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white"
              >
                نعم، احذف الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add / Edit Routine Task Modal */}
      {taskModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTaskModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="taskModalTitle"
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="taskModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                {editingTask ? 'تعديل مهمة الروتين' : 'إضافة مهمة للروتين'}
              </h2>
              <button
                type="button"
                onClick={() => setTaskModalOpen(false)}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label htmlFor="taskNameInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  اسم المهمة *
                </label>
                <input
                  id="taskNameInput"
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={editingTask?.name || ''}
                  placeholder="مثلاً: قراءة قصة قبل النوم"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="taskTimeInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    الوقت
                  </label>
                  <input
                    id="taskTimeInput"
                    name="time"
                    maxLength={40}
                    defaultValue={editingTask?.time || ''}
                    placeholder="مثلاً 07:30 م"
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="taskCadenceInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    الدورية
                  </label>
                  <select
                    id="taskCadenceInput"
                    name="cadence"
                    defaultValue={editingTask?.cadence || 'daily'}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <option value="daily">يومي (اليوم)</option>
                    <option value="weekly">أسبوعي (الأسبوع)</option>
                    <option value="monthly">شهري (الشهر)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="taskKidInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  تخصيص المهمة
                </label>
                <select
                  id="taskKidInput"
                  name="kidId"
                  defaultValue={editingTask?.kidId ? String(editingTask.kidId) : ''}
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <option value="">مهمة أسرية مشتركة</option>
                  {state.kids.map((k) => (
                    <option key={k.id} value={String(k.id)}>
                      {k.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="taskCategoryInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    التصنيف
                  </label>
                  <select
                    id="taskCategoryInput"
                    name="category"
                    defaultValue={editingTask?.category || 'روتين عام'}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <option value="روتين عام">روتين عام</option>
                    <option value="أكل وشرب">أكل وشرب</option>
                    <option value="لعب وتعلم">لعب وتعلم</option>
                    <option value="نوم">نوم</option>
                    <option value="صحة">صحة</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="taskOwnerInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    المسؤول
                  </label>
                  <select
                    id="taskOwnerInput"
                    name="owner"
                    defaultValue={editingTask?.owner || 'مشترك'}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <option value="مشترك">مشترك</option>
                    <option value="الأم">الأم</option>
                    <option value="الأب">الأب</option>
                    <option value="مقدم رعاية">مقدم رعاية</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                >
                  حفظ المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add / Edit Calendar Event Modal */}
      {eventModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEventModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eventModalTitle"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="eventModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                {editingEvent ? 'تعديل الحدث' : 'إضافة حدث للتقويم الأسري'}
              </h2>
              <button
                type="button"
                onClick={() => setEventModalOpen(false)}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-3">
              <div>
                <label htmlFor="eventTitleInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  اسم الحدث *
                </label>
                <input
                  id="eventTitleInput"
                  name="title"
                  required
                  maxLength={120}
                  defaultValue={editingEvent?.title || ''}
                  placeholder="مثلاً: موعد تطعيم أو تمرين سباحة"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="eventDateInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    التاريخ *
                  </label>
                  <input
                    id="eventDateInput"
                    name="date"
                    type="date"
                    required
                    defaultValue={editingEvent?.date || todayISO}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="eventTimeInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    الوقت (اختياري)
                  </label>
                  <input
                    id="eventTimeInput"
                    name="time"
                    type="time"
                    defaultValue={editingEvent?.time || ''}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="eventTypeInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    نوع الحدث
                  </label>
                  <select
                    id="eventTypeInput"
                    name="type"
                    defaultValue={editingEvent?.type || 'موعد عائلي'}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    {[
                      'موعد عائلي',
                      'موعد طبي',
                      'تطعيم',
                      'حضانة / مدرسة',
                      'نشاط',
                      'عيد ميلاد',
                      'أخرى',
                    ].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="eventChildInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    مرتبط بمين؟
                  </label>
                  <select
                    id="eventChildInput"
                    name="childId"
                    defaultValue={editingEvent?.childId ? String(editingEvent.childId) : ''}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    <option value="">الأسرة كلها</option>
                    {state.kids.map((k) => (
                      <option key={k.id} value={String(k.id)}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="eventRepeatInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  التكرار
                </label>
                <select
                  id="eventRepeatInput"
                  name="repeat"
                  defaultValue={editingEvent?.repeat || 'none'}
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <option value="none">بدون تكرار</option>
                  <option value="weekly">أسبوعيًا (تسجيل وصفي فقط)</option>
                  <option value="monthly">شهريًا (تسجيل وصفي فقط)</option>
                  <option value="yearly">سنويًا (تسجيل وصفي فقط)</option>
                </select>
              </div>

              <div>
                <label htmlFor="eventNoteInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  ملاحظات / نص التذكير
                </label>
                <textarea
                  id="eventNoteInput"
                  name="note"
                  maxLength={500}
                  defaultValue={editingEvent?.note || ''}
                  placeholder="مثلاً: إحضار كارت التطعيمات"
                  className="w-full rounded-xl border border-[var(--color-border)] p-3 text-sm min-h-[70px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                >
                  حفظ الحدث
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add / Edit Wish Modal */}
      {wishModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setWishModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishModalTitle"
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="wishModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                {editingWish ? 'تعديل الأمنية' : 'إضافة أمنية أو هدف للطفل'}
              </h2>
              <button
                type="button"
                onClick={() => setWishModalOpen(false)}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveWish} className="space-y-3">
              <div>
                <label htmlFor="wishNameInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  اسم الأمنية أو الهدية *
                </label>
                <input
                  id="wishNameInput"
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={editingWish?.name || ''}
                  placeholder="مثلاً: دراجة توازن أو رحلة عائلية"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wishKidSelect" className="block text-xs text-[var(--color-muted)] mb-1">
                    الطفل *
                  </label>
                  <select
                    id="wishKidSelect"
                    name="kid"
                    defaultValue={editingWish?.kid || state.kids[0]?.id}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  >
                    {state.kids.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="wishPriceInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    السعر التقريبي ({state.currency})
                  </label>
                  <input
                    id="wishPriceInput"
                    name="price"
                    type="number"
                    min={0}
                    defaultValue={editingWish?.price ?? 250}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wishProgressInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    نسبة الادخار / الإنجاز (0–100%)
                  </label>
                  <input
                    id="wishProgressInput"
                    name="progress"
                    type="number"
                    min={0}
                    max={100}
                    defaultValue={editingWish?.progress ?? 40}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="wishGoalTypeInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    نوع الهدف
                  </label>
                  <input
                    id="wishGoalTypeInput"
                    name="goalType"
                    defaultValue={editingWish?.goalType || 'هدية / ادخار عائلي'}
                    className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWishModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                >
                  حفظ الأمنية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add Family Member Modal */}
      {personModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPersonModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="personModalTitle"
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="personModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                إضافة فرد لمساحة العائلة
              </h2>
              <button
                type="button"
                onClick={() => setPersonModalOpen(false)}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSavePerson} className="space-y-3">
              <div>
                <label htmlFor="personNameInput" className="block text-xs text-[var(--color-muted)] mb-1">
                  الاسم *
                </label>
                <input
                  id="personNameInput"
                  name="name"
                  required
                  maxLength={80}
                  placeholder="مثلاً: خالتو سلمى أو جدو محمود"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label htmlFor="personRoleSelect" className="block text-xs text-[var(--color-muted)] mb-1">
                  صلة القرابة
                </label>
                <select
                  id="personRoleSelect"
                  name="role"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <option>الأب</option>
                  <option>الأم</option>
                  <option>جدة الأم</option>
                  <option>جد الأم</option>
                  <option>جدة الأب</option>
                  <option>جد الأب</option>
                  <option>عم/خال</option>
                  <option>عمة/خالة</option>
                  <option>مشرفة حضانة</option>
                  <option>معلمة مدرسة</option>
                  <option>مربية أطفال</option>
                </select>
              </div>

              <div>
                <label htmlFor="personSideSelect" className="block text-xs text-[var(--color-muted)] mb-1">
                  جهة العائلة
                </label>
                <select
                  id="personSideSelect"
                  name="side"
                  className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
                >
                  <option>الأسرة الأساسية</option>
                  <option>عيلة الأم</option>
                  <option>عيلة الأب</option>
                  <option>الحضانة والمدرسة</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPersonModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                >
                  إضافة الفرد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Granular Permissions Modal (Expanded 11 Permissions) */}
      {permModalMember && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPermModalMember(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="permModalTitle"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="permModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                صلاحيات الاطلاع والرعاية لـ {permModalMember.name}
              </h2>
              <button
                type="button"
                onClick={() => setPermModalMember(null)}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveMemberPermissions} className="space-y-3">
              <p className="text-xs text-[var(--color-muted)]">
                مبدأ الصلاحيات الأقل (Least Privilege): كل فئة أدناه مستقلة، والفئات الصحية والصور الخاصة مغلقة افتراضيًا.
              </p>

              <div className="divide-y divide-[var(--color-border)] text-sm">
                {[
                  {
                    key: 'profile',
                    label: '👶 الملف الأساسي للطفل (الاسم والعمر التقريبي)',
                    checked: permModalMember.permissions?.profile ?? true,
                    sensitive: false,
                  },
                  {
                    key: 'routine',
                    label: '🧸 عرض وتحديث مهام الروتين اليومي',
                    checked: permModalMember.permissions?.routine ?? true,
                    sensitive: false,
                  },
                  {
                    key: 'calendar',
                    label: '📅 المناسبات والمواعيد المشتركة',
                    checked: permModalMember.permissions?.calendar ?? permModalMember.events,
                    sensitive: false,
                  },
                  {
                    key: 'receiveReminders',
                    label: '🔔 استقبال التذكيرات اليومية للمهام',
                    checked: permModalMember.permissions?.receiveReminders ?? true,
                    sensitive: false,
                  },
                  {
                    key: 'submitCareUpdates',
                    label: '📝 إرسال ملاحظات الرعاية أو تقارير الحضانة/المدرسة',
                    checked: permModalMember.permissions?.submitCareUpdates ?? false,
                    sensitive: false,
                  },
                  {
                    key: 'emergencyAccess',
                    label: '🚑 الوصول لبيانات الطوارئ وأرقام التواصل السريع',
                    checked: permModalMember.permissions?.emergencyAccess ?? false,
                    sensitive: false,
                  },
                  {
                    key: 'viewEducational',
                    label: '📖 الاطلاع على المحتوى التربوي والأنشطة المقترحة',
                    checked: permModalMember.permissions?.viewEducational ?? true,
                    sensitive: false,
                  },
                  {
                    key: 'uploadReports',
                    label: '📤 رفع صور الأنشطة المدرسية والتقارير بإذن الوالدين',
                    checked: permModalMember.permissions?.uploadReports ?? false,
                    sensitive: false,
                  },
                  {
                    key: 'wishes',
                    label: '🎁 قائمة الأمنيات والهدايا',
                    checked: permModalMember.permissions?.wishes ?? permModalMember.wishes,
                    sensitive: false,
                  },
                  {
                    key: 'growth',
                    label: '📈 سجل النمو والقياسات',
                    checked: permModalMember.permissions?.growth ?? false,
                    sensitive: false,
                  },
                  {
                    key: 'health',
                    label: '🩺 السجلات الصحية والتطعيمات (بيانات شديدة الحساسية)',
                    checked: permModalMember.permissions?.health ?? false,
                    sensitive: true,
                  },
                  {
                    key: 'privatePhotos',
                    label: '🖼️ الصور والملاحظات الخاصة (مغلقة افتراضيًا)',
                    checked: permModalMember.permissions?.privatePhotos ?? false,
                    sensitive: true,
                  },
                ].map((item) => (
                  <label key={item.key} className="py-2 flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-xs font-semibold text-[var(--color-text)]">{item.label}</span>
                    <input
                      type="checkbox"
                      name={item.key}
                      defaultChecked={item.sensitive && state.disputeFreezeActive ? false : item.checked}
                      disabled={item.sensitive && state.disputeFreezeActive}
                      className="w-4 h-4 accent-[var(--color-accent)]"
                    />
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPermModalMember(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                >
                  حفظ الصلاحيات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Profile & Quick Controls Drawer (Relocated Secondary Metadata & Experience Controls) */}
      {roleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRoleModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="roleModalTitle"
            className="w-full max-w-md rounded-[24px] bg-[var(--color-surface)] p-6 space-y-4 border border-[var(--color-border)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div>
                <h2 id="roleModalTitle" className="text-base sm:text-lg font-extrabold text-[var(--color-text)]">
                  {lang === 'en' ? 'Profile & Quick Controls Drawer' : 'درج الحساب والتحكم السريع'}
                </h2>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  {todayFormatted.combined}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                aria-label={lang === 'en' ? 'Close' : 'إغلاق'}
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            {/* Quick Account Setup & Cart Controls */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  setOnboardingModalOpen(true);
                }}
                className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold text-xs text-start"
              >
                ✨ {lang === 'en' ? 'Account & City Wizard' : 'معالج الحساب والمدينة'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  navigateTo('services');
                }}
                className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)] font-extrabold text-xs text-start"
              >
                🛒 {lang === 'en' ? `Shopping Cart (${cartItemCount})` : `سلة التسوق (${cartItemCount})`}
              </button>
            </div>

            {/* Relocated City / Governorate & GPS Filter inside Profile Drawer */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-muted)] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="drawer-city-select" className="text-xs font-extrabold text-[var(--color-text)]">
                  📍 {lang === 'en' ? 'City / Governorate & GPS' : 'المدينة والمحافظة وتحديد الموقع'}
                </label>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-[var(--color-accent-soft)] text-[var(--color-role-text)]">
                  {state.currency}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  id="drawer-city-select"
                  value={`${state.country}:${state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}`}
                  onChange={(e) => handleSelectPreciseCity(e.target.value)}
                  className="flex-1 min-h-[38px] rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1.5 text-xs font-extrabold text-[var(--color-text)]"
                >
                  <optgroup label={lang === 'en' ? '🇸🇦 Saudi Arabia' : '🇸🇦 السعودية'}>
                    {COUNTRY_CITIES_MAP.SA.map((c) => (
                      <option key={`drw-sa-${c.id}`} value={`SA:${c.id}`}>
                        {lang === 'en' ? c.nameEn : c.nameAr}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label={lang === 'en' ? '🇪🇬 Egypt' : '🇪🇬 مصر'}>
                    {COUNTRY_CITIES_MAP.EG.map((c) => (
                      <option key={`drw-eg-${c.id}`} value={`EG:${c.id}`}>
                        {lang === 'en' ? c.nameEn : c.nameAr}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-extrabold bg-[#0d9488] text-white shrink-0"
                >
                  📍 GPS
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  handleSelectParentProfile('mom');
                  setRoleModalOpen(false);
                }}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 font-bold text-xs sm:text-sm text-start"
              >
                👩🏻‍🍼 {lang === 'en' ? 'Mother Profile — Soft Coral & Warm Rose (Mom Sara)' : 'حساب الأم (ماما سارة) — مرجاني دافئ ووردي ناعم'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSelectParentProfile('dad');
                  setRoleModalOpen(false);
                }}
                className="p-3.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-900 font-bold text-xs sm:text-sm text-start"
              >
                👨🏻‍🍼 {lang === 'en' ? 'Father Profile — Calm Teal & Slate Blue (Dad Ahmed)' : 'حساب الأب (بابا أحمد) — تيل هادئ وأزرق أردوازي'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setState((prev) => ({ ...prev, role: 'high-contrast', darkMode: false }));
                  setRoleModalOpen(false);
                  showToast(lang === 'en' ? 'High Contrast mode enabled' : 'تم تفعيل وضع التباين العالي');
                }}
                className="p-3.5 rounded-xl border border-slate-500 bg-white text-slate-900 font-bold text-xs sm:text-sm text-start"
              >
                👁️ {lang === 'en' ? 'High Contrast Accessibility Mode' : 'وضع التباين العالي (High Contrast Accessibility)'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleToggleDarkMode();
                  setRoleModalOpen(false);
                }}
                className="p-3.5 rounded-xl border border-teal-400/50 bg-teal-50 text-teal-950 font-bold text-xs sm:text-sm text-start flex items-center justify-between gap-2"
              >
                <span>
                  {state.darkMode
                    ? lang === 'en'
                      ? '☀️ Switch to Breathable Light Mode'
                      : '☀️ التبديل إلى الوضع النهاري المريح'
                    : lang === 'en'
                    ? '🌙 Enable Deep Midnight Teal Dark Mode (#0B131A)'
                    : '🌙 تفعيل الوضع الليلي العميق (#0B131A)'}
                </span>
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-teal-100 text-teal-900">
                  {state.darkMode ? (lang === 'en' ? 'Active' : 'مفعّل') : (lang === 'en' ? 'Off' : 'إيقاف')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Media Reader / Video Details Modal */}
      {activeMediaModal && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveMediaModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mediaReaderTitle"
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-[var(--color-muted)]">
                  {activeMediaModal.tags.join(' · ')} · مناسب لعمر {activeMediaModal.ageStage === 'all' ? '0–8 سنوات' : `${activeMediaModal.ageStage} سنوات`}
                </div>
                <h2 id="mediaReaderTitle" className="text-xl font-bold text-[var(--color-text)] mt-1">
                  {activeMediaModal.emoji} {lang === 'en' ? activeMediaModal.titleEn : activeMediaModal.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveMediaModal(null)}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            {activeMediaModal.isSponsored && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                إفصاح إعلاني: {activeMediaModal.sponsorLabel || 'محتوى برعاية تجارية'}
              </div>
            )}

            <div className="space-y-3 text-sm text-[var(--color-text)] leading-relaxed">
              {activeMediaModal.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
              <span className="text-xs text-[var(--color-muted)]">
                {activeMediaModal.durationLabel} · تقييم {activeMediaModal.rating}/5
              </span>
              <button
                type="button"
                onClick={() => setActiveMediaModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Rich 3D Product / Service Detail Modal */}
      {activeCommercialModal && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveCommercialModal(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="commercialModalTitle"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-[var(--color-muted)]">
                  {locText(activeCommercialModal.categoryLabel, lang)} · {locText(activeCommercialModal.city, lang)}
                </div>
                <h2 id="commercialModalTitle" className="text-xl font-bold text-[var(--color-text)] mt-1">
                  {activeCommercialModal.emoji} {lang === 'en' ? activeCommercialModal.nameEn : activeCommercialModal.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommercialModal(null)}
                aria-label={lang === 'en' ? 'Close' : 'إغلاق'}
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-[var(--color-muted)] leading-relaxed">
              {lang === 'en' && activeCommercialModal.descriptionEn
                ? activeCommercialModal.descriptionEn
                : activeCommercialModal.description}
            </p>

            {/* Variant Selector */}
            {activeCommercialModal.variants && activeCommercialModal.variants.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--color-text)]">
                  {lang === 'en' ? 'Select Option / Variant:' : 'اختر المقاس أو الباقة:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeCommercialModal.variants.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedModalVariant(v)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                        selectedModalVariant === v
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-bold'
                          : 'border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)]'
                      }`}
                    >
                      {locText(v, lang)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications List */}
            {activeCommercialModal.specificationsAr && (
              <div className="rounded-xl bg-[var(--color-control-muted)] p-3.5 text-xs space-y-1">
                <div className="font-bold text-[var(--color-text)]">
                  {lang === 'en' ? 'Specifications & Safety:' : 'المواصفات ومعايير الأمان:'}
                </div>
                <ul className="list-disc list-inside text-[var(--color-muted)] space-y-0.5">
                  {(lang === 'en'
                    ? activeCommercialModal.specificationsEn || activeCommercialModal.specificationsAr
                    : activeCommercialModal.specificationsAr
                  ).map((spec, i) => (
                    <li key={i}>{spec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-xl bg-[var(--color-control-muted)] p-3.5 text-xs space-y-1 tabular-nums">
              <div>
                <strong>{lang === 'en' ? 'Price in Egypt: ' : 'السعر في مصر: '}</strong>
                {formatCurrency(activeCommercialModal.priceEGP, 'EGP', state.language)}
              </div>
              <div>
                <strong>{lang === 'en' ? 'Price in Saudi Arabia: ' : 'السعر في السعودية: '}</strong>
                {formatCurrency(activeCommercialModal.priceSAR, 'SAR', state.language)}
              </div>
              {activeCommercialModal.sellerName && (
                <div>
                  <strong>{lang === 'en' ? 'Provider / Seller: ' : 'مقدم الخدمة / البائع: '}</strong>
                  {locText(activeCommercialModal.sellerName, lang)}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleAddToCart(activeCommercialModal, selectedModalVariant);
                  setActiveCommercialModal(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
              >
                {lang === 'en' ? '🛒 Add to Shopping Cart' : '🛒 أضف إلى سلة التسوق'}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleQuickAddWish(
                    activeCommercialModal.name,
                    activeCommercialModal.priceEGP,
                    activeCommercialModal.priceSAR,
                    activeCommercialModal.emoji
                  );
                  setActiveCommercialModal(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-control-bg)]"
              >
                {lang === 'en' ? '+ Add to Wishes' : '+ أضف للأمنيات'}
              </button>
              <button
                type="button"
                onClick={() => setActiveCommercialModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
              >
                {lang === 'en' ? 'Close' : 'إغلاق'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Confirm Reset All Data Modal */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="resetModalTitle"
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <h2 id="resetModalTitle" className="text-lg font-bold text-[var(--color-text)]">
              مسح البيانات المحلية وإعادة الضبط؟
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              سيتم مسح التعديلات المحفوظة في هذا المتصفح وإعادة البيانات التجريبية الافتراضية. يُنصح بتصدير نسخة JSON أولًا إذا كنت ترغب في الاحتفاظ ببياناتك.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)]"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleResetAllData}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white"
              >
                نعم، أعد الضبط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Toast / Snackbar Micro-feedback */}
      <GlobalToastSnackbar
        message={toastMsg}
        onClose={() => setToastMsg(null)}
        language={state.language}
      />
    </div>
  );
}
