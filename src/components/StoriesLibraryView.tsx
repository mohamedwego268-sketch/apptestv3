import React, { useMemo, useState } from 'react';
import { LanguageCode } from '../domain/familySpaceCore';
import {
  BedtimeStoryRecord,
  useMasterController,
} from '../services/MasterAppController';

export interface StoriesLibraryViewProps {
  lang?: LanguageCode;
  onShowToast?: (msg: string) => void;
  onScheduleStoryTask?: (taskName: string, timeStr: string, kidId: number | null) => void;
}

const CHILD_STORY_PROFILES: Array<{
  id: 1 | 2 | 3;
  nameAr: string;
  nameEn: string;
  stageAr: string;
  stageEn: string;
  emoji: string;
  defaultMoralAr: string;
  defaultMoralEn: string;
}> = [
  {
    id: 1,
    nameAr: 'حمزة',
    nameEn: 'Hamza',
    stageAr: '٦ شهور · تهدئة حسية وإيقاع 60 BPM',
    stageEn: '6 Months · Sensory Lullaby & 60 BPM Calm',
    emoji: '👶🏻',
    defaultMoralAr: 'الأمان العاطفي والهدوء الحسي',
    defaultMoralEn: 'Emotional Security & Sensory Calm',
  },
  {
    id: 2,
    nameAr: 'ليلى',
    nameEn: 'Laila',
    stageAr: '٤ سنوات · خيال الحضانة والألوان',
    stageEn: '4 Years · Nursery Wonder & Colors',
    emoji: '🎨',
    defaultMoralAr: 'المشاركة اللطيفة والخيال الإبداعي',
    defaultMoralEn: 'Kind Sharing & Creative Imagination',
  },
  {
    id: 3,
    nameAr: 'يوسف',
    nameEn: 'Youssef',
    stageAr: '٨ سنوات · مغامرات الأبطال والعلوم',
    stageEn: '8 Years · Champions, Science & Courage',
    emoji: '🏆',
    defaultMoralAr: 'المسؤولية والثقة بالنفس والامتنان المسائي',
    defaultMoralEn: 'Responsibility, Confidence & Evening Gratitude',
  },
];

const MORAL_OPTIONS: Array<{ ar: string; en: string }> = [
  {
    ar: 'الأمان العاطفي والهدوء الحسي',
    en: 'Emotional Security & Sensory Calm',
  },
  {
    ar: 'المشاركة اللطيفة والخيال الإبداعي',
    en: 'Kind Sharing & Creative Imagination',
  },
  {
    ar: 'المسؤولية والثقة بالنفس والامتنان المسائي',
    en: 'Responsibility, Confidence & Evening Gratitude',
  },
  {
    ar: 'التعاون والمحبة بين الإخوة (حمزة وليلى ويوسف)',
    en: 'Sibling Harmony (Hamza, Laila & Youssef)',
  },
];

export const StoriesLibraryView: React.FC<StoriesLibraryViewProps> = ({
  lang = 'ar',
  onShowToast,
  onScheduleStoryTask,
}) => {
  const isEn = lang === 'en';
  const master = useMasterController();

  const [selectedChildFilter, setSelectedChildFilter] = useState<'all' | 1 | 2 | 3>('all');
  const [generatorChildId, setGeneratorChildId] = useState<1 | 2 | 3>(2);
  const [themePrompt, setThemePrompt] = useState<string>('');
  const [selectedMoralIdx, setSelectedMoralIdx] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  const visibleStories = useMemo<BedtimeStoryRecord[]>(() => {
    if (selectedChildFilter === 'all') {
      return master.stories.all;
    }
    return master.stories.getForChild(selectedChildFilter);
  }, [master.stories, selectedChildFilter]);

  const featuredStory = useMemo<BedtimeStoryRecord | null>(() => {
    if (activeStoryId) {
      const match = master.stories.all.find((s) => s.id === activeStoryId);
      if (match) return match;
    }
    return visibleStories[0] || master.stories.all[0] || null;
  }, [activeStoryId, visibleStories, master.stories.all]);

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    try {
      const childMeta =
        CHILD_STORY_PROFILES.find((c) => c.id === generatorChildId) ||
        CHILD_STORY_PROFILES[0];
      const moralObj = MORAL_OPTIONS[selectedMoralIdx] || MORAL_OPTIONS[0];

      const created = await master.stories.generate({
        childId: generatorChildId,
        childName: childMeta.nameAr,
        themePrompt:
          themePrompt.trim() ||
          (isEn
            ? 'The glowing lantern in Ahmad & Maryam’s warm garden'
            : 'الفانوس المضيء في حديقة بيت أحمد ومريم الدافئة'),
        moralFocus: isEn ? moralObj.en : moralObj.ar,
      });

      setActiveStoryId(created.id);
      setSelectedChildFilter(generatorChildId);
      setThemePrompt('');

      onShowToast?.(
        isEn
          ? `✨ Generated new bedtime story (${created.sequenceCode}) for ${childMeta.nameEn}!`
          : `✨ تم تأليف وحفظ حدوتة جديدة (${created.sequenceCode}) لـ ${childMeta.nameAr}!`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      id="stories-library-view"
      data-testid="stories-library-view"
      dir={isEn ? 'ltr' : 'rtl'}
      className="rounded-3xl border border-amber-500/35 dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0F1B24] p-4 sm:p-5 space-y-5 shadow-xs"
    >
      {/* Library Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]/60 dark:border-[#1E3646]">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-2">
            <span className="text-sm">🌙</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
              {isEn
                ? 'AI Bedtime Stories Library · MasterAppController'
                : 'مكتبة حواديت قبل النوم الذكية · متصلة بـ MasterController'}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
            {isEn
              ? 'Tailored Stories for Hamza (6m), Laila (4y) & Youssef (8y)'
              : 'قصص وحواديت مخصصة لمراحل حمزة (٦ شهور) وليلى (٤ سنوات) ويوسف (٨ سنوات)'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-2xl bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black">
            📚 {master.stories.all.length} {isEn ? 'Saved Stories' : 'حواديت محفوظة'}
          </span>
        </div>
      </div>

      {/* Story Generator Controls */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-50/40 dark:bg-[#142430]/80 p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
            ✨{' '}
            {isEn
              ? 'Generate New AI Story Tailored to Age Stage & Moral Value'
              : 'تأليف حدوتة جديدة بالذكاء الاصطناعي حسب المرحلة العمرية والقيمة التربوية'}
          </span>
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
            {isEn ? 'Auto-numbered STR-XXXX' : 'ترقيم تلقائي STR-XXXX'}
          </span>
        </div>

        {/* Select Target Child for Generation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CHILD_STORY_PROFILES.map((c) => {
            const active = generatorChildId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                data-testid={`story-gen-select-child-${c.id}`}
                onClick={() => {
                  setGeneratorChildId(c.id);
                  setSelectedMoralIdx(c.id - 1);
                }}
                className={`min-h-[48px] p-2.5 rounded-xl border text-start transition-all flex items-center justify-between gap-2 cursor-pointer ${
                  active
                    ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-xs'
                    : 'bg-[var(--color-surface)] dark:bg-[#0B131A] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{c.emoji}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">
                      {isEn ? c.nameEn : c.nameAr}
                    </div>
                    <div
                      className={`text-[10px] font-bold truncate ${
                        active ? 'text-teal-100' : 'text-[var(--color-muted)] dark:text-[#94A3B8]'
                      }`}
                    >
                      {isEn ? c.stageEn : c.stageAr}
                    </div>
                  </div>
                </div>
                {active && <span className="text-xs font-black">✓</span>}
              </button>
            );
          })}
        </div>

        {/* Theme Input & Moral Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          <div className="lg:col-span-5 space-y-1">
            <label className="block text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
              {isEn ? 'Story Idea or Theme:' : 'فكرة الحدوتة أو بطل القصة:'}
            </label>
            <input
              type="text"
              data-testid="stories-library-theme-input"
              value={themePrompt}
              onChange={(e) => setThemePrompt(e.target.value)}
              placeholder={
                isEn
                  ? 'e.g. A friendly star visiting our home in Dammam...'
                  : 'مثال: نجمة المساء التي زارت غرفة أطفالنا...'
              }
              className="w-full min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A] px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] dark:text-[#F8FAFC]"
            />
          </div>

          <div className="lg:col-span-4 space-y-1">
            <label className="block text-[11px] font-extrabold text-[var(--color-text)] dark:text-[#F8FAFC]">
              {isEn ? 'Moral & Educational Preference:' : 'القيمة التربوية المفضلة:'}
            </label>
            <select
              data-testid="stories-library-moral-select"
              value={selectedMoralIdx}
              onChange={(e) => setSelectedMoralIdx(Number(e.target.value))}
              className="w-full min-h-[42px] rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#0B131A] px-3 py-2 text-xs font-bold text-[var(--color-text)] dark:text-[#F8FAFC]"
            >
              {MORAL_OPTIONS.map((m, idx) => (
                <option key={m.en} value={idx}>
                  {isEn ? m.en : m.ar}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <button
              type="button"
              data-testid="stories-library-generate-btn"
              disabled={isGenerating}
              onClick={handleGenerateStory}
              className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#FF8C61] hover:bg-[#e86a3d] disabled:opacity-60 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              {isGenerating
                ? isEn
                  ? 'Generating...'
                  : 'جاري التأليف...'
                : isEn
                ? '✨ Generate AI Bedtime Story'
                : '✨ تأليف حدوتة جديدة بالذكاء الاصطناعي'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs per Child + Story Cards Grid */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-testid="stories-filter-all"
              onClick={() => setSelectedChildFilter('all')}
              className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                selectedChildFilter === 'all'
                  ? 'bg-[#0d9488] text-white border-[#0d9488]'
                  : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
              }`}
            >
              {isEn
                ? `All Children (${master.stories.all.length})`
                : `كل الأطفال (${master.stories.all.length})`}
            </button>

            {CHILD_STORY_PROFILES.map((c) => {
              const count = master.stories.getForChild(c.id).length;
              const active = selectedChildFilter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  data-testid={`stories-filter-child-${c.id}`}
                  onClick={() => setSelectedChildFilter(c.id)}
                  className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0d9488] text-white border-[#0d9488]'
                      : 'bg-[var(--color-control-muted)] dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646]'
                  }`}
                >
                  {c.emoji} {isEn ? c.nameEn : c.nameAr} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {visibleStories.map((story) => {
            const isSelected = featuredStory?.id === story.id;
            return (
              <div
                key={story.id}
                data-testid={`story-library-card-${story.sequenceCode}`}
                onClick={() => setActiveStoryId(story.id)}
                className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#0d9488] bg-teal-500/5 dark:bg-[#142430] shadow-xs'
                    : 'border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-muted)]/35 dark:bg-[#142430]/60 hover:border-amber-500/40'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-300 text-[10.5px] font-black tabular-nums">
                      {story.sequenceCode}
                    </span>
                    <span className="text-[11px] font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
                      👶 {story.childName} · {story.ageStage}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC] leading-snug">
                    {isEn ? story.titleEn : story.titleAr}
                  </h4>

                  <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-relaxed line-clamp-3">
                    {isEn ? story.storyBodyEn : story.storyBodyAr}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)]/60 dark:border-[#1E3646] flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                  <span className="text-amber-800 dark:text-amber-300 truncate max-w-[70%]">
                    🌱 {isEn ? story.moralTagEn : story.moralTagAr}
                  </span>
                  <span className="text-[var(--color-muted)] dark:text-[#94A3B8] tabular-nums">
                    ⏱️ {story.durationMinutes}m · {story.calmingTempoBpm} BPM
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Story Reader Panel */}
        {featuredStory && (
          <div
            data-testid="stories-library-reader-panel"
            className="rounded-2xl border border-amber-500/35 bg-amber-50/50 dark:bg-[#142430] p-4 space-y-2.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-black">
                  {featuredStory.sequenceCode}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
                  {isEn ? featuredStory.titleEn : featuredStory.titleAr}
                </h4>
              </div>

              {onScheduleStoryTask && (
                <button
                  type="button"
                  onClick={() =>
                    onScheduleStoryTask(
                      isEn ? featuredStory.titleEn : featuredStory.titleAr,
                      '08:15 م',
                      featuredStory.childId
                    )
                  }
                  className="min-h-[34px] px-3 py-1 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-[11px] font-extrabold cursor-pointer"
                >
                  + {isEn ? 'Add to Evening Routine (8:15 PM)' : 'جدولة في روتين المساء (8:15 م)'}
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed">
              {isEn ? featuredStory.storyBodyEn : featuredStory.storyBodyAr}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
