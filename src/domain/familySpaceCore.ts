/**
 * Family Space — Core Domain, Data Normalization, Validation, and Localization Module
 * Preserves backward compatibility with `family-space-v1` localStorage format while
 * supporting the 6 interconnected product pillars:
 *  1. Family Operating System (Profiles, 3D Avatars & Real Photos, Routines + Reminders, Calendar)
 *  2. Parent, Child, Extended Family & Caregiver Collaboration (Onboarding, OTP/Email Verification, Invitations, Child-Scoped Permissions)
 *  3. Medical, Psychological & Educational Content (10 Core Topics + Review Workflow + Medical Disclaimers)
 *  4. Interactive Audio, Video, Images & Media Players
 *  5. Safe, Age-Appropriate Interactive 3D Children's Games
 *  6. Commercial Services, Product Discovery, Cart & Checkout Simulation
 */

import { AvatarAccessoryTheme } from './assetManifest3D';

export type ParentThemeRole = 'mom' | 'dad' | 'high-contrast';
export type CountryCode = 'EG' | 'SA';
export type LanguageCode = 'ar' | 'en';
export type CurrencyCode = 'EGP' | 'SAR';
export type CalendarDisplayMode = 'both' | 'gregorian' | 'hijri';
export type TaskCadence = 'daily' | 'weekly' | 'monthly';
export type AgeStage = '0-2' | '2-5' | '5-8' | 'all';

export interface BilingualText {
  ar: string;
  en: string;
}

export interface BilingualUserProfile {
  name: BilingualText;
  role: BilingualText;
  city: BilingualText;
  children: Array<{
    id: number;
    name: BilingualText;
    role: BilingualText;
    ageLabel: BilingualText;
    bloodType: string;
    allergies: BilingualText[];
    vaccinationsNote: BilingualText;
    healthNotePrivate: BilingualText;
    interests: BilingualText[];
  }>;
}

export const MOCK_BILINGUAL_USER: BilingualUserProfile = {
  name: { ar: 'أحمد وسارة', en: 'Ahmed & Sara' },
  role: { ar: 'الأم / الأب', en: 'Mother / Father' },
  city: { ar: 'القاهرة', en: 'Cairo' },
  children: [
    {
      id: 1,
      name: { ar: 'عز', en: 'Ezz' },
      role: { ar: 'الابن الأكبر', en: 'Eldest Son' },
      ageLabel: { ar: '3 سنوات و 9 أشهر', en: '3 yrs, 9 mos' },
      bloodType: 'O+',
      allergies: [{ ar: 'لا توجد حساسية معروفة', en: 'No known allergies' }],
      vaccinationsNote: {
        ar: 'مكتمل التطعيمات الأساسية حتى 3 سنوات',
        en: 'Core vaccinations completed up to 3 years',
      },
      healthNotePrivate: {
        ar: 'يتابع نمو اللغة والتركيز بشكل ممتاز مع طبيب الأطفال.',
        en: 'Tracking language & focus milestones smoothly with the pediatrician.',
      },
      interests: [
        { ar: 'المكعبات', en: 'Building Blocks' },
        { ar: 'الديناصورات', en: 'Dinosaurs' },
        { ar: 'الرسم', en: 'Drawing' },
        { ar: 'السباحة', en: 'Swimming' },
      ],
    },
    {
      id: 2,
      name: { ar: 'نور', en: 'Nour' },
      role: { ar: 'الابنة الصغرى', en: 'Youngest Daughter' },
      ageLabel: { ar: 'سنة و 8 أشهر', en: '1 yr, 8 mos' },
      bloodType: 'A+',
      allergies: [{ ar: 'حساسية خفيفة من الفراولة', en: 'Mild strawberry allergy' }],
      vaccinationsNote: {
        ar: 'تطعيم 18 شهر مكتمل بنجاح',
        en: '18-month booster vaccination completed',
      },
      healthNotePrivate: {
        ar: 'نوم مستقر ليلاً مع بداية نطق جمل قصيرة من كلمتين.',
        en: 'Steady nighttime sleep and starting 2-word phrases.',
      },
      interests: [
        { ar: 'الأناشيد الصوتية', en: 'Audio Rhymes' },
        { ar: 'الألوان المائية', en: 'Watercolors' },
        { ar: 'قصص الحيوانات', en: 'Animal Stories' },
      ],
    },
  ],
};

export const BILINGUAL_SEED_DICTIONARY: Record<string, string> = {
  // User & Family Names / Roles / Cities
  'أحمد وسارة': 'Ahmed & Sara',
  'أحمد': 'Ahmed',
  'سارة': 'Sara',
  'عز': 'Ezz',
  'نور': 'Nour',
  'ليلى': 'Layla',
  'القاهرة': 'Cairo',
  'القاهرة الجديدة': 'New Cairo',
  'الرياض': 'Riyadh',
  'الإسكندرية': 'Alexandria',
  'جدة': 'Jeddah',
  'الجيزة': 'Giza',
  'المنصورة': 'Mansoura',
  'طنطا': 'Tanta',
  'أسيوط': 'Assiut',
  'الدمام': 'Dammam',
  'مكة المكرمة': 'Makkah',
  'المدينة المنورة': 'Madinah',
  'الخبر': 'Khobar',
  'كل المدن': 'All Cities',
  'ماما (سارة)': 'Mom (Sara)',
  'بابا (أحمد)': 'Dad (Ahmed)',
  'الأم (سارة)': 'Mother (Sara)',
  'الأب (أحمد)': 'Father (Ahmed)',
  'سارة المنيري': 'Sara El-Moneiry',
  'أحمد الكيلاني': 'Ahmed El-Kilany',
  'الأم': 'Mother',
  'الأب': 'Father',
  'مشترك (الأم والأب)': 'Shared (Mom & Dad)',
  'الجدة (أم سارة)': 'Grandma (Sara’s Mom)',
  'الجد (أبو أحمد)': 'Grandpa (Ahmed’s Dad)',
  'الخالة مريم': 'Aunt Mariam',
  'العم كريم': 'Uncle Karim',
  'الجدة منى': 'Grandma Mona',
  'الجدة منى (أم سارة)': 'Grandma Mona (Sara’s Mom)',
  'الجد حسن (أبو أحمد)': 'Grandpa Hassan (Ahmed’s Dad)',
  'الجدة': 'Grandmother',
  'الجد': 'Grandfather',
  'الخالة': 'Maternal Aunt',
  'العم': 'Paternal Uncle',
  'الخالة / العمة': 'Aunt',
  'الجد / الجدة': 'Grandparent',
  'مربية / مساعدة': 'Nanny / Caregiver',
  'عائلة الأم': 'Mother’s Side',
  'عائلة الأب': 'Father’s Side',
  'مشترك': 'Shared',
  'عائلة سارة وأحمد': 'Sara & Ahmed Family',
  'المعادي - شارع 9، عمارة 14، الدور الثالث': 'Maadi - Street 9, Bldg 14, 3rd Floor',

  // Child medical & interests
  'تركيب المكعبات، قصص الفضاء، السباحة': 'Building blocks, space stories, swimming',
  'الألوان المائية، الأناشيد الحركية، القطط': 'Watercolors, action rhymes, kittens',
  'المكعبات، الرسم، القصص المصورة': 'Building blocks, drawing, picture books',
  'الأناشيد، المكعبات الخشبية، اللعب الحسي': 'Songs, wooden blocks, sensory play',
  'لا توجد حساسية معروفة': 'No known allergies',
  'حساسية خفيفة من الفراولة': 'Mild strawberry allergy',
  'مكتمل التطعيمات الأساسية حتى 3 سنوات': 'Core vaccinations completed up to 3 years',
  'مكتمل حتى تطعيم ٤ سنوات + جرعة تنشيطية': 'Completed up to 4-year vaccines + booster',
  'مكتمل حتى تطعيم ١٨ شهرًا — متبقي تطعيم سنتين': 'Completed up to 18-month vaccines — 2-yr due next',
  'تطعيم 18 شهر مكتمل بنجاح': '18-month booster vaccination completed',
  'يتابع نمو اللغة والتركيز بشكل ممتاز مع طبيب الأطفال.': 'Tracking language & focus milestones smoothly with the pediatrician.',
  'نوم مستقر ليلاً مع بداية نطق جمل قصيرة من كلمتين.': 'Steady nighttime sleep and starting 2-word phrases.',
  'لا توجد حساسية غذائية. يفضل المتابعة الدورية للأسنان.': 'No food allergies. Routine dental checkup recommended.',
  'حساسية خفيفة من الفراولة الطازجة — يفضل الفواكه المطهية أو التفاح والموز.': 'Mild sensitivity to fresh strawberries — prefers apples & bananas.',
  'المكعبات': 'Building Blocks',
  'الديناصورات': 'Dinosaurs',
  'الرسم': 'Drawing',
  'السباحة': 'Swimming',
  'الأناشيد الصوتية': 'Audio Rhymes',
  'الألوان المائية': 'Watercolors',
  'قصص الحيوانات': 'Animal Stories',

  // Routine tasks
  'ترتيب سرير عز وتجهيز ملابس الحضانة': 'Make Ezz’s bed & prepare nursery outfit',
  'غسل الأسنان الصباحي مع أنشودة دقيقتين': 'Morning toothbrushing with 2-min song',
  'قراءة قصة مصورة قبل القيلولة لنور': 'Read a picture story before Nour’s nap',
  'جلسة بازل خشبي ومكعبات بدون شاشات (25 دقيقة)': 'Screen-free wooden puzzle & blocks (25 min)',
  'تحضير وجبة فواكه مقطعة ومياه دافئة': 'Prepare sliced fruit snack & warm water',
  'روتين الاستحمام الهادئ وتخفيت الإضاءة': 'Calm bath routine & dimmed lights',
  'غسل الأسنان وتجهيز حقيبة الروضة': 'Brush teeth & pack kindergarten bag',
  'وجبة فواكه موسمية ومياه كافية': 'Seasonal fruit snack & hydration',
  'نشاط تلوين حر وتنمية العضلات الدقيقة (٢٠ دقيقة)': 'Free coloring & fine-motor play (20 min)',
  'قراءة قصة ما قبل النوم بهدوء (بدون شاشات)': 'Calm bedtime story reading (screen-free)',
  'مراجعة جدول تطعيمات الأسبوع وتحديث الوزن': 'Review weekly vaccination & weight log',
  'العناية الصباحية': 'Morning Care',
  'صحة ونظافة': 'Health & Hygiene',
  'قراءة ولغة': 'Reading & Language',
  'مهارات حركية': 'Motor Skills',
  'تغذية صحية': 'Healthy Nutrition',
  'روتين النوم': 'Bedtime Routine',
  'صباحي': 'Morning',
  'تغذية': 'Nutrition',
  'مهارات': 'Skills',
  'مسائي': 'Evening',
  'صحي': 'Health',
  'الأم': 'Mother',
  'الأب': 'Father',
  '07:30 ص': '07:30 AM',
  '08:00 ص': '08:00 AM',
  '01:00 م': '01:00 PM',
  '01:30 م': '01:30 PM',
  '04:30 م': '04:30 PM',
  '05:00 م': '05:00 PM',
  '06:30 م': '06:30 PM',
  '07:45 م': '07:45 PM',
  '08:00 م': '08:00 PM',
  '10:00 ص': '10:00 AM',

  // Calendar events & memories
  'متابعة تطعيم وقياس النمو الدوري - عز': 'Routine growth check & vaccination follow-up - Ezz',
  'نزهة عائلية في حديقة الأزهر مع الجد والجدة': 'Family picnic at Al-Azhar Park with Grandparents',
  'ورشة تلوين وفنون حسية للأطفال': 'Sensory art & painting workshop for kids',
  'أول يوم لعز في مرحلة التمهيدي (KG1)': 'Ezz’s first day in Pre-K (KG1)',
  'عيد ميلاد نور الثاني مع العائلة': 'Nour’s 2nd birthday with the family',
  'متابعة تطعيم ١٨ شهرًا لنور في عيادة الأطفال': 'Nour’s 18-month vaccination follow-up at pediatric clinic',
  'نزهة عائلية في الحديقة مع الجد والجدة': 'Family park outing with Grandparents',
  'عيد ميلاد عز الخامس': 'Ezz’s 5th Birthday Celebration',
  'ذكرى أول خطوة لنور في حديقة المنزل': 'Memory: Nour’s first steps in the garden',
  'أول يوم لعز في الروضة ورسم لوحة الشمس': 'Memory: Ezz’s first day at kindergarten & sun painting',
  'صحة وتطعيم': 'Health & Vaccine',
  'نشاط عائلي': 'Family Activity',
  'مهارات وتعلم': 'Skills & Learning',
  'ذكرى مميزة': 'Special Memory',
  'مناسبة عائلية': 'Family Occasion',
  'طبي': 'Medical',
  'عائلي': 'Family',
  'ميلاد': 'Birthday',
  'ذكرى': 'Memory',
  'إحضار دفتر التطعيمات وبطاقة المتابعة الصحية.': 'Bring vaccination booklet and health tracking card.',
  'إحضار كتيب التطعيمات وقياس الطول والوزن.': 'Bring vaccination booklet and measure height & weight.',
  'تحضير سلة فواكه وألعاب خارجية خفيفة.': 'Pack a fruit basket and light outdoor toys.',
  'ألعاب حركية خفيفة وفواكه مقطعة.': 'Light outdoor games and sliced fruit.',
  'ملابس قطنية مريحة قابلة للغسل بسهولة.': 'Comfortable, easily washable cotton clothes.',
  'التقطنا صورة تذكارية أمام باب الفصل مع المعلمة.': 'Took a keepsake photo by the classroom door with the teacher.',
  'كيكة فواكه منزلية بدون سكر مضاف وهدايا تعليمية.': 'Homemade sugar-free fruit cake and educational gifts.',
  'احتفال عائلي هادئ وهدايا تعليمية.': 'Calm family celebration with educational gifts.',
  'لحظة لا تُنسى مع ضحكة نور الجميلة.': 'An unforgettable moment with Nour’s bright smile.',
  'كان متحمسًا جدًا وشارك أصدقاءه الألوان.': 'He was super excited and shared his colors with friends.',

  // Wishes
  'دراجة توازن خشبية لعز (بدون دواسات)': 'Wooden balance bike for Ezz (pedal-free)',
  'مجموعة قصص قماشية تفاعلية لنور': 'Interactive cloth storybooks set for Nour',
  'صندوق ادخار لرحلة البحر العائلية في الصيف': 'Family summer beach trip savings fund',
  'طاولة أنشطة مونتيسوري مزدوجة للغرفة': 'Double Montessori activity table for kids room',
  'مجموعة مكعبات خشبية مونتيسوري (١٠٠ قطعة)': 'Montessori Wooden Blocks Set (100 pcs)',
  'موسوعة القصص المصورة قبل النوم': 'Illustrated Bedtime Stories Encyclopedia',
  'دراجة توازن آمنة مع خوذة مبطنة': 'Safe Balance Bike with Padded Helmet',
  'هدية عيد ميلاد': 'Birthday Gift',
  'تطوير مهارات': 'Skill Building',
  'ادخار عائلي': 'Family Savings',
  'تجهيز غرفة الطفل': 'Room Setup',
  'مهارات وهندسة': 'STEM & Motor Skills',
  'قراءة ولغة': 'Reading & Language',
  'نشاط حركي': 'Active Outdoor Play',

  // Store Categories, Variants & Sellers
  'ألعاب تعليمية': 'Educational Toys',
  'عناية بالرضع': 'Baby Care',
  'تجهيز الغرف': 'Nursery & Gear',
  'كتب وقصص': 'Books & Stories',
  'ملابس قطنية': 'Cotton Apparel',
  'تغذية صحية': 'Healthy Feeding',
  'منتجات الأطفال': 'Kids Products',
  'ملابس وأحذية': 'Apparel & Shoes',
  'ألعاب تنمية المهارات': 'Skill-Building Toys',
  'حضانات ومدارس': 'Nurseries & Schools',
  'أطباء ومختصون': 'Doctors & Specialists',
  'تنظيم أعياد الميلاد': 'Birthday Planning',
  'متجر مونتيسوري العرب': 'Arab Montessori Store',
  'بيبي كير المعتمد': 'Certified BabyCare',
  'دار الشروق للأطفال': 'Dar El Shorouk Kids',
  'قطنيات النيل الطبيعية': 'Nile Organic Cottons',
  'عالم الطفل الذكي': 'Smart Kid World',
  'مجموعة كاملة (64 قطعة)': 'Full Set (64 pcs)',
  'مجموعة أساسية (32 قطعة)': 'Starter Set (32 pcs)',
  'لون خشب طبيعي': 'Natural Wood Tone',
  'لون أبيض دافئ': 'Warm White Tone',
  'مقاس 2-3 سنوات': 'Size 2-3 Years',
  'مقاس 3-4 سنوات': 'Size 3-4 Years',
  'مقاس 1-2 سنة': 'Size 1-2 Years',
  'عبوة 500 مل': '500 ml Bottle',
  'عبوة اقتصادية 2×500 مل': 'Value Pack 2×500 ml',
  'اللون النعناعي': 'Mint Green',
  'اللون الوردي الهادئ': 'Soft Blush Pink',
  'اللون الرمادي الفاتح': 'Light Mist Gray',
  'نسخة مصورة فاخرة': 'Deluxe Illustrated Edition',
  'نسخة مع بطاقات تفاعلية': 'Edition + Flashcards',
  'مقاس موحد': 'Standard Size',

  // Media & Medical
  '2–5 سنوات': '2–5 yrs',
  '0–2 سنوات': '0–2 yrs',
  '5–8 سنوات': '5–8 yrs',
  '0–2 سنة': '0–2 yrs',
  '3–6 سنوات': '3–6 yrs',
  'جميع الأعمار': 'All Ages',
  '0–8 سنوات': '0–8 yrs',
  'د. مريم الكيلاني - استشاري طب الأطفال وعلم نفس النمو': 'Dr. Mariam El-Kilany - Consultant Pediatrician & Child Development',
  'د. طارق المنصوري - أخصائي تغذية الأطفال والمناعة': 'Dr. Tarek El-Mansoury - Pediatric Nutrition & Immunity Specialist',
  'أ. سلمى حجازي - أخصائية تخاطب وتعديل سلوك تربوي': 'Ms. Salma Hegazy - Speech & Positive Behavior Specialist',
  'د. سلمى الكيلاني': 'Dr. Salma El-Kilany',
  'د. طارق المنصور': 'Dr. Tarek El-Mansour',
  'د. هدى الشربيني': 'Dr. Hoda El-Sherbiny',
  'د. مازن العتيبي': 'Dr. Mazen Al-Otaibi',
  'أحمد و سارة': 'Ahmed & Sara',
  'أحمد وسارة': 'Ahmed & Sara',
  'سارة (الأم)': 'Sara (Mother)',
  'أحمد (الأب)': 'Ahmed (Father)',
  'أ. ريم — مشرفة حضانة خطوات صغيرة': 'Ms. Reem — Little Steps Nursery Supervisor',
  'مشرفة حضانة': 'Nursery Supervisor',
  'الحضانة والمدرسة': 'Nursery & School',
  'التجمع الخامس — الحي الثالث': 'Fifth Settlement — 3rd District',
  'شارع التسعين الشمالي، فيلا 14 (عنوان تجريبي)': 'North 90th Street, Villa 14 (Demo Address)',
  'موعد التطعيم - نور': 'Vaccination Appointment - Nour',
  'اجتماع عائلي وتخطيط الأسبوع': 'Family Meeting & Weekly Planning',
  'حصة السباحة - عز': 'Swimming Lesson - Ezz',
  'المكعبات، السباحة، والسيارات': 'Building blocks, swimming & cars',
  'مكتمل حتى سن 5 سنوات (جرعة تنشيطية قادمة)': 'Completed up to age 5 (booster due next)',
  'لا توجد حساسية طعام مسجلة — سجل خاص بالوالدين': 'No food allergies recorded — Parent-private log',
  'القصص المصورة، الألوان، والأناشيد': 'Picture books, colors & rhymes',
  'متابعة تطعيمات سن 3 سنوات في الموعد القادم': '3-year vaccination follow-up at next appointment',
  'حساسية خفيفة من الفراولة — سجل خاص بالوالدين': 'Mild strawberry sensitivity — Parent-private log',
  'تناول الإفطار الصحي ووقت هادئ': 'Healthy breakfast & calm morning time',
  'التحضير للمدرسة والحضانة': 'Prepare for school & nursery',
  'وقت التعلم وتنمية المهارات': 'Learning & skill-building time',
  'قراءة قصة قبل النوم': 'Read bedtime story',
  'روتين النوم الهادئ': 'Calm bedtime routine',
  'ترتيب ركن الألعاب والكتب الأسبوعي': 'Weekly toy & book corner tidy-up',
  'قياس الطول والوزن الشهري': 'Monthly height & weight check',
  '07:00 ص': '07:00 AM',
  '04:00 م': '04:00 PM',
  '07:00 م': '07:00 PM',
  '09:00 م': '09:00 PM',
  '11:00 ص': '11:00 AM',
  '06:00 م': '06:00 PM',
  'أكل وشرب': 'Meals & Hydration',
  'روتين عام': 'General Routine',
  'لعب وتعلم': 'Play & Learning',
  'نوم': 'Sleep',
  'صحة': 'Health',
  'مكعبات تركيب هندسية ذكية': 'Smart Geometric Building Blocks',
  'لعبة تعليمية': 'Educational Toy',
  'مجموعة قصص مصورة قبل النوم': 'Bedtime Illustrated Story Set',
  'هدية القراءة': 'Reading Gift',
  'رحلة عائلية ترفيهية وعطلة شاطئية': 'Family Beach Trip & Getaway',
  'إدخار العائلة': 'Family Savings',
  'جهاز لوحي تعليمي برقابة أبوية': 'Parental-Controlled Learning Tablet',
  'تطوير مهارات': 'Skill Development',
  'تيتا منى': 'Grandma Mona',
  'جدة الأم': 'Maternal Grandmother',
  'عيلة الأم': 'Mother’s Family',
  'عيلة الأب': 'Father’s Family',
  'الأسرة الأساسية': 'Core Family',
  'الأسرة': 'Family',
  'مجموعة قصص مصورة': 'Illustrated Story Collection',
  'لعبة تركيب خشبية': 'Wooden Puzzle Set',
  'حقيبة ألوان مائية آمنة': 'Child-Safe Watercolor Kit',
  'محدثة': 'Up to date',
  'لم تحدد الاهتمامات بعد': 'No interests specified yet',
  'مرن': 'Flexible',
};

export function locText(
  val: string | BilingualText | undefined | null,
  lang: LanguageCode,
  enFallback?: string
): string {
  if (!val) return '';
  if (typeof val === 'object' && 'ar' in val && 'en' in val) {
    return lang === 'en' ? val.en : val.ar;
  }
  const str = String(val).trim();
  if (lang === 'ar') return str;
  if (enFallback) return enFallback;
  if (BILINGUAL_SEED_DICTIONARY[str]) return BILINGUAL_SEED_DICTIONARY[str];
  return str
    .replace(/عز/g, 'Ezz')
    .replace(/نور/g, 'Nour')
    .replace(/سارة/g, 'Sara')
    .replace(/أحمد/g, 'Ahmed')
    .replace(/القاهرة الجديدة/g, 'New Cairo')
    .replace(/القاهرة/g, 'Cairo')
    .replace(/الرياض/g, 'Riyadh')
    .replace(/الإسكندرية/g, 'Alexandria')
    .replace(/جدة/g, 'Jeddah')
    .replace(/\s+و\s+/g, ' & ')
    .replace(/دقيقة/g, 'min')
    .replace(/دقائق/g, 'mins')
    .replace(/ثانية/g, 'sec')
    .replace(/سنوات/g, 'yrs')
    .replace(/سنة/g, 'yr');
}

export interface ChildProfile {
  id: number;
  name: string;
  gender: 'boy' | 'girl';
  birth: string;
  interests: string;
  emoji: string;
  bloodType?: string;
  vaccinationsNote?: string;
  healthNotePrivate?: string;
  growthHeightCm?: number;
  growthWeightKg?: number;
  /** 3D personality/accessory theme when using 3D avatar */
  avatarTheme?: AvatarAccessoryTheme;
  /** Real uploaded child photograph data URL (preserved when present) */
  photoDataUrl?: string;
  /** Whether parent prefers the 3D illustrated avatar even if a photo is uploaded */
  useIllustratedAvatar?: boolean;
}

export interface RoutineTask {
  id: number;
  name: string;
  time: string;
  done: boolean;
  kidId: number | null;
  category: string;
  owner: string;
  cadence: TaskCadence;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time?: string;
  type: string;
  childId: number | null;
  repeat: 'none' | 'weekly' | 'monthly' | 'yearly';
  note?: string;
  createdAt?: string;
}

export interface WishItem {
  id: number;
  name: string;
  kid: number;
  price: number;
  currency?: CurrencyCode;
  emoji: string;
  reserved: boolean;
  progress: number;
  goalType?: string;
}

export interface GranularPermissions {
  profile: boolean;
  routine: boolean;
  calendar: boolean;
  wishes: boolean;
  growth: boolean;
  health: boolean;
  privatePhotos: boolean;
  /** Extended caregiver & school/nursery permissions */
  receiveReminders?: boolean;
  submitCareUpdates?: boolean;
  emergencyAccess?: boolean;
  viewEducational?: boolean;
  uploadReports?: boolean;
}

export type ExtendedRoleCategory =
  | 'mother'
  | 'father'
  | 'grandparent'
  | 'uncle_aunt'
  | 'nanny'
  | 'nursery'
  | 'teacher'
  | 'other';

export interface FamilyMember {
  id: number;
  name: string;
  role: string;
  side: string;
  wishes: boolean;
  events: boolean;
  emoji: string;
  permissions: GranularPermissions;
  roleCategory?: ExtendedRoleCategory;
  phoneCountry?: CountryCode;
  phoneNumber?: string;
  email?: string;
  /** Child IDs this person can access. Empty or undefined means all children for family, or specific children for nursery/school */
  assignedKidIds?: number[];
  accessExpiresAt?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled' | 'revoked';

export interface FamilyInvitation {
  id: number;
  recipientName: string;
  roleLabel: string;
  roleCategory: ExtendedRoleCategory;
  side: string;
  phoneCountry: CountryCode;
  phoneNumber: string;
  email?: string;
  assignedKidIds: number[];
  permissions: GranularPermissions;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  invitedByParent: 'mother' | 'father';
}

export interface ParentNotificationPrefs {
  enabled: boolean;
  morningEnabled: boolean;
  middayEnabled: boolean;
  eveningEnabled: boolean;
  morningTime: string;
  middayTime: string;
  eveningTime: string;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface ParentAccountProfile {
  id: 'mother' | 'father';
  fullName: string;
  relationshipRole: 'الأم' | 'الأب';
  country: CountryCode;
  phoneCode: '+20' | '+966';
  phoneNumber: string;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  notificationPrefs: ParentNotificationPrefs;
}

export interface DailyParentingNotification {
  id: string;
  slot: 'morning' | 'midday' | 'evening' | 'security';
  parentTarget: 'mother' | 'father' | 'both';
  scheduledTime: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  childName?: string;
  ageStage?: AgeStage;
  categoryLabelAr: string;
  categoryLabelEn: string;
  read: boolean;
  suppressedByQuietHours?: boolean;
}

export interface CartItem {
  productId: number;
  quantity: number;
  selectedVariant?: string;
}

export interface DemoShippingAddress {
  recipientName: string;
  city: string;
  district: string;
  streetDetails: string;
  phone: string;
}

export type CheckoutPaymentMethodType = 'electronic_card' | 'apple_pay' | 'google_pay' | 'cod';

export interface DemoOrder {
  id: string;
  createdAt: string;
  items: { productId: number; name: string; quantity: number; unitPrice: number; variant?: string }[];
  totalAmount: number;
  deliveryFee?: number;
  currency: CurrencyCode;
  shippingAddress: DemoShippingAddress;
  paymentMethod?: CheckoutPaymentMethodType;
  paymentMethodLabelAr?: string;
  paymentMethodLabelEn?: string;
  status: 'confirmed_demo';
}

export interface FamilySpaceState {
  role: ParentThemeRole;
  parentName: string;
  country: CountryCode;
  city: string;
  language: LanguageCode;
  currency: CurrencyCode;
  calendarMode: CalendarDisplayMode;
  disputeFreezeActive: boolean;
  savedMediaIds: number[];
  events: CalendarEvent[];
  kids: ChildProfile[];
  tasks: RoutineTask[];
  wishes: WishItem[];
  family: FamilyMember[];
  /** Extended Max-Mode State (auto-normalized with safe defaults) */
  activeParentAccount: 'mother' | 'father';
  parentAccounts: {
    mother: ParentAccountProfile;
    father: ParentAccountProfile;
  };
  invitations: FamilyInvitation[];
  readNotificationIds: string[];
  cart: CartItem[];
  recentlyViewedProductIds: number[];
  shippingAddress: DemoShippingAddress;
  orders: DemoOrder[];
  darkMode?: boolean;
}

export type MediaTopicCategory =
  | 'sleep'
  | 'food'
  | 'play'
  | 'behavior'
  | 'health'
  | 'milestones'
  | 'emotions'
  | 'psychology'
  | 'parent_wellbeing'
  | 'family_relations'
  | 'school_transition';

export interface MediaContentItem {
  id: number;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  body: string[];
  bodyEn?: string[];
  type: 'video' | 'article' | 'guide' | 'audio' | 'gallery';
  topic: MediaTopicCategory;
  tags: string[];
  ageStage: AgeStage;
  durationLabel: string;
  readCount: string;
  rating: string;
  isSponsored: boolean;
  sponsorLabel?: string;
  emoji: string;
  accentTone: 'rose' | 'aqua' | 'lavender' | 'notice';
  reviewStatus?: 'draft' | 'medical_review' | 'reviewed_published';
  reviewerCredentialsAr?: string;
  reviewerCredentialsEn?: string;
  audioConfig?: {
    durationSeconds: number;
    melodyNotesHz: number[];
    transcriptAr: string;
    transcriptEn: string;
  };
  videoConfig?: {
    durationSeconds: number;
    captionsAr: string[];
    captionsEn: string[];
    chaptersAr: string[];
    chaptersEn: string[];
  };
  gallerySlides?: {
    titleAr: string;
    titleEn: string;
    captionAr: string;
    captionEn: string;
    iconId: string;
  }[];
}

export interface CommercialCatalogItem {
  id: number;
  name: string;
  nameEn: string;
  kind: 'service' | 'product' | 'offer';
  category: 'doctor' | 'nursery' | 'consultation' | 'delivery' | 'toys' | 'clothing' | 'essentials';
  categoryLabel: string;
  country: CountryCode | 'ALL';
  city: string;
  priceEGP: number;
  priceSAR: number;
  originalPriceEGP?: number;
  originalPriceSAR?: number;
  rating: string;
  reviewCount?: number;
  isSponsored: boolean;
  partnerBrand?: string;
  description: string;
  descriptionEn?: string;
  emoji: string;
  ageStage?: AgeStage;
  collectionTag?: 'bestseller' | 'new' | 'deal' | 'recommended';
  variants?: string[];
  specificationsAr?: string[];
  specificationsEn?: string[];
  sellerName?: string;
  deliveryEstimateAr?: string;
  deliveryEstimateEn?: string;
}

export const STORAGE_KEY = 'family-space-v1';
export const DEMO_OTP_CODE = '123456';

export const DEFAULT_PARENT_ACCOUNTS: {
  mother: ParentAccountProfile;
  father: ParentAccountProfile;
} = {
  mother: {
    id: 'mother',
    fullName: 'سارة (الأم)',
    relationshipRole: 'الأم',
    country: 'EG',
    phoneCode: '+20',
    phoneNumber: '1012345678',
    phoneVerified: true,
    email: 'sara.mom@familyspace.demo',
    emailVerified: true,
    onboardingCompleted: true,
    notificationPrefs: {
      enabled: true,
      morningEnabled: true,
      middayEnabled: true,
      eveningEnabled: true,
      morningTime: '08:30',
      middayTime: '14:00',
      eveningTime: '20:30',
      quietHoursStart: '22:30',
      quietHoursEnd: '07:00',
    },
  },
  father: {
    id: 'father',
    fullName: 'أحمد (الأب)',
    relationshipRole: 'الأب',
    country: 'EG',
    phoneCode: '+20',
    phoneNumber: '1098765432',
    phoneVerified: true,
    email: 'ahmed.dad@familyspace.demo',
    emailVerified: true,
    onboardingCompleted: true,
    notificationPrefs: {
      enabled: true,
      morningEnabled: true,
      middayEnabled: true,
      eveningEnabled: true,
      morningTime: '09:00',
      middayTime: '15:00',
      eveningTime: '21:00',
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
    },
  },
};

export interface CityOption {
  id: string;
  nameAr: string;
  nameEn: string;
  regionAr: string;
  regionEn: string;
  providersCount: number;
}

export const COUNTRY_CITIES_MAP: Record<CountryCode, CityOption[]> = {
  EG: [
    { id: 'القاهرة', nameAr: 'القاهرة الكبرى (التجمع / المعادي / مدينة نصر)', nameEn: 'Greater Cairo (New Cairo / Maadi / Nasr City)', regionAr: 'محافظة القاهرة', regionEn: 'Cairo Governorate', providersCount: 42 },
    { id: 'الشيخ زايد', nameAr: 'الشيخ زايد و6 أكتوبر', nameEn: 'Sheikh Zayed & 6th of October', regionAr: 'محافظة الجيزة', regionEn: 'Giza Governorate', providersCount: 28 },
    { id: 'الإسكندرية', nameAr: 'الإسكندرية (سموحة / رشدي / كفر عبده)', nameEn: 'Alexandria (Smouha / Roushdy)', regionAr: 'محافظة الإسكندرية', regionEn: 'Alexandria Governorate', providersCount: 19 },
    { id: 'المنصورة', nameAr: 'المنصورة والدلتا', nameEn: 'Mansoura & Delta', regionAr: 'محافظة الدقهلية', regionEn: 'Dakahlia Governorate', providersCount: 14 },
    { id: 'طنطا', nameAr: 'طنطا والغربية', nameEn: 'Tanta & Gharbia', regionAr: 'محافظة الغربية', regionEn: 'Gharbia Governorate', providersCount: 11 },
    { id: 'أسيوط', nameAr: 'أسيوط وصعيد مصر', nameEn: 'Assiut & Upper Egypt', regionAr: 'محافظة أسيوط', regionEn: 'Assiut Governorate', providersCount: 9 },
  ],
  SA: [
    { id: 'الرياض', nameAr: 'الرياض (العليا / الملقا / النرجس)', nameEn: 'Riyadh (Olaya / Al Malqa / Al Narjis)', regionAr: 'منطقة الرياض', regionEn: 'Riyadh Region', providersCount: 38 },
    { id: 'جدة', nameAr: 'جدة (الروضة / الشاطئ / أبحر)', nameEn: 'Jeddah (Al Rawdah / Ash Shati)', regionAr: 'منطقة مكة المكرمة', regionEn: 'Makkah Region', providersCount: 26 },
    { id: 'الدمام', nameAr: 'الدمام والخبر والظهران', nameEn: 'Dammam, Khobar & Dhahran', regionAr: 'المنطقة الشرقية', regionEn: 'Eastern Province', providersCount: 18 },
    { id: 'المدينة المنورة', nameAr: 'المدينة المنورة', nameEn: 'Madinah', regionAr: 'منطقة المدينة المنورة', regionEn: 'Madinah Region', providersCount: 12 },
    { id: 'مكة المكرمة', nameAr: 'مكة المكرمة', nameEn: 'Makkah', regionAr: 'منطقة مكة المكرمة', regionEn: 'Makkah Region', providersCount: 15 },
    { id: 'أبها', nameAr: 'أبها وخميس مشيط', nameEn: 'Abha & Khamis Mushait', regionAr: 'منطقة عسير', regionEn: 'Asir Region', providersCount: 10 },
  ],
};

export const DEFAULT_SEED: FamilySpaceState = {
  role: 'mom',
  parentName: 'أحمد و سارة',
  country: 'EG',
  city: 'القاهرة',
  language: 'ar',
  currency: 'EGP',
  calendarMode: 'both',
  disputeFreezeActive: false,
  darkMode: false,
  savedMediaIds: [101, 102],
  activeParentAccount: 'mother',
  parentAccounts: structuredClone(DEFAULT_PARENT_ACCOUNTS),
  invitations: [
    {
      id: 501,
      recipientName: 'أ. ريم — مشرفة حضانة خطوات صغيرة',
      roleLabel: 'مشرفة حضانة',
      roleCategory: 'nursery',
      side: 'الحضانة والمدرسة',
      phoneCountry: 'EG',
      phoneNumber: '1022334455',
      email: 'reem.nursery@demo.org',
      assignedKidIds: [2], // Assigned ONLY to Nour (id: 2)
      permissions: {
        profile: true,
        routine: true,
        calendar: true,
        wishes: false,
        growth: false,
        health: false,
        privatePhotos: false,
        receiveReminders: true,
        submitCareUpdates: true,
        emergencyAccess: true,
        viewEducational: true,
        uploadReports: true,
      },
      status: 'pending',
      createdAt: '2026-10-20T09:00:00.000Z',
      expiresAt: '2026-12-31',
      invitedByParent: 'mother',
    },
  ],
  readNotificationIds: [],
  cart: [{ productId: 201, quantity: 1, selectedVariant: 'مجموعة 60 قطعة (2–6 سنوات)' }],
  recentlyViewedProductIds: [201, 202, 203],
  shippingAddress: {
    recipientName: 'أحمد و سارة',
    city: 'القاهرة الجديدة',
    district: 'التجمع الخامس — الحي الثالث',
    streetDetails: 'شارع التسعين الشمالي، فيلا 14 (عنوان تجريبي)',
    phone: '+20 1012345678',
  },
  orders: [],
  events: [
    {
      id: 901,
      title: 'موعد التطعيم - نور',
      date: '2026-10-25',
      time: '10:00',
      type: 'تطعيم',
      childId: 2,
      repeat: 'none',
      note: 'إحضار كارت التطعيمات والمتابعة مع طبيب الأطفال',
      createdAt: '2026-10-20T09:00:00.000Z',
    },
    {
      id: 902,
      title: 'اجتماع عائلي وتخطيط الأسبوع',
      date: '2026-10-26',
      time: '17:00',
      type: 'موعد عائلي',
      childId: null,
      repeat: 'weekly',
      note: 'مراجعة روتين الأسبوع وتوزيع المهام بين الأب والأم',
      createdAt: '2026-10-20T10:00:00.000Z',
    },
    {
      id: 903,
      title: 'حصة السباحة - عز',
      date: '2026-10-28',
      time: '18:00',
      type: 'نشاط',
      childId: 1,
      repeat: 'weekly',
      note: 'تجهيز شنطة التمرين والمنشفة',
      createdAt: '2026-10-20T11:00:00.000Z',
    },
  ],
  kids: [
    {
      id: 1,
      name: 'عز',
      gender: 'boy',
      birth: '2021-08-15',
      interests: 'المكعبات، السباحة، والسيارات',
      emoji: '👦🏻',
      bloodType: 'O+',
      vaccinationsNote: 'مكتمل حتى سن 5 سنوات (جرعة تنشيطية قادمة)',
      healthNotePrivate: 'لا توجد حساسية طعام مسجلة — سجل خاص بالوالدين',
      growthHeightCm: 110,
      growthWeightKg: 19,
      avatarTheme: 'astronaut',
      useIllustratedAvatar: true,
    },
    {
      id: 2,
      name: 'نور',
      gender: 'girl',
      birth: '2023-09-09',
      interests: 'القصص المصورة، الألوان، والأناشيد',
      emoji: '👧🏻',
      bloodType: 'A+',
      vaccinationsNote: 'متابعة تطعيمات سن 3 سنوات في الموعد القادم',
      healthNotePrivate: 'حساسية خفيفة من الفراولة — سجل خاص بالوالدين',
      growthHeightCm: 95,
      growthWeightKg: 14.2,
      avatarTheme: 'artist',
      useIllustratedAvatar: true,
    },
  ],
  tasks: [
    {
      id: 1,
      name: 'تناول الإفطار الصحي ووقت هادئ',
      time: '07:00 ص',
      done: true,
      kidId: null,
      category: 'أكل وشرب',
      owner: 'مشترك',
      cadence: 'daily',
    },
    {
      id: 2,
      name: 'التحضير للمدرسة والحضانة',
      time: '07:30 ص',
      done: true,
      kidId: 1,
      category: 'روتين عام',
      owner: 'الأم',
      cadence: 'daily',
    },
    {
      id: 3,
      name: 'وقت التعلم وتنمية المهارات',
      time: '04:00 م',
      done: false,
      kidId: 2,
      category: 'لعب وتعلم',
      owner: 'مشترك',
      cadence: 'daily',
    },
    {
      id: 4,
      name: 'قراءة قصة قبل النوم',
      time: '07:00 م',
      done: false,
      kidId: null,
      category: 'لعب وتعلم',
      owner: 'الأب',
      cadence: 'daily',
    },
    {
      id: 5,
      name: 'روتين النوم الهادئ',
      time: '09:00 م',
      done: false,
      kidId: null,
      category: 'نوم',
      owner: 'مشترك',
      cadence: 'daily',
    },
    {
      id: 6,
      name: 'ترتيب ركن الألعاب والكتب الأسبوعي',
      time: '11:00 ص',
      done: false,
      kidId: 1,
      category: 'روتين عام',
      owner: 'مشترك',
      cadence: 'weekly',
    },
    {
      id: 7,
      name: 'قياس الطول والوزن الشهري',
      time: '06:00 م',
      done: false,
      kidId: null,
      category: 'صحة',
      owner: 'الأم',
      cadence: 'monthly',
    },
  ],
  wishes: [
    {
      id: 1,
      name: 'مكعبات تركيب هندسية ذكية',
      kid: 1,
      price: 450,
      currency: 'EGP',
      emoji: '🧱',
      reserved: false,
      progress: 70,
      goalType: 'لعبة تعليمية',
    },
    {
      id: 2,
      name: 'مجموعة قصص مصورة قبل النوم',
      kid: 2,
      price: 180,
      currency: 'EGP',
      emoji: '📚',
      reserved: true,
      progress: 100,
      goalType: 'هدية القراءة',
    },
    {
      id: 3,
      name: 'رحلة عائلية ترفيهية وعطلة شاطئية',
      kid: 1,
      price: 3500,
      currency: 'EGP',
      emoji: '🏖️',
      reserved: false,
      progress: 40,
      goalType: 'إدخار العائلة',
    },
    {
      id: 4,
      name: 'جهاز لوحي تعليمي برقابة أبوية',
      kid: 2,
      price: 2200,
      currency: 'EGP',
      emoji: '📱',
      reserved: false,
      progress: 30,
      goalType: 'تطوير مهارات',
    },
  ],
  family: [
    {
      id: 1,
      name: 'بابا (أحمد)',
      role: 'الأب',
      side: 'الأسرة الأساسية',
      wishes: true,
      events: true,
      emoji: '👨🏻',
      roleCategory: 'father',
      phoneCountry: 'EG',
      phoneNumber: '1098765432',
      assignedKidIds: [1, 2],
      permissions: {
        profile: true,
        routine: true,
        calendar: true,
        wishes: true,
        growth: true,
        health: true,
        privatePhotos: true,
        receiveReminders: true,
        submitCareUpdates: true,
        emergencyAccess: true,
        viewEducational: true,
        uploadReports: true,
      },
    },
    {
      id: 2,
      name: 'تيتا منى',
      role: 'جدة الأم',
      side: 'عيلة الأم',
      wishes: true,
      events: true,
      emoji: '👵🏻',
      roleCategory: 'grandparent',
      phoneCountry: 'EG',
      phoneNumber: '1055667788',
      assignedKidIds: [1, 2],
      permissions: {
        profile: true,
        routine: true,
        calendar: true,
        wishes: true,
        growth: false,
        health: false,
        privatePhotos: false,
        receiveReminders: true,
        submitCareUpdates: false,
        emergencyAccess: true,
        viewEducational: true,
        uploadReports: false,
      },
    },
  ],
};

export const MEDIA_CONTENT_CATALOG: MediaContentItem[] = [
  {
    id: 101,
    title: '5 أنشطة لتنمية مهارات الطفل في المنزل',
    titleEn: '5 Home Activities to Boost Child Skills',
    summary: 'أنشطة عملية بالخامات المتاحة في البيت لتقوية التركيز، التآزر الحركي، واللغة من سن سنتين حتى 6 سنوات.',
    summaryEn: 'Practical home activities to strengthen focus, motor skills, and language for ages 2–6.',
    body: [
      'اللعب الموجه في المنزل من أهم أدوات بناء الدماغ وتطوير المهارات الحركية واللغوية دون الحاجة لشاشات أو ألعاب معقدة.',
      '1. تصنيف الألوان والأحجام: استخدمي المكعبات أو الأغطية البلاستيكية الآمنة لتعليم الطفل الفرز والمقارنة.',
      '2. صندوق الحواس: وعاء يحتوي على حبوب جافة أو رمل طبي مع أدوات غرف لتقوية عضلات اليد الدقيقة قبل مرحلة الكتابة.',
      '3. مسرح العرائس المنزلي: تمثيل مواقف يومية يساعد الطفل على التعبير عن مشاعره وبناء حصيلة لغوية غنية.',
      '4. مسار التوازن: شريط لاصق ملون على الأرض يمشي عليه الطفل لتعزيز التوازن والتآزر الحركي.',
      '5. المشاركة في مهام بسيطة: ترتيب الألعاب أو غسل الفواكه يعزز الثقة بالنفس والمسؤولية المبكرة.',
    ],
    type: 'video',
    topic: 'milestones',
    tags: ['تطور مهارات', 'لعب موجه', 'تركيز'],
    ageStage: '2-5',
    durationLabel: '6 دقائق',
    readCount: '4.8k مشاهدة',
    rating: '4.9',
    isSponsored: false,
    emoji: '🎨',
    accentTone: 'aqua',
    reviewStatus: 'reviewed_published',
    reviewerCredentialsAr: 'مراجعة علمية: د. ليلى حسن — استشاري تطور الطفل',
    reviewerCredentialsEn: 'Reviewed by Dr. Laila Hassan — Child Development Specialist',
    videoConfig: {
      durationSeconds: 45,
      captionsAr: [
        'مرحباً بكم في دليل الأنشطة المنزلية ثلاثية الأبعاد لتنمية مهارات طفلك.',
        'الخطوة الأولى: فرز المكعبات حسب اللون والحجم لتقوية الانتباه البصري.',
        'الخطوة الثانية: اللعب الحسي وتمارين التوازن لتعزيز الثقة والمهارات الحركية الدقيقة.',
      ],
      captionsEn: [
        'Welcome to the 3D Home Activities Guide for boosting your child skills.',
        'Step 1: Sort blocks by color and size to strengthen visual attention.',
        'Step 2: Sensory play and balance tracks to build confidence and fine motor control.',
      ],
      chaptersAr: ['مقدمة اللعب الموجه', 'فرز الألوان والأحجام', 'صندوق الحواس والتوازن'],
      chaptersEn: ['Guided Play Intro', 'Sorting Colors & Sizes', 'Sensory Box & Balance'],
    },
  },
  {
    id: 102,
    title: 'أهمية النوم الجيد للأطفال وجدول الساعات حسب العمر',
    titleEn: 'Healthy Sleep Routines & Hours by Age',
    summary: 'دليل شامل لتنظيم ساعة الطفل البيولوجية وتقليل الاستيقاظ الليلي وبناء روتين هادئ قبل النوم.',
    summaryEn: 'Complete guide to regulating sleep cycles and building a calm bedtime routine.',
    body: [
      'النوم المنتظم ليس مجرد راحة، بل هو الوقت الأساسي لإفراز هرمون النمو وترسيخ ما تعلمه الطفل خلال اليوم.',
      'الأطفال من يوم حتى سنتين يحتاجون من 12 إلى 16 ساعة شاملة القيلولة، بينما يحتاج الأطفال من 3 إلى 5 سنوات من 10 إلى 13 ساعة يوميًا.',
      'خطوات عملية: خفض الإضاءة قبل النوم بساعة، إيقاف الشاشات تمامًا، حمام دافئ، وقراءة قصة قصيرة بصوت هادئ في نفس الموعد كل ليلة.',
    ],
    type: 'article',
    topic: 'sleep',
    tags: ['صحة', 'أطفال', 'نوم'],
    ageStage: '0-2',
    durationLabel: '4 دقائق قراءة',
    readCount: '3.4k قراءة',
    rating: '4.8',
    isSponsored: false,
    emoji: '🌙',
    accentTone: 'lavender',
    reviewStatus: 'reviewed_published',
    reviewerCredentialsAr: 'مراجعة طبية: د. طارق المنشاوي — طب الأطفال وحديثي الولادة',
    reviewerCredentialsEn: 'Reviewed by Dr. Tarek El-Menshawy — Pediatrics & Neonatology',
  },
  {
    id: 103,
    title: 'تغذية الأطفال السليمة وأفكار وجبات مدرسية متوازنة',
    titleEn: 'Balanced Child Nutrition & Lunchbox Ideas',
    summary: 'كيف تقدمين وجبات غنية بالحديد والكالسيوم والفيتامينات بدون ضغط أو إجبار، مع بدائل صحية للحلويات.',
    summaryEn: 'How to serve iron- and calcium-rich meals without pressure, plus healthy snack swaps.',
    body: [
      'تنوع الألوان في طبق الطفل يضمن حصوله على الفيتامينات والمعادن الضرورية للنمو والمناعة.',
      'قسمي الطبق إلى: نصف للخضروات والفواكه المقطعة بأشكال جذابة، ربع للبروتين (بيض، جبن قريش، دجاج، بقوليات)، وربع للنشويات المعقدة.',
      'تجنبي استخدام الحلوى كمكافأة، وقدمي المياه بانتظام طوال اليوم.',
    ],
    type: 'guide',
    topic: 'food',
    tags: ['تغذية', 'صحة', 'وجبات'],
    ageStage: '2-5',
    durationLabel: '5 دقائق قراءة',
    readCount: '2.9k قراءة',
    rating: '4.8',
    isSponsored: false,
    emoji: '🥗',
    accentTone: 'rose',
    reviewStatus: 'reviewed_published',
    reviewerCredentialsAr: 'مراجعة: أ.د. ندى سليم — استشاري تغذية الأطفال',
    reviewerCredentialsEn: 'Reviewed by Prof. Nada Salim — Pediatric Nutritionist',
  },
  {
    id: 104,
    title: 'أفضل الألعاب التعليمية لتنمية التفكير المنطقي (5–8 سنوات)',
    titleEn: 'Best Educational Games for Logical Thinking (5–8 Yrs)',
    summary: 'مراجعة لألعاب الفك والتركيب والألغاز التي تبني مهارات حل المشكلات والاستعداد المدرسي.',
    summaryEn: 'Review of puzzles and building sets that build problem-solving and school readiness.',
    body: [
      'في مرحلة 5 إلى 8 سنوات يتطور التفكير المنطقي والقدرة على التخطيط والعمل الجماعي.',
      'الألعاب المفتوحة مثل المكعبات الهندسية، ألعاب المتاهات، والتجارب العلمية المنزلية الآمنة تمنح الطفل مساحة للابتكار والتجربة.',
    ],
    type: 'video',
    topic: 'play',
    tags: ['ألعاب تعليمية', 'تفكير منطقي'],
    ageStage: '5-8',
    durationLabel: '7 دقائق',
    readCount: '5.1k مشاهدة',
    rating: '4.9',
    isSponsored: false,
    emoji: '🧩',
    accentTone: 'aqua',
    reviewStatus: 'reviewed_published',
    videoConfig: {
      durationSeconds: 40,
      captionsAr: [
        'كيف نختار الألعاب التي تبني التفكير المنطقي وحل المشكلات من سن 5 إلى 8 سنوات؟',
        'الألغاز الهندسية وتجارب الفك والتركيب تحفز الفص الجبهي والذاكرة العاملة.',
        'شارك طفلك اللعب لمدة 20 دقيقة يومياً لتعزيز الحوار والثقة.',
      ],
      captionsEn: [
        'How to choose games that build logical thinking and problem-solving for ages 5–8?',
        'Geometric puzzles and building sets stimulate executive function and working memory.',
        'Join your child for 20 minutes daily to strengthen dialogue and confidence.',
      ],
      chaptersAr: ['أهمية التفكير المنطقي', 'الألغاز الهندسية', 'اللعب التشاركي مع الوالدين'],
      chaptersEn: ['Why Logical Thinking Matters', 'Geometric Puzzles', 'Co-play with Parents'],
    },
  },
  {
    id: 105,
    title: 'التعامل التربوي مع نوبات الغضب والعناد عند الأطفال',
    titleEn: 'Positive Parenting for Tantrums & Big Emotions',
    summary: 'خطوات عملية لتسمية المشاعر، وضع حدود واضحة بهدوء، وبناء الأمان العاطفي بين الوالدين والطفل.',
    summaryEn: 'Actionable steps for naming emotions, setting calm boundaries, and emotional safety.',
    body: [
      'نوبات الغضب في السنوات الأولى هي تعبير عن مشاعر كبيرة لا يملك الطفل بعد الكلمات الكافية لوصفها.',
      'الخطوة الأولى هي هدوء الوالدين، ثم النزول لمستوى نظر الطفل وتسمية شعوره: «أنا فاهم إنك زعلان عشان وقت اللعب خلص»، مع الحفاظ على الحد المتفق عليه بهدوء وثبات.',
    ],
    type: 'article',
    topic: 'behavior',
    tags: ['سلوك', 'تربية إيجابية'],
    ageStage: 'all',
    durationLabel: '5 دقائق قراءة',
    readCount: '6.2k قراءة',
    rating: '4.9',
    isSponsored: false,
    emoji: '💛',
    accentTone: 'rose',
    reviewStatus: 'reviewed_published',
    reviewerCredentialsAr: 'مراجعة نفسية: د. مريم عبد الرحمن — علم النفس التربوي والأسري',
    reviewerCredentialsEn: 'Reviewed by Dr. Mariam Abdelrahman — Child & Family Psychologist',
  },
  {
    id: 106,
    title: 'دليل العناية ببشرة الرضع وحقيبة المستلزمات اليومية',
    titleEn: 'Baby Skin Care & Daily Essentials Checklist',
    summary: 'محتوى توعوي مقدم بالتعاون مع شركاء العناية بالطفل — مفصول بوضوح كمحتوى برعاية تجارية.',
    summaryEn: 'Educational checklist presented with baby-care partners — clearly labeled as sponsored.',
    body: [
      'اختيار منتجات خالية من العطور القوية والكحول يحمي حاجز البشرة الحساس لدى الرضع منذ اليوم الأول.',
      'ملاحظة الشفافية: هذا الدليل التوضيحي مصنف كمحتوى برعاية تجارية (Sponsored) للتمييز الصريح بين المقالات التربوية المستقلة والعروض الترويجية.',
    ],
    type: 'guide',
    topic: 'health',
    tags: ['عناية يومية', 'مستلزمات'],
    ageStage: '0-2',
    durationLabel: '3 دقائق قراءة',
    readCount: '1.9k قراءة',
    rating: '4.7',
    isSponsored: true,
    sponsorLabel: 'محتوى برعاية تجارية (نموذج توضيحي)',
    emoji: '🧴',
    accentTone: 'notice',
    reviewStatus: 'reviewed_published',
  },
  {
    id: 107,
    title: 'قصة صوتية وتهويدة هادئة قبل النوم: رحلة القمر الصغير',
    titleEn: 'Audio Story & Bedtime Lullaby: Little Moon Journey',
    summary: 'مقطع صوتي تفاعلي هادئ يساعد الطفل على الاسترخاء والانتقال السلس لروتين النوم مع نص مكتوب كامل.',
    summaryEn: 'Calming interactive audio story and lullaby to help children wind down for bedtime with full transcript.',
    body: [
      'استمعوا مع طفلكم إلى قصة «رحلة القمر الصغير» المصممة بترددات صوتية هادئة ومريحة قبل النوم.',
      'يمكنكم التحكم في سرعة السرد ومستوى الصوت أو قراءة النص المكتوب مع طفلكم.',
    ],
    type: 'audio',
    topic: 'emotions',
    tags: ['قصة صوتية', 'تهويدة', 'نوم هادئ'],
    ageStage: '2-5',
    durationLabel: '3 دقائق استماع',
    readCount: '7.4k استماع',
    rating: '5.0',
    isSponsored: false,
    emoji: '🎧',
    accentTone: 'lavender',
    reviewStatus: 'reviewed_published',
    audioConfig: {
      durationSeconds: 36,
      melodyNotesHz: [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 261.63],
      transcriptAr:
        'في المساء الهادئ، أطلّ القمر الصغير من خلف الغيوم الناعمة، وقال للنجوم: حان وقت الراحة والأحلام الجميلة. أغمض الصغار عيونهم بابتسامة مطمئنة بعد يوم مليء بالحب والاكتشاف.',
      transcriptEn:
        'In the calm evening, the little moon peeked from behind soft clouds and whispered to the stars: It is time for rest and sweet dreams. Little ones closed their eyes with a peaceful smile after a day full of love and discovery.',
    },
  },
  {
    id: 108,
    title: 'علم نفس الطفل وتخفيف التوتر الأسري والاحتراق الوالدي',
    titleEn: 'Child Psychology, Parent Well-Being & Reducing Burnout',
    summary: 'كيف ينعكس هدوء الأم والأب وتناغم العلاقة الزوجية مباشرة على شعور الطفل بالأمان النفسي.',
    summaryEn: 'How parent well-being and harmonious co-parenting directly shape a child’s emotional security.',
    body: [
      'رعاية الطفل تبدأ من رعاية الوالدين لأنفسهم؛ تقسيم المهام اليومية بوضوح بين الأم والأب يقلل الإرهاق بنسبة كبيرة.',
      'تخصيص 15 دقيقة يومياً للحوار الهادئ بين الزوجين بعيداً عن ضغوط المهام يعيد التوازن العاطفي للأسرة كلها.',
    ],
    type: 'article',
    topic: 'parent_wellbeing',
    tags: ['علم نفس الطفل', 'دعم الوالدين', 'علاقات أسرية'],
    ageStage: 'all',
    durationLabel: '5 دقائق قراءة',
    readCount: '4.2k قراءة',
    rating: '4.9',
    isSponsored: false,
    emoji: '🧘‍♀️',
    accentTone: 'aqua',
    reviewStatus: 'reviewed_published',
    reviewerCredentialsAr: 'مراجعة: د. كريم فؤاد — استشاري الصحة النفسية والإرشاد الأسري',
    reviewerCredentialsEn: 'Reviewed by Dr. Karim Fouad — Family & Mental Health Consultant',
  },
  {
    id: 109,
    title: 'معرض البطاقات المرئية ثلاثية الأبعاد: الاستعداد للحضانة والمدرسة',
    titleEn: '3D Visual Cards Gallery: Smooth Nursery & School Transition',
    summary: 'شرائح مرئية تفاعلية لتأهيل الطفل نفسيًا واجتماعيًا لأول أيام الحضانة أو المدرسة بدون قلق الانفصال.',
    summaryEn: 'Interactive 3D visual slides preparing children socially and emotionally for nursery or school without separation anxiety.',
    body: [
      'استعرض البطاقات البصرية ثلاثية الأبعاد مع طفلك لشرح خطوات يوم الحضانة أو المدرسة بطريقة ممتعة ومطمئنة.',
    ],
    type: 'gallery',
    topic: 'school_transition',
    tags: ['حضانة', 'مدرسة', 'تهيئة نفسية'],
    ageStage: '2-5',
    durationLabel: '4 شرائح تفاعلية',
    readCount: '3.8k استعراض',
    rating: '4.9',
    isSponsored: false,
    emoji: '🖼️',
    accentTone: 'rose',
    reviewStatus: 'reviewed_published',
    gallerySlides: [
      {
        titleAr: '1. طقس الوداع الصباحي المطمئن',
        titleEn: '1. Reassuring Morning Goodbye Ritual',
        captionAr: 'قبلة وعناق قصير مع وعد واضح بموعد العودة يمنح الطفل ثقة وأمانًا.',
        captionEn: 'A warm hug and a clear promise of pickup time give your child confidence and safety.',
        iconId: 'children',
      },
      {
        titleAr: '2. استكشاف ركن الألعاب والأصدقاء',
        titleEn: '2. Exploring the Play Corner & Friends',
        captionAr: 'التعرف المسبق على المعلمة ومكان اللعب يقلل رهبة المكان الجديد.',
        captionEn: 'Meeting the teacher and seeing the play area beforehand eases unfamiliarity.',
        iconId: 'games',
      },
      {
        titleAr: '3. وجبة صحية مألوفة من البيت',
        titleEn: '3. Familiar Healthy Lunchbox from Home',
        captionAr: 'وجود فاكهة أو وجبة يحبها الطفل يربطه بدفء المنزل أثناء اليوم الدراسي.',
        captionEn: 'Packing a favorite fruit or snack connects the child with home comfort.',
        iconId: 'health',
      },
      {
        titleAr: '4. لقاء العودة ومشاركة حكايات اليوم',
        titleEn: '4. Pickup Reunion & Sharing Today’s Stories',
        captionAr: 'اسأل طفلك عن أجمل لحظة مرت عليه اليوم بدلاً من الأسئلة العامة.',
        captionEn: 'Ask your child about the happiest moment of their day rather than generic questions.',
        iconId: 'family',
      },
    ],
  },
];

export const COMMERCIAL_CATALOG: CommercialCatalogItem[] = [
  {
    id: 201,
    name: 'لعبة تعليمية تفاعلية لتنمية المهارات (60 قطعة)',
    nameEn: 'Interactive Educational Skill Set (60 pcs)',
    kind: 'product',
    category: 'toys',
    categoryLabel: 'ألعاب',
    country: 'ALL',
    city: 'القاهرة / الرياض',
    priceEGP: 420,
    priceSAR: 108,
    originalPriceEGP: 520,
    originalPriceSAR: 135,
    rating: '4.9',
    reviewCount: 142,
    isSponsored: false,
    description: 'مجموعة خشبية آمنة لتعليم الأرقام، الألوان، والتطابق الحركي للأطفال من 2 إلى 6 سنوات.',
    descriptionEn: 'Safe wooden Montessori set teaching numbers, colors, and motor matching for ages 2–6.',
    emoji: '🧸',
    ageStage: '2-5',
    collectionTag: 'bestseller',
    variants: ['مجموعة 60 قطعة (2–6 سنوات)', 'مجموعة 90 قطعة متقدمة'],
    specificationsAr: ['خشب زان طبيعي آمن غير سام', 'حواف دائرية مصقولة لحماية الطفل', 'كتيب أنشطة باللغتين العربية والإنجليزية'],
    specificationsEn: ['Non-toxic natural beechwood', 'Smooth rounded safety edges', 'Bilingual activity guide (AR/EN)'],
    sellerName: 'متجر خطوات مونتيسوري المعتمد',
    deliveryEstimateAr: 'توصيل خلال 24–48 ساعة (القاهرة / الرياض)',
    deliveryEstimateEn: 'Delivery within 24–48 hrs (Cairo / Riyadh)',
  },
  {
    id: 202,
    name: 'طقم ملابس قطنية عضوية مريحة للروتين اليومي',
    nameEn: 'Organic Cotton Daily Comfort Set',
    kind: 'product',
    category: 'clothing',
    categoryLabel: 'ألبسة',
    country: 'ALL',
    city: 'القاهرة / جدة',
    priceEGP: 650,
    priceSAR: 145,
    rating: '4.8',
    reviewCount: 89,
    isSponsored: false,
    description: 'قطن طبيعي 100% ناعم على بشرة الأطفال ومناسب للحركة واللعب والحضانة.',
    descriptionEn: '100% organic breathable cotton gentle on sensitive skin for nursery and play.',
    emoji: '👕',
    ageStage: '0-2',
    collectionTag: 'new',
    variants: ['مقاس 1–2 سنة (روز هادئ)', 'مقاس 2–4 سنوات (أكوا سماوي)', 'مقاس 4–6 سنوات (كريمي)'],
    specificationsAr: ['قطن مصري عضوي 100%', 'خالي من الأصباغ الكيميائية', 'قابل للغسيل المتكرر دون انكماش'],
    specificationsEn: ['100% Organic Cotton', 'Chemical-dye free', 'Pre-shrunk durable weave'],
    sellerName: 'دار القطن الطبيعي للطفل',
    deliveryEstimateAr: 'توصيل خلال 2–3 أيام عمل',
    deliveryEstimateEn: 'Delivery within 2–3 business days',
  },
  {
    id: 203,
    name: 'باقة العناية اليومية وحفاضات الأطفال — عرض العائلات',
    nameEn: 'Family Care & Diapers Value Bundle',
    kind: 'offer',
    category: 'essentials',
    categoryLabel: 'مستلزمات',
    country: 'ALL',
    city: 'مصر والسعودية',
    priceEGP: 890,
    priceSAR: 185,
    originalPriceEGP: 1150,
    originalPriceSAR: 240,
    rating: '4.9',
    reviewCount: 215,
    isSponsored: true,
    partnerBrand: 'Pampers · Johnson’s · Bebelac (عرض شريك توضيحي)',
    description: 'خصم خاص للعائلات على مستلزمات العناية اليومية. مصنف بوضوح كعرض تجاري برعاية في النموذج.',
    descriptionEn: 'Special family discount bundle on daily baby essentials. Clearly labeled as a sponsored demo offer.',
    emoji: '🍼',
    ageStage: '0-2',
    collectionTag: 'deal',
    variants: ['مقاس 3 (6–10 كجم)', 'مقاس 4 (9–14 كجم)', 'مقاس 5 (11–16 كجم)'],
    specificationsAr: ['عبوة توفير شهرية (120 حفاضة)', 'مناديل مبللة طبية خالية من العطور', 'غسول لطيف للبشرة الحساسة'],
    specificationsEn: ['Monthly value pack (120 count)', 'Fragrance-free medical wipes', 'Gentle sensitive skin wash'],
    sellerName: 'شركاء العناية بالطفل (عرض توضيحي)',
    deliveryEstimateAr: 'توصيل سريع في نفس اليوم',
    deliveryEstimateEn: 'Same-day express delivery',
  },
  {
    id: 204,
    name: 'عيادة ومراكز طب الأطفال والنمو المتكامل',
    nameEn: 'Pediatric & Child Growth Specialist Clinic',
    kind: 'service',
    category: 'doctor',
    categoryLabel: 'أطباء ومراكز',
    country: 'EG',
    city: 'القاهرة الجديدة / الشيخ زايد',
    priceEGP: 450,
    priceSAR: 180,
    rating: '4.9',
    reviewCount: 310,
    isSponsored: false,
    description: 'متابعة التطعيمات، منحنيات النمو، وفحوصات الأطفال الدورية (بيانات استعراضية للتجربة).',
    descriptionEn: 'Vaccinations tracking, WHO growth curves, and periodic pediatric checkups (demo listing).',
    emoji: '🩺',
    ageStage: 'all',
    collectionTag: 'recommended',
    variants: ['كشف عيادة حضوري', 'استشارة متابعة أونلاين'],
    specificationsAr: ['استشاريون معتمدون في طب الأطفال', 'متابعة شاملة لمنحنيات الطول والوزن', 'تذكير آلي بجدول التطعيمات'],
    specificationsEn: ['Board-certified pediatricians', 'Comprehensive height/weight percentiles', 'Vaccination schedule tracking'],
    sellerName: 'مراكز نمو الطفل الطبية',
    deliveryEstimateAr: 'حجز فوري حسب المواعيد المتاحة',
    deliveryEstimateEn: 'Instant slot booking',
  },
  {
    id: 205,
    name: 'حضانة خطوات صغيرة وعالم الألوان التربوية',
    nameEn: 'Little Steps & Colors Educational Nursery',
    kind: 'service',
    category: 'nursery',
    categoryLabel: 'حضانات ومدارس',
    country: 'ALL',
    city: 'القاهرة / الرياض',
    priceEGP: 3800,
    priceSAR: 1650,
    rating: '4.8',
    reviewCount: 94,
    isSponsored: false,
    description: 'بيئة آمنة لتنمية المهارات اللغوية والاجتماعية والحركية من عمر سنة حتى 5 سنوات.',
    descriptionEn: 'Safe bilingual environment nurturing social, motor, and language skills for ages 1–5.',
    emoji: '🏡',
    ageStage: '2-5',
    collectionTag: 'bestseller',
    variants: ['اشتراك شهري كامل (8 ص – 4 م)', 'اشتراك نصف يوم (8 ص – 1 م)'],
    specificationsAr: ['تقارير يومية مصورة للوالدين عبر مساحة الأسرة', 'منهج مونتيسوري وتطوير لغوي ثنائي', 'إشراف طبي وتغذية صحية'],
    specificationsEn: ['Daily updates linked to Family Space', 'Montessori & bilingual curriculum', 'Medical supervision & healthy meals'],
    sellerName: 'مؤسسة خطوات صغيرة التعليمية',
    deliveryEstimateAr: 'زيارة تعريفية مجانية للوالدين',
    deliveryEstimateEn: 'Free introductory tour for parents',
  },
  {
    id: 206,
    name: 'استشارات تربوية ونفسية وتعديل سلوك مع متخصصين',
    nameEn: 'Certified Parenting & Child Behavior Consultation',
    kind: 'service',
    category: 'consultation',
    categoryLabel: 'استشارات تربوية',
    country: 'ALL',
    city: 'أونلاين / حضوري',
    priceEGP: 500,
    priceSAR: 190,
    rating: '4.9',
    reviewCount: 178,
    isSponsored: false,
    description: 'جلسات إرشاد أسري للأم والأب حول تنظيم النوم، التغذية، والتعامل مع العناد والغيرة.',
    descriptionEn: '1-on-1 family counseling for sleep routines, picky eating, tantrums, and sibling harmony.',
    emoji: '👩‍⚕️',
    ageStage: 'all',
    collectionTag: 'recommended',
    variants: ['جلسة فيديو 45 دقيقة (للأم والأب)', 'باقة متابعة 3 جلسات'],
    specificationsAr: ['سرية تامة وخصوصية للأسرة', 'خطة تربوية مكتوبة قابلة للتطبيق في الروتين اليومي', 'دعم متواصل للأم والأب'],
    specificationsEn: ['Strict family confidentiality', 'Written actionable routine plan', 'Joint Mother & Father guidance'],
    sellerName: 'وحدة الإرشاد الأسري والنفسي',
    deliveryEstimateAr: 'متاح الحجز المسائي والصباحي',
    deliveryEstimateEn: 'Morning & evening slots available',
  },
  {
    id: 207,
    name: 'خدمة التوصيل السريع لاحتياجات ومستلزمات الأسرة',
    nameEn: 'Family Essentials Express Delivery Service',
    kind: 'service',
    category: 'delivery',
    categoryLabel: 'خدمات التوصيل',
    country: 'SA',
    city: 'الرياض / جدة / الدمام / القاهرة',
    priceEGP: 45,
    priceSAR: 18,
    rating: '4.7',
    reviewCount: 64,
    isSponsored: true,
    partnerBrand: 'شريك لوجستي (توضيحي)',
    description: 'توصيل مستلزمات الطفل والصيدلية والأغذية الصحية للأسرة (نموذج تجريبي غير متصل بدفع فعلي).',
    descriptionEn: 'Express delivery for pharmacy, baby care, and healthy family groceries (simulated demo).',
    emoji: '🚚',
    ageStage: 'all',
    collectionTag: 'deal',
    variants: ['توصيل فوري (60 دقيقة)', 'توصيل مجدول حسب روتين الأسرة'],
    specificationsAr: ['تتبع الطلب لحظة بلحظة', 'حفظ مبرد للأغذية والأدوية الحساسة'],
    specificationsEn: ['Real-time order tracking', 'Temperature-controlled transport'],
    sellerName: 'شريك التوصيل السريع للأسرة',
    deliveryEstimateAr: 'خلال 60 دقيقة داخل المدن الرئيسية',
    deliveryEstimateEn: 'Within 60 mins in major cities',
  },
  {
    id: 208,
    name: 'مختبر العلوم والفضاء ثلاثي الأبعاد للمبتكر الصغير (5–8 سنوات)',
    nameEn: '3D Space & Science STEM Kit for Young Explorers (5–8 Yrs)',
    kind: 'product',
    category: 'toys',
    categoryLabel: 'ألعاب',
    country: 'ALL',
    city: 'القاهرة / الرياض',
    priceEGP: 580,
    priceSAR: 135,
    originalPriceEGP: 720,
    originalPriceSAR: 165,
    rating: '4.9',
    reviewCount: 112,
    isSponsored: false,
    description: 'مجسمات كواكب ثلاثية الأبعاد وتجارب علمية آمنة تثير فضول الطفل وتنمي التفكير العلمي.',
    descriptionEn: '3D planet models and safe STEM experiments that spark curiosity and scientific thinking.',
    emoji: '🚀',
    ageStage: '5-8',
    collectionTag: 'new',
    variants: ['إصدار المجموعة الشمسية 3D', 'إصدار التجارب المغناطيسية والضوء'],
    specificationsAr: ['12 تجربة علمية آمنة بالمنزل', 'مجسمات كواكب مضيئة ثلاثية الأبعاد', 'مناسب للعب التشاركي مع الأب والأم'],
    specificationsEn: ['12 safe home STEM experiments', 'Glow-in-the-dark 3D planetary models', 'Designed for parent-child co-play'],
    sellerName: 'أكاديمية المبتكر الصغير STEM',
    deliveryEstimateAr: 'توصيل خلال 24–48 ساعة',
    deliveryEstimateEn: 'Delivery within 24–48 hours',
  },
];

export function getDefaultPermissions(isCoreParent: boolean): GranularPermissions {
  if (isCoreParent) {
    return {
      profile: true,
      routine: true,
      calendar: true,
      wishes: true,
      growth: true,
      health: true,
      privatePhotos: true,
      receiveReminders: true,
      submitCareUpdates: true,
      emergencyAccess: true,
      viewEducational: true,
      uploadReports: true,
    };
  }
  return {
    profile: true,
    routine: true,
    calendar: true,
    wishes: true,
    growth: false,
    health: false,
    privatePhotos: false,
    receiveReminders: true,
    submitCareUpdates: false,
    emergencyAccess: false,
    viewEducational: true,
    uploadReports: false,
  };
}

export function validatePhoneForCountry(
  phoneRaw: string,
  country: CountryCode
): { valid: boolean; normalized: string; fullInternational: string; errorAr?: string; errorEn?: string } {
  const digits = (phoneRaw || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '');

  if (country === 'EG') {
    const cleaned = digits.startsWith('20') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits;
    if (!/^1[0125]\d{8}$/.test(cleaned)) {
      return {
        valid: false,
        normalized: cleaned,
        fullInternational: `+20${cleaned}`,
        errorAr: 'أدخل رقم هاتف مصري صحيح مكون من 10 أرقام بعد الكود (+20 10/11/12/15)',
        errorEn: 'Enter a valid 10-digit Egyptian mobile number after +20 (e.g. 1012345678)',
      };
    }
    return { valid: true, normalized: cleaned, fullInternational: `+20 ${cleaned}` };
  }

  // SA (+966)
  const cleanedSA = digits.startsWith('966') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  if (!/^5\d{8}$/.test(cleanedSA)) {
    return {
      valid: false,
      normalized: cleanedSA,
      fullInternational: `+966${cleanedSA}`,
      errorAr: 'أدخل رقم جوال سعودي صحيح يبدأ بـ 5 ومكون من 9 أرقام بعد الكود (+966 5XXXXXXXX)',
      errorEn: 'Enter a valid 9-digit Saudi mobile number starting with 5 after +966',
    };
  }
  return { valid: true, normalized: cleanedSA, fullInternational: `+966 ${cleanedSA}` };
}

export function normalizeAppData(raw: unknown): FamilySpaceState {
  const base: FamilySpaceState = structuredClone(DEFAULT_SEED);
  if (!raw || typeof raw !== 'object') {
    return base;
  }
  const input = raw as Record<string, unknown>;

  if (input.role === 'mom' || input.role === 'dad' || input.role === 'high-contrast') {
    base.role = input.role;
  }
  if (typeof input.parentName === 'string' && input.parentName.trim()) {
    base.parentName = input.parentName.trim().slice(0, 80);
  }
  if (input.country === 'EG' || input.country === 'SA') {
    base.country = input.country;
    base.city = input.country === 'SA' ? 'الرياض' : 'القاهرة';
  }
  if (typeof input.city === 'string' && input.city.trim()) {
    base.city = input.city.trim();
  }
  if (input.language === 'ar' || input.language === 'en') {
    base.language = input.language;
  }
  if (input.currency === 'EGP' || input.currency === 'SAR') {
    base.currency = input.currency;
  }
  if (input.calendarMode === 'both' || input.calendarMode === 'gregorian' || input.calendarMode === 'hijri') {
    base.calendarMode = input.calendarMode;
  }
  if (typeof input.disputeFreezeActive === 'boolean') {
    base.disputeFreezeActive = input.disputeFreezeActive;
  }
  if (typeof input.darkMode === 'boolean') {
    base.darkMode = input.darkMode;
  }
  if (Array.isArray(input.savedMediaIds)) {
    base.savedMediaIds = input.savedMediaIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));
  }

  if (input.activeParentAccount === 'mother' || input.activeParentAccount === 'father') {
    base.activeParentAccount = input.activeParentAccount;
  }

  if (input.parentAccounts && typeof input.parentAccounts === 'object') {
    const pa = input.parentAccounts as Record<string, unknown>;
    if (pa.mother && typeof pa.mother === 'object') {
      base.parentAccounts.mother = {
        ...base.parentAccounts.mother,
        ...(pa.mother as Partial<ParentAccountProfile>),
        notificationPrefs: {
          ...base.parentAccounts.mother.notificationPrefs,
          ...((pa.mother as ParentAccountProfile).notificationPrefs || {}),
        },
      };
    }
    if (pa.father && typeof pa.father === 'object') {
      base.parentAccounts.father = {
        ...base.parentAccounts.father,
        ...(pa.father as Partial<ParentAccountProfile>),
        notificationPrefs: {
          ...base.parentAccounts.father.notificationPrefs,
          ...((pa.father as ParentAccountProfile).notificationPrefs || {}),
        },
      };
    }
  }

  const validThemes = new Set<AvatarAccessoryTheme>([
    'astronaut',
    'artist',
    'scientist',
    'athlete',
    'reader',
    'nature',
  ]);

  if (Array.isArray(input.kids)) {
    base.kids = input.kids
      .filter((k): k is Record<string, unknown> => Boolean(k && typeof k === 'object'))
      .map((k, idx) => {
        const gender = k.gender === 'girl' ? 'girl' : 'boy';
        const rawTheme = k.avatarTheme as AvatarAccessoryTheme;
        return {
          id: Number.isFinite(Number(k.id)) ? Number(k.id) : idx + 1,
          name: String(k.name ?? '').trim() || `طفل ${idx + 1}`,
          gender,
          birth: typeof k.birth === 'string' ? k.birth : '',
          interests: typeof k.interests === 'string' ? k.interests : '',
          emoji: typeof k.emoji === 'string' && k.emoji ? k.emoji : gender === 'girl' ? '👧🏻' : '👦🏻',
          bloodType: typeof k.bloodType === 'string' ? k.bloodType : undefined,
          vaccinationsNote: typeof k.vaccinationsNote === 'string' ? k.vaccinationsNote : undefined,
          healthNotePrivate: typeof k.healthNotePrivate === 'string' ? k.healthNotePrivate : undefined,
          growthHeightCm: Number.isFinite(Number(k.growthHeightCm)) ? Number(k.growthHeightCm) : undefined,
          growthWeightKg: Number.isFinite(Number(k.growthWeightKg)) ? Number(k.growthWeightKg) : undefined,
          avatarTheme: validThemes.has(rawTheme) ? rawTheme : gender === 'girl' ? 'artist' : 'astronaut',
          photoDataUrl: typeof k.photoDataUrl === 'string' && k.photoDataUrl ? k.photoDataUrl : undefined,
          useIllustratedAvatar: typeof k.useIllustratedAvatar === 'boolean' ? k.useIllustratedAvatar : true,
        };
      });
  }

  const validKidIds = new Set(base.kids.map((k) => Number(k.id)));

  if (Array.isArray(input.tasks)) {
    base.tasks = input.tasks
      .filter((t): t is Record<string, unknown> => Boolean(t && typeof t === 'object'))
      .map((t, idx) => {
        const rawKid = t.kidId ? Number(t.kidId) : null;
        const cadence: TaskCadence =
          t.cadence === 'weekly' || t.cadence === 'monthly' ? t.cadence : 'daily';
        return {
          id: Number.isFinite(Number(t.id)) ? Number(t.id) : idx + 1,
          name: String(t.name ?? '').trim() || `مهمة ${idx + 1}`,
          time: typeof t.time === 'string' ? t.time : '',
          done: Boolean(t.done),
          kidId: rawKid && validKidIds.has(rawKid) ? rawKid : null,
          category: typeof t.category === 'string' && t.category ? t.category : 'روتين عام',
          owner: typeof t.owner === 'string' && t.owner ? t.owner : 'مشترك',
          cadence,
        };
      });
  }

  if (Array.isArray(input.events)) {
    base.events = input.events
      .filter((e): e is Record<string, unknown> => Boolean(e && typeof e === 'object'))
      .map((e, idx) => {
        const rawChild = e.childId ? Number(e.childId) : null;
        const repeat =
          e.repeat === 'weekly' || e.repeat === 'monthly' || e.repeat === 'yearly'
            ? e.repeat
            : 'none';
        return {
          id: Number.isFinite(Number(e.id)) ? Number(e.id) : idx + 1,
          title: String(e.title ?? '').trim() || `حدث ${idx + 1}`,
          date: typeof e.date === 'string' && e.date ? e.date : dateLocalISO(new Date()),
          time: typeof e.time === 'string' ? e.time : '',
          type: typeof e.type === 'string' && e.type ? e.type : 'موعد عائلي',
          childId: rawChild && validKidIds.has(rawChild) ? rawChild : null,
          repeat,
          note: typeof e.note === 'string' ? e.note : '',
          createdAt: typeof e.createdAt === 'string' ? e.createdAt : new Date().toISOString(),
        };
      });
  }

  if (Array.isArray(input.wishes)) {
    base.wishes = input.wishes
      .filter((w): w is Record<string, unknown> => Boolean(w && typeof w === 'object'))
      .map((w, idx) => {
        const rawKid = Number(w.kid);
        const progressRaw = Number(w.progress);
        const progress = Number.isFinite(progressRaw)
          ? Math.max(0, Math.min(100, Math.round(progressRaw)))
          : Boolean(w.reserved)
          ? 100
          : 50;
        return {
          id: Number.isFinite(Number(w.id)) ? Number(w.id) : idx + 1,
          name: String(w.name ?? '').trim() || `أمنية ${idx + 1}`,
          kid: validKidIds.has(rawKid) ? rawKid : 0,
          price: Number.isFinite(Number(w.price)) && Number(w.price) >= 0 ? Number(w.price) : 0,
          currency: w.currency === 'SAR' ? 'SAR' : 'EGP',
          emoji: typeof w.emoji === 'string' && w.emoji ? w.emoji : '🎁',
          reserved: Boolean(w.reserved),
          progress,
          goalType: typeof w.goalType === 'string' ? w.goalType : 'أمنية طفل',
        };
      });
  }

  if (Array.isArray(input.family)) {
    base.family = input.family
      .filter((f): f is Record<string, unknown> => Boolean(f && typeof f === 'object'))
      .map((f, idx) => {
        const roleStr = typeof f.role === 'string' && f.role ? f.role : 'فرد آخر';
        const isCore = roleStr === 'الأب' || roleStr === 'الأم';
        const rawPerms =
          f.permissions && typeof f.permissions === 'object'
            ? (f.permissions as Record<string, unknown>)
            : null;
        const defaults = getDefaultPermissions(isCore);
        const wishesFlag = typeof f.wishes === 'boolean' ? f.wishes : defaults.wishes;
        const eventsFlag = typeof f.events === 'boolean' ? f.events : defaults.calendar;
        const assignedKids = Array.isArray(f.assignedKidIds)
          ? f.assignedKidIds.map((id) => Number(id)).filter((id) => validKidIds.has(id))
          : Array.from(validKidIds);
        return {
          id: Number.isFinite(Number(f.id)) ? Number(f.id) : idx + 1,
          name: String(f.name ?? '').trim() || `فرد ${idx + 1}`,
          role: roleStr,
          side: typeof f.side === 'string' && f.side ? f.side : 'الأسرة الأساسية',
          wishes: wishesFlag,
          events: eventsFlag,
          emoji: typeof f.emoji === 'string' && f.emoji ? f.emoji : '👤',
          roleCategory: (f.roleCategory as ExtendedRoleCategory) || (isCore ? 'father' : 'grandparent'),
          phoneCountry: f.phoneCountry === 'SA' ? 'SA' : 'EG',
          phoneNumber: typeof f.phoneNumber === 'string' ? f.phoneNumber : undefined,
          email: typeof f.email === 'string' ? f.email : undefined,
          assignedKidIds: assignedKids,
          accessExpiresAt: typeof f.accessExpiresAt === 'string' ? f.accessExpiresAt : undefined,
          permissions: {
            profile: typeof rawPerms?.profile === 'boolean' ? rawPerms.profile : defaults.profile,
            routine: typeof rawPerms?.routine === 'boolean' ? rawPerms.routine : defaults.routine,
            calendar: typeof rawPerms?.calendar === 'boolean' ? rawPerms.calendar : eventsFlag,
            wishes: typeof rawPerms?.wishes === 'boolean' ? rawPerms.wishes : wishesFlag,
            growth: typeof rawPerms?.growth === 'boolean' ? rawPerms.growth : defaults.growth,
            // Least-privilege enforcement: if disputeFreezeActive is true, sensitive categories are locked
            health: base.disputeFreezeActive
              ? false
              : typeof rawPerms?.health === 'boolean'
              ? rawPerms.health
              : false,
            privatePhotos: base.disputeFreezeActive
              ? false
              : typeof rawPerms?.privatePhotos === 'boolean'
              ? rawPerms.privatePhotos
              : false,
            receiveReminders:
              typeof rawPerms?.receiveReminders === 'boolean'
                ? rawPerms.receiveReminders
                : defaults.receiveReminders,
            submitCareUpdates:
              typeof rawPerms?.submitCareUpdates === 'boolean'
                ? rawPerms.submitCareUpdates
                : defaults.submitCareUpdates,
            emergencyAccess:
              typeof rawPerms?.emergencyAccess === 'boolean'
                ? rawPerms.emergencyAccess
                : defaults.emergencyAccess,
            viewEducational:
              typeof rawPerms?.viewEducational === 'boolean'
                ? rawPerms.viewEducational
                : defaults.viewEducational,
            uploadReports:
              typeof rawPerms?.uploadReports === 'boolean'
                ? rawPerms.uploadReports
                : defaults.uploadReports,
          },
        };
      });
  }

  if (Array.isArray(input.invitations)) {
    base.invitations = input.invitations
      .filter((inv): inv is Record<string, unknown> => Boolean(inv && typeof inv === 'object'))
      .map((inv, idx) => {
        const assigned = Array.isArray(inv.assignedKidIds)
          ? inv.assignedKidIds.map((id) => Number(id)).filter((id) => validKidIds.has(id))
          : [];
        const status =
          inv.status === 'accepted' ||
          inv.status === 'expired' ||
          inv.status === 'cancelled' ||
          inv.status === 'revoked'
            ? inv.status
            : 'pending';
        return {
          id: Number.isFinite(Number(inv.id)) ? Number(inv.id) : 500 + idx + 1,
          recipientName: String(inv.recipientName ?? '').trim() || `مدعو ${idx + 1}`,
          roleLabel: String(inv.roleLabel ?? 'مقدم رعاية'),
          roleCategory: (inv.roleCategory as ExtendedRoleCategory) || 'nursery',
          side: String(inv.side ?? 'الحضانة والمدرسة'),
          phoneCountry: inv.phoneCountry === 'SA' ? 'SA' : 'EG',
          phoneNumber: String(inv.phoneNumber ?? ''),
          email: typeof inv.email === 'string' ? inv.email : undefined,
          assignedKidIds: assigned,
          permissions: {
            ...getDefaultPermissions(false),
            ...((inv.permissions as Partial<GranularPermissions>) || {}),
          },
          status,
          createdAt: typeof inv.createdAt === 'string' ? inv.createdAt : new Date().toISOString(),
          expiresAt: typeof inv.expiresAt === 'string' ? inv.expiresAt : '2026-12-31',
          invitedByParent: inv.invitedByParent === 'father' ? 'father' : 'mother',
        };
      });
  }

  if (Array.isArray(input.cart)) {
    base.cart = input.cart
      .filter((c): c is Record<string, unknown> => Boolean(c && typeof c === 'object'))
      .map((c) => ({
        productId: Number(c.productId) || 201,
        quantity: Math.max(1, Math.min(20, Number(c.quantity) || 1)),
        selectedVariant: typeof c.selectedVariant === 'string' ? c.selectedVariant : undefined,
      }));
  }

  if (Array.isArray(input.readNotificationIds)) {
    base.readNotificationIds = input.readNotificationIds.map((id) => String(id));
  }

  if (Array.isArray(input.orders)) {
    base.orders = input.orders as DemoOrder[];
  }

  return base;
}

export function dateLocalISO(dte: Date = new Date()): string {
  const y = dte.getFullYear();
  const m = String(dte.getMonth() + 1).padStart(2, '0');
  const day = String(dte.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface ChildAgeInfo {
  label: string;
  months: number;
  years: number;
  stageCode: '0-2' | '2-5' | '5-8';
  stageTitle: string;
  milestoneTip: string;
}

export function calculateChildAge(
  birth: string,
  lang: LanguageCode = 'ar',
  refDate: Date = new Date()
): ChildAgeInfo {
  if (!birth) {
    return {
      label: lang === 'en' ? 'Age not set' : 'العمر غير محدد',
      months: 0,
      years: 0,
      stageCode: '0-2',
      stageTitle: lang === 'en' ? 'Early Years (0–8 yrs)' : 'مرحلة الطفولة المبكرة',
      milestoneTip:
        lang === 'en'
          ? 'Add birth date to unlock tailored developmental milestones from day 1 to 8 years.'
          : 'أضف تاريخ الميلاد لعرض إرشادات النمو والتطور المخصصة لعمر طفلك من أول يوم لحد 8 سنين.',
    };
  }
  const birthDate = new Date(birth + 'T12:00:00');
  if (Number.isNaN(birthDate.getTime())) {
    return {
      label: lang === 'en' ? 'Age not set' : 'العمر غير محدد',
      months: 0,
      years: 0,
      stageCode: '0-2',
      stageTitle: 'مرحلة الطفولة',
      milestoneTip: 'تأكد من صحة تاريخ الميلاد.',
    };
  }

  let months =
    (refDate.getFullYear() - birthDate.getFullYear()) * 12 +
    (refDate.getMonth() - birthDate.getMonth());
  if (refDate.getDate() < birthDate.getDate()) {
    months--;
  }
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);

  let label = '';
  if (lang === 'en') {
    label = months < 24 ? `${months} mo` : `${years} yrs`;
  } else {
    label = months < 24 ? `${months} شهر` : `${years} سنوات`;
  }

  if (months < 24) {
    return {
      label,
      months,
      years,
      stageCode: '0-2',
      stageTitle: lang === 'en' ? 'Stage 1: Discovery & Bonding (0–2 yrs)' : 'المرحلة الأولى: الترابط والاكتشاف الحسي (0–2 سنة)',
      milestoneTip:
        lang === 'en'
          ? 'Focus on sensory play, consistent sleep cues, responsive talking, and routine vaccinations.'
          : 'التركيز في هذه المرحلة على الأمان العاطفي، تنظيم النوم، التحدث المستمر مع الطفل، ومتابعة التطعيمات الأساسية.',
    };
  }
  if (years < 5) {
    return {
      label,
      months,
      years,
      stageCode: '2-5',
      stageTitle: lang === 'en' ? 'Stage 2: Language & Independence (2–5 yrs)' : 'المرحلة الثانية: بناء اللغة والاستقلالية (2–5 سنوات)',
      milestoneTip:
        lang === 'en'
          ? 'Encourage imaginative play, naming feelings, daily storytime, and simple self-care habits.'
          : 'شجّعوا اللعب التخيلي، تسمية المشاعر بهدوء، قراءة قصة يومية، ومشاركة الطفل في مهام بسيطة كترتيب ألعابه.',
    };
  }
  return {
    label,
    months,
    years,
    stageCode: '5-8',
    stageTitle: lang === 'en' ? 'Stage 3: School Readiness & Logic (5–8 yrs)' : 'المرحلة الثالثة: الاستعداد المدرسي والتفكير المنطقي (5–8 سنوات)',
    milestoneTip:
      lang === 'en'
        ? 'Support logical puzzles, team sports, reading habits, and structured daily routines.'
        : 'دعم مهارات حل المشكلات، الرياضة الجماعية، القراءة المستقلة، وبناء المسؤولية وتنظيم الوقت.',
  };
}

export function getSuggestedCurrencyForCountry(country: CountryCode): CurrencyCode {
  return country === 'SA' ? 'SAR' : 'EGP';
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  lang: LanguageCode = 'ar'
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const locale = lang === 'en' ? 'en-US' : currency === 'SAR' ? 'ar-SA' : 'ar-EG';
  const formattedNum = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(safeAmount);
  if (lang === 'en') {
    return `${formattedNum} ${currency}`;
  }
  return currency === 'SAR' ? `${formattedNum} ر.س` : `${formattedNum} ج.م`;
}

export function formatGregorianAndHijri(
  dateStr: string,
  country: CountryCode = 'EG',
  lang: LanguageCode = 'ar',
  mode: CalendarDisplayMode = 'both'
): { gregorian: string; hijri: string; combined: string } {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  if (Number.isNaN(d.getTime())) {
    return { gregorian: dateStr, hijri: '', combined: dateStr };
  }
  const baseLocale = lang === 'en' ? 'en-US' : country === 'SA' ? 'ar-SA' : 'ar-EG';
  let gregorian = dateStr;
  let hijri = '';
  try {
    gregorian = new Intl.DateTimeFormat(`${baseLocale}-u-ca-gregory`, {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    gregorian = dateStr;
  }

  try {
    const hijriLocale = lang === 'en' ? 'en-SA-u-ca-islamic-umalqura' : 'ar-SA-u-ca-islamic-umalqura';
    hijri = new Intl.DateTimeFormat(hijriLocale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    hijri = '';
  }

  let combined = gregorian;
  if (mode === 'hijri' && hijri) {
    combined = hijri;
  } else if (mode === 'both' && hijri) {
    combined = `${gregorian} · ${hijri}`;
  }
  return { gregorian, hijri, combined };
}

export function getChildDeletionSummary(state: FamilySpaceState, childId: number) {
  const idNum = Number(childId);
  const relatedTasks = state.tasks.filter((t) => Number(t.kidId) === idNum).length;
  const relatedEvents = state.events.filter((e) => Number(e.childId) === idNum).length;
  const relatedWishes = state.wishes.filter((w) => Number(w.kid) === idNum).length;
  return {
    relatedTasks,
    relatedEvents,
    relatedWishes,
    total: relatedTasks + relatedEvents + relatedWishes,
  };
}

export function deleteChildCascade(state: FamilySpaceState, childId: number): FamilySpaceState {
  const idNum = Number(childId);
  return {
    ...state,
    kids: state.kids.filter((k) => Number(k.id) !== idNum),
    tasks: state.tasks.filter((t) => Number(t.kidId) !== idNum),
    events: state.events.filter((e) => Number(e.childId) !== idNum),
    wishes: state.wishes.filter((w) => Number(w.kid) !== idNum),
  };
}

export function getNearestUpcomingEvent(
  events: CalendarEvent[],
  todayISO: string = dateLocalISO(new Date())
): CalendarEvent | null {
  const upcoming = [...events]
    .filter((e) => e.date >= todayISO)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  return upcoming[0] || null;
}

export function validateChildInput(
  input: { name?: string; birth?: string; interests?: string },
  todayISO: string = dateLocalISO(new Date())
): { valid: boolean; error?: string } {
  const trimmedName = (input.name || '').trim();
  if (!trimmedName) {
    return { valid: false, error: 'اكتب اسم الطفل قبل الحفظ' };
  }
  if (trimmedName.length > 80) {
    return { valid: false, error: 'اسم الطفل يجب ألا يتجاوز 80 حرفًا' };
  }
  if (input.birth && input.birth > todayISO) {
    return { valid: false, error: 'تاريخ الميلاد لا يمكن أن يكون في المستقبل' };
  }
  return { valid: true };
}

export function validateWishInput(
  input: { name?: string; price?: number | string; kid?: number | string; progress?: number | string },
  kids: ChildProfile[]
): { valid: boolean; error?: string } {
  const trimmedName = (input.name || '').trim();
  if (!trimmedName) {
    return { valid: false, error: 'اكتب اسم الأمنية قبل الحفظ' };
  }
  const priceNum = Number(input.price);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return { valid: false, error: 'أدخل سعرًا صحيحًا يساوي صفرًا أو أكثر' };
  }
  const kidNum = Number(input.kid);
  if (!kids.some((k) => Number(k.id) === kidNum)) {
    return { valid: false, error: 'اختار ملف طفل صالحًا' };
  }
  if (input.progress !== undefined) {
    const prog = Number(input.progress);
    if (!Number.isFinite(prog) || prog < 0 || prog > 100) {
      return { valid: false, error: 'نسبة الإنجاز يجب أن تكون بين 0 و 100%' };
    }
  }
  return { valid: true };
}

export function validateImportedJson(jsonText: string): {
  valid: boolean;
  data?: FamilySpaceState;
  sessionMeta?: {
    sessionNumber?: number;
    sessionNotes?: string;
    lastUpdatedISO?: string;
    version?: string;
  };
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'ملف JSON غير صالح: يجب أن يحتوي على كائن بيانات الأسرة.' };
    }
    const candidate =
      parsed.appState && typeof parsed.appState === 'object' && !Array.isArray(parsed.appState)
        ? parsed.appState
        : parsed;
    const hasRecognizedKey =
      'kids' in candidate ||
      'tasks' in candidate ||
      'events' in candidate ||
      'wishes' in candidate ||
      'family' in candidate;
    if (!hasRecognizedKey) {
      return { valid: false, error: 'الملف المختار لا يبدو كنسخة احتياطية أو ملف جلسة من مساحة الأسرة.' };
    }
    const normalized = normalizeAppData(candidate);
    const sessionMeta =
      parsed.appState && typeof parsed.appState === 'object'
        ? {
            sessionNumber: typeof parsed.sessionNumber === 'number' ? parsed.sessionNumber : undefined,
            sessionNotes: typeof parsed.sessionNotes === 'string' ? parsed.sessionNotes : undefined,
            lastUpdatedISO: typeof parsed.lastUpdatedISO === 'string' ? parsed.lastUpdatedISO : undefined,
            version: typeof parsed.version === 'string' ? parsed.version : undefined,
          }
        : undefined;
    return { valid: true, data: normalized, sessionMeta };
  } catch {
    return { valid: false, error: 'تعذر قراءة ملف JSON. تأكد من سلامة صيغة الملف.' };
  }
}

export type RoutineReminderStatus =
  | 'overdue'
  | 'approaching'
  | 'scheduled'
  | 'completed'
  | 'unscheduled';

export interface TaskReminderInfo {
  status: RoutineReminderStatus;
  badgeLabel: string;
  detailLabel: string;
  minutesDelta: number | null;
  scheduledMinutes: number | null;
  isAlert: boolean;
}

/**
 * Parses Arabic/English 12-hour or 24-hour time strings (e.g. "07:30 ص", "04:00 م", "16:30", "7:00 PM")
 * into minutes since midnight (0..1439). Returns null if the task has no valid time.
 */
export function parseTaskTimeMinutes(timeStr?: string | null): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const normalized = timeStr
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .trim();
  if (!normalized) return null;

  const match = normalized.match(/(\d{1,2})(?::(\d{1,2}))?\s*(ص|صباحا|صباحًا|صباح|م|مساء|مساءً|am|pm|a\.m\.|p\.m\.)?/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = match[2] !== undefined ? Number(match[2]) : 0;
  const periodRaw = (match[3] || '').toLowerCase();

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  const isPM = periodRaw.startsWith('م') || periodRaw.startsWith('p');
  const isAM = periodRaw.startsWith('ص') || periodRaw.startsWith('a');

  if (isPM || isAM) {
    if (hours < 1 || hours > 12) return null;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
  } else {
    if (hours < 0 || hours > 23) return null;
  }

  return hours * 60 + minutes;
}

export function formatMinutesDifference(absMinutes: number, lang: LanguageCode = 'ar'): string {
  const rounded = Math.max(1, Math.round(absMinutes));
  if (rounded < 60) {
    return lang === 'en' ? `${rounded}m` : `${rounded} دقيقة`;
  }
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (lang === 'en') {
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }
  if (mins === 0) {
    return hrs === 1 ? 'ساعة واحدة' : hrs === 2 ? 'ساعتين' : `${hrs} ساعات`;
  }
  return `${hrs} س و${mins} د`;
}

export function getRoutineTaskReminder(
  task: Pick<RoutineTask, 'time' | 'done'>,
  nowMinutes: number,
  approachingWindowMinutes: number = 90,
  lang: LanguageCode = 'ar'
): TaskReminderInfo {
  const scheduledMinutes = parseTaskTimeMinutes(task.time);

  if (task.done) {
    return {
      status: 'completed',
      badgeLabel: lang === 'en' ? '✅ Completed' : '✅ مكتملة',
      detailLabel: lang === 'en' ? 'Done for today' : 'تم إنجاز المهمة',
      minutesDelta: scheduledMinutes !== null ? scheduledMinutes - nowMinutes : null,
      scheduledMinutes,
      isAlert: false,
    };
  }

  if (scheduledMinutes === null) {
    return {
      status: 'unscheduled',
      badgeLabel: '',
      detailLabel: lang === 'en' ? 'Flexible time' : 'وقت مرن',
      minutesDelta: null,
      scheduledMinutes: null,
      isAlert: false,
    };
  }

  const delta = scheduledMinutes - nowMinutes;

  if (delta < 0) {
    const diffText = formatMinutesDifference(Math.abs(delta), lang);
    return {
      status: 'overdue',
      badgeLabel: lang === 'en' ? '⏰ Overdue' : '⏰ تجاوز الموعد',
      detailLabel: lang === 'en' ? `Overdue by ${diffText}` : `مضى على موعدها ${diffText}`,
      minutesDelta: delta,
      scheduledMinutes,
      isAlert: true,
    };
  }

  if (delta <= approachingWindowMinutes) {
    const diffText = delta === 0 ? (lang === 'en' ? 'Due now' : 'حان الموعد الآن') : formatMinutesDifference(delta, lang);
    return {
      status: 'approaching',
      badgeLabel: lang === 'en' ? '🔔 Approaching' : '🔔 اقترب الموعد',
      detailLabel:
        delta === 0
          ? diffText
          : lang === 'en'
          ? `In ${diffText}`
          : `متبقي ${diffText}`,
      minutesDelta: delta,
      scheduledMinutes,
      isAlert: true,
    };
  }

  const diffText = formatMinutesDifference(delta, lang);
  return {
    status: 'scheduled',
    badgeLabel: lang === 'en' ? '⏳ Upcoming' : '⏳ في الموعد',
    detailLabel: lang === 'en' ? `In ${diffText}` : `بعد ${diffText}`,
    minutesDelta: delta,
    scheduledMinutes,
    isAlert: false,
  };
}

export function getRoutineRemindersSummary(
  tasks: RoutineTask[],
  nowMinutes: number,
  approachingWindowMinutes: number = 90,
  lang: LanguageCode = 'ar'
) {
  let overdueCount = 0;
  let approachingCount = 0;
  const enriched = tasks.map((task) => {
    const reminder = getRoutineTaskReminder(task, nowMinutes, approachingWindowMinutes, lang);
    if (reminder.status === 'overdue') overdueCount++;
    if (reminder.status === 'approaching') approachingCount++;
    return { task, reminder };
  });

  return {
    overdueCount,
    approachingCount,
    totalAlerts: overdueCount + approachingCount,
    enriched,
  };
}

/**
 * Generates the 3 Daily Parenting Notifications per parent (Morning, Midday, Evening)
 * plus a permanent Security/Account notification when phone/email verification or invitations change.
 */
export function generateThreeDailyNotifications(
  state: FamilySpaceState,
  parentId: 'mother' | 'father' = state.activeParentAccount
): DailyParentingNotification[] {
  const parentProfile = state.parentAccounts[parentId];
  const prefs = parentProfile.notificationPrefs;
  const primaryKid = state.kids[0];
  const secondaryKid = state.kids[1] || primaryKid;
  const primaryAge = primaryKid ? calculateChildAge(primaryKid.birth, state.language) : null;
  const secondaryAge = secondaryKid ? calculateChildAge(secondaryKid.birth, state.language) : null;

  const isMother = parentId === 'mother';
  const parentTitleAr = isMother ? 'لأمّنا الغالية' : 'لأبينا الغالي';
  const parentTitleEn = isMother ? 'For Mom' : 'For Dad';

  const items: DailyParentingNotification[] = [];

  if (prefs.enabled && prefs.morningEnabled) {
    items.push({
      id: `notif-${parentId}-morning`,
      slot: 'morning',
      parentTarget: parentId,
      scheduledTime: prefs.morningTime || '08:30',
      categoryLabelAr: 'إشعار الصباح (١/٣) · همسة اليوم وتنظيم الروتين',
      categoryLabelEn: 'Morning Notification (1/3) · Daily Tip & Routine',
      titleAr: `${parentTitleAr}: بداية يوم هادئة مع ${primaryKid ? primaryKid.name : 'أطفالك'}`,
      titleEn: `${parentTitleEn}: Calm Morning Start with ${primaryKid ? primaryKid.name : 'Your Kids'}`,
      bodyAr: isMother
        ? `صباح الخير يا ${parentProfile.fullName.split(' ')[0]} 🌸 تذكير لطيف: مشاركة الطفل في اختيار فاكهة الإفطار ترفع حماسه لبداية اليوم وتقلل عناد الصباح.`
        : `صباح النشاط يا ${parentProfile.fullName.split(' ')[0]} ☀️ دقيقة واحدة من التشجيع الصباحي والابتسامة قبل الخروج تمنح ${primaryKid ? primaryKid.name : 'طفلك'} ثقة طوال اليوم.`,
      bodyEn: isMother
        ? `Good morning! Let ${primaryKid ? primaryKid.name : 'your child'} pick a morning fruit to boost independence and reduce morning resistance.`
        : `Good morning! One minute of warm encouragement before heading out gives ${primaryKid ? primaryKid.name : 'your child'} lasting confidence today.`,
      childName: primaryKid?.name,
      ageStage: primaryAge?.stageCode || '2-5',
      read: state.readNotificationIds.includes(`notif-${parentId}-morning`),
    });
  }

  if (prefs.enabled && prefs.middayEnabled) {
    items.push({
      id: `notif-${parentId}-midday`,
      slot: 'midday',
      parentTarget: parentId,
      scheduledTime: prefs.middayTime || '14:00',
      categoryLabelAr: 'إشعار منتصف اليوم (٢/٣) · النمو والتغذية والنشاط',
      categoryLabelEn: 'Midday Notification (2/3) · Growth, Nutrition & Play',
      titleAr: `نشاط الظهيرة وتطوير مهارات ${secondaryKid ? secondaryKid.name : 'الطفل'} (${secondaryAge?.label || '2–5 سنوات'})`,
      titleEn: `Midday Skill & Nutrition Boost for ${secondaryKid ? secondaryKid.name : 'Your Child'}`,
      bodyAr: `في مرحلة (${secondaryAge?.stageCode || '2-5'} سنوات): تقديم كوب ماء وفواكه ملونة بعد العودة من الحضانة مع 10 دقائق من لعبة الذاكرة ثلاثية الأبعاد يجدد طاقة الدماغ بدون شاشات سلبية.`,
      bodyEn: `For stage (${secondaryAge?.stageCode || '2-5'} yrs): Hydration, colorful fruit snacks, and 10 minutes of 3D Memory Match refresh focus without passive screen time.`,
      childName: secondaryKid?.name,
      ageStage: secondaryAge?.stageCode || '2-5',
      read: state.readNotificationIds.includes(`notif-${parentId}-midday`),
    });
  }

  if (prefs.enabled && prefs.eveningEnabled) {
    items.push({
      id: `notif-${parentId}-evening`,
      slot: 'evening',
      parentTarget: parentId,
      scheduledTime: prefs.eveningTime || '20:30',
      categoryLabelAr: 'إشعار المساء (٣/٣) · روتين النوم والتواصل العاطفي',
      categoryLabelEn: 'Evening Notification (3/3) · Bedtime & Emotional Check-in',
      titleAr: `${parentTitleAr}: طقس الهدوء المسائي وقصة قبل النوم`,
      titleEn: `${parentTitleEn}: Evening Wind-Down & Bedtime Story`,
      bodyAr: isMother
        ? `خفض الإضاءة الآن وتشغيل تهويدة «رحلة القمر الصغير» الصوتية يساعد على تهدئة الجهاز العصبي للطفل؛ وتذكري أنكِ قدمتِ يومًا رائعًا لأسرتك 💛.`
        : `وقت رائع لمهمة الأب المسائية: قراءة قصة قصيرة أو سؤال ${primaryKid ? primaryKid.name : 'طفلك'} «إيه أكتر حاجة فرحتك النهاردة؟» قبل النوم المريح 🌙.`,
      bodyEn: isMother
        ? `Dimming lights and playing the 'Little Moon Journey' audio lullaby calms your child's nervous system. You did a wonderful job today!`
        : `Great time for Dad's evening ritual: Read a short story or ask ${primaryKid ? primaryKid.name : 'your child'} 'What made you smile most today?' before sleep.`,
      childName: primaryKid?.name,
      ageStage: primaryAge?.stageCode || '2-5',
      read: state.readNotificationIds.includes(`notif-${parentId}-evening`),
    });
  }

  // Mandatory account/safety notification (always active even if optional parenting notifications are paused)
  items.push({
    id: `notif-${parentId}-security`,
    slot: 'security',
    parentTarget: 'both',
    scheduledTime: 'دائم · أمان الحساب',
    categoryLabelAr: 'تنبيه أمان الحساب والصلاحيات (نشط دائمًا)',
    categoryLabelEn: 'Account & Family Safety Alert (Always Active)',
    titleAr: 'حماية الحساب وصلاحيات الأطفال مفعّلة',
    titleEn: 'Account Security & Child Access Controls Active',
    bodyAr: `هاتف الحساب (${parentProfile.phoneCode} ${parentProfile.phoneNumber}) ${parentProfile.phoneVerified ? 'موثّق ✅' : 'بانتظار التحقق'}. تظل إشعارات الأمان وتغييرات الصلاحيات نشطة حتى أثناء ساعات الهدوء (${prefs.quietHoursStart} – ${prefs.quietHoursEnd}).`,
    bodyEn: `Account phone (${parentProfile.phoneCode} ${parentProfile.phoneNumber}) is ${parentProfile.phoneVerified ? 'verified ✅' : 'pending verification'}. Security and permission alerts stay active even during Quiet Hours (${prefs.quietHoursStart} – ${prefs.quietHoursEnd}).`,
    read: state.readNotificationIds.includes(`notif-${parentId}-security`),
  });

  return items;
}

export function getPaymentMethodLabels(method: CheckoutPaymentMethodType): {
  category: 'electronic' | 'cod';
  labelAr: string;
  labelEn: string;
  badgeIcon: string;
} {
  switch (method) {
    case 'apple_pay':
      return {
        category: 'electronic',
        labelAr: 'الدفع الإلكتروني — Apple Pay',
        labelEn: 'Electronic Payment — Apple Pay',
        badgeIcon: '',
      };
    case 'google_pay':
      return {
        category: 'electronic',
        labelAr: 'الدفع الإلكتروني — Google Pay',
        labelEn: 'Electronic Payment — Google Pay',
        badgeIcon: 'G',
      };
    case 'cod':
      return {
        category: 'cod',
        labelAr: 'الدفع عند الاستلام (Cash on Delivery)',
        labelEn: 'Cash on Delivery (COD)',
        badgeIcon: '💵',
      };
    case 'electronic_card':
    default:
      return {
        category: 'electronic',
        labelAr: 'الدفع الإلكتروني — بطاقة ائتمان / خصم مباشر',
        labelEn: 'Electronic Payment — Credit / Debit Card',
        badgeIcon: '💳',
      };
  }
}

export function calculateCheckoutSummary(
  cart: CartItem[],
  currency: CurrencyCode,
  paymentMethod: CheckoutPaymentMethodType
): {
  subtotal: number;
  deliveryFee: number;
  codFee: number;
  grandTotal: number;
  itemCount: number;
} {
  let subtotal = 0;
  let itemCount = 0;
  for (const ci of cart) {
    const prod = COMMERCIAL_CATALOG.find((p) => p.id === ci.productId);
    if (!prod) continue;
    const unitPrice = currency === 'SAR' ? prod.priceSAR : prod.priceEGP;
    subtotal += unitPrice * ci.quantity;
    itemCount += ci.quantity;
  }
  const deliveryFee = itemCount > 0 ? (currency === 'SAR' ? 15 : 45) : 0;
  const codFee = itemCount > 0 && paymentMethod === 'cod' ? (currency === 'SAR' ? 5 : 15) : 0;
  return {
    subtotal,
    deliveryFee,
    codFee,
    grandTotal: subtotal + deliveryFee + codFee,
    itemCount,
  };
}

export interface DigitalContactChannel {
  supportEmail: string;
  careEmail: string;
  hotlineShort: string;
  customerServicePhonePrimary: string;
  customerServicePhoneSecondary: string;
  workingHoursAr: string;
  workingHoursEn: string;
  socialChannels: {
    id: string;
    nameAr: string;
    nameEn: string;
    handle: string;
    icon: string;
    tone: string;
  }[];
}

/**
 * Strictly Digital Contact Configuration — Zero Physical Address, Zero Map, Zero Location Details.
 */
export const STRICTLY_DIGITAL_CONTACT_CONFIG: DigitalContactChannel = {
  supportEmail: 'support@familyspace.app',
  careEmail: 'care@familyspace.app',
  hotlineShort: '19988',
  customerServicePhonePrimary: '+20 100 880 9900',
  customerServicePhoneSecondary: '+966 800 124 9900',
  workingHoursAr: 'دعم رقمي متواصل 24/7 عبر البريد والهاتف والقنوات الرسمية',
  workingHoursEn: '24/7 Digital Customer Care via Email, Phone & Social Channels',
  socialChannels: [
    {
      id: 'whatsapp',
      nameAr: 'واتساب خدمة العملاء',
      nameEn: 'WhatsApp Care',
      handle: '@FamilySpaceCare',
      icon: '💬',
      tone: 'emerald',
    },
    {
      id: 'instagram',
      nameAr: 'إنستغرام',
      nameEn: 'Instagram',
      handle: '@familyspace.official',
      icon: '📸',
      tone: 'rose',
    },
    {
      id: 'x_twitter',
      nameAr: 'منصة X (تويتر)',
      nameEn: 'X (Twitter)',
      handle: '@FamilySpaceApp',
      icon: '𝕏',
      tone: 'sky',
    },
    {
      id: 'facebook',
      nameAr: 'فيسبوك',
      nameEn: 'Facebook',
      handle: '/FamilySpaceCommunity',
      icon: '📘',
      tone: 'indigo',
    },
    {
      id: 'youtube',
      nameAr: 'يوتيوب العائلة',
      nameEn: 'YouTube Channels',
      handle: '@FamilySpaceTV',
      icon: '▶️',
      tone: 'amber',
    },
    {
      id: 'tiktok',
      nameAr: 'تيك توك تربوي',
      nameEn: 'Educational TikTok',
      handle: '@familyspace.reels',
      icon: '🎵',
      tone: 'purple',
    },
  ],
};

export const DARK_MODE_PALETTE_TOKENS = {
  pageBackground: '#131926',
  surfaceBackground: '#1b2334',
  elevatedControlBackground: '#243047',
  textPrimary: '#f1f5f9',
  textMuted: '#94a3b8',
  borderSubtle: '#2b3852',
} as const;

export function resolveColorMode(darkMode?: boolean): 'light' | 'dark' {
  return darkMode === true ? 'dark' : 'light';
}

export const SKELETON_TABS = ['services', 'medical', 'community'] as const;
export type SkeletonTabId = (typeof SKELETON_TABS)[number];
export const SKELETON_LOAD_DURATION_MS = 1100;

export function shouldTriggerSkeletonForTab(pageId: string): pageId is SkeletonTabId {
  return (SKELETON_TABS as readonly string[]).includes(pageId);
}

export function getEmptyStateCopy(
  section: 'cart' | 'notifications' | 'chat' | 'chats' | 'community' | 'search',
  lang: LanguageCode = 'ar'
): { title: string; subtitle: string; ctaLabel: string; actionLabel: string } {
  const isEn = lang === 'en';
  switch (section) {
    case 'cart': {
      const ctaLabel = isEn ? 'Browse Store Catalog' : 'تصفح منتجات المتجر';
      return {
        title: isEn ? 'No items here yet — Your Cart is Empty' : 'لا توجد عناصر هنا بعد — سلة التسوق فارغة',
        subtitle: isEn
          ? 'Browse our curated family products, Montessori toys, and baby essentials to add items to your cart.'
          : 'تصفح منتجات الأسرة وألعاب مونتيسوري ومستلزمات الأطفال لإضافة اختياراتك إلى السلة.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'notifications': {
      const ctaLabel = isEn ? 'Restore Daily Notifications' : 'استعادة الإشعارات اليومية';
      return {
        title: isEn ? 'No items here yet — Notifications Cleared' : 'لا توجد عناصر هنا بعد — قائمة الإشعارات فارغة',
        subtitle: isEn
          ? 'You are all caught up! Restore daily parenting tips whenever you are ready.'
          : 'لقد اطلعت على جميع التنبيهات! يمكنك استعادة الإشعارات اليومية الثلاثة في أي وقت.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'chat':
    case 'chats': {
      const ctaLabel = isEn ? 'Show All Conversations' : 'عرض جميع المحادثات النشطة';
      return {
        title: isEn ? 'No items here yet — No Active Chats' : 'لا توجد عناصر هنا بعد — لا توجد محادثات نشطة',
        subtitle: isEn
          ? 'Start or restore a direct conversation with your child’s nursery, pediatrician, or family members.'
          : 'لا توجد رسائل في هذا التصنيف حاليًا. يمكنك استعادة المحادثات النشطة مع الحضانة أو العيادة أو الأسرة.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'community': {
      const ctaLabel = isEn ? 'Show All Posts' : 'عرض كل المشاركات';
      return {
        title: isEn ? 'No items here yet — No Matching Posts' : 'لا توجد عناصر هنا بعد — لا توجد مشاركات مطابقة',
        subtitle: isEn
          ? 'Try clearing the search filter or share your own parenting experience with the community.'
          : 'جرّب تغيير الفئة المختارة أو شارك تجربتك وسؤالك مع الآباء والأمهات.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'search':
    default: {
      const ctaLabel = isEn ? 'Reset Filters' : 'إعادة ضبط الفلاتر';
      return {
        title: isEn ? 'No items here yet' : 'لا توجد عناصر هنا بعد',
        subtitle: isEn
          ? 'Try adjusting your filters or adding a new item.'
          : 'جرّب تعديل خيارات التصفية أو إضافة عنصر جديد.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
  }
}



