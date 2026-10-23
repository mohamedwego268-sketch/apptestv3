import React, { useState } from 'react';
import {
  ChildProfile,
  LanguageCode,
  calculateChildAge,
} from '../domain/familySpaceCore';
import { ThreeDChildAvatar, ThreeDIcon } from './ThreeDVisuals';

interface InteractiveGamesSectionProps {
  kids: ChildProfile[];
  language: LanguageCode;
  onExitGamesToDashboard: () => void;
}

interface MemoryCard {
  uid: number;
  pairId: string;
  emoji: string;
  labelAr: string;
  labelEn: string;
  colorHex: string;
  flipped: boolean;
  matched: boolean;
}

const INITIAL_MEMORY_PAIRS = [
  { pairId: 'rocket', emoji: '🚀', labelAr: 'صاروخ الفضاء', labelEn: 'Space Rocket', colorHex: '#e0f2fe' },
  { pairId: 'star', emoji: '🌟', labelAr: 'نجمة مضيئة', labelEn: 'Shining Star', colorHex: '#fef3c7' },
  { pairId: 'palette', emoji: '🎨', labelAr: 'لوحة ألوان', labelEn: 'Art Palette', colorHex: '#fce7f3' },
  { pairId: 'book', emoji: '📚', labelAr: 'قصة مصورة', labelEn: 'Story Book', colorHex: '#ede9fe' },
  { pairId: 'tree', emoji: '🌳', labelAr: 'شجرة الطبيعة', labelEn: 'Nature Tree', colorHex: '#dcfce7' },
  { pairId: 'ball', emoji: '⚽', labelAr: 'كرة الرياضة', labelEn: 'Sports Ball', colorHex: '#ffedd5' },
];

function createDeck(): MemoryCard[] {
  const doubled = [...INITIAL_MEMORY_PAIRS, ...INITIAL_MEMORY_PAIRS];
  // Deterministic-friendly shuffle on user action, initial ordered mix so it's immediately playable
  const order = [0, 3, 1, 5, 2, 4, 5, 0, 4, 2, 3, 1];
  return order.map((pairIdx, idx) => {
    const item = doubled[pairIdx];
    return {
      uid: idx + 1,
      pairId: item.pairId,
      emoji: item.emoji,
      labelAr: item.labelAr,
      labelEn: item.labelEn,
      colorHex: item.colorHex,
      flipped: false,
      matched: false,
    };
  });
}

interface ShapeChallenge {
  id: number;
  questionAr: string;
  questionEn: string;
  targetId: string;
  options: {
    id: string;
    labelAr: string;
    labelEn: string;
    shapeSvg: 'sphere' | 'cube' | 'pyramid' | 'cylinder';
    colorGrad: string;
    count: number;
  }[];
}

const SHAPE_CHALLENGES: ShapeChallenge[] = [
  {
    id: 1,
    questionAr: 'اختر المجسم الكروي ثلاثي الأبعاد باللون الوردي (عدد ٢):',
    questionEn: 'Find the 2 Pink 3D Spheres:',
    targetId: 'pink-sphere-2',
    options: [
      {
        id: 'pink-sphere-2',
        labelAr: 'كرتان ورديتان (٢)',
        labelEn: '2 Pink Spheres',
        shapeSvg: 'sphere',
        colorGrad: 'linear-gradient(135deg, #ff9ec7, #d85b90)',
        count: 2,
      },
      {
        id: 'aqua-cube-3',
        labelAr: '٣ مكعبات سماوية (٣)',
        labelEn: '3 Aqua Cubes',
        shapeSvg: 'cube',
        colorGrad: 'linear-gradient(135deg, #84f2ff, #147487)',
        count: 3,
      },
      {
        id: 'amber-pyramid-1',
        labelAr: 'هرم ذهبي واحد (١)',
        labelEn: '1 Golden Pyramid',
        shapeSvg: 'pyramid',
        colorGrad: 'linear-gradient(135deg, #ffe58f, #d97706)',
        count: 1,
      },
    ],
  },
  {
    id: 2,
    questionAr: 'اختر المكعبات السماوية ثلاثية الأبعاد التي عددها ٣:',
    questionEn: 'Select the group with 3 Aqua 3D Cubes:',
    targetId: 'aqua-cube-3',
    options: [
      {
        id: 'violet-cylinder-4',
        labelAr: '٤ أسطوانات بنفسجية (٤)',
        labelEn: '4 Violet Cylinders',
        shapeSvg: 'cylinder',
        colorGrad: 'linear-gradient(135deg, #d8b4fe, #6d28d9)',
        count: 4,
      },
      {
        id: 'aqua-cube-3',
        labelAr: '٣ مكعبات سماوية (٣)',
        labelEn: '3 Aqua Cubes',
        shapeSvg: 'cube',
        colorGrad: 'linear-gradient(135deg, #84f2ff, #147487)',
        count: 3,
      },
      {
        id: 'pink-sphere-2',
        labelAr: 'كرتان ورديتان (٢)',
        labelEn: '2 Pink Spheres',
        shapeSvg: 'sphere',
        colorGrad: 'linear-gradient(135deg, #ff9ec7, #d85b90)',
        count: 2,
      },
    ],
  },
  {
    id: 3,
    questionAr: 'أين توجد ٤ أسطوانات بنفسجية ثلاثية الأبعاد؟',
    questionEn: 'Where are the 4 Violet 3D Cylinders?',
    targetId: 'violet-cylinder-4',
    options: [
      {
        id: 'amber-pyramid-1',
        labelAr: 'هرم ذهبي واحد (١)',
        labelEn: '1 Golden Pyramid',
        shapeSvg: 'pyramid',
        colorGrad: 'linear-gradient(135deg, #ffe58f, #d97706)',
        count: 1,
      },
      {
        id: 'violet-cylinder-4',
        labelAr: '٤ أسطوانات بنفسجية (٤)',
        labelEn: '4 Violet Cylinders',
        shapeSvg: 'cylinder',
        colorGrad: 'linear-gradient(135deg, #d8b4fe, #6d28d9)',
        count: 4,
      },
      {
        id: 'aqua-cube-3',
        labelAr: '٣ مكعبات سماوية (٣)',
        labelEn: '3 Aqua Cubes',
        shapeSvg: 'cube',
        colorGrad: 'linear-gradient(135deg, #84f2ff, #147487)',
        count: 3,
      },
    ],
  },
];

export const InteractiveGamesSection: React.FC<InteractiveGamesSectionProps> = ({
  kids,
  language,
  onExitGamesToDashboard,
}) => {
  const [selectedKidId, setSelectedKidId] = useState<number>(kids[0]?.id || 1);
  const [parentApprovedSession, setParentApprovedSession] = useState<boolean>(true);
  const [activeGame, setActiveGame] = useState<'memory' | 'shapes'>('memory');

  // Game 1: 3D Memory Match State
  const [deck, setDeck] = useState<MemoryCard[]>(() => createDeck());
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);

  // Game 2: 3D Shapes & Counting State
  const [challengeIdx, setChallengeIdx] = useState<number>(0);
  const [shapeScore, setShapeScore] = useState<number>(0);
  const [shapeFeedback, setShapeFeedback] = useState<{ type: 'correct' | 'try_again'; message: string } | null>(null);

  const activeKid = kids.find((k) => Number(k.id) === Number(selectedKidId)) || kids[0];
  const kidAge = activeKid ? calculateChildAge(activeKid.birth, language) : null;
  const matchedPairsCount = deck.filter((c) => c.matched).length / 2;

  const handleCardClick = (index: number) => {
    if (!parentApprovedSession) return;
    const card = deck[index];
    if (!card || card.flipped || card.matched || selectedIndices.length >= 2) return;

    const nextDeck = deck.map((c, idx) => (idx === index ? { ...c, flipped: true } : c));
    const nextSelected = [...selectedIndices, index];
    setDeck(nextDeck);
    setSelectedIndices(nextSelected);

    if (nextSelected.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = nextSelected;
      const firstCard = nextDeck[firstIdx];
      const secondCard = nextDeck[secondIdx];

      if (firstCard.pairId === secondCard.pairId) {
        setDeck((prev) =>
          prev.map((c, idx) =>
            idx === firstIdx || idx === secondIdx ? { ...c, matched: true, flipped: true } : c
          )
        );
        setSelectedIndices([]);
      } else {
        window.setTimeout(() => {
          setDeck((prev) =>
            prev.map((c, idx) =>
              idx === firstIdx || idx === secondIdx ? { ...c, flipped: false } : c
            )
          );
          setSelectedIndices([]);
        }, 650);
      }
    }
  };

  const handleResetMemoryGame = () => {
    setDeck(createDeck());
    setSelectedIndices([]);
    setMoves(0);
  };

  const currentChallenge = SHAPE_CHALLENGES[challengeIdx] || SHAPE_CHALLENGES[0];

  const handleSelectShapeOption = (optionId: string) => {
    if (!parentApprovedSession) return;
    if (optionId === currentChallenge.targetId) {
      setShapeScore((s) => s + 1);
      setShapeFeedback({
        type: 'correct',
        message:
          language === 'en'
            ? '🌟 Wonderful! Correct 3D shape, color, and count!'
            : '🌟 أحسنت! إجابة صحيحة للمجسم ثلاثي الأبعاد واللون والعدد!',
      });
    } else {
      setShapeFeedback({
        type: 'try_again',
        message:
          language === 'en'
            ? '💡 Look closely at the color and count, then try again!'
            : '💡 ركّز في اللون والعدد وجرّب مرة أخرى بهدوء!',
      });
    }
  };

  const handleNextChallenge = () => {
    setShapeFeedback(null);
    setChallengeIdx((prev) => (prev + 1) % SHAPE_CHALLENGES.length);
  };

  return (
    <div className="space-y-5">
      {/* Header & Parent Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ThreeDIcon id="games" size={40} />
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text)]">
              {language === 'en'
                ? 'Interactive 3D Children’s Learning Games'
                : 'ركن الألعاب التعليمية التفاعلية ثلاثية الأبعاد (آمن وتحت إشراف الوالدين)'}
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              {language === 'en'
                ? 'Calm, non-addictive 3D cognitive activities designed for parent-child co-play without dark patterns or ads.'
                : 'أنشطة ذهنية وبصرية هادئة ثلاثية الأبعاد مصممة للعب التشاركي بين الوالدين والطفل، خالية تمامًا من الإعلانات أو أنماط الإدمان.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExitGamesToDashboard}
          className="px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
        >
          {language === 'en' ? '← Exit Games to Parent Dashboard' : '← العودة للوحة تحكم الوالدين'}
        </button>
      </div>

      {/* Parent Approval & Child Stage Selector Bar */}
      <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {activeKid && (
            <ThreeDChildAvatar
              name={activeKid.name}
              gender={activeKid.gender}
              stageCode={kidAge?.stageCode || '2-5'}
              accessoryTheme={activeKid.avatarTheme || 'astronaut'}
              photoDataUrl={activeKid.photoDataUrl}
              useIllustratedAvatar={activeKid.useIllustratedAvatar}
              size="sm"
            />
          )}
          <div>
            <label htmlFor="gameChildSelector" className="block text-xs font-bold text-[var(--color-text)]">
              {language === 'en' ? 'Active Child Profile:' : 'ملف الطفل المشارك في اللعب:'}
            </label>
            <div className="flex items-center gap-2 mt-1">
              <select
                id="gameChildSelector"
                value={selectedKidId}
                onChange={(e) => setSelectedKidId(Number(e.target.value))}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-control-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]"
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({calculateChildAge(k.birth, language).label})
                  </option>
                ))}
              </select>
              {kidAge && (
                <span className="text-xs text-[var(--color-muted)]">
                  · {kidAge.stageTitle}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-control-muted)] text-xs font-semibold text-[var(--color-text)] cursor-pointer">
            <input
              type="checkbox"
              checked={parentApprovedSession}
              onChange={(e) => setParentApprovedSession(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            <span>
              {language === 'en'
                ? 'Parent Co-Play Approval Active (15 min recommended)'
                : 'موافقة الوالدين للجلسة نشطة (موصى بـ 15 دقيقة)'}
            </span>
          </label>
        </div>
      </div>

      {/* Game Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveGame('memory')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeGame === 'memory'
              ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-sm'
              : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
          }`}
        >
          {language === 'en'
            ? '🧩 Game 1: 3D Memory & Vocabulary Match (Ages 2–8)'
            : '🧩 اللعبة الأولى: تطابق الذاكرة والمفردات ثلاثية الأبعاد (٢–٨ سنوات)'}
        </button>
        <button
          type="button"
          onClick={() => setActiveGame('shapes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeGame === 'shapes'
              ? 'bg-[var(--color-accent)] text-[var(--color-accent-contrast)] shadow-sm'
              : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
          }`}
        >
          {language === 'en'
            ? '🎨 Game 2: 3D Shapes, Colors & Counting (Ages 0–8)'
            : '🎨 اللعبة الثانية: اكتشاف المجسمات والألوان والعد 3D (٠–٨ سنوات)'}
        </button>
      </div>

      {!parentApprovedSession ? (
        <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
          <div className="text-base font-bold text-amber-900">
            {language === 'en'
              ? '🔒 Parent Session Approval Paused'
              : '🔒 جلسة اللعب متوقفة مؤقتًا بأمر الوالدين'}
          </div>
          <p className="text-xs text-amber-800">
            {language === 'en'
              ? 'Check the Parent Co-Play Approval toggle above to resume the interactive 3D activity.'
              : 'فعّل خيار «موافقة الوالدين للجلسة» في الشريط العلوي لبدء أو استكمال النشاط التفاعلي مع طفلك.'}
          </p>
        </div>
      ) : activeGame === 'memory' ? (
        /* GAME 1: 3D MEMORY MATCHING */
        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)]">
                {language === 'en'
                  ? '3D Tactile Memory & Bilingual Word Discovery'
                  : 'بطاقات الذاكرة ثلاثية الأبعاد وتسمية الأشياء'}
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                {language === 'en'
                  ? 'Tap any two 3D tiles to flip and match identical objects while reading their names aloud with your child.'
                  : 'اضغط على البطاقات ثلاثية الأبعاد لمطابقة كل زوج متشابه واقرأ اسم الشكل مع طفلك بصوت واضح.'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
              <span className="px-3 py-1.5 rounded-xl bg-[var(--color-control-muted)] text-[var(--color-text)]">
                {language === 'en'
                  ? `Matched: ${matchedPairsCount} / ${INITIAL_MEMORY_PAIRS.length}`
                  : `الأزواج المكتشفة: ${matchedPairsCount} من ${INITIAL_MEMORY_PAIRS.length}`}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-[var(--color-control-muted)] text-[var(--color-text)]">
                {language === 'en' ? `Moves: ${moves}` : `المحاولات: ${moves}`}
              </span>
              <button
                type="button"
                onClick={handleResetMemoryGame}
                className="px-3 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
              >
                {language === 'en' ? '↻ Restart Game' : '↻ إعادة اللعب'}
              </button>
            </div>
          </div>

          {matchedPairsCount === INITIAL_MEMORY_PAIRS.length && (
            <div
              className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-900"
              role="status"
            >
              {language === 'en'
                ? `🎉 Bravo ${activeKid?.name || ''}! You matched all 6 3D pairs in ${moves} moves!`
                : `🎉 أحسنت يا ${activeKid?.name || 'بطل'}! أتممت مطابقة جميع البطاقات ثلاثية الأبعاد في ${moves} محاولة!`}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {deck.map((card, idx) => {
              const isRevealed = card.flipped || card.matched;
              return (
                <button
                  key={card.uid}
                  type="button"
                  onClick={() => handleCardClick(idx)}
                  aria-label={
                    isRevealed
                      ? language === 'en'
                        ? card.labelEn
                        : card.labelAr
                      : language === 'en'
                      ? `Hidden 3D Card ${idx + 1}`
                      : `بطاقة ثلاثية الأبعاد رقم ${idx + 1}`
                  }
                  className="h-28 rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 select-none cursor-pointer"
                  style={{
                    background: isRevealed
                      ? card.colorHex
                      : 'linear-gradient(145deg, #ffffff 0%, #f5ece6 100%)',
                    boxShadow: isRevealed
                      ? '0 10px 20px -6px rgba(38, 28, 46, 0.18), inset 0 2px 4px rgba(255,255,255,0.9)'
                      : '0 8px 16px -6px rgba(38, 28, 46, 0.14), inset 0 2px 4px rgba(255,255,255,0.95), inset 0 -3px 6px rgba(0,0,0,0.06)',
                    border: card.matched
                      ? '2px solid #10b981'
                      : isRevealed
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    transform: isRevealed ? 'perspective(600px) rotateY(0deg) translateY(-2px)' : 'perspective(600px)',
                  }}
                >
                  {isRevealed ? (
                    <>
                      <span className="text-3xl mb-1" aria-hidden="true">
                        {card.emoji}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {language === 'en' ? card.labelEn : card.labelAr}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {language === 'en' ? card.labelAr : card.labelEn}
                      </span>
                    </>
                  ) : (
                    <>
                      <ThreeDIcon id="star" size={30} />
                      <span className="text-[11px] font-bold text-[var(--color-muted)] mt-1">
                        {language === 'en' ? 'Tap to Flip 3D' : 'اضغط لكشف البطاقة'}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* GAME 2: 3D SHAPES, COLORS & COUNTING */
        <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)]">
                {language === 'en'
                  ? '3D Shapes, Colors & Counting Studio'
                  : 'استوديو المجسمات والألوان والعد ثلاثي الأبعاد'}
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                {language === 'en'
                  ? 'Strengthen visual perception, counting, and bilingual shape recognition.'
                  : 'لتقوية الإدراك البصري والعدّ والتمييز بين الأشكال ثلاثية الأبعاد باللغتين العربية والإنجليزية.'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold tabular-nums">
              <span className="px-3 py-1.5 rounded-xl bg-[var(--color-control-muted)] text-[var(--color-text)]">
                {language === 'en' ? `⭐ Stars Earned: ${shapeScore}` : `⭐ النجوم المكتسبة: ${shapeScore}`}
              </span>
              <button
                type="button"
                onClick={handleNextChallenge}
                className="px-3 py-1.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-contrast)]"
              >
                {language === 'en' ? 'Next Question →' : 'السؤال التالي ←'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--color-control-muted)] p-4 text-base font-extrabold text-[var(--color-text)]">
            {language === 'en' ? currentChallenge.questionEn : currentChallenge.questionAr}
          </div>

          {shapeFeedback && (
            <div
              role="status"
              className={`rounded-xl p-3 text-xs font-bold ${
                shapeFeedback.type === 'correct'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border border-amber-300'
              }`}
            >
              {shapeFeedback.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentChallenge.options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectShapeOption(opt.id)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col items-center justify-between gap-3 hover:border-[var(--color-accent)] transition-all cursor-pointer"
                style={{
                  boxShadow:
                    '0 10px 22px -8px rgba(38, 28, 46, 0.14), inset 0 2px 4px rgba(255,255,255,0.9)',
                }}
              >
                <div className="flex items-center justify-center gap-2 min-h-[56px]">
                  {Array.from({ length: opt.count }).map((_, i) => (
                    <span
                      key={i}
                      className="w-11 h-11 rounded-xl inline-block shadow-md"
                      style={{
                        background: opt.colorGrad,
                        borderRadius:
                          opt.shapeSvg === 'sphere'
                            ? '9999px'
                            : opt.shapeSvg === 'cylinder'
                            ? '14px / 22px'
                            : '12px',
                        boxShadow:
                          'inset 0 3px 6px rgba(255,255,255,0.7), 0 6px 12px rgba(0,0,0,0.16)',
                      }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-[var(--color-text)]">
                    {language === 'en' ? opt.labelEn : opt.labelAr}
                  </div>
                  <div className="text-xs text-[var(--color-muted)]">
                    {language === 'en' ? opt.labelAr : opt.labelEn}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
