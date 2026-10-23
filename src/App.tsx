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
} from './domain/familySpaceCore';
import {
  AVATAR_ACCESSORY_THEMES,
  AvatarAccessoryTheme,
  THREE_D_ASSET_MANIFEST,
} from './domain/assetManifest3D';
import { t } from './domain/i18n';
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
import { GoogleDriveSection } from './components/GoogleDriveSection';
import {
  ThreeDChildAvatar,
  ThreeDIcon,
  ThreeDIconId,
  ThreeDInteractiveScene,
} from './components/ThreeDVisuals';

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
  | 'settings';

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
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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

  // Sync theme, direction, language, and localStorage
  useEffect(() => {
    document.documentElement.dataset.theme = state.role || 'mom';
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
        ? `Added "${item.nameEn}" to your family cart`
        : `تمت إضافة «${item.name}» إلى سلة التسوق`
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

  const handleCompleteDemoCheckout = () => {
    if (state.cart.length === 0) return;
    const orderItems = state.cart
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

    const totalAmount = orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const newOrder = {
      id: `FS-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      items: orderItems,
      totalAmount,
      currency: state.currency,
      shippingAddress: state.shippingAddress,
      status: 'confirmed_demo' as const,
    };

    setState((prev) => ({
      ...prev,
      cart: [],
      orders: [newOrder, ...prev.orders],
    }));
    showToast(
      lang === 'en'
        ? `✓ Demo Order #${newOrder.id} confirmed! (No real payment charged)`
        : `✓ تم تأكيد الطلب التجريبي رقم #${newOrder.id} بنجاح (محاكاة بدون دفع فعلي)`
    );
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
    showToast('تم حفظ تفضيلات التجربة واللغة والتقويم');
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
    { id: 'assistant', label: t(lang, 'navAssistant'), shortLabel: lang === 'en' ? 'AI Guide' : 'مساعد AI', iconId: 'assistant' },
    { id: 'family', label: t(lang, 'navFamily'), shortLabel: lang === 'en' ? 'Family' : 'العائلة', iconId: 'family' },
    { id: 'settings', label: t(lang, 'navSettings'), shortLabel: lang === 'en' ? 'Settings' : 'الإعدادات', iconId: 'settings' },
  ];

  const childToDelete = useMemo(
    () => (confirmDeleteChildId !== null ? state.kids.find((k) => k.id === confirmDeleteChildId) : null),
    [confirmDeleteChildId, state.kids]
  );
  const childDeleteSummary = useMemo(
    () => (confirmDeleteChildId !== null ? getChildDeletionSummary(state, confirmDeleteChildId) : null),
    [confirmDeleteChildId, state]
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-20 lg:pb-8">
      {/* Top Bar Contract: Brand Wordmark + Primary Nav + Language/Notifications/Cart/Role Controls */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xs">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-extrabold tracking-tight text-[var(--color-text)] whitespace-nowrap shrink-0 text-start"
          >
            <ThreeDIcon id="home" size={22} />
            <span className="hidden sm:inline">{t(lang, 'brandName')}</span>
            <span className="sm:hidden">{lang === 'en' ? 'Family Space' : 'مساحة الأسرة'}</span>
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

          {/* Zone 3: Onboarding/City Wizard + Language Switcher + Notifications + Cart + Role Switcher */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Registration / Login / Country & City Setup Wizard Trigger */}
            <button
              id="open-onboarding-wizard-btn"
              type="button"
              onClick={() => setOnboardingModalOpen(true)}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold border border-[var(--color-accent)]/40 bg-[var(--color-accent-soft)] text-[var(--color-role-text)] whitespace-nowrap shrink-0 hover:border-[var(--color-accent)]"
            >
              📍 {state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}{' '}
              <span className="hidden md:inline">
                · {lang === 'en' ? 'Setup' : 'إعداد الحساب'}
              </span>
            </button>

            {/* Top Language Switcher (AR <-> EN) */}
            <button
              id="top-language-switcher"
              type="button"
              onClick={handleToggleTopLanguage}
              aria-label={lang === 'ar' ? 'Switch language to English' : 'التبديل إلى اللغة العربية'}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] whitespace-nowrap shrink-0 hover:border-[var(--color-accent)]"
            >
              🌐 {lang === 'ar' ? 'EN' : 'عربي'}
            </button>

            {/* 3-Daily Notifications Quick Button */}
            <button
              type="button"
              onClick={() => navigateTo('notifications')}
              aria-label={t(lang, 'notifBtnLabel')}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>🔔</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-contrast)] text-[10px] tabular-nums">
                {unreadNotifCount}
              </span>
            </button>

            {/* Cart Quick Button */}
            <button
              type="button"
              onClick={() => navigateTo('services')}
              aria-label={t(lang, 'cartBtnLabel')}
              className="hidden sm:flex px-2 py-1.5 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)] items-center gap-1 whitespace-nowrap shrink-0"
            >
              <span>🛒</span>
              <span className="tabular-nums">{cartItemCount}</span>
            </button>

            {/* Role / Experience Switcher */}
            <button
              type="button"
              onClick={() => setRoleModalOpen(true)}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border border-[var(--color-border)] bg-[var(--color-role-soft)] text-[var(--color-role-text)] whitespace-nowrap shrink-0"
            >
              🎨{' '}
              <span>
                {state.role === 'dad'
                  ? lang === 'en'
                    ? 'Father — Aqua'
                    : 'الأب — أكوا'
                  : state.role === 'high-contrast'
                  ? lang === 'en'
                    ? 'Contrast'
                    : 'تباين'
                  : lang === 'en'
                  ? 'Mother — Rose'
                  : 'الأم — روز'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container (Sidebar + Content Canvas) */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 grid grid-cols-1 lg:grid-cols-[248px_1fr] gap-6 items-start">
        {/* Sidebar Navigation with 3D Icon Family */}
        <aside className="hidden lg:block sticky top-20 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4 shadow-2xs">
          <div className="pb-3 border-b border-[var(--color-border)] space-y-2">
            <div className="text-xs font-semibold text-[var(--color-muted)]">
              {state.country === 'SA' ? '🇸🇦 السعودية' : '🇪🇬 مصر'} · 📍 {state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')} · {state.currency}
            </div>
            <div className="text-sm font-bold text-[var(--color-text)]">
              {lang === 'en' ? `Welcome, ${state.parentName} 👋` : `أهلًا ${state.parentName} 👋`}
            </div>
            <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
              {t(lang, 'brandTagline')}
            </p>
            <button
              type="button"
              onClick={() => setOnboardingModalOpen(true)}
              className="w-full py-1.5 px-3 rounded-xl text-[11px] font-extrabold bg-[var(--color-accent-soft)] text-[var(--color-role-text)] border border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)] hover:text-white transition-colors"
            >
              {lang === 'en' ? '✨ Account, Country & City Wizard' : '✨ معالج التسجيل والدولة والمدينة'}
            </button>
          </div>

          <nav className="grid gap-1" aria-label="قائمة أقسام المنصة">
            {navItems.map((item) => {
              const active = activePage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-start whitespace-nowrap ${
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

          <div className="rounded-xl bg-[var(--color-notice)] text-[var(--color-notice-text)] p-3 text-[11px] leading-relaxed">
            {t(lang, 'prototypeNotice')}
          </div>
        </aside>

        {/* Main Viewport */}
        <main className="min-w-0 space-y-6">
          {/* ================================================================
              PAGE 1: HOME DASHBOARD (الشاشة الرئيسية ثلاثية الأبعاد)
              ================================================================ */}
          {activePage === 'home' && (
            <section className="space-y-6" aria-label="الشاشة الرئيسية">
              {/* 3D-First Hero Card */}
              <div
                className="rounded-[24px] p-5 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                style={{
                  background:
                    'linear-gradient(125deg, var(--color-hero-start), var(--color-hero-mid), var(--color-hero-end))',
                  boxShadow:
                    '0 18px 36px -14px rgba(42, 36, 51, 0.14), inset 0 2px 4px rgba(255,255,255,0.85)',
                }}
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="text-xs font-bold text-[var(--color-role-text)]">
                    {state.role === 'dad'
                      ? t(lang, 'heroBadgeDad')
                      : state.role === 'high-contrast'
                      ? t(lang, 'heroBadgeContrast')
                      : t(lang, 'heroBadgeMom')}{' '}
                    · {lang === 'en' ? `Hello ${state.parentName}` : `صباح الخير ${state.parentName}`} · 📍 {state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] leading-tight">
                    {t(lang, 'heroHeadline')}
                  </h1>
                  <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                    {t(lang, 'heroSub')}
                  </p>
                  {/* 6 Core Value Pillars */}
                  <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[var(--color-text)]">
                    <span>📅 {t(lang, 'pillar1')}</span>
                    <span aria-hidden="true">·</span>
                    <span>🩺 {t(lang, 'pillar2')}</span>
                    <span aria-hidden="true">·</span>
                    <span>📱 {t(lang, 'pillar3')}</span>
                    <span aria-hidden="true">·</span>
                    <span>💬 {t(lang, 'pillar4')}</span>
                    <span aria-hidden="true">·</span>
                    <span>🤖 {t(lang, 'pillar5')}</span>
                    <span aria-hidden="true">·</span>
                    <span>🛍️ {t(lang, 'pillar6')}</span>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOnboardingModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap shrink-0 shadow-xs"
                    >
                      {lang === 'en' ? '✨ Account & City Setup' : '✨ إعداد الحساب والدولة والمدينة'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('medical')}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-emerald-200 bg-emerald-50 text-emerald-900 whitespace-nowrap shrink-0"
                    >
                      🩺 {t(lang, 'navMedical')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('media')}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-indigo-200 bg-indigo-50 text-indigo-900 whitespace-nowrap shrink-0"
                    >
                      📱 {t(lang, 'navMedia')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('community')}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-amber-200 bg-amber-50 text-amber-900 whitespace-nowrap shrink-0"
                    >
                      💬 {t(lang, 'navCommunity')}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('chat')}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-sky-200 bg-sky-50 text-sky-900 whitespace-nowrap shrink-0"
                    >
                      💭 {t(lang, 'navChat')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('google-drive-integration-card');
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                          navigateTo('settings');
                        }
                      }}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold border border-violet-300 bg-violet-50 text-violet-900 whitespace-nowrap shrink-0"
                    >
                      ☁️ {lang === 'en' ? 'Google Drive Project Sync' : 'رفع المشروع ومزامنة الجلسة على Drive'}
                    </button>
                  </div>
                </div>

                {/* Interactive 3D Family Scene */}
                <div className="w-full md:w-auto shrink-0">
                  <ThreeDInteractiveScene
                    variant="hero-family"
                    title={lang === 'en' ? 'Day 1 to 8 Years (3D)' : 'من أول يوم لحد 8 سنين (3D)'}
                    subtitle={todayFormatted.combined}
                  />
                </div>
              </div>

              {/* 4 KPI Summary Strip with 3D Volumetric Icons */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-[var(--color-text)]">
                    {t(lang, 'quickOverview')}
                  </h2>
                  <span className="text-xs text-[var(--color-muted)] tabular-nums">
                    {todayFormatted.combined}
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <button
                    type="button"
                    onClick={() => navigateTo('children')}
                    className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3.5 text-start hover:border-[var(--color-accent)] transition-colors"
                  >
                    <ThreeDIcon id="children" size={40} />
                    <div>
                      <strong className="block text-xl font-extrabold text-[var(--color-text)] tabular-nums">
                        {state.kids.length}
                      </strong>
                      <span className="text-xs text-[var(--color-muted)]">{t(lang, 'metricKids')}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('routine')}
                    className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3.5 text-start hover:border-[var(--color-accent)] transition-colors"
                  >
                    <ThreeDIcon id="routine" size={40} />
                    <div>
                      <strong className="block text-xl font-extrabold text-[var(--color-text)] tabular-nums">
                        {completedTasksCount}/{state.tasks.length}
                      </strong>
                      <span className="text-xs text-[var(--color-muted)]">{t(lang, 'metricTasks')}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('calendar')}
                    className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3.5 text-start hover:border-[var(--color-accent)] transition-colors"
                  >
                    <ThreeDIcon id="calendar" size={40} />
                    <div>
                      <strong className="block text-xl font-extrabold text-[var(--color-text)] tabular-nums">
                        {state.events.length}
                      </strong>
                      <span className="text-xs text-[var(--color-muted)]">{t(lang, 'metricEvents')}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('wishes')}
                    className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3.5 text-start hover:border-[var(--color-accent)] transition-colors"
                  >
                    <ThreeDIcon id="wishes" size={40} />
                    <div>
                      <strong className="block text-xl font-extrabold text-[var(--color-text)] tabular-nums">
                        {state.wishes.length}
                      </strong>
                      <span className="text-xs text-[var(--color-muted)]">{t(lang, 'metricWishes')}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Nearest Appointment & 3D Children Split Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
                {/* Nearest Appointment Card */}
                <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-[var(--color-text)]">
                      {t(lang, 'nearestAppointment')}
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateTo('calendar')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] whitespace-nowrap"
                    >
                      {t(lang, 'openCalendar')}
                    </button>
                  </div>

                  {nearestEvent ? (
                    <div className="rounded-2xl bg-[var(--color-notice)] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <ThreeDIcon id="health" size={42} />
                        <div>
                          <div className="font-bold text-sm text-[var(--color-text)]">
                            {nearestEvent.title}
                          </div>
                          <div className="text-xs text-[var(--color-notice-text)] tabular-nums mt-0.5">
                            {formatGregorianAndHijri(nearestEvent.date, state.country, state.language, state.calendarMode).combined}
                            {nearestEvent.time ? ` · ${nearestEvent.time}` : ''}
                          </div>
                          <div className="text-xs text-[var(--color-muted)] mt-0.5">
                            {nearestEvent.childId && kidMap[String(nearestEvent.childId)]
                              ? `الطفل: ${kidMap[String(nearestEvent.childId)].name}`
                              : 'الأسرة كلها'}{' '}
                            · {nearestEvent.type}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateTo('calendar')}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap shrink-0"
                      >
                        {t(lang, 'viewDetails')}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] p-5 text-center text-xs text-[var(--color-muted)]">
                      {t(lang, 'noUpcomingEvents')}
                    </div>
                  )}
                </div>

                {/* 3D Children Quick Cards */}
                <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-bold text-[var(--color-text)]">
                      {t(lang, 'yourChildren')}
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateTo('children')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] whitespace-nowrap"
                    >
                      {t(lang, 'manageProfiles')}
                    </button>
                  </div>

                  {state.kids.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] p-5 text-center text-xs text-[var(--color-muted)]">
                      لا توجد ملفات أطفال مسجلة بعد.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {state.kids.map((kid) => {
                        const ageInfo = calculateChildAge(kid.birth, state.language);
                        return (
                          <div
                            key={kid.id}
                            className="rounded-2xl border border-[var(--color-border)] p-3.5 flex items-center gap-3"
                          >
                            <ThreeDChildAvatar
                              name={kid.name}
                              gender={kid.gender}
                              stageCode={ageInfo.stageCode}
                              accessoryTheme={kid.avatarTheme || 'astronaut'}
                              photoDataUrl={kid.photoDataUrl}
                              useIllustratedAvatar={kid.useIllustratedAvatar}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm text-[var(--color-text)] truncate">
                                {kid.name}
                              </div>
                              <div className="text-xs text-[var(--color-muted)] tabular-nums">
                                {ageInfo.label} · {kid.gender === 'girl' ? (lang === 'en' ? 'Girl' : 'بنت') : lang === 'en' ? 'Boy' : 'ولد'}
                              </div>
                              <div className="text-[11px] text-[var(--color-muted)] truncate mt-0.5">
                                {kid.interests || 'بدون اهتمامات مسجلة'}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Today's Routine Preview with Reminder Badges */}
              <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-[var(--color-text)]">
                    {t(lang, 'todayRoutine')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateTo('routine')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] whitespace-nowrap"
                  >
                    {t(lang, 'viewAllRoutine')}
                  </button>
                </div>

                <div className="divide-y divide-[var(--color-border)]">
                  {state.tasks.slice(0, 5).map((task) => {
                    const assignedKid = task.kidId ? kidMap[String(task.kidId)] : null;
                    const reminder = getRoutineTaskReminder(
                      task,
                      effectiveNowMinutes,
                      routineApproachingWindow,
                      state.language
                    );
                    return (
                      <label
                        key={task.id}
                        className="py-2.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                            className="w-4 h-4 accent-[var(--color-task-accent)] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-sm font-semibold ${
                                  task.done
                                    ? 'line-through text-[var(--color-muted)]'
                                    : 'text-[var(--color-text)]'
                                }`}
                              >
                                {task.name}
                              </span>
                              {renderReminderBadge(reminder, true)}
                            </div>
                            <span className="text-xs text-[var(--color-muted)] block mt-0.5">
                              {assignedKid ? assignedKid.name : 'الأسرة كلها'} · {task.category} · المسؤول: {task.owner}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-[var(--color-muted)] tabular-nums shrink-0">
                          {task.time || 'مرن'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Unified Ecosystem Previews: Media + Store + 3 Daily Notifications */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Media Preview */}
                <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[var(--color-text)]">
                      {t(lang, 'featuredMedia')}
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateTo('media')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] whitespace-nowrap"
                    >
                      {t(lang, 'exploreMedia')}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {MEDIA_CONTENT_CATALOG.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[var(--color-border)] p-3 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0" aria-hidden="true">{item.emoji}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[var(--color-text)] truncate">
                              {lang === 'en' ? item.titleEn : item.title}
                            </div>
                            <div className="text-[11px] text-[var(--color-muted)]">
                              {item.durationLabel}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveMediaModal(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--color-control-muted)] text-[var(--color-text)] shrink-0"
                        >
                          {lang === 'en' ? 'Open' : 'عرض'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Store & Services Preview */}
                <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[var(--color-text)]">
                      {t(lang, 'featuredOffers')}
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateTo('services')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] whitespace-nowrap"
                    >
                      {t(lang, 'exploreStore')}
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {COMMERCIAL_CATALOG.slice(0, 2).map((item) => {
                      const p = state.currency === 'SAR' ? item.priceSAR : item.priceEGP;
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-[var(--color-border)] p-3 flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0" aria-hidden="true">{item.emoji}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[var(--color-text)] truncate">
                                {lang === 'en' ? item.nameEn : item.name}
                              </div>
                              <div className="text-[11px] text-[var(--color-muted)] tabular-nums">
                                {formatCurrency(p, state.currency, state.language)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedModalVariant(item.variants?.[0] || '');
                              setActiveCommercialModal(item);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--color-control-muted)] text-[var(--color-text)] shrink-0"
                          >
                            {lang === 'en' ? 'View' : 'التفاصيل'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3 Daily Parenting Notifications Preview */}
                <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[var(--color-text)]">
                      {lang === 'en' ? '3 Daily Parent Notifications' : 'إشعارات اليوم الثلاثة للوالدين'}
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateTo('notifications')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] whitespace-nowrap"
                    >
                      {lang === 'en' ? 'Open Center' : 'المركز الكامل'}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {activeParentNotifications.slice(0, 2).map((notif) => (
                      <div
                        key={notif.id}
                        className="rounded-xl border border-[var(--color-border)] p-2.5 text-xs space-y-0.5"
                      >
                        <div className="font-bold text-[var(--color-text)] truncate">
                          {lang === 'en' ? notif.titleEn : notif.titleAr}
                        </div>
                        <div className="text-[11px] text-[var(--color-muted)] line-clamp-2">
                          {lang === 'en' ? notif.bodyEn : notif.bodyAr}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Google Drive Family Vault & Cloud Backup */}
              <GoogleDriveSection
                state={state}
                language={state.language}
                onRestoreFromDrive={(restoredState) => setState(restoredState)}
                onShowToast={showToast}
              />
            </section>
          )}

          {/* ================================================================
              PAGE 2: CHILDREN PROFILES & 3D IDENTITY (إدارة الأطفال 3D)
              ================================================================ */}
          {activePage === 'children' && (
            <section className="space-y-5" aria-label="ملفات الأطفال">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ThreeDIcon id="children" size={38} />
                  <div>
                    <h2 className="text-xl font-bold text-[var(--color-text)]">
                      {lang === 'en'
                        ? '3D Child Profiles, Real Photo Preservation & Growth (0–8 Yrs)'
                        : 'ملفات الأطفال والهوية ثلاثية الأبعاد ومتابعة النمو (من أول يوم لحد 8 سنين)'}
                    </h2>
                    <p className="text-sm text-[var(--color-muted)]">
                      {lang === 'en'
                        ? 'Each child has a custom 3D character avatar (or preserved uploaded photograph), stage guidance, and private health records.'
                        : 'لكل طفل شخصية ثلاثية الأبعاد مخصصة لعمره واهتماماته (مع الحفاظ على صورته الحقيقية عند رفعها) وسجل صحي خاص بالوالدين.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openAddChild}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap shrink-0"
                >
                  {lang === 'en' ? '+ Add Child Profile' : '+ إضافة طفل'}
                </button>
              </div>

              {state.kids.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted)]">
                  لا توجد ملفات أطفال حاليًا. اضغط على «إضافة طفل» لإنشاء الملف الأول.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {state.kids.map((kid) => {
                    const ageInfo = calculateChildAge(kid.birth, state.language);
                    const kidTasksCount = state.tasks.filter((tItem) => Number(tItem.kidId) === kid.id).length;
                    const kidEventsCount = state.events.filter((ev) => Number(ev.childId) === kid.id).length;
                    const kidWishesCount = state.wishes.filter((w) => Number(w.kid) === kid.id).length;
                    const themeObj =
                      AVATAR_ACCESSORY_THEMES.find((th) => th.id === kid.avatarTheme) ||
                      AVATAR_ACCESSORY_THEMES[0];

                    return (
                      <div
                        key={kid.id}
                        className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <ThreeDChildAvatar
                              name={kid.name}
                              gender={kid.gender}
                              stageCode={ageInfo.stageCode}
                              accessoryTheme={kid.avatarTheme || 'astronaut'}
                              photoDataUrl={kid.photoDataUrl}
                              useIllustratedAvatar={kid.useIllustratedAvatar}
                              size="lg"
                            />
                            <div>
                              <h3 className="text-lg font-extrabold text-[var(--color-text)]">
                                {kid.name}
                              </h3>
                              <div className="text-xs text-[var(--color-muted)] tabular-nums">
                                {ageInfo.label} · {kid.gender === 'girl' ? 'بنت — روز' : 'ولد — أكوا'}
                                {kid.birth ? ` · الميلاد: ${kid.birth}` : ''}
                              </div>
                              <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[var(--color-control-muted)] text-[var(--color-text)]">
                                <span>✨</span>
                                <span>
                                  {kid.photoDataUrl && !kid.useIllustratedAvatar
                                    ? lang === 'en'
                                      ? 'Real Uploaded Photo Active'
                                      : 'صورة الطفل الحقيقية مفعّلة'
                                    : lang === 'en'
                                    ? themeObj.labelEn
                                    : themeObj.labelAr}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Age Stage & Developmental Guidance */}
                        <div className="rounded-xl bg-[var(--color-control-muted)] p-3.5 space-y-1">
                          <div className="text-xs font-bold text-[var(--color-text)]">
                            📈 {ageInfo.stageTitle}
                          </div>
                          <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                            {ageInfo.milestoneTip}
                          </p>
                        </div>

                        {/* Details & Private Health Record */}
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <strong className="text-[var(--color-text)]">الاهتمامات والمهارات: </strong>
                            <span className="text-[var(--color-muted)]">
                              {kid.interests || 'لم تحدد بعد'}
                            </span>
                          </div>
                          {(kid.growthHeightCm || kid.growthWeightKg) && (
                            <div className="tabular-nums">
                              <strong className="text-[var(--color-text)]">قياسات النمو: </strong>
                              <span className="text-[var(--color-muted)]">
                                {kid.growthHeightCm ? `الطول: ${kid.growthHeightCm} سم` : ''}
                                {kid.growthHeightCm && kid.growthWeightKg ? ' · ' : ''}
                                {kid.growthWeightKg ? `الوزن: ${kid.growthWeightKg} كجم` : ''}
                              </span>
                            </div>
                          )}
                          <div className="pt-1 text-[var(--color-muted)] tabular-nums">
                            المهام المرتبطة: {kidTasksCount} · المواعيد: {kidEventsCount} · الأمنيات: {kidWishesCount}
                          </div>
                        </div>

                        {/* Private Health Section */}
                        <div className="rounded-xl border border-[var(--color-border)] p-3 text-xs space-y-1">
                          <div className="font-bold text-[var(--color-text)]">
                            🔒 السجل الصحي والتطعيمات (خاص بالوالدين افتراضيًا)
                          </div>
                          <div className="text-[var(--color-muted)]">
                            التطعيمات: {kid.vaccinationsNote || 'لم تسجل ملاحظات تطعيم بعد'}
                          </div>
                          {kid.healthNotePrivate && (
                            <div className="text-[var(--color-muted)]">
                              ملاحظات صحية: {kid.healthNotePrivate}
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-[var(--color-border)] flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditChild(kid)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                          >
                            {lang === 'en' ? 'Edit 3D Profile / Photo' : 'تعديل الملف والهوية 3D'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteChildId(kid.id)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-red-700"
                          >
                            {lang === 'en' ? 'Delete Profile' : 'حذف الملف'}
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
            <section className="space-y-5" aria-label="الروتين اليومي">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    الروتين اليومي والأسبوعي للأسرة
                  </h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    نظّم مهام اليوم والأسبوع والشهر لكل طفل أو للأسرة بالكامل، وعلّم على المهمة بعد إنجازها.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetTasks}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] whitespace-nowrap"
                  >
                    إعادة ضبط الإنجاز
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTask(null);
                      setTaskModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap"
                  >
                    + إضافة مهمة
                  </button>
                </div>
              </div>

              {/* Smart Routine Reminders Summary & Alert Bar */}
              <div
                className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-3.5"
                aria-label="تذكيرات الروتين اليومي"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <ThreeDIcon id="routine" size={36} />
                    <div>
                      <h3 className="text-sm font-extrabold text-[var(--color-text)]">
                        تذكيرات المواعيد والمهام اليومية
                      </h3>
                      <p className="text-xs text-[var(--color-muted)]">
                        تنبيه بصري فوري للمهام التي اقترب موعدها أو تجاوزت وقتها المحدد لليوم.
                      </p>
                    </div>
                  </div>

                  {/* Quick Reminder Status Filter Pills */}
                  <div
                    className="flex flex-wrap items-center gap-1.5"
                    role="group"
                    aria-label="تصفية حسب حالة التذكير"
                  >
                    <button
                      type="button"
                      onClick={() => setRoutineReminderFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        routineReminderFilter === 'all'
                          ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] border-transparent'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                      }`}
                    >
                      الكل ({state.tasks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutineReminderFilter('overdue')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors tabular-nums ${
                        routineReminderFilter === 'overdue'
                          ? 'bg-red-700 text-white border-red-700'
                          : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      ⏰ تجاوزت الموعد ({routineRemindersSummary.overdueCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoutineReminderFilter('approaching')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors tabular-nums ${
                        routineReminderFilter === 'approaching'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      }`}
                    >
                      🔔 اقترب موعدها ({routineRemindersSummary.approachingCount})
                    </button>
                  </div>
                </div>

                {/* Reminder Configuration Row (Lead Window + Time-of-Day Preview) */}
                <div className="pt-2.5 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="routineLeadWindow" className="text-[var(--color-muted)] font-semibold">
                      التنبيه قبل الموعد بـ:
                    </label>
                    <select
                      id="routineLeadWindow"
                      value={routineApproachingWindow}
                      onChange={(e) => setRoutineApproachingWindow(Number(e.target.value))}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)]"
                    >
                      <option value={30}>30 دقيقة</option>
                      <option value={60}>60 دقيقة (ساعة)</option>
                      <option value={90}>90 دقيقة (ساعة ونصف)</option>
                      <option value={120}>120 دقيقة (ساعتين)</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="routineRefTime" className="text-[var(--color-muted)] font-semibold">
                      الوقت المرجعي لحساب التذكيرات:
                    </label>
                    <select
                      id="routineRefTime"
                      value={routineRefTimePreset}
                      onChange={(e) => setRoutineRefTimePreset(e.target.value)}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)]"
                    >
                      <option value="live">الوقت الحالي تلقائيًا</option>
                      <option value="07:15">صباحًا (07:15 ص)</option>
                      <option value="15:45">عصرًا (03:45 م)</option>
                      <option value="18:20">مساءً (06:20 م)</option>
                      <option value="20:30">ليلًا (08:30 م)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                {/* Day / Week / Month Tabs */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-xl" role="tablist" aria-label="نطاق تكرار الروتين">
                    {[
                      { id: 'all', label: 'كل الفترات' },
                      { id: 'daily', label: 'اليوم' },
                      { id: 'weekly', label: 'الأسبوع' },
                      { id: 'monthly', label: 'الشهر' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setRoutineCadenceFilter(tab.id as typeof routineCadenceFilter)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                          routineCadenceFilter === tab.id
                            ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-[var(--color-muted)] tabular-nums">
                    مكتمل: {completedTasksCount} من {state.tasks.length} · تذكيرات نشطة: {routineRemindersSummary.totalAlerts}
                  </div>
                </div>

                {/* Child & Status Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="routineKidFilter" className="block text-xs text-[var(--color-muted)] mb-1">
                      عرض مهام
                    </label>
                    <select
                      id="routineKidFilter"
                      value={routineKidFilter}
                      onChange={(e) => setRoutineKidFilter(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    >
                      <option value="all">كل الأطفال والأسرة</option>
                      {state.kids.map((k) => (
                        <option key={k.id} value={String(k.id)}>
                          {k.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="routineStatusFilter" className="block text-xs text-[var(--color-muted)] mb-1">
                      حالة المهمة
                    </label>
                    <select
                      id="routineStatusFilter"
                      value={routineStatusFilter}
                      onChange={(e) => setRoutineStatusFilter(e.target.value as 'all' | 'open' | 'done')}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    >
                      <option value="all">كل الحالات</option>
                      <option value="open">غير مكتملة</option>
                      <option value="done">مكتملة</option>
                    </select>
                  </div>
                </div>

                {/* Tasks List with Visual Reminder Badges */}
                {filteredTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted)]">
                    لا توجد مهام مطابقة للتصفية الحالية. جرّب اختيارًا آخر أو أضف مهمة جديدة.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
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
                          className={`py-3.5 px-3 -mx-3 rounded-xl flex flex-wrap items-center justify-between gap-3 transition-colors ${
                            reminder.status === 'overdue'
                              ? 'bg-red-50/40'
                              : reminder.status === 'approaching'
                              ? 'bg-amber-50/40'
                              : ''
                          }`}
                        >
                          <label className="flex items-start sm:items-center gap-3 min-w-0 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                              className="w-4 h-4 mt-1 sm:mt-0 accent-[var(--color-task-accent)] shrink-0"
                            />
                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`text-sm font-bold ${
                                    task.done
                                      ? 'line-through text-[var(--color-muted)]'
                                      : 'text-[var(--color-text)]'
                                  }`}
                                >
                                  {task.name}
                                </span>
                                {renderReminderBadge(reminder)}
                              </div>
                              <span className="text-xs text-[var(--color-muted)] block">
                                {assignedKid ? assignedKid.name : 'مهمة أسرية'} · {task.category} · المسؤول: {task.owner} ·{' '}
                                {task.cadence === 'weekly'
                                  ? 'أسبوعي'
                                  : task.cadence === 'monthly'
                                  ? 'شهري'
                                  : 'يومي'}
                              </span>
                            </div>
                          </label>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-semibold text-[var(--color-muted)] tabular-nums px-2 py-1 rounded-lg bg-[var(--color-control-muted)]">
                              ⏰ {task.time || 'بدون وقت'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTask(task);
                                setTaskModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              aria-label={`حذف المهمة ${task.name}`}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-red-700"
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
            <section className="space-y-5" aria-label="التقويم الأسري">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    التقويم الأسري والمواعيد (يدعم الميلادي والهجري)
                  </h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    نظّموا المواعيد العائلية والتطعيمات والأنشطة. التكرار والتذكير هنا وصف محلي داخل التطبيق فقط.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setEventModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap shrink-0"
                >
                  + إضافة حدث
                </button>
              </div>

              <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                  <div className="text-xs text-[var(--color-muted)] tabular-nums">
                    <strong className="text-[var(--color-text)]">تاريخ اليوم: </strong>
                    {todayFormatted.gregorian}
                    {todayFormatted.hijri ? ` · ${todayFormatted.hijri}` : ''}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-xl" role="group" aria-label="نظام عرض التاريخ">
                    {[
                      { id: 'both', label: 'الميلادي والهجري' },
                      { id: 'gregorian', label: 'الميلادي' },
                      { id: 'hijri', label: 'الهجري' },
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
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="eventFrom" className="block text-xs text-[var(--color-muted)] mb-1">
                      عرض الأحداث من تاريخ
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
                    <label htmlFor="eventTo" className="block text-xs text-[var(--color-muted)] mb-1">
                      إلى تاريخ
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

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetEventRange(0)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  >
                    اليوم
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetEventRange(7)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  >
                    الأيام السبعة القادمة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEventFrom('');
                      setEventTo('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                  >
                    كل الأحداث
                  </button>
                </div>

                {/* Events List */}
                {isEventRangeReversed ? (
                  <div className="rounded-xl border border-dashed border-amber-400 bg-amber-50 p-5 text-center text-xs text-amber-900" role="status">
                    تاريخ البداية بعد تاريخ النهاية. عدّل نطاق التاريخ لعرض الأحداث.
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted)]">
                    لا توجد أحداث في هذه الفترة. أضف حدثًا جديدًا أو غيّر نطاق التاريخ.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
                    {filteredEvents.map((ev) => {
                      const assignedKid = ev.childId ? kidMap[String(ev.childId)] : null;
                      const formattedDate = formatGregorianAndHijri(
                        ev.date,
                        state.country,
                        state.language,
                        state.calendarMode
                      );
                      return (
                        <div
                          key={ev.id}
                          className="py-3.5 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                              style={{ background: 'var(--color-notice)' }}
                              aria-hidden="true"
                            >
                              {ev.type === 'موعد طبي' || ev.type === 'تطعيم'
                                ? '🩺'
                                : ev.type === 'عيد ميلاد'
                                ? '🎂'
                                : '📅'}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="font-bold text-sm text-[var(--color-text)]">
                                {ev.title}
                              </div>
                              <div className="text-xs text-[var(--color-muted)] tabular-nums">
                                {formattedDate.combined}
                                {ev.time ? ` · الساعة ${ev.time}` : ''} · {ev.type}
                              </div>
                              <div className="text-xs text-[var(--color-muted)]">
                                {assignedKid ? `الطفل: ${assignedKid.name}` : 'الأسرة كلها'}
                                {ev.repeat && ev.repeat !== 'none'
                                  ? ` · يتكرر (${
                                      ev.repeat === 'weekly'
                                        ? 'أسبوعيًا - تسجيل وصفي'
                                        : ev.repeat === 'monthly'
                                        ? 'شهريًا - تسجيل وصفي'
                                        : 'سنويًا - تسجيل وصفي'
                                    })`
                                  : ''}
                              </div>
                              {ev.note && (
                                <div className="text-xs text-[var(--color-muted)] pt-0.5">
                                  ملاحظة: {ev.note}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEvent(ev);
                                setEventModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev.id)}
                              aria-label={`حذف الحدث ${ev.title}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-red-700"
                            >
                              حذف
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
            <section className="space-y-5" aria-label="الأمنيات والهدايا">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-text)]">
                    أمنيات الأطفال وأهداف الادخار العائلي 🎁
                  </h2>
                  <p className="text-sm text-[var(--color-muted)]">
                    سجّل أمنيات أطفالك واربطها بخطط واقعية ونسبة إنجاز، أو شاركها مع العائلة للإهداء.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!state.kids.length) {
                      showToast('أضف ملف طفل أولًا');
                      return;
                    }
                    setEditingWish(null);
                    setWishModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap shrink-0"
                >
                  + إضافة أمنية
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-[var(--color-control-muted)] p-1 rounded-xl w-max max-w-full">
                <button
                  type="button"
                  onClick={() => setWishKidTab('all')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    wishKidTab === 'all'
                      ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                      : 'text-[var(--color-muted)]'
                  }`}
                >
                  كل الأطفال ({state.wishes.length})
                </button>
                {state.kids.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setWishKidTab(String(k.id))}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      wishKidTab === String(k.id)
                        ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-xs'
                        : 'text-[var(--color-muted)]'
                    }`}
                  >
                    {k.emoji} {k.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <h3 className="text-base font-bold text-[var(--color-text)]">قائمة الأمنيات والأهداف</h3>
                  {filteredWishes.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-muted)]">
                      قائمة الأمنيات فارغة لهذا الاختيار.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {filteredWishes.map((w) => {
                        const kidObj = kidMap[String(w.kid)];
                        const prog = w.progress ?? (w.reserved ? 100 : 40);
                        return (
                          <div key={w.id} className="py-4 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                                  style={{ background: 'var(--color-icon-tint)' }}
                                  aria-hidden="true"
                                >
                                  {w.emoji || '🎁'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-[var(--color-text)]">
                                    {w.name}
                                  </div>
                                  <div className="text-xs text-[var(--color-muted)] tabular-nums">
                                    {kidObj ? kidObj.name : 'الأسرة'} ·{' '}
                                    {formatCurrency(w.price, w.currency || state.currency, state.language)} ·{' '}
                                    {w.reserved ? 'محجوزة للإهداء ✅' : 'متاحة للإهداء'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateWishProgress(w.id, 15)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] tabular-nums"
                                >
                                  +15%
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleWishReserve(w.id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
                                >
                                  {w.reserved ? 'إلغاء الحجز' : 'حجز كهدية'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingWish(w);
                                    setWishModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteWish(w.id)}
                                  aria-label={`حذف الأمنية ${w.name}`}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-red-700"
                                >
                                  ×
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] tabular-nums">
                                <span>{w.goalType || 'خطة تحقيق الأمنية'}</span>
                                <span className="font-bold text-[var(--color-text)]">{prog}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-[var(--color-control-muted)] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-200"
                                  style={{
                                    width: `${prog}%`,
                                    backgroundColor: 'var(--color-accent)',
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Gift Ideas */}
                <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                  <h3 className="text-base font-bold text-[var(--color-text)]">أفكار هدايا سريعة</h3>
                  <div className="space-y-3">
                    {[
                      { emoji: '📚', title: 'مجموعة قصص مصورة', egp: 120, sar: 35 },
                      { emoji: '🧩', title: 'لعبة تركيب خشبية', egp: 280, sar: 75 },
                      { emoji: '🎨', title: 'حقيبة ألوان مائية آمنة', egp: 150, sar: 42 },
                    ].map((idea) => {
                      const p = state.currency === 'SAR' ? idea.sar : idea.egp;
                      return (
                        <div
                          key={idea.title}
                          className="rounded-xl border border-[var(--color-border)] p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl" aria-hidden="true">{idea.emoji}</span>
                            <div>
                              <div className="text-sm font-bold text-[var(--color-text)]">
                                {idea.title}
                              </div>
                              <div className="text-xs text-[var(--color-muted)] tabular-nums">
                                {formatCurrency(p, state.currency, state.language)} تقريبًا
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickAddWish(idea.title, idea.egp, idea.sar, idea.emoji)
                            }
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)] whitespace-nowrap"
                          >
                            + أضف
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
          {activePage === 'medical' && (
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
          )}

          {/* ================================================================
              PAGE 6B: MEDIA, VIDEOS & VERTICAL REELS 9:16 HUB (الميديا والريلز)
              ================================================================ */}
          {activePage === 'media' && (
            <MediaPlatformSection
              savedMediaIds={state.savedMediaIds}
              language={state.language}
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
          {activePage === 'community' && (
            <ParentsCommunitySection
              parentName={state.parentName}
              city={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
              language={state.language}
              onShowToast={showToast}
            />
          )}

          {/* ================================================================
              PAGE 6D: INTERNAL CHAT & MESSAGING (المحادثات الداخلية)
              ================================================================ */}
          {activePage === 'chat' && (
            <InternalChatSection
              language={state.language}
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
          {activePage === 'services' && (
            <CommercialEcosystemSection
              country={state.country}
              city={state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
              currency={state.currency}
              language={state.language}
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
            />
          )}

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
            />
          )}

          {/* ================================================================
              PAGE 12: SETTINGS, DATA PORTABILITY & BOTTOM INTERNATIONAL SETTINGS
              ================================================================ */}
          {activePage === 'settings' && (
            <section className="space-y-6" aria-label="الإعدادات">
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text)]">
                  {lang === 'en'
                    ? 'Settings, 3D Visual System, Data Portability & International Controls'
                    : 'الإعدادات، الهوية البصرية 3D، النسخ الاحتياطي، وإعدادات الدولة والعملة'}
                </h2>
                <p className="text-sm text-[var(--color-muted)]">
                  {lang === 'en'
                    ? 'Customize Mother/Father theme, calendar display, JSON backups, and verify country/currency/phone at the bottom of this page.'
                    : 'خصّص تجربة الأم أو الأب، التقويم، النسخ الاحتياطي الآمن، وإعدادات الدولة والعملة والهاتف الموثق في أسفل الصفحة.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Experience & Interface Preferences */}
                <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <h3 className="text-base font-bold text-[var(--color-text)]">
                    {lang === 'en' ? 'Experience, Theme & Calendar Display' : 'تخصيص التجربة والسمة البصرية والتقويم'}
                  </h3>

                  <div>
                    <label htmlFor="parentName" className="block text-xs text-[var(--color-muted)] mb-1">
                      {lang === 'en' ? 'Parent / Family Display Name' : 'اسم ولي الأمر / الأسرة'}
                    </label>
                    <input
                      id="parentName"
                      type="text"
                      maxLength={80}
                      value={settingsParentName}
                      onChange={(e) => setSettingsParentName(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    />
                  </div>

                  <div>
                    <label htmlFor="parentRole" className="block text-xs text-[var(--color-muted)] mb-1">
                      {lang === 'en' ? 'Visual Theme & Parent Mode' : 'نوع التجربة والسمة البصرية'}
                    </label>
                    <select
                      id="parentRole"
                      value={settingsRole}
                      onChange={(e) => setSettingsRole(e.target.value as ParentThemeRole)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                      <label htmlFor="settingsLanguage" className="block text-xs text-[var(--color-muted)] mb-1">
                        {lang === 'en' ? 'Interface Language' : 'لغة الواجهة (Interface Language)'}
                      </label>
                      <select
                        id="settingsLanguage"
                        value={settingsLanguage}
                        onChange={(e) => setSettingsLanguage(e.target.value as LanguageCode)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                      >
                        <option value="ar">{t(lang, 'langAr')}</option>
                        <option value="en">{t(lang, 'langEn')}</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="settingsCalendarMode" className="block text-xs text-[var(--color-muted)] mb-1">
                        {lang === 'en' ? 'Calendar Date Display' : 'نظام عرض التاريخ'}
                      </label>
                      <select
                        id="settingsCalendarMode"
                        value={settingsCalendarMode}
                        onChange={(e) => setSettingsCalendarMode(e.target.value as CalendarDisplayMode)}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                      >
                        <option value="both">{t(lang, 'calendarBoth')}</option>
                        <option value="gregorian">{t(lang, 'calendarGregorian')}</option>
                        <option value="hijri">{t(lang, 'calendarHijri')}</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveGeneralSettings}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  >
                    {lang === 'en' ? 'Save Experience Preferences' : 'حفظ تفضيلات التجربة واللغة'}
                  </button>
                </div>

                {/* 2. Data Backup, Restore & Standalone Prototype Files */}
                <div className="space-y-4">
                  <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                    <h3 className="text-base font-bold text-[var(--color-text)]">
                      {lang === 'en' ? 'JSON Data Backup & Restore' : 'النسخ الاحتياطي واستيراد البيانات (JSON)'}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                      {lang === 'en'
                        ? 'Your data is stored locally in this browser (`family-space-v1`). Export a JSON backup or restore a previous backup with automatic relational integrity checks.'
                        : 'بياناتك محفوظة محليًا على هذا المتصفح (`family-space-v1`). يمكنك تصدير نسخة احتياطية بصيغة JSON أو استيراد نسخة سابقة مع التحقق الآلي من سلامة الروابط.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                      >
                        {lang === 'en' ? '📥 Export JSON Backup' : '📥 تصدير نسخة JSON'}
                      </button>

                      <label className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] cursor-pointer">
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
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-800"
                      >
                        {lang === 'en' ? 'Reset Demo Data' : 'مسح وإعادة ضبط البيانات'}
                      </button>
                    </div>

                    <div className="pt-3 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2">
                      <a
                        href="/prototype/index.html"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
                      >
                        {lang === 'en' ? 'Open Standalone prototype/index.html' : 'فتح prototype/index.html المستقل'}
                      </a>
                      <a
                        href="/Family_Space_Project_Updated.zip"
                        download="Family_Space_Project_Updated.zip"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-accent-soft)] text-[var(--color-role-text)]"
                      >
                        {lang === 'en' ? 'Download Updated Project Package (ZIP)' : 'تنزيل حزمة المشروع المحدثة (ZIP)'}
                      </a>
                    </div>
                  </div>

                  {/* 3D Asset Manifest Registry */}
                  <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
                    <div className="text-xs font-extrabold text-[var(--color-text)]">
                      {lang === 'en'
                        ? `🎨 3D Asset Manifest (${THREE_D_ASSET_MANIFEST.length} Asset Groups)`
                        : `🎨 سجل الأصول ثلاثية الأبعاد (3D Asset Manifest — ${THREE_D_ASSET_MANIFEST.length} مجموعات)`}
                    </div>
                    <div className="space-y-1 text-[11px] text-[var(--color-muted)]">
                      {THREE_D_ASSET_MANIFEST.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--color-text)]">
                            {lang === 'en' ? entry.titleEn : entry.titleAr}
                          </span>
                          <span className="text-emerald-800 font-bold">{entry.renderEngine}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Drive Cloud Backup & Family Document Vault */}
              <GoogleDriveSection
                state={state}
                language={state.language}
                onRestoreFromDrive={(restoredState) => setState(restoredState)}
                onShowToast={showToast}
              />

              {/* ==============================================================
                  BOTTOM OF SETTINGS PAGE: COUNTRY, CURRENCY & VERIFIED PHONE
                  (Requirement 11.B: Placed at the bottom of the Settings page)
                  ============================================================== */}
              <div
                id="settings-international-bottom"
                className="rounded-[20px] border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-[var(--color-text)]">
                      {lang === 'en'
                        ? '🌍 Country, Calling Code, Currency & Verified Phone Settings'
                        : '🌍 إعدادات الدولة، مفتاح الهاتف الدولي، العملة، وتوثيق الجوال (أسفل صفحة الإعدادات)'}
                    </h3>
                    <p className="text-xs text-[var(--color-muted)]">
                      {lang === 'en'
                        ? 'Changing your country or verified phone number requires OTP verification (Demo code: 123456) and updates local pricing & phone validation rules.'
                        : 'تغيير الدولة أو رقم الهاتف الموثق يتطلب التحقق برمز OTP (الرمز التجريبي: 123456) ويحدّث العملة وقواعد التحقق من الأرقام.'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-[var(--color-control-muted)] text-xs font-bold text-[var(--color-text)] tabular-nums">
                    {state.country === 'SA' ? '🇸🇦 +966 · SAR' : '🇪🇬 +20 · EGP'} · 📍 {state.city || (state.country === 'SA' ? 'الرياض' : 'القاهرة')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="settingsCountry" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                      {lang === 'en' ? 'Country & Calling Code' : 'الدولة ومفتاح الاتصال الدولي'}
                    </label>
                    <select
                      id="settingsCountry"
                      value={settingsCountry}
                      onChange={(e) => handleCountryChangeInSettings(e.target.value as CountryCode)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    >
                      <option value="EG">🇪🇬 {t(lang, 'countryEG')} (+20)</option>
                      <option value="SA">🇸🇦 {t(lang, 'countrySA')} (+966)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="settingsCity" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                      {lang === 'en' ? 'City / Governorate' : 'المدينة / المحافظة التابعة للدولة'}
                    </label>
                    <select
                      id="settingsCity"
                      value={settingsCity}
                      onChange={(e) => setSettingsCity(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    >
                      {(COUNTRY_CITIES_MAP[settingsCountry] || []).map((cItem) => (
                        <option key={cItem.id} value={cItem.id}>
                          {lang === 'en' ? `${cItem.nameEn} (${cItem.regionEn})` : `${cItem.nameAr} (${cItem.regionAr})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="settingsCurrency" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                      {lang === 'en' ? 'Display Currency' : 'العملة المعتمدة للأسعار والمنتجات'}
                    </label>
                    <select
                      id="settingsCurrency"
                      value={settingsCurrency}
                      onChange={(e) => {
                        setSettingsCurrency(e.target.value as CurrencyCode);
                        setCurrencySuggestionBanner(null);
                      }}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                    >
                      <option value="EGP">{t(lang, 'currencyEGP')}</option>
                      <option value="SAR">{t(lang, 'currencySAR')}</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="settingsPhoneInput" className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                      {lang === 'en'
                        ? `Verified Parent Phone (${settingsCountry === 'SA' ? '+966' : '+20'})`
                        : `رقم هاتف الحساب الموثق (${settingsCountry === 'SA' ? '+966' : '+20'})`}
                    </label>
                    <input
                      id="settingsPhoneInput"
                      type="tel"
                      dir="ltr"
                      value={settingsPhoneInput}
                      onChange={(e) => setSettingsPhoneInput(e.target.value)}
                      placeholder={settingsCountry === 'SA' ? '512345678' : '1012345678'}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm tabular-nums"
                    />
                  </div>
                </div>

                {/* Suggested Currency Banner when Country switches */}
                {currencySuggestionBanner && (
                  <div className="rounded-xl bg-[var(--color-notice)] text-[var(--color-notice-text)] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span>
                      اخترت {settingsCountry === 'SA' ? 'السعودية' : 'مصر'}. هل ترغب في التبديل إلى العملة المقترحة ({currencySuggestionBanner})؟
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsCurrency(currencySuggestionBanner);
                        setCurrencySuggestionBanner(null);
                      }}
                      className="px-3 py-1 rounded-lg font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)] whitespace-nowrap"
                    >
                      نعم، اعتمد {currencySuggestionBanner}
                    </button>
                  </div>
                )}

                {settingsOtpStep && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-amber-950 font-semibold">
                      {lang === 'en'
                        ? `🔐 Security Check: Enter simulated OTP code (${DEMO_OTP_CODE}) to confirm phone/country update:`
                        : `🔐 تأكيد أمني: أدخل رمز التحقق OTP التجريبي (${DEMO_OTP_CODE}) لتأكيد تغيير الدولة أو رقم الهاتف:`}
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={settingsOtpCode}
                      onChange={(e) => setSettingsOtpCode(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-28 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-center font-bold tabular-nums"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-xs text-[var(--color-muted)]">
                    {lang === 'en'
                      ? 'Format validation enforces Egyptian (+20 10/11/12/15) or Saudi (+966 5XXXXXXXX) mobile standards.'
                      : 'يتم التحقق تلقائيًا من صيغة الهاتف المصري (+20) أو الجوال السعودي (+966) قبل الحفظ.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveBottomInternationalAndPhone}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
                  >
                    {settingsOtpStep
                      ? lang === 'en'
                        ? 'Verify OTP & Save International Settings'
                        : 'تأكيد رمز OTP وحفظ الدولة والمدينة والهاتف'
                      : lang === 'en'
                      ? 'Save Country, City, Currency & Phone'
                      : 'حفظ إعدادات الدولة والمدينة والعملة والهاتف'}
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-nav-bg)] px-1 py-1.5 grid grid-cols-7 gap-0.5"
        aria-label="التنقل السفلي للموبايل"
      >
        {(['home', 'medical', 'media', 'community', 'chat', 'services', 'settings'] as PageId[]).map(
          (pid) => {
            const item = navItems.find((n) => n.id === pid)!;
            const active = activePage === pid;
            return (
              <button
                key={pid}
                type="button"
                onClick={() => navigateTo(pid)}
                className={`px-0.5 py-1 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold truncate ${
                  active
                    ? 'bg-[var(--color-accent-soft)] text-[var(--color-text)] font-bold'
                    : 'text-[var(--color-muted)]'
                }`}
              >
                <ThreeDIcon id={item.iconId} size={18} />
                <span className="truncate max-w-full">{item.shortLabel}</span>
              </button>
            );
          }
        )}
      </nav>

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

      {/* 8. Role / Experience Theme Modal */}
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
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="roleModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                اختار شكل التجربة والسمة البصرية
              </h2>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    role: 'mom',
                    activeParentAccount: 'mother',
                    parentName: 'ماما (سارة)',
                  }));
                  setRoleModalOpen(false);
                  showToast('تم تفعيل تجربة الأم — روز');
                }}
                className="p-3.5 rounded-xl border border-[#e8bfd2] bg-[#fbedf3] text-[#9d446b] font-bold text-sm text-start"
              >
                👩🏻‍🍼 تجربة الأم — سمة الروز الدافئ (حساب ماما سارة)
              </button>
              <button
                type="button"
                onClick={() => {
                  setState((prev) => ({
                    ...prev,
                    role: 'dad',
                    activeParentAccount: 'father',
                    parentName: 'بابا (أحمد)',
                  }));
                  setRoleModalOpen(false);
                  showToast('تم تفعيل تجربة الأب — أكوا');
                }}
                className="p-3.5 rounded-xl border border-[#a9dce2] bg-[#e6f6f8] text-[#1b626e] font-bold text-sm text-start"
              >
                👨🏻‍🍼 تجربة الأب — سمة الأكوا الهادئ (حساب بابا أحمد)
              </button>
              <button
                type="button"
                onClick={() => {
                  setState((prev) => ({ ...prev, role: 'high-contrast' }));
                  setRoleModalOpen(false);
                  showToast('تم تفعيل وضع التباين العالي');
                }}
                className="p-3.5 rounded-xl border border-neutral-600 bg-white text-neutral-900 font-bold text-sm text-start"
              >
                👁️ وضع التباين العالي (High Contrast Accessibility)
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
                  {activeCommercialModal.categoryLabel} · {activeCommercialModal.city}
                </div>
                <h2 id="commercialModalTitle" className="text-xl font-bold text-[var(--color-text)] mt-1">
                  {activeCommercialModal.emoji} {lang === 'en' ? activeCommercialModal.nameEn : activeCommercialModal.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveCommercialModal(null)}
                aria-label="إغلاق"
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
                      {v}
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
                <strong>السعر في مصر: </strong>
                {formatCurrency(activeCommercialModal.priceEGP, 'EGP', state.language)}
              </div>
              <div>
                <strong>السعر في السعودية: </strong>
                {formatCurrency(activeCommercialModal.priceSAR, 'SAR', state.language)}
              </div>
              {activeCommercialModal.sellerName && (
                <div>
                  <strong>مقدم الخدمة / البائع: </strong>
                  {activeCommercialModal.sellerName}
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
                إغلاق
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

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 lg:bottom-6 left-4 right-4 mx-auto max-w-md z-50 rounded-xl bg-[var(--color-toast)] text-white px-4 py-3 text-xs font-semibold shadow-lg text-center"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
