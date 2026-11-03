import {
  calculateChildAge,
  locText,
  sanitizeUserText,
  type ChildProfile,
  type ChildProfileDetails,
  type LanguageCode,
} from './familySpaceCore';

export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening';

export interface RecommendationProfile {
  child: Pick<ChildProfile, 'birth' | 'interests' | 'profileDetails'>;
  language: LanguageCode;
  recentRecords?: Array<{
    record_type: string;
    title?: string | null;
    details?: Record<string, unknown> | null;
    occurred_at?: string | null;
  }>;
  now?: Date;
}

const cleanList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0).map((entry) => entry.trim())
    : [];

export function calculateAgeInMonths(birth: string, now = new Date()): number | null {
  const date = new Date(`${birth}T00:00:00`);
  if (!birth || Number.isNaN(date.getTime()) || date > now) return null;
  let months = (now.getFullYear() - date.getFullYear()) * 12 + now.getMonth() - date.getMonth();
  if (now.getDate() < date.getDate()) months -= 1;
  return Math.max(0, months);
}

export function extractProfileSignals(profile: RecommendationProfile) {
  const details: ChildProfileDetails = profile.child.profileDetails ?? {};
  const interests = [
    ...cleanList(details.interests),
    ...(profile.child.interests || '').split(/[,،;|]/).map((value) => value.trim()).filter(Boolean),
  ];
  const recentRecords = profile.recentRecords ?? [];
  return {
    ageMonths: calculateAgeInMonths(profile.child.birth, profile.now),
    interests: [...new Set(interests)],
    hobbies: [...new Set(cleanList(details.hobbies))],
    sports: [...new Set(cleanList(details.sports))],
    favoriteFoods: [...new Set(cleanList(details.favoriteFoods))],
    favoriteDrinks: [...new Set(cleanList(details.favoriteDrinks))],
    dislikedFoods: [...new Set(cleanList(details.dislikedFoods))],
    foodRestrictions: [...new Set(cleanList(details.foodRestrictions))],
    sleepPreferences: details.sleepPreferences ?? {},
    emotionalProfile: details.emotionalProfile ?? {},
    recentTopics: recentRecords.slice(0, 12).map((record) => {
      if (record.record_type === 'sports') return 'sports';
      if (record.record_type === 'nutrition') return 'nutrition';
      if (record.record_type === 'sleep_log') return 'sleep';
      if (record.record_type === 'emotional_social') return 'wellbeing';
      if (record.record_type === 'routine') return 'routine';
      return 'general';
    }),
    recentTitles: recentRecords.slice(0, 12).map((record) => record.title?.trim()).filter((title): title is string => Boolean(title)),
  };
}

/**
 * Conservative display helper: a favorite food is only surfaced as a suggestion
 * when the parent has not recorded any restriction or dislike. This is not an
 * allergy checker and never replaces a clinician's advice.
 */
export function getSafeFavoriteFood(details?: ChildProfileDetails): string | null {
  if (!details || cleanList(details.foodRestrictions).length > 0 || cleanList(details.dislikedFoods).length > 0) return null;
  return cleanList(details.favoriteFoods)[0] ?? null;
}

export interface DailyWelcomePersonalizationInput {
  child?: Pick<ChildProfile, 'name' | 'birth' | 'interests' | 'profileDetails'> | null;
  parentDisplayNameAr: string;
  parentDisplayNameEn: string;
  timeBucket: TimeOfDayBucket;
  recentRecords?: RecommendationProfile['recentRecords'];
  now?: Date;
}

export interface DailyWelcomePersonalization {
  timeBadgeAr: string;
  timeBadgeEn: string;
  greetingAr: string;
  greetingEn: string;
  summaryAr: string;
  summaryEn: string;
  ageLabelAr: string;
  ageLabelEn: string;
  ageStage: '0-2' | '2-5' | '5-8' | 'unknown';
  topInterestsAr: string[];
  topInterestsEn: string[];
  compass: {
    badgeAr: string;
    badgeEn: string;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    quoteAr: string;
    quoteEn: string;
    actionLabelAr: string;
    actionLabelEn: string;
    actionTaskAr: string;
    actionTaskEn: string;
    actionTime: string;
  };
}

export function buildDailyWelcomePersonalization(
  input: DailyWelcomePersonalizationInput
): DailyWelcomePersonalization {
  const { child, parentDisplayNameAr, parentDisplayNameEn, timeBucket, recentRecords, now } = input;

  const timeMeta = {
    morning: {
      badgeAr: '☀️ فترة الصباح',
      badgeEn: '☀️ Morning',
      parentGreetingAr: `صباح الخير يا ${parentDisplayNameAr}`,
      parentGreetingEn: `Good morning, ${parentDisplayNameEn}`,
    },
    afternoon: {
      badgeAr: '🌤️ فترة الظهيرة',
      badgeEn: '🌤️ Afternoon',
      parentGreetingAr: `طاب يومك يا ${parentDisplayNameAr}`,
      parentGreetingEn: `Good afternoon, ${parentDisplayNameEn}`,
    },
    evening: {
      badgeAr: '🌙 فترة المساء',
      badgeEn: '🌙 Evening',
      parentGreetingAr: `مساء الهدوء يا ${parentDisplayNameAr}`,
      parentGreetingEn: `Good evening, ${parentDisplayNameEn}`,
    },
  }[timeBucket];

  if (!child) {
    return {
      timeBadgeAr: timeMeta.badgeAr,
      timeBadgeEn: timeMeta.badgeEn,
      greetingAr: `${timeMeta.parentGreetingAr} 👋 خلّينا نرتّب يومكم ونركز على اللي يهم طفلك.`,
      greetingEn: `${timeMeta.parentGreetingEn} 👋 Let's make today's family routine easier.`,
      summaryAr:
        'ابدأ من احتياج طفلك النهارده؛ تابع يومه، واهتم براحة الأسرة، واختار الخطوة المناسبة من مكان واحد.',
      summaryEn:
        'Start with what your child needs today. Keep daily care, family support and useful activities connected in one place.',
      ageLabelAr: 'العمر غير محدد',
      ageLabelEn: 'Age not set',
      ageStage: 'unknown',
      topInterestsAr: [],
      topInterestsEn: [],
      compass:
        timeBucket === 'morning'
          ? {
              badgeAr: '☀️ بداية اليوم · تواصل قبل الانشغال',
              badgeEn: '☀️ Morning · Connect Before the Rush',
              titleAr: 'ابدأوا اليوم بسؤال بسيط وخطة واضحة',
              titleEn: 'Start with One Warm Check-in and a Clear Plan',
              bodyAr:
                'خدوا دقيقة مع طفلك: اسألوه عن حاجة متحمس لها النهارده، وشاركوه خطوة واحدة من خطة اليوم.',
              bodyEn:
                'Take a minute with your child: ask what they are looking forward to and share one simple part of the day’s plan.',
              quoteAr: '«مش مطلوب يوم مثالي؛ المهم بداية فيها اهتمام ووضوح.»',
              quoteEn: '“The goal is not a perfect day; it is a start built on attention and clarity.”',
              actionLabelAr: 'إضافة لحظة تواصل للروتين',
              actionLabelEn: 'Add a Connection Moment',
              actionTaskAr: 'خمس دقائق تواصل هادي مع طفلك قبل بداية اليوم',
              actionTaskEn: 'Five calm minutes of connection with your child',
              actionTime: '07:30 ص',
            }
          : timeBucket === 'afternoon'
          ? {
              badgeAr: '🌤️ وقت الرجوع · اسمع قبل ما توجّه',
              badgeEn: '🌤️ Afternoon · Listen Before You Guide',
              titleAr: 'ادي طفلك فرصة يفصل ويحكي عن يومه',
              titleEn: 'Give Your Child Space to Unwind and Share',
              bodyAr:
                'بعد الرجوع، ابدأوا بوقت هادي ومياه أو وجبة مناسبة، وبعدها اسألوا طفلك عن حاجة حلوة وحاجة كانت صعبة في يومه.',
              bodyEn:
                'After the day, allow some quiet time and offer water or an age-appropriate snack, then ask about one good moment and one difficult moment.',
              quoteAr: '«الاستماع الهادي أحياناً أهم من النصيحة السريعة.»',
              quoteEn: '“A calm listener can matter more than a quick solution.”',
              actionLabelAr: 'جدولة وقت حكي وونس',
              actionLabelEn: 'Schedule a Check-in',
              actionTaskAr: '١٠ دقائق حكي وونس مع طفلك من غير شاشات',
              actionTaskEn: '10 screen-free minutes to reconnect with your child',
              actionTime: '03:30 م',
            }
          : {
              badgeAr: '🌙 نهاية اليوم · هدوء واستعداد للنوم',
              badgeEn: '🌙 Evening · Slow Down Together',
              titleAr: 'اختتموا اليوم بروتين بسيط ومتكرر',
              titleEn: 'Close the Day with a Simple, Familiar Routine',
              bodyAr:
                'اختاروا مع طفلك نشاطاً هادئاً يناسب عمره: قصة قصيرة، ترتيب لعبة، أو حديث عن أحلى لحظة في اليوم.',
              bodyEn:
                'Choose a calm, age-appropriate activity with your child: a short story, putting a toy away, or sharing a favorite moment from the day.',
              quoteAr: '«الروتين المألوف يسهّل الانتقال للراحة، من غير ما يتحول لضغط.»',
              quoteEn: '“A familiar routine can make winding down easier without turning it into pressure.”',
              actionLabelAr: 'إضافة طقس هدوء للمساء',
              actionLabelEn: 'Add an Evening Wind-down',
              actionTaskAr: 'وقت هادي وقصة قصيرة مع طفلك قبل النوم',
              actionTaskEn: 'A calm moment and short story with your child before bed',
              actionTime: '08:00 م',
            },
    };
  }

  const childNameAr = sanitizeUserText(locText(child.name, 'ar'), 60) || 'طفلك';
  const childNameEn = sanitizeUserText(locText(child.name, 'en'), 60) || 'your child';
  const signals = extractProfileSignals({ child, language: 'ar', recentRecords, now });
  const hasKnownBirth = Boolean(child.birth && signals.ageMonths !== null);
  const ageAr = hasKnownBirth ? calculateChildAge(child.birth, 'ar') : null;
  const ageEn = hasKnownBirth ? calculateChildAge(child.birth, 'en') : null;
  const ageStage: '0-2' | '2-5' | '5-8' | 'unknown' = ageAr ? ageAr.stageCode : 'unknown';
  const ageLabelAr = ageAr?.label || 'العمر غير محدد';
  const ageLabelEn = ageEn?.label || 'Age not set';

  const rawCombinedInterests = Array.from(
    new Set(
      [...signals.interests, ...signals.hobbies, ...signals.sports]
        .map((entry) => sanitizeUserText(entry, 60))
        .filter(Boolean)
    )
  ).slice(0, 3);

  const topInterestsAr = rawCombinedInterests.map((item) => locText(item, 'ar'));
  const topInterestsEn = rawCombinedInterests.map((item) => locText(item, 'en'));
  const primaryInterestAr = topInterestsAr[0] || null;
  const primaryInterestEn = topInterestsEn[0] || null;

  const agePhraseAr = hasKnownBirth ? ` (${ageLabelAr})` : '';
  const agePhraseEn = hasKnownBirth ? ` (${ageLabelEn})` : '';

  const greetingAr =
    timeBucket === 'morning'
      ? `${timeMeta.parentGreetingAr} 👋 بداية هادية ليوم ${childNameAr}`
      : timeBucket === 'afternoon'
      ? `${timeMeta.parentGreetingAr} 👋 نتابع خطوات ${childNameAr} النهارده`
      : `${timeMeta.parentGreetingAr} 👋 نختم يوم ${childNameAr} براحة ودفء`;

  const greetingEn =
    timeBucket === 'morning'
      ? `${timeMeta.parentGreetingEn} 👋 A calm start to ${childNameEn}'s day.`
      : timeBucket === 'afternoon'
      ? `${timeMeta.parentGreetingEn} 👋 Checking in on ${childNameEn}'s day.`
      : `${timeMeta.parentGreetingEn} 👋 Winding down ${childNameEn}'s day gently.`;

  let summaryAr = '';
  let summaryEn = '';

  if (timeBucket === 'morning') {
    if (ageStage === '0-2') {
      summaryAr = primaryInterestAr
        ? `في صباح ${childNameAr}${agePhraseAr}، ابدأوا بتواصل بصري دافئ ومتابعة الرضاعة والنوم، وخصّصوا لحظة لطيفة لـ «${primaryInterestAr}» أثناء اليقظة.`
        : `في صباح ${childNameAr}${agePhraseAr}، ابدأوا بتواصل بصري دافئ ومتابعة إشارات الرضاعة والنوم بهدوء ومن غير استعجال.`;
      summaryEn = primaryInterestEn
        ? `This morning with ${childNameEn}${agePhraseEn}, start with warm eye contact and feeding or sleep cues, plus a gentle awake moment for ${primaryInterestEn}.`
        : `This morning with ${childNameEn}${agePhraseEn}, start with warm eye contact and responsive feeding and sleep cues at an unhurried pace.`;
    } else if (ageStage === '2-5') {
      summaryAr = primaryInterestAr
        ? `ابدأوا صباح ${childNameAr}${agePhraseAr} بخطوة روتينية واضحة، وشجّعوا فضوله النهارده بنشاط بسيط يرتبط بـ «${primaryInterestAr}».`
        : `ابدأوا صباح ${childNameAr}${agePhraseAr} بخطوة روتينية واضحة واختيار بسيط ينمّي خياله واستقلاليته.`;
      summaryEn = primaryInterestEn
        ? `Start ${childNameEn}${agePhraseEn}'s morning with one clear routine step and spark their curiosity today through ${primaryInterestEn}.`
        : `Start ${childNameEn}${agePhraseEn}'s morning with one clear routine step and a simple choice that supports imagination and independence.`;
    } else if (ageStage === '5-8') {
      summaryAr = primaryInterestAr
        ? `في بداية يوم ${childNameAr}${agePhraseAr}، اتفقوا على أولوية واحدة لليوم مع مساحة لـ «${primaryInterestAr}» بعد الدراسة أو المهام.`
        : `في بداية يوم ${childNameAr}${agePhraseAr}، شاركوه ترتيب أولويات اليوم بهدوء لتعزيز ثقته واستقلاليته.`;
      summaryEn = primaryInterestEn
        ? `As ${childNameEn}${agePhraseEn} begins the day, agree on one clear priority and save time to enjoy ${primaryInterestEn} later on.`
        : `As ${childNameEn}${agePhraseEn} begins the day, share one clear priority to support confidence and steady independence.`;
    } else {
      summaryAr = primaryInterestAr
        ? `ابدأوا صباح ${childNameAr} بخطوة هادية ومساحة لـ «${primaryInterestAr}»، وأضيفوا تاريخ الميلاد لتخصيص أنشطة المرحلة العمرية.`
        : `ابدأوا صباح ${childNameAr} بخطوة هادية ومتابعة يومية، وأضيفوا تاريخ الميلاد والاهتمامات لتخصيص الاقتراحات.`;
      summaryEn = primaryInterestEn
        ? `Start ${childNameEn}'s morning with a calm routine step and time for ${primaryInterestEn}. Add their birth date for age-tailored guidance.`
        : `Start ${childNameEn}'s morning with a calm check-in. Add their birth date and interests in the child profile for tailored daily ideas.`;
    }
  } else if (timeBucket === 'afternoon') {
    if (ageStage === '0-2') {
      summaryAr = primaryInterestAr
        ? `في ظهيرة يوم ${childNameAr}${agePhraseAr}، راقبوا إشارات القيلولة والرضاعة، وجرّبوا تفاعلاً قصيراً مع «${primaryInterestAr}» عندما يكون مرتاحاً.`
        : `في ظهيرة يوم ${childNameAr}${agePhraseAr}، راقبوا إشارات القيلولة والرضاعة، ووفّروا وقتاً هادئاً للتفاعل الحسي البسيط.`;
      summaryEn = primaryInterestEn
        ? `This afternoon with ${childNameEn}${agePhraseEn}, follow nap and feeding cues and enjoy a short, comfortable moment with ${primaryInterestEn}.`
        : `This afternoon with ${childNameEn}${agePhraseEn}, follow nap and feeding cues and offer calm sensory interaction when rested.`;
    } else if (ageStage === '2-5') {
      summaryAr = primaryInterestAr
        ? `في وقت الظهيرة مع ${childNameAr}${agePhraseAr}، خُدوا استراحة هادية ووجبة خفيفة، وبعدها ١٠ دقائق ممتعة في «${primaryInterestAr}».`
        : `في وقت الظهيرة مع ${childNameAr}${agePhraseAr}، خُدوا استراحة هادية ووجبة خفيفة، وامنحوه مساحة للعب الحر وتسمية مشاعره.`;
      summaryEn = primaryInterestEn
        ? `This afternoon with ${childNameEn}${agePhraseEn}, pause for a calm snack and hydration, then share 10 playful minutes with ${primaryInterestEn}.`
        : `This afternoon with ${childNameEn}${agePhraseEn}, pause for a calm snack and give space for free play and naming feelings.`;
    } else if (ageStage === '5-8') {
      summaryAr = primaryInterestAr
        ? `بعد منتصف اليوم، اتركوا لـ ${childNameAr}${agePhraseAr} وقتاً يفصل فيه ويحكي عن يومه، ثم يستعيد نشاطه مع «${primaryInterestAr}».`
        : `بعد منتصف اليوم، اتركوا لـ ${childNameAr}${agePhraseAr} وقتاً يفصل فيه ويحكي عن يومه قبل البدء في أي مهام جديدة.`;
      summaryEn = primaryInterestEn
        ? `This afternoon, give ${childNameEn}${agePhraseEn} space to unwind and share their day, then recharge with ${primaryInterestEn}.`
        : `This afternoon, give ${childNameEn}${agePhraseEn} space to unwind and talk about their day before jumping into tasks.`;
    } else {
      summaryAr = primaryInterestAr
        ? `في ظهيرة اليوم مع ${childNameAr}، اجمعوا بين الراحة ونشاط بسيط في «${primaryInterestAr}» حسب طاقته.`
        : `في ظهيرة اليوم مع ${childNameAr}، خُدوا استراحة هادية وتابعوا الوجبات والنشاط اليومي من مكان واحد.`;
      summaryEn = primaryInterestEn
        ? `This afternoon with ${childNameEn}, balance rest with a light activity around ${primaryInterestEn} at their pace.`
        : `This afternoon with ${childNameEn}, take a calm break and check in on meals, care, and daily activities.`;
    }
  } else {
    if (ageStage === '0-2') {
      summaryAr = primaryInterestAr
        ? `في مساء ${childNameAr}${agePhraseAr}، خفّفوا الإضاءة والأصوات تدريجياً، واجعلوا التهدئة أو «${primaryInterestAr}» إشارة لطيفة لقرب النوم.`
        : `في مساء ${childNameAr}${agePhraseAr}، خفّفوا الإضاءة والأصوات تدريجياً بلمسات مطمئنة تهيّئه لنوم هادي.`;
      summaryEn = primaryInterestEn
        ? `This evening with ${childNameEn}${agePhraseEn}, soften lights and sounds gradually and use gentle comfort around ${primaryInterestEn} to wind down.`
        : `This evening with ${childNameEn}${agePhraseEn}, soften lights and sounds gradually with soothing routines before sleep.`;
    } else if (ageStage === '2-5') {
      summaryAr = primaryInterestAr
        ? `في مساء ${childNameAr}${agePhraseAr}، اهدأوا بإيقاع البيت واختموا اليوم بحدوتة أو حديث دافئ يستلهم حبّه لـ «${primaryInterestAr}».`
        : `في مساء ${childNameAr}${agePhraseAr}، اهدأوا بإيقاع البيت بخطوات متكررة: ترتيب لعبة، حدوتة قصيرة، وإضاءة خافتة.`;
      summaryEn = primaryInterestEn
        ? `This evening with ${childNameEn}${agePhraseEn}, slow the household rhythm and close the day with a cozy story or chat inspired by ${primaryInterestEn}.`
        : `This evening with ${childNameEn}${agePhraseEn}, slow the household rhythm with predictable steps: tidy a toy, share a short story, and dim the lights.`;
    } else if (ageStage === '5-8') {
      summaryAr = primaryInterestAr
        ? `في ختام يوم ${childNameAr}${agePhraseAr}، خفّفوا الشاشات وتبادلوا حديثاً هادئاً عن أحلى لحظة النهارده أو فكرة جديدة في «${primaryInterestAr}».`
        : `في ختام يوم ${childNameAr}${agePhraseAr}، خفّفوا الشاشات وتبادلوا حديثاً هادئاً عن أحلى لحظة مرّت عليه النهارده قبل النوم.`;
      summaryEn = primaryInterestEn
        ? `As ${childNameEn}${agePhraseEn}'s day winds down, step away from screens and share a quiet conversation about today's highlight or ${primaryInterestEn}.`
        : `As ${childNameEn}${agePhraseEn}'s day winds down, step away from screens and share a quiet conversation about their favorite moment today.`;
    } else {
      summaryAr = primaryInterestAr
        ? `اختتموا يوم ${childNameAr} بروتين مسائي هادي وحديث لطيف حول «${primaryInterestAr}» قبل النوم.`
        : `اختتموا يوم ${childNameAr} بروتين مسائي هادي وحدوتة أو حديث مطمئن يسهّل الانتقال للراحة.`;
      summaryEn = primaryInterestEn
        ? `Close ${childNameEn}'s day with a calm evening routine and a gentle chat or story connected to ${primaryInterestEn}.`
        : `Close ${childNameEn}'s day with a calm, familiar evening routine that makes winding down easier.`;
    }
  }

  const compass =
    timeBucket === 'morning'
      ? {
          badgeAr: '☀️ بداية اليوم · تواصل قبل الانشغال',
          badgeEn: '☀️ Morning · Connect Before the Rush',
          titleAr: 'ابدأوا اليوم بسؤال بسيط وخطة واضحة',
          titleEn: 'Start with One Warm Check-in and a Clear Plan',
          bodyAr: summaryAr,
          bodyEn: summaryEn,
          quoteAr: '«مش مطلوب يوم مثالي؛ المهم بداية فيها اهتمام ووضوح.»',
          quoteEn: '“The goal is not a perfect day; it is a start built on attention and clarity.”',
          actionLabelAr: 'إضافة لحظة تواصل للروتين',
          actionLabelEn: 'Add a Connection Moment',
          actionTaskAr: primaryInterestAr
            ? `خمس دقائق تواصل هادي مع ${childNameAr} وحديث سريع عن ${primaryInterestAr}`
            : `خمس دقائق تواصل هادي مع ${childNameAr} قبل بداية اليوم`,
          actionTaskEn: primaryInterestEn
            ? `Five calm minutes of connection with ${childNameEn} and a quick note on ${primaryInterestEn}`
            : `Five calm minutes of connection with ${childNameEn}`,
          actionTime: '07:30 ص',
        }
      : timeBucket === 'afternoon'
      ? {
          badgeAr: '🌤️ وقت الرجوع · اسمع قبل ما توجّه',
          badgeEn: '🌤️ Afternoon · Listen Before You Guide',
          titleAr: 'ادي طفلك فرصة يفصل ويحكي عن يومه',
          titleEn: 'Give Your Child Space to Unwind and Share',
          bodyAr: summaryAr,
          bodyEn: summaryEn,
          quoteAr: '«الاستماع الهادي أحياناً أهم من النصيحة السريعة.»',
          quoteEn: '“A calm listener can matter more than a quick solution.”',
          actionLabelAr: 'جدولة وقت حكي وونس',
          actionLabelEn: 'Schedule a Check-in',
          actionTaskAr: primaryInterestAr
            ? `١٠ دقائق حكي أو نشاط خفيف في ${primaryInterestAr} مع ${childNameAr} من غير شاشات`
            : `١٠ دقائق حكي وونس مع ${childNameAr} من غير شاشات`,
          actionTaskEn: primaryInterestEn
            ? `10 screen-free minutes with ${childNameEn} to unwind and enjoy ${primaryInterestEn}`
            : `10 screen-free minutes to reconnect with ${childNameEn}`,
          actionTime: '03:30 م',
        }
      : {
          badgeAr: '🌙 نهاية اليوم · هدوء واستعداد للنوم',
          badgeEn: '🌙 Evening · Slow Down Together',
          titleAr: 'اختتموا اليوم بروتين بسيط ومتكرر',
          titleEn: 'Close the Day with a Simple, Familiar Routine',
          bodyAr: summaryAr,
          bodyEn: summaryEn,
          quoteAr: '«الروتين المألوف يسهّل الانتقال للراحة، من غير ما يتحول لضغط.»',
          quoteEn: '“A familiar routine can make winding down easier without turning it into pressure.”',
          actionLabelAr: 'إضافة طقس هدوء للمساء',
          actionLabelEn: 'Add an Evening Wind-down',
          actionTaskAr: primaryInterestAr
            ? `وقت هادي وقصة أو حديث عن ${primaryInterestAr} مع ${childNameAr} قبل النوم`
            : `وقت هادي وقصة قصيرة مع ${childNameAr} قبل النوم`,
          actionTaskEn: primaryInterestEn
            ? `A calm bedtime moment and story inspired by ${primaryInterestEn} with ${childNameEn}`
            : `A calm moment and short story with ${childNameEn} before bed`,
          actionTime: '08:00 م',
        };

  return {
    timeBadgeAr: timeMeta.badgeAr,
    timeBadgeEn: timeMeta.badgeEn,
    greetingAr,
    greetingEn,
    summaryAr,
    summaryEn,
    ageLabelAr,
    ageLabelEn,
    ageStage,
    topInterestsAr,
    topInterestsEn,
    compass,
  };
}

