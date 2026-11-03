import {
  AgeStage,
  calculateChildAge,
  ChildProfile,
  LanguageCode,
  locText,
  sanitizeUserText,
} from './familySpaceCore';
import { extractProfileSignals, RecommendationProfile } from './contentRecommendationEngine';

export type ChildMoodId = 'happy' | 'calm' | 'sad' | 'angry' | 'worried' | 'tired' | 'overwhelmed';
export type HouseholdEnergy = 'steady' | 'tired' | 'overloaded';
export type HouseholdCoordination = 'shared' | 'uneven' | 'not_discussed';
export type ParentSupportRole = 'mother' | 'father';
export type PositiveParentingFocusId = 'confidence' | 'boundaries' | 'independence' | 'transitions';
export type FamilyBondingModeId = 'dialogue' | 'connection_ritual' | 'appreciation';
export type ParentingScenarioId =
  | 'big-feelings'
  | 'screen-change'
  | 'school-worry'
  | 'siblings'
  | 'bedtime'
  | 'learning-frustration';

export interface ParentSupportCardSpec {
  id: string;
  role: ParentSupportRole;
  badgeAr: string;
  badgeEn: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  practicalStepAr: string;
  practicalStepEn: string;
  routineTaskAr: string;
  routineTaskEn: string;
  routineTime: string;
}

export interface StageEmotionalGuidance {
  stageCode: AgeStage | 'unknown';
  stageBadgeAr: string;
  stageBadgeEn: string;
  coreNeedAr: string;
  coreNeedEn: string;
  communicationTipAr: string;
  communicationTipEn: string;
  moodFollowUpAr: string;
  moodFollowUpEn: string;
  suggestedRoutineTaskAr: string;
  suggestedRoutineTaskEn: string;
}

export interface PositiveParentingAdvice {
  id: PositiveParentingFocusId;
  emoji: string;
  labelAr: string;
  labelEn: string;
  headlineAr: string;
  headlineEn: string;
  adviceAr: string;
  adviceEn: string;
  sayThisAr: string;
  sayThisEn: string;
  routineTaskAr: string;
  routineTaskEn: string;
  routineTime: string;
}

export interface ScenarioPersonalizedAddOn {
  stageNoteAr: string;
  stageNoteEn: string;
  personalizedPhraseAr: string;
  personalizedPhraseEn: string;
  preventiveTaskAr: string;
  preventiveTaskEn: string;
  preventiveTime: string;
}

export interface FamilyBondingRitual {
  id: FamilyBondingModeId;
  emoji: string;
  labelAr: string;
  labelEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  promptAr: string;
  promptEn: string;
  routineTaskAr: string;
  routineTaskEn: string;
  routineTime: string;
}

function getCleanChildInterests(
  child: ChildProfile | null | undefined,
  recentRecords?: RecommendationProfile['recentRecords']
): { ar: string[]; en: string[] } {
  if (!child) return { ar: [], en: [] };
  const signals = extractProfileSignals({ child, language: 'ar', recentRecords });
  const raw = Array.from(
    new Set(
      [...signals.interests, ...signals.hobbies, ...signals.sports]
        .map((item) => sanitizeUserText(item, 60))
        .filter(Boolean)
    )
  ).slice(0, 4);

  return {
    ar: raw.map((item) => locText(item, 'ar')),
    en: raw.map((item) => locText(item, 'en')),
  };
}

/**
 * Generates 3 non-repetitive emotional support cards for Mothers and 3 for Fathers,
 * personalized with the parent's real name and family child context.
 */
export function buildParentEmotionalSupportCards(params: {
  role: ParentSupportRole;
  motherName?: string;
  fatherName?: string;
  kidsCount: number;
  selectedChildNameAr?: string;
  selectedChildNameEn?: string;
}): ParentSupportCardSpec[] {
  const cleanMotherAr = sanitizeUserText(params.motherName || '', 40);
  const cleanFatherAr = sanitizeUserText(params.fatherName || '', 40);
  const momLabelAr = cleanMotherAr ? `يا ${cleanMotherAr}` : 'يا أمّنا الغالية';
  const momLabelEn = cleanMotherAr ? locText(cleanMotherAr, 'en') : 'Mom';
  const dadLabelAr = cleanFatherAr ? `يا ${cleanFatherAr}` : 'يا أبونا الغالي';
  const dadLabelEn = cleanFatherAr ? locText(cleanFatherAr, 'en') : 'Dad';

  const childContextAr =
    params.selectedChildNameAr && params.kidsCount > 0
      ? params.kidsCount > 1
        ? `مع ${params.selectedChildNameAr} وإخوته`
        : `مع ${params.selectedChildNameAr}`
      : 'مع أسرتك';
  const childContextEn =
    params.selectedChildNameEn && params.kidsCount > 0
      ? params.kidsCount > 1
        ? `with ${params.selectedChildNameEn} and siblings`
        : `with ${params.selectedChildNameEn}`
      : 'with your family';

  if (params.role === 'mother') {
    return [
      {
        id: 'mom-release-perfection',
        role: 'mother',
        badgeAr: '🌸 رفقاً بنفسكِ',
        badgeEn: '🌸 Gentle with yourself',
        titleAr: `${momLabelAr}، الكفاية أهم من المثالية`,
        titleEn: `${momLabelEn}, being present matters more than being perfect`,
        bodyAr: `وسط تفاصيل اليوم ${childContextAr}، طبيعي تحسي إن فيه حاجات متأجلة. البيت الدافي مش بيحتاج أم مثالية، بيحتاج أم مرتاحة وحاضرة بقلبها.`,
        bodyEn: `Through the daily rhythm ${childContextEn}, it is normal to leave some tasks unfinished. A warm home needs a rested, present mother—not perfection.`,
        practicalStepAr: 'اختاري مهمة واحدة غير ضرورية النهارده وارفعيها من جدولك بدون أي لوم لنفسك.',
        practicalStepEn: 'Pick one non-essential task today and drop it from your list without guilt.',
        routineTaskAr: '١٥ دقيقة قهوة أو استراحة هادية للأم بدون مهام',
        routineTaskEn: '15-minute quiet tea/coffee break for Mom with no chores',
        routineTime: '04:00 م',
      },
      {
        id: 'mom-recharge-boundaries',
        role: 'mother',
        badgeAr: '🌿 تجديد الطاقة',
        badgeEn: '🌿 Energy reset',
        titleAr: `طاقتكِ النفسية ليها أولوية ${momLabelAr}`,
        titleEn: `Your emotional energy comes first, ${momLabelEn}`,
        bodyAr: `لما بتستنزفي طاقتك للآخر، بيبقى صعب تتحملي أي انفعال بسيط ${childContextAr}. استراحتك القصيرة في نص اليوم هي اللي بتحمي هدوء البيت كله.`,
        bodyEn: `When your battery runs low, every small moment ${childContextEn} feels heavier. A short midday pause protects the calm of the entire home.`,
        practicalStepAr: 'اطلبي بوضوح من شريكك أو أحد أفراد الأسرة يتولى ٢٠ دقيقة كاملة لتفصلي فيها بهدوء.',
        practicalStepEn: 'Ask your partner or a trusted family member to take over for 20 uninterrupted minutes.',
        routineTaskAr: '٢٠ دقيقة وقت خاص للأم لتجديد النشاط',
        routineTaskEn: '20-minute personal recharge window for Mom',
        routineTime: '06:30 م',
      },
      {
        id: 'mom-acknowledge-wins',
        role: 'mother',
        badgeAr: '💛 تقدير المجهود',
        badgeEn: '💛 Unseen effort',
        titleAr: `كل خطوة صغيرة بتعمليها بتفرق ${childContextAr}`,
        titleEn: `Every small care moment counts ${childContextEn}`,
        bodyAr: `تفاصيل الرعاية اليومية من تحضير أكل، طبطبة، وصبر على الأسئلة المتكررة هي الأساس اللي بيبني أمان طفلك النفسي يوم بعد يوم.`,
        bodyEn: `The quiet details—meals, comfort, and patience with repeated questions—build your child’s lasting sense of safety day by day.`,
        practicalStepAr: 'قبل النوم، افتكري موقف واحد بس احتويتي فيه طفلك النهارده وقولي لنفسك: عملت اللي عليا.',
        practicalStepEn: 'Before bed, recall just one moment you comforted your child today and give yourself credit.',
        routineTaskAr: 'لحظة امتنان وتهدئة مسائية للأم قبل النوم',
        routineTaskEn: 'Calm evening reflection moment for Mom before sleep',
        routineTime: '09:30 م',
      },
    ];
  }

  return [
    {
      id: 'dad-presence-over-time',
      role: 'father',
      badgeAr: '🛡️ حضور مطمئن',
      badgeEn: '🛡️ Grounded presence',
      titleAr: `${dadLabelAr}، ربع ساعة بتركيز بتصنع فارق كبير`,
      titleEn: `${dadLabelEn}, 15 focused minutes make a lasting difference`,
      bodyAr: `حتى بعد يوم شغل طويل، مش المطلوب ساعات طويلة؛ نظرة عين، ابتسامة، وسماع حقيقي ${childContextAr} من غير موبايل كفاية جداً يشبع احتياجهم لوجودك.`,
      bodyEn: `Even after a long workday, children do not need hours—eye contact, a warm smile, and 15 phone-free minutes ${childContextEn} fill their emotional cup.`,
      practicalStepAr: 'أول ما ترجع أو تفصل من الشغل، خد ٥ دقايق تبديل جو قبل ما تبدأ تفاعل هادي مع البيت.',
      practicalStepEn: 'Take 5 minutes to decompress after work so you can greet the family calmly.',
      routineTaskAr: '١٥ دقيقة حضور ولعب هادي مع الأب بدون شاشات',
      routineTaskEn: '15 minutes of screen-free connection and play with Dad',
      routineTime: '07:00 م',
    },
    {
      id: 'dad-shared-partnership',
      role: 'father',
      badgeAr: '🤝 شراكة البيت',
      badgeEn: '🤝 Shared teamwork',
      titleAr: `مبادرتك بتريح البيت كله ${dadLabelAr}`,
      titleEn: `Your initiative lightens the whole home, ${dadLabelEn}`,
      bodyAr: `لما تستلم مهمة ثابتة ${childContextAr} (زي روتين ما قبل النوم أو تحضير العشاء أو مشوار التمرين) من غير ما يتطلب منك، ده بيقلل الضغط النفسي على الأم ويزود الترابط الأسري.`,
      bodyEn: `Owning a predictable part of the routine ${childContextEn}—like bedtime stories or bath time—relieves mental load and strengthens family trust.`,
      practicalStepAr: 'اختار مهمة مسائية واحدة النهارده واستلمها بالكامل عشان تدي مساحة راحة للطرف التاني.',
      practicalStepEn: 'Take full ownership of one evening routine step today so your partner can rest.',
      routineTaskAr: 'تولّي الأب لروتين المساء أو القصة مع الأطفال',
      routineTaskEn: 'Dad leads the evening wind-down or bedtime story',
      routineTime: '08:15 م',
    },
    {
      id: 'dad-calm-anchor',
      role: 'father',
      badgeAr: '⚓ هدوء وقت التوتر',
      badgeEn: '⚓ Calm anchor',
      titleAr: `هدوء صوتك هو بوصلة الأمان ${childContextAr}`,
      titleEn: `Your calm voice is the safety anchor ${childContextEn}`,
      bodyAr: `وقت توتر البيت أو بكاء الأطفال، نبرة صوتك الهادية بتوصل رسالة فورية إن الموقف تحت السيطرة وإن مفيش داعي للقلق أو التصعيد.`,
      bodyEn: `When the house feels loud or tense, a steady, low voice signals to everyone that things are safe and manageable.`,
      practicalStepAr: 'لو حسيت بضغط، خد نفس عميق ووطّي نبرة صوتك درجة قبل ما توجه أو ترد.',
      practicalStepEn: 'When tension rises, pause for one breath and lower your voice before responding.',
      routineTaskAr: '١٠ دقائق مراجعة هادية لاحتياجات البيت بين الأب والأم',
      routineTaskEn: '10-minute calm evening check-in between Dad and Mom',
      routineTime: '09:00 م',
    },
  ];
}

/**
 * Generates age- and stage-aware emotional wellbeing guidance for the selected child,
 * incorporating their real name, saved interests, and current selected mood.
 */
export function buildChildStageEmotionalGuidance(params: {
  child: ChildProfile | null | undefined;
  selectedMoodId?: ChildMoodId | null;
  recentRecords?: RecommendationProfile['recentRecords'];
}): StageEmotionalGuidance {
  const { child, selectedMoodId, recentRecords } = params;
  if (!child) {
    return {
      stageCode: 'unknown',
      stageBadgeAr: '👶 أضف ملف الطفل',
      stageBadgeEn: '👶 Add child profile',
      coreNeedAr: 'أضيفوا ملف الطفل وتاريخ ميلاده لتظهر إرشادات النمو العاطفي المناسبة لعمره.',
      coreNeedEn: 'Add a child profile and birth date to see age-appropriate emotional development guidance.',
      communicationTipAr: 'التواصل الهادئ وتسمية المشاعر بدون أحكام يدعمان أمان الطفل في كل الأعمار.',
      communicationTipEn: 'Calm connection and naming feelings without judgment support emotional safety at every age.',
      moodFollowUpAr: 'اختاروا الطفل وسجلوا حالته الشعورية لمتابعة احتياجه اليومي.',
      moodFollowUpEn: 'Select a child and log their current mood for tailored daily support.',
      suggestedRoutineTaskAr: '١٠ دقائق تواصل واستماع هادي مع طفلك',
      suggestedRoutineTaskEn: '10 minutes of calm listening and connection with your child',
    };
  }

  const nameAr = sanitizeUserText(locText(child.name, 'ar'), 50) || 'طفلك';
  const nameEn = sanitizeUserText(locText(child.name, 'en'), 50) || 'your child';
  const hasBirth = Boolean(child.birth && !Number.isNaN(new Date(`${child.birth}T00:00:00`).getTime()));
  const ageInfoAr = hasBirth ? calculateChildAge(child.birth, 'ar') : null;
  const ageInfoEn = hasBirth ? calculateChildAge(child.birth, 'en') : null;
  const stageCode: AgeStage | 'unknown' = ageInfoAr ? ageInfoAr.stageCode : 'unknown';

  const interests = getCleanChildInterests(child, recentRecords);
  const topInterestAr = interests.ar[0] || null;
  const topInterestEn = interests.en[0] || null;

  const isDistressedMood =
    selectedMoodId === 'sad' ||
    selectedMoodId === 'angry' ||
    selectedMoodId === 'worried' ||
    selectedMoodId === 'overwhelmed' ||
    selectedMoodId === 'tired';

  if (stageCode === '0-2') {
    return {
      stageCode: '0-2',
      stageBadgeAr: `👶 مرحلة الرضع والخطوات الأولى (${ageInfoAr?.label || '٠–٢ سنة'})`,
      stageBadgeEn: `👶 Infant & Toddler Stage (${ageInfoEn?.label || '0–2 yrs'})`,
      coreNeedAr: `في هذه المرحلة، يعبّر ${nameAr} عن مشاعره بالبكاء أو الحركة أو تعبيرات الوجه، ويحتاج للاستجابة الحنونة السريعة والروتين المتوقع ليشعر بالأمان.`,
      coreNeedEn: `At this stage, ${nameEn} communicates through cries, movement, and facial expressions, needing warm responsiveness and predictable routines to feel safe.`,
      communicationTipAr: topInterestAr
        ? `استخدموا نبرة صوت دافئة ولمسة مطمئنة، وعندما يكون ${nameAr} هادئاً شاركوه تفاعلاً بسيطاً في «${topInterestAr}» بدون مبالغة في المثيرات.`
        : `استخدموا نبرة صوت هادئة وتواصل بصري قريب، وسمّوا الشعور بكلمات بسيطة مثل: «أنا جنبك، إنت في أمان».`,
      communicationTipEn: topInterestEn
        ? `Use a soothing voice and gentle touch; when ${nameEn} is settled, share a brief moment with ${topInterestEn} without overstimulation.`
        : `Use a gentle voice and close eye contact, naming feelings with simple words like “I’m right here, you’re safe.”`,
      moodFollowUpAr: isDistressedMood
        ? `عند ضيق أو إرهاق ${nameAr}، راجعوا أولاً الاحتياجات الجسدية (الجوع، الحفاض، الحاجة للنوم، أو الإضاءة والصوت) قبل أي نشاط.`
        : topInterestAr
        ? `وقت اعتدال مزاج ${nameAr} فرصة جميلة لـ ٥ دقائق تفاعل دافئ مع «${topInterestAr}» وملاحظة استجابته.`
        : `وقت اعتدال مزاج ${nameAr} فرصة جميلة لـ ٥ دقائق تفاعل بصري وابتسامة متبادلة.`,
      moodFollowUpEn: isDistressedMood
        ? `When ${nameEn} seems tired or distressed, check physical cues first (feeding, diaper, sleep readiness, or noise/light) before starting an activity.`
        : topInterestEn
        ? `While ${nameEn} is settled, enjoy 5 unhurried minutes with ${topInterestEn} and follow their cues.`
        : `While ${nameEn} is settled, enjoy 5 unhurried minutes of face-to-face connection and warm smiles.`,
      suggestedRoutineTaskAr: topInterestAr
        ? `وقت تواصل حنوني هادي مع ${nameAr} وتجربة ${topInterestAr}`
        : `١٠ دقائق تواصل حسي وتهدئة دافئة مع ${nameAr}`,
      suggestedRoutineTaskEn: topInterestEn
        ? `Gentle connection time with ${nameEn} and ${topInterestEn}`
        : `10 minutes of soothing sensory connection with ${nameEn}`,
    };
  }

  if (stageCode === '2-5') {
    return {
      stageCode: '2-5',
      stageBadgeAr: `🎨 مرحلة الحضانة والخيال (${ageInfoAr?.label || '٢–٥ سنوات'})`,
      stageBadgeEn: `🎨 Preschool & Imagination Stage (${ageInfoEn?.label || '2–5 yrs'})`,
      coreNeedAr: `مشاعر ${nameAr} في هذا السن تكون كبيرة وسريعة التغير؛ يحتاج لمساعدتكم في تسمية مشاعره وإعطائه اختيارين بسيطين يحسسوه بالاستقلالية.`,
      coreNeedEn: `${nameEn}’s feelings at this age are big and shift quickly; they need help naming emotions and having two simple choices to feel capable.`,
      communicationTipAr: topInterestAr
        ? `استخدموا اللعب والخيال في الحوار مع ${nameAr}؛ يمكنكم ربط الحديث عن المشاعر بحكاية صغيرة أو نشاط يحبه مثل «${topInterestAr}».`
        : `انزلوا لمستوى نظر ${nameAr}، واسمعوا منه بجمل قصيرة وواضحة بدل المحاضرات الطويلة.`,
      communicationTipEn: topInterestEn
        ? `Use play and stories when talking with ${nameEn}; connect feelings to a short story or favorite activity like ${topInterestEn}.`
        : `Get down to ${nameEn}’s eye level and use short, clear sentences instead of long explanations.`,
      moodFollowUpAr: isDistressedMood
        ? topInterestAr
          ? `بعد أن يهدأ ${nameAr} بشربه للماء أو حضن مطمئن، اعرضوا عليه نشاطاً هادئاً يحبه مثل «${topInterestAr}» بدون إجبار على الكلام فوراً.`
          : `بعد أن يهدأ ${nameAr} بحضن مطمئن أو تنفس الفراشة، اعرضوا عليه اختيارين هادئين لاستعادة توازنه.`
        : topInterestAr
        ? `استثمروا راحة ${nameAr} الحالية في ١٠ دقائق مشتركة من «${topInterestAr}» مع مدح محاولته وخياله.`
        : `استثمروا راحة ${nameAr} الحالية في ١٠ دقائق لعب حر يقوده بنفسه.`,
      moodFollowUpEn: isDistressedMood
        ? topInterestEn
          ? `Once ${nameEn} settles with a hug or sip of water, offer a calm favorite like ${topInterestEn} without forcing an immediate talk.`
          : `Once ${nameEn} settles with a hug or slow breathing, offer two calm choices to help them recover.`
        : topInterestEn
        ? `Build on ${nameEn}’s positive mood with 10 shared minutes of ${topInterestEn}, praising their imagination.`
        : `Build on ${nameEn}’s positive mood with 10 minutes of child-led free play.`,
      suggestedRoutineTaskAr: topInterestAr
        ? `١٠ دقائق لعب وتعبير عن المشاعر مع ${nameAr} من خلال ${topInterestAr}`
        : `١٠ دقائق تسمية المشاعر ولعب تخيلي مع ${nameAr}`,
      suggestedRoutineTaskEn: topInterestEn
        ? `10 minutes of expressive play with ${nameEn} through ${topInterestEn}`
        : `10 minutes of feeling cards and imaginative play with ${nameEn}`,
    };
  }

  if (stageCode === '5-8') {
    return {
      stageCode: '5-8',
      stageBadgeAr: `🚀 مرحلة المدرسة والاستقلالية (${ageInfoAr?.label || '٥–٨ سنوات'})`,
      stageBadgeEn: `🚀 School & Independence Stage (${ageInfoEn?.label || '5–8 yrs'})`,
      coreNeedAr: `في سن المدرسة، يهتم ${nameAr} برأي الكبار والأصدقاء ويشعر بالإحباط إذا قورن بغيره؛ يحتاج للاستماع المحترم والتركيز على جهده لا على النتيجة فقط.`,
      coreNeedEn: `At school age, ${nameEn} cares deeply about fairness and peer dynamics; they need respectful listening and praise for effort rather than comparisons.`,
      communicationTipAr: topInterestAr
        ? `ابدأوا الحديث مع ${nameAr} بسؤال مفتوح وهو يمارس نشاطاً مريحاً أو بعد وقت «${topInterestAr}» بدلاً من الاستجواب المباشر فور العودة.`
        : `ابدأوا الحديث مع ${nameAr} بالاستماع لوجهة نظره للآخر قبل تقديم النصيحة أو التصحيح.`,
      communicationTipEn: topInterestEn
        ? `Open conversations naturally while ${nameEn} is relaxed or after enjoying ${topInterestEn}, rather than quizzing them right away.`
        : `Hear ${nameEn}’s full perspective before offering advice or correction.`,
      moodFollowUpAr: isDistressedMood
        ? topInterestAr
          ? `امنحوا ${nameAr} بضع دقائق ليفصل ويهدأ، ثم اسألوه إن كان يحب الحكي الآن أو يفضّل قضاء وقت قصير في «${topInterestAr}» أولاً.`
          : `امنحوا ${nameAr} مساحة قصيرة ليهدأ مع طمأنته أنكم بجانبه، ثم فكّروا معاً في حل عملي خطوة بخطوة.`
        : topInterestAr
        ? `شاركوا ${nameAr} حماسه واسألوه عن فكرة جديدة يحب يجربها اليوم في «${topInterestAr}».`
        : `شاركوا ${nameAr} حماسه واطلبوا منه يختار نشاطاً عائلياً قصيراً لليوم.`,
      moodFollowUpEn: isDistressedMood
        ? topInterestEn
          ? `Give ${nameEn} a few minutes to decompress, then ask whether they want to talk now or spend a little time with ${topInterestEn} first.`
          : `Give ${nameEn} a short space to settle while reassuring them you are nearby, then problem-solve together.`
        : topInterestEn
        ? `Share ${nameEn}’s positive energy and ask what new idea they would like to try in ${topInterestEn}.`
        : `Share ${nameEn}’s positive energy and let them pick a short family activity for today.`,
      suggestedRoutineTaskAr: topInterestAr
        ? `١٥ دقيقة حوار ودي ومشاركة في ${topInterestAr} مع ${nameAr}`
        : `١٥ دقيقة حوار هادي بدون شاشات مع ${nameAr}`,
      suggestedRoutineTaskEn: topInterestEn
        ? `15 minutes of friendly chat and ${topInterestEn} with ${nameEn}`
        : `15 minutes of screen-free conversation with ${nameEn}`,
    };
  }

  return {
    stageCode: 'unknown',
    stageBadgeAr: `🌱 متابعة مشاعر ${nameAr}`,
    stageBadgeEn: `🌱 ${nameEn}’s Emotional Wellbeing`,
    coreNeedAr: `يحتاج ${nameAr} للشعور بأن مشاعره مقبولة ومسموعة؛ أضيفوا تاريخ الميلاد في ملف الطفل لتظهر إرشادات المرحلة العمرية بدقة.`,
    coreNeedEn: `${nameEn} needs to know their feelings are heard and accepted; add their birth date in the child profile for stage-specific guidance.`,
    communicationTipAr: topInterestAr
      ? `اربطوا لحظات الحوار والتهدئة مع ${nameAr} بالأنشطة التي يحبها مثل «${topInterestAr}».`
      : `استمعوا لـ ${nameAr} بهدوء وسمّوا الشعور بكلمات بسيطة ومطمئنة.`,
    communicationTipEn: topInterestEn
      ? `Connect calm check-ins with ${nameEn} to activities they enjoy, such as ${topInterestEn}.`
      : `Listen calmly to ${nameEn} and name feelings with simple, reassuring words.`,
    moodFollowUpAr: isDistressedMood
      ? `خففوا المطالب الحالية وامنحوا ${nameAr} وقتاً هادئاً ليستعيد راحته.`
      : `استغلوا هدوء ${nameAr} في نشاط مشترك بسيط يعزز الترابط بينكم.`,
    moodFollowUpEn: isDistressedMood
      ? `Lower immediate demands and give ${nameEn} calm space to recover.`
      : `Use this settled moment for a simple shared activity with ${nameEn}.`,
    suggestedRoutineTaskAr: topInterestAr
      ? `١٠ دقائق تواصل ونشاط ${topInterestAr} مع ${nameAr}`
      : `١٠ دقائق تواصل واستماع هادي مع ${nameAr}`,
    suggestedRoutineTaskEn: topInterestEn
      ? `10 minutes of connection and ${topInterestEn} with ${nameEn}`
      : `10 minutes of calm connection with ${nameEn}`,
  };
}

/**
 * Builds 4 distinct, non-repetitive Positive Parenting daily guidance cards
 * tailored to the selected child's name, age stage, and saved interests.
 */
export function buildPositiveParentingAdviceList(params: {
  child: ChildProfile | null | undefined;
  recentRecords?: RecommendationProfile['recentRecords'];
}): PositiveParentingAdvice[] {
  const { child, recentRecords } = params;
  const nameAr = child ? sanitizeUserText(locText(child.name, 'ar'), 50) || 'طفلك' : 'طفلك';
  const nameEn = child ? sanitizeUserText(locText(child.name, 'en'), 50) || 'your child' : 'your child';
  const hasBirth = Boolean(child?.birth && !Number.isNaN(new Date(`${child.birth}T00:00:00`).getTime()));
  const stageCode: AgeStage | 'unknown' = hasBirth && child ? calculateChildAge(child.birth, 'ar').stageCode : 'unknown';
  const interests = getCleanChildInterests(child, recentRecords);
  const topInterestAr = interests.ar[0] || null;
  const topInterestEn = interests.en[0] || null;

  return [
    {
      id: 'confidence',
      emoji: '🌟',
      labelAr: 'بناء الثقة والتشجيع',
      labelEn: 'Confidence & Praise',
      headlineAr:
        stageCode === '0-2'
          ? `شجّعوا محاولات ${nameAr} الأولى بابتسامة وتفاعل دافئ`
          : `امدحوا المجهود المحدد اللي بيعمله ${nameAr} مش بس النتيجة`,
      headlineEn:
        stageCode === '0-2'
          ? `Encourage ${nameEn}’s early attempts with warm smiles and presence`
          : `Praise ${nameEn}’s specific effort and persistence, not just the result`,
      adviceAr: topInterestAr
        ? `لما يجرّب ${nameAr} حاجة في «${topInterestAr}» أو يساعد في ترتيب بسيط، اوصفوا اللي عجبكم بالتحديد بدل المدح العام؛ ده بيثبت ثقته في قدرته على المحاولة.`
        : `لما يحاول ${nameAr} يعمل خطوة جديدة أو يعيد المحاولة بعد خطأ، ركّزوا على صبره ومجهوده علشان يتعلم إن المحاولة في حد ذاتها نجاح.`,
      adviceEn: topInterestEn
        ? `When ${nameEn} practices ${topInterestEn} or helps with a small task, describe the exact effort you noticed; specific praise builds lasting confidence.`
        : `When ${nameEn} tries something new or keeps going after a mistake, highlight their patience and effort so they value trying.`,
      sayThisAr: topInterestAr
        ? `«عجبني إنك ركّزت وجربت بنفسك في ${topInterestAr} يا ${nameAr}!»`
        : `«أنا فخور إنك حاولت تاني ومستسلمتش يا ${nameAr}.»`,
      sayThisEn: topInterestEn
        ? `“I loved how focused and patient you were with ${topInterestEn}, ${nameEn}!”`
        : `“I’m proud of how you tried again and didn’t give up, ${nameEn}.”`,
      routineTaskAr: `تشجيع محاولة محددة لـ ${nameAr} اليوم بكلمات واضحة`,
      routineTaskEn: `Notice and praise one specific effort by ${nameEn} today`,
      routineTime: '05:30 م',
    },
    {
      id: 'boundaries',
      emoji: '🛡️',
      labelAr: 'حدود هادئة بدون صدام',
      labelEn: 'Calm Boundaries',
      headlineAr: `ثبات القاعدة مع تعاطف واضح يطمن ${nameAr}`,
      headlineEn: `Firm limits paired with empathy help ${nameEn} feel secure`,
      adviceAr:
        stageCode === '0-2'
          ? `في سن ${nameAr}، التوجيه يكون بتحويل الانتباه بهدوء وتأمين المكان بدل الأوامر الطويلة أو العصبية.`
          : `التربية الإيجابية بتجمع بين الحزم واللطف: نقبل شعور ${nameAr} بالضيق لو منعه شيء، وفي نفس الوقت نثبت على القاعدة بهدوء ومن غير صراخ.`,
      adviceEn:
        stageCode === '0-2'
          ? `At ${nameEn}’s age, guide behavior through gentle redirection and a safe environment rather than long lectures.`
          : `Positive parenting pairs kindness with firmness: validate ${nameEn}’s disappointment while holding the boundary calmly without shouting.`,
      sayThisAr: `«فاهم إنك كان نفسك تكمل يا ${nameAr}، بس دلوقتي وقت الراحة، وبكرة نكمل.»`,
      sayThisEn: `“I know you wanted to keep going, ${nameEn}. Right now it is time to rest, and we can continue tomorrow.”`,
      routineTaskAr: `تطبيق قاعدة يومية مع ${nameAr} بنبرة هادئة واختيار بديل`,
      routineTaskEn: `Practice one calm boundary with ${nameEn} using a gentle alternative`,
      routineTime: '06:00 م',
    },
    {
      id: 'independence',
      emoji: '🌱',
      labelAr: 'الاستقلالية والاختيار',
      labelEn: 'Healthy Independence',
      headlineAr:
        stageCode === '5-8'
          ? `أشركوا ${nameAr} في ترتيب خطوات يومه ومسؤولياته الصغيرة`
          : `قدموا لـ ${nameAr} اختيارين مقبولين بدل الأوامر المباشرة`,
      headlineEn:
        stageCode === '5-8'
          ? `Involve ${nameEn} in planning their daily steps and small responsibilities`
          : `Offer ${nameEn} two acceptable choices instead of direct commands`,
      adviceAr: topInterestAr
        ? `إعطاء ${nameAr} مساحة يختار فيها تفاصيل بسيطة (زي ترتيب أدوات «${topInterestAr}» أو اختيار ملابس البيت) يقلل العناد وينمّي شخصيته.`
        : `لما يختار ${nameAr} بين بديلين كلاهما مناسب ليكم، بيحس باحترام رغبته وبيقل الصدام اليومي على التفاصيل الصغيرة.`,
      adviceEn: topInterestEn
        ? `Letting ${nameEn} make small decisions—like organizing their ${topInterestEn} items or picking pajamas—reduces resistance and builds responsibility.`
        : `When ${nameEn} chooses between two parent-approved options, they feel respected and daily power struggles decrease.`,
      sayThisAr: `«تحب نبدأ بترتيب الألعاب الأول ولا نجهز هدوم بكرة يا ${nameAr}؟»`,
      sayThisEn: `“Would you like to tidy up the toys first or pick tomorrow’s outfit, ${nameEn}?”`,
      routineTaskAr: `إعطاء ${nameAr} اختيارين بسيطين في روتين اليوم`,
      routineTaskEn: `Give ${nameEn} two simple choices during today’s routine`,
      routineTime: '04:30 م',
    },
    {
      id: 'transitions',
      emoji: '⏳',
      labelAr: 'تمهيد الانتقال بين الأنشطة',
      labelEn: 'Smooth Transitions',
      headlineAr: `التنبيه المسبق يسهّل على ${nameAr} الانتقال من اللعب للروتين`,
      headlineEn: `Advance notice helps ${nameEn} move smoothly from play to routine`,
      adviceAr: topInterestAr
        ? `الأطفال بيحتاجوا وقت لإنهاء تركيزهم؛ نبّهوا ${nameAr} قبل انتهاء وقت اللعب أو «${topInterestAr}» بخمس دقائق علشان يستعد نفسياً بدون مفاجأة.`
        : `الانتقال المفاجئ من اللعب للأكل أو النوم بيسبب توتر؛ استخدموا إشارة ثابتة وتنبيه هادي قبلها بخمس دقائق.`,
      adviceEn: topInterestEn
        ? `Children need time to wrap up their focus; give ${nameEn} a calm 5-minute heads-up before ending ${topInterestEn} or playtime.`
        : `Sudden stops trigger frustration; use a gentle 5-minute warning and a predictable cue before switching to meals or bedtime.`,
      sayThisAr: `«يا ${nameAr}، فاضل خمس دقايق ونختم اللعب علشان نغسل إيدينا ونتعشى سوا.»`,
      sayThisEn: `“${nameEn}, we have five minutes left to finish playing before we wash hands for dinner.”`,
      routineTaskAr: `استخدام تنبيه الـ ٥ دقائق قبل الانتقال لنشاط جديد مع ${nameAr}`,
      routineTaskEn: `Use a 5-minute gentle transition cue with ${nameEn}`,
      routineTime: '07:30 م',
    },
  ];
}

/**
 * Personalizes the selected parenting scenario with age-stage context, saved interests,
 * and sibling awareness so guidance adapts to the real family profile.
 */
export function buildScenarioPersonalizedAddOn(params: {
  scenarioId: ParentingScenarioId;
  child: ChildProfile | null | undefined;
  kidsCount: number;
  recentRecords?: RecommendationProfile['recentRecords'];
}): ScenarioPersonalizedAddOn {
  const { scenarioId, child, kidsCount, recentRecords } = params;
  const nameAr = child ? sanitizeUserText(locText(child.name, 'ar'), 50) || 'طفلك' : 'طفلك';
  const nameEn = child ? sanitizeUserText(locText(child.name, 'en'), 50) || 'your child' : 'your child';
  const hasBirth = Boolean(child?.birth && !Number.isNaN(new Date(`${child.birth}T00:00:00`).getTime()));
  const stageCode: AgeStage | 'unknown' = hasBirth && child ? calculateChildAge(child.birth, 'ar').stageCode : 'unknown';
  const interests = getCleanChildInterests(child, recentRecords);
  const firstInterestAr = interests.ar[0] || 'اللعب بالمكعبات';
  const secondInterestAr = interests.ar[1] || 'الرسم أو قراءة قصة';
  const firstInterestEn = interests.en[0] || 'building blocks';
  const secondInterestEn = interests.en[1] || 'drawing or a short story';

  switch (scenarioId) {
    case 'big-feelings':
      return {
        stageNoteAr:
          stageCode === '0-2'
            ? `تخصيص لعمر ${nameAr} (٠–٢ سنة): الانفعال هنا غالباً نتيجة إرهاق أو جوع أو مثيرات زائدة؛ الاحتواء الجسدي وتهدئة المكان أهم من الشرح.`
            : stageCode === '2-5'
            ? `تخصيص لعمر ${nameAr} (٢–٥ سنوات): الجهاز العصبي في هذا السن لا يزال يتعلم التهدئة الذاتية؛ وجودكم الهادئ بجانبه يعلمه الأمان.`
            : `تخصيص لـ ${nameAr}: بعد انتهاء الانفعال تماماً، اسمعوا وجهة نظره في مكان هادي بدون عتاب مطوّل.`,
        stageNoteEn:
          stageCode === '0-2'
            ? `Tailored for ${nameEn} (0–2 yrs): Meltdowns at this age usually signal fatigue, hunger, or overstimulation; physical comfort and a quiet space come first.`
            : stageCode === '2-5'
            ? `Tailored for ${nameEn} (2–5 yrs): Self-regulation is still developing; your calm presence co-regulates their emotions.`
            : `Tailored for ${nameEn}: Once completely calm, listen to their perspective privately without a long lecture.`,
        personalizedPhraseAr: `«يا ${nameAr}، أنا شايف إنك متضايق دلوقتي. أنا جنبك لحد ما نهدى، وبعدين نختار نرتاح أو نعمل ${firstInterestAr}.»`,
        personalizedPhraseEn: `“${nameEn}, I can see you’re upset right now. I’m here with you until we’re calm, and then we can rest or do ${firstInterestEn}.”`,
        preventiveTaskAr: `وقت تهدئة واستراحة حسية لـ ${nameAr} قبل ذروة الإرهاق`,
        preventiveTaskEn: `Calm sensory reset break for ${nameEn} before overtiredness`,
        preventiveTime: '05:00 م',
      };
    case 'screen-change':
      return {
        stageNoteAr: `تخصيص لـ ${nameAr}: الانتقال من الشاشة يكون أسهل عندما نربطه فوراً بنشاط ملموس يحبه الطفل مثل «${firstInterestAr}» أو «${secondInterestAr}».`,
        stageNoteEn: `Tailored for ${nameEn}: Stepping away from screens is easier when bridged directly into a hands-on favorite like ${firstInterestEn} or ${secondInterestEn}.`,
        personalizedPhraseAr: `«يا ${nameAr}، فاضل خمس دقايق ونقفل الشاشة. تحب بعدها نبدأ في ${firstInterestAr} ولا ${secondInterestAr}؟»`,
        personalizedPhraseEn: `“${nameEn}, five minutes left on the screen. After we turn it off, would you prefer ${firstInterestEn} or ${secondInterestEn}?”`,
        preventiveTaskAr: `نشاط بديل للشاشات (${firstInterestAr}) مع ${nameAr}`,
        preventiveTaskEn: `Screen-free transition activity (${firstInterestEn}) with ${nameEn}`,
        preventiveTime: '05:45 م',
      };
    case 'school-worry':
      return {
        stageNoteAr:
          stageCode === '0-2' || stageCode === '2-5'
            ? `تخصيص لـ ${nameAr}: طقس الوداع القصير والثابت مع وعد محدد بوقت الرجوع يقلل قلق الانفصال تدريجياً.`
            : `تخصيص لـ ${nameAr}: اسألوه عن تفصيلة واحدة مريحة في يومه الدراسي واتفّقوا على نشاط مفضل مثل «${firstInterestAr}» بعد العودة.`,
        stageNoteEn:
          stageCode === '0-2' || stageCode === '2-5'
            ? `Tailored for ${nameEn}: A short, predictable goodbye ritual and a clear return routine ease separation worry.`
            : `Tailored for ${nameEn}: Focus on one comfortable part of the school day and look forward to ${firstInterestEn} after returning.`,
        personalizedPhraseAr: `«طبيعي تحس بقلق يا ${nameAr}. هنسلم على المعلمة، ولما ترجع بالسلامة مستنيك وقت حلو في ${firstInterestAr}.»`,
        personalizedPhraseEn: `“It’s okay to feel a bit nervous, ${nameEn}. We’ll say hello to your teacher, and when you’re back we have time for ${firstInterestEn}.”`,
        preventiveTaskAr: `تجهيز هادي لصباح ${nameAr} وطقس وداع مطمئن`,
        preventiveTaskEn: `Calm morning prep and reassuring goodbye ritual for ${nameEn}`,
        preventiveTime: '07:15 ص',
      };
    case 'siblings':
      return {
        stageNoteAr:
          kidsCount > 1
            ? `في أسرتكم (${kidsCount} أطفال): تخصيص ١٠ دقائق فردية لكل طفل على حدة يقلل الغيرة والتنافس على انتباه الوالدين.`
            : `تخصيص لـ ${nameAr}: هذه الخطوات تفيد أيضاً عند الخلاف مع الأصدقاء أو الأقارب على مشاركة الألعاب.`,
        stageNoteEn:
          kidsCount > 1
            ? `In your family (${kidsCount} children): Spending 10 one-on-one minutes with each child daily reduces rivalry for parent attention.`
            : `Tailored for ${nameEn}: These same steps help during playdates with cousins or friends when sharing toys.`,
        personalizedPhraseAr: `«كل واحد فيكم مهم عندي. هسمع ${nameAr} الأول وبعدين أسمع الطرف التاني، ونتفق على تقسيم الدور بالعدل.»`,
        personalizedPhraseEn: `“Both of you matter to me. I’ll listen to ${nameEn} first and then the other side, and we’ll agree on fair turns.”`,
        preventiveTaskAr: `١٠ دقائق وقت فردي خاص مع ${nameAr} لتعزيز الأمان وتقليل الغيرة`,
        preventiveTaskEn: `10 minutes of dedicated 1-on-1 time with ${nameEn}`,
        preventiveTime: '06:15 م',
      };
    case 'bedtime':
      return {
        stageNoteAr: `تخصيص لـ ${nameAr}: تهدئة الإضاءة قبل النوم بـ ٣٠ دقيقة مع نشاط هادئ غير محفز يساعد الجسم على الاسترخاء طبيعياً.`,
        stageNoteEn: `Tailored for ${nameEn}: Dimming lights 30 minutes before bed with a low-stimulation activity helps their body wind down naturally.`,
        personalizedPhraseAr: `«دلوقتي وقت راحة جسمنا يا ${nameAr}. تحب نسمع حدوتة قصيرة ولا نحكي عن أحلى حاجة عملتها في ${firstInterestAr} النهارده؟»`,
        personalizedPhraseEn: `“It’s time for our bodies to rest, ${nameEn}. Would you like a short story or a quiet chat about ${firstInterestEn} today?”`,
        preventiveTaskAr: `بدء روتين تهدئة الإضاءة وقصة المساء مع ${nameAr}`,
        preventiveTaskEn: `Start dimmed-lights bedtime routine and story with ${nameEn}`,
        preventiveTime: '08:00 م',
      };
    case 'learning-frustration':
      return {
        stageNoteAr: `تخصيص لـ ${nameAr}: تقسيم المهمة لجزء صغير مدته ١٠ دقائق يتبعه استراحة قصيرة في «${firstInterestAr}» يحافظ على دافعيته للتعلم.`,
        stageNoteEn: `Tailored for ${nameEn}: Breaking learning into a 10-minute chunk followed by a short ${firstInterestEn} break keeps motivation alive.`,
        personalizedPhraseAr: `«مش لازم نخلص كل حاجة دلوقتي يا ${nameAr}. تعال نحل خطوة واحدة سوا، وبعدها ناخد استراحة لطيفة في ${firstInterestAr}.»`,
        personalizedPhraseEn: `“We don’t need to finish it all right now, ${nameEn}. Let’s do one step together, then take a nice break with ${firstInterestEn}.”`,
        preventiveTaskAr: `جلسة تعلم قصيرة مقسمة بالخطوات مع ${nameAr}`,
        preventiveTaskEn: `Short step-by-step learning session with ${nameEn}`,
        preventiveTime: '04:15 م',
      };
  }
}

/**
 * Builds 3 family communication & bonding rituals personalized to the selected child's
 * age stage, saved interests, and family size.
 */
export function buildFamilyBondingRituals(params: {
  child: ChildProfile | null | undefined;
  kidsCount: number;
  recentRecords?: RecommendationProfile['recentRecords'];
}): FamilyBondingRitual[] {
  const { child, kidsCount, recentRecords } = params;
  const nameAr = child ? sanitizeUserText(locText(child.name, 'ar'), 50) || 'طفلك' : 'طفلك';
  const nameEn = child ? sanitizeUserText(locText(child.name, 'en'), 50) || 'your child' : 'your child';
  const hasBirth = Boolean(child?.birth && !Number.isNaN(new Date(`${child.birth}T00:00:00`).getTime()));
  const stageCode: AgeStage | 'unknown' = hasBirth && child ? calculateChildAge(child.birth, 'ar').stageCode : 'unknown';
  const interests = getCleanChildInterests(child, recentRecords);
  const topInterestAr = interests.ar[0] || null;
  const topInterestEn = interests.en[0] || null;

  return [
    {
      id: 'dialogue',
      emoji: '💬',
      labelAr: 'حوار دافئ بدون شاشات',
      labelEn: 'Warm Family Dialogue',
      titleAr:
        stageCode === '0-2'
          ? `تواصل بصري واستجابة دافئة مع ${nameAr}`
          : `سؤال اليوم المفتوح مع ${nameAr}`,
      titleEn:
        stageCode === '0-2'
          ? `Warm eye contact and responsive babble with ${nameEn}`
          : `Open-ended daily question with ${nameEn}`,
      descriptionAr:
        stageCode === '0-2'
          ? `في عمر ${nameAr}، الحوار يبدأ بتقليد أصواته، الابتسام له، ووصف ما تفعله معه بهدوء أثناء الرعاية اليومية.`
          : `الأسئلة المفتوحة وقت الوجبة أو قبل النوم تفتح قلب ${nameAr} للحكي بدون شعور بالاستجواب أو التقييم.`,
      descriptionEn:
        stageCode === '0-2'
          ? `At ${nameEn}’s age, communication starts by echoing their sounds, smiling back, and narrating daily care gently.`
          : `Open-ended questions during snacks or bedtime invite ${nameEn} to share freely without feeling tested.`,
      promptAr:
        stageCode === '0-2'
          ? `«أنا سامعك يا ${nameAr}.. تعال نحكي سوا وإحنا بنلعب بهدوء.»`
          : topInterestAr
          ? `«يا ${nameAr}، إيه أكتر لحظة بسطتك النهارده؟ ولو هنخترع فكرة جديدة في ${topInterestAr} تحب تكون إيه؟»`
          : `«يا ${nameAr}، إيه أكتر حاجة خلّتك تبتسم النهارده، وإيه الحاجة اللي تحب نجربها سوا بكرة؟»`,
      promptEn:
        stageCode === '0-2'
          ? `“I hear you, ${nameEn}—let’s chat and smile together while we play gently.”`
          : topInterestEn
          ? `“${nameEn}, what was the happiest moment of your day? And if we tried something new in ${topInterestEn}, what would you pick?”`
          : `“${nameEn}, what made you smile most today, and what is one thing you’d love to do together tomorrow?”`,
      routineTaskAr: `١٠ دقائق حوار دافئ واستماع لـ ${nameAr} بدون موبايلات`,
      routineTaskEn: `10 minutes of phone-free warm conversation with ${nameEn}`,
      routineTime: '06:45 م',
    },
    {
      id: 'connection_ritual',
      emoji: '🧩',
      labelAr: 'نشاط ترابط (١٠ دقائق)',
      labelEn: '10-Min Bonding Ritual',
      titleAr: topInterestAr
        ? `١٠ دقائق يقودها ${nameAr} في «${topInterestAr}»`
        : `١٠ دقائق وقت خاص يقوده ${nameAr}`,
      titleEn: topInterestEn
        ? `10 child-led minutes with ${nameEn} around ${topInterestEn}`
        : `10 minutes of child-led special time with ${nameEn}`,
      descriptionAr: topInterestAr
        ? `اتركوا لـ ${nameAr} قيادة النشاط بطريقته في «${topInterestAr}» لمدة عشر دقائق كاملة بدون تصحيح أو توجيه، فقط مشاركة واستمتاع.`
        : `عشر دقائق يومية يختار فيها ${nameAr} طريقة اللعب بدون أوامر أو تصحيح تقوّي العلاقة وتقلل نوبات العناد بشكل ملحوظ.`,
      descriptionEn: topInterestEn
        ? `Let ${nameEn} lead 10 uninterrupted minutes of ${topInterestEn} their own way—no correcting or quizzing, just shared joy.`
        : `Ten daily minutes where ${nameEn} chooses the play activity without correction strengthens trust and reduces power struggles.`,
      promptAr: topInterestAr
        ? `«العشر دقايق دول بتوعك يا ${nameAr}.. تحب نبدأ إزاي في ${topInterestAr}؟»`
        : `«العشر دقايق دول وقتنا الخاص يا ${nameAr}.. إنت القائد، تحب نلعب إيه؟»`,
      promptEn: topInterestEn
        ? `“These 10 minutes are all yours, ${nameEn}—how should we start with ${topInterestEn}?”`
        : `“These 10 minutes are our special time, ${nameEn}—you’re the leader, what shall we play?”`,
      routineTaskAr: topInterestAr
        ? `١٠ دقائق وقت خاص يقوده ${nameAr} في ${topInterestAr}`
        : `١٠ دقائق وقت خاص يقوده ${nameAr} مع أحد الوالدين`,
      routineTaskEn: topInterestEn
        ? `10 minutes of child-led ${topInterestEn} time with ${nameEn}`
        : `10 minutes of child-led 1-on-1 time with ${nameEn}`,
      routineTime: '05:15 م',
    },
    {
      id: 'appreciation',
      emoji: '🤍',
      labelAr: 'تقدير ومودة أسرية',
      labelEn: 'Family Appreciation',
      titleAr:
        kidsCount > 1
          ? `دائرة الامتنان العائلية مع ${nameAr} وإخوته`
          : `لحظة تقدير ومودة يومية مع ${nameAr}`,
      titleEn:
        kidsCount > 1
          ? `Family gratitude circle with ${nameEn} and siblings`
          : `Daily appreciation moment with ${nameEn}`,
      descriptionAr:
        kidsCount > 1
          ? `قبل النوم أو على العشاء، يذكر كل فرد في الأسرة موقفاً لطيفاً لاحظه من الآخر؛ عادة بسيطة تزرع المودة بين الإخوة والوالدين.`
          : `تعبير الأب والأم عن تقديرهم لبعضهم وأمام ${nameAr} يعلّمه الامتنان ويمنحه شعوراً عميقاً بالطمأنينة الأسرية.`,
      descriptionEn:
        kidsCount > 1
          ? `At dinner or before bed, each family member shares one kind thing they noticed about someone else—building warmth across siblings and parents.`
          : `When parents express appreciation for each other and for ${nameEn}, it models gratitude and deepens emotional security.`,
      promptAr: `«شكراً يا ${nameAr} على وجودك الحلو معانا النهارده.. أكتر حاجة عجبتني لما عملت كذا.»`,
      promptEn: `“Thank you for brightening our day, ${nameEn}—one thing I really appreciated today was…”`,
      routineTaskAr: `لحظة امتنان وتقدير عائلي مسائية مع ${nameAr}`,
      routineTaskEn: `Evening family appreciation moment with ${nameEn}`,
      routineTime: '08:30 م',
    },
  ];
}
