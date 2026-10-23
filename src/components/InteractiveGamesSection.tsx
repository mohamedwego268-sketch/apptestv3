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

type KidsGameId = 'memory' | 'coloring' | 'puzzle' | 'math';

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

// GAME 2: INTERACTIVE COLORING STUDIO PALETTE & REGIONS
const COLORING_PALETTE = [
  { hex: '#f97316', nameAr: 'برتقالي مشرق', nameEn: 'Sunny Orange' },
  { hex: '#ec4899', nameAr: 'وردي مرح', nameEn: 'Playful Pink' },
  { hex: '#3b82f6', nameAr: 'أزرق سماوي', nameEn: 'Sky Blue' },
  { hex: '#10b981', nameAr: 'أخضر زمردي', nameEn: 'Emerald Green' },
  { hex: '#eab308', nameAr: 'أصفر ذهبي', nameEn: 'Golden Yellow' },
  { hex: '#8b5cf6', nameAr: 'بنفسجي ملكي', nameEn: 'Royal Purple' },
  { hex: '#14b8a6', nameAr: 'فيروزي هادئ', nameEn: 'Calm Teal' },
  { hex: '#ef4444', nameAr: 'أحمر ناري', nameEn: 'Bright Red' },
];

interface ColoringRegion {
  id: 'nose' | 'body' | 'window' | 'leftFin' | 'rightFin' | 'flame';
  labelAr: string;
  labelEn: string;
  defaultColor: string;
}

const COLORING_REGIONS: ColoringRegion[] = [
  { id: 'nose', labelAr: 'قمة الصاروخ', labelEn: 'Rocket Cone', defaultColor: '#f97316' },
  { id: 'body', labelAr: 'جسم الصاروخ', labelEn: 'Rocket Body', defaultColor: '#e0f2fe' },
  { id: 'window', labelAr: 'نافذة رائد الفضاء', labelEn: 'Space Window', defaultColor: '#eab308' },
  { id: 'leftFin', labelAr: 'الجناح الأيسر', labelEn: 'Left Wing', defaultColor: '#8b5cf6' },
  { id: 'rightFin', labelAr: 'الجناح الأيمن', labelEn: 'Right Wing', defaultColor: '#8b5cf6' },
  { id: 'flame', labelAr: 'شعلة الانطلاق', labelEn: 'Booster Flame', defaultColor: '#ec4899' },
];

// GAME 3: SIMPLE PICTURE PUZZLE (4 TILES)
interface PuzzleTileItem {
  correctSlot: number;
  emoji: string;
  titleAr: string;
  titleEn: string;
  bgHex: string;
}

const PUZZLE_TILES_BASE: PuzzleTileItem[] = [
  { correctSlot: 0, emoji: '☀️', titleAr: '١. شمس الصباح', titleEn: '1. Morning Sun', bgHex: '#fef3c7' },
  { correctSlot: 1, emoji: '🌈', titleAr: '٢. قوس المطر', titleEn: '2. Rainbow Sky', bgHex: '#e0f2fe' },
  { correctSlot: 2, emoji: '🏡', titleAr: '٣. بيت العائلة', titleEn: '3. Family Home', bgHex: '#fce7f3' },
  { correctSlot: 3, emoji: '🌳', titleAr: '٤. حديقة الزهور', titleEn: '4. Flower Garden', bgHex: '#dcfce7' },
];

// GAME 4: QUICK VISUAL MATH GAME
interface MathChallengeItem {
  id: number;
  questionAr: string;
  questionEn: string;
  leftCount: number;
  rightCount: number;
  operator: '+' | '-';
  emoji: string;
  correctAnswer: number;
  options: number[];
}

const MATH_CHALLENGES: MathChallengeItem[] = [
  {
    id: 1,
    questionAr: 'كم عدد التفاحات الإجمالي في السلة؟',
    questionEn: 'How many apples in total?',
    leftCount: 3,
    rightCount: 2,
    operator: '+',
    emoji: '🍎',
    correctAnswer: 5,
    options: [4, 5, 6],
  },
  {
    id: 2,
    questionAr: 'اجمع النجوم المضيئة في السماء:',
    questionEn: 'Add the shining stars together:',
    leftCount: 4,
    rightCount: 3,
    operator: '+',
    emoji: '⭐',
    correctAnswer: 7,
    options: [6, 7, 8],
  },
  {
    id: 3,
    questionAr: 'لدينا ٥ بالونات طارت منها ٢، كم بقي؟',
    questionEn: 'We had 5 balloons and 2 flew away. How many left?',
    leftCount: 5,
    rightCount: 2,
    operator: '-',
    emoji: '🎈',
    correctAnswer: 3,
    options: [2, 3, 4],
  },
  {
    id: 4,
    questionAr: 'كم عدد الفراشات الملونة في الحديقة؟',
    questionEn: 'Count all the colorful butterflies:',
    leftCount: 4,
    rightCount: 4,
    operator: '+',
    emoji: '🦋',
    correctAnswer: 8,
    options: [7, 8, 9],
  },
];

export const InteractiveGamesSection: React.FC<InteractiveGamesSectionProps> = ({
  kids,
  language,
}) => {
  const isEn = language === 'en';
  const [selectedKidId, setSelectedKidId] = useState<number>(kids[0]?.id || 1);
  const [parentApprovedSession, setParentApprovedSession] = useState<boolean>(true);
  const [activeGame, setActiveGame] = useState<KidsGameId>('memory');

  // Game 1: Memory Match State
  const [deck, setDeck] = useState<MemoryCard[]>(() => createDeck());
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);

  // Game 2: Coloring Studio State
  const [selectedBrushColor, setSelectedBrushColor] = useState<string>(COLORING_PALETTE[0].hex);
  const [regionColors, setRegionColors] = useState<Record<ColoringRegion['id'], string>>({
    nose: '#f97316',
    body: '#e0f2fe',
    window: '#eab308',
    leftFin: '#8b5cf6',
    rightFin: '#8b5cf6',
    flame: '#ec4899',
  });
  const [coloringTapsCount, setColoringTapsCount] = useState<number>(0);

  // Game 3: Simple Puzzle State
  const [puzzleOrder, setPuzzleOrder] = useState<number[]>([2, 0, 3, 1]);
  const [selectedTileSlot, setSelectedTileSlot] = useState<number | null>(null);
  const [puzzleMoves, setPuzzleMoves] = useState<number>(0);

  // Game 4: Math Challenge State
  const [mathIdx, setMathIdx] = useState<number>(0);
  const [mathScore, setMathScore] = useState<number>(0);
  const [mathFeedback, setMathFeedback] = useState<{ type: 'correct' | 'retry'; text: string } | null>(null);

  const activeKid = kids.find((k) => Number(k.id) === Number(selectedKidId)) || kids[0];
  const kidAge = activeKid ? calculateChildAge(activeKid.birth, language) : null;
  const matchedPairsCount = deck.filter((c) => c.matched).length / 2;
  const isPuzzleSolved = puzzleOrder.every((tileIdx, slotIdx) => tileIdx === slotIdx);
  const currentMath = MATH_CHALLENGES[mathIdx % MATH_CHALLENGES.length];

  // Memory Game Handlers
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

  // Coloring Game Handlers
  const handlePaintRegion = (regionId: ColoringRegion['id']) => {
    if (!parentApprovedSession) return;
    setRegionColors((prev) => ({ ...prev, [regionId]: selectedBrushColor }));
    setColoringTapsCount((c) => c + 1);
  };

  const handleResetColoring = () => {
    setRegionColors({
      nose: '#f8fafc',
      body: '#f8fafc',
      window: '#f8fafc',
      leftFin: '#f8fafc',
      rightFin: '#f8fafc',
      flame: '#f8fafc',
    });
    setColoringTapsCount(0);
  };

  // Puzzle Game Handlers
  const handleTileTap = (slotIdx: number) => {
    if (!parentApprovedSession) return;
    if (selectedTileSlot === null) {
      setSelectedTileSlot(slotIdx);
      return;
    }
    if (selectedTileSlot === slotIdx) {
      setSelectedTileSlot(null);
      return;
    }
    setPuzzleOrder((prev) => {
      const next = [...prev];
      const temp = next[selectedTileSlot];
      next[selectedTileSlot] = next[slotIdx];
      next[slotIdx] = temp;
      return next;
    });
    setPuzzleMoves((m) => m + 1);
    setSelectedTileSlot(null);
  };

  const handleShufflePuzzle = () => {
    setPuzzleOrder([2, 0, 3, 1]);
    setSelectedTileSlot(null);
    setPuzzleMoves(0);
  };

  // Math Game Handlers
  const handleAnswerMath = (choice: number) => {
    if (!parentApprovedSession) return;
    if (choice === currentMath.correctAnswer) {
      setMathScore((s) => s + 1);
      setMathFeedback({
        type: 'correct',
        text: isEn
          ? `🌟 Awesome! ${currentMath.leftCount} ${currentMath.operator} ${currentMath.rightCount} = ${currentMath.correctAnswer}`
          : `🌟 ممتاز يا بطل! ${currentMath.leftCount} ${currentMath.operator} ${currentMath.rightCount} = ${currentMath.correctAnswer}`,
      });
    } else {
      setMathFeedback({
        type: 'retry',
        text: isEn
          ? '💡 Count the shapes carefully and try again!'
          : '💡 عُدّ الأشكال بهدوء وجرّب مرة أخرى!',
      });
    }
  };

  const handleNextMath = () => {
    setMathFeedback(null);
    setMathIdx((prev) => (prev + 1) % MATH_CHALLENGES.length);
  };

  return (
    <div className="space-y-4">
      {/* Parent Approval & Child Stage Selector Bar */}
      <div className="rounded-[20px] border border-emerald-200/80 bg-emerald-50/75 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
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
                className="rounded-xl border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-extrabold text-[var(--color-text)] shadow-2xs"
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

        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-extrabold text-[var(--color-text)] cursor-pointer shadow-2xs">
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

      {/* 4-Game Grid Switcher Cards (Memory, Coloring, Puzzle, Math) */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5"
        role="tablist"
        aria-label={isEn ? 'Choose a Kids Game' : 'اختر اللعبة التعليمية'}
      >
        {[
          {
            id: 'memory' as KidsGameId,
            emoji: '🃏',
            titleAr: 'لعبة الذاكرة',
            titleEn: 'Memory Match',
            subAr: 'مطابقة البطاقات',
            subEn: 'Flip & Match Pairs',
            badge: `${matchedPairsCount}/${INITIAL_MEMORY_PAIRS.length}`,
            activeClass: 'border-purple-500 bg-purple-50/90',
            badgeClass: 'bg-purple-100 text-purple-900',
          },
          {
            id: 'coloring' as KidsGameId,
            emoji: '🎨',
            titleAr: 'مرسم التلوين',
            titleEn: 'Coloring Studio',
            subAr: 'تلوين صاروخ الفضاء',
            subEn: 'Paint Space Rocket',
            badge: `${coloringTapsCount} 🎨`,
            activeClass: 'border-pink-500 bg-pink-50/90',
            badgeClass: 'bg-pink-100 text-pink-900',
          },
          {
            id: 'puzzle' as KidsGameId,
            emoji: '🧩',
            titleAr: 'تركيب البازل',
            titleEn: 'Picture Puzzle',
            subAr: 'ترتيب لوحة الطبيعة',
            subEn: 'Swap & Solve Tiles',
            badge: isPuzzleSolved ? '✓' : `${puzzleMoves}`,
            activeClass: 'border-sky-500 bg-sky-50/90',
            badgeClass: 'bg-sky-100 text-sky-900',
          },
          {
            id: 'math' as KidsGameId,
            emoji: '🔢',
            titleAr: 'الحساب الذهني',
            titleEn: 'Quick Math',
            subAr: 'عدّ وجمع الأشكال',
            subEn: 'Count & Add Fun',
            badge: `⭐ ${mathScore}`,
            activeClass: 'border-amber-500 bg-amber-50/90',
            badgeClass: 'bg-amber-100 text-amber-900',
          },
        ].map((g) => {
          const isCurrent = activeGame === g.id;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              onClick={() => setActiveGame(g.id)}
              className={`rounded-2xl border p-3 flex flex-col justify-between gap-2 text-start transition-all cursor-pointer ${
                isCurrent
                  ? `${g.activeClass} shadow-2xs ring-2 ring-black/5`
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]'
              }`}
            >
              <div className="w-full flex items-center justify-between gap-2">
                <span className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-xl shrink-0">
                  {g.emoji}
                </span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold tabular-nums ${g.badgeClass}`}>
                  {g.badge}
                </span>
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate">
                  {isEn ? g.titleEn : g.titleAr}
                </div>
                <div className="text-[11px] font-bold text-[var(--color-muted)] truncate">
                  {isEn ? g.subEn : g.subAr}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!parentApprovedSession ? (
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-5 text-center space-y-2">
          <div className="text-sm font-extrabold text-amber-900">
            🔒 {isEn ? 'Parent Session Paused' : 'جلسة اللعب متوقفة مؤقتًا بأمر الوالدين'}
          </div>
        </div>
      ) : activeGame === 'memory' ? (
        /* =================================================================
           GAME 1: 3D MEMORY MATCHING
           ================================================================= */
        <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
              🃏 {isEn ? 'Tap Two Tiles to Match Pairs' : 'اضغط على بطاقتين متماثلتين للمطابقة'}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold tabular-nums">
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-900">
                {isEn
                  ? `Matched: ${matchedPairsCount}/${INITIAL_MEMORY_PAIRS.length}`
                  : `الأزواج: ${matchedPairsCount}/${INITIAL_MEMORY_PAIRS.length}`}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900">
                {isEn ? `Moves: ${moves}` : `المحاولات: ${moves}`}
              </span>
              <button
                type="button"
                onClick={handleResetMemoryGame}
                className="min-h-[34px] px-3 py-1 rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-text)] font-extrabold"
              >
                ↻ {isEn ? 'Restart' : 'إعادة'}
              </button>
            </div>
          </div>

          {matchedPairsCount === INITIAL_MEMORY_PAIRS.length && (
            <div
              className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-center text-xs font-extrabold text-emerald-900"
              role="status"
            >
              🎉{' '}
              {isEn
                ? `Bravo ${activeKid?.name || ''}! Matched all 6 pairs in ${moves} moves!`
                : `أحسنت يا ${activeKid?.name || 'بطل'}! أتممت مطابقة جميع البطاقات في ${moves} محاولة!`}
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
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
                  className="h-24 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center transition-all duration-200 select-none cursor-pointer"
                  style={{
                    background: isRevealed
                      ? card.colorHex
                      : 'linear-gradient(145deg, #ffffff 0%, #f5ece6 100%)',
                    boxShadow: isRevealed
                      ? '0 8px 16px -6px rgba(38, 28, 46, 0.16), inset 0 2px 4px rgba(255,255,255,0.9)'
                      : '0 6px 14px -6px rgba(38, 28, 46, 0.12), inset 0 2px 4px rgba(255,255,255,0.95)',
                    border: card.matched
                      ? '2px solid #10b981'
                      : isRevealed
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                  }}
                >
                  {isRevealed ? (
                    <>
                      <span className="text-2xl mb-0.5" aria-hidden="true">
                        {card.emoji}
                      </span>
                      <span className="text-[11px] font-extrabold text-slate-900 line-clamp-1">
                        {isEn ? card.labelEn : card.labelAr}
                      </span>
                    </>
                  ) : (
                    <>
                      <ThreeDIcon id="star" size={26} />
                      <span className="text-[10px] font-extrabold text-[var(--color-muted)] mt-1">
                        {isEn ? 'Flip' : 'اكشف'}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : activeGame === 'coloring' ? (
        /* =================================================================
           GAME 2: INTERACTIVE COLORING STUDIO (مرسم التلوين التفاعلي)
           ================================================================= */
        <div className="rounded-[22px] border border-pink-200/90 bg-[var(--color-surface)] p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                🎨 {isEn ? 'Interactive Space Rocket Coloring Studio' : 'مرسم التلوين التفاعلي: لوّن صاروخ الفضاء'}
              </h3>
              <p className="text-[11px] font-semibold text-[var(--color-muted)]">
                {isEn
                  ? 'Pick a brush color below, then tap any part of the rocket or buttons to paint it!'
                  : 'اختر لون الفرشاة بالأسفل ثم اضغط على أي جزء من الصاروخ لتلوينه فورًا!'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetColoring}
              className="min-h-[34px] px-3 py-1 rounded-xl border border-[var(--color-border)] bg-white text-xs font-extrabold text-[var(--color-text)]"
            >
              🧼 {isEn ? 'Clear Canvas' : 'مسح الألوان'}
            </button>
          </div>

          {/* Brush Palette Selector */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-pink-50/60 border border-pink-200/70">
            <span className="text-xs font-extrabold text-pink-950 me-1">
              🖌️ {isEn ? 'Brush Color:' : 'لون الفرشاة:'}
            </span>
            {COLORING_PALETTE.map((col) => {
              const isSelected = selectedBrushColor === col.hex;
              return (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setSelectedBrushColor(col.hex)}
                  aria-label={isEn ? col.nameEn : col.nameAr}
                  className={`w-8 h-8 rounded-full transition-transform cursor-pointer ${
                    isSelected ? 'scale-115 ring-3 ring-slate-900 shadow-sm' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.hex }}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4 items-center">
            {/* Interactive SVG Rocket Canvas */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 p-4 flex flex-col items-center justify-center">
              <svg
                viewBox="0 0 260 240"
                className="w-full max-w-[260px] h-52 select-none"
                role="img"
                aria-label={isEn ? 'Colorable Space Rocket' : 'لوحة تلوين صاروخ الفضاء'}
              >
                {/* Stars in background */}
                <circle cx="35" cy="40" r="3" fill="#fde047" />
                <circle cx="220" cy="50" r="4" fill="#fde047" />
                <circle cx="48" cy="180" r="2.5" fill="#bae6fd" />
                <circle cx="215" cy="175" r="3" fill="#f9a8d4" />

                {/* Left Fin */}
                <polygon
                  points="85,130 45,175 85,175"
                  fill={regionColors.leftFin}
                  stroke="#ffffff"
                  strokeWidth="3"
                  className="cursor-pointer transition-colors"
                  onClick={() => handlePaintRegion('leftFin')}
                />
                {/* Right Fin */}
                <polygon
                  points="175,130 215,175 175,175"
                  fill={regionColors.rightFin}
                  stroke="#ffffff"
                  strokeWidth="3"
                  className="cursor-pointer transition-colors"
                  onClick={() => handlePaintRegion('rightFin')}
                />
                {/* Rocket Body */}
                <rect
                  x="85"
                  y="75"
                  width="90"
                  height="100"
                  rx="16"
                  fill={regionColors.body}
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  className="cursor-pointer transition-colors"
                  onClick={() => handlePaintRegion('body')}
                />
                {/* Rocket Nose Cone */}
                <polygon
                  points="130,20 85,75 175,75"
                  fill={regionColors.nose}
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  className="cursor-pointer transition-colors"
                  onClick={() => handlePaintRegion('nose')}
                />
                {/* Astronaut Window */}
                <circle
                  cx="130"
                  cy="122"
                  r="24"
                  fill={regionColors.window}
                  stroke="#ffffff"
                  strokeWidth="4"
                  className="cursor-pointer transition-colors"
                  onClick={() => handlePaintRegion('window')}
                />
                {/* Booster Flame */}
                <polygon
                  points="102,178 130,228 158,178"
                  fill={regionColors.flame}
                  stroke="#ffffff"
                  strokeWidth="3"
                  className="cursor-pointer transition-colors"
                  onClick={() => handlePaintRegion('flame')}
                />
              </svg>
              <span className="text-[11px] font-bold text-indigo-200 mt-1">
                ✨ {isEn ? 'Tap directly on the rocket parts to color!' : 'اضغط مباشرة على أجزاء الصاروخ لتلوينها!'}
              </span>
            </div>

            {/* Quick Region Paint Buttons */}
            <div className="space-y-2">
              <div className="text-xs font-extrabold text-[var(--color-text)]">
                🎯 {isEn ? 'Or tap a part button to paint:' : 'أو اضغط على اسم الجزء لتلوينه باللون المختار:'}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {COLORING_REGIONS.map((reg) => (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => handlePaintRegion(reg.id)}
                    className="rounded-xl border border-[var(--color-border)] bg-white p-2.5 flex items-center justify-between gap-2 text-xs font-extrabold text-[var(--color-text)] hover:border-pink-400 transition-all"
                  >
                    <span className="truncate">{isEn ? reg.labelEn : reg.labelAr}</span>
                    <span
                      className="w-5 h-5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: regionColors[reg.id] }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeGame === 'puzzle' ? (
        /* =================================================================
           GAME 3: SIMPLE PICTURE & TILE PUZZLE (تركيب البازل)
           ================================================================= */
        <div className="rounded-[22px] border border-sky-200/90 bg-[var(--color-surface)] p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
                🧩 {isEn ? 'Arrange the 4 Nature Story Tiles (1 → 4)' : 'رتّب قطع البازل الأربع بالترتيب الصحيح (١ ← ٤)'}
              </h3>
              <p className="text-[11px] font-semibold text-[var(--color-muted)]">
                {isEn
                  ? 'Tap any two tiles to swap their places until they match 1, 2, 3, 4.'
                  : 'اضغط على أي قطعتين لتبديل مكانهما حتى تكتمل اللوحة بالترتيب.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-900 text-xs font-extrabold tabular-nums">
                {isEn ? `Swaps: ${puzzleMoves}` : `الحركات: ${puzzleMoves}`}
              </span>
              <button
                type="button"
                onClick={handleShufflePuzzle}
                className="min-h-[34px] px-3 py-1 rounded-xl border border-[var(--color-border)] bg-white text-xs font-extrabold"
              >
                🔀 {isEn ? 'Shuffle' : 'بعثرة'}
              </button>
            </div>
          </div>

          {isPuzzleSolved && (
            <div
              role="status"
              className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-center text-xs font-extrabold text-emerald-950"
            >
              🎉{' '}
              {isEn
                ? `Wonderful job ${activeKid?.name || ''}! You solved the picture puzzle!`
                : `رائع جدًا يا ${activeKid?.name || 'بطل'}! ركّبت لوحة الطبيعة بالترتيب الصحيح!`}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            {puzzleOrder.map((tileIdx, slotIdx) => {
              const tile = PUZZLE_TILES_BASE[tileIdx];
              const isSelected = selectedTileSlot === slotIdx;
              const isInRightPlace = tile.correctSlot === slotIdx;
              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => handleTileTap(slotIdx)}
                  className={`h-28 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-3 ring-sky-600 scale-102 shadow-md'
                      : isInRightPlace
                      ? 'border-2 border-emerald-500 shadow-2xs'
                      : 'border-2 border-dashed border-slate-300'
                  }`}
                  style={{ backgroundColor: tile.bgHex }}
                >
                  <span className="text-3xl">{tile.emoji}</span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {isEn ? tile.titleEn : tile.titleAr}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600">
                    {isInRightPlace
                      ? isEn
                        ? '✓ In Place'
                        : '✓ في مكانه الصحيح'
                      : isSelected
                      ? isEn
                        ? 'Tap another tile to swap'
                        : 'اضغط قطعة أخرى للتبديل'
                      : isEn
                      ? 'Tap to move'
                      : 'اضغط للنقل'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* =================================================================
           GAME 4: QUICK VISUAL MATH CHALLENGE (تحدي الحساب الذهني)
           ================================================================= */
        <div className="rounded-[22px] border border-amber-200/90 bg-[var(--color-surface)] p-4 sm:p-5 space-y-4 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text)]">
              🔢 {isEn ? currentMath.questionEn : currentMath.questionAr}
            </div>
            <div className="flex items-center gap-2 text-xs font-extrabold tabular-nums">
              <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900">
                ⭐ {isEn ? `Score: ${mathScore}` : `النقاط: ${mathScore}`}
              </span>
              <PrimaryCtaButton variant="orange" size="sm" onClick={handleNextMath}>
                {isEn ? 'Next Question →' : 'السؤال التالي ←'}
              </PrimaryCtaButton>
            </div>
          </div>

          {/* Visual Emoji Equation Box */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex flex-wrap items-center justify-center gap-3 text-center">
            <div className="rounded-xl bg-white px-3.5 py-2.5 shadow-2xs flex items-center gap-1 text-2xl">
              {Array.from({ length: currentMath.leftCount }).map((_, i) => (
                <span key={i}>{currentMath.emoji}</span>
              ))}
              <span className="ms-1.5 text-xs font-extrabold text-slate-600 tabular-nums">
                ({currentMath.leftCount})
              </span>
            </div>

            <span className="w-9 h-9 rounded-full bg-orange-600 text-white font-extrabold text-lg flex items-center justify-center shadow-2xs">
              {currentMath.operator}
            </span>

            <div className="rounded-xl bg-white px-3.5 py-2.5 shadow-2xs flex items-center gap-1 text-2xl">
              {Array.from({ length: currentMath.rightCount }).map((_, i) => (
                <span key={i}>{currentMath.emoji}</span>
              ))}
              <span className="ms-1.5 text-xs font-extrabold text-slate-600 tabular-nums">
                ({currentMath.rightCount})
              </span>
            </div>

            <span className="text-xl font-extrabold text-amber-950">= ؟</span>
          </div>

          {mathFeedback && (
            <div
              role="status"
              className={`rounded-xl p-3 text-xs font-extrabold text-center ${
                mathFeedback.type === 'correct'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border border-amber-300'
              }`}
            >
              {mathFeedback.text}
            </div>
          )}

          {/* 3 Answer Choice Cards */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {currentMath.options.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleAnswerMath(num)}
                className="min-h-[64px] rounded-2xl border-2 border-amber-200 bg-white hover:border-orange-500 hover:bg-orange-50 text-xl sm:text-2xl font-extrabold text-[var(--color-text)] tabular-nums shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
