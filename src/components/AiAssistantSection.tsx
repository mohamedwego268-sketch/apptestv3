import React, { useState } from 'react';
import {
  ChildProfile,
  LanguageCode,
  calculateChildAge,
  locText,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec, CardBackgroundKey } from '../domain/cardBackgrounds';
import { ThreeDChildAvatar, ThreeDIcon, ThreeDIconId, AiRobotHeadIcon } from './ThreeDVisuals';
import {
  BannerSlideItem,
  MasterPatternCard,
  PASTEL_CARD_TONES,
  PastelTone,
  PrimaryCtaButton,
  SectionHeader,
  SwipeableBannerCarousel,
} from './DesignSystem';

interface AiChatMessage {
  id: number;
  sender: 'parent' | 'ai';
  textAr: string;
  textEn: string;
  timestamp: string;
  structuredCard?: {
    badgeAr: string;
    badgeEn: string;
    stepsAr: string[];
    stepsEn: string[];
    activityTipAr: string;
    activityTipEn: string;
  };
}

interface AiAssistantSectionProps {
  kids: ChildProfile[];
  parentName: string;
  city: string;
  language: LanguageCode;
  darkMode?: boolean;
  onAddSuggestedRoutineTask: (taskName: string, timeStr: string, kidId: number | null) => void;
  onShowToast: (msg: string) => void;
}

export const AiAssistantSection: React.FC<AiAssistantSectionProps> = ({
  kids,
  parentName,
  language,
  darkMode = false,
  onAddSuggestedRoutineTask,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const [selectedKidId, setSelectedKidId] = useState<number>(kids[0]?.id || 0);
  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];
  const kidAge = selectedKid ? calculateChildAge(selectedKid.birth, language) : null;
  const displayParentName = locText(parentName, language);
  const displayKidName = selectedKid ? locText(selectedKid.name, language) : isEn ? 'your child' : 'طفلك';
  const displayKidInterests = selectedKid ? locText(selectedKid.interests, language) : isEn ? 'Stories & blocks' : 'القصص والمكعبات';

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      textAr: `أهلًا ${parentName} 👋 أنا مساعد الذكاء الاصطناعي لـ ${selectedKid ? selectedKid.name : 'طفلك'} (${kidAge?.label || '2–5 سنوات'}). اختر بطاقة سريعة أو اكتب طلبك بالأسفل:`,
      textEn: `Hello ${displayParentName}! I am your AI Parenting Agent for ${displayKidName} (${kidAge?.label || '2–5 yrs'}). Tap a quick creation card or ask below:`,
      timestamp: '09:00 AM',
      structuredCard: {
        badgeAr: `خطة مخصصة لـ ${selectedKid?.name || 'الطفل'} (${kidAge?.stageCode || '2-5'} سنوات)`,
        badgeEn: `Tailored Plan for ${displayKidName} (${kidAge?.stageCode || '2-5'} yrs)`,
        stepsAr: [
          '١. تثبيت موعد الاستيقاظ والإفطار يمنح الطفل أمانًا صباحيًا.',
          '٢. 15 دقيقة لعب تفاعلي مشترك بدون شاشات بعد الحضانة.',
          '٣. بدء طقس الهدوء المسائي الساعة 08:00 مساءً.',
        ],
        stepsEn: [
          '1. Consistent morning wake-up and breakfast anchors security.',
          '2. 15 minutes of screen-free parent-child play after nursery.',
          '3. Start the evening wind-down ritual at 08:00 PM.',
        ],
        activityTipAr: 'نشاط مقترح: لعبة تطابق الذاكرة وتسمية المشاعر 3D.',
        activityTipEn: 'Suggested Activity: 3D Memory Match & Emotion Naming.',
      },
    },
  ]);

  const quickCreationCards: {
    topic: string;
    titleAr: string;
    titleEn: string;
    badgeAr: string;
    badgeEn: string;
    promptAr: string;
    promptEn: string;
    iconId: ThreeDIconId;
    tone: PastelTone;
    bgKey: CardBackgroundKey;
  }[] = [
    {
      topic: 'sleep',
      titleAr: 'إنشاء روتين نوم هادئ',
      titleEn: 'Create Bedtime Routine',
      badgeAr: 'خطة 20 دقيقة',
      badgeEn: '20-Min Plan',
      promptAr: `🌙 خطة نوم مسائية مخصصة لـ ${selectedKid?.name || 'طفلي'}`,
      promptEn: `🌙 Bedtime sleep routine for ${displayKidName}`,
      iconId: 'routine',
      tone: 'purple',
      bgKey: 'routine',
    },
    {
      topic: 'food',
      titleAr: 'حلول انتقائية الطعام',
      titleEn: 'Picky Eating Solutions',
      badgeAr: 'تغذية صحية',
      badgeEn: 'Healthy Meals',
      promptAr: '🍎 كيف أتعامل مع انتقائية الطعام ورفض الخضار؟',
      promptEn: '🍎 How to handle picky eating and refusing vegetables?',
      iconId: 'wishes',
      tone: 'emerald',
      bgKey: 'medical',
    },
    {
      topic: 'behavior',
      titleAr: 'تهدئة نوبات الغضب',
      titleEn: 'Calm Tantrums Gently',
      badgeAr: 'تربية إيجابية',
      badgeEn: 'Co-Regulation',
      promptAr: '💛 تهدئة نوبات الغضب والعناد بهدوء بدون صراخ',
      promptEn: '💛 Calming tantrums without yelling',
      iconId: 'children',
      tone: 'rose',
      bgKey: 'children',
    },
    {
      topic: 'play',
      titleAr: 'أنشطة مونتيسوري منزلية',
      titleEn: 'Home Montessori Play',
      badgeAr: 'بدون شاشات',
      badgeEn: 'Zero Screens',
      promptAr: '🎨 اقترح 3 أنشطة منزلية لتنمية التركيز واللغة اليوم',
      promptEn: '🎨 Suggest 3 home activities for focus and language today',
      iconId: 'games',
      tone: 'amber',
      bgKey: 'games',
    },
  ];

  const handleSendPrompt = (customText?: string, topicHint?: string) => {
    const promptText = (customText ?? inputPrompt).trim();
    if (!promptText) return;

    const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const parentMsg: AiChatMessage = {
      id: Date.now(),
      sender: 'parent',
      textAr: promptText,
      textEn: promptText,
      timestamp: nowStr,
    };

    const lower = promptText.toLowerCase();
    const isSleep = topicHint === 'sleep' || lower.includes('نوم') || lower.includes('sleep');
    const isFood = topicHint === 'food' || lower.includes('أكل') || lower.includes('طعام') || lower.includes('food');
    const isBehavior = topicHint === 'behavior' || lower.includes('غضب') || lower.includes('عناد') || lower.includes('tantrum');

    const aiReply: AiChatMessage = isSleep
      ? {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `خطة روتين النوم المخصصة لـ ${selectedKid?.name || 'طفلك'} (${kidAge?.label || '3 سنوات'}):`,
          textEn: `Tailored 3-step bedtime routine for ${selectedKid?.name || 'your child'} (${kidAge?.label || '3 yrs'}):`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'خطة النوم المريحة (20 دقيقة قبل السرير)',
            badgeEn: 'Calm Bedtime Blueprint (20 mins before bed)',
            stepsAr: [
              '١. الساعة 07:45 م: إيقاف الشاشات وخفض إضاءة الغرفة.',
              '٢. الساعة 08:00 م: حمام دافئ واختيار بيجامة النوم مع الطفل.',
              '٣. الساعة 08:15 م: تشغيل تهويدة «رحلة القمر الصغير» أو قصة قصيرة.',
            ],
            stepsEn: [
              '1. 07:45 PM: Turn off screens and dim room lights.',
              '2. 08:00 PM: Warm bath and let the child choose pajamas.',
              '3. 08:15 PM: Play the Little Moon audio lullaby or read 1 short story.',
            ],
            activityTipAr: 'أضيفي المهمة مباشرة لجدول الروتين اليومي بضغطة زر بالأسفل.',
            activityTipEn: 'Add this step directly to your Daily Routine below.',
          },
        }
      : isFood
      ? {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `استراتيجية الطبق المقسم الإيجابي لـ ${selectedKid?.name || 'طفلك'}:`,
          textEn: `Positive Divided Plate strategy for ${selectedKid?.name || 'your child'}:`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'استراتيجية الطبق المقسم الإيجابي',
            badgeEn: 'Positive Divided Plate Strategy',
            stepsAr: [
              '١. تقديم صنفين يحبهما الطفل بجانب ملعقة صغيرة من الصنف الجديد.',
              '٢. إشراك الطفل في غسل الفاكهة أو ترتيب الطبق.',
              '٣. تحديد وقت الوجبة بـ 20 دقيقة هادئة بدون شاشات.',
            ],
            stepsEn: [
              '1. Serve 2 familiar favorites alongside 1 tiny spoon of a new food.',
              '2. Let your child help wash fruit or arrange the plate.',
              '3. Keep meals to 20 calm minutes without screens.',
            ],
            activityTipAr: 'نشاط مقترح: لعبة تخمين ألوان الفواكه والخضروات قبل الغداء.',
            activityTipEn: 'Suggested game: Fruit & veggie color matching before lunch.',
          },
        }
      : isBehavior
      ? {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `بروتوكول التهدئة والاحتواء السريع لـ ${selectedKid?.name || 'الطفل'}:`,
          textEn: `Quick Co-Regulation protocol for ${selectedKid?.name || 'your child'}:`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'بروتوكول التهدئة والاحتواء (3 خطوات)',
            badgeEn: 'Co-Regulation Protocol (3 Steps)',
            stepsAr: [
              '١. النزول لمستوى نظر الطفل والتحدث بنبرة منخفضة وبطيئة.',
              '٢. تسمية الشعور: «أنا فاهمة إنك زعلان عشان وقت اللعب خلص».',
              '٣. تقديم خيارين صغيرين: «تشيل المكعبات الحمراء الأول ولا الزرقاء؟».',
            ],
            stepsEn: [
              '1. Get down to eye level and speak in a slow, low tone.',
              '2. Name the feeling: "I see you are upset play time ended."',
              '3. Offer two small choices: "Pick up red blocks or blue blocks first?"',
            ],
            activityTipAr: 'الاحتواء الهادئ يختصر مدة نوبة الغضب للنصف.',
            activityTipEn: 'Calm presence cuts meltdown time in half.',
          },
        }
      : {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `خطة أنشطة يومية مخصصة لـ ${selectedKid?.name || 'طفلك'} (${kidAge?.label || '2–5 سنوات'}):`,
          textEn: `Customized daily activity plan for ${selectedKid?.name || 'your child'} (${kidAge?.label || '2–5 yrs'}):`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: `خطة أنشطة وتنمية مهارات (${kidAge?.stageCode || '2-5'} سنوات)`,
            badgeEn: `Skill & Play Plan (${kidAge?.stageCode || '2-5'} yrs)`,
            stepsAr: [
              '١. نشاط حركي (10 دقائق): تصنيف المكعبات حسب اللون والحجم.',
              '٢. نشاط لغوي (10 دقائق): حكي قصة قصيرة وترك الطفل يتوقع النهاية.',
              '٣. نشاط تشاركي: جولة في لعبة تطابق الذاكرة والمفردات 3D.',
            ],
            stepsEn: [
              '1. Fine motor (10m): Sort blocks or shapes by color and size.',
              '2. Language (10m): Tell a short story and let your child invent the ending.',
              '3. Co-play: One round of 3D Memory & Vocabulary Match.',
            ],
            activityTipAr: `اهتمامات ${selectedKid?.name || 'الطفل'}: ${selectedKid?.interests || 'القصص والمكعبات'}.`,
            activityTipEn: `Interests for ${displayKidName}: ${displayKidInterests}.`,
          },
        };

    setMessages((prev) => [...prev, parentMsg, aiReply]);
    setInputPrompt('');
  };

  const aiBanners: BannerSlideItem[] = [
    {
      id: 'ai-slide-routine',
      badge: isEn ? '✨ Smart AI Parenting Agent' : '✨ مساعد الذكاء الاصطناعي للأسرة',
      title: isEn
        ? `Instant Plans & Routines for ${displayKidName}`
        : `تصميم خطط النوم والتغذية والروتين لـ ${selectedKid?.name || 'طفلك'}`,
      subtitle: isEn
        ? `Tailored for ${kidAge?.label || '0–8 Yrs'} · One-Tap Add to Daily Routine`
        : `مخصص لعمر ${kidAge?.label || '0–8 سنوات'} · إضافة فورية للروتين اليومي`,
      ctaLabel: isEn ? 'Generate Bedtime Plan' : 'أنشئ خطة نوم مسائية الآن',
      onCtaClick: () =>
        handleSendPrompt(
          isEn
            ? `🌙 Bedtime sleep routine for ${displayKidName}`
            : `🌙 خطة نوم مسائية مخصصة لـ ${selectedKid?.name || 'طفلي'}`,
          'sleep'
        ),
      iconId: 'assistant',
      gradient: 'linear-gradient(125deg, #f5f3ff, #ede9fe, #fae8ff)',
      ctaVariant: 'purple',
    },
    {
      id: 'ai-slide-play',
      badge: isEn ? '🎨 Zero-Screen Play' : '🎨 أنشطة مونتيسوري بدون شاشات',
      title: isEn
        ? 'Generate 3 Custom Home Activities in Seconds'
        : 'ابتكر 3 أنشطة منزلية لتنمية ذكاء وتركيز طفلك اليوم',
      subtitle: isEn
        ? 'Fine Motor · Language · Emotional Growth'
        : 'مهارات حركية · حصيلة لغوية · ذكاء عاطفي',
      ctaLabel: isEn ? 'Create Play Plan' : 'ابتكر خطة أنشطة اليوم',
      onCtaClick: () =>
        handleSendPrompt(
          isEn
            ? '🎨 Suggest 3 home activities for focus and language today'
            : '🎨 اقترح 3 أنشطة منزلية لتنمية التركيز واللغة اليوم',
          'play'
        ),
      iconId: 'games',
      gradient: 'linear-gradient(125deg, #fffbeb, #fef3c7, #fce7f3)',
      ctaVariant: 'orange',
    },
  ];

  return (
    <section className="space-y-5" aria-label={isEn ? 'In-App AI Parenting Assistant' : 'المساعد الذكي للأسرة'}>
      {/* Child Context Selector Bar */}
      {selectedKid && kidAge && (
        <div className="rounded-2xl border border-purple-200/80 bg-purple-50/75 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <ThreeDChildAvatar
              name={selectedKid.name}
              gender={selectedKid.gender}
              stageCode={kidAge.stageCode}
              accessoryTheme={selectedKid.avatarTheme || 'astronaut'}
              photoDataUrl={selectedKid.photoDataUrl}
              useIllustratedAvatar={selectedKid.useIllustratedAvatar}
              size="sm"
            />
            <div>
              <div className="text-xs font-extrabold text-purple-900">
                ✨ {isEn ? 'Active Child Profile for AI Plans' : 'ملف الطفل النشط لتخصيص الإرشاد الذكي'}
              </div>
              <div className="text-[11px] font-bold text-[var(--color-muted)]">
                {displayKidName} · {kidAge.label}
              </div>
            </div>
          </div>

          <select
            id="aiKidSelector"
            aria-label={isEn ? 'Select child for AI guidance' : 'اختر الطفل لتخصيص المساعد الذكي'}
            value={selectedKid.id}
            onChange={(e) => setSelectedKidId(Number(e.target.value))}
            className="min-h-[40px] rounded-xl border border-purple-200 bg-white px-3.5 py-1.5 text-xs font-extrabold text-slate-900 cursor-pointer shadow-2xs"
          >
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                {locText(k.name, language)} ({calculateChildAge(k.birth, language).label})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Swipeable AI Agent Banners */}
      <SwipeableBannerCarousel
        slides={aiBanners}
        language={language}
        darkMode={darkMode}
        ariaLabel={isEn ? 'AI Agent Modes Carousel' : 'لافتات مساعد الذكاء الاصطناعي'}
      />

      {/* Centered Section Header + 2-Column Image Background Cards for Quick AI Creation */}
      <div className="space-y-4">
        <SectionHeader
          title={isEn ? 'Smart AI Parenting Blueprints' : 'الخطط التربوية السريعة بالذكاء الاصطناعي'}
          subtitle={
            isEn
              ? 'Tap any card to generate an instant tailored plan for your child'
              : 'اضغط على أي بطاقة لتوليد خطة مخصصة فورية لعمر طفلك'
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickCreationCards.map((card, idx) => {
            return (
              <MasterPatternCard
                key={card.topic}
                tone={card.tone}
                categoryKey={card.bgKey}
                itemIdOrIndex={idx + 1}
                darkMode={darkMode}
                onThumbnailClick={() =>
                  handleSendPrompt(isEn ? card.promptEn : card.promptAr, card.topic)
                }
                topLeftBadge={isEn ? card.badgeEn : card.badgeAr}
                topRightBadge={<span>✨ AI</span>}
                titlePrefixSlot={<ThreeDIcon id={card.iconId} size={20} />}
                title={isEn ? card.titleEn : card.titleAr}
                metaLeft={
                  <span>
                    👶 {displayKidName}
                  </span>
                }
                footerLeft={
                  <span className="text-[11px] font-extrabold text-[var(--color-muted)] dark:text-[#94A3B8]">
                    {isEn ? 'Instant Blueprint' : 'خطة فورية'}
                  </span>
                }
                footerRight={
                  <button
                    type="button"
                    onClick={() =>
                      handleSendPrompt(isEn ? card.promptEn : card.promptAr, card.topic)
                    }
                    className="min-h-[32px] px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-[var(--color-accent)] text-white shadow-2xs active:scale-95 transition-all cursor-pointer"
                  >
                    {isEn ? 'Generate →' : 'ابتكر الخطة ←'}
                  </button>
                }
              />
            );
          })}
        </div>
      </div>

      {/* Conversational Thread + Structured Cards */}
      <div className="rounded-3xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] p-4 sm:p-6 space-y-4 shadow-2xs soft-card-surface">
        <SectionHeader
          title={isEn ? 'Interactive AI Parenting Assistant' : 'محادثة المساعد الذكي للأسرة'}
          subtitle={
            isEn
              ? `Tailored guidance for ${displayKidName} (${kidAge?.label || '2–5 yrs'})`
              : `إرشاد ذكي مخصص لـ ${displayKidName} (${kidAge?.label || '2–5 سنوات'})`
          }
        />

        <div className="space-y-4 max-h-[460px] overflow-y-auto pe-1">
          {messages.map((msg) => {
            const isParent = msg.sender === 'parent';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isParent ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[84%] rounded-2xl p-4 space-y-3 ${
                    isParent
                      ? 'bg-purple-700 text-white'
                      : 'bg-[var(--color-control-muted)] text-[var(--color-text)] border border-[var(--color-border)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[11px] font-extrabold opacity-90">
                    <span className="inline-flex items-center gap-1.5">
                      {!isParent && <AiRobotHeadIcon size={20} />}
                      {isParent
                        ? isEn
                          ? 'You (Parent)'
                          : 'أنت (ولي الأمر)'
                        : isEn
                        ? 'AI Parenting Agent'
                        : 'مساعد الذكاء الاصطناعي'}
                    </span>
                    <span dir="ltr" className="tabular-nums">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold leading-relaxed">
                    {isEn ? msg.textEn : msg.textAr}
                  </p>

                  {msg.structuredCard && (
                    <div className="rounded-2xl bg-white text-[var(--color-text)] border border-purple-200/90 p-3.5 space-y-2.5 shadow-2xs">
                      <div className="text-xs font-extrabold text-purple-900">
                        📋 {isEn ? msg.structuredCard.badgeEn : msg.structuredCard.badgeAr}
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {(isEn ? msg.structuredCard.stepsEn : msg.structuredCard.stepsAr).map(
                          (step, i) => (
                            <div key={i} className="rounded-xl bg-purple-50/80 px-3 py-2 font-bold text-slate-800">
                              {step}
                            </div>
                          )
                        )}
                      </div>
                      <div className="text-xs font-extrabold text-emerald-800 pt-0.5">
                        💡 {isEn ? msg.structuredCard.activityTipEn : msg.structuredCard.activityTipAr}
                      </div>
                      <div className="pt-1">
                        <PrimaryCtaButton
                          variant="purple"
                          size="sm"
                          onClick={() => {
                            onAddSuggestedRoutineTask(
                              isEn
                                ? `Evening Wind-down & Story with ${selectedKid?.name || 'Child'}`
                                : `طقس الهدوء والقصة المسائية مع ${selectedKid?.name || 'الطفل'}`,
                              '08:00 م',
                              selectedKid?.id || null
                            );
                            onShowToast(
                              isEn
                                ? 'Added suggested task to Daily Routine!'
                                : 'تمت إضافة المهمة المقترحة إلى جدول الروتين اليومي!'
                            );
                          }}
                        >
                          + {isEn ? 'Add to Daily Routine' : 'إضافة للروتين اليومي'}
                        </PrimaryCtaButton>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Composer */}
        <div className="pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
            placeholder={
              isEn
                ? `Ask AI Agent about ${displayKidName}'s sleep, nutrition, or play...`
                : `اكتب سؤالك لمساعد الذكاء الاصطناعي حول ${selectedKid?.name || 'طفلك'}...`
            }
            className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--color-text)]"
          />
          <PrimaryCtaButton
            variant="purple"
            size="md"
            onClick={() => handleSendPrompt()}
          >
            {isEn ? 'Ask AI ✨' : 'اسأل المساعد ✨'}
          </PrimaryCtaButton>
        </div>
      </div>
    </section>
  );
};
