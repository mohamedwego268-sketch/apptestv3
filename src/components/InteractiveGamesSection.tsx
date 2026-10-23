import React, { useState } from 'react';
import {
  ChildProfile,
  LanguageCode,
  calculateChildAge,
} from '../domain/familySpaceCore';
import { ThreeDChildAvatar, ThreeDIcon } from './ThreeDVisuals';
import { PrimaryCtaButton } from './DesignSystem';

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
}) => {
  const isEn = language === 'en';
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
        message: isEn
          ? '🌟 Wonderful! Correct 3D shape, color, and count!'
          : '🌟 أحسنت! إجابة صحيحة للمجسم ثلاثي الأبعاد واللون والعدد!',
      });
    } else {
      setShapeFeedback({
        type: 'try_again',
        message: isEn
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
      {/* Parent Approval & Child Stage Selector Bar (Pastel Card) */}
      <div className="rounded-[24px] border border-emerald-200/80 bg-emerald-50/75 p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
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
            <label htmlFor="gameChildSelector" className="block text-xs font-extrabold text-[var(--color-text)]">
              🎮 {isEn ? 'Active Child Player:' : 'ملف الطفل المشارك في اللعب:'}
            </label>
            <div className="flex items-center gap-2 mt-1">
              <select
                id="gameChildSelector"
                value={selectedKidId}
                onChange={(e) => setSelectedKidId(Number(e.target.value))}
                className="rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-extrabold text-[var(--color-text)] shadow-2xs"
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({calculateChildAge(k.birth, language).label})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-emerald-200 text-xs font-extrabold text-[var(--color-text)] cursor-pointer shadow-2xs">
          <input
            type="checkbox"
            checked={parentApprovedSession}
            onChange={(e) => setParentApprovedSession(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          <span>
            🛡️ {isEn ? 'Parent Co-Play Active (15m)' : 'إشراف الوالدين نشط (15 دقيقة)'}
          </span>
        </label>
      </div>

      {/* 2-Column Game Switcher Cards (Matches Home Screen Grid Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <button
          type="button"
          onClick={() => setActiveGame('memory')}
          className={`rounded-2xl border p-4 flex items-center justify-between gap-3 text-start transition-all ${
            activeGame === 'memory'
              ? 'border-purple-500 bg-purple-50/90 shadow-sm'
              : 'border-[var(--color-border)] bg-[var(--color-surface)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-2xl shrink-0">
              🧩
            </div>
            <div>
              <div className="text-sm font-extrabold text-[var(--color-text)]">
                {isEn ? '3D Memory & Vocabulary Match' : 'تطابق الذاكرة والمفردات 3D'}
              </div>
              <div className="text-xs font-bold text-[var(--color-muted)]">
                👶 {isEn ? 'Ages 2–8 Years' : 'لعمر ٢–٨ سنوات'}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 text-xs font-extrabold">
            {matchedPairsCount}/{INITIAL_MEMORY_PAIRS.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveGame('shapes')}
          className={`rounded-2xl border p-4 flex items-center justify-between gap-3 text-start transition-all ${
            activeGame === 'shapes'
              ? 'border-amber-500 bg-amber-50/90 shadow-sm'
              : 'border-[var(--color-border)] bg-[var(--color-surface)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-2xl shrink-0">
              🎨
            </div>
            <div>
              <div className="text-sm font-extrabold text-[var(--color-text)]">
                {isEn ? '3D Shapes, Colors & Counting' : 'اكتشاف المجسمات والألوان 3D'}
              </div>
              <div className="text-xs font-bold text-[var(--color-muted)]">
                👶 {isEn ? 'Ages 0–8 Years' : 'لعمر ٠–٨ سنوات'}
              </div>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-xs font-extrabold">
            ⭐ {shapeScore}
          </span>
        </button>
      </div>

      {!parentApprovedSession ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
          <div className="text-base font-extrabold text-amber-900">
            🔒 {isEn ? 'Parent Session Paused' : 'جلسة اللعب متوقفة مؤقتًا بأمر الوالدين'}
          </div>
        </div>
      ) : activeGame === 'memory' ? (
        /* GAME 1: 3D MEMORY MATCHING */
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
              🧩 {isEn ? 'Tap Two 3D Tiles to Match' : 'اضغط على بطاقتين متماثلتين للمطابقة'}
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold tabular-nums">
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900">
                {isEn ? `Matched: ${matchedPairsCount}/${INITIAL_MEMORY_PAIRS.length}` : `الأزواج: ${matchedPairsCount}/${INITIAL_MEMORY_PAIRS.length}`}
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900">
                {isEn ? `Moves: ${moves}` : `المحاولات: ${moves}`}
              </span>
              <button
                type="button"
                onClick={handleResetMemoryGame}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text)] font-extrabold"
              >
                ↻ {isEn ? 'Restart' : 'إعادة'}
              </button>
            </div>
          </div>

          {matchedPairsCount === INITIAL_MEMORY_PAIRS.length && (
            <div
              className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center text-sm font-extrabold text-emerald-900"
              role="status"
            >
              🎉 {isEn
                ? `Bravo ${activeKid?.name || ''}! Matched all 6 pairs in ${moves} moves!`
                : `أحسنت يا ${activeKid?.name || 'بطل'}! أتممت مطابقة جميع البطاقات في ${moves} محاولة!`}
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
                      ? isEn
                        ? card.labelEn
                        : card.labelAr
                      : isEn
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
                      : '0 8px 16px -6px rgba(38, 28, 46, 0.14), inset 0 2px 4px rgba(255,255,255,0.95)',
                    border: card.matched
                      ? '2px solid #10b981'
                      : isRevealed
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                  }}
                >
                  {isRevealed ? (
                    <>
                      <span className="text-3xl mb-1" aria-hidden="true">
                        {card.emoji}
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {isEn ? card.labelEn : card.labelAr}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">
                        {isEn ? card.labelAr : card.labelEn}
                      </span>
                    </>
                  ) : (
                    <>
                      <ThreeDIcon id="star" size={30} />
                      <span className="text-[11px] font-extrabold text-[var(--color-muted)] mt-1">
                        {isEn ? 'Tap to Flip' : 'اضغط للكشف'}
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
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm sm:text-base font-extrabold text-[var(--color-text)]">
              🎨 {isEn ? currentChallenge.questionEn : currentChallenge.questionAr}
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold tabular-nums">
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900">
                ⭐ {shapeScore}
              </span>
              <PrimaryCtaButton
                variant="orange"
                size="sm"
                onClick={handleNextChallenge}
              >
                {isEn ? 'Next Question →' : 'السؤال التالي ←'}
              </PrimaryCtaButton>
            </div>
          </div>

          {shapeFeedback && (
            <div
              role="status"
              className={`rounded-2xl p-3.5 text-xs font-extrabold ${
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
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col items-center justify-between gap-3 hover:border-[var(--color-accent)] transition-all cursor-pointer shadow-2xs"
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
                    {isEn ? opt.labelEn : opt.labelAr}
                  </div>
                  <div className="text-xs font-bold text-[var(--color-muted)]">
                    {isEn ? opt.labelAr : opt.labelEn}
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
