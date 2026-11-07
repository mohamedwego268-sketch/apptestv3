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
import { getProductUnsplashImageUrl } from './cardBackgrounds';
import {
  CountryCode,
  CurrencyCode,
  CityOption,
  CityMetadata,
  ArabCountryMetadata,
  EmergencyContactsMetadata,
  PhoneValidationRule,
  ALL_ARAB_COUNTRY_CODES,
  ALL_ARAB_CURRENCIES,
  ARAB_COUNTRIES_REGISTRY,
  COUNTRY_CITIES_MAP,
  CURRENCY_METADATA_MAP,
  isSupportedCountryCode,
  isSupportedCurrencyCode,
  resolveCountryCode,
  resolveCurrencyCode,
  getCountryMetadata,
  getDefaultCityForCountry,
  getSuggestedCurrencyForCountry as getSuggestedCurrencyFromRegistry,
  getCountryTimezone,
  getCountryDialCode,
  getCitiesForCountry,
  resolveValidCityForCountry,
  getCityCoordinates,
  convertCatalogPrice,
  validatePhoneRuleForCountry,
} from './arabCountriesRegistry';

export type {
  CountryCode,
  CurrencyCode,
  CityOption,
  CityMetadata,
  ArabCountryMetadata,
  EmergencyContactsMetadata,
  PhoneValidationRule,
};

export {
  ALL_ARAB_COUNTRY_CODES,
  ALL_ARAB_CURRENCIES,
  ARAB_COUNTRIES_REGISTRY,
  COUNTRY_CITIES_MAP,
  CURRENCY_METADATA_MAP,
  isSupportedCountryCode,
  isSupportedCurrencyCode,
  resolveCountryCode,
  resolveCurrencyCode,
  getCountryMetadata,
  getDefaultCityForCountry,
  getCountryTimezone,
  getCountryDialCode,
  getCitiesForCountry,
  resolveValidCityForCountry,
  getCityCoordinates,
  convertCatalogPrice,
};

export type ParentThemeRole = 'mom' | 'dad' | 'high-contrast';
export type LanguageCode = 'ar' | 'en';
export type CalendarDisplayMode = 'both' | 'gregorian' | 'hijri';
export type TaskCadence = 'daily' | 'weekly' | 'monthly';
export type AgeStage = '0-2' | '2-5' | '5-8' | 'all';

/**
 * Enterprise-grade XSS & injection sanitizer for user-submitted strings
 * across Community Posts, Stories, Comments, Wishes, Routine Tasks, and Child Profiles.
 */
export function sanitizeUserText(raw: string, maxLength = 600): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

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
  name: { ar: 'أحمد ومريم', en: 'Ahmad & Maryam' },
  role: { ar: 'الأب والأم (أحمد ومريم)', en: 'Father & Mother (Ahmad & Maryam)' },
  city: { ar: 'القاهرة', en: 'Cairo' },
  children: [
    {
      id: 1,
      name: { ar: 'حمزة', en: 'Hamza' },
      role: { ar: 'الرضيع (٦ شهور)', en: 'Infant (6 Months)' },
      ageLabel: { ar: '٦ شهور', en: '6 mos' },
      bloodType: 'O+',
      allergies: [{ ar: 'لا توجد حساسية معروفة', en: 'No known allergies' }],
      vaccinationsNote: {
        ar: 'مكتمل تطعيمات الأشهر الستة الأولى وجرعة فيتامين د اليومية',
        en: '6-month core vaccinations completed & daily Vitamin D drops',
      },
      healthNotePrivate: {
        ar: 'نوم مستقر وتطور حسي وحركي ممتاز (التقلب والابتسام التفاعلي وبداية التسنين).',
        en: 'Steady sleep and sensory-motor milestones (rolling over, interactive smiles & early teething).',
      },
      interests: [
        { ar: 'تمارين البطن', en: 'Tummy Time' },
        { ar: 'الشخشيخة الصوتية', en: 'Sound Rattles' },
        { ar: 'التهويدات الدافئة', en: 'Warm Lullabies' },
      ],
    },
    {
      id: 2,
      name: { ar: 'ليلى', en: 'Laila' },
      role: { ar: 'مرحلة الحضانة والخيال (٤ سنوات)', en: 'Nursery & Creative World (4 Years)' },
      ageLabel: { ar: '٤ سنوات', en: '4 yrs' },
      bloodType: 'A+',
      allergies: [{ ar: 'حساسية خفيفة من الفراولة', en: 'Mild strawberry allergy' }],
      vaccinationsNote: {
        ar: 'مكتمل حتى تطعيم ٤ سنوات + فحص الأسنان الدوري',
        en: 'Completed up to 4-year vaccines + routine dental checkup',
      },
      healthNotePrivate: {
        ar: 'خيال واسع في الحضانة، حب الرسم والألوان المائية، وتكوين جمل حكائية غنية.',
        en: 'Rich imagination in nursery, loves watercolor painting and expressive storytelling.',
      },
      interests: [
        { ar: 'الألوان المائية', en: 'Watercolors' },
        { ar: 'مسرح العرائس', en: 'Puppet Theater' },
        { ar: 'حكايات الخيال', en: 'Imaginative Stories' },
        { ar: 'الصلصال الطبيعي', en: 'Playdough' },
      ],
    },
    {
      id: 3,
      name: { ar: 'يوسف', en: 'Youssef' },
      role: { ar: 'المدرسة والرياضة ومدار الشغف (٨ سنوات)', en: 'School, Sports & Passions Orbit (8 Years)' },
      ageLabel: { ar: '٨ سنوات', en: '8 yrs' },
      bloodType: 'O+',
      allergies: [{ ar: 'لا توجد حساسية معروفة', en: 'No known allergies' }],
      vaccinationsNote: {
        ar: 'مكتمل التطعيمات المدرسية وفحص اللياقة الرياضية',
        en: 'School vaccinations & sports fitness checkup completed',
      },
      healthNotePrivate: {
        ar: 'تركيز ممتاز في المدرسة، شغف بكرة القدم والسباحة وتجارب العلوم والروبوتات.',
        en: 'Strong focus at school, passionate about football, swimming, science & robotics.',
      },
      interests: [
        { ar: 'كرة القدم', en: 'Football' },
        { ar: 'السباحة', en: 'Swimming' },
        { ar: 'الروبوتات والفضاء', en: 'Robotics & Space' },
        { ar: 'التجارب العلمية', en: 'Science Experiments' },
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
  'الدقهلية': 'Dakahlia',
  'الشرقية': 'Sharqia',
  'القليوبية': 'Qalyubia',
  'البحيرة': 'Beheira',
  'الغربية': 'Gharbia',
  'المنوفية': 'Monufia',
  'المنيا': 'Minya',
  'سوهاج': 'Sohag',
  'أسيوط': 'Assiut',
  'بني سويف': 'Beni Suef',
  'الفيوم': 'Faiyum',
  'قنا': 'Qena',
  'الأقصر': 'Luxor',
  'كفر الشيخ': 'Kafr El Sheikh',
  'أسوان': 'Aswan',
  'دمياط': 'Damietta',
  'الإسماعيلية': 'Ismailia',
  'السويس': 'Suez',
  'بورسعيد': 'Port Said',
  'مطروح': 'Matrouh',
  'شمال سيناء': 'North Sinai',
  'جنوب سيناء': 'South Sinai',
  'الوادي الجديد': 'New Valley',
  'البحر الأحمر': 'Red Sea',
  'المنصورة': 'Mansoura',
  'طنطا': 'Tanta',
  'الدمام': 'Dammam',
  'مكة المكرمة': 'Makkah',
  'المدينة المنورة': 'Madinah',
  'الشرقية (الدمام, الخبر, الظهران, الجبيل, الأحساء, القطيف)': 'Eastern Province (Dammam, Khobar, Dhahran, Jubail, Al-Ahsa, Qatif)',
  'القصيم (بريدة, عنيزة)': 'Al-Qassim (Buraidah, Unaizah)',
  'عسير (أبها, خميس مشيط)': 'Asir (Abha, Khamis Mushait)',
  'تبوك': 'Tabuk',
  'حائل': 'Hail',
  'جازان': 'Jazan',
  'نجران': 'Najran',
  'الباحة': 'Al-Baha',
  'الجوف': 'Al-Jouf',
  'الحدود الشمالية (عرعر, رفحاء)': 'Northern Borders (Arar, Rafha)',
  'الطائف': 'Taif',
  'ينبع': 'Yanbu',
  'الخبر': 'Khobar',
  'الظهران': 'Dhahran',
  'أبها': 'Abha',
  'الشيخ زايد': 'Sheikh Zayed',
  'الزقازيق': 'Zagazig',
  'كل المدن': 'All Cities',
  'ماما (سارة)': 'Mom (Sara)',
  'ماما (مريم)': 'Mom (Maryam)',
  'بابا (أحمد)': 'Dad (Ahmed)',
  'الأم (سارة)': 'Mother (Sara)',
  'الأم (مريم)': 'Mother (Maryam)',
  'مريم (الأم)': 'Maryam (Mother)',
  'الأب (أحمد)': 'Father (Ahmed)',
  'أحمد و مريم': 'Ahmed & Maryam',
  'أحمد ومريم': 'Ahmed & Maryam',
  'حمزة': 'Hamza',
  'يوسف': 'Youssef',
  'مريم': 'Maryam',
  'سارة المنيري': 'Sara El-Moneiry',
  'مريم المنيري': 'Maryam El-Moneiry',
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
  'عائلة أحمد ومريم': 'Ahmed & Maryam Family',
  'المعادي - شارع 9، عمارة 14، الدور الثالث': 'Maadi - Street 9, Bldg 14, 3rd Floor',

  // Child medical & interests
  'تتبع النوم، بداية إدخال الطعام، التطور الحركي واللعب الحسي': 'Sleep tracking, first solid feeding, motor development & sensory play',
  'التأقلم في الحضانة، بطاقات تسمية المشاعر، اللعب الإبداعي والألوان': 'Nursery transition, emotional naming cards, creative play & colors',
  'استقلالية روتين المدرسة، توازن المذاكرة واللعب، تنظيم وقت الشاشات والمنطق': 'School routine independence, homework/play balance, screen-time management & logic',
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
  'نشاط حركي': 'Active Outdoor Play',

  // Store Categories, Variants & Sellers
  'ألعاب تعليمية': 'Educational Toys',
  'عناية بالرضع': 'Baby Care',
  'تجهيز الغرف': 'Nursery & Gear',
  'كتب وقصص': 'Books & Stories',
  'ملابس قطنية': 'Cotton Apparel',
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
  'سارة (الأم)': 'Sara (Mother)',
  'أحمد (الأب)': 'Ahmed (Father)',
  'أ. ريم — مشرفة حضانة خطوات صغيرة': 'Ms. Reem — Little Steps Nursery Supervisor',
  'مشرفة حضانة': 'Nursery Supervisor',
  'الحضانة والمدرسة': 'Nursery & School',
  'التجمع الخامس — الحي الثالث': 'Fifth Settlement — 3rd District',
  'شارع التسعين الشمالي، فيلا 14': 'North 90th Street, Villa 14',
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
  for (const code of ALL_ARAB_COUNTRY_CODES) {
    const cMeta = ARAB_COUNTRIES_REGISTRY[code];
    if (cMeta.nameAr === str) return cMeta.nameEn;
    const cityMatch = cMeta.cities.find((c) => c.nameAr === str || c.id === str);
    if (cityMatch) return cityMatch.nameEn;
  }
  return str
    .replace(/حمزة/g, 'Hamza')
    .replace(/ليلى/g, 'Laila')
    .replace(/يوسف/g, 'Youssef')
    .replace(/مريم/g, 'Maryam')
    .replace(/أحمد/g, 'Ahmad')
    .replace(/عز/g, 'Hamza')
    .replace(/نور/g, 'Laila')
    .replace(/سارة/g, 'Maryam')
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

export interface VoiceVaultMoment {
  id: string;
  title: string;
  createdAt: string;
  durationSec: number;
  tag: string;
  recordedBy: 'mother' | 'father';
  melodyHz?: number[];
}

export type ChildColorThemeId = 'teal' | 'sky' | 'violet' | 'coral' | 'emerald';

export const CHILD_COLOR_PALETTE_ORDER: readonly ChildColorThemeId[] = [
  'teal',
  'sky',
  'violet',
  'coral',
  'emerald',
] as const;

export interface ChildProfileDetails {
  favoriteFoods?: string[];
  favoriteDrinks?: string[];
  dislikedFoods?: string[];
  foodRestrictions?: string[];
  hobbies?: string[];
  sports?: string[];
  school?: Record<string, unknown>;
  sleepPreferences?: Record<string, unknown>;
  dailyRoutine?: Record<string, unknown>;
  emotionalProfile?: Record<string, unknown>;
  socialProfile?: Record<string, unknown>;
  interests?: string[];
  colorTheme?: ChildColorThemeId;
  extra?: Record<string, unknown>;
}

export interface ChildProfile {
  id: number;
  /** Optional database record identifier (UUID or DB primary key) separated from local UI id */
  remoteId?: string | number;
  name: string;
  gender: 'boy' | 'girl';
  birth: string;
  interests: string;
  profileDetails?: ChildProfileDetails;
  emoji: string;
  bloodType?: string;
  vaccinationsNote?: string;
  healthNotePrivate?: string;
  growthHeightCm?: number;
  growthWeightKg?: number;
  /** 3D personality/accessory theme when using 3D avatar */
  avatarTheme?: AvatarAccessoryTheme;
  /** Dedicated visual identity color theme for this child */
  colorTheme?: ChildColorThemeId;
  /** Real uploaded child photograph data URL (preserved when present) */
  photoDataUrl?: string;
  /** Whether parent prefers the 3D illustrated avatar even if a photo is uploaded */
  useIllustratedAvatar?: boolean;
  /** 10-second Micro-Moments Voice Vault audio memories */
  voiceMoments?: VoiceVaultMoment[];
}

export interface RoutineTask {
  id: number;
  remoteId?: string | number;
  name: string;
  time: string;
  done: boolean;
  kidId: number | null;
  remoteChildId?: string | number | null;
  category: string;
  owner: string;
  cadence: TaskCadence;
  /** Optional one-off local YYYY-MM-DD date for AI-planned family activities. */
  scheduledDate?: string;
  /** 0 = Sunday ... 6 = Saturday; used when cadence is weekly. */
  dayOfWeek?: number;
  /** Optional list of weekdays (0..6) when weekly task repeats on multiple days. */
  daysOfWeek?: number[];
  /** 1..31; used when cadence is monthly (automatically clamped at month end / leap year). */
  dayOfMonth?: number;
  /** Sorted, deduplicated local YYYY-MM-DD dates on which this task was completed. */
  completedDates?: string[];
  /** Most recent local YYYY-MM-DD date on which this task was completed. */
  lastCompletedDate?: string;
}

export interface CalendarEvent {
  id: number;
  remoteId?: string | number;
  title: string;
  date: string;
  time?: string;
  type: string;
  childId: number | null;
  remoteChildId?: string | number | null;
  repeat: 'none' | 'weekly' | 'monthly' | 'yearly';
  note?: string;
  createdAt?: string;
}

export interface WishItem {
  id: number;
  remoteId?: string | number;
  name: string;
  kid: number;
  remoteChildId?: string | number | null;
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
  remoteId?: string | number;
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
  remoteUserId?: string;
  fullName: string;
  relationshipRole: 'الأم' | 'الأب';
  country: CountryCode;
  city?: string;
  phoneCode: string;
  phoneNumber: string;
  phoneVerified: boolean;
  email: string;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  notificationPrefs: ParentNotificationPrefs;
  personalNotes?: string;
  survivalModeActive?: boolean;
  preferredContextMode?: 'auto' | 'morning' | 'noon' | 'evening';
}

export function isTaskVisibleForParentSession(
  task: RoutineTask,
  activeParentAccount: 'mother' | 'father'
): boolean {
  const ownerNorm = (task.owner || 'مشترك').trim();
  if (
    ownerNorm === 'مشترك' ||
    ownerNorm.includes('مشترك') ||
    ownerNorm.toLowerCase() === 'shared'
  ) {
    return true;
  }
  if (activeParentAccount === 'father') {
    return (
      ownerNorm === 'الأب' ||
      ownerNorm.includes('أحمد') ||
      ownerNorm.includes('بابا') ||
      ownerNorm.toLowerCase().includes('father') ||
      ownerNorm.toLowerCase().includes('dad')
    );
  }
  return (
    ownerNorm === 'الأم' ||
    ownerNorm.includes('مريم') ||
    ownerNorm.includes('ماما') ||
    ownerNorm.toLowerCase().includes('mother') ||
    ownerNorm.toLowerCase().includes('mom')
  );
}

export interface DailyParentingNotification {
  id: string;
  slot: 'morning' | 'midday' | 'evening' | 'support' | 'security';
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

export interface DemoServiceBooking {
  id: string;
  createdAt: string;
  serviceId: number;
  serviceName: string;
  providerName: string;
  date: string;
  time: string;
  beneficiary: string;
  notes?: string;
  price: number;
  currency: CurrencyCode;
  status: 'requested_demo';
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
  /** Family-wide community and chat records, persisted through the existing shared JSONB workspace. */
  communityState?: Record<string, unknown>;
  chatState?: Record<string, unknown>;
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
  serviceBookings: DemoServiceBooking[];
  darkMode?: boolean;
  /** Verified remote family UUID when resolved from an authenticated DB session */
  verifiedFamilyId?: string | null;
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
    /** Relative path inside the private nekbaar-media Storage bucket. Never an external URL. */
    storagePath?: string | null;
    posterPath?: string | null;
  };
  gallerySlides?: {
    titleAr: string;
    titleEn: string;
    captionAr: string;
    captionEn: string;
    iconId: string;
  }[];
}

export type StoreCategoryId =
  | 'toys'
  | 'nursery'
  | 'doctor'
  | 'clothing'
  | 'essentials'
  | 'courses'
  | 'sports'
  | 'events_parks'
  | 'books'
  | 'nutrition'
  | 'furniture'
  | 'consultation'
  | 'delivery';

export interface CommercialCatalogItem {
  id: number;
  name: string;
  nameEn: string;
  kind: 'service' | 'product' | 'offer';
  category: StoreCategoryId;
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
  imageUrl?: string;
  ageStage?: AgeStage;
  collectionTag?: 'bestseller' | 'new' | 'deal' | 'recommended';
  variants?: string[];
  /** Exact seller-provided product gallery URLs; never populate with category stock images. */
  galleryImages?: string[];
  specificationsAr?: string[];
  specificationsEn?: string[];
  sellerName?: string;
  deliveryEstimateAr?: string;
  deliveryEstimateEn?: string;
  serviceDurationMinutes?: number;
  bookingRequired?: boolean;
  fulfillmentMode?: 'shipping' | 'pickup' | 'online' | 'onsite' | 'at_home' | 'digital';
  providerName?: string;
  listingValidUntil?: string;
  isDemoData?: boolean;
}

export type CommercialItem = CommercialCatalogItem;

export const STORAGE_KEY = 'family-space-v1';
export const DEMO_OTP_CODE = '123456';

export const DEFAULT_PARENT_ACCOUNTS: {
  mother: ParentAccountProfile;
  father: ParentAccountProfile;
} = {
  mother: {
    id: 'mother',
    fullName: 'مريم (الأم)',
    relationshipRole: 'الأم',
    country: 'EG',
    phoneCode: '+20',
    phoneNumber: '1012345678',
    phoneVerified: true,
    email: 'maryam.mom@nekbaar.app',
    emailVerified: true,
    onboardingCompleted: true,
    personalNotes: 'تذكير خاص بمريم: تحضير مهروس الكوسة والجزر لحمزة ومراجعة ألوان ليلى.',
    survivalModeActive: false,
    preferredContextMode: 'auto',
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
    email: 'ahmed.dad@nekbaar.app',
    emailVerified: true,
    onboardingCompleted: true,
    personalNotes: 'تذكير خاص بأحمد: تمرين السباحة والشطرنج مع يوسف ومراجعة وقت البطن لحمزة.',
    survivalModeActive: false,
    preferredContextMode: 'auto',
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

/**
 * Calculates great-circle distance in kilometers between two GPS coordinates using Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest supported city & country across all 22 Arab League countries given GPS coordinates.
 */
export function findNearestCityByCoords(
  lat: number,
  lng: number,
  preferredCountry?: CountryCode
): { country: CountryCode; city: CityOption; distanceKm: number } {
  const countriesToScan = preferredCountry ? [preferredCountry] : ALL_ARAB_COUNTRY_CODES;
  let bestCountry: CountryCode = preferredCountry || 'EG';
  let bestCity: CityOption = COUNTRY_CITIES_MAP[bestCountry][0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const country of countriesToScan) {
    for (const cityOpt of COUNTRY_CITIES_MAP[country]) {
      const dist = calculateDistanceKm(lat, lng, cityOpt.lat, cityOpt.lng);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestCountry = country;
        bestCity = cityOpt;
      }
    }
  }

  return {
    country: bestCountry,
    city: bestCity,
    distanceKm: bestDistance,
  };
}

/**
 * Sorts and enriches catalog items (clinics, nurseries, products) dynamically based on
 * the selected city/governorate and optional GPS coordinates.
 */
export function sortCatalogByCityAndProximity(
  items: CommercialCatalogItem[],
  country: CountryCode,
  selectedCity: string,
  userCoords?: { lat: number; lng: number } | null
): Array<CommercialCatalogItem & { isLocalMatch: boolean; estimatedDistanceKm: number }> {
  const citiesForCountry = COUNTRY_CITIES_MAP[country] || [];
  const activeCityObj =
    citiesForCountry.find((c) => c.id === selectedCity) || citiesForCountry[0];

  const baseLat = userCoords?.lat ?? activeCityObj?.lat ?? 30.0444;
  const baseLng = userCoords?.lng ?? activeCityObj?.lng ?? 31.2357;

  return items
    .filter((item) => item.country === 'ALL' || item.country === country)
    .map((item, idx) => {
      const isLocalMatch =
        Boolean(selectedCity) &&
        (item.city.includes(selectedCity) ||
          item.city.includes('مصر والسعودية') ||
          item.city.includes('أونلاين'));

      // Deterministic local offset around city center so nearby clinics/stores show realistic distances
      const itemLatOffset = ((item.id * 17 + idx * 7) % 19 - 9) * 0.008;
      const itemLngOffset = ((item.id * 13 + idx * 11) % 19 - 9) * 0.008;
      const itemLat = (activeCityObj?.lat ?? baseLat) + (isLocalMatch ? itemLatOffset : itemLatOffset * 4.5);
      const itemLng = (activeCityObj?.lng ?? baseLng) + (isLocalMatch ? itemLngOffset : itemLngOffset * 4.5);

      const rawDist = calculateDistanceKm(baseLat, baseLng, itemLat, itemLng);
      const estimatedDistanceKm = Math.max(0.6, Math.round(rawDist * 10) / 10);

      return {
        ...item,
        isLocalMatch,
        estimatedDistanceKm,
      };
    })
    .sort((a, b) => {
      if (a.isLocalMatch !== b.isLocalMatch) {
        return a.isLocalMatch ? -1 : 1;
      }
      return a.estimatedDistanceKm - b.estimatedDistanceKm;
    });
}

export const DEFAULT_SEED: FamilySpaceState = {
  role: 'mom',
  parentName: 'أحمد و مريم',
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
      email: 'reem.nursery@littlesteps.edu.eg',
      assignedKidIds: [2], // Assigned to Laila (id: 2)
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
    recipientName: 'أحمد و مريم',
    city: 'القاهرة الجديدة',
    district: 'التجمع الخامس — الحي الثالث',
    streetDetails: 'شارع التسعين الشمالي، فيلا 14',
    phone: '+20 1012345678',
  },
  orders: [],
  serviceBookings: [],
  events: [
    {
      id: 901,
      title: 'متابعة تطعيم ٦ شهور وقياس النمو - حمزة',
      date: '2026-10-28',
      time: '10:00',
      type: 'تطعيم',
      childId: 1,
      repeat: 'none',
      note: 'إحضار دفتر التطعيمات ومراجعة جدول إدخال الطعام مع طبيب الأطفال',
      createdAt: '2026-10-20T09:00:00.000Z',
    },
    {
      id: 902,
      title: 'ورشة اللعب الإبداعي وبطاقات المشاعر بالحضانة - ليلى',
      date: '2026-10-29',
      time: '11:30',
      type: 'نشاط',
      childId: 2,
      repeat: 'weekly',
      note: 'تجهيز مريلة التلوين ومشاركة بطاقات تسمية المشاعر مع المعلمة',
      createdAt: '2026-10-20T10:00:00.000Z',
    },
    {
      id: 903,
      title: 'تمرين السباحة وتحدي الشطرنج المدرسي - يوسف',
      date: '2026-10-30',
      time: '17:00',
      type: 'نشاط',
      childId: 3,
      repeat: 'weekly',
      note: 'تجهيز شنطة التمرين ومراجعة جدول تنظيم وقت الشاشات والمذاكرة',
      createdAt: '2026-10-20T11:00:00.000Z',
    },
  ],
  kids: [
    {
      id: 1,
      name: 'حمزة',
      gender: 'boy',
      birth: '2026-04-20',
      interests: 'تتبع النوم، بداية إدخال الطعام، التطور الحركي واللعب الحسي',
      emoji: '👶🏻',
      bloodType: 'O+',
      vaccinationsNote: 'مكتمل تطعيمات ٢ و٤ و٦ شهور بانتظام',
      healthNotePrivate: 'بداية إدخال الخضار المهروس — نوم ليلي يتحسن تدريجيًا',
      growthHeightCm: 67,
      growthWeightKg: 7.8,
      avatarTheme: 'nature',
      useIllustratedAvatar: true,
      voiceMoments: [
        {
          id: 'vm-hamza-1',
          title: 'أول ضحكة بصوت عالي وقت اللعب مع بابا أحمد وماما مريم',
          createdAt: '2026-10-24',
          durationSec: 10,
          tag: 'أول ضحكة 👶🏻',
          recordedBy: 'mother',
          melodyHz: [392.0, 440.0, 523.25, 587.33, 659.25],
        },
        {
          id: 'vm-hamza-2',
          title: 'مناغاة الصباح الجميلة (با-با / ما-ما) بعد الرضعة',
          createdAt: '2026-10-26',
          durationSec: 8,
          tag: 'مناغاة 🎵',
          recordedBy: 'father',
          melodyHz: [329.63, 392.0, 493.88, 523.25],
        },
      ],
    },
    {
      id: 2,
      name: 'ليلى',
      gender: 'girl',
      birth: '2022-06-15',
      interests: 'التأقلم في الحضانة، بطاقات تسمية المشاعر، اللعب الإبداعي والألوان',
      emoji: '👧🏻',
      bloodType: 'A+',
      vaccinationsNote: 'مكتمل تطعيمات ٤ سنوات والجرعات التنشيطية',
      healthNotePrivate: 'تحب القصص المصورة وتستجيب لبطاقات المشاعر عند الغضب',
      growthHeightCm: 102,
      growthWeightKg: 16.4,
      avatarTheme: 'artist',
      useIllustratedAvatar: true,
      voiceMoments: [
        {
          id: 'vm-laila-1',
          title: 'حكاية ليلى عن رسمة الشمس وأصحابها في الحضانة',
          createdAt: '2026-10-25',
          durationSec: 10,
          tag: 'حكاية الحضانة 🎨',
          recordedBy: 'mother',
          melodyHz: [440.0, 523.25, 659.25, 587.33, 523.25],
        },
      ],
    },
    {
      id: 3,
      name: 'يوسف',
      gender: 'boy',
      birth: '2018-09-10',
      interests: 'استقلالية روتين المدرسة، توازن المذاكرة واللعب، تنظيم وقت الشاشات والمنطق',
      emoji: '👦🏻',
      bloodType: 'B+',
      vaccinationsNote: 'مكتمل كافة التطعيمات الأساسية والمدرسية',
      healthNotePrivate: 'يمارس السباحة ويتدرب على تنظيم جدول المذاكرة والشاشات بنفسه',
      growthHeightCm: 128,
      growthWeightKg: 26.5,
      avatarTheme: 'astronaut',
      useIllustratedAvatar: true,
      voiceMoments: [
        {
          id: 'vm-youssef-1',
          title: 'شرح يوسف لخطة الفوز في مسابقة الشطرنج المدرسية',
          createdAt: '2026-10-23',
          durationSec: 10,
          tag: 'فخر وإنجاز 🏆',
          recordedBy: 'father',
          melodyHz: [293.66, 369.99, 440.0, 587.33],
        },
      ],
    },
  ],
  tasks: [
    {
      id: 1,
      name: 'رضعة الصباح ووجبة مهروس الخضار الطازج لـ حمزة (مريم)',
      time: '07:00 ص',
      done: true,
      kidId: 1,
      category: 'أكل وشرب',
      owner: 'الأم',
      cadence: 'daily',
    },
    {
      id: 2,
      name: 'مراجعة شنطة المدرسة وروتين الاستقلالية الصباحي مع يوسف (أحمد)',
      time: '07:30 ص',
      done: true,
      kidId: 3,
      category: 'روتين عام',
      owner: 'الأب',
      cadence: 'daily',
    },
    {
      id: 3,
      name: 'توصيل ليلى للحضانة مع بطاقة تسمية مشاعر الصباح (مريم)',
      time: '08:00 ص',
      done: true,
      kidId: 2,
      category: 'روتين عام',
      owner: 'الأم',
      cadence: 'daily',
    },
    {
      id: 4,
      name: 'تمرين وقت البطن (Tummy Time) وتنمية الحواس لـ حمزة ١٥ دقيقة (أحمد)',
      time: '01:30 م',
      done: false,
      kidId: 1,
      category: 'لعب وتعلم',
      owner: 'الأب',
      cadence: 'daily',
    },
    {
      id: 5,
      name: 'جلسة اللعب الإبداعي وبطاقات تهدئة المشاعر مع ليلى (مريم)',
      time: '04:00 م',
      done: false,
      kidId: 2,
      category: 'لعب وتعلم',
      owner: 'الأم',
      cadence: 'daily',
    },
    {
      id: 6,
      name: 'إنهاء الواجبات المدرسية وضبط مؤقت الشاشات واللعب مع يوسف (أحمد)',
      time: '05:30 م',
      done: false,
      kidId: 3,
      category: 'لعب وتعلم',
      owner: 'الأب',
      cadence: 'daily',
    },
    {
      id: 7,
      name: 'حمام دافئ وتتبع نوم المساء الهادئ لـ حمزة (مشترك: أحمد ومريم)',
      time: '07:30 م',
      done: false,
      kidId: 1,
      category: 'نوم',
      owner: 'مشترك',
      cadence: 'daily',
    },
    {
      id: 8,
      name: 'قصة ما قبل النوم لـ ليلى ويوسف وإغلاق الشاشات تماماً (مشترك)',
      time: '08:30 م',
      done: false,
      kidId: null,
      category: 'نوم',
      owner: 'مشترك',
      cadence: 'daily',
    },
  ],
  wishes: [
    {
      id: 1,
      name: 'سجادة ألعاب حسية وبيانو ركل لتقوية عضلات حمزة',
      kid: 1,
      price: 680,
      currency: 'EGP',
      emoji: '👶🏻',
      reserved: false,
      progress: 75,
      goalType: 'تطور حركي وحسي',
    },
    {
      id: 2,
      name: 'مجموعة بطاقات تسمية المشاعر المونتيسوري وحقيبة تلوين لـ ليلى',
      kid: 2,
      price: 390,
      currency: 'EGP',
      emoji: '🎨',
      reserved: true,
      progress: 100,
      goalType: 'مهارات عاطفية وإبداع',
    },
    {
      id: 3,
      name: 'مجموعة روبوت ومنطق برمجي STEM بدون شاشات لـ يوسف',
      kid: 3,
      price: 1250,
      currency: 'EGP',
      emoji: '🤖',
      reserved: false,
      progress: 60,
      goalType: 'تفكير منطقي ومدرسة',
    },
    {
      id: 4,
      name: 'صندوق ادخار عطلة نهاية الأسبوع العائلية (أحمد ومريم والأولاد)',
      kid: 3,
      price: 3500,
      currency: 'EGP',
      emoji: '🏖️',
      reserved: false,
      progress: 45,
      goalType: 'إدخار العائلة',
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
      assignedKidIds: [1, 2, 3],
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
      name: 'ماما (مريم)',
      role: 'الأم',
      side: 'الأسرة الأساسية',
      wishes: true,
      events: true,
      emoji: '👩🏻',
      roleCategory: 'mother',
      phoneCountry: 'EG',
      phoneNumber: '1012345678',
      assignedKidIds: [1, 2, 3],
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
      id: 3,
      name: 'تيتا منى',
      role: 'جدة الأم',
      side: 'عيلة الأم',
      wishes: true,
      events: true,
      emoji: '👵🏻',
      roleCategory: 'grandparent',
      phoneCountry: 'EG',
      phoneNumber: '1055667788',
      assignedKidIds: [1, 2, 3],
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

const BASE_COMMERCIAL_SEED: CommercialCatalogItem[] = [
  {
    id: 201,
    name: 'لعبة بازل ومكعبات مونتيسوري الخشبية لتنمية الذكاء (60 قطعة)',
    nameEn: 'Interactive Montessori Wooden Skill Set (60 pcs)',
    kind: 'product',
    category: 'toys',
    categoryLabel: 'ألعاب مونتيسوري',
    country: 'ALL',
    city: 'القاهرة / الرياض',
    priceEGP: 420,
    priceSAR: 108,
    originalPriceEGP: 520,
    originalPriceSAR: 135,
    rating: '4.9',
    reviewCount: 142,
    isSponsored: false,
    description: 'مجموعة خشبية آمنة بتشجع طفلك يركب الأشكال ويتعلم الأرقام والألوان لوحده من سن سنتين لـ 6 سنين.',
    descriptionEn: 'Safe wooden Montessori set teaching numbers, colors, and motor matching for ages 2–6.',
    emoji: '🧸',
    ageStage: '2-5',
    collectionTag: 'bestseller',
    variants: ['مجموعة 60 قطعة (2–6 سنوات)', 'مجموعة 90 قطعة متقدمة'],
    specificationsAr: ['خشب زان طبيعي آمن غير سام', 'حواف دائرية ناعمة لحماية إيد الطفل', 'كتيب أنشطة بالعربي والإنجليزي'],
    specificationsEn: ['Non-toxic natural beechwood', 'Smooth rounded safety edges', 'Bilingual activity guide (AR/EN)'],
    sellerName: 'متجر خطوات مونتيسوري المعتمد',
    deliveryEstimateAr: 'توصيل لحد البيت خلال 24–48 ساعة',
    deliveryEstimateEn: 'Delivery within 24–48 hrs',
  },
  {
    id: 202,
    name: 'طقم قطن مصري عضوي ناعم للبيت والحضانة (3 قطع)',
    nameEn: 'Organic Egyptian Cotton Daily Comfort Set (3 pcs)',
    kind: 'product',
    category: 'clothing',
    categoryLabel: 'ألبسة قطنية',
    country: 'ALL',
    city: 'القاهرة / جدة',
    priceEGP: 650,
    priceSAR: 145,
    originalPriceEGP: 780,
    originalPriceSAR: 175,
    rating: '4.8',
    reviewCount: 189,
    isSponsored: false,
    description: 'قطن مصري 100% طري جداً على بشرة طفلك ومريح في الحركة واللعب طول اليوم في الحضانة.',
    descriptionEn: '100% organic breathable cotton gentle on sensitive skin for nursery and play.',
    emoji: '👗',
    ageStage: '0-2',
    collectionTag: 'new',
    variants: ['مقاس 1–2 سنة (روز هادئ)', 'مقاس 2–4 سنوات (تيل سماوي)', 'مقاس 4–6 سنوات (كريمي)'],
    specificationsAr: ['قطن مصري عضوي 100%', 'خالي من أي صبغات كيميائية', 'بيستحمل الغسيل المتكرر من غير ما يكش'],
    specificationsEn: ['100% Organic Cotton', 'Chemical-dye free', 'Pre-shrunk durable weave'],
    sellerName: 'دار القطن الطبيعي للطفل',
    deliveryEstimateAr: 'توصيل سريع خلال 24–48 ساعة',
    deliveryEstimateEn: 'Delivery within 24–48 hours',
  },
  {
    id: 203,
    name: 'بوكس التوفير العائلي للعناية اليومية وحفاضات الأطفال',
    nameEn: 'Family Care & Diapers Value Bundle',
    kind: 'offer',
    category: 'essentials',
    categoryLabel: 'مستلزمات عائلية',
    country: 'ALL',
    city: 'مصر والسعودية',
    priceEGP: 890,
    priceSAR: 185,
    originalPriceEGP: 1150,
    originalPriceSAR: 240,
    rating: '4.9',
    reviewCount: 215,
    isSponsored: true,
    partnerBrand: 'Pampers · Johnson’s · Bebelac',
    description: 'باقة التوفير الشهرية لكل بيت: حفاضات، مناديل مبللة طبية، وغسول لطيف لبشرة البيبي.',
    descriptionEn: 'Special family discount bundle on daily baby essentials.',
    emoji: '🍼',
    ageStage: '0-2',
    collectionTag: 'deal',
    variants: ['مقاس 3 (6–10 كجم)', 'مقاس 4 (9–14 كجم)', 'مقاس 5 (11–16 كجم)'],
    specificationsAr: ['عبوة توفير شهرية (120 حفاضة)', 'مناديل مبللة طبية بدون عطور', 'غسول لطيف للبشرة الحساسة'],
    specificationsEn: ['Monthly value pack (120 count)', 'Fragrance-free medical wipes', 'Gentle sensitive skin wash'],
    sellerName: 'شركاء العناية بالطفل',
    deliveryEstimateAr: 'توصيل فوري في نفس اليوم',
    deliveryEstimateEn: 'Same-day express delivery',
  },
  {
    id: 204,
    name: 'عيادة د. طارق المنيري لطب الأطفال ومتابعة النمو والتطعيمات',
    nameEn: 'Dr. Tarek Pediatric & Child Growth Clinic',
    kind: 'service',
    category: 'doctor',
    categoryLabel: 'أطباء أطفال',
    country: 'EG',
    city: 'القاهرة الجديدة / الشيخ زايد',
    priceEGP: 450,
    priceSAR: 180,
    rating: '4.9',
    reviewCount: 310,
    isSponsored: false,
    description: 'كشف شامل ومتابعة جدول التطعيمات، منحنيات النمو، وتغذية الرضع والأطفال في جو مريح ومبهج للطفل.',
    descriptionEn: 'Vaccinations tracking, WHO growth curves, and periodic pediatric checkups.',
    emoji: '🩺',
    ageStage: 'all',
    collectionTag: 'recommended',
    variants: ['كشف عيادة حضوري', 'استشارة متابعة فيديو أونلاين'],
    specificationsAr: ['استشاري طب أطفال وحديثي الولادة', 'قياس دقيق لمنحنيات الطول والوزن', 'متابعة واتساب مجانية لمدة أسبوع بعد الكشف'],
    specificationsEn: ['Board-certified pediatrician', 'Comprehensive height/weight percentiles', '7-day follow-up support'],
    sellerName: 'مراكز نمو الطفل الطبية',
    deliveryEstimateAr: 'حجز فوري لمواعيد النهاردة وبكرة',
    deliveryEstimateEn: 'Instant slot booking',
  },
  {
    id: 205,
    name: 'حضانة خطوات صغيرة التربوية (Montessori & Bilingual)',
    nameEn: 'Little Steps Educational Montessori Nursery',
    kind: 'service',
    category: 'nursery',
    categoryLabel: 'حضانات ومدارس',
    country: 'ALL',
    city: 'القاهرة / الرياض',
    priceEGP: 3800,
    priceSAR: 1650,
    rating: '4.9',
    reviewCount: 194,
    isSponsored: false,
    description: 'بيئة دافية وآمنة بتنمي مهارات الكلام، التفاعل الاجتماعي، واللعب الحسي من سن سنة لحد 5 سنين.',
    descriptionEn: 'Safe bilingual environment nurturing social, motor, and language skills for ages 1–5.',
    emoji: '📚',
    ageStage: '2-5',
    collectionTag: 'bestseller',
    variants: ['اشتراك شهري كامل (8 ص – 4 م)', 'اشتراك نصف يوم (8 ص – 1 م)'],
    specificationsAr: ['تقرير يومي بالصور والفيديو لماما وبابا', 'منهج مونتيسوري عربي وإنجليزي', 'وجبات صحية طازة وإشراف طبي يومي'],
    specificationsEn: ['Daily updates linked to Family Space', 'Montessori & bilingual curriculum', 'Medical supervision & healthy meals'],
    sellerName: 'مؤسسة خطوات صغيرة التعليمية',
    deliveryEstimateAr: 'احجز يوم تجربة مجاني لطفلك',
    deliveryEstimateEn: 'Free introductory trial day',
  },
  {
    id: 206,
    name: 'جلسة إرشاد تربوي وتعديل سلوك مع أخصائية نفسية للأطفال',
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
    description: 'قعدة هادية مع متخصصين لمساعدة ماما وبابا في تنظيم النوم، علاج العناد، والغيرة بين الإخوات.',
    descriptionEn: '1-on-1 family counseling for sleep routines, picky eating, tantrums, and sibling harmony.',
    emoji: '👩‍⚕️',
    ageStage: 'all',
    collectionTag: 'recommended',
    variants: ['جلسة فيديو 45 دقيقة (لماما وبابا)', 'باقة متابعة 3 جلسات'],
    specificationsAr: ['سرية تامة وخصوصية للأسرة', 'خطة عملية مكتوبة تمشي عليها في البيت', 'دعم مشترك للأب والأم'],
    specificationsEn: ['Strict family confidentiality', 'Written actionable routine plan', 'Joint Mother & Father guidance'],
    sellerName: 'وحدة الإرشاد الأسري والنفسي',
    deliveryEstimateAr: 'مواعيد صباحية ومسائية مرنة',
    deliveryEstimateEn: 'Morning & evening slots available',
  },
  {
    id: 207,
    name: 'خدمة التوصيل السريع لطلبات الصيدلية ومستلزمات البيبي',
    nameEn: 'Family Essentials Express Delivery Service',
    kind: 'service',
    category: 'delivery',
    categoryLabel: 'خدمات التوصيل',
    country: 'ALL',
    city: 'القاهرة / الإسكندرية / الرياض / جدة',
    priceEGP: 45,
    priceSAR: 18,
    rating: '4.8',
    reviewCount: 164,
    isSponsored: true,
    partnerBrand: 'شريك التوصيل السريع',
    description: 'توصيل فوري لكل طلبات الصيدلية، اللبن، الحفاضات، والأكل الصحي لحد باب الشقة في أقل من ساعة.',
    descriptionEn: 'Express delivery for pharmacy, baby care, and healthy family groceries.',
    emoji: '🚚',
    ageStage: 'all',
    collectionTag: 'deal',
    variants: ['توصيل فوري (45–60 دقيقة)', 'توصيل مجدول حسب ميعادك'],
    specificationsAr: ['تتبع المندوب لحظة بلحظة على الخريطة', 'شنط حفظ حرارة للأدوية والأكل الطازج'],
    specificationsEn: ['Real-time order tracking', 'Temperature-controlled transport'],
    sellerName: 'شريك التوصيل السريع للأسرة',
    deliveryEstimateAr: 'خلال 45 دقيقة لباب البيت',
    deliveryEstimateEn: 'Within 45 mins to your door',
  },
];

interface CategoryExpansionTemplate {
  category: StoreCategoryId;
  categoryLabel: string;
  emoji: string;
  kind: 'product' | 'service' | 'offer';
  sellerAr: string;
  deliveryAr: string;
  deliveryEn: string;
  items: Array<{
    nameAr: string;
    nameEn: string;
    descAr: string;
    descEn: string;
    priceEGP: number;
    priceSAR: number;
    origEGP?: number;
    origSAR?: number;
    rating: string;
    reviews: number;
    city: string;
    age: AgeStage;
    tag: 'bestseller' | 'new' | 'deal' | 'recommended';
    variants: string[];
  }>;
}

const CATEGORY_CATALOG_BLUEPRINTS: CategoryExpansionTemplate[] = [
  {
    category: 'toys',
    categoryLabel: 'ألعاب مونتيسوري',
    emoji: '🧸',
    kind: 'product',
    sellerAr: 'متجر خطوات مونتيسوري المعتمد',
    deliveryAr: 'توصيل خلال 24 ساعة لباب البيت',
    deliveryEn: '24-hour doorstep delivery',
    items: [
      {
        nameAr: 'مختبر العلوم والفضاء ثلاثي الأبعاد للمبتكر الصغير',
        nameEn: '3D Space & Science STEM Kit for Kids',
        descAr: 'مجسمات كواكب مضيئة و12 تجربة علمية آمنة في البيت بتخلي طفلك يعشق العلوم والتفكير.',
        descEn: 'Glow-in-the-dark 3D planets and 12 safe home STEM experiments.',
        priceEGP: 580,
        priceSAR: 135,
        origEGP: 720,
        origSAR: 165,
        rating: '4.9',
        reviews: 198,
        city: 'القاهرة / الرياض',
        age: '5-8',
        tag: 'bestseller',
        variants: ['إصدار المجموعة الشمسية 3D', 'إصدار التجارب المغناطيسية'],
      },
      {
        nameAr: 'دراجة التوازن الخشبية الآمنة مع خوذة حماية مبطنة',
        nameEn: 'Safe Wooden Balance Bike with Padded Helmet',
        descAr: 'بتعلم طفلك التوازن والثقة بالنفس من غير بدالات، بعجل صامت آمن للسيراميك والجنينة.',
        descEn: 'Pedal-free balance bike with silent EVA tires and safety helmet.',
        priceEGP: 1450,
        priceSAR: 320,
        origEGP: 1750,
        origSAR: 390,
        rating: '4.9',
        reviews: 246,
        city: 'القاهرة / جدة / الرياض',
        age: '2-5',
        tag: 'bestseller',
        variants: ['لون تيل أكوا + خوذة', 'لون مرجاني دافئ + خوذة'],
      },
      {
        nameAr: 'برج التعلم الخشبي المساعد للطفل في المطبخ (Montessori Tower)',
        nameEn: 'Foldable Wooden Montessori Kitchen Helper Tower',
        descAr: 'بيخلي طفلك يقف بأمان جنبك في المطبخ أو عند الحوض عشان يغسل إيده ويشاركك تحضير الأكل.',
        descEn: 'Safe adjustable wooden standing tower for kitchen and sink independence.',
        priceEGP: 1890,
        priceSAR: 410,
        origEGP: 2200,
        origSAR: 480,
        rating: '5.0',
        reviews: 312,
        city: 'القاهرة / الإسكندرية / الرياض',
        age: '2-5',
        tag: 'recommended',
        variants: ['خشب زان طبيعي قابل للطي', 'أبيض كلاسيكي مضاد للمياه'],
      },
      {
        nameAr: 'لوحة الأنشطة الحسية الذكية (Busy Board) بـ 18 مهارة',
        nameEn: 'Sensory Montessori Busy Board (18 Activities)',
        descAr: 'بتقوي عضلات الإيد الدقيقة والتركيز: سحاب، زراير، تروس، وأقفال آمنة بتشغل الطفل بعيد عن الموبايل.',
        descEn: 'Fine-motor activity board with zippers, gears, latches, and shoelaces.',
        priceEGP: 490,
        priceSAR: 115,
        rating: '4.8',
        reviews: 174,
        city: 'القاهرة / الجيزة',
        age: '0-2',
        tag: 'new',
        variants: ['مقاس السفر المحمول', 'المقاس الكبير لغرفة اللعب'],
      },
      {
        nameAr: 'مكعبات البناء المغناطيسية الشفافة الملونة (100 قطعة)',
        nameEn: 'Magnetic Translucent Building Tiles (100 pcs)',
        descAr: 'قطع مغناطيسية قوية لبناء القلاع والأشكال الهندسية ثلاثية الأبعاد وتنمية الخيال المكاني.',
        descEn: '100-piece 3D magnetic architectural tiles for creative STEM play.',
        priceEGP: 960,
        priceSAR: 215,
        origEGP: 1180,
        origSAR: 260,
        rating: '4.9',
        reviews: 289,
        city: 'مصر والسعودية',
        age: '2-5',
        tag: 'deal',
        variants: ['بوكس 100 قطعة + عجلات سيارة', 'بوكس 140 قطعة العائلي'],
      },
      {
        nameAr: 'صندوق المسرح المنزلي والعرائس القماشية التفاعلية',
        nameEn: 'Interactive Puppet Theater & Storytelling Box',
        descAr: 'مسرح عرائس مع 5 شخصيات قماشية ناعمة وكروت حكايات لتشجيع طفلك يعبر عن مشاعره ويحكي قصص.',
        descEn: 'Plush hand-puppet theater with bilingual storytelling prompt cards.',
        priceEGP: 510,
        priceSAR: 118,
        rating: '4.8',
        reviews: 127,
        city: 'القاهرة / المنصورة',
        age: '2-5',
        tag: 'recommended',
        variants: ['عرائس حيوانات الغابة', 'عرائس العائلة والمهن'],
      },
      {
        nameAr: 'لعبة فرز الألوان والعد بالكرات الخشبية والملاقط',
        nameEn: 'Wooden Rainbow Color Sorting & Counting Game',
        descAr: 'لعبة مونتيسوري ممتازة لتقوية مسكة القلم والتركيز البصري وتعلم الجمع والطرح ببساطة.',
        descEn: 'Montessori pincer-grip training and early math color sorting bowls.',
        priceEGP: 310,
        priceSAR: 75,
        rating: '4.9',
        reviews: 163,
        city: 'القاهرة / الإسكندرية',
        age: '2-5',
        tag: 'bestseller',
        variants: ['نسخة قوس قزح الكاملة', 'نسخة الأرقام والفواكه'],
      },
      {
        nameAr: 'مطبخ الأطفال الخشبي التفاعلي كامل الإكسسوارات',
        nameEn: 'Interactive Wooden Play Kitchen with Utensils',
        descAr: 'مطبخ خشبي شيك بأزرار بتلف وحنفية وأواني خشبية عشان طفلك يعيش دور الشيف الصغير بأمان.',
        descEn: 'Pretend-play wooden kitchen with clicking knobs and wooden cookware.',
        priceEGP: 2450,
        priceSAR: 540,
        origEGP: 2850,
        origSAR: 620,
        rating: '4.9',
        reviews: 148,
        city: 'القاهرة الجديدة / الرياض',
        age: '2-5',
        tag: 'deal',
        variants: ['لون خشبي وتيل نعناعي', 'لون أبيض وروز هادئ'],
      },
      {
        nameAr: 'بازل خريطة مصر والعالم العربي الخشبي البارز',
        nameEn: '3D Wooden Egypt & Arab World Map Puzzle',
        descAr: 'عرف طفلك على محافظات مصر والدول العربية ومعالمها بطريقة ممتعة وتفاعلية باللمس.',
        descEn: 'Educational tactile wooden puzzle of Egypt governorates & Arab countries.',
        priceEGP: 360,
        priceSAR: 85,
        rating: '4.8',
        reviews: 112,
        city: 'القاهرة / الجيزة / الإسكندرية',
        age: '5-8',
        tag: 'new',
        variants: ['خريطة مصر والمحافظات', 'خريطة الوطن العربي والعالم'],
      },
      {
        nameAr: 'مجموعة الصلصال الطبيعي الآمن وأدوات التشكيل (12 لون)',
        nameEn: 'Organic Wheat-Based Safe Playdough Kit (12 Colors)',
        descAr: 'صلصال طبيعي من مكونات غذائية آمنة 100% وملمس ناعم مابيلزقش في الإيد مع قوالب تشكيل مبهجة.',
        descEn: '100% food-grade non-sticky sensory dough with wooden rollers and cutters.',
        priceEGP: 265,
        priceSAR: 62,
        rating: '4.9',
        reviews: 204,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['باقة 12 لون + 15 أداة', 'باقة 24 لون الحجم العائلي'],
      },
      {
        nameAr: 'قوس التسلق والهزاز الخشبي لتنمية المهارات الحركية (Pikler Arch)',
        nameEn: 'Montessori Wooden Climbing Arch & Rocker Cushion',
        descAr: 'مثلث وقوس تسلق خشبي مع مخدة قطنية مريحة بيتحول لمرجيحة هزازة أو ركن قراءة دافي.',
        descEn: 'Multi-use Montessori climbing arch and plush rocker with organic cotton cushion.',
        priceEGP: 2150,
        priceSAR: 475,
        rating: '5.0',
        reviews: 95,
        city: 'القاهرة / الشيخ زايد / الرياض',
        age: '0-2',
        tag: 'recommended',
        variants: ['شامل وسادة قطنية بيج', 'شامل وسادة قطنية تيل'],
      },
    ],
  },
  {
    category: 'nursery',
    categoryLabel: 'حضانات ومدارس',
    emoji: '📚',
    kind: 'service',
    sellerAr: 'شبكة الحضانات والمدارس المعتمدة',
    deliveryAr: 'حجز زيارة مجانية ومقابلة تقييم فورية',
    deliveryEn: 'Free campus tour & instant assessment',
    items: [
      {
        nameAr: 'مدرسة وروضة رواد المستقبل الدولية (KG1 – Grade 3)',
        nameEn: 'Future Pioneers International School (KG1–G3)',
        descAr: 'منهج دولي معتمد بيجمع بين اللغات، الروبوتكس، والرياضة مع فصول ذكية بحد أقصى 16 طفل.',
        descEn: 'Accredited international school blending languages, STEM robotics, and sports.',
        priceEGP: 5400,
        priceSAR: 2100,
        rating: '4.9',
        reviews: 168,
        city: 'القاهرة الجديدة / الرياض',
        age: '5-8',
        tag: 'recommended',
        variants: ['مرحلة التمهيدي (KG1–KG2)', 'المرحلة الابتدائية التأسيسية'],
      },
      {
        nameAr: 'حضانة وأكاديمية مونتيسوري الإبداعية للطفولة المبكرة',
        nameEn: 'Creative Montessori Early Childhood Academy',
        descAr: 'بيئة مونتيسوري حقيقية بتنمي الاستقلالية والنطق المبكر مع أخصائيات تخاطب مقيمات.',
        descEn: 'Authentic Montessori nursery with in-house speech and sensory specialists.',
        priceEGP: 3400,
        priceSAR: 1450,
        rating: '4.8',
        reviews: 119,
        city: 'الشيخ زايد / الإسكندرية / جدة',
        age: '0-2',
        tag: 'bestseller',
        variants: ['برنامج الرضع (6–24 شهر)', 'برنامج البستان الحسي (2–4 سنوات)'],
      },
      {
        nameAr: 'حضانة نسمات الطفولة ثنائية اللغة (عربي / إنجليزي / فرنسي)',
        nameEn: 'Breezes Trilingual Preschool & Nursery',
        descAr: 'حديقة مفتوحة مشمسة، أكل صحي بيتحضر يومياً، وكاميرات متابعة تطمن قلبك طول اليوم.',
        descEn: 'Trilingual preschool with sunny outdoor garden and fresh organic meals.',
        priceEGP: 3200,
        priceSAR: 1380,
        rating: '4.9',
        reviews: 154,
        city: 'المعادي / القاهرة',
        age: '2-5',
        tag: 'bestseller',
        variants: ['قسم الإنجليزي والمونتيسوري', 'قسم الفرنسي التفاعلي'],
      },
      {
        nameAr: 'روضة ومدرسة الواحة الخضراء للغات والعلوم',
        nameEn: 'Green Oasis Language & Science Preschool',
        descAr: 'تركيز خاص على التجارب العلمية، الزراعة للأطفال، وبناء الشخصية القيادية بدون ضغط.',
        descEn: 'Eco-friendly preschool focusing on outdoor nature play and early science.',
        priceEGP: 4600,
        priceSAR: 1850,
        rating: '4.8',
        reviews: 132,
        city: 'الشيخ زايد / 6 أكتوبر',
        age: '5-8',
        tag: 'new',
        variants: ['يوم دراسي كامل + وجبتين', 'يوم دراسي + باص مكيف لباب البيت'],
      },
      {
        nameAr: 'حضانة بيت العصافير لرعاية الرضع وحديثي الولادة',
        nameEn: 'Little Birds Infant Care & Nursery Center',
        descAr: 'رعاية فائقة للرضع من عمر 3 شهور مع ممرضات متخصصات وغرف نوم هادية ومعقمة بالكامل.',
        descEn: 'Specialized infant care from 3 months with certified pediatric nurses.',
        priceEGP: 2950,
        priceSAR: 1250,
        rating: '4.9',
        reviews: 208,
        city: 'مصر الجديدة / مدينة نصر',
        age: '0-2',
        tag: 'recommended',
        variants: ['باقة 5 أيام أسبوعياً', 'باقة 3 أيام مرنة للأمهات العاملات'],
      },
      {
        nameAr: 'أكاديمية النيل الدولية للتمهيدي وتأسيس القراءة والقرآن',
        nameEn: 'Nile Foundation Academy for Pre-K & Values',
        descAr: 'تأسيس ممتاز في العربي والإنجليزي والحساب الذهني مع غرس القيم والأخلاق بالحكايات المبهجة.',
        descEn: 'Strong bilingual literacy, mental math, and character building.',
        priceEGP: 2700,
        priceSAR: 1120,
        rating: '4.9',
        reviews: 276,
        city: 'الجيزة / الدقي / المهندسين',
        age: '2-5',
        tag: 'bestseller',
        variants: ['فترة صباحية (8 ص – 2 م)', 'فترة ممتدة حتى 5 مساءً'],
      },
      {
        nameAr: 'حضانة فنون وألوان (Art & Sensory Preschool)',
        nameEn: 'Arts & Sensory Discovery Preschool',
        descAr: 'كل يوم ورشة فنية جديدة: خزف، رسم، مسرح، وموسيقى لتفريغ طاقة الطفل وتنمية إبداعه.',
        descEn: 'Reggio Emilia inspired preschool with daily pottery, music, and painting studios.',
        priceEGP: 3100,
        priceSAR: 1320,
        rating: '4.7',
        reviews: 88,
        city: 'الإسكندرية / سموحة / كفر عبده',
        age: '2-5',
        tag: 'new',
        variants: ['اشتراك شهري شامل الخامات', 'باقة الأخوين بخصم 15%'],
      },
      {
        nameAr: 'مدرسة المستقبل الألمانية الدولية لرياض الأطفال',
        nameEn: 'Deutsche Zukunft Kindergarten & Primary',
        descAr: 'تأسيس ألماني وإنجليزي بأحدث طرق التعليم باللعب وتنمية الاعتماد على النفس والنظام.',
        descEn: 'German & English immersion kindergarten focused on structure and discovery.',
        priceEGP: 6200,
        priceSAR: 2450,
        rating: '4.9',
        reviews: 141,
        city: 'التجمع الخامس / القاهرة الجديدة',
        age: '5-8',
        tag: 'recommended',
        variants: ['مرحلة الحضانة التمهيدية', 'مرحلة KG1 / KG2'],
      },
      {
        nameAr: 'حضانة خطوة أمان لدمج وتنمية المهارات والتخاطب',
        nameEn: 'Safe Step Speech & Developmental Inclusion Nursery',
        descAr: 'فريق متكامل من أخصائيي التخاطب وتنمية المهارات وتكامل الحواس لمتابعة طفلك خطوة بخطوة.',
        descEn: 'Specialized developmental nursery with daily speech and occupational therapy.',
        priceEGP: 3600,
        priceSAR: 1520,
        rating: '5.0',
        reviews: 193,
        city: 'المنصورة / طنطا / القاهرة',
        age: '2-5',
        tag: 'bestseller',
        variants: ['برنامج رعاية نهارية + جلسات تخاطب', 'برنامج تأهيلي مكثف لما قبل المدرسة'],
      },
      {
        nameAr: 'نادي وحضانة الشمس المشرقة المسائية ونهاية الأسبوع',
        nameEn: 'Rising Sun Evening & Weekend Drop-In Nursery',
        descAr: 'حضانة مرنة بالساعة أو اليوم في الفترات المسائية والويك إند عشان ماما وبابا ياخدوا وقت راحة وهما مطمنين.',
        descEn: 'Flexible evening and weekend drop-in child care with creative play.',
        priceEGP: 1850,
        priceSAR: 790,
        rating: '4.8',
        reviews: 109,
        city: 'القاهرة / الرياض / جدة',
        age: '2-5',
        tag: 'deal',
        variants: ['باقة 20 ساعة مرنة شهرياً', 'باقة نهاية الأسبوع الشاملة'],
      },
      {
        nameAr: 'أكاديمية بناة الغد لتأهيل الأطفال لاختبارات القبول بالمدارس',
        nameEn: 'Tomorrow Builders School Readiness Bootcamp',
        descAr: 'برنامج عملي لطيف بيجهز الطفل نفسياً وأكاديمياً لانترفيو المدارس الدولية واللغات من غير توتر.',
        descEn: 'Confidence-boosting school interview readiness program for children and parents.',
        priceEGP: 2400,
        priceSAR: 980,
        rating: '4.9',
        reviews: 162,
        city: 'القاهرة / الجيزة / الإسكندرية',
        age: '2-5',
        tag: 'recommended',
        variants: ['كورس مكثف 6 أسابيع', 'تقييم فردي + خطة تأسيس منزلية'],
      },
    ],
  },
  {
    category: 'doctor',
    categoryLabel: 'أطباء أطفال',
    emoji: '🩺',
    kind: 'service',
    sellerAr: 'شبكة الأطباء والاستشاريين المعتمدين',
    deliveryAr: 'حجز فوري وتأكيد الميعاد برسالة SMS',
    deliveryEn: 'Instant booking & SMS confirmation',
    items: [
      {
        nameAr: 'د. سلمى الكيلاني — استشاري طب الأطفال وحديثي الولادة والرضاعة الطبيعية',
        nameEn: 'Dr. Salma El-Kilany — Consultant Pediatrician & Lactation Specialist',
        descAr: 'خبرة 15 سنة في متابعة حديثي الولادة، دعم الرضاعة الطبيعية، وعلاج المغص واضطرابات النوم عند الرضع.',
        descEn: '15+ years experience in newborn care, lactation support, and infant sleep.',
        priceEGP: 500,
        priceSAR: 195,
        rating: '5.0',
        reviews: 412,
        city: 'المعادي / القاهرة الجديدة',
        age: '0-2',
        tag: 'bestseller',
        variants: ['كشف عيادة شامل', 'استشارة رضاعة طبيعية وتغذية أونلاين'],
      },
      {
        nameAr: 'مركز د. كريم فؤاد لطب أسنان الأطفال بدون ألم',
        nameEn: 'Dr. Karim Fouad Pain-Free Pediatric Dental Clinic',
        descAr: 'عيادة أسنان مجهزة بشاشات كرتون وهدايا عشان طفلك يعالج أسنانه ويعمل جلسات الفلورايد وهو مبسوط.',
        descEn: 'Kid-friendly dental clinic offering fluoride varnish and gentle cavity care.',
        priceEGP: 400,
        priceSAR: 165,
        rating: '4.9',
        reviews: 284,
        city: 'الشيخ زايد / المهندسين',
        age: '2-5',
        tag: 'recommended',
        variants: ['فحص شامل + جلسة فلورايد وقائية', 'علاج وحشو تجميلي للأطفال'],
      },
      {
        nameAr: 'د. هاني عبد الرحمن — استشاري حساسية الصدر والمناعة عند الأطفال',
        nameEn: 'Dr. Hany Abdelrahman — Pediatric Allergy & Immunology Consultant',
        descAr: 'تشخيص وعلاج حساسية الصدر، الجيوب الأنفية، وحساسية الألبان والطعام بخطط وقائية تريح الطفل.',
        descEn: 'Specialized care for childhood asthma, food allergies, and immune boosting.',
        priceEGP: 550,
        priceSAR: 215,
        rating: '4.9',
        reviews: 339,
        city: 'مصر الجديدة / مدينة نصر',
        age: 'all',
        tag: 'bestseller',
        variants: ['كشف حساسية ومناعة + اختبار تنفس', 'متابعة خطة العلاج الوقائي'],
      },
      {
        nameAr: 'عيادة د. نهى الشاذلي لتغذية الأطفال وعلاج النحافة وفقدان الشهية',
        nameEn: 'Dr. Noha El-Shazly Pediatric Clinical Nutrition Clinic',
        descAr: 'جداول أكل واقعية من أكل البيت لعلاج الأنيميا، ضعف الشهية، والانتقائية في الأكل عند الأطفال.',
        descEn: 'Practical family meal plans for picky eaters, anemia, and healthy child growth.',
        priceEGP: 420,
        priceSAR: 170,
        rating: '4.8',
        reviews: 197,
        city: 'الإسكندرية / القاهرة / أونلاين',
        age: '2-5',
        tag: 'recommended',
        variants: ['كشف + تحليل مكونات الجسم InBody للأطفال', 'متابعة تغذية شهرية أونلاين'],
      },
      {
        nameAr: 'د. عمرو الجندي — استشاري عيون الأطفال والحول والكشف المبكر',
        nameEn: 'Dr. Amr El-Gendy — Pediatric Ophthalmology Specialist',
        descAr: 'فحص قاع العين وقياس النظر بأجهزة حديثة مخصصة للأطفال قبل دخول الحضانة والمدرسة.',
        descEn: 'Specialized pediatric vision screening and strabismus care.',
        priceEGP: 480,
        priceSAR: 190,
        rating: '4.9',
        reviews: 156,
        city: 'الدقي / القاهرة الجديدة',
        age: '2-5',
        tag: 'new',
        variants: ['فحص نظر شامل لما قبل المدرسة', 'كشف ومتابعة بالعيادة'],
      },
      {
        nameAr: 'مركز خطوات للتخاطب وتنمية المهارات وتعديل السلوك',
        nameEn: 'Steps Center for Speech Therapy & Child Development',
        descAr: 'جلسات فردية لتأخر الكلام، لدغات الحروف، وزيادة التركيز والانتباه مع تقييم شامل معتمد.',
        descEn: 'Individual speech therapy, articulation, and attention enhancement sessions.',
        priceEGP: 350,
        priceSAR: 140,
        rating: '4.9',
        reviews: 268,
        city: 'القاهرة / المنصورة / الرياض',
        age: '2-5',
        tag: 'bestseller',
        variants: ['جلسة تقييم شامل + خطة علاجية', 'باقة 8 جلسات تخاطب فردية'],
      },
      {
        nameAr: 'د. مروة زكي — أخصائي جلدية الأطفال وعلاج الإكزيما والحساسية',
        nameEn: 'Dr. Marwa Zaki — Pediatric Dermatology & Eczema Specialist',
        descAr: 'عناية لطيفة ببشرة الرضع والأطفال، علاج الإكزيما، التهابات الحفاض، وحساسية الجلد الموسمية.',
        descEn: 'Gentle dermatological care for baby eczema, rashes, and sensitive skin.',
        priceEGP: 430,
        priceSAR: 175,
        rating: '4.8',
        reviews: 143,
        city: 'الشيخ زايد / الجيزة',
        age: '0-2',
        tag: 'recommended',
        variants: ['كشف عيادة جلدية أطفال', 'استشارة مصورة سريعة أونلاين'],
      },
      {
        nameAr: 'خدمة زيارة طبيب أطفال استشاري للمنزل (كشف منزلي آمن)',
        nameEn: 'Home Visit by Certified Pediatric Specialist',
        descAr: 'لو طفلك تعبان بالليل أو الجو برد، دكتور أطفال متخصص يجيلك لحد البيت مع كامل أدوات الفحص المعقمة.',
        descEn: 'Safe at-home pediatric checkup so your sick child rests comfortably at home.',
        priceEGP: 950,
        priceSAR: 360,
        origEGP: 1200,
        origSAR: 450,
        rating: '5.0',
        reviews: 221,
        city: 'القاهرة الكبرى / الإسكندرية / الرياض',
        age: 'all',
        tag: 'deal',
        variants: ['زيارة منزلية خلال ساعتين', 'زيارة مجدولة في نفس اليوم'],
      },
      {
        nameAr: 'د. يوسف علام — استشاري أنف وأذن وحنجرة وسمعيات الأطفال',
        nameEn: 'Dr. Youssef Allam — Pediatric ENT & Audiology Consultant',
        descAr: 'علاج التهابات الأذن الوسطى المتكررة، اللحمية، واللوزتين مع مقياس سمع دقيق للأطفال.',
        descEn: 'Pediatric ENT specialist for ear infections, adenoids, and hearing checks.',
        priceEGP: 460,
        priceSAR: 185,
        rating: '4.8',
        reviews: 179,
        city: 'مصر الجديدة / المعادي',
        age: '2-5',
        tag: 'new',
        variants: ['كشف أنف وأذن + منظار مرن لطيف', 'كشف + اختبار ضغط الأذن'],
      },
      {
        nameAr: 'باقة الفحص الدوري الشامل للطفل (تحاليل الأنيميا وفيتامين د والكالسيوم)',
        nameEn: 'Comprehensive Child Wellness Lab Checkup Package',
        descAr: 'سحب عينة منزلي بدون ألم على إيد تمريض متخصص للأطفال للاطمئنان على الحديد وفيتامين د والمناعة.',
        descEn: 'Gentle home blood draw for kids checking Iron, Ferritin, Vitamin D, and Calcium.',
        priceEGP: 680,
        priceSAR: 250,
        origEGP: 890,
        origSAR: 330,
        rating: '4.9',
        reviews: 305,
        city: 'كل المدن (زيارة منزلية مجانية)',
        age: 'all',
        tag: 'deal',
        variants: ['باقة الاطمئنان الأساسية (6 تحاليل)', 'باقة النمو الشاملة (10 تحاليل)'],
      },
      {
        nameAr: 'د. رانيا حسان — استشاري عظام الأطفال وتقوس الساقين والمشي',
        nameEn: 'Dr. Rania Hassan — Pediatric Orthopedics & Gait Specialist',
        descAr: 'متابعة تطور المشي، الفلات فوت، وتقوس الساقين عند الأطفال بخطط علاج طبيعي وتمارين بسيطة.',
        descEn: 'Pediatric orthopedic checkups for early walkers, flat feet, and posture.',
        priceEGP: 490,
        priceSAR: 195,
        rating: '4.9',
        reviews: 134,
        city: 'المهندسين / التجمع الخامس',
        age: '0-2',
        tag: 'recommended',
        variants: ['كشف عظام أطفال وتقييم المشي', 'متابعة بعد التمارين'],
      },
    ],
  },
  {
    category: 'clothing',
    categoryLabel: 'ألبسة قطنية',
    emoji: '👗',
    kind: 'product',
    sellerAr: 'دار القطن المصري الطبيعي للطفل',
    deliveryAr: 'توصيل خلال 24–48 ساعة مع إمكانية الاستبدال المجاني',
    deliveryEn: '24–48h delivery with free size exchange',
    items: [
      {
        nameAr: 'طقم بيجاما نوم قطنية ناعمة برسومات الفضاء والنجوم',
        nameEn: 'Cozy Starlight Organic Cotton Sleepwear Set',
        descAr: 'بيجاما قطن مصري صافي بتمتص العرق وتخلي طفلك ينام مرتاح ودافي طول الليل من غير أستك يشد على بطنه.',
        descEn: 'Ultra-soft breathable cotton pajama set with gentle comfort waistband.',
        priceEGP: 490,
        priceSAR: 115,
        origEGP: 590,
        origSAR: 140,
        rating: '4.9',
        reviews: 256,
        city: 'القاهرة / الرياض',
        age: '2-5',
        tag: 'bestseller',
        variants: ['مقاس 2–3 سنوات', 'مقاس 4–5 سنوات', 'مقاس 6–8 سنوات'],
      },
      {
        nameAr: 'حذاء خطوات الطفل الأول الطبي المرن ومانع الانزلاق',
        nameEn: 'Ergonomic First-Steps Non-Slip Toddler Shoes',
        descAr: 'جزمة خفيفة ومرنة بتدعم مشط الرجل الطبيعي وبتحمي طفلك من الزحلقة وهو بيجري في الحضانة والنادي.',
        descEn: 'Lightweight orthopedic toddler shoes with flexible anti-slip rubber sole.',
        priceEGP: 780,
        priceSAR: 175,
        rating: '4.8',
        reviews: 184,
        city: 'القاهرة / جدة / الرياض',
        age: '0-2',
        tag: 'recommended',
        variants: ['مقاس 20–22 (أبيض وتيل)', 'مقاس 23–25 (مرجاني دافئ)', 'مقاس 26–28 (كحلي)'],
      },
      {
        nameAr: 'جاكيت خفيف مبطن قطن ومقاوم للهواء والمطر للمدرسة والخروجات',
        nameEn: 'Lightweight Quilted Windproof Kids Jacket',
        descAr: 'جاكيت شيك وخفيف ببطانة قطنية ناعمة وزعبوط بيتفك، مثالي لنزول المدرسة والحضانة الصبح بدري.',
        descEn: 'Stylish quilted jacket with warm cotton lining and detachable hood.',
        priceEGP: 920,
        priceSAR: 210,
        origEGP: 1100,
        origSAR: 255,
        rating: '4.9',
        reviews: 143,
        city: 'مصر والسعودية',
        age: '5-8',
        tag: 'deal',
        variants: ['مقاس 3–4 سنوات', 'مقاس 5–6 سنوات', 'مقاس 7–8 سنوات'],
      },
      {
        nameAr: 'باقة 5 سالوبيتات قطن بيور للبيبي بكباسين آمنة (0–24 شهر)',
        nameEn: '5-Pack Pure Egyptian Cotton Baby Bodysuits',
        descAr: 'أساسي في دولاب كل بيبي: 5 قطع قطن صافي مضاد للحساسية بكباسين خالية من النيكل سهلة الغيار.',
        descEn: '5-pack hypoallergenic organic cotton bodysuits with nickel-free snaps.',
        priceEGP: 690,
        priceSAR: 155,
        origEGP: 850,
        origSAR: 190,
        rating: '5.0',
        reviews: 342,
        city: 'كل المدن',
        age: '0-2',
        tag: 'bestseller',
        variants: ['مقاس 0–6 شهور', 'مقاس 6–12 شهر', 'مقاس 12–24 شهر'],
      },
      {
        nameAr: 'فستان بناتي قطن كتان ناعم بألوان الباستيل للخروجات وأعياد الميلاد',
        nameEn: 'Pastel Linen-Cotton Girls Party & Outing Dress',
        descAr: 'فستان رقيق ومبهج بقصة واسعة مريحة للعب والتصوير في المناسبات العائلية وأعياد الميلاد.',
        descEn: 'Breathable pastel linen-cotton dress with twirl-friendly skirt.',
        priceEGP: 740,
        priceSAR: 168,
        rating: '4.9',
        reviews: 167,
        city: 'القاهرة / الإسكندرية / جدة',
        age: '2-5',
        tag: 'new',
        variants: ['وردي مشمشي (2–4 سنوات)', 'أكوا نعناعي (4–6 سنوات)', 'أوف وايت (6–8 سنوات)'],
      },
      {
        nameAr: 'ترينج رياضي قطن ميلتون مريح للنادي والحضانة (سويت شيرت وبنطلون)',
        nameEn: 'Soft Cotton French-Terry Kids Tracksuit Set',
        descAr: 'طقم عملي جداً للتمرين والحضانة بجيوب بسوستة وركب مقواة تستحمل الجري واللعب اليومي.',
        descEn: 'Durable cotton French-terry tracksuit with reinforced knees for active play.',
        priceEGP: 810,
        priceSAR: 182,
        rating: '4.8',
        reviews: 219,
        city: 'القاهرة / المنصورة / الرياض',
        age: '5-8',
        tag: 'bestseller',
        variants: ['تيل غامق × أبيض', 'مرجاني × كحلي', 'رمادي هادئ × أصفر'],
      },
      {
        nameAr: 'كيس نوم الرضع القطني الآمن بديل البطانية (Baby Sleeping Bag)',
        nameEn: 'Wearable Organic Cotton Baby Sleep Sack (TOG 1.5)',
        descAr: 'بيحافظ على دفا البيبي طول الليل من غير ما الغطا يتزحلق أو يضايق نفسه، بسوستة مزدوجة لتغيير الحفاض بسهولة.',
        descEn: 'Safe wearable sleep sack keeping babies warm without loose blankets.',
        priceEGP: 620,
        priceSAR: 140,
        rating: '4.9',
        reviews: 191,
        city: 'القاهرة / الجيزة / الرياض',
        age: '0-2',
        tag: 'recommended',
        variants: ['مقاس 0–6 شهور', 'مقاس 6–18 شهر', 'مقاس 18–36 شهر'],
      },
      {
        nameAr: 'مجموعة 6 شرابات قطنية مانعة للانزلاق بنعل سيليكون للبيت',
        nameEn: '6-Pack Anti-Slip Silicone Grip Cotton Socks',
        descAr: 'شرابات قطن ناعمة بنقط سيليكون من تحت تمنع زحلقة الطفل على السيراميك والباركيه.',
        descEn: 'Breathable cotton crew socks with full-sole silicone anti-slip grips.',
        priceEGP: 280,
        priceSAR: 65,
        rating: '4.9',
        reviews: 310,
        city: 'كل المدن',
        age: '0-2',
        tag: 'bestseller',
        variants: ['مقاس 1–3 سنوات', 'مقاس 3–6 سنوات'],
      },
      {
        nameAr: 'طقم بحر وحمام سباحة واقي من الشمس (UPF 50+) سريع الجفاف',
        nameEn: 'UPF 50+ Sun-Protective Kids Swimwear & Hat Set',
        descAr: 'بدلة سباحة مع كاب لحماية رقبة وبشرة طفلك من أشعة الشمس في المصيف وتمرين السباحة.',
        descEn: 'UV-blocking rashguard swim set with neck-flap sun hat.',
        priceEGP: 680,
        priceSAR: 155,
        origEGP: 840,
        origSAR: 190,
        rating: '4.8',
        reviews: 129,
        city: 'الإسكندرية / القاهرة / جدة',
        age: '2-5',
        tag: 'deal',
        variants: ['رسومات الدولفين الأزرق', 'رسومات المرجان الوردي'],
      },
      {
        nameAr: 'برنس حمام قطن فوطة فائق الامتصاص بغطاء رأس أرنوب لطيف',
        nameEn: 'Plush Hooded Organic Terry Cotton Bathrobe',
        descAr: 'فوطة وبرنس قطن تقيل وطري ينشف طفلك في ثواني بعد الاستحمام أو البسين ويحميه من لطشة الهوا.',
        descEn: 'Ultra-absorbent Turkish & Egyptian cotton hooded bathrobe for kids.',
        priceEGP: 560,
        priceSAR: 128,
        rating: '4.9',
        reviews: 175,
        city: 'مصر والسعودية',
        age: '2-5',
        tag: 'new',
        variants: ['مقاس 1–3 سنوات', 'مقاس 4–7 سنوات'],
      },
      {
        nameAr: 'طقم ملابس داخلية قطن مصري مسرح فائق النعومة (6 قطع)',
        nameEn: '6-Piece Combed Egyptian Cotton Underwear Set',
        descAr: 'قطن مصري مسرح ناعم بدون تيكت داخلي يضايق جلد الطفل، مثالي للبشرة الحساسة في الصيف والشتاء.',
        descEn: 'Tagless combed Egyptian cotton undershirts and briefs for sensitive skin.',
        priceEGP: 520,
        priceSAR: 118,
        rating: '5.0',
        reviews: 288,
        city: 'كل المدن',
        age: '5-8',
        tag: 'bestseller',
        variants: ['مقاس 2–4 سنوات', 'مقاس 4–6 سنوات', 'مقاس 6–8 سنوات'],
      },
    ],
  },
  {
    category: 'essentials',
    categoryLabel: 'مستلزمات عائلية',
    emoji: '🍼',
    kind: 'product',
    sellerAr: 'شركاء العناية بالطفل والأسرة',
    deliveryAr: 'توصيل سريع خلال 24 ساعة',
    deliveryEn: 'Express 24-hour delivery',
    items: [
      {
        nameAr: 'شنطة ظهر تنظيم مستلزمات البيبي الذكية ومفرش الغيار المحمول',
        nameEn: 'Smart Baby Care Organizer Backpack & Changing Pad',
        descAr: 'شنطة شيك ومريحة لضهر ماما وبابا، فيها 3 جيوب حرارية للرضعات ومفرش غيار وتربروف وخطافات للعربية.',
        descEn: 'Ergonomic parent backpack with 3 thermal bottle pockets and stroller straps.',
        priceEGP: 1120,
        priceSAR: 245,
        origEGP: 1350,
        origSAR: 295,
        rating: '4.9',
        reviews: 264,
        city: 'القاهرة / الرياض / الدمام',
        age: '0-2',
        tag: 'bestseller',
        variants: ['رمادي أردوازي فاخر', 'تيل كحلي عصري', 'وردي رملي دافئ'],
      },
      {
        nameAr: 'طقم أدوات الأكل السيليكون الطبي الآمن للرضع (8 قطع بقاعدة شفط)',
        nameEn: 'Medical-Grade Silicone Baby Feeding Set (8 pcs)',
        descAr: 'طبق مقسم بيلزق في الترابيزة عشان مايتقلبش، مع معالق طرية للثة البيبي وكوباية تدريب مانعة للانسكاب.',
        descEn: 'Suction-base divided plate, soft gum spoons, and spill-proof cup.',
        priceEGP: 460,
        priceSAR: 105,
        rating: '4.9',
        reviews: 198,
        city: 'مصر والسعودية',
        age: '0-2',
        tag: 'bestseller',
        variants: ['تيل نعناعي', 'مرجاني مشمشي', 'أزرق سماوي'],
      },
      {
        nameAr: 'عربية أطفال خفيفة قابلة للطي بيد واحدة ومناسبة للسفر والطيارة',
        nameEn: 'One-Hand Fold Ultra-Compact Travel Stroller',
        descAr: 'بتتطبق في ثانية واحدة وبتتعلق على الكتف، بكرسي مبطن بيرجع لورا للنوم المريح ومظلة شمس كبيرة.',
        descEn: 'Cabin-approved lightweight stroller with full-recline seat and UV canopy.',
        priceEGP: 4850,
        priceSAR: 980,
        origEGP: 5600,
        origSAR: 1150,
        rating: '4.9',
        reviews: 176,
        city: 'القاهرة / الإسكندرية / الرياض',
        age: '0-2',
        tag: 'deal',
        variants: ['أسود فحمي × إطار ذهبي', 'تيل بترولي × إطار فضي'],
      },
      {
        nameAr: 'جهاز تعقيم وتجفيف الببرونات بالبخار السريع (يسع 6 ببرونات)',
        nameEn: '6-Bottle Express Steam Sterilizer & Dryer',
        descAr: 'بيعقم الببرونات والتيتينات وأدوات الأكل بالبخار الطبيعي في 8 دقائق ويقضي على 99.9% من الجراثيم.',
        descEn: 'Eliminates 99.9% of germs in 8 minutes with HEPA-filtered hot air drying.',
        priceEGP: 1950,
        priceSAR: 420,
        rating: '4.9',
        reviews: 152,
        city: 'القاهرة / جدة / الرياض',
        age: '0-2',
        tag: 'recommended',
        variants: ['إصدار التعقيم والتجفيف التلقائي', 'إصدار التعقيم وتدفئة اللبن 2×1'],
      },
      {
        nameAr: 'كاميرا مراقبة البيبي الذكية بالرؤية الليلية وتشغيل التهويدات',
        nameEn: 'Smart HD Night-Vision Baby Monitor with Lullabies',
        descAr: 'شاشة مستقلة آمنة بدون الحاجة للواي فاي، بتقيس حرارة الأوضة وتنبهك لو البيبي صحي أو بكي.',
        descEn: 'Secure FHSS video baby monitor with room temperature sensor and two-way talk.',
        priceEGP: 2350,
        priceSAR: 495,
        origEGP: 2790,
        origSAR: 590,
        rating: '4.8',
        reviews: 141,
        city: 'كل المدن',
        age: '0-2',
        tag: 'deal',
        variants: ['شاشة 5 بوصة عالية الوضوح', 'شاشة + كاميرا إضافية لغرفة ثانية'],
      },
      {
        nameAr: 'شيالة البيبي الطبية المريحة للظهر والحوض (Ergonomic Baby Carrier)',
        nameEn: 'Ergonomic Hip-Healthy Mesh Baby Carrier',
        descAr: 'مصممة بوضع M الصحي لمفصل فخذ الرضيع، بقماش شبكي بارد للصيف وحزام وسط مبطن يريح ضهر ماما وبابا.',
        descEn: 'IHDI-certified hip-healthy carrier with breathable 3D mesh and lumbar support.',
        priceEGP: 1280,
        priceSAR: 275,
        rating: '4.9',
        reviews: 209,
        city: 'القاهرة / الجيزة / الرياض',
        age: '0-2',
        tag: 'bestseller',
        variants: ['رمادي لؤلؤي', 'كحلي تيل'],
      },
      {
        nameAr: 'مجموعة أمان البيت وحماية الأطفال من الحواف والفيش والأدراج (36 قطعة)',
        nameEn: 'Complete Home Childproofing Safety Kit (36 pcs)',
        descAr: 'كل اللي محتاجه لتأمين الشقة أول ما طفلك يبدأ يحبي ويمشي: أغطية فيش، زوايا سيليكون، وأقفال دولاب.',
        descEn: 'Socket covers, cushioned corner guards, and cabinet safety locks.',
        priceEGP: 340,
        priceSAR: 78,
        rating: '4.8',
        reviews: 287,
        city: 'كل المدن',
        age: '0-2',
        tag: 'recommended',
        variants: ['باقة 36 قطعة الشاملة', 'باقة 50 قطعة + بوابة سلم'],
      },
      {
        nameAr: 'بانيو استحمام البيبي القابل للطي مع ترمومتر حرارة ديجيتال ومخدة عائمة',
        nameEn: 'Foldable Baby Bathtub with Digital Thermometer & Cushion',
        descAr: 'بيقيس درجة حرارة المية لحظياً عشان تظبطيها بالظبط، مع مخدة طرية تشيل البيبي من أول يوم ولادة.',
        descEn: 'Space-saving foldable tub with built-in water temperature display and newborn pad.',
        priceEGP: 1150,
        priceSAR: 255,
        rating: '4.9',
        reviews: 193,
        city: 'القاهرة / الإسكندرية / جدة',
        age: '0-2',
        tag: 'new',
        variants: ['أبيض × تيل أكوا', 'أبيض × مشمشي'],
      },
      {
        nameAr: 'ترمومتر طبي ديجيتال بالأشعة تحت الحمراء لقياس الحرارة عن بعد في ثانية',
        nameEn: 'Non-Contact Medical Infrared Forehead & Ear Thermometer',
        descAr: 'قيسي حرارة طفلك وهو نايم في ثانية واحدة من غير ما تصحيه، مع شاشة ملونة بتنبهك لو فيه سخونية.',
        descEn: 'Silent 1-second forehead and ear thermometer with fever color alarm.',
        priceEGP: 760,
        priceSAR: 165,
        rating: '4.9',
        reviews: 318,
        city: 'كل المدن',
        age: 'all',
        tag: 'bestseller',
        variants: ['جهاز + جراب حفظ وبطاريات'],
      },
      {
        nameAr: 'جهاز الضوضاء البيضاء وإضاءة النوم الليلية الهادئة (White Noise Machine)',
        nameEn: 'Soothing White Noise & Warm Nightlight Sleep Soother',
        descAr: '20 صوت طبيعي هادي (مطر، موج البحر، نبضات القلب) مع إضاءة خافتة بتساعد البيبي يدخل في نوم عميق بسرعة.',
        descEn: '20 soothing nature sounds and warm dimmable amber nightlight for deep sleep.',
        priceEGP: 690,
        priceSAR: 150,
        rating: '4.8',
        reviews: 167,
        city: 'القاهرة / الرياض',
        age: '0-2',
        tag: 'recommended',
        variants: ['إصدار بطارية شحن USB-C محمول'],
      },
      {
        nameAr: 'مقعد سيارة للأطفال متعدد المراحل بنظام أمان ISOFIX (من الولادة حتى 8 سنوات)',
        nameEn: '360° Rotating ISOFIX All-Stage Convertible Car Seat',
        descAr: 'كرسي عربية بيلف 360 درجة عشان تركبي طفلك بسهولة، بحماية جانبية مضاعفة وحزام خماسي آمن.',
        descEn: '360-degree swivel ISOFIX car seat with side-impact protection (0–36 kg).',
        priceEGP: 6400,
        priceSAR: 1290,
        origEGP: 7500,
        origSAR: 1520,
        rating: '5.0',
        reviews: 134,
        city: 'القاهرة / الإسكندرية / الرياض / جدة',
        age: 'all',
        tag: 'deal',
        variants: ['فحمي ملكي', 'كحلي أردوازي'],
      },
    ],
  },
  {
    category: 'courses',
    categoryLabel: 'كورسات أطفال',
    emoji: '🎨',
    kind: 'service',
    sellerAr: 'أكاديمية المواهب والمهارات للأطفال',
    deliveryAr: 'حجز فوري (حضوري أو أونلاين تفاعلي لايف)',
    deliveryEn: 'Instant enrollment (In-person or Live Online)',
    items: [
      {
        nameAr: 'كورس البرمجة والروبوتكس الممتع للأطفال (ScratchJr & Robotics)',
        nameEn: 'Fun Kids Coding & Robotics Course (ScratchJr)',
        descAr: 'طفلك هيحول شغفه بالألعاب لإنه يصمم لعبته وقصته التفاعلية بإيده مع مهندسين متخصصين في تعليم الأطفال.',
        descEn: 'Interactive coding course where kids design their own games and animations.',
        priceEGP: 1200,
        priceSAR: 320,
        origEGP: 1550,
        origSAR: 410,
        rating: '4.9',
        reviews: 214,
        city: 'القاهرة / الرياض / أونلاين لايف',
        age: '5-8',
        tag: 'bestseller',
        variants: ['مستوى المبتدئين (5–6 سنوات)', 'مستوى المبتكرين (7–8 سنوات)'],
      },
      {
        nameAr: 'ورشة الفنون والرسم وتشكيل الفخار والخزف للأطفال',
        nameEn: 'Kids Fine Arts, Watercolor & Pottery Studio Course',
        descAr: '8 حصص عملية لتعلم تدرجات الألوان، تشكيل الصلصال الحراري والفخار، وتنمية الذوق الفني والهدوء النفسي.',
        descEn: '8 hands-on studio sessions in watercolor painting, clay sculpting, and pottery.',
        priceEGP: 950,
        priceSAR: 260,
        rating: '4.9',
        reviews: 162,
        city: 'المعادي / الشيخ زايد / جدة',
        age: '2-5',
        tag: 'recommended',
        variants: ['شامل جميع خامات الرسم والفخار', 'باقة نهاية الأسبوع (الجمعة والسبت)'],
      },
      {
        nameAr: 'كورس الحساب الذهني السريع وتنمية التركيز (UCMAS / Abacus)',
        nameEn: 'Mental Math & Concentration Boost Program (Abacus)',
        descAr: 'بيقوي الذاكرة البصرية وسرعة البديهة وحب الأرقام عند طفلك باللعب بالعداد الياباني والمسابقات الحماسية.',
        descEn: 'Visual memory and rapid mental arithmetic using the Japanese abacus.',
        priceEGP: 880,
        priceSAR: 240,
        rating: '4.8',
        reviews: 189,
        city: 'القاهرة / الإسكندرية / المنصورة / أونلاين',
        age: '5-8',
        tag: 'bestseller',
        variants: ['المستوى التأسيسي + عداد هدية', 'المستوى المتقدم'],
      },
      {
        nameAr: 'برنامج الفونكس والمحادثة الإنجليزية التفاعلية مع معلمين أجانب',
        nameEn: 'Jolly Phonics & Native English Conversation Club',
        descAr: 'نطق إنجليزي سليم وتأسيس قراءة بالحركات والأغاني التفاعلية في مجموعات صغيرة بحد أقصى 5 أطفال.',
        descEn: 'Small-group Jolly Phonics reading and speaking club.',
        priceEGP: 1100,
        priceSAR: 295,
        rating: '4.9',
        reviews: 275,
        city: 'أونلاين تفاعلي / القاهرة الجديدة',
        age: '2-5',
        tag: 'bestseller',
        variants: ['مستوى الفونكس التأسيسي (3–5 سنوات)', 'نادي المحادثة والحكايات (5–8 سنوات)'],
      },
      {
        nameAr: 'كورس تحفيظ القرآن الكريم بالتفسير المصور والقصص المحببة للطفل',
        nameEn: 'Illustrated Quran Stories & Tajweed for Kids',
        descAr: 'تحفيظ لطيف لجزء عم مع فهم معاني الآيات بالرسومات والقصص التربوية بدون ضغط وبالتشجيع المستمر.',
        descEn: 'Warm, story-based Quran memorization for young children.',
        priceEGP: 650,
        priceSAR: 180,
        rating: '5.0',
        reviews: 340,
        city: 'كل المدن / أونلاين فردي',
        age: 'all',
        tag: 'recommended',
        variants: ['حلقات فردية خاصة للطفل', 'مجموعة صغيرة (3 أطفال من نفس السن)'],
      },
      {
        nameAr: 'ورشة الشيف الصغير لتعليم الأطفال تحضير وجبات صحية بأمان',
        nameEn: 'Little Healthy Chef Culinary Workshop for Kids',
        descAr: 'طفلك هيتعلم يعمل ساندوتشات وسلطات وفواكه بأشكال مبهجة بأدوات آمنة، وده بيخليه يحب الأكل الصحي!',
        descEn: 'Safe, no-flame culinary workshop encouraging picky eaters to love healthy food.',
        priceEGP: 720,
        priceSAR: 195,
        rating: '4.8',
        reviews: 118,
        city: 'القاهرة الجديدة / الشيخ زايد / الرياض',
        age: '2-5',
        tag: 'new',
        variants: ['ورشة يوم واحد + مريلة وكاب الشيف', 'باقة 4 ورش أسبوعية'],
      },
      {
        nameAr: 'كورس الخط العربي الجميل وتحسين الكتابة الإملائية للأطفال',
        nameEn: 'Arabic Calligraphy & Neat Handwriting Mastery',
        descAr: 'وداعاً للخط غير المقروء! خطوات ممتعة لضبط مسكة القلم وكتابة الحروف العربية على السطر بشكل متناسق وجميل.',
        descEn: 'Step-by-step Arabic handwriting and Naskh calligraphy for school kids.',
        priceEGP: 590,
        priceSAR: 160,
        rating: '4.9',
        reviews: 147,
        city: 'القاهرة / الجيزة / أونلاين',
        age: '5-8',
        tag: 'recommended',
        variants: ['باقة 8 حصص + كراسة تدريب ذكية'],
      },
      {
        nameAr: 'أكاديمية الشطرنج وتنمية التفكير الاستراتيجي والصبر للأطفال',
        nameEn: 'Junior Chess & Strategic Thinking Academy',
        descAr: 'الشطرنج بيعلم الطفل يفكر قبل ما يتحرك، يتقبل الخسارة بروح رياضية، ويخطط بذكاء.',
        descEn: 'Story-based chess training building patience, foresight, and logic.',
        priceEGP: 820,
        priceSAR: 220,
        rating: '4.9',
        reviews: 133,
        city: 'مصر الجديدة / المعادي / أونلاين',
        age: '5-8',
        tag: 'new',
        variants: ['مستوى المبتدئين + رقعة شطرنج خشبية', 'تدريب البطولات'],
      },
      {
        nameAr: 'ورشة الإلقاء والثقة بالنفس والمسرح الإبداعي (Public Speaking for Kids)',
        nameEn: 'Confidence, Storytelling & Drama Workshop for Kids',
        descAr: 'مثالية للأطفال الخجولين: بتساعد طفلك يتكلم قدام الناس بثقة، يعبر عن رأيه، ويكوّن صداقات بسهولة.',
        descEn: 'Drama and public speaking games helping shy children speak with confidence.',
        priceEGP: 890,
        priceSAR: 245,
        rating: '4.9',
        reviews: 176,
        city: 'القاهرة / الإسكندرية / الرياض',
        age: '5-8',
        tag: 'bestseller',
        variants: ['برنامج 6 أسابيع + عرض مسرحي ختامي للأهل'],
      },
      {
        nameAr: 'كورس الموسيقى والإيقاع الحركي وتعلم البيانو المبسط للأطفال',
        nameEn: 'Early Music Rhythm & Beginner Piano for Kids',
        descAr: 'تنمية الحس السمعي والتآزر الحركي بين الإيدين والعين من خلال النوتات الملونة والأناشيد المبهجة.',
        descEn: 'Color-coded piano and rhythm discovery for early childhood.',
        priceEGP: 1050,
        priceSAR: 280,
        rating: '4.8',
        reviews: 104,
        city: 'الزمالك / المعادي / جدة',
        age: '2-5',
        tag: 'new',
        variants: ['4 حصص فردية بالشهر', '8 حصص جماعية تفاعلية'],
      },
      {
        nameAr: 'معسكر المستكشف العلمي الصغير (تجارب كيمياء وفيزياء آمنة وممتعة)',
        nameEn: 'Young Scientist Lab Camp (Safe Chemistry & Physics)',
        descAr: 'تفاعلات الألوان، البركان الفوار، والدوائر الكهربائية البسيطة بنظارات وبالطو المعمل الحقيقي!',
        descEn: 'Hands-on safe science lab camp with lab coat and safety goggles included.',
        priceEGP: 980,
        priceSAR: 265,
        origEGP: 1200,
        origSAR: 320,
        rating: '5.0',
        reviews: 192,
        city: 'القاهرة الجديدة / 6 أكتوبر / الرياض',
        age: '5-8',
        tag: 'deal',
        variants: ['معسكر 4 أسابيع شامل بالطو المعمل والأدوات'],
      },
      {
        nameAr: 'ورشة الذكاء العاطفي وإدارة المشاعر الغاضبة للطفل والوالدين معاً',
        nameEn: 'Emotional Intelligence & Calm Feelings Workshop',
        descAr: 'ورشة تشاركية لماما وبابا مع الطفل لتعلم تمارين التنفس والتعبير عن الزعل بهدوء من غير صريخ.',
        descEn: 'Co-parent and child workshop on naming feelings and calm regulation.',
        priceEGP: 640,
        priceSAR: 175,
        rating: '4.9',
        reviews: 158,
        city: 'القاهرة / أونلاين',
        age: '2-5',
        tag: 'recommended',
        variants: ['ورشة تفاعلية + شنطة بطاقات المشاعر هدية'],
      },
    ],
  },
  {
    category: 'sports',
    categoryLabel: 'ملاعب وأنشطة',
    emoji: '⚽',
    kind: 'service',
    sellerAr: 'الأندية والأكاديميات الرياضية المعتمدة',
    deliveryAr: 'حجز فوري لحصة التقييم الأولى',
    deliveryEn: 'Instant first session booking',
    items: [
      {
        nameAr: 'أكاديمية السباحة وتأهيل الأطفال للماء في حمام سباحة مغطى ومدفأ',
        nameEn: 'Heated Indoor Pool Kids Swimming Academy',
        descAr: 'مدربين ومدربات متخصصين لتعليم السباحة والأمان المائي من سن 6 شهور لحد 8 سنين في مية دافية ومعقمة بالأوزون.',
        descEn: 'Ozone-sanitized heated indoor pool with certified infant and kids swim coaches.',
        priceEGP: 1400,
        priceSAR: 380,
        rating: '4.9',
        reviews: 315,
        city: 'القاهرة الجديدة / الشيخ زايد / الرياض',
        age: 'all',
        tag: 'bestseller',
        variants: ['سباحة الرضع مع الأم (Baby Swim)', 'تأسيس السباحة للأطفال (8 حصص شهرياً)'],
      },
      {
        nameAr: 'أكاديمية الجمباز الفني وتنمية المرونة واللياقة البدنية للأطفال',
        nameEn: 'Kids Artistic Gymnastics & Flexibility Academy',
        descAr: 'أفضل رياضة تأسيسية بتقوي عضلات الجسم والعمود الفقري والتوازن في صالة مبطنة بالكامل بأعلى معايير الأمان.',
        descEn: 'Foundational gymnastics building core strength, balance, and flexibility.',
        priceEGP: 1150,
        priceSAR: 310,
        rating: '4.9',
        reviews: 242,
        city: 'المعادي / مدينة نصر / الإسكندرية',
        age: '2-5',
        tag: 'bestseller',
        variants: ['مرحلة البراعم (3–5 سنوات)', 'فريق التجهيز للبطولات (5–8 سنوات)'],
      },
      {
        nameAr: 'أكاديمية أبطال كرة القدم للناشئين على ملاعب نجيل طبيعي وآمن',
        nameEn: 'Junior Champions Football Academy',
        descAr: 'تدريب مهاري، روح الفريق، ولياقة بدنية مع كباتن معتمدين وتيشيرت وشورت الأكاديمية هدية عند الاشتراك.',
        descEn: 'Teamwork, dribbling skills, and fitness on safe turf pitches (includes kit).',
        priceEGP: 950,
        priceSAR: 260,
        origEGP: 1200,
        origSAR: 320,
        rating: '4.8',
        reviews: 289,
        city: 'القاهرة / الجيزة / المنصورة / جدة',
        age: '5-8',
        tag: 'deal',
        variants: ['اشتراك شهري (حصتين أسبوعياً) + طقم التمرين'],
      },
      {
        nameAr: 'نادي الكاراتيه والدفاع عن النفس وبناء الانضباط والثقة للأطفال',
        nameEn: 'Kids Karate, Self-Defense & Discipline Dojo',
        descAr: 'بيعلم طفلك التركيز، احترام القواعد، والدفاع عن نفسه بثقة وهدوء بدون عنف.',
        descEn: 'Traditional karate training focusing on respect, focus, and self-confidence.',
        priceEGP: 850,
        priceSAR: 230,
        rating: '4.9',
        reviews: 196,
        city: 'كل المدن',
        age: '5-8',
        tag: 'recommended',
        variants: ['اشتراك شهري 8 حصص + بدلة الكاراتيه البيضاء'],
      },
      {
        nameAr: 'أكاديمية التنس الأرضي المصغر للأطفال (Mini Tennis Club)',
        nameEn: 'Mini-Court Kids Tennis & Coordination Club',
        descAr: 'مضارب خفيفة وكور إسفنجية مخصصة لسن الأطفال لتقوية سرعة رد الفعل والتركيز البصري.',
        descEn: 'Low-compression balls and lightweight rackets for hand-eye coordination.',
        priceEGP: 1300,
        priceSAR: 350,
        rating: '4.8',
        reviews: 124,
        city: 'القاهرة الجديدة / الزمالك / الرياض',
        age: '5-8',
        tag: 'new',
        variants: ['تدريب جماعي (4 أطفال)', 'تدريب خاص مع الكابتن'],
      },
      {
        nameAr: 'مدرسة ركوب الخيل والفروسية الآمنة للأطفال (Pony Riding Club)',
        nameEn: 'Safe Kids Pony Riding & Equestrian Club',
        descAr: 'تجربة ساحرة في الهواء الطلق مع خيول بوني هادية ومدربة خصيصاً للأطفال لبناء الشجاعة والتوازن.',
        descEn: 'Outdoor equestrian bonding and balance lessons on gentle trained ponies.',
        priceEGP: 1650,
        priceSAR: 440,
        rating: '5.0',
        reviews: 178,
        city: 'سقارة / الشيخ زايد / الرياض',
        age: '5-8',
        tag: 'recommended',
        variants: ['باقة 4 حصص فروسية شاملة خوذة الأمان', 'جولة تعريفية نهاية الأسبوع'],
      },
      {
        nameAr: 'نادي الباليه الكلاسيكي والإيقاع الحركي للبنات الصغار',
        nameEn: 'Little Ballerinas Classical Ballet & Posture Studio',
        descAr: 'رشاقة، قوام سليم، وموسيقى كلاسيكية راقية مع مدربات متخصصات وحفلة سنوية مبهجة للأهل.',
        descEn: 'Graceful posture, flexibility, and classical music movement for young girls.',
        priceEGP: 1100,
        priceSAR: 295,
        rating: '4.9',
        reviews: 211,
        city: 'المعادي / مصر الجديدة / الإسكندرية',
        age: '2-5',
        tag: 'bestseller',
        variants: ['مستوى التمهيدي (3–5 سنوات)', 'مستوى الباليه الكلاسيكي (5–8 سنوات)'],
      },
      {
        nameAr: 'أكاديمية كرة السلة المصغرة وإطالة القوام للأطفال (Mini Basket)',
        nameEn: 'Mini Basketball & Agility Training Academy',
        descAr: 'باسكت بارتفاع مناسب لطول الأطفال لتشجيع القفز الصحي، التعاون الجماعي، والنشاط البدني.',
        descEn: 'Adjustable-hoop mini basketball promoting jumping, growth, and team spirit.',
        priceEGP: 900,
        priceSAR: 245,
        rating: '4.8',
        reviews: 147,
        city: 'مدينة نصر / المهندسين / جدة',
        age: '5-8',
        tag: 'new',
        variants: ['اشتراك شهري 8 حصص'],
      },
      {
        nameAr: 'تراك الباتيناج والاسكيت الآمن للأطفال مع كامل أدوات الحماية',
        nameEn: 'Kids Inline Skating & Balance Track Academy',
        descAr: 'تعلم التزلج بالباتيناج خطوة بخطوة على أرضية مخصصة مع خوذة وواقي ركب وكوع كامل.',
        descEn: 'Safe inline skating lessons on smooth padded tracks.',
        priceEGP: 780,
        priceSAR: 210,
        rating: '4.8',
        reviews: 165,
        city: 'القاهرة / الإسكندرية / المنصورة',
        age: '5-8',
        tag: 'deal',
        variants: ['اشتراك شهري', 'اشتراك + إيجار الباتيناج وأدوات الحماية'],
      },
      {
        nameAr: 'صالة ألعاب القوى والباركور الحركي الآمن لتفريغ طاقة الأطفال',
        nameEn: 'Kids Obstacle Course, Agility & Safe Parkour Gym',
        descAr: 'حواجز إسفنجية، حبال تسلق، وترامبولين رياضي بيفرغ الطاقة الزايدة ويقوي ثقة الطفل في جسمه.',
        descEn: 'Padded obstacle courses and foam pits for high-energy motor development.',
        priceEGP: 1050,
        priceSAR: 285,
        rating: '4.9',
        reviews: 183,
        city: 'التجمع الخامس / الشيخ زايد / الرياض',
        age: '2-5',
        tag: 'bestseller',
        variants: ['باقة 8 حصص شهرياً', 'حصة فردية مفتوحة'],
      },
      {
        nameAr: 'يوم النشاط الرياضي العائلي المشترك (بابا وماما والأولاد)',
        nameEn: 'Family Active Sports Weekend Pass (Parents & Kids)',
        descAr: 'يوم كامل من المسابقات الحركية، الجري، والألعاب الجماعية بين الآباء والأبناء في جو عائلي مبهج.',
        descEn: 'Full weekend morning of parent-child relay games and outdoor sports.',
        priceEGP: 650,
        priceSAR: 175,
        rating: '5.0',
        reviews: 230,
        city: 'القاهرة / الإسكندرية / الرياض',
        age: 'all',
        tag: 'recommended',
        variants: ['تذكرة العائلة (أب + أم + طفلين)'],
      },
      {
        nameAr: 'أكاديمية الدراجات الهوائية وتعليم قيادة العجل بدون سنادات',
        nameEn: 'Pedal-Ready Kids Cycling Mastery Club',
        descAr: 'في 4 حصص بس طفلك هيتعلم يسوق العجلة لوحده بثقة وتوازن كامل في تراك آمن ومقفول.',
        descEn: 'Learn pedal biking without training wheels in 4 structured sessions.',
        priceEGP: 720,
        priceSAR: 195,
        rating: '4.9',
        reviews: 142,
        city: 'المعادي / الشروق / 6 أكتوبر',
        age: '5-8',
        tag: 'new',
        variants: ['كورس 4 حصص شاملة توفير الدراجة والخوذة'],
      },
    ],
  },
  {
    category: 'events_parks',
    categoryLabel: 'ملاهي وأعياد ميلاد',
    emoji: '🎪',
    kind: 'service',
    sellerAr: 'مراكز الترفيه العائلي وتنظيم الحفلات',
    deliveryAr: 'تذكرة إلكترونية فورية أو حجز باقة الحفلة',
    deliveryEn: 'Instant e-ticket or party booking',
    items: [
      {
        nameAr: 'تذكرة مدينة المهن التفاعلية للأطفال (تجربة 25 مهنة حقيقية)',
        nameEn: 'Interactive Kids Role-Play City Full-Day Pass',
        descAr: 'طفلك هيلبس لبس الطيار، الدكتور، رجل الإطفاء، والمهندس في مدينة مصغرة ممتعة ومكيفة بالكامل.',
        descEn: 'Indoor role-play city where children try 25 real-world professions.',
        priceEGP: 550,
        priceSAR: 145,
        origEGP: 680,
        origSAR: 180,
        rating: '4.9',
        reviews: 420,
        city: 'القاهرة الجديدة / الرياض / جدة',
        age: '5-8',
        tag: 'bestseller',
        variants: ['تذكرة طفل يوم كامل + مرافق مجاناً', 'باقة الأخوين الموفرة'],
      },
      {
        nameAr: 'باقة تنظيم عيد ميلاد متكاملة في البيت أو الجنينة (ديكور + فقرات + هدايا)',
        nameEn: 'Complete Kids Birthday Party Package (Decor & Entertainment)',
        descAr: 'بلالين بثيم شخصية طفلك المفضلة، مسرح عرائس، ألعاب جماعية، ورسم على الوجه من غير أي تعب لماما وبابا.',
        descEn: 'Themed balloon arch, puppet show, face painting, and interactive party host.',
        priceEGP: 3900,
        priceSAR: 950,
        origEGP: 4600,
        origSAR: 1150,
        rating: '4.9',
        reviews: 187,
        city: 'القاهرة الكبرى / الإسكندرية / الرياض',
        age: 'all',
        tag: 'deal',
        variants: ['ثيم الفضاء والديناصورات', 'ثيم الأميرات والفراشات', 'ثيم السيرك والغابة'],
      },
      {
        nameAr: 'منطقة ألعاب الترامبولين وبيوت الكور اللينة الآمنة (Soft Play Park)',
        nameEn: 'Indoor Soft Play & Trampoline Adventure Park Ticket',
        descAr: 'منطقة ألعاب مبطنة ومعقمة بالكامل مع مشرفات متواجدات طول الوقت وكافيه مريح للأهل.',
        descEn: 'Sanitized indoor soft-play maze and trampoline park with parent café.',
        priceEGP: 280,
        priceSAR: 75,
        rating: '4.8',
        reviews: 312,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['تذكرة ساعتين + شراب مانع للانزلاق', 'تذكرة يوم مفتوح'],
      },
      {
        nameAr: 'رحلة المزرعة الريفية وإطعام الحيوانات الأليفة وركوب البوني للعائلة',
        nameEn: 'Family Petting Zoo & Organic Farm Day Experience',
        descAr: 'قضوا يوم جمعة مبهج وسط الطبيعة: إطعام الأرانب والغزلان، جمع الخضار الطازج، وفطار فلاحي صحي.',
        descEn: 'Outdoor petting zoo, vegetable harvesting, and healthy family picnic.',
        priceEGP: 420,
        priceSAR: 110,
        rating: '5.0',
        reviews: 264,
        city: 'طريق مصر إسكندرية / المريوطية / العمارية',
        age: 'all',
        tag: 'recommended',
        variants: ['تذكرة فرد شاملة الفطار وأنشطة المزرعة', 'باقة العائلة (4 أفراد)'],
      },
      {
        nameAr: 'متحف الأوهام البصرية والعلوم التفاعلية للعائلة والأطفال',
        nameEn: 'Interactive Science & Optical Illusions Family Museum',
        descAr: 'أكتر من 60 تجربة بصرية وعلمية مبهرة بتخلي الأولاد يضحكوا ويتصوروا ويتعلموا في نفس الوقت.',
        descEn: '60+ interactive optical illusions and hands-on physics exhibits.',
        priceEGP: 320,
        priceSAR: 85,
        rating: '4.9',
        reviews: 195,
        city: 'الشيخ زايد / القاهرة الجديدة / الرياض',
        age: '5-8',
        tag: 'new',
        variants: ['تذكرة طفل + جولة مرشد علمي', 'باقة العائلة الكاملة'],
      },
      {
        nameAr: 'تورتة عيد ميلاد صحية للأطفال بألوان طبيعية وبدون سكر صناعي',
        nameEn: 'Custom Healthy Kids Birthday Cake (Natural Colors)',
        descAr: 'كيكة إسفنجية طازجة محلاة بالعسل والفاكهة الطبيعية وبأشكال ثلاثية الأبعاد تفرح قلب طفلك وأصحابه.',
        descEn: 'Freshly baked custom 3D birthday cake using natural fruit sweeteners.',
        priceEGP: 850,
        priceSAR: 210,
        rating: '4.9',
        reviews: 158,
        city: 'القاهرة / الجيزة / الإسكندرية',
        age: 'all',
        tag: 'recommended',
        variants: ['مقاس يكفي 12 فرد + شموع', 'مقاس الحفلة 20 فرد + 12 كاب كيك'],
      },
      {
        nameAr: 'عرض مسرح العرائس والفقاعات العملاقة التفاعلي للمناسبات',
        nameEn: 'Giant Bubbles & Musical Puppet Show Experience',
        descAr: 'ساعة كاملة من البهجة والضحك مع فقاعات الصابون العملاقة اللي الطفل بيدخل جواها وعرض العرائس الغنائي.',
        descEn: 'Interactive giant bubble show and musical puppet theater.',
        priceEGP: 1450,
        priceSAR: 360,
        rating: '4.9',
        reviews: 134,
        city: 'القاهرة / الجيزة / الرياض / جدة',
        age: '2-5',
        tag: 'bestseller',
        variants: ['عرض الحفلات المنزلية والحدائق', 'تذكرة حضور العرض المسرحي الأسبوعي'],
      },
      {
        nameAr: 'مخيم التخييم العائلي النهاري والنجوم في محمية وادي دجلة / الثمامة',
        nameEn: 'Family Day Glamping & Stargazing Nature Adventure',
        descAr: 'خيمة عائلية مجهزة، ألعاب رملية، شوي مارشميلو، ومشاهدة القمر والنجوم بالتلسكوب الحقيقي.',
        descEn: 'Guided family nature day camp with telescope stargazing and treasure hunt.',
        priceEGP: 690,
        priceSAR: 180,
        rating: '4.9',
        reviews: 171,
        city: 'المعادي / الفيوم / الرياض',
        age: '5-8',
        tag: 'new',
        variants: ['تذكرة الفرد شاملة الغداء والأنشطة'],
      },
      {
        nameAr: 'جلسة تصوير فوتوغرافي احترافية للبيبي والعائلة (Family Photo Session)',
        nameEn: 'Professional Baby Milestone & Family Studio Photoshoot',
        descAr: 'وثقوا أحلى لحظات أول سنة أو عيد ميلاد طفلك مع مصورة متخصصة في التعامل اللطيف مع الرضع والأطفال.',
        descEn: 'Warm natural-light studio or outdoor family photography session.',
        priceEGP: 1600,
        priceSAR: 410,
        origEGP: 2000,
        origSAR: 510,
        rating: '5.0',
        reviews: 223,
        city: 'القاهرة / الإسكندرية / الرياض / جدة',
        age: 'all',
        tag: 'deal',
        variants: ['جلسة استوديو بثيمين مختلفين + ألبوم مطبوع', 'جلسة خارجية في الحديقة'],
      },
      {
        nameAr: 'بوكس هدايا وتوزيعات أعياد الميلاد التعليمية (15 هدية خشبية)',
        nameEn: 'Educational Birthday Party Favor Boxes (15 Kids Sets)',
        descAr: 'بدل الحلويات الكتير، وزعي على أصحاب طفلك في عيد ميلاده ألعاب بازل وألوان خشبية مفيدة هيفرحوا بيها جداً.',
        descEn: '15 curated mini wooden puzzles and coloring sets as healthy party favors.',
        priceEGP: 780,
        priceSAR: 185,
        rating: '4.8',
        reviews: 119,
        city: 'كل المدن',
        age: '2-5',
        tag: 'recommended',
        variants: ['بوكس 15 طفل جاهز بالتغليف وكارت الاسم', 'بوكس 25 طفل'],
      },
      {
        nameAr: 'تذكرة أكواريوم الأسماك وعالم البحار التفاعلي للعائلة',
        nameEn: 'Underwater Tunnel Aquarium & Marine Discovery Ticket',
        descAr: 'جولة داخل النفق الزجاجي تحت المية لمشاهدة السلاحف البحرية والأسماك الملونة مع شرح مبسط للأطفال.',
        descEn: 'Walkthrough glass ocean tunnel and touch-pool marine discovery.',
        priceEGP: 360,
        priceSAR: 95,
        rating: '4.8',
        reviews: 204,
        city: 'الغردقة / الإسكندرية / جدة / الرياض',
        age: 'all',
        tag: 'bestseller',
        variants: ['تذكرة طفل', 'باقة العائلة الموفرة'],
      },
      {
        nameAr: 'إيجار نطاطة هوائية آمنة للحدائق وحفلات البيت (شامل التركيب)',
        nameEn: 'Safe Home Garden Bouncy Castle Rental (Full Day)',
        descAr: 'نطاطة وزحليقة هوائية متعقمة وآمنة بتركب في الجنينة أو الرووف عشان يوم عيد ميلاد لا يُنسى.',
        descEn: 'Sanitized inflatable bouncy house with safety netting delivered and installed.',
        priceEGP: 1800,
        priceSAR: 450,
        rating: '4.9',
        reviews: 97,
        city: 'القاهرة الجديدة / الشيخ زايد / الرياض',
        age: '2-5',
        tag: 'new',
        variants: ['مقاس متوسط للحدائق المنزلية', 'مقاس كبير مع زحليقة'],
      },
    ],
  },
  {
    category: 'books',
    categoryLabel: 'قصص وكتب',
    emoji: '📖',
    kind: 'product',
    sellerAr: 'دار الحكايات للنشر وكتب الأطفال',
    deliveryAr: 'توصيل خلال 24–48 ساعة لكل المحافظات',
    deliveryEn: '24–48h nationwide delivery',
    items: [
      {
        nameAr: 'موسوعة حكايات قبل النوم المصورة لتهدئة الطفل وغرس القيم (10 قصص)',
        nameEn: 'Illustrated Bedtime Values Story Collection (10 Books)',
        descAr: '10 قصص مصورة بورق مقوى وألوان هادية بتعلم الصدق، المشاركة، والامتنان وبتساعد طفلك ينام وهو مطمن.',
        descEn: '10 soothing illustrated hardcover bedtime stories nurturing kindness and gratitude.',
        priceEGP: 480,
        priceSAR: 112,
        origEGP: 600,
        origSAR: 140,
        rating: '4.9',
        reviews: 342,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['طبعة فاخرة بغلاف مقوى + بوكس حفظ', 'طبعة ثنائية اللغة (عربي / إنجليزي)'],
      },
      {
        nameAr: 'مجموعة الكتب القماشية التفاعلية ذات الملامس المختلفة للرضع (4 كتب)',
        nameEn: 'Crinkle Sensory Touch-and-Feel Cloth Books Set (4 pcs)',
        descAr: 'كتب قماشية آمنة للعض والغسيل بأصوات خشخشة وذيول حيوانات بارزة لتنمية حاسة اللمس والبصر عند البيبي.',
        descEn: 'Washable non-toxic crinkle cloth books with 3D sensory animal tails.',
        priceEGP: 340,
        priceSAR: 78,
        rating: '4.9',
        reviews: 218,
        city: 'القاهرة / الإسكندرية / الرياض',
        age: '0-2',
        tag: 'bestseller',
        variants: ['مجموعة الغابة والبحار', 'مجموعة الألوان والأرقام'],
      },
      {
        nameAr: 'سلسلة «مشاعري الكبيرة» لمساعدة الطفل على فهم الغضب والخوف والغيرة',
        nameEn: 'My Big Feelings Emotional Regulation Book Series (6 Books)',
        descAr: 'مكتوبة تحت إشراف أخصائيين نفسيين بلغة قريبة من قلب الطفل عشان يعرف يعبر عن مشاعره بالكلام مش بالعياط.',
        descEn: 'Psychologist-approved picture books helping toddlers name and calm big emotions.',
        priceEGP: 420,
        priceSAR: 98,
        rating: '5.0',
        reviews: 276,
        city: 'كل المدن',
        age: '2-5',
        tag: 'recommended',
        variants: ['السلسلة الكاملة (6 قصص + بوستر عجلة المشاعر)'],
      },
      {
        nameAr: 'القلم القارئ الناطق مع موسوعة الكلمات الأولى بالعربي والإنجليزي (500 كلمة)',
        nameEn: 'Interactive Audio Talking Pen & First 500 Words Encyclopedia',
        descAr: 'مجرد ما الطفل يلمس الصورة بالقلم بيسمع نطق الكلمة السليم بالعربي والإنجليزي مع أصوات الطبيعة والحيوانات.',
        descEn: 'Rechargeable audio smart pen with bilingual picture dictionary and games.',
        priceEGP: 890,
        priceSAR: 198,
        origEGP: 1080,
        origSAR: 245,
        rating: '4.9',
        reviews: 310,
        city: 'مصر والسعودية',
        age: '2-5',
        tag: 'deal',
        variants: ['القلم الناطق + 4 كتب تفاعلية + شاحن USB'],
      },
      {
        nameAr: 'قصة مخصصة باسم وصورة طفلك الكرتونية «بطل الحكاية»',
        nameEn: 'Personalized Storybook Starring Your Child’s Name & Avatar',
        descAr: 'قصة مطبوعة مخصوص باسم طفلك وشكل شعره وملامحه وهو بيخوض مغامرة شيقة بتزود ثقته في نفسه وحبه للقراءة.',
        descEn: 'Custom-printed hardcover adventure book featuring your child as the hero.',
        priceEGP: 550,
        priceSAR: 130,
        rating: '5.0',
        reviews: 194,
        city: 'القاهرة / جدة / الرياض',
        age: '2-5',
        tag: 'new',
        variants: ['نسخة الولد البطل', 'نسخة البنت البطلة'],
      },
      {
        nameAr: 'موسوعة «لماذا وكيف؟» العلمية المصورة للأطفال الفضوليين (5–8 سنوات)',
        nameEn: 'Why & How? Illustrated Kids Science Encyclopedia',
        descAr: 'إجابات مبسطة ومصورة على كل أسئلة طفلك الذكية: ليه السما زرقاء؟ إزاي الطيارة بتطير؟ وإزاي جسمنا بيشتغل؟',
        descEn: 'Illustrated answers to 200+ curious questions about space, body, and nature.',
        priceEGP: 390,
        priceSAR: 92,
        rating: '4.9',
        reviews: 165,
        city: 'كل المدن',
        age: '5-8',
        tag: 'bestseller',
        variants: ['طبعة فاخرة ملونة 160 صفحة'],
      },
      {
        nameAr: 'سلسلة قصص الأنبياء والصحابة المصورة للأطفال بأسلوب مشوق ومبسط',
        nameEn: 'Illustrated Stories of the Prophets for Young Readers',
        descAr: 'رسومات دافية ولغة عربية سلسة ومشكولة بتحبب الطفل في السيرة والقصص القرآنية من صغره.',
        descEn: 'Warm, age-appropriate illustrated stories of the Prophets with vowelized Arabic.',
        priceEGP: 460,
        priceSAR: 108,
        rating: '4.9',
        reviews: 289,
        city: 'كل المدن',
        age: '5-8',
        tag: 'recommended',
        variants: ['مجموعة 8 أجزاء مصورة في صندوق هدايا'],
      },
      {
        nameAr: 'كتب التلوين المائي السحري القابلة لإعادة الاستخدام بدون فوضى (4 دفاتر)',
        nameEn: 'Mess-Free Reusable Water-Reveal Coloring Books (4 Pack)',
        descAr: 'املئي القلم مية بس وسيبي طفلك يلون وتظهر الألوان السحرية، ولما تنشف يقدر يلونها تاني عشرات المرات من غير ما يبهدل هدومه!',
        descEn: 'Fill the brush with plain water to reveal vibrant scenes that reset when dry.',
        priceEGP: 260,
        priceSAR: 60,
        rating: '4.8',
        reviews: 243,
        city: 'القاهرة / الإسكندرية / الرياض',
        age: '2-5',
        tag: 'bestseller',
        variants: ['4 دفاتر (حيوانات، فضاء، بحار، مواصلات) + 4 أقلام مياه'],
      },
      {
        nameAr: 'حقيبة التأسيس في القراءة العربية السريعة (من الحروف إلى الكلمات والجمل)',
        nameEn: 'Step-by-Step Arabic Reading & Phonics Mastery Box',
        descAr: '12 قصة متدرجة الصعوبة مع كروت حروف مغناطيسية بتخلي طفلك يستهجى ويقرأ أول قصة لوحده في أسابيع.',
        descEn: '12 leveled Arabic phonetic readers with magnetic letter tiles.',
        priceEGP: 510,
        priceSAR: 118,
        rating: '4.9',
        reviews: 182,
        city: 'كل المدن',
        age: '5-8',
        tag: 'recommended',
        variants: ['الحقيبة الكاملة + لوح مغناطيسي'],
      },
      {
        nameAr: 'كتاب المجسمات المنبثقة ثلاثي الأبعاد (Pop-Up Dinosaurs & Space)',
        nameEn: '3D Pop-Up Interactive Dinosaurs & Space Book',
        descAr: 'أول ما الطفل يفتح الصفحة بتطلع مجسمات ثلاثية الأبعاد متحركة تبهر عينه وتشده لعالم القراءة.',
        descEn: 'Spectacular 3D paper-engineered pop-up book of dinosaurs and planets.',
        priceEGP: 440,
        priceSAR: 102,
        rating: '4.9',
        reviews: 137,
        city: 'القاهرة / الرياض / جدة',
        age: '2-5',
        tag: 'new',
        variants: ['عالم الديناصورات 3D', 'رحلة الفضاء والكواكب 3D'],
      },
      {
        nameAr: 'دليل التربية الإيجابية والروتين الهادئ للأم والأب (كتاب عملي للوالدين)',
        nameEn: 'Positive Parenting & Calm Family Routine Handbook',
        descAr: 'دليل مصري وعربي واقعي مليان حلول عملية لمواقف اليومية مع الأطفال من أول يوم لحد 8 سنين.',
        descEn: 'Practical Arabic guide for modern parents navigating ages 0 to 8.',
        priceEGP: 290,
        priceSAR: 68,
        rating: '4.9',
        reviews: 221,
        city: 'كل المدن',
        age: 'all',
        tag: 'recommended',
        variants: ['نسخة ورقية + جدول روتين مطبوع هدية'],
      },
    ],
  },
  {
    category: 'nutrition',
    categoryLabel: 'تغذية صحية',
    emoji: '🍱',
    kind: 'product',
    sellerAr: 'مطبخ ومزرعة التغذية الصحية للطفل',
    deliveryAr: 'توصيل مبرد يومي طازج لباب البيت',
    deliveryEn: 'Fresh chilled daily doorstep delivery',
    items: [
      {
        nameAr: 'لانش بوكس حراري مقسم من الستانلس ستيل الآمن غذائياً (مانع للتسريب)',
        nameEn: 'Leak-Proof 304 Stainless Steel Bento Lunchbox',
        descAr: 'مقسم لـ 4 خانات تحافظ على الأكل دافي وطازة من غير ما الروائح تختلط، مع قفل سهل لإيد الطفل.',
        descEn: 'BPA-free insulated stainless steel bento box with silicone leak-proof seal.',
        priceEGP: 590,
        priceSAR: 135,
        origEGP: 720,
        origSAR: 165,
        rating: '4.9',
        reviews: 294,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['تيل أكوا + شوكة ومعلقة', 'مرجاني دافئ + شوكة ومعلقة'],
      },
      {
        nameAr: 'باقة وجبات الرضع العضوية المهروسة الطازجة (بدون سكر أو مواد حافظة - 7 عبوات)',
        nameEn: 'Fresh Organic Baby Puree Weekly Pack (7 Jars)',
        descAr: 'محضرة يومياً على البخار من خضار وفواكه عضوية (قرع عسلي، تفاح وشوفان، بطاطا وجزر) جاهزة للأكل فوراً.',
        descEn: 'Steam-cooked organic fruit and veggie purees with zero added sugar or preservatives.',
        priceEGP: 420,
        priceSAR: 98,
        rating: '4.9',
        reviews: 186,
        city: 'القاهرة / الجيزة / الإسكندرية / الرياض',
        age: '0-2',
        tag: 'bestseller',
        variants: ['مرحلة 6–8 شهور (ناعم جداً)', 'مرحلة 9–18 شهر (بقوام غني)'],
      },
      {
        nameAr: 'زبدة فول سوداني ولوز وبندق طبيعية 100% مدعمة بالسمسم والتمور للأطفال',
        nameEn: '100% Natural Nut Butter Trio with Dates & Sesame for Kids',
        descAr: 'مصدر طبيعي ممتاز للحديد والكالسيوم والدهون الصحية الذكية لنمو مخ الطفل وتركيزه في الحضانة.',
        descEn: 'Stone-ground almond, hazelnut, and peanut butters sweetened only with dates.',
        priceEGP: 380,
        priceSAR: 88,
        rating: '5.0',
        reviews: 253,
        city: 'كل المدن',
        age: '2-5',
        tag: 'recommended',
        variants: ['مجموعة 3 برطمانات (فول سوداني، لوز، بندق بالتمر والكاكاو الخام)'],
      },
      {
        nameAr: 'جهاز تحضير طعام الرضع بالبخار والخلط الذكي 4×1 (Baby Food Maker)',
        nameEn: '4-in-1 Steam Cooker & Baby Puree Blender',
        descAr: 'بيسوي الخضار والفاكهة والفراخ بالبخار ويفرمها في نفس الدورق بضغطة زرار مع الحفاظ على كل الفيتامينات.',
        descEn: 'Steams, blends, defrosts, and warms homemade baby meals in one bowl.',
        priceEGP: 2250,
        priceSAR: 485,
        origEGP: 2650,
        origSAR: 570,
        rating: '4.9',
        reviews: 164,
        city: 'القاهرة / الإسكندرية / الرياض / جدة',
        age: '0-2',
        tag: 'deal',
        variants: ['إصدار ديجيتال بشاشة توقيت + كتاب وصفات للرضع'],
      },
      {
        nameAr: 'زمزمية مياه حرارية ستانلس ستيل تحفظ البرودة 12 ساعة بشاليموه سيليكون',
        nameEn: 'Insulated Stainless Steel Kids Water Bottle with Silicone Straw',
        descAr: 'ماتتخرمش وماتسربش نقطة مية في الشنطة، بتشجع طفلك يشرب مية كفاية طول يوم الحضانة والتمرين.',
        descEn: 'Double-wall vacuum insulated 400ml kids bottle with flip-top straw.',
        priceEGP: 390,
        priceSAR: 90,
        rating: '4.8',
        reviews: 217,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['رسومات الفضاء (400 مل)', 'رسومات الديناصورات (400 مل)', 'رسومات الفراشات (400 مل)'],
      },
      {
        nameAr: 'بوكس سناكس المدرسة الصحي بدون سكر مضاف (بار الشوفان والفواكه المجففة - 14 قطعة)',
        nameEn: 'No-Added-Sugar Healthy School Snack Box (14 Bars)',
        descAr: 'بديل صحي ولذيذ للشيبسي والحلويات الصناعية، مصنوع من التمر، الشوفان، الموز، والتوت الطبيعي.',
        descEn: '14 whole-fruit and oat snack bars with zero refined sugar or artificial flavors.',
        priceEGP: 310,
        priceSAR: 72,
        rating: '4.9',
        reviews: 198,
        city: 'كل المدن',
        age: '5-8',
        tag: 'recommended',
        variants: ['بوكس مشكل (تفاح بالقرفة، فراولة، موز بالكاكاو)'],
      },
      {
        nameAr: 'عسل نحل جبلي وموالح طبيعي مفحوص معملياً لرفع مناعة الأطفال (بعد عمر السنة)',
        nameEn: 'Lab-Tested Pure Citrus & Mountain Honey for Kids Immunity',
        descAr: 'عسل طبيعي خام 100% غني بالإنزيمات الطبيعية لتهدئة الكحة وتقوية المناعة في تغيرات الجو (مناسب بعد سن سنة).',
        descEn: 'Raw unpasteurized honey rich in natural antioxidants for children 1+ years.',
        priceEGP: 340,
        priceSAR: 82,
        rating: '4.9',
        reviews: 276,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['عسل موالح خفيف الطعم (500 جم)', 'عسل سدر جبلي (500 جم)'],
      },
      {
        nameAr: 'مكرونة وشوربة أطفال عضوية مدعمة بالخضروات الطبيعية (سبانخ، بنجر، جزر)',
        nameEn: 'Organic Veggie-Infused Kids Pasta Shapes (3 Pack)',
        descAr: 'مكرونة بأشكال نجوم وحيوانات ملونة طبيعياً بالسبانخ والبنجر والجزر عشان طفلك ياكل الخضار وهو مستمتع!',
        descEn: 'Fun animal-shaped durum wheat pasta naturally colored with spinach, beet, and carrot.',
        priceEGP: 245,
        priceSAR: 58,
        rating: '4.8',
        reviews: 142,
        city: 'القاهرة / الجيزة / الإسكندرية / الرياض',
        age: '0-2',
        tag: 'new',
        variants: ['مجموعة 3 عبوات (أشكال الغابة والفضاء والحروف)'],
      },
      {
        nameAr: 'مجموعة قطاعات الساندوتشات والفواكه المرحة لفتح شهية الأطفال (20 قطعة)',
        nameEn: 'Fun Bento Sandwich & Fruit Cutters Kit (20 pcs)',
        descAr: 'حولي الساندوتش والخيار والجبنة لأشكال قلوب، نجوم، ودباديب في ثواني عشان يرجع اللانش بوكس فاضي كل يوم!',
        descEn: 'Stainless steel vegetable cutters and cute food picks for picky eaters.',
        priceEGP: 220,
        priceSAR: 52,
        rating: '4.9',
        reviews: 310,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['طقم 20 قطعة شامل شوك الفواكه الصغيرة'],
      },
      {
        nameAr: 'اشتراك أسبوعي لتوصيل وجبات أطفال صحية متوازنة محسوبة العناصر الغذائية',
        nameEn: 'Weekly Balanced Kids Healthy Meal Prep Subscription',
        descAr: '5 وجبات غداء وسناك أسبوعياً محضرة تحت إشراف أخصائيين تغذية أطفال، بتوصلك طازة الصبح.',
        descEn: 'Nutritionist-designed weekly kids lunch and snack delivery.',
        priceEGP: 890,
        priceSAR: 230,
        origEGP: 1050,
        origSAR: 275,
        rating: '4.9',
        reviews: 129,
        city: 'القاهرة الجديدة / الشيخ زايد / المعادي / الرياض',
        age: '5-8',
        tag: 'deal',
        variants: ['باقة 5 أيام (الأحد للخميس)', 'باقة اللانش بوكس المدرسي المتكامل'],
      },
      {
        nameAr: 'حليب أطفال مدعم بالحديد والأوميجا 3 للمرحلة التكميلية (من سنة لـ 3 سنوات)',
        nameEn: 'Stage-3 Growing Up Milk Formula with Iron & DHA',
        descAr: 'مدعم بالبريبايوتكس، الحديد، وفيتامين د لدعم النمو الذهني والحركي بجانب الأكل الطبيعي.',
        descEn: 'Fortified toddler milk with DHA, Iron, Vitamin D, and prebiotics.',
        priceEGP: 460,
        priceSAR: 98,
        rating: '4.9',
        reviews: 265,
        city: 'كل المدن',
        age: '0-2',
        tag: 'recommended',
        variants: ['عبوة 800 جم', 'عبوة التوفير المزدوجة (1600 جم)'],
      },
      {
        nameAr: 'أكياس سيليكون قابلة لإعادة الاستخدام لعصائر الفواكه والزبادي المنزلي (6 قطع)',
        nameEn: 'Reusable Food-Grade Silicone Smoothie Pouches (6 Pack)',
        descAr: 'اعملي سموذي الفواكه أو الزبادي بالتمر في البيت وعبيه في الأكياس السيليكون الآمنة لخروجات النادي والحضانة.',
        descEn: 'Washable leak-proof silicone squeeze pouches for homemade purees and smoothies.',
        priceEGP: 320,
        priceSAR: 74,
        rating: '4.8',
        reviews: 154,
        city: 'كل المدن',
        age: '0-2',
        tag: 'new',
        variants: ['طقم 6 أكياس بألوان الباستيل + فرشاة تنظيف'],
      },
    ],
  },
  {
    category: 'furniture',
    categoryLabel: 'أثاث غرف الأطفال',
    emoji: '🪑',
    kind: 'product',
    sellerAr: 'ورشة أثاث غرف الأطفال الآمن والطبيعي',
    deliveryAr: 'توصيل وتركيب مجاني لحد باب الغرفة',
    deliveryEn: 'Free delivery & in-room assembly',
    items: [
      {
        nameAr: 'سرير مونتيسوري الأرضي الخشبي على شكل بيت دافئ (Montessori House Bed)',
        nameEn: 'Natural Beechwood Montessori Floor House Bed',
        descAr: 'قريب من الأرض عشان طفلك يطلع وينزل لوحده بأمان من غير خوف من الوقوع، بخشب زان طبيعي وحواف دائرية.',
        descEn: 'Safe low-profile solid beechwood house bed encouraging independent sleep.',
        priceEGP: 5900,
        priceSAR: 1280,
        origEGP: 6800,
        origSAR: 1490,
        rating: '5.0',
        reviews: 214,
        city: 'القاهرة / الإسكندرية / الرياض / جدة',
        age: '2-5',
        tag: 'bestseller',
        variants: ['مقاس 100×190 سم + سور حماية قابل للفك', 'مقاس 120×200 سم + درج تخزين سفلي'],
      },
      {
        nameAr: 'طاولة أنشطة مونتيسوري الخشبية مع كرسيين مريحين للرسم واللعب والمذاكرة',
        nameEn: 'Ergonomic Kids Wooden Activity Table & 2 Chairs Set',
        descAr: 'طاولة بسطح مزدوج (وش أبيض للرسم والقراءة ووش سبورة طباشير) مع درج داخلي لتخزين الألوان والورق.',
        descEn: 'Solid wood table with reversible chalkboard top, storage bin, and 2 chairs.',
        priceEGP: 2350,
        priceSAR: 510,
        rating: '4.9',
        reviews: 278,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['خشب طبيعي × أبيض', 'خشب طبيعي × تيل نعناعي'],
      },
      {
        nameAr: 'مكتبة عرض القصص الأمامية على مستوى نظر الطفل (Front-Facing Bookcase)',
        nameEn: 'Montessori Front-Facing Kids Book Display Shelf',
        descAr: 'بتعرض أغلفة القصص قدام عين الطفل مش كعب الكتاب، فبتشجعه يختار قصته بنفسه ويرجعها مكانها بنظام.',
        descEn: '4-tier forward-facing wooden bookshelf making storybooks irresistible to toddlers.',
        priceEGP: 1650,
        priceSAR: 365,
        rating: '4.9',
        reviews: 192,
        city: 'القاهرة / الجيزة / الإسكندرية / الرياض',
        age: '0-2',
        tag: 'recommended',
        variants: ['4 أرفف أمامية + خزانة ألعاب خلفية'],
      },
      {
        nameAr: 'سرير البيبي الهزاز الملاصق لسرير الأم (Next-to-Me Co-Sleeper Crib)',
        nameEn: 'Adjustable Bedside Co-Sleeper Baby Crib with Mattress',
        descAr: 'بيتفتح من الجنب ويثبت جنب سرير ماما للرضاعة الليلية المريحة، مع 6 مستويات ارتفاع ووضع مائل لمنع الارتجاع.',
        descEn: 'Breathable mesh bedside sleeper with anti-reflux incline and 6 height levels.',
        priceEGP: 4450,
        priceSAR: 940,
        origEGP: 5200,
        origSAR: 1120,
        rating: '4.9',
        reviews: 263,
        city: 'مصر والسعودية',
        age: '0-2',
        tag: 'deal',
        variants: ['رمادي هادئ شامل المرتبة الطبية والناموسية', 'بيج رملي شامل المرتبة الطبية'],
      },
      {
        nameAr: 'وحدة تنظيم الألعاب الخشبية بـ 9 صناديق قماشية ملونة قابلة للفك',
        nameEn: 'Wooden Toy Storage Organizer with 9 Removable Bins',
        descAr: 'خلي ترتيب الأوضة لعبة ممتعة! كل صندوق بلون ورسمة عشان طفلك يفرز المكعبات والعربيات والدباديب لوحده.',
        descEn: 'Sturdy wooden frame with 9 pastel fabric bins for effortless toy cleanup.',
        priceEGP: 1890,
        priceSAR: 415,
        rating: '4.8',
        reviews: 175,
        city: 'كل المدن',
        age: '2-5',
        tag: 'bestseller',
        variants: ['ألوان باستيل هادئة', 'أبيض وتيل وأصفر'],
      },
      {
        nameAr: 'كرسي طعام الأطفال الخشبي المتدرج (ينمو مع طفلك من 6 شهور حتى 8 سنوات)',
        nameEn: 'Grow-With-Me Adjustable Wooden High Chair',
        descAr: 'كرسي عالي متين بقاعدة رجلين قابلة للتعديل وصينية طعام بتتفك عشان يقعد مع العيلة على سفرة واحدة.',
        descEn: 'Ergonomic solid beechwood high chair with adjustable seat and footrest.',
        priceEGP: 2950,
        priceSAR: 640,
        rating: '4.9',
        reviews: 158,
        city: 'القاهرة / الإسكندرية / الرياض',
        age: '0-2',
        tag: 'recommended',
        variants: ['شامل وسادة مبطنة وحزام أمان خماسي'],
      },
      {
        nameAr: 'سجادة لعب الأطفال المبطنة القابلة للطي والمقاومة للسوائل (XPE Play Mat)',
        nameEn: 'Reversible Cushioned Waterproof XPE Folding Play Mat (200×180 cm)',
        descAr: 'سُمك 1.5 سم بيحمي ركب ورأس البيبي وقت الحبي والمشي، وجهين برسومات تعليمية هادية وسهلة المسح في ثواني.',
        descEn: 'Non-toxic shock-absorbing 1.5cm thick reversible folding foam mat.',
        priceEGP: 1180,
        priceSAR: 260,
        origEGP: 1450,
        origSAR: 320,
        rating: '4.9',
        reviews: 334,
        city: 'كل المدن',
        age: '0-2',
        tag: 'deal',
        variants: ['مقاس 200×180 سم + شنطة حفظ'],
      },
      {
        nameAr: 'مكتب مذاكرة أطفال طبي قابل لتعديل الارتفاع والميل مع إضاءة LED مريحة للعين',
        nameEn: 'Height-Adjustable Ergonomic Study Desk & Chair with Eye-Care Lamp',
        descAr: 'بيحافظ على استقامة ضهر ورقبة طفلك وقت المذاكرة والرسم، مع لمبة قراءة بدون وميض وحامل كتاب.',
        descEn: 'Tiltable anti-glare desktop, posture-correcting chair, and LED reading lamp.',
        priceEGP: 4650,
        priceSAR: 980,
        rating: '4.9',
        reviews: 146,
        city: 'القاهرة / الجيزة / الرياض / جدة',
        age: '5-8',
        tag: 'new',
        variants: ['لون أزرق سماوي × أبيض', 'لون مرجاني وردي × أبيض'],
      },
      {
        nameAr: 'خيمة القراءة واللعب القطنية الهندية مع فرشة أرضية مبطنة وإضاءة دافئة (Teepee Tent)',
        nameEn: 'Cotton Canvas Kids Reading Teepee Tent with Padded Mat',
        descAr: 'ركن هادي وساحر في أوضة طفلك لقراءة القصص والهدوء قبل النوم، مصنوعة من قماش قطن تقيل وعصيان خشب طبيعي.',
        descEn: 'Breathable cotton canvas teepee with quilted floor mat and star string lights.',
        priceEGP: 1390,
        priceSAR: 310,
        rating: '4.8',
        reviews: 169,
        city: 'القاهرة / الإسكندرية / المنصورة',
        age: '2-5',
        tag: 'recommended',
        variants: ['أوف وايت × نجوم ذهبية', 'تيل نعناعي × أبيض'],
      },
      {
        nameAr: 'دولاب ملابس مونتيسوري المفتوح لتعليم الطفل اختيار وتعليق ملابسه بنفسه',
        nameEn: 'Montessori Child-Height Open Wardrobe & Dressing Mirror',
        descAr: 'بارتفاع مناسب لطول الطفل مع مراية جانبية غير قابلة للكسر عشان يختار لبسه الصبح بكل ثقة واستقلالية.',
        descEn: 'Toddler-accessible wardrobe with hanging rail, shelves, and acrylic safety mirror.',
        priceEGP: 3250,
        priceSAR: 710,
        rating: '4.9',
        reviews: 121,
        city: 'القاهرة الجديدة / الشيخ زايد / الرياض',
        age: '2-5',
        tag: 'new',
        variants: ['خشب زان طبيعي + 10 شماعات أطفال خشبية هدية'],
      },
      {
        nameAr: 'مرتبة أطفال طبية قطنية مضادة للبكتيريا والحساسية والبلل',
        nameEn: 'Orthopedic Hypoallergenic Waterproof Kids Mattress',
        descAr: 'بتدعم العمود الفقري للطفل في مرحلة النمو بكسوة قطن عضوي بسوستة تتفك وتتغسل بسهولة.',
        descEn: 'Medium-firm pediatric spine support mattress with washable organic bamboo cover.',
        priceEGP: 2800,
        priceSAR: 610,
        rating: '4.9',
        reviews: 184,
        city: 'كل المدن',
        age: 'all',
        tag: 'bestseller',
        variants: ['مقاس سرير الرضع (60×120 سم)', 'مقاس سرير الأطفال (100×190 سم)', 'مقاس 120×200 سم'],
      },
      {
        nameAr: 'كومودينو ومنظم سرير الأطفال مع أباجورة ليلية سيليكون على شكل قمر',
        nameEn: 'Rounded-Edge Kids Nightstand with Soft Silicone Moon Lamp',
        descAr: 'كومودينو بحواف دائرية آمنة تماماً ودرج هادي الغلق مع أباجورة سيليكون طرية بتشتغل باللمس.',
        descEn: 'Soft-close rounded wooden nightstand paired with a rechargeable touch moon lamp.',
        priceEGP: 1520,
        priceSAR: 340,
        rating: '4.8',
        reviews: 112,
        city: 'القاهرة / الجيزة / الإسكندرية',
        age: '2-5',
        tag: 'recommended',
        variants: ['أبيض × خشب طبيعي شامل أباجورة القمر'],
      },
    ],
  },
];

function buildCompleteCommercialCatalog(): CommercialCatalogItem[] {
  const result: CommercialCatalogItem[] = BASE_COMMERCIAL_SEED.map((seedItem, idx) => ({
    ...seedItem,
    imageUrl: seedItem.imageUrl || getProductUnsplashImageUrl(seedItem.category, idx),
  }));
  let nextId = 208;

  for (const group of CATEGORY_CATALOG_BLUEPRINTS) {
    let itemIdx = 1;
    for (const entry of group.items) {
      const currentId = nextId++;
      result.push({
        id: currentId,
        name: entry.nameAr,
        nameEn: entry.nameEn,
        kind: group.kind,
        category: group.category,
        categoryLabel: group.categoryLabel,
        country: 'ALL',
        city: entry.city,
        priceEGP: entry.priceEGP,
        priceSAR: entry.priceSAR,
        originalPriceEGP: entry.origEGP,
        originalPriceSAR: entry.origSAR,
        rating: entry.rating,
        reviewCount: entry.reviews,
        isSponsored: entry.tag === 'deal',
        description: entry.descAr,
        descriptionEn: entry.descEn,
        emoji: group.emoji,
        imageUrl: getProductUnsplashImageUrl(group.category, itemIdx++),
        ageStage: entry.age,
        collectionTag: entry.tag,
        variants: entry.variants,
        specificationsAr: [
          'جودة معتمدة ومفحوصة لسلامة الطفل ١٠٠٪',
          'متاح الدفع عند الاستلام أو الدفع الإلكتروني',
          'ضمان استبدال واسترجاع مجاني خلال ١٤ يوم',
        ],
        specificationsEn: [
          '100% certified child-safe quality',
          'Cash on Delivery & Electronic Payment available',
          'Free 14-day exchange & return guarantee',
        ],
        sellerName: group.sellerAr,
        deliveryEstimateAr: group.deliveryAr,
        deliveryEstimateEn: group.deliveryEn,
      });
    }
  }

  return result;
}

export const COMMERCIAL_CATALOG: CommercialCatalogItem[] = buildCompleteCommercialCatalog();

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
  const res = validatePhoneRuleForCountry(phoneRaw, country);
  return {
    valid: res.valid,
    normalized: res.normalized,
    fullInternational: res.fullInternational,
    errorAr: res.errorAr,
    errorEn: res.errorEn,
  };
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
  if (typeof input.country === 'string' && input.country.trim()) {
    base.country = resolveCountryCode(input.country, base.country);
    base.city = getDefaultCityForCountry(base.country);
    base.currency = getSuggestedCurrencyFromRegistry(base.country);
  }
  if (typeof input.city === 'string' && input.city.trim()) {
    base.city = input.city.trim();
  }
  if (input.language === 'ar' || input.language === 'en') {
    base.language = input.language;
  }
  if (typeof input.currency === 'string' && isSupportedCurrencyCode(input.currency)) {
    base.currency = input.currency.trim().toUpperCase() as CurrencyCode;
  }
  if (input.calendarMode === 'both' || input.calendarMode === 'gregorian' || input.calendarMode === 'hijri') {
    base.calendarMode = input.calendarMode;
  }
  if (typeof input.disputeFreezeActive === 'boolean') {
    base.disputeFreezeActive = input.disputeFreezeActive;
  }
  if (input.communityState && typeof input.communityState === 'object' && !Array.isArray(input.communityState)) {
    base.communityState = input.communityState as Record<string, unknown>;
  }
  if (input.chatState && typeof input.chatState === 'object' && !Array.isArray(input.chatState)) {
    base.chatState = input.chatState as Record<string, unknown>;
  }
  if (typeof input.darkMode === 'boolean') {
    base.darkMode = input.darkMode;
  }
  if (typeof input.verifiedFamilyId === 'string' && input.verifiedFamilyId.trim()) {
    base.verifiedFamilyId = input.verifiedFamilyId.trim();
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
      const mRaw = pa.mother as Partial<ParentAccountProfile>;
      const mCountry = mRaw.country ? resolveCountryCode(mRaw.country, base.parentAccounts.mother.country) : base.parentAccounts.mother.country;
      base.parentAccounts.mother = {
        ...base.parentAccounts.mother,
        ...mRaw,
        country: mCountry,
        phoneCode: mRaw.phoneCode || getCountryDialCode(mCountry),
        city: typeof mRaw.city === 'string' && mRaw.city.trim() ? mRaw.city.trim() : getDefaultCityForCountry(mCountry),
        notificationPrefs: {
          ...base.parentAccounts.mother.notificationPrefs,
          ...(mRaw.notificationPrefs || {}),
        },
      };
    }
    if (pa.father && typeof pa.father === 'object') {
      const fRaw = pa.father as Partial<ParentAccountProfile>;
      const fCountry = fRaw.country ? resolveCountryCode(fRaw.country, base.parentAccounts.father.country) : base.parentAccounts.father.country;
      base.parentAccounts.father = {
        ...base.parentAccounts.father,
        ...fRaw,
        country: fCountry,
        phoneCode: fRaw.phoneCode || getCountryDialCode(fCountry),
        city: typeof fRaw.city === 'string' && fRaw.city.trim() ? fRaw.city.trim() : getDefaultCityForCountry(fCountry),
        notificationPrefs: {
          ...base.parentAccounts.father.notificationPrefs,
          ...(fRaw.notificationPrefs || {}),
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
    const validRawKids = input.kids.filter(
      (k): k is Record<string, unknown> =>
        Boolean(k && typeof k === 'object' && !Array.isArray(k))
    );
    if (validRawKids.length > 0 || input.kids.length === 0) {
      base.kids = validRawKids.map((k, idx) => {
        const gender = k.gender === 'girl' ? 'girl' : 'boy';
        const rawTheme = k.avatarTheme as AvatarAccessoryTheme;
        const kidId = Number.isFinite(Number(k.id)) && Number(k.id) > 0 ? Number(k.id) : idx + 1;
        const remoteId =
          typeof k.remoteId === 'string' || typeof k.remoteId === 'number'
            ? k.remoteId
            : typeof k.id === 'string' && !Number.isFinite(Number(k.id))
            ? k.id.trim()
            : undefined;
        const trimmedName = String(k.name ?? '').trim() || `طفل ${idx + 1}`;
        const seedKid = DEFAULT_SEED.kids.find(
          (sk) => sk.id === kidId && sk.name === trimmedName
        );
        const rawVoiceMoments = Array.isArray(k.voiceMoments)
          ? k.voiceMoments
              .filter((vm): vm is Record<string, unknown> => Boolean(vm && typeof vm === 'object'))
              .map((vm, vIdx) => ({
                id: typeof vm.id === 'string' && vm.id ? vm.id : `vm-${kidId}-${vIdx + 1}`,
                title: typeof vm.title === 'string' && vm.title.trim() ? vm.title.trim() : 'لقطة صوتية مسجلة',
                createdAt: typeof vm.createdAt === 'string' && vm.createdAt ? vm.createdAt : dateLocalISO(new Date()),
                durationSec: Number.isFinite(Number(vm.durationSec))
                  ? Math.max(1, Math.min(10, Number(vm.durationSec)))
                  : 10,
                tag: typeof vm.tag === 'string' && vm.tag ? vm.tag : 'ذكرى صوتية 🎙️',
                recordedBy: (vm.recordedBy === 'father' ? 'father' : 'mother') as 'mother' | 'father',
                melodyHz: Array.isArray(vm.melodyHz)
                  ? vm.melodyHz.map((n) => Number(n)).filter((n) => Number.isFinite(n))
                  : undefined,
              }))
          : seedKid?.voiceMoments
          ? structuredClone(seedKid.voiceMoments)
          : [];
        const normalizedProfileDetails =
          k.profileDetails && typeof k.profileDetails === 'object' && !Array.isArray(k.profileDetails)
            ? (k.profileDetails as ChildProfileDetails)
            : seedKid?.profileDetails
            ? structuredClone(seedKid.profileDetails)
            : undefined;
        const rawColorTheme =
          (typeof k.colorTheme === 'string' ? k.colorTheme : undefined) ||
          (typeof normalizedProfileDetails?.colorTheme === 'string'
            ? normalizedProfileDetails.colorTheme
            : undefined) ||
          (typeof normalizedProfileDetails?.extra?.colorTheme === 'string'
            ? String(normalizedProfileDetails.extra.colorTheme)
            : undefined);
        const validColorThemes = new Set<ChildColorThemeId>(CHILD_COLOR_PALETTE_ORDER);
        const resolvedExplicitColor =
          rawColorTheme && validColorThemes.has(rawColorTheme as ChildColorThemeId)
            ? (rawColorTheme as ChildColorThemeId)
            : undefined;
        const mergedProfileDetails: ChildProfileDetails | undefined = resolvedExplicitColor
          ? {
              ...(normalizedProfileDetails || {}),
              colorTheme: resolvedExplicitColor,
              extra: {
                ...(normalizedProfileDetails?.extra || {}),
                colorTheme: resolvedExplicitColor,
              },
            }
          : normalizedProfileDetails;
        return {
          id: kidId,
          ...(remoteId !== undefined ? { remoteId } : {}),
          name: trimmedName,
          gender,
          birth: typeof k.birth === 'string' ? k.birth : '',
          interests: typeof k.interests === 'string' ? k.interests : '',
          ...(mergedProfileDetails ? { profileDetails: mergedProfileDetails } : {}),
          emoji: typeof k.emoji === 'string' && k.emoji ? k.emoji : gender === 'girl' ? '👧🏻' : '👦🏻',
          bloodType: typeof k.bloodType === 'string' ? k.bloodType : undefined,
          vaccinationsNote: typeof k.vaccinationsNote === 'string' ? k.vaccinationsNote : undefined,
          healthNotePrivate: typeof k.healthNotePrivate === 'string' ? k.healthNotePrivate : undefined,
          growthHeightCm: Number.isFinite(Number(k.growthHeightCm)) ? Number(k.growthHeightCm) : undefined,
          growthWeightKg: Number.isFinite(Number(k.growthWeightKg)) ? Number(k.growthWeightKg) : undefined,
          avatarTheme: validThemes.has(rawTheme) ? rawTheme : gender === 'girl' ? 'artist' : 'astronaut',
          ...(resolvedExplicitColor ? { colorTheme: resolvedExplicitColor } : {}),
          photoDataUrl: typeof k.photoDataUrl === 'string' && k.photoDataUrl ? k.photoDataUrl : undefined,
          useIllustratedAvatar: typeof k.useIllustratedAvatar === 'boolean' ? k.useIllustratedAvatar : true,
          voiceMoments: rawVoiceMoments,
        };
      });
    }
  }

  const validKidIds = new Set(base.kids.map((k) => Number(k.id)));
  const remoteIdToLocalKidId = new Map<string, number>();
  base.kids.forEach((k) => {
    if (k.remoteId !== undefined && k.remoteId !== null) {
      remoteIdToLocalKidId.set(String(k.remoteId), k.id);
    }
  });

  if (Array.isArray(input.tasks)) {
    const todayLocalISO = dateLocalISO(new Date());
    base.tasks = input.tasks
      .filter((t): t is Record<string, unknown> => Boolean(t && typeof t === 'object'))
      .map((t, idx) => {
        const rawKid = t.kidId ? Number(t.kidId) : null;
        const resolvedKidId =
          rawKid && validKidIds.has(rawKid)
            ? rawKid
            : t.remoteChildId && remoteIdToLocalKidId.has(String(t.remoteChildId))
            ? remoteIdToLocalKidId.get(String(t.remoteChildId))!
            : typeof t.kidId === 'string' && remoteIdToLocalKidId.has(t.kidId)
            ? remoteIdToLocalKidId.get(t.kidId)!
            : null;
        const remoteId =
          typeof t.remoteId === 'string' || typeof t.remoteId === 'number'
            ? t.remoteId
            : typeof t.id === 'string' && !Number.isFinite(Number(t.id))
            ? t.id.trim()
            : undefined;
        const remoteChildId =
          typeof t.remoteChildId === 'string' || typeof t.remoteChildId === 'number'
            ? t.remoteChildId
            : resolvedKidId
            ? base.kids.find((k) => k.id === resolvedKidId)?.remoteId ?? null
            : null;
        const cadence: TaskCadence =
          t.cadence === 'weekly' || t.cadence === 'monthly' ? t.cadence : 'daily';
        const rawDayOfWeek = Number(t.dayOfWeek);
        const dayOfWeek =
          Number.isInteger(rawDayOfWeek) && rawDayOfWeek >= 0 && rawDayOfWeek <= 6
            ? rawDayOfWeek
            : undefined;
        const daysOfWeek = Array.isArray(t.daysOfWeek)
          ? Array.from(
              new Set(
                t.daysOfWeek
                  .map((d) => Number(d))
                  .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
              )
            ).sort((a, b) => a - b)
          : undefined;
        const rawDayOfMonth = Number(t.dayOfMonth);
        const dayOfMonth =
          Number.isInteger(rawDayOfMonth) && rawDayOfMonth >= 1 && rawDayOfMonth <= 31
            ? rawDayOfMonth
            : undefined;
        const scheduledDate =
          typeof t.scheduledDate === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(t.scheduledDate.trim())
            ? t.scheduledDate.trim()
            : undefined;
        const hasCompletedDatesArray = Array.isArray(t.completedDates);
        const completedDates = hasCompletedDatesArray
          ? Array.from(
              new Set(
                (t.completedDates as unknown[])
                  .filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim()))
                  .map((d) => d.trim())
              )
            ).sort()
          : undefined;
        const lastCompletedDate =
          typeof t.lastCompletedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.lastCompletedDate.trim())
            ? t.lastCompletedDate.trim()
            : completedDates && completedDates.length > 0
            ? completedDates[completedDates.length - 1]
            : undefined;
        const resolvedDone = hasCompletedDatesArray
          ? completedDates!.includes(todayLocalISO)
          : lastCompletedDate
          ? Boolean(t.done) && lastCompletedDate === todayLocalISO
          : Boolean(t.done);
        return {
          id: Number.isFinite(Number(t.id)) ? Number(t.id) : idx + 1,
          ...(remoteId !== undefined ? { remoteId } : {}),
          name: String(t.name ?? '').trim() || `مهمة ${idx + 1}`,
          time: typeof t.time === 'string' ? t.time : '',
          done: resolvedDone,
          kidId: resolvedKidId,
          ...(remoteChildId ? { remoteChildId } : {}),
          category: typeof t.category === 'string' && t.category ? t.category : 'روتين عام',
          owner: typeof t.owner === 'string' && t.owner ? t.owner : 'مشترك',
          cadence,
          ...(scheduledDate !== undefined ? { scheduledDate } : {}),
          ...(dayOfWeek !== undefined ? { dayOfWeek } : {}),
          ...(daysOfWeek && daysOfWeek.length > 0 ? { daysOfWeek } : {}),
          ...(dayOfMonth !== undefined ? { dayOfMonth } : {}),
          ...(completedDates !== undefined ? { completedDates } : {}),
          ...(lastCompletedDate !== undefined ? { lastCompletedDate } : {}),
        };
      });
  }

  if (Array.isArray(input.events)) {
    base.events = input.events
      .filter((e): e is Record<string, unknown> => Boolean(e && typeof e === 'object'))
      .map((e, idx) => {
        const rawChild = e.childId ? Number(e.childId) : null;
        const resolvedChildId =
          rawChild && validKidIds.has(rawChild)
            ? rawChild
            : e.remoteChildId && remoteIdToLocalKidId.has(String(e.remoteChildId))
            ? remoteIdToLocalKidId.get(String(e.remoteChildId))!
            : typeof e.childId === 'string' && remoteIdToLocalKidId.has(e.childId)
            ? remoteIdToLocalKidId.get(e.childId)!
            : null;
        const remoteId =
          typeof e.remoteId === 'string' || typeof e.remoteId === 'number'
            ? e.remoteId
            : typeof e.id === 'string' && !Number.isFinite(Number(e.id))
            ? e.id.trim()
            : undefined;
        const remoteChildId =
          typeof e.remoteChildId === 'string' || typeof e.remoteChildId === 'number'
            ? e.remoteChildId
            : resolvedChildId
            ? base.kids.find((k) => k.id === resolvedChildId)?.remoteId ?? null
            : null;
        const repeat =
          e.repeat === 'weekly' || e.repeat === 'monthly' || e.repeat === 'yearly'
            ? e.repeat
            : 'none';
        return {
          id: Number.isFinite(Number(e.id)) ? Number(e.id) : idx + 1,
          ...(remoteId !== undefined ? { remoteId } : {}),
          title: String(e.title ?? '').trim() || `حدث ${idx + 1}`,
          date: typeof e.date === 'string' && e.date ? e.date : dateLocalISO(new Date()),
          time: typeof e.time === 'string' ? e.time : '',
          type: typeof e.type === 'string' && e.type ? e.type : 'موعد عائلي',
          childId: resolvedChildId,
          ...(remoteChildId ? { remoteChildId } : {}),
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
        const resolvedKid =
          validKidIds.has(rawKid)
            ? rawKid
            : w.remoteChildId && remoteIdToLocalKidId.has(String(w.remoteChildId))
            ? remoteIdToLocalKidId.get(String(w.remoteChildId))!
            : typeof w.kid === 'string' && remoteIdToLocalKidId.has(w.kid)
            ? remoteIdToLocalKidId.get(w.kid)!
            : 0;
        const remoteId =
          typeof w.remoteId === 'string' || typeof w.remoteId === 'number'
            ? w.remoteId
            : typeof w.id === 'string' && !Number.isFinite(Number(w.id))
            ? w.id.trim()
            : undefined;
        const remoteChildId =
          typeof w.remoteChildId === 'string' || typeof w.remoteChildId === 'number'
            ? w.remoteChildId
            : resolvedKid
            ? base.kids.find((k) => k.id === resolvedKid)?.remoteId ?? null
            : null;
        const progressRaw = Number(w.progress);
        const progress = Number.isFinite(progressRaw)
          ? Math.max(0, Math.min(100, Math.round(progressRaw)))
          : Boolean(w.reserved)
          ? 100
          : 50;
        return {
          id: Number.isFinite(Number(w.id)) ? Number(w.id) : idx + 1,
          ...(remoteId !== undefined ? { remoteId } : {}),
          name: String(w.name ?? '').trim() || `أمنية ${idx + 1}`,
          kid: resolvedKid,
          ...(remoteChildId ? { remoteChildId } : {}),
          price: Number.isFinite(Number(w.price)) && Number(w.price) >= 0 ? Number(w.price) : 0,
          currency: resolveCurrencyCode(w.currency, base.country),
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
        const remoteId =
          typeof f.remoteId === 'string' || typeof f.remoteId === 'number'
            ? f.remoteId
            : typeof f.id === 'string' && !Number.isFinite(Number(f.id))
            ? f.id.trim()
            : undefined;
        return {
          id: Number.isFinite(Number(f.id)) ? Number(f.id) : idx + 1,
          ...(remoteId !== undefined ? { remoteId } : {}),
          name: String(f.name ?? '').trim() || `فرد ${idx + 1}`,
          role: roleStr,
          side: typeof f.side === 'string' && f.side ? f.side : 'الأسرة الأساسية',
          wishes: wishesFlag,
          events: eventsFlag,
          emoji: typeof f.emoji === 'string' && f.emoji ? f.emoji : '👤',
          roleCategory: (f.roleCategory as ExtendedRoleCategory) || (isCore ? 'father' : 'grandparent'),
          phoneCountry: resolveCountryCode(f.phoneCountry, base.country),
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
          phoneCountry: resolveCountryCode(inv.phoneCountry, base.country),
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

  if (Array.isArray(input.serviceBookings)) {
    base.serviceBookings = input.serviceBookings
      .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object' && !Array.isArray(entry)))
      .map((entry) => ({
        id: typeof entry.id === 'string' ? entry.id.slice(0, 64) : '',
        createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : dateLocalISO(new Date()),
        serviceId: Number.isInteger(Number(entry.serviceId)) ? Number(entry.serviceId) : 0,
        serviceName: typeof entry.serviceName === 'string' ? entry.serviceName.slice(0, 160) : '',
        providerName: typeof entry.providerName === 'string' ? entry.providerName.slice(0, 120) : '',
        date: typeof entry.date === 'string' ? entry.date.slice(0, 10) : '',
        time: typeof entry.time === 'string' ? entry.time.slice(0, 5) : '',
        beneficiary: typeof entry.beneficiary === 'string' ? entry.beneficiary.slice(0, 80) : '',
        ...(typeof entry.notes === 'string' && entry.notes.trim() ? { notes: entry.notes.slice(0, 400) } : {}),
        price: Number.isFinite(Number(entry.price)) ? Math.max(0, Number(entry.price)) : 0,
        currency: typeof entry.currency === 'string' && isSupportedCurrencyCode(entry.currency) ? entry.currency : base.currency,
        status: 'requested_demo' as const,
      }))
      .filter((entry) => Boolean(entry.id && entry.serviceId > 0 && entry.serviceName && entry.date && entry.time && entry.beneficiary));
  }

  return base;
}

export function dateLocalISO(dte: Date = new Date()): string {
  const y = dte.getFullYear();
  const m = String(dte.getMonth() + 1).padStart(2, '0');
  const day = String(dte.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses a local YYYY-MM-DD date string without UTC timezone drift.
 */
export function parseLocalISODateParts(
  dateISO: string
): { year: number; month: number; day: number; dayOfWeek: number } | null {
  if (typeof dateISO !== 'string') return null;
  const match = dateISO.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;
  const localDate = new Date(year, month - 1, day, 12, 0, 0);
  return {
    year,
    month,
    day,
    dayOfWeek: localDate.getDay(),
  };
}

/**
 * Returns the exact number of days in a given 1-indexed month (1 = January .. 12 = December),
 * accounting for leap years in February.
 */
export function getDaysInMonth(year: number, month1To12: number): number {
  if (month1To12 === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  if (month1To12 === 4 || month1To12 === 6 || month1To12 === 9 || month1To12 === 11) {
    return 30;
  }
  return 31;
}

/**
 * Determines whether a routine task is scheduled to appear on a given local YYYY-MM-DD date.
 * - Daily tasks appear every day.
 * - Weekly tasks appear on their configured weekday(s) (`daysOfWeek` or `dayOfWeek`).
 * - Monthly tasks appear on their `dayOfMonth`, clamped safely for short months (28/29/30 days) and leap years.
 */
export function isTaskScheduledForDate(
  task: Pick<RoutineTask, 'cadence' | 'dayOfWeek' | 'daysOfWeek' | 'dayOfMonth' | 'scheduledDate'>,
  targetDateISO: string = dateLocalISO(new Date())
): boolean {
  const parts = parseLocalISODateParts(targetDateISO);
  if (!parts) return true;
  if (task.scheduledDate) return task.scheduledDate === targetDateISO;

  if (task.cadence === 'weekly') {
    if (Array.isArray(task.daysOfWeek) && task.daysOfWeek.length > 0) {
      return task.daysOfWeek.includes(parts.dayOfWeek);
    }
    if (typeof task.dayOfWeek === 'number' && Number.isInteger(task.dayOfWeek)) {
      return task.dayOfWeek === parts.dayOfWeek;
    }
    return true;
  }

  if (task.cadence === 'monthly') {
    if (typeof task.dayOfMonth === 'number' && Number.isInteger(task.dayOfMonth) && task.dayOfMonth >= 1) {
      const effectiveDay = Math.min(task.dayOfMonth, getDaysInMonth(parts.year, parts.month));
      return parts.day === effectiveDay;
    }
    return true;
  }

  return true;
}

/**
 * Checks whether a routine task was completed on the specified local YYYY-MM-DD date.
 * Ensures yesterday's completion never bleeds into today while keeping backward compatibility
 * for legacy tasks that only set `done: true` without date history.
 */
export function isTaskCompletedOnDate(
  task: Pick<RoutineTask, 'done' | 'completedDates' | 'lastCompletedDate'>,
  targetDateISO: string = dateLocalISO(new Date())
): boolean {
  if (Array.isArray(task.completedDates)) {
    return task.completedDates.includes(targetDateISO);
  }
  if (typeof task.lastCompletedDate === 'string' && task.lastCompletedDate.trim()) {
    return Boolean(task.done) && task.lastCompletedDate.trim() === targetDateISO;
  }
  return Boolean(task.done);
}

/**
 * Toggles a task's completion status for a specific local YYYY-MM-DD date.
 * - Preserves all past completion dates in `completedDates`.
 * - Prevents duplicate entries for the same date.
 * - Updates `done` to match the target date.
 */
export function toggleTaskCompletionForDate(
  task: RoutineTask,
  done: boolean,
  targetDateISO: string = dateLocalISO(new Date())
): RoutineTask {
  const cleanDate = targetDateISO.trim();
  const existingSet = new Set<string>(
    Array.isArray(task.completedDates)
      ? task.completedDates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      : task.lastCompletedDate && /^\d{4}-\d{2}-\d{2}$/.test(task.lastCompletedDate)
      ? [task.lastCompletedDate]
      : []
  );

  if (done) {
    existingSet.add(cleanDate);
  } else {
    existingSet.delete(cleanDate);
  }

  const completedDates = Array.from(existingSet).sort();
  const lastCompletedDate =
    completedDates.length > 0 ? completedDates[completedDates.length - 1] : undefined;

  return {
    ...task,
    done: completedDates.includes(cleanDate),
    completedDates,
    lastCompletedDate,
  };
}

/**
 * Refreshes a task list for the current local date so that yesterday's completions
 * remain in `completedDates` history while `done` accurately reflects today.
 */
export function refreshTasksForCurrentDate(
  tasks: RoutineTask[],
  todayISO: string = dateLocalISO(new Date())
): RoutineTask[] {
  return tasks.map((task) => {
    if (!Array.isArray(task.completedDates) && !task.lastCompletedDate) {
      return task;
    }
    const doneToday = isTaskCompletedOnDate(task, todayISO);
    if (task.done === doneToday) return task;
    return {
      ...task,
      done: doneToday,
    };
  });
}

export interface ChildVisualIdentitySpec {
  id: ChildColorThemeId;
  labelAr: string;
  labelEn: string;
  swatchHex: string;
  commandCenterGradient: string;
  commandCenterBorder: string;
  innerPanelBg: string;
  activePillClass: string;
  inactivePillClass: string;
  accentButtonClass: string;
  progressBarClass: string;
  selectBgClass: string;
  softBadgeClass: string;
  cardTone: 'teal' | 'sky' | 'purple' | 'rose' | 'emerald';
}

export const CHILD_VISUAL_IDENTITY_THEMES: Record<ChildColorThemeId, ChildVisualIdentitySpec> = {
  teal: {
    id: 'teal',
    labelAr: 'تركواز هادئ',
    labelEn: 'Calm Teal',
    swatchHex: '#0D9488',
    commandCenterGradient: 'from-[#073F43] via-[#0B5054] to-[#123E52]',
    commandCenterBorder: 'border-teal-400/30',
    innerPanelBg: 'bg-[#052B30]/65',
    activePillClass: 'border-[#8FF0D0] bg-[#8FF0D0] text-[#063236] shadow-md',
    inactivePillClass: 'border-white/20 bg-white/10 text-white hover:bg-white/15',
    accentButtonClass: 'bg-[#8FF0D0] text-[#063236] hover:bg-[#A7F5DC]',
    progressBarClass: 'bg-[#8FF0D0]',
    selectBgClass: 'bg-[#093D42]',
    softBadgeClass: 'bg-teal-500/15 text-teal-800 dark:text-teal-200 border-teal-500/30',
    cardTone: 'teal',
  },
  sky: {
    id: 'sky',
    labelAr: 'أزرق سماوي',
    labelEn: 'Sky Blue',
    swatchHex: '#0284C7',
    commandCenterGradient: 'from-[#0B2F4E] via-[#0E3F68] to-[#144C78]',
    commandCenterBorder: 'border-sky-400/30',
    innerPanelBg: 'bg-[#08243D]/65',
    activePillClass: 'border-[#93E2FF] bg-[#93E2FF] text-[#082842] shadow-md',
    inactivePillClass: 'border-white/20 bg-white/10 text-white hover:bg-white/15',
    accentButtonClass: 'bg-[#93E2FF] text-[#082842] hover:bg-[#B3ECFF]',
    progressBarClass: 'bg-[#93E2FF]',
    selectBgClass: 'bg-[#0B3558]',
    softBadgeClass: 'bg-sky-500/15 text-sky-800 dark:text-sky-200 border-sky-500/30',
    cardTone: 'sky',
  },
  violet: {
    id: 'violet',
    labelAr: 'بنفسجي دافئ',
    labelEn: 'Soft Violet',
    swatchHex: '#7C3AED',
    commandCenterGradient: 'from-[#2A1B4E] via-[#382368] to-[#2B2B5E]',
    commandCenterBorder: 'border-violet-400/30',
    innerPanelBg: 'bg-[#1D1238]/65',
    activePillClass: 'border-[#DDD6FE] bg-[#DDD6FE] text-[#28184A] shadow-md',
    inactivePillClass: 'border-white/20 bg-white/10 text-white hover:bg-white/15',
    accentButtonClass: 'bg-[#DDD6FE] text-[#28184A] hover:bg-[#EDE9FE]',
    progressBarClass: 'bg-[#C4B5FD]',
    selectBgClass: 'bg-[#2B1B52]',
    softBadgeClass: 'bg-violet-500/15 text-violet-800 dark:text-violet-200 border-violet-500/30',
    cardTone: 'purple',
  },
  coral: {
    id: 'coral',
    labelAr: 'مرجاني دافئ',
    labelEn: 'Warm Coral',
    swatchHex: '#E11D48',
    commandCenterGradient: 'from-[#4A182B] via-[#5E2038] to-[#4D243D]',
    commandCenterBorder: 'border-rose-400/30',
    innerPanelBg: 'bg-[#36101F]/65',
    activePillClass: 'border-[#FECDD3] bg-[#FECDD3] text-[#451225] shadow-md',
    inactivePillClass: 'border-white/20 bg-white/10 text-white hover:bg-white/15',
    accentButtonClass: 'bg-[#FECDD3] text-[#451225] hover:bg-[#FFE4E6]',
    progressBarClass: 'bg-[#FDA4AF]',
    selectBgClass: 'bg-[#4D192D]',
    softBadgeClass: 'bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/30',
    cardTone: 'rose',
  },
  emerald: {
    id: 'emerald',
    labelAr: 'أخضر زمردي',
    labelEn: 'Fresh Emerald',
    swatchHex: '#059669',
    commandCenterGradient: 'from-[#093B2C] via-[#0E4F3B] to-[#13463E]',
    commandCenterBorder: 'border-emerald-400/30',
    innerPanelBg: 'bg-[#062B20]/65',
    activePillClass: 'border-[#A7F3D0] bg-[#A7F3D0] text-[#063325] shadow-md',
    inactivePillClass: 'border-white/20 bg-white/10 text-white hover:bg-white/15',
    accentButtonClass: 'bg-[#A7F3D0] text-[#063325] hover:bg-[#D1FAE5]',
    progressBarClass: 'bg-[#6EE7B7]',
    selectBgClass: 'bg-[#0B3F2F]',
    softBadgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-emerald-500/30',
    cardTone: 'emerald',
  },
};

export function isValidChildColorTheme(value: unknown): value is ChildColorThemeId {
  return typeof value === 'string' && (CHILD_COLOR_PALETTE_ORDER as readonly string[]).includes(value);
}

/**
 * Resolves the child's dedicated visual identity color theme.
 * - Uses the explicit `colorTheme` saved on the child profile when present.
 * - Otherwise assigns a distinct color from `CHILD_COLOR_PALETTE_ORDER` without repeating
 *   colors already assigned to preceding children in `allKids`.
 */
export function resolveChildColorTheme(
  kid: ChildProfile | null | undefined,
  allKids: readonly ChildProfile[] = []
): ChildColorThemeId {
  if (!kid) return 'teal';
  const explicit =
    kid.colorTheme ||
    kid.profileDetails?.colorTheme ||
    (typeof kid.profileDetails?.extra?.colorTheme === 'string'
      ? kid.profileDetails.extra.colorTheme
      : undefined);
  if (isValidChildColorTheme(explicit)) {
    return explicit;
  }

  const usedThemes = new Set<ChildColorThemeId>();
  for (const other of allKids) {
    if (!other || other.id === kid.id) continue;
    const otherExplicit =
      other.colorTheme ||
      other.profileDetails?.colorTheme ||
      (typeof other.profileDetails?.extra?.colorTheme === 'string'
        ? other.profileDetails.extra.colorTheme
        : undefined);
    if (isValidChildColorTheme(otherExplicit)) {
      usedThemes.add(otherExplicit);
    }
  }

  for (const other of allKids) {
    if (!other) continue;
    if (other.id === kid.id) {
      const available = CHILD_COLOR_PALETTE_ORDER.find((c) => !usedThemes.has(c));
      if (available) return available;
      const idx = allKids.findIndex((k) => k.id === kid.id);
      return CHILD_COLOR_PALETTE_ORDER[Math.max(0, idx) % CHILD_COLOR_PALETTE_ORDER.length];
    }
    const otherExplicit =
      other.colorTheme ||
      other.profileDetails?.colorTheme ||
      (typeof other.profileDetails?.extra?.colorTheme === 'string'
        ? other.profileDetails.extra.colorTheme
        : undefined);
    if (isValidChildColorTheme(otherExplicit)) {
      usedThemes.add(otherExplicit);
    } else {
      const assigned = CHILD_COLOR_PALETTE_ORDER.find((c) => !usedThemes.has(c));
      if (assigned) usedThemes.add(assigned);
    }
  }

  const fallbackAvailable = CHILD_COLOR_PALETTE_ORDER.find((c) => !usedThemes.has(c));
  return fallbackAvailable || CHILD_COLOR_PALETTE_ORDER[Math.abs(Number(kid.id) || 0) % CHILD_COLOR_PALETTE_ORDER.length];
}

export function getChildVisualIdentitySpec(
  themeId: ChildColorThemeId | null | undefined
): ChildVisualIdentitySpec {
  if (themeId && CHILD_VISUAL_IDENTITY_THEMES[themeId]) {
    return CHILD_VISUAL_IDENTITY_THEMES[themeId];
  }
  return CHILD_VISUAL_IDENTITY_THEMES.teal;
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

/** Resolve legacy city names, English aliases and sub-cities to one canonical region ID. */
export function resolveCityRegionId(country: CountryCode, rawCity: string | null | undefined): string {
  const safeCountry = resolveCountryCode(country, 'EG');
  const cities = COUNTRY_CITIES_MAP[safeCountry] || COUNTRY_CITIES_MAP.EG;
  const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
  const target = typeof rawCity === 'string' ? normalize(rawCity) : '';

  if (!target) return cities[0].id;

  const match = cities.find((city) => {
    const aliases = [
      city.id,
      city.nameAr,
      city.nameEn,
      city.labelAr,
      city.labelEn,
      city.regionAr,
      city.regionEn,
      ...(city.subCitiesAr || []),
      ...(city.subCitiesEn || []),
    ];
    return aliases.some((alias) => typeof alias === 'string' && normalize(alias) === target);
  });

  return match?.id || cities[0].id;
}

export function getSuggestedCurrencyForCountry(country: CountryCode): CurrencyCode {
  return getSuggestedCurrencyFromRegistry(country);
}

export function formatCurrency(
  amount: number,
  currency: CurrencyCode,
  lang: LanguageCode = 'ar'
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const resolvedCurrency = resolveCurrencyCode(currency);
  const meta = CURRENCY_METADATA_MAP[resolvedCurrency];
  const locale = lang === 'en' ? 'en-US' : resolvedCurrency === 'EGP' ? 'ar-EG' : 'ar-SA';
  const formattedNum = new Intl.NumberFormat(locale, {
    maximumFractionDigits: meta?.decimals ?? 0,
  }).format(safeAmount);
  if (lang === 'en') {
    return `${formattedNum} ${meta?.symbolEn || resolvedCurrency}`;
  }
  return `${formattedNum} ${meta?.symbolAr || resolvedCurrency}`;
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
  const safeCountry = resolveCountryCode(country, 'EG');
  const timeZone = getCountryTimezone(safeCountry);
  const baseLocale = lang === 'en' ? 'en-US' : safeCountry === 'EG' ? 'ar-EG' : 'ar-SA';
  let gregorian = dateStr;
  let hijri = '';
  try {
    gregorian = new Intl.DateTimeFormat(`${baseLocale}-u-ca-gregory`, {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone,
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
      timeZone,
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
  const phoneDigits = String(parentProfile.phoneNumber || '').replace(/\D/g, '');
  const maskedPhone = phoneDigits
    ? `${'•'.repeat(Math.max(4, phoneDigits.length - 2))}${phoneDigits.slice(-2)}`
    : '—';

  const items: DailyParentingNotification[] = [];

  if (prefs.enabled && prefs.morningEnabled) {
    items.push({
      id: `notif-${parentId}-morning`,
      slot: 'morning',
      parentTarget: parentId,
      scheduledTime: prefs.morningTime || '08:30',
      categoryLabelAr: 'إشعار الصباح (١/٣) · همسة اليوم وتنظيم الروتين',
      categoryLabelEn: 'Morning Notification (1/3) · Daily Tip & Routine',
      titleAr: `${parentTitleAr}: بداية يوم هادئة${primaryKid ? ` مع ${primaryKid.name}` : ''}`,
      titleEn: `${parentTitleEn}: A Calm Start to the Day${primaryKid ? ` with ${primaryKid.name}` : ''}`,
      bodyAr: `صباح الخير يا ${parentProfile.fullName.split(' ')[0]} 🌿 اختاروا خطوة بسيطة وواضحة لبداية اليوم، واسألوا طفلكم إيه اللي يساعده يستعد. مش لازم كل حاجة تمشي بشكل مثالي.`,
      bodyEn: `Good morning, ${parentProfile.fullName.split(' ')[0]}. Choose one simple step for the morning and ask your child what would help them get ready. The day does not have to go perfectly.`,
      childName: primaryKid?.name,
      ageStage: primaryAge?.stageCode,
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
      titleAr: secondaryKid
        ? `استراحة الظهيرة ووقت تواصل مع ${secondaryKid.name}${secondaryAge?.label ? ` (${secondaryAge.label})` : ''}`
        : 'استراحة الظهيرة ووقت تواصل للأسرة',
      titleEn: secondaryKid ? `A Midday Reset with ${secondaryKid.name}` : 'A Midday Reset for the Family',
      bodyAr: 'لو الوقت مناسب، اعملوا استراحة قصيرة تناسب سن طفلكم واهتمامه: حركة خفيفة، لعب مشترك، قراءة، أو حديث بسيط عن يومه. اختاروا نشاطًا واحدًا من غير ضغط.',
      bodyEn: 'If the timing works, offer a short break that fits your child’s age and interests: gentle movement, shared play, reading, or a relaxed chat about the day. One simple option is enough.',
      childName: secondaryKid?.name,
      ageStage: secondaryAge?.stageCode,
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
      bodyAr: `قبل النوم، جرّبوا روتينًا هادئًا يناسب طفلكم: قصة قصيرة، حديث بسيط، أو نشاط مريح بعيدًا عن الشاشات. اسألوه عن شيء أحبّه في يومه، من غير ضغط لو مش حابب يتكلم 🌙.`,
      bodyEn: 'Try a calm bedtime routine that suits your child: a short story, a gentle chat, or a relaxing screen-free activity. You can ask what they enjoyed today, without pressure if they do not feel like talking. 🌙',
      childName: primaryKid?.name,
      ageStage: primaryAge?.stageCode,
      read: state.readNotificationIds.includes(`notif-${parentId}-evening`),
    });
  }

  // Parent wellbeing messages are always available in the center, independently of routine reminder preferences.
  const parentSupportMessages = isMother
    ? [
        {
          id: `notif-${parentId}-support-morning`,
          slot: 'support' as const,
          scheduledTime: 'رسالة دعم · الصباح',
          categoryLabelAr: 'دعم نفسي للأم',
          categoryLabelEn: 'Emotional Support for Mom',
          titleAr: 'صباحك مش لازم يبدأ بالكمال 💚',
          titleEn: 'Your Morning Does Not Have to Be Perfect 💚',
          bodyAr: 'خدي نفسًا وابدئي بالأهم فقط. مش مطلوب منك تخلصي كل حاجة النهارده، وطلب المساعدة أو تأجيل مهمة مش تقصير. وجودك واهتمامك لهما قيمة.',
          bodyEn: 'Take a breath and start with what matters most. You do not have to finish everything today. Asking for help or postponing a task is not failure; your care matters.',
        },
        {
          id: `notif-${parentId}-support-midday`,
          slot: 'support' as const,
          scheduledTime: 'رسالة دعم · منتصف اليوم',
          categoryLabelAr: 'توازن الأم واحتياجاتها',
          categoryLabelEn: 'Mom’s Wellbeing',
          titleAr: 'احتياجاتك جزء من رعاية الأسرة',
          titleEn: 'Your Needs Are Part of Caring for Your Family',
          bodyAr: 'لو تقدري، خدي استراحة قصيرة واشربي مية وكلمي شخصًا ترتاحي له. الاهتمام بنفسك مش أنانية، ومش لازم تستني لحد ما تنهكي.',
          bodyEn: 'If you can, take a short break, drink some water, and connect with someone you trust. Caring for yourself is not selfish, and you do not have to wait until you are exhausted.',
        },
        {
          id: `notif-${parentId}-support-evening`,
          slot: 'support' as const,
          scheduledTime: 'رسالة دعم · المساء',
          categoryLabelAr: 'تقدير ومساندة الأم',
          categoryLabelEn: 'Encouragement for Mom',
          titleAr: 'مش كل يوم لازم يكون مثاليًا',
          titleEn: 'Not Every Day Has to Be Perfect',
          bodyAr: 'افتكري موقفًا صغيرًا كنتِ حاضرة فيه مع أسرتك اليوم. ولو اليوم كان مرهقًا، ده لا يقلل من قيمتك ولا من حبك. بكرة فرصة جديدة، ومسموح لك ترتاحي.',
          bodyEn: 'Remember one small moment when you were present for your family today. If the day was hard, it does not reduce your worth or your love. Tomorrow is another chance, and you are allowed to rest.',
        },
      ]
    : [
        {
          id: `notif-${parentId}-support-morning`,
          slot: 'support' as const,
          scheduledTime: 'رسالة دعم · الصباح',
          categoryLabelAr: 'دعم نفسي للأب',
          categoryLabelEn: 'Emotional Support for Dad',
          titleAr: 'ابدأ يومك بخطوة واحدة كفاية',
          titleEn: 'One Good Step Is Enough to Begin',
          bodyAr: 'مش مطلوب منك تحل كل التحديات مرة واحدة. اختار أولوية واحدة، وافتكر إن الحضور والاستماع والمشاركة في المسؤولية أشكال مهمة من الرعاية.',
          bodyEn: 'You do not have to solve every challenge at once. Choose one priority, and remember that being present, listening, and sharing responsibility are meaningful forms of care.',
        },
        {
          id: `notif-${parentId}-support-midday`,
          slot: 'support' as const,
          scheduledTime: 'رسالة دعم · منتصف اليوم',
          categoryLabelAr: 'توازن الأب واحتياجاته',
          categoryLabelEn: 'Dad’s Wellbeing',
          titleAr: 'من حقك تطلب المساندة',
          titleEn: 'You Are Allowed to Ask for Support',
          bodyAr: 'لو الضغوط زادت، شارك اللي حاسس به مع شخص تثق فيه، واتفق مع شريكك على توزيع أوضح للمسؤوليات. مش لازم تشيل كل شيء وحدك.',
          bodyEn: 'If pressure builds, talk with someone you trust and agree with your partner on a clearer sharing of responsibilities. You do not have to carry everything alone.',
        },
        {
          id: `notif-${parentId}-support-evening`,
          slot: 'support' as const,
          scheduledTime: 'رسالة دعم · المساء',
          categoryLabelAr: 'تقدير ومساندة الأب',
          categoryLabelEn: 'Encouragement for Dad',
          titleAr: 'تواجدك الهادئ له معنى',
          titleEn: 'Your Calm Presence Matters',
          bodyAr: 'حتى اللحظات الصغيرة من اللعب أو الاستماع أو مساعدة الأسرة بتفرق. قيّم يومك برفق، ومش لازم تكون مثاليًا عشان تكون أبًا حاضرًا ومحبًا.',
          bodyEn: 'Small moments of play, listening, or helping your family matter. Be gentle with yourself; you do not have to be perfect to be a present and caring dad.',
        },
      ];

  items.push(
    ...parentSupportMessages.map((message) => ({
      ...message,
      parentTarget: parentId,
      read: state.readNotificationIds.includes(message.id),
    }))
  );

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
    bodyAr: `هاتف الحساب (${parentProfile.phoneCode} ${maskedPhone}) ${parentProfile.phoneVerified ? 'موثّق ✅' : 'بانتظار التحقق'}. تظل إشعارات الأمان وتغييرات الصلاحيات نشطة حتى أثناء ساعات الهدوء (${prefs.quietHoursStart} – ${prefs.quietHoursEnd}).`,
    bodyEn: `Account phone (${parentProfile.phoneCode} ${maskedPhone}) is ${parentProfile.phoneVerified ? 'verified ✅' : 'pending verification'}. Security and permission alerts stay active even during Quiet Hours (${prefs.quietHoursStart} – ${prefs.quietHoursEnd}).`,
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
  paymentMethod: CheckoutPaymentMethodType,
  catalog: CommercialCatalogItem[] = COMMERCIAL_CATALOG
): {
  subtotal: number;
  deliveryFee: number;
  codFee: number;
  grandTotal: number;
  itemCount: number;
} {
  const resolvedCurrency = resolveCurrencyCode(currency);
  const decimals = CURRENCY_METADATA_MAP[resolvedCurrency]?.decimals ?? 0;
  const roundAmt = (val: number) =>
    decimals > 0 ? Math.round(val * Math.pow(10, decimals)) / Math.pow(10, decimals) : Math.round(val);

  let subtotal = 0;
  let itemCount = 0;
  for (const ci of cart) {
    const prod = catalog.find((p) => p.id === ci.productId);
    if (!prod) continue;
    const unitPrice = convertCatalogPrice(prod.priceEGP, prod.priceSAR, resolvedCurrency);
    subtotal += unitPrice * ci.quantity;
    itemCount += ci.quantity;
  }
  subtotal = roundAmt(subtotal);
  const deliveryFee = itemCount > 0 ? convertCatalogPrice(45, 15, resolvedCurrency) : 0;
  const codFee =
    itemCount > 0 && paymentMethod === 'cod'
      ? convertCatalogPrice(15, 5, resolvedCurrency)
      : 0;
  return {
    subtotal,
    deliveryFee,
    codFee,
    grandTotal: roundAmt(subtotal + deliveryFee + codFee),
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
  pageBackground: '#0B131A',
  surfaceBackground: '#101D26',
  elevatedControlBackground: '#162834',
  textPrimary: '#F8FAFC',
  textMuted: '#CBD5E1',
  borderSubtle: '#1E3646',
} as const;

export interface ParentProfileThemeSpec {
  role: ParentThemeRole;
  accountKey: 'mother' | 'father';
  paletteFamily: 'coral-rose' | 'teal-slate';
  displayNameAr: string;
  displayNameEn: string;
  greetingAr: string;
  greetingEn: string;
  roleBadgeAr: string;
  roleBadgeEn: string;
  accentHex: string;
  secondaryAccentHex: string;
  badgeBgCss: string;
  badgeTextCss: string;
  badgeBorderCss: string;
  glowColorCss: string;
}

/**
 * Returns the distinct visual & greeting specification for Father (Teal / Slate Blue)
 * vs. Mother (Soft Coral / Warm Rose) across Light and Dark modes.
 */
export function getParentProfileThemeSpec(
  role: ParentThemeRole,
  parentName?: string,
  darkMode?: boolean
): ParentProfileThemeSpec {
  const isDad = role === 'dad';
  const isDark = Boolean(darkMode);
  const rawName = (parentName || '').trim();

  const resolvedNameAr = rawName || (isDad ? 'الأب' : 'الأم');
  const resolvedNameEn = rawName || (isDad ? 'Father' : 'Mother');

  if (isDad) {
    return {
      role: 'dad',
      accountKey: 'father',
      paletteFamily: 'teal-slate',
      displayNameAr: resolvedNameAr,
      displayNameEn: resolvedNameEn,
      greetingAr: rawName ? `أهلاً بيك يا ${rawName} 👋` : 'أهلاً بيك 👋',
      greetingEn: rawName ? `Welcome back, ${resolvedNameEn} 👋` : 'Welcome back 👋',
      roleBadgeAr: 'حساب الأب · تيل وأزرق أردوازي',
      roleBadgeEn: 'Father Profile · Teal & Slate Blue',
      accentHex: isDark ? '#2DD4BF' : '#0D9488',
      secondaryAccentHex: isDark ? '#38BDF8' : '#0284C7',
      badgeBgCss: isDark ? '#142430' : '#E0F2FE',
      badgeTextCss: isDark ? '#A5F3FC' : '#0B131A',
      badgeBorderCss: isDark ? '#1E3646' : 'rgba(2, 132, 199, 0.35)',
      glowColorCss: isDark ? 'rgba(20, 184, 166, 0.36)' : 'rgba(13, 148, 136, 0.22)',
    };
  }

  return {
    role: role === 'high-contrast' ? 'high-contrast' : 'mom',
    accountKey: 'mother',
    paletteFamily: 'coral-rose',
    displayNameAr: resolvedNameAr,
    displayNameEn: resolvedNameEn,
    greetingAr: rawName ? `أهلاً بيكي يا ${rawName} 👋` : 'أهلاً بيكي 👋',
    greetingEn: `Welcome back, ${resolvedNameEn} 👋`,
    roleBadgeAr: 'حساب الأم · مرجاني دافئ ووردي ناعم',
    roleBadgeEn: 'Mother Profile · Soft Coral & Warm Rose',
    accentHex: isDark ? '#FF8C61' : '#E86A3D',
    secondaryAccentHex: isDark ? '#FB7185' : '#E11D48',
    badgeBgCss: isDark ? '#142430' : '#FFF1F2',
    badgeTextCss: isDark ? '#FDA4AF' : '#0B131A',
    badgeBorderCss: isDark ? '#1E3646' : 'rgba(225, 29, 72, 0.32)',
    glowColorCss: isDark ? 'rgba(255, 140, 97, 0.38)' : 'rgba(232, 106, 61, 0.22)',
  };
}

export function resolveColorMode(darkMode?: boolean): 'light' | 'dark' {
  return darkMode === true ? 'dark' : 'light';
}

export const SKELETON_TABS = ['services', 'medical', 'community'] as const;
export type SkeletonTabId = (typeof SKELETON_TABS)[number];
export const SKELETON_LOAD_DURATION_MS = 180;

export function shouldTriggerSkeletonForTab(pageId: string): pageId is SkeletonTabId {
  return (SKELETON_TABS as readonly string[]).includes(pageId);
}

export function getEmptyStateCopy(
  section:
    | 'cart'
    | 'wishes'
    | 'routine'
    | 'calendar'
    | 'notifications'
    | 'chat'
    | 'chats'
    | 'community'
    | 'search',
  lang: LanguageCode = 'ar'
): { title: string; subtitle: string; ctaLabel: string; actionLabel: string } {
  const isEn = lang === 'en';
  switch (section) {
    case 'cart': {
      const ctaLabel = isEn ? 'Browse Store Catalog' : 'تصفح المتجر الآن';
      return {
        title: isEn
          ? 'Your Shopping Cart is Empty'
          : 'سلة التسوق فارغة حاليًا',
        subtitle: isEn
          ? 'Browse curated family products, Montessori toys, and baby essentials to add items to your cart.'
          : 'تصفح ألعاب مونتيسوري، الملابس القطنية، ومستلزمات العناية بأطفالك وأضفها للسلة بضغطة واحدة.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'wishes': {
      const ctaLabel = isEn ? '+ Add New Wish' : '+ إضافة أمنية جديدة';
      return {
        title: isEn
          ? 'Wishlist is Empty'
          : 'قائمة الأمنيات فارغة حاليًا',
        subtitle: isEn
          ? 'Save gift ideas, educational toys, and family goals so everyone can celebrate together.'
          : 'سجّل هدايا وأمنيات أطفالك لمتابعة تحقيقها خطوة بخطوة أو مشاركتها مع العائلة.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'routine': {
      const ctaLabel = isEn ? '+ Add Routine Task' : '+ إضافة مهمة للروتين';
      return {
        title: isEn
          ? 'No tasks match this filter yet'
          : 'لا توجد مهام مطابقة لهذا التصنيف',
        subtitle: isEn
          ? 'Add a new daily habit or clear the current filter to view all family routine tasks.'
          : 'أضف مهمة جديدة بسهولة أو غيّر التصنيف لعرض جميع مهام الروتين اليومي.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'calendar': {
      const ctaLabel = isEn ? '+ Add Family Event' : '+ إضافة موعد جديد';
      return {
        title: isEn
          ? 'No events scheduled in this period'
          : 'لا توجد مواعيد مجدولة في هذه الفترة',
        subtitle: isEn
          ? 'Schedule pediatric checkups, school events, or family outings in Gregorian & Hijri.'
          : 'سجّل مواعيد التطعيمات، متابعات الطبيب، أو المناسبات العائلية بالتقويم الميلادي والهجري.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'notifications': {
      const ctaLabel = isEn ? 'Restore Daily Notifications' : 'استرجاع تنبيهات اليوم';
      return {
        title: isEn
          ? 'All Notifications Cleared'
          : 'لا توجد إشعارات جديدة حاليًا',
        subtitle: isEn
          ? 'You are all caught up! Restore daily parenting tips whenever you are ready.'
          : 'تمت متابعة جميع الإشعارات! يمكنك استرجاع تنبيهات اليوم في أي وقت.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'chat':
    case 'chats': {
      const ctaLabel = isEn ? 'Show All Conversations' : 'عرض كل المحادثات النشطة';
      return {
        title: isEn
          ? 'No Active Chats in This Filter'
          : 'لا توجد محادثات نشطة في هذا القسم',
        subtitle: isEn
          ? 'Start or restore a direct conversation with your child’s nursery, pediatrician, or family members.'
          : 'ابدأ محادثة مباشرة مع طبيب الأطفال، الحضانة، أو أفراد العائلة بضغطة زر.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'community': {
      const ctaLabel = isEn ? 'Show All Posts' : 'عرض كل التجارب والنقاشات';
      return {
        title: isEn
          ? 'No Matching Community Posts'
          : 'لا توجد منشورات مطابقة للبحث',
        subtitle: isEn
          ? 'Try clearing the search filter or share your own parenting experience with the community.'
          : 'جرّب تغيير التصنيف أو شارك سؤالك وتجربتك مع مجتمع الآباء والأمهات.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
    case 'search':
    default: {
      const ctaLabel = isEn ? 'Reset Filters' : 'إعادة ضبط الفلاتر';
      return {
        title: isEn
          ? 'No Matching Results'
          : 'لا توجد نتائج مطابقة لبحثك',
        subtitle: isEn
          ? 'Try adjusting your filters or browsing all categories.'
          : 'جرّب مسح الفلتر الحالي أو تصفح جميع الأقسام المتاحة.',
        ctaLabel,
        actionLabel: ctaLabel,
      };
    }
  }
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_CHILD_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB upload limit
export const MAX_DATA_URL_CHAR_LENGTH = 750_000; // ~550 KB base64 safe localStorage ceiling

export function validateAndSanitizeImageDataUrl(
  dataUrl: string | undefined | null
): { valid: boolean; sanitized?: string; errorAr?: string; errorEn?: string } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: false, errorAr: 'لا توجد صورة صالحة', errorEn: 'No valid image provided' };
  }
  const trimmed = dataUrl.trim();
  const safePrefixRegex = /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=\s]+$/i;
  if (!safePrefixRegex.test(trimmed)) {
    return {
      valid: false,
      errorAr: 'صيغة الصورة غير مدعومة أمنياً. يُسمح فقط بـ JPG أو PNG أو WebP.',
      errorEn: 'Unsupported image format. Only JPG, PNG, or WebP are allowed for security.',
    };
  }
  if (trimmed.length > MAX_DATA_URL_CHAR_LENGTH) {
    return {
      valid: false,
      errorAr: 'حجم الصورة كبير جداً للتخزين الآمن. يرجى اختيار صورة أقل من ٢ ميجابايت.',
      errorEn: 'Image exceeds safe storage quota. Please choose a photo under 2 MB.',
    };
  }
  return { valid: true, sanitized: trimmed };
}
