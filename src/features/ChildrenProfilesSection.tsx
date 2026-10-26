import React from 'react';
import {
  ChildProfile,
  FamilySpaceState,
  LanguageCode,
  calculateChildAge,
  locText,
} from '../domain/familySpaceCore';
import { AVATAR_ACCESSORY_THEMES } from '../domain/assetManifest3D';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import {
  MasterPatternCard,
  PASTEL_CARD_TONES,
  PrimaryCtaButton,
  UnifiedBadge,
} from '../components/DesignSystem';
import { ThreeDChildAvatar, ThreeDIcon } from '../components/ThreeDVisuals';
import { ChildGrowthChart } from '../components/ChildGrowthChart';

export interface ChildrenProfilesSectionProps {
  state: FamilySpaceState;
  lang: LanguageCode;
  onOpenAddChild: () => void;
  onOpenEditChild: (kid: ChildProfile) => void;
  onConfirmDeleteChild: (kidId: number) => void;
}

export const ChildrenProfilesSection: React.FC<ChildrenProfilesSectionProps> = ({
  state,
  lang,
  onOpenAddChild,
  onOpenEditChild,
  onConfirmDeleteChild,
}) => {
  const isEn = lang === 'en';

  return (
    <section className="space-y-4" aria-label={isEn ? 'Children Profiles' : 'ملفات الأطفال'}>
      <div
        style={{ backgroundImage: getCardBackgroundSpec('children', state.darkMode).backgroundImageCss }}
        className="image-bg-card rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-2.5"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="image-card-badge px-2 py-0.5 rounded-full text-[9.5px] font-extrabold">
              {isEn ? '0–8 Years' : 'من أول يوم حتى 8 سنوات'}
            </span>
            <span className="image-card-badge px-2 py-0.5 rounded-full text-[9.5px] font-extrabold">
              {isEn ? '3D Avatar & Photo' : 'هوية 3D وصورة حقيقية'}
            </span>
          </div>
          <h2 className="image-card-title text-sm sm:text-base font-extrabold">
            {isEn ? '3D Child Profiles & Growth' : 'ملفات الأطفال ومتابعة النمو'}
          </h2>
        </div>
        <PrimaryCtaButton variant="teal" size="sm" onClick={onOpenAddChild}>
          {isEn ? '+ Add Child Profile' : '+ إضافة طفل جديد'}
        </PrimaryCtaButton>
      </div>

      {/* Interactive Recharts Growth Visualization (Height & Weight over Time) */}
      {state.kids.length > 0 && (
        <ChildGrowthChart
          kids={state.kids}
          language={lang}
          darkMode={Boolean(state.darkMode)}
          onEditChildGrowth={onOpenEditChild}
        />
      )}

      {state.kids.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] dark:border-[#1E3646] p-6 text-center text-xs font-bold text-[var(--color-muted)]">
          {isEn
            ? 'No child profiles yet. Tap "+ Add Child Profile" to create the first profile.'
            : 'لا توجد ملفات أطفال حاليًا. اضغط على «إضافة طفل جديد» لإنشاء الملف الأول.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {state.kids.map((kid, idx) => {
            const ageInfo = calculateChildAge(kid.birth, state.language);
            const kidTasksCount = state.tasks.filter((tItem) => Number(tItem.kidId) === kid.id).length;
            const kidEventsCount = state.events.filter((ev) => Number(ev.childId) === kid.id).length;
            const kidWishesCount = state.wishes.filter((w) => Number(w.kid) === kid.id).length;
            const themeObj =
              AVATAR_ACCESSORY_THEMES.find((th) => th.id === kid.avatarTheme) ||
              AVATAR_ACCESSORY_THEMES[0];
            const displayKidName = locText(kid.name, lang);

            return (
              <MasterPatternCard
                key={kid.id}
                tone={idx % 2 === 0 ? 'teal' : 'rose'}
                categoryKey="children"
                itemIdOrIndex={kid.id}
                darkMode={state.darkMode}
                onThumbnailClick={() => onOpenEditChild(kid)}
                topLeftBadge={ageInfo.label}
                topRightBadge={
                  <span>
                    {kid.photoDataUrl && !kid.useIllustratedAvatar
                      ? isEn
                        ? '📸 Real Photo'
                        : '📸 صورة حقيقية'
                      : isEn
                      ? `✨ ${themeObj.labelEn}`
                      : `✨ ${themeObj.labelAr}`}
                  </span>
                }
                titlePrefixSlot={
                  <ThreeDChildAvatar
                    name={displayKidName}
                    gender={kid.gender}
                    stageCode={ageInfo.stageCode}
                    accessoryTheme={kid.avatarTheme || 'astronaut'}
                    photoDataUrl={kid.photoDataUrl}
                    useIllustratedAvatar={kid.useIllustratedAvatar}
                    size="sm"
                  />
                }
                title={displayKidName}
                metaLeft={
                  <span className="inline-flex items-center gap-1">
                    <ThreeDIcon id="health" size={14} />
                    <span>{ageInfo.stageTitle}</span>
                  </span>
                }
                metaRightAction={
                  <button
                    type="button"
                    onClick={() => onOpenEditChild(kid)}
                    className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                  >
                    {isEn ? 'Edit Growth' : 'تعديل النمو'}
                  </button>
                }
                bodyContent={
                  <div className="space-y-2">
                    {/* Compact Visual Tags for Growth & Linked Counts */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white/85 dark:bg-[#142430] border border-white dark:border-[#1E3646] p-2 text-center">
                        <div className="text-[10px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                          {isEn ? 'Routine' : 'الروتين'}
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums">
                          {kidTasksCount} {isEn ? 'tasks' : 'مهام'}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/85 dark:bg-[#142430] border border-white dark:border-[#1E3646] p-2 text-center">
                        <div className="text-[10px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                          {isEn ? 'Events' : 'المواعيد'}
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums">
                          {kidEventsCount} {isEn ? 'events' : 'موعد'}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/85 dark:bg-[#142430] border border-white dark:border-[#1E3646] p-2 text-center">
                        <div className="text-[10px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                          {isEn ? 'Wishes' : 'الأمنيات'}
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums">
                          {kidWishesCount} {isEn ? 'wishes' : 'أمنية'}
                        </div>
                      </div>
                    </div>

                    {/* Stage & Health Compact Card */}
                    <div className="rounded-xl bg-white/85 dark:bg-[#142430] border border-white dark:border-[#1E3646] p-2.5 text-[11px] font-semibold text-[var(--color-muted)] dark:text-[#94A3B8]">
                      {locText(kid.interests || 'لم تحدد الاهتمامات بعد', lang)} ·{' '}
                      {isEn ? 'Vaccinations:' : 'التطعيمات:'}{' '}
                      {locText(kid.vaccinationsNote || 'محدثة', lang)}
                    </div>
                  </div>
                }
                footerLeft={
                  <span dir="ltr" className="text-xs font-extrabold text-emerald-900 dark:text-[#A5F3FC] tabular-nums">
                    {kid.growthHeightCm ? `${kid.growthHeightCm} ${isEn ? 'cm' : 'سم'}` : ''}
                    {kid.growthHeightCm && kid.growthWeightKg ? ' · ' : ''}
                    {kid.growthWeightKg ? `${kid.growthWeightKg} ${isEn ? 'kg' : 'كجم'}` : ''}
                  </span>
                }
                footerRight={
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenEditChild(kid)}
                      className="min-h-[34px] px-3 py-1 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] shadow-2xs cursor-pointer"
                    >
                      {isEn ? 'Edit 3D Profile / Growth' : 'تعديل الملف وقياسات النمو'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirmDeleteChild(kid.id)}
                      className="min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-extrabold border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#142430] text-red-700 dark:text-red-300 cursor-pointer"
                    >
                      {isEn ? 'Delete' : 'حذف الملف'}
                    </button>
                  </div>
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
};
