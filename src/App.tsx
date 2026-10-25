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
} from './domain/familySpaceCore';
import { AvatarAccessoryTheme } from './domain/assetManifest3D';
import { t } from './domain/i18n';
import {
  loadFamilySpaceState,
  saveFamilySpaceState,
  exportFamilySpaceJsonBackup,
  resetFamilySpaceState,
} from './services/familyStorageService';
import { getLocalizedDocumentTitle } from './utils/familyFormatters';
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
import { AiAssistantSection } from './components/AiAssistantSection';
import { OnboardingFlowModal } from './components/OnboardingFlowModal';
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
  GlobalToastSnackbar,
  InnerScreenTopBar,
  PASTEL_CARD_TONES,
  SectionSkeletonLoader,
  SoftFilledIcon,
} from './components/DesignSystem';

export default function App() {
  const [state, setState] = useState<FamilySpaceState>(() => loadFamilySpaceState());
  const [activePage, setActivePage] = useState<PageId>('home');
  const [isTabLoading, setIsTabLoading] = useState<boolean>(false);
  const tabLoadingTimerRef = React.useRef<number | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showInnerSettings, setShowInnerSettings] = useState<boolean>(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'active'>('idle');

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
        ? 'Language switched to English (LTR) — Nekbaar'
        : 'تم التبديل إلى اللغة العربية (RTL) — نكبر'
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

  // Precise City/Governorate Dropdown Change Handler (SA & EG individual cities)
  const handleSelectPreciseCity = (combinedValue: string) => {
    const [countryRaw, cityVal] = combinedValue.split(':');
    const nextCountry: CountryCode = countryRaw === 'SA' ? 'SA' : 'EG';
    const cityObj =
      COUNTRY_CITIES_MAP[nextCountry].find((c) => c.id === cityVal) ||
      COUNTRY_CITIES_MAP[nextCountry][0];
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
    showToast(
      lang === 'en'
        ? 'Child 3D profile saved!'
        : 'تم حفظ ملف الطفل وهويته ثلاثية الأبعاد بنجاح'
    );
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
        ? 'Experience & language preferences saved'
        : 'تم حفظ تفضيلات التجربة واللغة والتقويم'
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
        ? 'Country, City, Currency & Verified Phone updated!'
        : 'تم تحديث الدولة والمدينة والعملة وتوثيق رقم الهاتف الدولي بنجاح!'
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
    <FamilyAppProvider
      value={{
        state,
        setState,
        activePage,
        navigateTo,
        showToast,
      }}
    >
      <div className="min-h-screen w-full overflow-x-hidden pb-24 lg:pb-8">
        <HeaderBar
          lang={lang}
          brandName={t(lang, 'brandName')}
          darkMode={Boolean(state.darkMode)}
          unreadNotifCount={unreadNotifCount}
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
          onOpenProfileDrawer={() => setRoleModalOpen(true)}
          isScrolled={isScrolled}
        />



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
                <SoftFilledIcon id="family" size={14} />
                <span>{lang === 'en' ? parentProfileSpec.roleBadgeEn : parentProfileSpec.roleBadgeAr}</span>
              </div>
              <button
                id="open-onboarding-wizard-btn"
                type="button"
                onClick={() => setOnboardingModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-extrabold bg-[var(--color-accent-soft)] text-[var(--color-role-text)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)] hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <SoftFilledIcon id="sparkles" size={16} />
                <span>{lang === 'en' ? 'Account & Profile Setup' : 'إعدادات الحساب السريعة'}</span>
              </button>
            </div>

            <nav
              className="grid gap-1.5"
              aria-label={lang === 'en' ? 'Platform navigation' : 'قائمة أقسام المنصة'}
            >
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
                onSelectParentProfile={handleSelectParentProfile}
                onSelectPreciseCity={handleSelectPreciseCity}
                onUseCurrentLocation={handleUseCurrentLocation}
                onAddToCart={handleAddToCart}
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

            {/* UNIFIED FOOTER AREA */}
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
                  className={`inline-flex items-center gap-1 hover:underline transition-colors ${
                    activePage === 'privacy'
                      ? 'text-teal-700 underline'
                      : 'text-[var(--color-text)]'
                  }`}
                >
                  <SoftFilledIcon id="shield" size={14} />
                  <span>{lang === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}</span>
                </button>
                <span aria-hidden="true" className="text-[var(--color-muted)]">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('terms')}
                  className={`inline-flex items-center gap-1 hover:underline transition-colors ${
                    activePage === 'terms'
                      ? 'text-indigo-700 underline'
                      : 'text-[var(--color-text)]'
                  }`}
                >
                  <SoftFilledIcon id="star" size={14} />
                  <span>{lang === 'en' ? 'Terms & IP Rights' : 'الشروط والأحكام وحقوق الملكية'}</span>
                </button>
                <span aria-hidden="true" className="text-[var(--color-muted)]">
                  ·
                </span>
                <button
                  type="button"
                  onClick={() => navigateTo('contact')}
                  className={`inline-flex items-center gap-1 hover:underline transition-colors ${
                    activePage === 'contact'
                      ? 'text-orange-700 underline'
                      : 'text-[var(--color-text)]'
                  }`}
                >
                  <SoftFilledIcon id="notifications" size={14} />
                  <span>{lang === 'en' ? 'Contact Us' : 'تواصل معنا'}</span>
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
          const isProfileBranch = ['settings', 'family', 'privacy', 'terms', 'contact'].includes(
            activePage
          );

          return (
            <nav
              className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border)] glass-bottom-nav px-2 pt-1.5 pb-2 grid grid-cols-5 items-end gap-1 shadow-[0_-8px_24px_-6px_rgba(42,36,51,0.14)]"
              aria-label={lang === 'en' ? 'Mobile Bottom Navigation' : 'التنقل السفلي للموبايل'}
            >
              {/* 1. Home */}
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

              {/* 2. Store */}
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

              {/* 3. Central AI Robot Assistant FAB */}
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

              {/* 4. Community */}
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
                <span className="truncate max-w-full">
                  {lang === 'en' ? 'Community' : 'المجتمع'}
                </span>
              </button>

              {/* 5. Profile */}
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
              {lang === 'en' ? 'Instant Smart Plans' : 'خطط فورية مخصصة'}
            </span>
          </span>
        </button>

        {/* Registration, Login, Country & City Selection, Parent & Child Onboarding Wizard */}
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
                ? `Welcome ${parentName}! Location set to ${city} (${currency}).`
                : `أهلًا بك ${parentName}! تم ضبط الموقع على ${city} (${currency}).`
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
            navigateTo('services');
          }}
          onSelectPreciseCity={handleSelectPreciseCity}
          onUseCurrentLocation={handleUseCurrentLocation}
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
