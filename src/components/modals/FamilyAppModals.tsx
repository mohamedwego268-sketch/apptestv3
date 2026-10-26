import React from 'react';
import {
  FamilySpaceState,
  ChildProfile,
  RoutineTask,
  CalendarEvent,
  WishItem,
  FamilyMember,
  MediaContentItem,
  CommercialCatalogItem,
  COUNTRY_CITIES_MAP,
  formatCurrency,
  locText,
} from '../../domain/familySpaceCore';
import { AVATAR_ACCESSORY_THEMES } from '../../domain/assetManifest3D';
import { SoftFilledIcon, UnifiedBadge } from '../DesignSystem';

export interface FamilyAppModalsProps {
  state: FamilySpaceState;
  todayISO: string;
  todayFormattedCombined: string;
  cartItemCount: number;
  // 1. Child Modal
  childModalOpen: boolean;
  editingChild: ChildProfile | null;
  childPhotoDraft: string | undefined;
  childUse3DAvatarDraft: boolean;
  onCloseChildModal: () => void;
  onSaveChild: (e: React.FormEvent<HTMLFormElement>) => void;
  onChildPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleChildUse3DAvatar: (use3D: boolean) => void;
  // 2. Delete Child Confirm Modal
  childToDelete: ChildProfile | null | undefined;
  childDeleteSummary: {
    relatedTasks: number;
    relatedEvents: number;
    relatedWishes: number;
    total: number;
  } | null;
  onCancelDeleteChild: () => void;
  onConfirmDeleteChild: () => void;
  // 3. Routine Task Modal
  taskModalOpen: boolean;
  editingTask: RoutineTask | null;
  onCloseTaskModal: () => void;
  onSaveTask: (e: React.FormEvent<HTMLFormElement>) => void;
  // 4. Calendar Event Modal
  eventModalOpen: boolean;
  editingEvent: CalendarEvent | null;
  onCloseEventModal: () => void;
  onSaveEvent: (e: React.FormEvent<HTMLFormElement>) => void;
  // 5. Wish Modal
  wishModalOpen: boolean;
  editingWish: WishItem | null;
  onCloseWishModal: () => void;
  onSaveWish: (e: React.FormEvent<HTMLFormElement>) => void;
  // 6. Family Member Modal
  personModalOpen: boolean;
  onClosePersonModal: () => void;
  onSavePerson: (e: React.FormEvent<HTMLFormElement>) => void;
  // 7. Granular Permissions Modal
  permModalMember: FamilyMember | null;
  onClosePermModal: () => void;
  onSaveMemberPermissions: (e: React.FormEvent<HTMLFormElement>) => void;
  // 8. Profile & Quick Controls Drawer
  roleModalOpen: boolean;
  onCloseRoleModal: () => void;
  onOpenOnboardingFromDrawer: () => void;
  onOpenCartFromDrawer: () => void;
  onSelectPreciseCity: (combinedValue: string) => void;
  onUseCurrentLocation: () => void;
  geoStatus?: 'idle' | 'locating' | 'active';
  onSelectParentProfile: (role: 'mom' | 'dad') => void;
  onEnableHighContrast: () => void;
  onToggleDarkMode: () => void;
  bedtimeMode?: boolean;
  onToggleBedtimeMode?: () => void;
  // 9. Media Reader Modal
  activeMediaModal: MediaContentItem | null;
  onCloseMediaModal: () => void;
  // 10. Commercial Item Detail Modal
  activeCommercialModal: CommercialCatalogItem | null;
  selectedModalVariant: string;
  onSelectModalVariant: (variant: string) => void;
  onCloseCommercialModal: () => void;
  onAddToCart: (item: CommercialCatalogItem, variant?: string) => void;
  onQuickAddWish: (name: string, priceEGP: number, priceSAR: number, emoji: string) => void;
  // 11. Confirm Reset Modal
  confirmResetModal: boolean;
  onCloseConfirmResetModal: () => void;
  onResetAllData: () => void;
}

export const FamilyAppModals: React.FC<FamilyAppModalsProps> = ({
  state,
  todayISO,
  todayFormattedCombined,
  cartItemCount,
  childModalOpen,
  editingChild,
  childPhotoDraft,
  childUse3DAvatarDraft,
  onCloseChildModal,
  onSaveChild,
  onChildPhotoUpload,
  onToggleChildUse3DAvatar,
  childToDelete,
  childDeleteSummary,
  onCancelDeleteChild,
  onConfirmDeleteChild,
  taskModalOpen,
  editingTask,
  onCloseTaskModal,
  onSaveTask,
  eventModalOpen,
  editingEvent,
  onCloseEventModal,
  onSaveEvent,
  wishModalOpen,
  editingWish,
  onCloseWishModal,
  onSaveWish,
  personModalOpen,
  onClosePersonModal,
  onSavePerson,
  permModalMember,
  onClosePermModal,
  onSaveMemberPermissions,
  roleModalOpen,
  onCloseRoleModal,
  onOpenOnboardingFromDrawer,
  onOpenCartFromDrawer,
  onSelectPreciseCity,
  onUseCurrentLocation,
  geoStatus = 'idle',
  onSelectParentProfile,
  onEnableHighContrast,
  onToggleDarkMode,
  bedtimeMode = false,
  onToggleBedtimeMode,
  activeMediaModal,
  onCloseMediaModal,
  activeCommercialModal,
  selectedModalVariant,
  onSelectModalVariant,
  onCloseCommercialModal,
  onAddToCart,
  onQuickAddWish,
  confirmResetModal,
  onCloseConfirmResetModal,
  onResetAllData,
}) => {
  const lang = state.language;
  const activeCountryList = COUNTRY_CITIES_MAP[state.country] || COUNTRY_CITIES_MAP.EG;
  const resolvedDrawerCityId =
    activeCountryList.find(
      (c) =>
        c.id === state.city ||
        (state.city && (c.id.includes(state.city) || state.city.includes(c.id)))
    )?.id || activeCountryList[0].id;

  return (
    <>
      {/* 1. Add / Edit Child Modal (With 3D Avatar Theme + Real Photo Preservation) */}
      {childModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseChildModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="childModalTitle"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4 border border-[var(--color-border)]"
          >
            <div className="flex items-center justify-between">
              <h2 id="childModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                {editingChild
                  ? `تعديل ملف ${editingChild.name}`
                  : 'إضافة ملف طفل جديد (هوية 3D أو صورة حقيقية)'}
              </h2>
              <button
                type="button"
                onClick={onCloseChildModal}
                aria-label="إغلاق النافذة"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold text-[var(--color-text)]"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSaveChild} className="space-y-3">
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  />
                </div>
              </div>

              {/* 3D Avatar Personality Theme & Real Photo Upload */}
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)] p-3.5 space-y-2.5">
                <div className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <SoftFilledIcon id="children" size={16} />
                  <span>الهوية البصرية للطفل (شخصية ثلاثية الأبعاد 3D أو صورة حقيقية محفوظة)</span>
                </div>

                <div>
                  <label htmlFor="kidAvatarThemeInput" className="block text-xs text-[var(--color-muted)] mb-1">
                    سمة الشخصية ثلاثية الأبعاد (3D Character Theme)
                  </label>
                  <select
                    id="kidAvatarThemeInput"
                    name="avatarTheme"
                    defaultValue={editingChild?.avatarTheme || 'astronaut'}
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)]"
                  >
                    {AVATAR_ACCESSORY_THEMES.map((th) => (
                      <option key={th.id} value={th.id}>
                        {th.labelAr} ({th.labelEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold cursor-pointer text-[var(--color-text)]">
                    رفع صورة حقيقية للطفل (تُحفظ محليًا)
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onChildPhotoUpload}
                      className="sr-only"
                    />
                  </label>

                  {childPhotoDraft && (
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer text-[var(--color-text)]">
                      <input
                        type="checkbox"
                        checked={!childUse3DAvatarDraft}
                        onChange={(e) => onToggleChildUse3DAvatar(!e.target.checked)}
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[var(--color-control-muted)] p-3 space-y-2">
                <div className="text-xs font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <SoftFilledIcon id="shield" size={16} />
                  <span>بيانات صحية وتطعيمات (خاصة بالوالدين افتراضيًا)</span>
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseChildModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
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
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4 border border-[var(--color-border)]"
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
                onClick={onCancelDeleteChild}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={onConfirmDeleteChild}
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
            if (e.target === e.currentTarget) onCloseTaskModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="taskModalTitle"
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4 border border-[var(--color-border)]"
          >
            <div className="flex items-center justify-between">
              <h2 id="taskModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                {editingTask ? 'تعديل مهمة الروتين' : 'إضافة مهمة للروتين'}
              </h2>
              <button
                type="button"
                onClick={onCloseTaskModal}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold text-[var(--color-text)]"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSaveTask} className="space-y-3">
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                  onClick={onCloseTaskModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
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
            if (e.target === e.currentTarget) onCloseEventModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eventModalTitle"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4 border border-[var(--color-border)]"
          >
            <div className="flex items-center justify-between">
              <h2 id="eventModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                {editingEvent ? 'تعديل الحدث' : 'إضافة حدث للتقويم الأسري'}
              </h2>
              <button
                type="button"
                onClick={onCloseEventModal}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold text-[var(--color-text)]"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSaveEvent} className="space-y-3">
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] p-3 text-sm min-h-[70px] text-[var(--color-text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseEventModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
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
            if (e.target === e.currentTarget) onCloseWishModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishModalTitle"
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4 border border-[var(--color-border)]"
          >
            <div className="flex items-center justify-between">
              <h2 id="wishModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                {editingWish ? 'تعديل الأمنية' : 'إضافة أمنية أو هدف للطفل'}
              </h2>
              <button
                type="button"
                onClick={onCloseWishModal}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold text-[var(--color-text)]"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSaveWish} className="space-y-3">
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onCloseWishModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
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
            if (e.target === e.currentTarget) onClosePersonModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="personModalTitle"
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4 border border-[var(--color-border)]"
          >
            <div className="flex items-center justify-between">
              <h2 id="personModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                إضافة فرد لمساحة العائلة
              </h2>
              <button
                type="button"
                onClick={onClosePersonModal}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold text-[var(--color-text)]"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSavePerson} className="space-y-3">
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
                />
              </div>

              <div>
                <label htmlFor="personRoleSelect" className="block text-xs text-[var(--color-muted)] mb-1">
                  صلة القرابة
                </label>
                <select
                  id="personRoleSelect"
                  name="role"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-2 text-sm text-[var(--color-text)]"
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
                  onClick={onClosePersonModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
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

      {/* 7. Granular Permissions Modal (Expanded 12 Permissions) */}
      {permModalMember && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClosePermModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="permModalTitle"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-5 space-y-4 border border-[var(--color-border)]"
          >
            <div className="flex items-center justify-between">
              <h2 id="permModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                صلاحيات الاطلاع والرعاية لـ {permModalMember.name}
              </h2>
              <button
                type="button"
                onClick={onClosePermModal}
                aria-label="إغلاق"
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold text-[var(--color-text)]"
              >
                ×
              </button>
            </div>

            <form onSubmit={onSaveMemberPermissions} className="space-y-3">
              <p className="text-xs text-[var(--color-muted)]">
                مبدأ الصلاحيات الأقل (Least Privilege): كل فئة أدناه مستقلة، والفئات الصحية والصور الخاصة مغلقة افتراضيًا.
              </p>

              <div className="divide-y divide-[var(--color-border)] text-sm">
                {[
                  {
                    key: 'profile',
                    label: 'الملف الأساسي للطفل (الاسم والعمر التقريبي)',
                    checked: permModalMember.permissions?.profile ?? true,
                    sensitive: false,
                  },
                  {
                    key: 'routine',
                    label: 'عرض وتحديث مهام الروتين اليومي',
                    checked: permModalMember.permissions?.routine ?? true,
                    sensitive: false,
                  },
                  {
                    key: 'calendar',
                    label: 'المناسبات والمواعيد المشتركة',
                    checked: permModalMember.permissions?.calendar ?? permModalMember.events,
                    sensitive: false,
                  },
                  {
                    key: 'receiveReminders',
                    label: 'استقبال التذكيرات اليومية للمهام',
                    checked: permModalMember.permissions?.receiveReminders ?? true,
                    sensitive: false,
                  },
                  {
                    key: 'submitCareUpdates',
                    label: 'إرسال ملاحظات الرعاية أو تقارير الحضانة/المدرسة',
                    checked: permModalMember.permissions?.submitCareUpdates ?? false,
                    sensitive: false,
                  },
                  {
                    key: 'emergencyAccess',
                    label: 'الوصول لبيانات الطوارئ وأرقام التواصل السريع',
                    checked: permModalMember.permissions?.emergencyAccess ?? false,
                    sensitive: false,
                  },
                  {
                    key: 'viewEducational',
                    label: 'الاطلاع على المحتوى التربوي والأنشطة المقترحة',
                    checked: permModalMember.permissions?.viewEducational ?? true,
                    sensitive: false,
                  },
                  {
                    key: 'uploadReports',
                    label: 'رفع صور الأنشطة المدرسية والتقارير بإذن الوالدين',
                    checked: permModalMember.permissions?.uploadReports ?? false,
                    sensitive: false,
                  },
                  {
                    key: 'wishes',
                    label: 'قائمة الأمنيات والهدايا',
                    checked: permModalMember.permissions?.wishes ?? permModalMember.wishes,
                    sensitive: false,
                  },
                  {
                    key: 'growth',
                    label: 'سجل النمو والقياسات',
                    checked: permModalMember.permissions?.growth ?? false,
                    sensitive: false,
                  },
                  {
                    key: 'health',
                    label: 'السجلات الصحية والتطعيمات (بيانات شديدة الحساسية)',
                    checked: permModalMember.permissions?.health ?? false,
                    sensitive: true,
                  },
                  {
                    key: 'privatePhotos',
                    label: 'الصور والملاحظات الخاصة (مغلقة افتراضيًا)',
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
                  onClick={onClosePermModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
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

      {/* 8. Profile & Quick Controls Drawer */}
      {roleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseRoleModal();
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
                <p className="text-xs text-[var(--color-muted)] mt-0.5">{todayFormattedCombined}</p>
              </div>
              <button
                type="button"
                onClick={onCloseRoleModal}
                aria-label={lang === 'en' ? 'Close' : 'إغلاق'}
                className="px-3 py-1 rounded-lg bg-[var(--color-control-muted)] text-sm font-bold text-[var(--color-text)]"
              >
                ×
              </button>
            </div>

            {/* Quick Account Setup & Cart Controls */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenOnboardingFromDrawer}
                className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-soft)] text-[var(--color-role-text)] font-extrabold text-xs text-start flex items-center gap-2"
              >
                <SoftFilledIcon id="sparkles" size={18} />
                <span>{lang === 'en' ? 'Account & City Wizard' : 'معالج الحساب والمدينة'}</span>
              </button>
              <button
                type="button"
                onClick={onOpenCartFromDrawer}
                className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-muted)] text-[var(--color-text)] font-extrabold text-xs text-start flex items-center gap-2"
              >
                <SoftFilledIcon id="services" size={18} />
                <span>{lang === 'en' ? `Shopping Cart (${cartItemCount})` : `سلة التسوق (${cartItemCount})`}</span>
              </button>
            </div>

            {/* Symmetric Country & Governorate/Region + GPS Filter inside Profile Drawer */}
            <div
              data-testid="drawer-symmetric-location-selector"
              className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-3.5 space-y-3 soft-card-surface"
            >
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="drawer-city-select"
                  className="text-xs font-extrabold text-[var(--color-text)] flex items-center gap-1.5"
                >
                  <SoftFilledIcon id="location" size={16} />
                  <span>
                    {lang === 'en'
                      ? state.country === 'EG'
                        ? 'Egypt Governorate (27) & Currency'
                        : 'Saudi Region / City (15) & Currency'
                      : state.country === 'EG'
                      ? 'محافظة مصر (٢٧ محافظة) والعملة'
                      : 'منطقة / مدينة السعودية (١٥ منطقة) والعملة'}
                  </span>
                </label>
                <UnifiedBadge
                  label={
                    state.country === 'SA'
                      ? lang === 'en'
                        ? '🇸🇦 SAR'
                        : '🇸🇦 ر.س (SAR)'
                      : lang === 'en'
                      ? '🇪🇬 EGP'
                      : '🇪🇬 ج.م (EGP)'
                  }
                  tone="teal"
                />
              </div>

              {/* Symmetric Country Switcher (Egypt 27 Governorates + EGP vs Saudi Arabia 15 Regions + SAR) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="drawer-country-eg-btn"
                  type="button"
                  aria-pressed={state.country === 'EG'}
                  onClick={() => onSelectPreciseCity(`EG:${COUNTRY_CITIES_MAP.EG[0].id}`)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    state.country === 'EG'
                      ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                      : 'bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#0d9488]'
                  }`}
                >
                  <span>🇪🇬</span>
                  <span>{lang === 'en' ? 'Egypt (27 · EGP)' : 'مصر (٢٧ محافظة · EGP)'}</span>
                </button>
                <button
                  id="drawer-country-sa-btn"
                  type="button"
                  aria-pressed={state.country === 'SA'}
                  onClick={() => onSelectPreciseCity(`SA:${COUNTRY_CITIES_MAP.SA[0].id}`)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    state.country === 'SA'
                      ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs'
                      : 'bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#0d9488]'
                  }`}
                >
                  <span>🇸🇦</span>
                  <span>{lang === 'en' ? 'Saudi (15 · SAR)' : 'السعودية (١٥ منطقة · SAR)'}</span>
                </button>
              </div>

              {/* Identical Dropdown Menu Right Beside GPS Location Button for Both Countries */}
              <div className="flex items-center gap-2">
                <select
                  id="drawer-city-select"
                  aria-label={
                    lang === 'en'
                      ? state.country === 'EG'
                        ? 'Select Egyptian Governorate'
                        : 'Select Saudi Region or City'
                      : state.country === 'EG'
                      ? 'اختر المحافظة في مصر'
                      : 'اختر المنطقة أو المدينة في السعودية'
                  }
                  value={`${state.country}:${resolvedDrawerCityId}`}
                  onChange={(e) => onSelectPreciseCity(e.target.value)}
                  className="flex-1 min-w-0 min-h-[40px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] focus:outline-none focus:border-[#0d9488] cursor-pointer"
                >
                  {activeCountryList.map((c, idx) => (
                    <option key={`drw-${state.country}-${c.id}`} value={`${state.country}:${c.id}`}>
                      {lang === 'en' ? `${idx + 1}. ${c.nameEn}` : `${idx + 1}. ${c.nameAr}`}
                    </option>
                  ))}
                </select>
                <button
                  id="drawer-gps-location-btn"
                  type="button"
                  onClick={onUseCurrentLocation}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-extrabold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                    geoStatus === 'active'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-2xs'
                  }`}
                >
                  <SoftFilledIcon id="location" size={15} />
                  <span>
                    {geoStatus === 'locating'
                      ? lang === 'en'
                        ? 'GPS...'
                        : 'تحديد...'
                      : geoStatus === 'active'
                      ? lang === 'en'
                        ? 'GPS ✓'
                        : 'موقعي ✓'
                      : lang === 'en'
                      ? 'GPS'
                      : 'موقعي GPS'}
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onSelectParentProfile('mom')}
                className="p-3.5 rounded-xl border border-rose-200 dark:border-[#1E3646] bg-rose-50 dark:bg-[#142430] text-rose-900 dark:text-[#FDA4AF] font-bold text-xs sm:text-sm text-start flex items-center gap-2 cursor-pointer"
              >
                <SoftFilledIcon id="family" size={20} />
                <span>
                  {lang === 'en'
                    ? 'Mother Profile — Soft Coral & Warm Rose (Mom Sara)'
                    : 'حساب الأم (ماما سارة) — مرجاني دافئ ووردي ناعم'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onSelectParentProfile('dad')}
                className="p-3.5 rounded-xl border border-sky-200 dark:border-[#1E3646] bg-sky-50 dark:bg-[#142430] text-sky-900 dark:text-[#7DD3FC] font-bold text-xs sm:text-sm text-start flex items-center gap-2 cursor-pointer"
              >
                <SoftFilledIcon id="family" size={20} />
                <span>
                  {lang === 'en'
                    ? 'Father Profile — Calm Teal & Slate Blue (Dad Ahmed)'
                    : 'حساب الأب (بابا أحمد) — تيل هادئ وأزرق أردوازي'}
                </span>
              </button>
              {onToggleBedtimeMode && (
                <button
                  id="drawer-bedtime-mode-btn"
                  type="button"
                  onClick={() => {
                    onToggleBedtimeMode();
                    onCloseRoleModal();
                  }}
                  className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/90 dark:bg-[#142430] text-amber-950 dark:text-amber-200 font-bold text-xs sm:text-sm text-start flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">🕯️</span>
                    <span>
                      {lang === 'en'
                        ? 'Warm Bedtime Focus & Night Story Dimming'
                        : 'وضع وقت النوم والهدوء الليلي الدافئ للقراءة'}
                    </span>
                  </span>
                  <UnifiedBadge
                    label={
                      bedtimeMode
                        ? lang === 'en'
                          ? 'Active'
                          : 'مفعّل'
                        : lang === 'en'
                        ? 'Off'
                        : 'إيقاف'
                    }
                    tone="amber"
                  />
                </button>
              )}
              <button
                type="button"
                onClick={onEnableHighContrast}
                className="p-3.5 rounded-xl border border-slate-500 bg-[var(--color-control-bg)] text-[var(--color-text)] font-bold text-xs sm:text-sm text-start flex items-center gap-2 cursor-pointer"
              >
                <SoftFilledIcon id="shield" size={20} />
                <span>
                  {lang === 'en'
                    ? 'High Contrast Accessibility Mode'
                    : 'وضع التباين العالي لسهولة القراءة'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onToggleDarkMode();
                  onCloseRoleModal();
                }}
                className="p-3.5 rounded-xl border border-teal-400/50 bg-teal-50 dark:bg-[#142430] text-teal-950 dark:text-[#A5F3FC] font-bold text-xs sm:text-sm text-start flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>
                  {state.darkMode
                    ? lang === 'en'
                      ? 'Switch to Breathable Light Mode'
                      : 'التبديل إلى الوضع النهاري المريح'
                    : lang === 'en'
                    ? 'Enable Deep Midnight Charcoal Dark Mode (#0B131A)'
                    : 'تفعيل الوضع الليلي الفحمي العميق (#0B131A)'}
                </span>
                <UnifiedBadge
                  label={state.darkMode ? (lang === 'en' ? 'Active' : 'مفعّل') : lang === 'en' ? 'Off' : 'إيقاف'}
                  tone="teal"
                />
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
            if (e.target === e.currentTarget) onCloseMediaModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="mediaReaderTitle"
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] p-6 space-y-4 border border-[var(--color-border)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-[var(--color-muted)]">
                  {activeMediaModal.tags.join(' · ')} · مناسب لعمر{' '}
                  {activeMediaModal.ageStage === 'all' ? '0–8 سنوات' : `${activeMediaModal.ageStage} سنوات`}
                </div>
                <h2 id="mediaReaderTitle" className="text-xl font-bold text-[var(--color-text)] mt-1">
                  {lang === 'en' ? activeMediaModal.titleEn : activeMediaModal.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onCloseMediaModal}
                aria-label={lang === 'en' ? 'Close' : 'إغلاق'}
                className="w-8 h-8 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] text-lg font-black leading-none text-[var(--color-text)] flex items-center justify-center shrink-0 cursor-pointer"
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
            </div>
          </div>
        </div>
      )}

      {/* 10. Rich 3D Product / Service Detail Modal */}
      {activeCommercialModal && (
        <div
          className="fixed inset-0 z-50 bg-[var(--color-overlay)] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseCommercialModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="commercialModalTitle"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] bg-[var(--color-surface)] dark:bg-[#101D26] p-6 space-y-4 border border-[var(--color-border)] dark:border-[#1E3646]"
          >
            {activeCommercialModal.imageUrl && (
              <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-[var(--color-border)] dark:border-[#1E3646] bg-[#142430]">
                <img
                  src={activeCommercialModal.imageUrl}
                  alt={lang === 'en' ? activeCommercialModal.nameEn : activeCommercialModal.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#0B131A]/85 text-[#F8FAFC] border border-[#1E3646]">
                    {activeCommercialModal.emoji} {locText(activeCommercialModal.categoryLabel, lang)}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#0B131A]/85 text-[#FBBF24] border border-[#1E3646] tabular-nums">
                    ⭐ {activeCommercialModal.rating} ({activeCommercialModal.reviewCount || 142})
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs text-[var(--color-muted)]">
                  {locText(activeCommercialModal.categoryLabel, lang)} · {locText(activeCommercialModal.city, lang)}
                </div>
                <h2 id="commercialModalTitle" className="text-xl font-bold text-[var(--color-text)] mt-1">
                  {lang === 'en' ? activeCommercialModal.nameEn : activeCommercialModal.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onCloseCommercialModal}
                aria-label={lang === 'en' ? 'Close' : 'إغلاق'}
                className="w-8 h-8 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] text-lg font-black leading-none text-[var(--color-text)] flex items-center justify-center shrink-0 cursor-pointer"
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
                      onClick={() => onSelectModalVariant(v)}
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

            <div className="rounded-xl bg-[var(--color-control-muted)] p-3.5 text-xs space-y-1 tabular-nums text-[var(--color-text)]">
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
                  onAddToCart(activeCommercialModal, selectedModalVariant);
                  onCloseCommercialModal();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
              >
                {lang === 'en' ? 'Add to Shopping Cart' : 'أضف إلى سلة التسوق'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickAddWish(
                    activeCommercialModal.name,
                    activeCommercialModal.priceEGP,
                    activeCommercialModal.priceSAR,
                    activeCommercialModal.emoji
                  );
                  onCloseCommercialModal();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] bg-[var(--color-control-bg)] text-[var(--color-text)]"
              >
                {lang === 'en' ? '+ Add to Wishes' : '+ أضف للأمنيات'}
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
            className="w-full max-w-md rounded-[20px] bg-[var(--color-surface)] dark:bg-[#101D26] p-5 space-y-4 border border-[var(--color-border)] dark:border-[#1E3646]"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 id="resetModalTitle" className="text-lg font-bold text-[var(--color-text)]">
                مسح البيانات المحلية وإعادة الضبط؟
              </h2>
              <button
                type="button"
                onClick={onCloseConfirmResetModal}
                aria-label="إغلاق"
                className="w-8 h-8 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] text-lg font-black leading-none text-[var(--color-text)] flex items-center justify-center shrink-0 cursor-pointer"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              سيتم مسح التعديلات المحفوظة في هذا المتصفح وإعادة البيانات التجريبية الافتراضية. يُنصح بتصدير نسخة JSON أولًا إذا كنت ترغب في الاحتفاظ ببياناتك.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCloseConfirmResetModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-border)] text-[var(--color-text)]"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={onResetAllData}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white"
              >
                نعم، أعد الضبط
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
