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
  PASTEL_CARD_TONES,
  PrimaryCtaButton,
  UnifiedBadge,
} from '../components/DesignSystem';
import { ThreeDChildAvatar, ThreeDIcon } from '../components/ThreeDVisuals';

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
    <section className="space-y-6" aria-label={isEn ? 'Children Profiles' : 'ملفات الأطفال'}>
      <div
        style={{ backgroundImage: getCardBackgroundSpec('children', state.darkMode).backgroundImageCss }}
        className="image-bg-card rounded-[24px] p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-4"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="image-card-badge px-3 py-1 rounded-xl text-xs font-extrabold">
            {isEn ? '0–8 Years' : 'من أول يوم حتى 8 سنوات'}
          </span>
          <span className="image-card-badge px-3 py-1 rounded-xl text-xs font-extrabold">
            {isEn ? '3D Avatar & Photo' : 'هوية 3D وصورة حقيقية'}
          </span>
        </div>
        <h2 className="image-card-title text-xl sm:text-2xl font-extrabold text-center">
          {isEn ? '3D Child Profiles & Growth' : 'ملفات الأطفال ومتابعة النمو'}
        </h2>
        <PrimaryCtaButton variant="teal" onClick={onOpenAddChild}>
          {isEn ? '+ Add Child Profile' : '+ إضافة طفل جديد'}
        </PrimaryCtaButton>
      </div>

      {state.kids.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[var(--color-border)] p-8 text-center text-sm font-bold text-[var(--color-muted)]">
          {isEn
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
                        <UnifiedBadge tone={idx % 2 === 0 ? 'teal' : 'rose'} iconId="children">
                          {ageInfo.label}
                        </UnifiedBadge>
                        <UnifiedBadge tone="slate" iconId="star">
                          {kid.photoDataUrl && !kid.useIllustratedAvatar
                            ? isEn
                              ? 'Real Photo'
                              : 'صورة حقيقية'
                            : isEn
                            ? themeObj.labelEn
                            : themeObj.labelAr}
                        </UnifiedBadge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compact Visual Tags for Growth & Linked Counts */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-2xl bg-white/85 border border-white p-3 text-center">
                    <div className="text-[10px] font-bold text-[var(--color-muted)]">
                      {isEn ? 'Routine' : 'الروتين'}
                    </div>
                    <div className="text-sm font-extrabold text-[var(--color-text)] tabular-nums">
                      {kidTasksCount} {isEn ? 'tasks' : 'مهام'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/85 border border-white p-3 text-center">
                    <div className="text-[10px] font-bold text-[var(--color-muted)]">
                      {isEn ? 'Events' : 'المواعيد'}
                    </div>
                    <div className="text-sm font-extrabold text-[var(--color-text)] tabular-nums">
                      {kidEventsCount} {isEn ? 'events' : 'موعد'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/85 border border-white p-3 text-center">
                    <div className="text-[10px] font-bold text-[var(--color-muted)]">
                      {isEn ? 'Wishes' : 'الأمنيات'}
                    </div>
                    <div className="text-sm font-extrabold text-[var(--color-text)] tabular-nums">
                      {kidWishesCount} {isEn ? 'wishes' : 'أمنية'}
                    </div>
                  </div>
                </div>

                {/* Stage & Health Compact Card */}
                <div className="rounded-2xl bg-white/85 border border-white p-4 space-y-1.5 text-xs">
                  <div className="font-extrabold text-[var(--color-text)] flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5">
                      <ThreeDIcon id="health" size={15} />
                      <span>{ageInfo.stageTitle}</span>
                    </span>
                    {(kid.growthHeightCm || kid.growthWeightKg) && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 text-[10px] font-extrabold tabular-nums">
                        {kid.growthHeightCm ? `${kid.growthHeightCm} ${isEn ? 'cm' : 'سم'}` : ''}
                        {kid.growthHeightCm && kid.growthWeightKg ? ' · ' : ''}
                        {kid.growthWeightKg ? `${kid.growthWeightKg} ${isEn ? 'kg' : 'كجم'}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold text-[var(--color-muted)]">
                    {locText(kid.interests || 'لم تحدد الاهتمامات بعد', lang)} ·{' '}
                    {isEn ? 'Vaccinations:' : 'التطعيمات:'}{' '}
                    {locText(kid.vaccinationsNote || 'محدثة', lang)}
                  </div>
                </div>

                <div className="pt-2 border-t border-black/5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenEditChild(kid)}
                    className="flex-1 min-h-[42px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-[var(--color-border)] bg-white text-[var(--color-text)] shadow-2xs"
                  >
                    {isEn ? 'Edit 3D Profile / Photo' : 'تعديل الملف والهوية 3D'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onConfirmDeleteChild(kid.id)}
                    className="min-h-[42px] px-3.5 py-2 rounded-2xl text-xs font-extrabold border border-red-200 bg-white text-red-700"
                  >
                    {isEn ? 'Delete' : 'حذف الملف'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
