import React, { useState } from 'react';
import {
  ChildProfile,
  LanguageCode,
  calculateChildAge,
} from '../domain/familySpaceCore';
import { ThreeDChildAvatar, ThreeDIcon } from './ThreeDVisuals';

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
  onAddSuggestedRoutineTask: (taskName: string, timeStr: string, kidId: number | null) => void;
  onShowToast: (msg: string) => void;
}

export const AiAssistantSection: React.FC<AiAssistantSectionProps> = ({
  kids,
  parentName,
  city,
  language,
  onAddSuggestedRoutineTask,
  onShowToast,
}) => {
  const isEn = language === 'en';
  const [selectedKidId, setSelectedKidId] = useState<number>(kids[0]?.id || 0);
  const selectedKid = kids.find((k) => k.id === selectedKidId) || kids[0];
  const kidAge = selectedKid ? calculateChildAge(selectedKid.birth, language) : null;

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      textAr: `أهلًا ${parentName} 👋 أنا المساعد الأسري الذكي (نموذج إرشادي تفاعلي). يمكنني تخصيص جداول النوم، الأنشطة المنزلية، والرد على تساؤلاتك التربوية حسب عمر ${selectedKid ? selectedKid.name : 'طفلك'} (${kidAge?.label || '2–5 سنوات'}).`,
      textEn: `Hello ${parentName}! I am your Family Space AI Assistant (Interactive Demo). I tailor daily routines, developmental activities, and gentle parenting strategies for ${selectedKid ? selectedKid.name : 'your child'} (${kidAge?.label || '2–5 yrs'}).`,
      timestamp: '09:00 AM',
      structuredCard: {
        badgeAr: `توصية مخصصة لعمر ${selectedKid?.name || 'الطفل'} (${kidAge?.stageCode || '2-5'} سنوات)`,
        badgeEn: `Tailored Plan for ${selectedKid?.name || 'Child'} (${kidAge?.stageCode || '2-5'} yrs)`,
        stepsAr: [
          '١. تثبيت موعد الاستيقاظ والإفطار يمنح الطفل أمانًا وتوازنًا صباحيًا.',
          '٢. تخصيص 15 دقيقة من اللعب التفاعلي المشترك بدون هاتف بعد العودة من الحضانة.',
          '٣. بدء طقس الهدوء المسائي وخفض الإضاءة الساعة 08:00 مساءً.',
        ],
        stepsEn: [
          '1. Consistent morning wake-up and breakfast anchors emotional security.',
          '2. 15 minutes of screen-free parent-child play after nursery.',
          '3. Start the evening wind-down ritual at 08:00 PM.',
        ],
        activityTipAr: 'نشاط اليوم المقترح: لعبة تطابق الذاكرة وتسمية المشاعر بالصور ثلاثية الأبعاد.',
        activityTipEn: 'Today’s Activity: 3D Memory Match & Emotion Naming game.',
      },
    },
  ]);

  const suggestedPrompts = [
    {
      labelAr: `🌙 خطة نوم مسائية مخصصة لـ ${selectedKid?.name || 'طفلي'}`,
      labelEn: `🌙 Bedtime sleep routine for ${selectedKid?.name || 'my child'}`,
      topic: 'sleep',
    },
    {
      labelAr: '🍎 كيف أتعامل مع انتقائية الطعام ورفض الخضار؟',
      labelEn: '🍎 How to handle picky eating and refusing vegetables?',
      topic: 'food',
    },
    {
      labelAr: '💛 تهدئة نوبات الغضب والعناد بهدوء بدون صراخ',
      labelEn: '💛 Calming tantrums without yelling',
      topic: 'behavior',
    },
    {
      labelAr: '🎨 اقترح 3 أنشطة منزلية لتنمية التركيز واللغة اليوم',
      labelEn: '🎨 Suggest 3 home activities for focus and language today',
      topic: 'play',
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
          textAr: `بناءً على عمر ${selectedKid?.name || 'طفلك'} (${kidAge?.label || '3 سنوات'})، إليك خطة روتين النوم التدريجية في 3 خطوات عملية:`,
          textEn: `Based on ${selectedKid?.name || 'your child'}'s age (${kidAge?.label || '3 yrs'}), here is a 3-step bedtime routine plan:`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'خطة النوم المريحة (20 دقيقة قبل السرير)',
            badgeEn: 'Calm Bedtime Blueprint (20 mins before bed)',
            stepsAr: [
              '١. الساعة 07:45 م: إيقاف الشاشات والألعاب الحركية وخفض إضاءة الغرفة.',
              '٢. الساعة 08:00 م: حمام دافئ سريع واختيار بيجامة النوم مع الطفل.',
              '٣. الساعة 08:15 م: تشغيل تهويدة «رحلة القمر الصغير» أو قراءة قصة قصيرة بصوت هادئ.',
            ],
            stepsEn: [
              '1. 07:45 PM: Turn off screens and dim room lights.',
              '2. 08:00 PM: Warm bath and let the child choose pajamas.',
              '3. 08:15 PM: Play the Little Moon audio lullaby or read 1 short story.',
            ],
            activityTipAr: 'يمكنك إضافة مهمة «طقس القراءة والهدوء المسائي 08:00 م» مباشرة لجدول الروتين بضغطة زر أدناه.',
            activityTipEn: 'You can add "Evening Story & Wind-down 08:00 PM" directly to your Daily Routine below.',
          },
        }
      : isFood
      ? {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `التعامل مع انتقائية الطعام في عمر (${kidAge?.label || '3 سنوات'}) يعتمد على التقسيم الذكي بدون ضغط:`,
          textEn: `Handling picky eating at (${kidAge?.label || '3 yrs'}) works best with division of responsibility and zero pressure:`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'استراتيجية الطبق المقسم الإيجابي',
            badgeEn: 'Positive Divided Plate Strategy',
            stepsAr: [
              '١. قدّمي صنفين يحبهما الطفل بجانب ملعقة واحدة صغيرة فقط من الصنف الجديد.',
              '٢. أشركي الطفل في غسل الفاكهة أو ترتيب الطبق لزيادة فضوله لتذوقه.',
              '٣. حددي وقت الوجبة بـ 20 دقيقة هادئة دون مساومة أو شاشات أثناء الأكل.',
            ],
            stepsEn: [
              '1. Serve 2 familiar favorites alongside 1 tiny spoon of a new food.',
              '2. Let your child help wash fruit or arrange the plate.',
              '3. Keep meals to 20 calm minutes without screens or bribery.',
            ],
            activityTipAr: 'نشاط مقترح: لعبة تخمين ألوان الفواكه والخضروات قبل الغداء.',
            activityTipEn: 'Suggested game: Fruit & veggie color matching before lunch.',
          },
        }
      : isBehavior
      ? {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `عندما يمر ${selectedKid?.name || 'الطفل'} بنوبة غضب أو عناد، الهدف الأول هو تهدئة الجهاز العصبي قبل التوجيه:`,
          textEn: `When ${selectedKid?.name || 'your child'} experiences a tantrum, calm the nervous system before teaching:`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: 'بروتوكول التهدئة والاحتواء (3 خطوات)',
            badgeEn: 'Co-Regulation Protocol (3 Steps)',
            stepsAr: [
              '١. النزول لمستوى نظر الطفل والتحدث بنبرة منخفضة وبطيئة.',
              '٢. تسمية الشعور: «أنا فاهمة إنك زعلان عشان وقت اللعب خلص».',
              '٣. تقديم خيارين صغيرين: «تحب تشيل المكعبات الحمراء الأول ولا الزرقاء؟».',
            ],
            stepsEn: [
              '1. Get down to eye level and speak in a slow, low tone.',
              '2. Name the feeling: "I see you are upset play time ended."',
              '3. Offer two small choices: "Pick up red blocks or blue blocks first?"',
            ],
            activityTipAr: 'تجنبي النقاش الطويل أثناء ذروة الانفعال؛ الاحتواء الهادئ يختصر مدة النوبة للنصف.',
            activityTipEn: 'Avoid long lectures during peak emotion; calm presence cuts meltdown time in half.',
          },
        }
      : {
          id: Date.now() + 1,
          sender: 'ai',
          textAr: `إليك خطة أنشطة يومية مخصصة لـ ${selectedKid?.name || 'طفلك'} (${kidAge?.label || '2–5 سنوات'}) لتنمية التركيز واللغة والمهارات الحركية:`,
          textEn: `Here is a customized daily activity plan for ${selectedKid?.name || 'your child'} (${kidAge?.label || '2–5 yrs'}) to build focus and language:`,
          timestamp: nowStr,
          structuredCard: {
            badgeAr: `خطة أنشطة وتنمية مهارات (${kidAge?.stageCode || '2-5'} سنوات)`,
            badgeEn: `Skill & Play Plan (${kidAge?.stageCode || '2-5'} yrs)`,
            stepsAr: [
              '١. نشاط حركي ودقيق (10 دقائق): تصنيف المكعبات أو الأشكال حسب اللون والحجم.',
              '٢. نشاط لغوي وخيالي (10 دقائق): حكي قصة قصيرة وترك الطفل يتوقع النهاية.',
              '٣. نشاط تشاركي في ركن الألعاب 3D: جولة في لعبة تطابق الذاكرة والمفردات.',
            ],
            stepsEn: [
              '1. Fine motor (10m): Sort blocks or shapes by color and size.',
              '2. Language & imagination (10m): Tell a short story and let your child invent the ending.',
              '3. Co-play in 3D Games Hub: One round of 3D Memory & Vocabulary Match.',
            ],
            activityTipAr: `الاهتمامات المسجلة لـ ${selectedKid?.name || 'الطفل'}: ${selectedKid?.interests || 'القصص والمكعبات'}.`,
            activityTipEn: `Recorded interests for ${selectedKid?.name || 'child'}: ${selectedKid?.interests || 'Stories & blocks'}.`,
          },
        };

    setMessages((prev) => [...prev, parentMsg, aiReply]);
    setInputPrompt('');
  };

  return (
    <section className="space-y-6" aria-label={isEn ? 'In-App AI Parenting Assistant' : 'المساعد الذكي للأسرة'}>
      {/* Distinct Violet-Fuchsia Intelligence Studio Hero */}
      <div
        className="rounded-[24px] p-5 sm:p-7 border border-purple-200/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 52%, #fae8ff 100%)',
          boxShadow: '0 16px 34px -14px rgba(124, 58, 237, 0.15)',
        }}
      >
        <div className="space-y-2.5 max-w-2xl">
          <div className="text-xs font-extrabold text-purple-800">
            ✨ {isEn ? 'Personalized AI Parenting Assistant (Simulated Demo)' : 'المساعد الذكي للأسرة والتربية (محاكاة ذكاء اصطناعي تفاعلية للعرض التجريبي)'}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {isEn
              ? 'Tailored Daily Guidance, Sleep Routines & Age-Specific Activities'
              : 'إرشاد يومي مخصص لعمر طفلك، خطط نوم وتغذية، وأنشطة تنمية مهارات'}
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {isEn
              ? 'Select your child profile below to get structured action cards tailored to their exact age stage and interests. (Simulated frontend responses for demo review).'
              : 'اختاري ملف الطفل بالأسفل ليقوم المساعد بتخصيص الخطط والأنشطة حسب عمره واهتماماته المسجلة. (الردود هنا محاكاة ذكية للعرض التجريبي ولا تمثل استشارة طبية).'}
          </p>
        </div>

        {/* Child Context Selector */}
        {selectedKid && kidAge && (
          <div className="rounded-2xl bg-white/95 border border-purple-200 p-3.5 flex items-center gap-3 shrink-0 shadow-xs">
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
              <label htmlFor="aiKidSelector" className="block text-[11px] font-bold text-purple-800">
                {isEn ? 'Tailored for Child:' : 'تخصيص الإرشاد للطفل:'}
              </label>
              <select
                id="aiKidSelector"
                value={selectedKid.id}
                onChange={(e) => setSelectedKidId(Number(e.target.value))}
                className="text-xs font-extrabold text-slate-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
              >
                {kids.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} ({calculateChildAge(k.birth, language).label})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts Strip */}
      <div className="flex flex-wrap items-center gap-2">
        {suggestedPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendPrompt(isEn ? p.labelEn : p.labelAr, p.topic)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-200 bg-purple-50/70 text-purple-950 hover:bg-purple-100 transition-colors"
          >
            {isEn ? p.labelEn : p.labelAr}
          </button>
        ))}
      </div>

      {/* Conversational Thread + Structured Cards */}
      <div className="rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
          {messages.map((msg) => {
            const isParent = msg.sender === 'parent';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isParent ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 space-y-3 ${
                    isParent
                      ? 'bg-purple-700 text-white'
                      : 'bg-[var(--color-control-muted)] text-[var(--color-text)] border border-purple-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[11px] font-bold opacity-80">
                    <span>
                      {isParent
                        ? isEn
                          ? 'You (Parent)'
                          : 'أنت (ولي الأمر)'
                        : isEn
                        ? '✨ Family Space AI Assistant (Demo)'
                        : '✨ المساعد الذكي لمساحة الأسرة (عرض تجريبي)'}
                    </span>
                    <span dir="ltr" className="tabular-nums">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs sm:text-sm leading-relaxed">
                    {isEn ? msg.textEn : msg.textAr}
                  </p>

                  {msg.structuredCard && (
                    <div className="rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] border border-purple-200/80 p-3.5 space-y-2.5">
                      <div className="text-xs font-extrabold text-purple-800">
                        📋 {isEn ? msg.structuredCard.badgeEn : msg.structuredCard.badgeAr}
                      </div>
                      <div className="space-y-1.5 text-xs leading-relaxed">
                        {(isEn ? msg.structuredCard.stepsEn : msg.structuredCard.stepsAr).map(
                          (step, i) => (
                            <div key={i} className="rounded-lg bg-purple-50/50 px-3 py-2 font-medium">
                              {step}
                            </div>
                          )
                        )}
                      </div>
                      <div className="text-xs font-semibold text-emerald-800 pt-1">
                        💡 {isEn ? msg.structuredCard.activityTipEn : msg.structuredCard.activityTipAr}
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
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
                          className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-purple-700 text-white hover:bg-purple-800"
                        >
                          + {isEn ? 'Add to Daily Routine' : 'إضافة خطوة للروتين اليومي'}
                        </button>
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
                ? `Ask about ${selectedKid?.name || 'your child'}'s sleep, nutrition, tantrums, or activities...`
                : `اسألي المساعد الذكي عن نوم أو تغذية أو أنشطة ${selectedKid?.name || 'طفلك'}...`
            }
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-control-bg)] px-4 py-2.5 text-xs sm:text-sm text-[var(--color-text)]"
          />
          <button
            type="button"
            onClick={() => handleSendPrompt()}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-purple-700 text-white hover:bg-purple-800 whitespace-nowrap"
          >
            {isEn ? 'Ask AI ✨' : 'اسأل المساعد ✨'}
          </button>
        </div>
      </div>
    </section>
  );
};
