import React, { useEffect, useMemo, useState } from 'react';
import { calculateChildAge, ChildProfile, LanguageCode, locText } from '../domain/familySpaceCore';
import {
  BedtimeStoryRecord,
  useMasterController,
} from '../services/MasterAppController';

export interface StoriesLibraryViewProps {
  lang?: LanguageCode;
  onShowToast?: (msg: string) => void;
  onScheduleStoryTask?: (taskName: string, timeStr: string, kidId: number | null) => void;
  onOpenChildren?: () => void;
  kids: ChildProfile[];
}

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
    ar: 'التعاون والمحبة بين الإخوة',
    en: 'Sibling Harmony & Kindness',
  },
];

export const StoriesLibraryView: React.FC<StoriesLibraryViewProps> = ({
  lang = 'ar',
  onShowToast,
  onScheduleStoryTask,
  onOpenChildren,
  kids,
}) => {
  const isEn = lang === 'en';
  const master = useMasterController();

  const [selectedChildFilter, setSelectedChildFilter] = useState<'all' | number>('all');
  const [generatorChildId, setGeneratorChildId] = useState<number>(() => kids[0]?.id ?? 0);
  const [themePrompt, setThemePrompt] = useState<string>('');
  const [selectedMoralIdx, setSelectedMoralIdx] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [isReadingStory, setIsReadingStory] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (kids.length === 0) {
      setGeneratorChildId(0);
      setSelectedChildFilter('all');
      return;
    }
    if (!kids.some((kid) => kid.id === generatorChildId)) setGeneratorChildId(kids[0].id);
    if (selectedChildFilter !== 'all' && !kids.some((kid) => kid.id === selectedChildFilter)) setSelectedChildFilter('all');
  }, [kids, generatorChildId, selectedChildFilter]);

  const handleReadStory = () => {
    if (!featuredStory || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      onShowToast?.(isEn ? 'Read-aloud is not available on this device.' : 'القراءة الصوتية مش متاحة على الجهاز ده.');
      return;
    }
    if (isReadingStory) {
      window.speechSynthesis.cancel();
      setIsReadingStory(false);
      return;
    }
    window.speechSynthesis.cancel();
    const text = isEn ? featuredStory.storyBodyEn : featuredStory.storyBodyAr;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isEn ? 'en-US' : 'ar-EG';
    utterance.rate = 0.88;
    utterance.onstart = () => setIsReadingStory(true);
    utterance.onend = () => setIsReadingStory(false);
    utterance.onerror = () => setIsReadingStory(false);
    setIsReadingStory(true);
    window.speechSynthesis.speak(utterance);
  };

  const familyStories = useMemo<BedtimeStoryRecord[]>(() => master.stories.all.filter((story) => {
    const child = kids.find((kid) => kid.id === story.childId);
    if (!child) return false;
    if (story.childRemoteId && child.remoteId) return String(story.childRemoteId) === String(child.remoteId);
    return story.childName === locText(child.name, 'ar') || story.childName === locText(child.name, 'en');
  }), [master.stories.all, kids]);

  const visibleStories = useMemo<BedtimeStoryRecord[]>(() =>
    selectedChildFilter === 'all'
      ? familyStories
      : familyStories.filter((story) => story.childId === selectedChildFilter),
  [familyStories, selectedChildFilter]);

  const featuredStory = useMemo<BedtimeStoryRecord | null>(() => {
    if (activeStoryId) {
      const match = visibleStories.find((s) => s.id === activeStoryId);
      if (match) return match;
    }
    return visibleStories[0] || null;
  }, [activeStoryId, visibleStories]);

  const handleGenerateStory = async () => {
    setIsGenerating(true);
    try {
      const childMeta = kids.find((kid) => kid.id === generatorChildId);
      if (!childMeta) {
        onShowToast?.(isEn ? 'Add a child profile before creating a personalized story.' : 'أضف ملف طفل أولاً قبل تأليف حدوتة مخصصة.');
        return;
      }
      const childName = locText(childMeta.name, lang);
      const moralObj = MORAL_OPTIONS[selectedMoralIdx] || MORAL_OPTIONS[0];

      const created = await master.stories.generate({
        childId: childMeta.id,
        childName,
        childNameEn: locText(childMeta.name, 'en'),
        childBirth: childMeta.birth,
        childRemoteId: childMeta.remoteId,
        themePrompt: themePrompt.trim() || (isEn ? 'A gentle family adventure' : 'مغامرة عائلية لطيفة'),
        moralFocusAr: moralObj.ar,
        moralFocusEn: moralObj.en,
      });

      setActiveStoryId(created.id);
      setSelectedChildFilter(childMeta.id);
      setThemePrompt('');

      onShowToast?.(
        isEn
          ? `✨ Generated and saved a new bedtime story for ${childName}!`
          : `✨ تم تأليف وحفظ حدوتة جديدة لـ ${childName}!`
      );
    } catch {
      onShowToast?.(isEn ? 'Could not save the story. Please try again.' : 'تعذر حفظ الحدوتة. حاول مرة تانية.');
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
                ? 'Bedtime Stories Library'
                : 'مكتبة حواديت قبل النوم'}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
            {isEn
              ? 'Tailored Stories for Every Age Stage'
              : 'قصص وحواديت مخصصة لكل مرحلة عمرية'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-2xl bg-amber-500/15 text-amber-800 dark:text-amber-300 text-xs font-black">
            📚 {familyStories.length} {isEn ? 'Saved Stories' : 'حواديت محفوظة'}
          </span>
        </div>
      </div>

      {/* Story Generator Controls */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-50/40 dark:bg-[#142430]/80 p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black text-[var(--color-text)] dark:text-[#F8FAFC]">
            ✨{' '}
            {isEn
              ? 'Create a Personalized Bedtime Story'
              : 'تأليف حدوتة جديدة حسب المرحلة العمرية والقيمة التربوية'}
          </span>
        </div>

        {/* Select Target Child for Generation */}
        {kids.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-50/50 dark:bg-[#142430] p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1]">{isEn ? 'Add a child profile to personalize stories and link each story to the right child.' : 'أضف ملف طفل علشان نخصص الحواديت ونربط كل حدوتة بملف الطفل الصحيح.'}</p>
            {onOpenChildren && <button type="button" onClick={onOpenChildren} className="min-h-[40px] rounded-xl bg-[#0d9488] px-4 py-2 text-xs font-black text-white">{isEn ? 'Open child profiles' : 'فتح ملفات الأطفال'}</button>}
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {kids.map((c) => {
            const childName = locText(c.name, lang);
            const childAge = calculateChildAge(c.birth, lang).label;
            const active = generatorChildId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                data-testid={`story-gen-select-child-${c.id}`}
                onClick={() => {
                  setGeneratorChildId(c.id);
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
                    <div className="text-xs font-black truncate">{childName}</div>
                    <div
                      className={`text-[10px] font-bold truncate ${
                        active ? 'text-teal-100' : 'text-[var(--color-muted)] dark:text-[#94A3B8]'
                      }`}
                    >
                      {childAge}
                    </div>
                  </div>
                </div>
                {active && <span className="text-xs font-black">✓</span>}
              </button>
            );
          })}
        </div>
        )}

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
              disabled={isGenerating || kids.length === 0}
              onClick={handleGenerateStory}
              className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#FF8C61] hover:bg-[#e86a3d] disabled:opacity-60 text-white text-xs font-black shadow-xs transition-all cursor-pointer"
            >
              {isGenerating
                ? isEn
                  ? 'Generating...'
                  : 'جاري التأليف...'
                : kids.length === 0
                ? isEn ? 'Add a child profile first' : 'أضف ملف طفل أولاً'
                : isEn
                ? '✨ Create Bedtime Story'
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
                ? `All Children (${familyStories.length})`
                : `كل الأطفال (${familyStories.length})`}
            </button>

            {kids.map((c) => {
              const count = familyStories.filter((story) => story.childId === c.id).length;
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
                  {c.emoji} {locText(c.name, lang)} ({count})
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {kids.length === 0 ? (
            <div className="lg:col-span-3 rounded-xl bg-[var(--color-control-muted)]/40 dark:bg-[#142430] p-4 text-center text-xs font-semibold text-[var(--color-muted)]">{isEn ? 'Add a child profile to start a personalized story library.' : 'أضف ملف طفل لبدء مكتبة حواديت مخصصة.'}</div>
          ) : visibleStories.length === 0 ? (
            <div className="lg:col-span-3 rounded-xl border border-dashed border-amber-500/35 bg-amber-50/40 dark:bg-[#142430] p-4 text-center text-xs font-semibold text-[var(--color-muted)]">{isEn ? 'No saved stories for this family yet. Create the first story above.' : 'لسه مفيش حواديت محفوظة للأسرة. ابدأوا بأول حدوتة من الجزء اللي فوق.'}</div>
          ) : visibleStories.map((story) => {
            const storyChild = kids.find((kid) => kid.id === story.childId);
            const storyChildName = storyChild ? locText(storyChild.name, lang) : story.childName;
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
                      👶 {storyChildName} · {story.ageStage}
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
                  + {isEn ? 'Add to Evening Routine' : 'جدولة في روتين المساء'}
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm font-semibold text-[var(--color-text)] dark:text-[#F8FAFC] leading-relaxed">
              {isEn ? featuredStory.storyBodyEn : featuredStory.storyBodyAr}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
              <p className="text-[10px] text-[var(--color-muted)] dark:text-[#94A3B8]">
                {isEn ? 'Listen using your device voice' : 'اسمع الحدوتة بصوت جهازك'}
              </p>
              <button
                type="button"
                data-testid="story-reader-audio-toggle"
                onClick={handleReadStory}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-extrabold inline-flex items-center gap-2"
              >
                <span aria-hidden="true">{isReadingStory ? '⏹' : '🔊'}</span>
                {isReadingStory ? (isEn ? 'Stop listening' : 'إيقاف الاستماع') : (isEn ? 'Listen to story' : 'اسمع الحدوتة')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
