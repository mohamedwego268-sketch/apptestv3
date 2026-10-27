import React, { useEffect, useRef, useState } from 'react';
import {
  ChildProfile,
  FamilySpaceState,
  LanguageCode,
  VoiceVaultMoment,
  calculateChildAge,
  dateLocalISO,
  locText,
  sanitizeUserText,
} from '../domain/familySpaceCore';
import { AVATAR_ACCESSORY_THEMES } from '../domain/assetManifest3D';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import {
  MasterPatternCard,
  PrimaryCtaButton,
  StarOfTheDayCrownBadge,
} from '../components/DesignSystem';
import { ThreeDChildAvatar, ThreeDIcon } from '../components/ThreeDVisuals';
import { ChildGrowthChart } from '../components/ChildGrowthChart';

export interface ChildrenProfilesSectionProps {
  state: FamilySpaceState;
  lang: LanguageCode;
  onOpenAddChild: () => void;
  onOpenEditChild: (kid: ChildProfile) => void;
  onConfirmDeleteChild: (kidId: number) => void;
  onAddVoiceMoment?: (kidId: number, moment: VoiceVaultMoment) => void;
  onShowToast?: (msg: string) => void;
}

export const ChildrenProfilesSection: React.FC<ChildrenProfilesSectionProps> = ({
  state,
  lang,
  onOpenAddChild,
  onOpenEditChild,
  onConfirmDeleteChild,
  onAddVoiceMoment,
  onShowToast,
}) => {
  const isEn = lang === 'en';

  // Micro-Moments Voice Vault (خزينة اللقطات الصوتية — 10-second logger & player)
  const [localVoiceMomentsByKid, setLocalVoiceMomentsByKid] = useState<
    Record<number, VoiceVaultMoment[]>
  >({});
  const [recordingKidId, setRecordingKidId] = useState<number | null>(null);
  const [recordingElapsedSec, setRecordingElapsedSec] = useState<number>(0);
  const [draftNoteByKid, setDraftNoteByKid] = useState<Record<number, string>>({});
  const [draftTagByKid, setDraftTagByKid] = useState<Record<number, string>>({});
  const [playingMomentId, setPlayingMomentId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playGentleVoiceVaultMelody = (notesHz: number[] = [392.0, 440.0, 523.25, 659.25]) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      notesHz.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.22);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.22 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.22);
        osc.stop(ctx.currentTime + idx * 0.22 + 0.21);
      });
    } catch {
      // Ignore Web Audio errors in headless environments
    }
  };

  const finalizeVoiceRecording = (kid: ChildProfile, durationSec: number) => {
    const rawDraft = draftNoteByKid[kid.id] || '';
    const cleanTitle =
      sanitizeUserText(rawDraft, 120) ||
      (isEn
        ? `10s Voice Memory for ${locText(kid.name, lang)}`
        : `لقطة صوتية عفوية لـ ${kid.name} (${Math.max(1, durationSec)} ثوانٍ)`);
    const tag = draftTagByKid[kid.id] || 'ذكرى صوتية 🎙️';
    const newMoment: VoiceVaultMoment = {
      id: `vm-${kid.id}-${Date.now()}`,
      title: cleanTitle,
      createdAt: dateLocalISO(new Date()),
      durationSec: Math.max(1, Math.min(10, durationSec)),
      tag,
      recordedBy: state.activeParentAccount,
      melodyHz: [392.0, 493.88, 587.33, 659.25],
    };

    setLocalVoiceMomentsByKid((prev) => ({
      ...prev,
      [kid.id]: [newMoment, ...(prev[kid.id] || [])],
    }));
    setDraftNoteByKid((prev) => ({ ...prev, [kid.id]: '' }));
    setRecordingKidId(null);
    setRecordingElapsedSec(0);
    onAddVoiceMoment?.(kid.id, newMoment);
    playGentleVoiceVaultMelody(newMoment.melodyHz);
    onShowToast?.(
      isEn
        ? `🎙️ Saved 10s voice memory to ${locText(kid.name, lang)}'s Voice Vault!`
        : `🎙️ تم حفظ اللقطة الصوتية في خزينة ذكريات ${kid.name} بنجاح!`
    );
  };

  useEffect(() => {
    if (recordingKidId === null) return;
    const timer = window.setInterval(() => {
      setRecordingElapsedSec((prev) => {
        if (prev >= 9) {
          const targetKid = state.kids.find((k) => k.id === recordingKidId);
          if (targetKid) {
            window.setTimeout(() => finalizeVoiceRecording(targetKid, 10), 50);
          }
          return 10;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recordingKidId, state.kids, draftNoteByKid, draftTagByKid]);

  const handlePlayVoiceMoment = (moment: VoiceVaultMoment) => {
    if (playingMomentId === moment.id) {
      setPlayingMomentId(null);
      return;
    }
    setPlayingMomentId(moment.id);
    playGentleVoiceVaultMelody(moment.melodyHz);
    window.setTimeout(() => {
      setPlayingMomentId((curr) => (curr === moment.id ? null : curr));
    }, 2200);
  };

  return (
    <section className="space-y-4" aria-label={isEn ? 'Children Profiles' : 'ملفات الأطفال'}>
      <div
        style={{ backgroundImage: getCardBackgroundSpec('children', state.darkMode).backgroundImageCss }}
        className="image-bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="image-card-badge px-2.5 py-0.5 rounded-full text-xs font-extrabold">
              {isEn ? '0–8 Years' : 'من أول يوم حتى 8 سنوات'}
            </span>
            <span className="image-card-badge px-2.5 py-0.5 rounded-full text-xs font-extrabold">
              🎙️ {isEn ? 'Micro-Moments Voice Vault (10s)' : 'خزينة اللقطات الصوتية (١٠ ثوانٍ)'}
            </span>
          </div>
          <h2 className="image-card-title text-base sm:text-lg font-extrabold leading-snug">
            {isEn
              ? '3D Child Profiles, Growth & Voice Vault'
              : 'ملفات الأطفال 3D · النمو وخزينة اللقطات الصوتية'}
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
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] dark:border-[#1E3646] p-6 text-center text-xs sm:text-sm font-bold text-[var(--color-muted)]">
          {isEn
            ? 'No child profiles yet. Tap "+ Add Child Profile" to create the first profile.'
            : 'لا توجد ملفات أطفال حاليًا. اضغط على «إضافة طفل جديد» لإنشاء الملف الأول.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.kids.map((kid, idx) => {
            const ageInfo = calculateChildAge(kid.birth, state.language);
            const kidTasksCount = state.tasks.filter((tItem) => Number(tItem.kidId) === kid.id).length;
            const kidEventsCount = state.events.filter((ev) => Number(ev.childId) === kid.id).length;
            const kidWishesCount = state.wishes.filter((w) => Number(w.kid) === kid.id).length;
            const themeObj =
              AVATAR_ACCESSORY_THEMES.find((th) => th.id === kid.avatarTheme) ||
              AVATAR_ACCESSORY_THEMES[0];
            const displayKidName = locText(kid.name, lang);

            const kidDoneTasksCount = state.tasks.filter(
              (tItem) => tItem.done && (Number(tItem.kidId) === kid.id || tItem.kidId === null)
            ).length;

            const mergedVoiceMoments = [
              ...(localVoiceMomentsByKid[kid.id] || []),
              ...(kid.voiceMoments || []),
            ];
            const isRecordingThisKid = recordingKidId === kid.id;

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
                  <StarOfTheDayCrownBadge
                    language={lang}
                    completedCount={Math.max(1, kidDoneTasksCount)}
                  />
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
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <ThreeDIcon id="health" size={14} />
                    <span>{ageInfo.stageTitle}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {kid.photoDataUrl && !kid.useIllustratedAvatar
                        ? isEn
                          ? '📸 Real Photo'
                          : '📸 صورة حقيقية'
                        : isEn
                        ? `✨ ${themeObj.labelEn}`
                        : `✨ ${themeObj.labelAr}`}
                    </span>
                  </span>
                }
                metaRightAction={
                  <button
                    type="button"
                    onClick={() => onOpenEditChild(kid)}
                    className="min-h-[44px] px-2.5 text-xs font-extrabold text-[#0d9488] dark:text-[#A5F3FC] hover:underline cursor-pointer"
                  >
                    {isEn ? 'Edit Growth' : 'تعديل النمو'}
                  </button>
                }
                bodyContent={
                  <div className="space-y-3">
                    {/* Compact Visual Tags for Growth & Linked Counts */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white/85 dark:bg-[#142430] border border-white dark:border-[#1E3646] p-2 text-center">
                        <div className="text-xs font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                          {isEn ? 'Routine' : 'الروتين'}
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums">
                          {kidTasksCount} {isEn ? 'tasks' : 'مهام'}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/85 dark:bg-[#142430] border border-white dark:border-[#1E3646] p-2 text-center">
                        <div className="text-xs font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                          {isEn ? 'Events' : 'المواعيد'}
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums">
                          {kidEventsCount} {isEn ? 'events' : 'موعد'}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/85 dark:bg-[#142430] border border-white dark:border-[#1E3646] p-2 text-center">
                        <div className="text-xs font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                          {isEn ? 'Wishes' : 'الأمنيات'}
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] tabular-nums">
                          {kidWishesCount} {isEn ? 'wishes' : 'أمنية'}
                        </div>
                      </div>
                    </div>

                    {/* Stage & Health Compact Card */}
                    <div className="rounded-xl bg-white/85 dark:bg-[#142430] border border-white dark:border-[#1E3646] p-3 text-xs font-semibold text-[var(--color-muted)] dark:text-[#94A3B8] leading-relaxed break-words">
                      {locText(kid.interests || 'لم تحدد الاهتمامات بعد', lang)} ·{' '}
                      {isEn ? 'Vaccinations:' : 'التطعيمات:'}{' '}
                      {locText(kid.vaccinationsNote || 'محدثة', lang)}
                    </div>

                    {/* ===============================================================
                        MICRO-MOMENTS VOICE VAULT (خزينة اللقطات الصوتية — 10s Logger)
                        =============================================================== */}
                    <div
                      id={`voice-vault-card-${kid.id}`}
                      data-testid={`voice-vault-card-${kid.id}`}
                      className="rounded-2xl border border-teal-500/35 dark:border-[#1E3646] bg-teal-50/60 dark:bg-[#142430] p-3.5 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">🎙️</span>
                          <span className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                            {isEn
                              ? `Micro-Moments Voice Vault (${mergedVoiceMoments.length})`
                              : `خزينة اللقطات الصوتية لـ ${displayKidName} (${mergedVoiceMoments.length})`}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] text-[11px] font-black tabular-nums">
                          {isRecordingThisKid
                            ? `🔴 00:${String(10 - recordingElapsedSec).padStart(2, '0')}s`
                            : isEn
                            ? '10s Audio Memory'
                            : 'تسجيل ١٠ ثوانٍ'}
                        </span>
                      </div>

                      {/* Voice Moment Input + Tag Selector + 10s Record Button */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={draftNoteByKid[kid.id] || ''}
                          onChange={(e) =>
                            setDraftNoteByKid((prev) => ({
                              ...prev,
                              [kid.id]: sanitizeUserText(e.target.value, 120),
                            }))
                          }
                          placeholder={
                            isEn
                              ? `Describe ${displayKidName}'s 10s moment (e.g., First laugh)...`
                              : `عنوان اللقطة الصوتية لـ ${displayKidName} (مثال: أول ضحكة، كلمة جديدة)...`
                          }
                          className="flex-1 min-h-[44px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#101D26] px-3 py-2 text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
                        />

                        {isRecordingThisKid ? (
                          <button
                            type="button"
                            data-testid={`voice-vault-stop-btn-${kid.id}`}
                            onClick={() =>
                              finalizeVoiceRecording(kid, Math.max(1, recordingElapsedSec))
                            }
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                          >
                            <span>⏹️</span>
                            <span>
                              {isEn
                                ? `Save (${10 - recordingElapsedSec}s left)`
                                : `حفظ اللقطة (${10 - recordingElapsedSec}ث)`}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            data-testid={`voice-vault-record-btn-${kid.id}`}
                            onClick={() => {
                              setRecordingKidId(kid.id);
                              setRecordingElapsedSec(0);
                              playGentleVoiceVaultMelody([440, 523.25]);
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-black shadow-sm cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                          >
                            <span>🎙️</span>
                            <span>{isEn ? 'Record 10s' : 'سجّل ١٠ ثوانٍ'}</span>
                          </button>
                        )}
                      </div>

                      {/* Quick Tag Selector */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {['أول ضحكة 👶🏻', 'مناغاة 🎵', 'كلمة جديدة 💬', 'حكاية الحضانة 🎨', 'فخر وإنجاز 🏆'].map(
                          (tg) => {
                            const selectedTag = (draftTagByKid[kid.id] || 'أول ضحكة 👶🏻') === tg;
                            return (
                              <button
                                key={tg}
                                type="button"
                                onClick={() =>
                                  setDraftTagByKid((prev) => ({ ...prev, [kid.id]: tg }))
                                }
                                className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer ${
                                  selectedTag
                                    ? 'bg-[#0d9488] text-white border-[#0d9488]'
                                    : 'bg-white/80 dark:bg-[#101D26] text-[var(--color-text)] dark:text-[#CBD5E1] border-[var(--color-border)] dark:border-[#1E3646]'
                                }`}
                              >
                                {tg}
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* Saved Voice Moments List */}
                      <div className="space-y-1.5 pt-1">
                        {mergedVoiceMoments.slice(0, 3).map((vm) => {
                          const isPlaying = playingMomentId === vm.id;
                          return (
                            <div
                              key={vm.id}
                              className="rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white/90 dark:bg-[#101D26] p-2.5 flex flex-wrap items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="text-xs font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug break-words">
                                  {vm.title}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[var(--color-muted)] dark:text-[#94A3B8]">
                                  <span>{vm.tag}</span>
                                  <span>·</span>
                                  <span>⏱️ {vm.durationSec}s</span>
                                  <span>·</span>
                                  <span>
                                    {vm.recordedBy === 'father'
                                      ? isEn
                                        ? 'By Dad (Ahmed)'
                                        : 'بصوت بابا أحمد'
                                      : isEn
                                      ? 'By Mom (Maryam)'
                                      : 'بصوت ماما مريم'}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                data-testid={`voice-vault-play-${vm.id}`}
                                onClick={() => handlePlayVoiceMoment(vm)}
                                className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                                  isPlaying
                                    ? 'bg-[#FF8C61] text-white'
                                    : 'bg-teal-500/15 text-[#0d9488] dark:text-[#2DD4BF] hover:bg-teal-500/25'
                                }`}
                              >
                                <span>{isPlaying ? '🔊' : '▶️'}</span>
                                <span>{isPlaying ? (isEn ? 'Playing...' : 'جاري التشغيل') : isEn ? 'Listen' : 'استماع'}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                }
                footerLeft={
                  <span dir="ltr" className="text-xs sm:text-sm font-extrabold text-emerald-900 dark:text-[#A5F3FC] tabular-nums">
                    {kid.growthHeightCm ? `${kid.growthHeightCm} ${isEn ? 'cm' : 'سم'}` : ''}
                    {kid.growthHeightCm && kid.growthWeightKg ? ' · ' : ''}
                    {kid.growthWeightKg ? `${kid.growthWeightKg} ${isEn ? 'kg' : 'كجم'}` : ''}
                  </span>
                }
                footerRight={
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenEditChild(kid)}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-extrabold border border-[var(--color-border)] dark:border-[#1E3646] bg-white dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] shadow-2xs cursor-pointer"
                    >
                      {isEn ? 'Edit 3D Profile / Growth' : 'تعديل الملف وقياسات النمو'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onConfirmDeleteChild(kid.id)}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-extrabold border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#142430] text-red-700 dark:text-red-300 cursor-pointer"
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

