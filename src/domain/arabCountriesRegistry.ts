export type CountryCode =
  | 'EG'
  | 'SA'
  | 'AE'
  | 'KW'
  | 'QA'
  | 'BH'
  | 'OM'
  | 'IQ'
  | 'JO'
  | 'PS'
  | 'LB'
  | 'SY'
  | 'YE'
  | 'SD'
  | 'LY'
  | 'TN'
  | 'DZ'
  | 'MA'
  | 'MR'
  | 'SO'
  | 'DJ'
  | 'KM';

export type CurrencyCode =
  | 'EGP'
  | 'SAR'
  | 'AED'
  | 'KWD'
  | 'QAR'
  | 'BHD'
  | 'OMR'
  | 'IQD'
  | 'JOD'
  | 'ILS'
  | 'LBP'
  | 'SYP'
  | 'YER'
  | 'SDG'
  | 'LYD'
  | 'TND'
  | 'DZD'
  | 'MAD'
  | 'MRU'
  | 'SOS'
  | 'DJF'
  | 'KMF';

export interface CityOption {
  id: string;
  nameAr: string;
  nameEn: string;
  labelAr?: string;
  labelEn?: string;
  regionAr: string;
  regionEn: string;
  providersCount: number;
  lat: number;
  lng: number;
  subCitiesAr?: string[];
  subCitiesEn?: string[];
}

export type CityMetadata = CityOption;

export interface EmergencyContactsMetadata {
  ambulance: string;
  police: string;
  civilDefense: string;
  childHelpline: string;
}

export interface PhoneValidationRule {
  minDigits: number;
  maxDigits: number;
  localPrefixes?: string[];
  exampleLocal: string;
  exampleInternational: string;
}

export interface ArabCountryMetadata {
  code: CountryCode;
  nameAr: string;
  nameEn: string;
  flag: string;
  dialCode: string;
  currencyCode: CurrencyCode;
  currencyNameAr: string;
  currencyNameEn: string;
  currencySymbolAr: string;
  currencySymbolEn: string;
  defaultTimezone: string;
  defaultCity: string;
  defaultCityEn: string;
  regions: { id: string; nameAr: string; nameEn: string }[];
  cities: CityOption[];
  emergencyNumbers: EmergencyContactsMetadata;
  phoneRule: PhoneValidationRule;
  /** Approximate multiplier from 1 SAR to this country's currency for localized catalog pricing */
  rateFromSAR: number;
  /** Decimal places typically used when formatting prices */
  currencyDecimals: number;
}

export const ALL_ARAB_COUNTRY_CODES: readonly CountryCode[] = [
  'EG',
  'SA',
  'AE',
  'KW',
  'QA',
  'BH',
  'OM',
  'IQ',
  'JO',
  'PS',
  'LB',
  'SY',
  'YE',
  'SD',
  'LY',
  'TN',
  'DZ',
  'MA',
  'MR',
  'SO',
  'DJ',
  'KM',
] as const;

export const ALL_ARAB_CURRENCIES: readonly CurrencyCode[] = [
  'EGP',
  'SAR',
  'AED',
  'KWD',
  'QAR',
  'BHD',
  'OMR',
  'IQD',
  'JOD',
  'ILS',
  'LBP',
  'SYP',
  'YER',
  'SDG',
  'LYD',
  'TND',
  'DZD',
  'MAD',
  'MRU',
  'SOS',
  'DJF',
  'KMF',
] as const;

const EG_CITIES: CityOption[] = [
  { id: 'القاهرة', nameAr: 'القاهرة', nameEn: 'Cairo', labelAr: 'القاهرة — محافظة القاهرة', labelEn: 'Cairo — Cairo Governorate', regionAr: 'محافظة القاهرة', regionEn: 'Cairo Governorate', providersCount: 48, lat: 30.0444, lng: 31.2357, subCitiesAr: ['القاهرة الجديدة', 'المعادي', 'مدينة نصر', 'مصر الجديدة', 'الزمالك'], subCitiesEn: ['New Cairo', 'Maadi', 'Nasr City', 'Heliopolis', 'Zamalek'] },
  { id: 'الإسكندرية', nameAr: 'الإسكندرية', nameEn: 'Alexandria', labelAr: 'الإسكندرية — محافظة الإسكندرية', labelEn: 'Alexandria — Alexandria Governorate', regionAr: 'محافظة الإسكندرية', regionEn: 'Alexandria Governorate', providersCount: 34, lat: 31.2001, lng: 29.9187, subCitiesAr: ['سموحة', 'سيدي جابر', 'رشدي', 'برج العرب'], subCitiesEn: ['Smouha', 'Sidi Gaber', 'Roushdy', 'Borg El Arab'] },
  { id: 'الجيزة', nameAr: 'الجيزة', nameEn: 'Giza', labelAr: 'الجيزة — محافظة الجيزة', labelEn: 'Giza — Giza Governorate', regionAr: 'محافظة الجيزة', regionEn: 'Giza Governorate', providersCount: 38, lat: 30.0131, lng: 31.2089, subCitiesAr: ['الشيخ زايد', '6 أكتوبر', 'الدقي', 'المهندسين'], subCitiesEn: ['Sheikh Zayed', '6th of October', 'Dokki', 'Mohandessin'] },
  { id: 'الدقهلية', nameAr: 'الدقهلية', nameEn: 'Dakahlia', labelAr: 'الدقهلية — المنصورة', labelEn: 'Dakahlia — Mansoura', regionAr: 'محافظة الدقهلية (المنصورة)', regionEn: 'Dakahlia Governorate', providersCount: 22, lat: 31.0409, lng: 31.3785, subCitiesAr: ['المنصورة', 'طلخا', 'ميت غمر'], subCitiesEn: ['Mansoura', 'Talkha', 'Mit Ghamr'] },
  { id: 'الشرقية', nameAr: 'الشرقية', nameEn: 'Sharqia', labelAr: 'الشرقية — الزقازيق والعاشر', labelEn: 'Sharqia — Zagazig', regionAr: 'محافظة الشرقية (الزقازيق)', regionEn: 'Sharqia Governorate', providersCount: 20, lat: 30.5877, lng: 31.5020, subCitiesAr: ['الزقازيق', 'العاشر من رمضان'], subCitiesEn: ['Zagazig', '10th of Ramadan'] },
  { id: 'القليوبية', nameAr: 'القليوبية', nameEn: 'Qalyubia', labelAr: 'القليوبية — بنها والعبور', labelEn: 'Qalyubia — Banha', regionAr: 'محافظة القليوبية (بنها)', regionEn: 'Qalyubia Governorate', providersCount: 18, lat: 30.4660, lng: 31.1848, subCitiesAr: ['بنها', 'العبور', 'شبرا الخيمة'], subCitiesEn: ['Banha', 'Obour City', 'Shubra El Kheima'] },
  { id: 'البحيرة', nameAr: 'البحيرة', nameEn: 'Beheira', labelAr: 'البحيرة — دمنهور', labelEn: 'Beheira — Damanhour', regionAr: 'محافظة البحيرة (دمنهور)', regionEn: 'Beheira Governorate', providersCount: 15, lat: 31.0341, lng: 30.4682, subCitiesAr: ['دمنهور'], subCitiesEn: ['Damanhour'] },
  { id: 'الغربية', nameAr: 'الغربية', nameEn: 'Gharbia', labelAr: 'الغربية — طنطا والمحلة', labelEn: 'Gharbia — Tanta', regionAr: 'محافظة الغربية (طنطا)', regionEn: 'Gharbia Governorate', providersCount: 19, lat: 30.7865, lng: 31.0004, subCitiesAr: ['طنطا', 'المحلة الكبرى'], subCitiesEn: ['Tanta', 'El Mahalla El Kubra'] },
  { id: 'المنوفية', nameAr: 'المنوفية', nameEn: 'Monufia', labelAr: 'المنوفية — شبين الكوم', labelEn: 'Monufia — Shibin El Kom', regionAr: 'محافظة المنوفية (شبين الكوم)', regionEn: 'Monufia Governorate', providersCount: 14, lat: 30.5503, lng: 31.0106, subCitiesAr: ['شبين الكوم'], subCitiesEn: ['Shibin El Kom'] },
  { id: 'المنيا', nameAr: 'المنيا', nameEn: 'Minya', labelAr: 'المنيا — محافظة المنيا', labelEn: 'Minya Governorate', regionAr: 'محافظة المنيا', regionEn: 'Minya Governorate', providersCount: 14, lat: 28.1099, lng: 30.7503 },
  { id: 'سوهاج', nameAr: 'سوهاج', nameEn: 'Sohag', labelAr: 'سوهاج — محافظة سوهاج', labelEn: 'Sohag Governorate', regionAr: 'محافظة سوهاج', regionEn: 'Sohag Governorate', providersCount: 13, lat: 26.5591, lng: 31.6957 },
  { id: 'أسيوط', nameAr: 'أسيوط', nameEn: 'Assiut', labelAr: 'أسيوط — محافظة أسيوط', labelEn: 'Assiut Governorate', regionAr: 'محافظة أسيوط', regionEn: 'Assiut Governorate', providersCount: 16, lat: 27.1783, lng: 31.1859 },
  { id: 'بني سويف', nameAr: 'بني سويف', nameEn: 'Beni Suef', labelAr: 'بني سويف — محافظة بني سويف', labelEn: 'Beni Suef Governorate', regionAr: 'محافظة بني سويف', regionEn: 'Beni Suef Governorate', providersCount: 12, lat: 29.0661, lng: 31.0994 },
  { id: 'الفيوم', nameAr: 'الفيوم', nameEn: 'Faiyum', labelAr: 'الفيوم — محافظة الفيوم', labelEn: 'Faiyum Governorate', regionAr: 'محافظة الفيوم', regionEn: 'Faiyum Governorate', providersCount: 12, lat: 29.3084, lng: 30.8428 },
  { id: 'قنا', nameAr: 'قنا', nameEn: 'Qena', labelAr: 'قنا — محافظة قنا', labelEn: 'Qena Governorate', regionAr: 'محافظة قنا', regionEn: 'Qena Governorate', providersCount: 11, lat: 26.1551, lng: 32.7160 },
  { id: 'كفر الشيخ', nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', labelAr: 'كفر الشيخ — محافظة كفر الشيخ', labelEn: 'Kafr El Sheikh Governorate', regionAr: 'محافظة كفر الشيخ', regionEn: 'Kafr El Sheikh Governorate', providersCount: 12, lat: 31.1107, lng: 30.9388 },
  { id: 'الأقصر', nameAr: 'الأقصر', nameEn: 'Luxor', labelAr: 'الأقصر — محافظة الأقصر', labelEn: 'Luxor Governorate', regionAr: 'محافظة الأقصر', regionEn: 'Luxor Governorate', providersCount: 11, lat: 25.6872, lng: 32.6396 },
  { id: 'أسوان', nameAr: 'أسوان', nameEn: 'Aswan', labelAr: 'أسوان — محافظة أسوان', labelEn: 'Aswan Governorate', regionAr: 'محافظة أسوان', regionEn: 'Aswan Governorate', providersCount: 11, lat: 24.0889, lng: 32.8998 },
  { id: 'دمياط', nameAr: 'دمياط', nameEn: 'Damietta', labelAr: 'دمياط — محافظة دمياط', labelEn: 'Damietta Governorate', regionAr: 'محافظة دمياط', regionEn: 'Damietta Governorate', providersCount: 13, lat: 31.4175, lng: 31.8144 },
  { id: 'الإسماعيلية', nameAr: 'الإسماعيلية', nameEn: 'Ismailia', labelAr: 'الإسماعيلية — محافظة الإسماعيلية', labelEn: 'Ismailia Governorate', regionAr: 'محافظة الإسماعيلية', regionEn: 'Ismailia Governorate', providersCount: 14, lat: 30.5965, lng: 32.2715 },
  { id: 'السويس', nameAr: 'السويس', nameEn: 'Suez', labelAr: 'السويس — محافظة السويس', labelEn: 'Suez Governorate', regionAr: 'محافظة السويس', regionEn: 'Suez Governorate', providersCount: 12, lat: 29.9668, lng: 32.5498 },
  { id: 'بورسعيد', nameAr: 'بورسعيد', nameEn: 'Port Said', labelAr: 'بورسعيد — محافظة بورسعيد', labelEn: 'Port Said Governorate', regionAr: 'محافظة بورسعيد', regionEn: 'Port Said Governorate', providersCount: 14, lat: 31.2653, lng: 32.3019 },
  { id: 'مطروح', nameAr: 'مطروح', nameEn: 'Matrouh', labelAr: 'مطروح — محافظة مطروح', labelEn: 'Matrouh Governorate', regionAr: 'محافظة مطروح', regionEn: 'Matrouh Governorate', providersCount: 9, lat: 31.3543, lng: 27.2373, subCitiesAr: ['مرسى مطروح'], subCitiesEn: ['Marsa Matrouh'] },
  { id: 'شمال سيناء', nameAr: 'شمال سيناء', nameEn: 'North Sinai', labelAr: 'شمال سيناء — العريش', labelEn: 'North Sinai — Arish', regionAr: 'محافظة شمال سيناء (العريش)', regionEn: 'North Sinai Governorate', providersCount: 8, lat: 31.1321, lng: 33.8033, subCitiesAr: ['العريش'], subCitiesEn: ['Arish'] },
  { id: 'جنوب سيناء', nameAr: 'جنوب سيناء', nameEn: 'South Sinai', labelAr: 'جنوب سيناء — شرم الشيخ', labelEn: 'South Sinai — Sharm El Sheikh', regionAr: 'محافظة جنوب سيناء (شرم الشيخ)', regionEn: 'South Sinai Governorate', providersCount: 10, lat: 27.9158, lng: 34.3300, subCitiesAr: ['شرم الشيخ'], subCitiesEn: ['Sharm El Sheikh'] },
  { id: 'الوادي الجديد', nameAr: 'الوادي الجديد', nameEn: 'New Valley', labelAr: 'الوادي الجديد — الخارجة', labelEn: 'New Valley Governorate', regionAr: 'محافظة الوادي الجديد', regionEn: 'New Valley Governorate', providersCount: 7, lat: 25.4390, lng: 30.5586, subCitiesAr: ['الخارجة'], subCitiesEn: ['Kharga'] },
  { id: 'البحر الأحمر', nameAr: 'البحر الأحمر', nameEn: 'Red Sea', labelAr: 'البحر الأحمر — الغردقة', labelEn: 'Red Sea — Hurghada', regionAr: 'محافظة البحر الأحمر (الغردقة)', regionEn: 'Red Sea Governorate', providersCount: 12, lat: 27.2579, lng: 33.8116, subCitiesAr: ['الغردقة'], subCitiesEn: ['Hurghada'] },
];

const SA_CITIES: CityOption[] = [
  { id: 'الدمام', nameAr: 'الدمام', nameEn: 'Dammam', labelAr: 'الدمام — المنطقة الشرقية', labelEn: 'Dammam — Eastern Province', regionAr: 'المنطقة الشرقية (الدمام، الخبر، الظهران)', regionEn: 'Eastern Province', providersCount: 36, lat: 26.4207, lng: 50.0888, subCitiesAr: ['الدمام', 'الخبر', 'الظهران', 'الجبيل', 'الأحساء', 'القطيف'], subCitiesEn: ['Dammam', 'Khobar', 'Dhahran', 'Jubail', 'Al-Ahsa', 'Qatif'] },
  { id: 'الرياض', nameAr: 'الرياض', nameEn: 'Riyadh', labelAr: 'الرياض — منطقة الرياض', labelEn: 'Riyadh — Riyadh Region', regionAr: 'منطقة الرياض', regionEn: 'Riyadh Region', providersCount: 46, lat: 24.7136, lng: 46.6753, subCitiesAr: ['الرياض', 'الدرعية', 'الخرج'], subCitiesEn: ['Riyadh', 'Diriyah', 'Al-Kharj'] },
  { id: 'جدة', nameAr: 'جدة', nameEn: 'Jeddah', labelAr: 'جدة — منطقة مكة المكرمة', labelEn: 'Jeddah — Makkah Region', regionAr: 'منطقة مكة المكرمة (جدة)', regionEn: 'Makkah Region (Jeddah)', providersCount: 38, lat: 21.4858, lng: 39.1925, subCitiesAr: ['جدة', 'مكة المكرمة', 'رابغ'], subCitiesEn: ['Jeddah', 'Makkah', 'Rabigh'] },
  { id: 'مكة المكرمة', nameAr: 'مكة المكرمة', nameEn: 'Makkah', labelAr: 'مكة المكرمة — منطقة مكة المكرمة', labelEn: 'Makkah — Makkah Region', regionAr: 'منطقة مكة المكرمة (مكة، جدة)', regionEn: 'Makkah Region (Makkah, Jeddah)', providersCount: 38, lat: 21.3891, lng: 39.8579, subCitiesAr: ['مكة المكرمة', 'جدة', 'رابغ'], subCitiesEn: ['Makkah', 'Jeddah', 'Rabigh'] },
  { id: 'المدينة المنورة', nameAr: 'المدينة المنورة', nameEn: 'Madinah', labelAr: 'المدينة المنورة — منطقة المدينة المنورة', labelEn: 'Madinah — Madinah Region', regionAr: 'منطقة المدينة المنورة', regionEn: 'Madinah Region', providersCount: 24, lat: 24.5247, lng: 39.5692 },
  { id: 'الشرقية / الدمام والخبر والجبيل', nameAr: 'الشرقية / الدمام والخبر والجبيل', nameEn: 'Eastern Province / Dammam, Khobar & Jubail', labelAr: 'المنطقة الشرقية — الدمام والخبر والجبيل', labelEn: 'Eastern Province — Dammam, Khobar & Jubail', regionAr: 'المنطقة الشرقية (الدمام، الخبر، الظهران، الجبيل، الأحساء)', regionEn: 'Eastern Province', providersCount: 36, lat: 26.4207, lng: 50.0888, subCitiesAr: ['الدمام', 'الخبر', 'الظهران', 'الجبيل', 'الأحساء', 'القطيف'], subCitiesEn: ['Dammam', 'Khobar', 'Dhahran', 'Jubail', 'Al-Ahsa', 'Qatif'] },
  { id: 'القصيم', nameAr: 'القصيم', nameEn: 'Al-Qassim (Buraidah & Unaizah)', labelAr: 'القصيم — بريدة وعنيزة', labelEn: 'Al-Qassim — Buraidah & Unaizah', regionAr: 'منطقة القصيم (بريدة، عنيزة)', regionEn: 'Al-Qassim Region', providersCount: 19, lat: 26.3260, lng: 43.9750, subCitiesAr: ['بريدة', 'عنيزة', 'الرس'], subCitiesEn: ['Buraidah', 'Unaizah', 'Ar Rass'] },
  { id: 'عسير', nameAr: 'عسير', nameEn: 'Asir (Abha & Khamis Mushait)', labelAr: 'عسير — أبها وخميس مشيط', labelEn: 'Asir — Abha & Khamis Mushait', regionAr: 'منطقة عسير (أبها، خميس مشيط)', regionEn: 'Asir Region', providersCount: 18, lat: 18.2164, lng: 42.5053, subCitiesAr: ['أبها', 'خميس مشيط', 'بيشة'], subCitiesEn: ['Abha', 'Khamis Mushait', 'Bisha'] },
  { id: 'تبوك', nameAr: 'تبوك', nameEn: 'Tabuk', labelAr: 'تبوك — منطقة تبوك', labelEn: 'Tabuk — Tabuk Region', regionAr: 'منطقة تبوك', regionEn: 'Tabuk Region', providersCount: 14, lat: 28.3835, lng: 36.5662 },
  { id: 'حائل', nameAr: 'حائل', nameEn: 'Hail', labelAr: 'حائل — منطقة حائل', labelEn: 'Hail — Hail Region', regionAr: 'منطقة حائل', regionEn: 'Hail Region', providersCount: 12, lat: 27.5114, lng: 41.7208 },
  { id: 'جازان', nameAr: 'جازان', nameEn: 'Jazan', labelAr: 'جازان — منطقة جازان', labelEn: 'Jazan — Jazan Region', regionAr: 'منطقة جازان', regionEn: 'Jazan Region', providersCount: 13, lat: 16.8892, lng: 42.5511 },
  { id: 'نجران', nameAr: 'نجران', nameEn: 'Najran', labelAr: 'نجران — منطقة نجران', labelEn: 'Najran — Najran Region', regionAr: 'منطقة نجران', regionEn: 'Najran Region', providersCount: 11, lat: 17.4924, lng: 44.1277 },
  { id: 'الباحة', nameAr: 'الباحة', nameEn: 'Al-Baha', labelAr: 'الباحة — منطقة الباحة', labelEn: 'Al-Baha — Al-Baha Region', regionAr: 'منطقة الباحة', regionEn: 'Al-Baha Region', providersCount: 10, lat: 20.0129, lng: 41.4677 },
  { id: 'الجوف', nameAr: 'الجوف', nameEn: 'Al-Jouf', labelAr: 'الجوف — سكاكا', labelEn: 'Al-Jouf — Sakaka', regionAr: 'منطقة الجوف (سكاكا)', regionEn: 'Al-Jouf Region', providersCount: 10, lat: 29.9697, lng: 40.2064, subCitiesAr: ['سكاكا'], subCitiesEn: ['Sakaka'] },
  { id: 'الحدود الشمالية', nameAr: 'الحدود الشمالية', nameEn: 'Northern Borders (Arar & Rafha)', labelAr: 'الحدود الشمالية — عرعر ورفحاء', labelEn: 'Northern Borders — Arar & Rafha', regionAr: 'منطقة الحدود الشمالية (عرعر، رفحاء)', regionEn: 'Northern Borders Region', providersCount: 9, lat: 30.9753, lng: 41.0381, subCitiesAr: ['عرعر', 'رفحاء', 'طريف'], subCitiesEn: ['Arar', 'Rafha', 'Turaif'] },
  { id: 'الطائف', nameAr: 'الطائف', nameEn: 'Taif', labelAr: 'الطائف — محافظة الطائف', labelEn: 'Taif — Taif Governorate', regionAr: 'محافظة الطائف', regionEn: 'Taif Governorate', providersCount: 16, lat: 21.2703, lng: 40.4158 },
  { id: 'ينبع', nameAr: 'ينبع', nameEn: 'Yanbu', labelAr: 'ينبع — محافظة ينبع', labelEn: 'Yanbu — Yanbu Governorate', regionAr: 'محافظة ينبع', regionEn: 'Yanbu Governorate', providersCount: 14, lat: 24.0895, lng: 38.0618 },
];

export const ARAB_COUNTRIES_REGISTRY: Record<CountryCode, ArabCountryMetadata> = {
  EG: {
    code: 'EG',
    nameAr: 'مصر',
    nameEn: 'Egypt',
    flag: '🇪🇬',
    dialCode: '+20',
    currencyCode: 'EGP',
    currencyNameAr: 'جنيه مصري',
    currencyNameEn: 'Egyptian Pound',
    currencySymbolAr: 'ج.م',
    currencySymbolEn: 'EGP',
    defaultTimezone: 'Africa/Cairo',
    defaultCity: 'القاهرة',
    defaultCityEn: 'Cairo',
    regions: [
      { id: 'EG-C', nameAr: 'القاهرة الكبرى', nameEn: 'Greater Cairo' },
      { id: 'EG-ALX', nameAr: 'الإسكندرية والساحل', nameEn: 'Alexandria & Coast' },
      { id: 'EG-DLT', nameAr: 'الدلتا والقناة', nameEn: 'Delta & Canal' },
      { id: 'EG-UPP', nameAr: 'صعيد مصر والبحر الأحمر', nameEn: 'Upper Egypt & Red Sea' },
    ],
    cities: EG_CITIES,
    emergencyNumbers: { ambulance: '123', police: '122', civilDefense: '180', childHelpline: '16000' },
    phoneRule: { minDigits: 10, maxDigits: 11, localPrefixes: ['10', '11', '12', '15', '010', '011', '012', '015'], exampleLocal: '1012345678', exampleInternational: '+20 1012345678' },
    rateFromSAR: 13.0,
    currencyDecimals: 0,
  },
  SA: {
    code: 'SA',
    nameAr: 'السعودية',
    nameEn: 'Saudi Arabia',
    flag: '🇸🇦',
    dialCode: '+966',
    currencyCode: 'SAR',
    currencyNameAr: 'ريال سعودي',
    currencyNameEn: 'Saudi Riyal',
    currencySymbolAr: 'ر.س',
    currencySymbolEn: 'SAR',
    defaultTimezone: 'Asia/Riyadh',
    defaultCity: 'الرياض',
    defaultCityEn: 'Riyadh',
    regions: [
      { id: 'SA-01', nameAr: 'منطقة الرياض', nameEn: 'Riyadh Region' },
      { id: 'SA-02', nameAr: 'منطقة مكة المكرمة', nameEn: 'Makkah Region' },
      { id: 'SA-04', nameAr: 'المنطقة الشرقية', nameEn: 'Eastern Province' },
      { id: 'SA-03', nameAr: 'المدينة والشمال والجنوب', nameEn: 'Madinah, North & South' },
    ],
    cities: SA_CITIES,
    emergencyNumbers: { ambulance: '997', police: '999', civilDefense: '998', childHelpline: '116111' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['5', '05'], exampleLocal: '501234567', exampleInternational: '+966 501234567' },
    rateFromSAR: 1.0,
    currencyDecimals: 0,
  },
  AE: {
    code: 'AE',
    nameAr: 'الإمارات',
    nameEn: 'United Arab Emirates',
    flag: '🇦🇪',
    dialCode: '+971',
    currencyCode: 'AED',
    currencyNameAr: 'درهم إماراتي',
    currencyNameEn: 'UAE Dirham',
    currencySymbolAr: 'د.إ',
    currencySymbolEn: 'AED',
    defaultTimezone: 'Asia/Dubai',
    defaultCity: 'دبي',
    defaultCityEn: 'Dubai',
    regions: [
      { id: 'AE-DU', nameAr: 'إمارة دبي', nameEn: 'Dubai Emirate' },
      { id: 'AE-AZ', nameAr: 'إمارة أبوظبي', nameEn: 'Abu Dhabi Emirate' },
      { id: 'AE-NE', nameAr: 'الإمارات الشمالية', nameEn: 'Northern Emirates' },
    ],
    cities: [
      { id: 'دبي', nameAr: 'دبي', nameEn: 'Dubai', labelAr: 'دبي — إمارة دبي', labelEn: 'Dubai — Dubai Emirate', regionAr: 'إمارة دبي', regionEn: 'Dubai Emirate', providersCount: 42, lat: 25.2048, lng: 55.2708, subCitiesAr: ['البرشاء', 'جميرا', 'دبي مارينا', 'مردف'], subCitiesEn: ['Al Barsha', 'Jumeirah', 'Dubai Marina', 'Mirdif'] },
      { id: 'أبوظبي', nameAr: 'أبوظبي', nameEn: 'Abu Dhabi', labelAr: 'أبوظبي — إمارة أبوظبي', labelEn: 'Abu Dhabi — Abu Dhabi Emirate', regionAr: 'إمارة أبوظبي', regionEn: 'Abu Dhabi Emirate', providersCount: 38, lat: 24.4539, lng: 54.3773, subCitiesAr: ['جزيرة الريم', 'خليفة أ', 'العين'], subCitiesEn: ['Al Reem Island', 'Khalifa City', 'Al Ain'] },
      { id: 'الشارقة', nameAr: 'الشارقة', nameEn: 'Sharjah', labelAr: 'الشارقة — إمارة الشارقة', labelEn: 'Sharjah — Sharjah Emirate', regionAr: 'إمارة الشارقة', regionEn: 'Sharjah Emirate', providersCount: 28, lat: 25.3463, lng: 55.4209 },
      { id: 'عجمان', nameAr: 'عجمان', nameEn: 'Ajman', labelAr: 'عجمان — إمارة عجمان', labelEn: 'Ajman — Ajman Emirate', regionAr: 'إمارة عجمان', regionEn: 'Ajman Emirate', providersCount: 16, lat: 25.4052, lng: 55.5136 },
      { id: 'العين', nameAr: 'العين', nameEn: 'Al Ain', labelAr: 'العين — إمارة أبوظبي', labelEn: 'Al Ain — Abu Dhabi Emirate', regionAr: 'إمارة أبوظبي', regionEn: 'Abu Dhabi Emirate', providersCount: 19, lat: 24.1302, lng: 55.8023 },
      { id: 'رأس الخيمة', nameAr: 'رأس الخيمة', nameEn: 'Ras Al Khaimah', labelAr: 'رأس الخيمة — إمارة رأس الخيمة', labelEn: 'Ras Al Khaimah', regionAr: 'إمارة رأس الخيمة', regionEn: 'Ras Al Khaimah Emirate', providersCount: 14, lat: 25.7895, lng: 55.9432 },
      { id: 'الفجيرة', nameAr: 'الفجيرة', nameEn: 'Fujairah', labelAr: 'الفجيرة — إمارة الفجيرة', labelEn: 'Fujairah', regionAr: 'إمارة الفجيرة', regionEn: 'Fujairah Emirate', providersCount: 12, lat: 25.1288, lng: 56.3265 },
      { id: 'أم القيوين', nameAr: 'أم القيوين', nameEn: 'Umm Al Quwain', labelAr: 'أم القيوين — إمارة أم القيوين', labelEn: 'Umm Al Quwain', regionAr: 'إمارة أم القيوين', regionEn: 'Umm Al Quwain Emirate', providersCount: 9, lat: 25.5647, lng: 55.5552 },
    ],
    emergencyNumbers: { ambulance: '998', police: '999', civilDefense: '997', childHelpline: '800700' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['5', '05'], exampleLocal: '501234567', exampleInternational: '+971 501234567' },
    rateFromSAR: 0.98,
    currencyDecimals: 0,
  },
  KW: {
    code: 'KW',
    nameAr: 'الكويت',
    nameEn: 'Kuwait',
    flag: '🇰🇼',
    dialCode: '+965',
    currencyCode: 'KWD',
    currencyNameAr: 'دينار كويتي',
    currencyNameEn: 'Kuwaiti Dinar',
    currencySymbolAr: 'د.ك',
    currencySymbolEn: 'KWD',
    defaultTimezone: 'Asia/Kuwait',
    defaultCity: 'مدينة الكويت',
    defaultCityEn: 'Kuwait City',
    regions: [
      { id: 'KW-KU', nameAr: 'محافظة العاصمة وحولي', nameEn: 'Capital & Hawalli' },
      { id: 'KW-FA', nameAr: 'الفروانية والأحمدي والجهراء', nameEn: 'Farwaniya, Ahmadi & Jahra' },
    ],
    cities: [
      { id: 'مدينة الكويت', nameAr: 'مدينة الكويت', nameEn: 'Kuwait City', labelAr: 'مدينة الكويت — محافظة العاصمة', labelEn: 'Kuwait City — Capital Governorate', regionAr: 'محافظة العاصمة', regionEn: 'Capital Governorate', providersCount: 28, lat: 29.3759, lng: 47.9774 },
      { id: 'حولي', nameAr: 'حولي', nameEn: 'Hawalli', labelAr: 'حولي — السالمية والجابرية', labelEn: 'Hawalli — Salmiya & Jabriya', regionAr: 'محافظة حولي', regionEn: 'Hawalli Governorate', providersCount: 25, lat: 29.3328, lng: 48.0286, subCitiesAr: ['السالمية', 'الجابرية'], subCitiesEn: ['Salmiya', 'Jabriya'] },
      { id: 'الفروانية', nameAr: 'الفروانية', nameEn: 'Farwaniya', labelAr: 'الفروانية — محافظة الفروانية', labelEn: 'Farwaniya Governorate', regionAr: 'محافظة الفروانية', regionEn: 'Farwaniya Governorate', providersCount: 19, lat: 29.2775, lng: 47.9586 },
      { id: 'الأحمدي', nameAr: 'الأحمدي', nameEn: 'Al Ahmadi', labelAr: 'الأحمدي — محافظة الأحمدي', labelEn: 'Al Ahmadi Governorate', regionAr: 'محافظة الأحمدي', regionEn: 'Al Ahmadi Governorate', providersCount: 16, lat: 29.0769, lng: 48.0839 },
      { id: 'الجهراء', nameAr: 'الجهراء', nameEn: 'Al Jahra', labelAr: 'الجهراء — محافظة الجهراء', labelEn: 'Al Jahra Governorate', regionAr: 'محافظة الجهراء', regionEn: 'Al Jahra Governorate', providersCount: 14, lat: 29.3375, lng: 47.6581 },
      { id: 'مبارك الكبير', nameAr: 'مبارك الكبير', nameEn: 'Mubarak Al-Kabeer', labelAr: 'مبارك الكبير — محافظة مبارك الكبير', labelEn: 'Mubarak Al-Kabeer Governorate', regionAr: 'محافظة مبارك الكبير', regionEn: 'Mubarak Al-Kabeer Governorate', providersCount: 15, lat: 29.1886, lng: 48.0864 },
    ],
    emergencyNumbers: { ambulance: '112', police: '112', civilDefense: '112', childHelpline: '147' },
    phoneRule: { minDigits: 8, maxDigits: 8, localPrefixes: ['5', '6', '9'], exampleLocal: '50123456', exampleInternational: '+965 50123456' },
    rateFromSAR: 0.082,
    currencyDecimals: 2,
  },
  QA: {
    code: 'QA',
    nameAr: 'قطر',
    nameEn: 'Qatar',
    flag: '🇶🇦',
    dialCode: '+974',
    currencyCode: 'QAR',
    currencyNameAr: 'ريال قطري',
    currencyNameEn: 'Qatari Riyal',
    currencySymbolAr: 'ر.ق',
    currencySymbolEn: 'QAR',
    defaultTimezone: 'Asia/Qatar',
    defaultCity: 'الدوحة',
    defaultCityEn: 'Doha',
    regions: [
      { id: 'QA-DA', nameAr: 'بلدية الدوحة والريان', nameEn: 'Doha & Al Rayyan' },
      { id: 'QA-OT', nameAr: 'الوكرة والخور والشمال', nameEn: 'Al Wakrah, Al Khor & North' },
    ],
    cities: [
      { id: 'الدوحة', nameAr: 'الدوحة', nameEn: 'Doha', labelAr: 'الدوحة — بلدية الدوحة', labelEn: 'Doha — Doha Municipality', regionAr: 'بلدية الدوحة', regionEn: 'Doha Municipality', providersCount: 30, lat: 25.2854, lng: 51.5310, subCitiesAr: ['اللؤلؤة', 'الخليج الغربي', 'السد'], subCitiesEn: ['The Pearl', 'West Bay', 'Al Sadd'] },
      { id: 'الريان', nameAr: 'الريان', nameEn: 'Al Rayyan', labelAr: 'الريان — بلدية الريان', labelEn: 'Al Rayyan Municipality', regionAr: 'بلدية الريان', regionEn: 'Al Rayyan Municipality', providersCount: 22, lat: 25.2919, lng: 51.4244 },
      { id: 'الوكرة', nameAr: 'الوكرة', nameEn: 'Al Wakrah', labelAr: 'الوكرة — بلدية الوكرة', labelEn: 'Al Wakrah Municipality', regionAr: 'بلدية الوكرة', regionEn: 'Al Wakrah Municipality', providersCount: 16, lat: 25.1715, lng: 51.6034 },
      { id: 'لوسيل', nameAr: 'لوسيل', nameEn: 'Lusail', labelAr: 'لوسيل — بلدية الظعاين', labelEn: 'Lusail — Al Daayen', regionAr: 'بلدية الظعاين', regionEn: 'Al Daayen Municipality', providersCount: 18, lat: 25.4300, lng: 51.5075 },
      { id: 'الخور', nameAr: 'الخور', nameEn: 'Al Khor', labelAr: 'الخور — بلدية الخور', labelEn: 'Al Khor Municipality', regionAr: 'بلدية الخور', regionEn: 'Al Khor Municipality', providersCount: 12, lat: 25.6804, lng: 51.4969 },
    ],
    emergencyNumbers: { ambulance: '999', police: '999', civilDefense: '999', childHelpline: '919' },
    phoneRule: { minDigits: 8, maxDigits: 8, localPrefixes: ['3', '5', '6', '7'], exampleLocal: '33123456', exampleInternational: '+974 33123456' },
    rateFromSAR: 0.97,
    currencyDecimals: 0,
  },
  BH: {
    code: 'BH',
    nameAr: 'البحرين',
    nameEn: 'Bahrain',
    flag: '🇧🇭',
    dialCode: '+973',
    currencyCode: 'BHD',
    currencyNameAr: 'دينار بحريني',
    currencyNameEn: 'Bahraini Dinar',
    currencySymbolAr: 'د.ب',
    currencySymbolEn: 'BHD',
    defaultTimezone: 'Asia/Bahrain',
    defaultCity: 'المنامة',
    defaultCityEn: 'Manama',
    regions: [
      { id: 'BH-13', nameAr: 'محافظة العاصمة والمحرق', nameEn: 'Capital & Muharraq' },
      { id: 'BH-14', nameAr: 'الشمالية والجنوبية', nameEn: 'Northern & Southern' },
    ],
    cities: [
      { id: 'المنامة', nameAr: 'المنامة', nameEn: 'Manama', labelAr: 'المنامة — محافظة العاصمة', labelEn: 'Manama — Capital Governorate', regionAr: 'محافظة العاصمة', regionEn: 'Capital Governorate', providersCount: 24, lat: 26.2285, lng: 50.5860 },
      { id: 'المحرق', nameAr: 'المحرق', nameEn: 'Muharraq', labelAr: 'المحرق — محافظة المحرق', labelEn: 'Muharraq Governorate', regionAr: 'محافظة المحرق', regionEn: 'Muharraq Governorate', providersCount: 18, lat: 26.2572, lng: 50.6119 },
      { id: 'الرفاع', nameAr: 'الرفاع', nameEn: 'Riffa', labelAr: 'الرفاع — المحافظة الجنوبية', labelEn: 'Riffa — Southern Governorate', regionAr: 'المحافظة الجنوبية', regionEn: 'Southern Governorate', providersCount: 16, lat: 26.1300, lng: 50.5550 },
      { id: 'مدينة حمد', nameAr: 'مدينة حمد', nameEn: 'Hamad Town', labelAr: 'مدينة حمد — المحافظة الشمالية', labelEn: 'Hamad Town — Northern Governorate', regionAr: 'المحافظة الشمالية', regionEn: 'Northern Governorate', providersCount: 14, lat: 26.1153, lng: 50.5069 },
      { id: 'مدينة عيسى', nameAr: 'مدينة عيسى', nameEn: 'Isa Town', labelAr: 'مدينة عيسى — المحافظة الجنوبية', labelEn: 'Isa Town', regionAr: 'المحافظة الجنوبية', regionEn: 'Southern Governorate', providersCount: 15, lat: 26.1736, lng: 50.5478 },
    ],
    emergencyNumbers: { ambulance: '999', police: '999', civilDefense: '999', childHelpline: '998' },
    phoneRule: { minDigits: 8, maxDigits: 8, localPrefixes: ['3', '6'], exampleLocal: '33123456', exampleInternational: '+973 33123456' },
    rateFromSAR: 0.1,
    currencyDecimals: 2,
  },
  OM: {
    code: 'OM',
    nameAr: 'عُمان',
    nameEn: 'Oman',
    flag: '🇴🇲',
    dialCode: '+968',
    currencyCode: 'OMR',
    currencyNameAr: 'ريال عُماني',
    currencyNameEn: 'Omani Rial',
    currencySymbolAr: 'ر.ع',
    currencySymbolEn: 'OMR',
    defaultTimezone: 'Asia/Muscat',
    defaultCity: 'مسقط',
    defaultCityEn: 'Muscat',
    regions: [
      { id: 'OM-MA', nameAr: 'محافظة مسقط والباطنة', nameEn: 'Muscat & Al Batinah' },
      { id: 'OM-ZU', nameAr: 'ظفار والداخلية والشرقية', nameEn: 'Dhofar, Ad Dakhiliyah & Ash Sharqiyah' },
    ],
    cities: [
      { id: 'مسقط', nameAr: 'مسقط', nameEn: 'Muscat', labelAr: 'مسقط — محافظة مسقط', labelEn: 'Muscat Governorate', regionAr: 'محافظة مسقط', regionEn: 'Muscat Governorate', providersCount: 26, lat: 23.5880, lng: 58.3829, subCitiesAr: ['السيب', 'بوشر', 'مطرح'], subCitiesEn: ['Seeb', 'Bawshar', 'Muttrah'] },
      { id: 'صلالة', nameAr: 'صلالة', nameEn: 'Salalah', labelAr: 'صلالة — محافظة ظفار', labelEn: 'Salalah — Dhofar Governorate', regionAr: 'محافظة ظفار', regionEn: 'Dhofar Governorate', providersCount: 18, lat: 17.0151, lng: 54.0924 },
      { id: 'صحار', nameAr: 'صحار', nameEn: 'Sohar', labelAr: 'صحار — شمال الباطنة', labelEn: 'Sohar — North Al Batinah', regionAr: 'محافظة شمال الباطنة', regionEn: 'North Al Batinah', providersCount: 16, lat: 24.3474, lng: 56.7094 },
      { id: 'نزوى', nameAr: 'نزوى', nameEn: 'Nizwa', labelAr: 'نزوى — محافظة الداخلية', labelEn: 'Nizwa — Ad Dakhiliyah', regionAr: 'محافظة الداخلية', regionEn: 'Ad Dakhiliyah Governorate', providersCount: 14, lat: 22.9333, lng: 57.5333 },
      { id: 'صور', nameAr: 'صور', nameEn: 'Sur', labelAr: 'صور — جنوب الشرقية', labelEn: 'Sur — South Ash Sharqiyah', regionAr: 'محافظة جنوب الشرقية', regionEn: 'South Ash Sharqiyah', providersCount: 12, lat: 22.5667, lng: 59.5289 },
    ],
    emergencyNumbers: { ambulance: '9999', police: '9999', civilDefense: '9999', childHelpline: '1100' },
    phoneRule: { minDigits: 8, maxDigits: 8, localPrefixes: ['7', '9'], exampleLocal: '91234567', exampleInternational: '+968 91234567' },
    rateFromSAR: 0.103,
    currencyDecimals: 2,
  },
  IQ: {
    code: 'IQ',
    nameAr: 'العراق',
    nameEn: 'Iraq',
    flag: '🇮🇶',
    dialCode: '+964',
    currencyCode: 'IQD',
    currencyNameAr: 'دينار عراقي',
    currencyNameEn: 'Iraqi Dinar',
    currencySymbolAr: 'د.ع',
    currencySymbolEn: 'IQD',
    defaultTimezone: 'Asia/Baghdad',
    defaultCity: 'بغداد',
    defaultCityEn: 'Baghdad',
    regions: [
      { id: 'IQ-BG', nameAr: 'بغداد والوسط', nameEn: 'Baghdad & Central' },
      { id: 'IQ-BA', nameAr: 'البصرة والجنوب والشمال', nameEn: 'Basra, South & North' },
    ],
    cities: [
      { id: 'بغداد', nameAr: 'بغداد', nameEn: 'Baghdad', labelAr: 'بغداد — محافظة بغداد', labelEn: 'Baghdad Governorate', regionAr: 'محافظة بغداد', regionEn: 'Baghdad Governorate', providersCount: 34, lat: 33.3152, lng: 44.3661, subCitiesAr: ['المنصور', 'الكرادة', 'الأعظمية'], subCitiesEn: ['Al Mansour', 'Karrada', 'Adhamiyah'] },
      { id: 'البصرة', nameAr: 'البصرة', nameEn: 'Basra', labelAr: 'البصرة — محافظة البصرة', labelEn: 'Basra Governorate', regionAr: 'محافظة البصرة', regionEn: 'Basra Governorate', providersCount: 22, lat: 30.5085, lng: 47.7804 },
      { id: 'أربيل', nameAr: 'أربيل', nameEn: 'Erbil', labelAr: 'أربيل — محافظة أربيل', labelEn: 'Erbil Governorate', regionAr: 'محافظة أربيل', regionEn: 'Erbil Governorate', providersCount: 24, lat: 36.1911, lng: 44.0092 },
      { id: 'الموصل', nameAr: 'الموصل', nameEn: 'Mosul', labelAr: 'الموصل — محافظة نينوى', labelEn: 'Mosul — Nineveh Governorate', regionAr: 'محافظة نينوى', regionEn: 'Nineveh Governorate', providersCount: 19, lat: 36.3489, lng: 43.1577 },
      { id: 'النجف', nameAr: 'النجف', nameEn: 'Najaf', labelAr: 'النجف — محافظة النجف', labelEn: 'Najaf Governorate', regionAr: 'محافظة النجف', regionEn: 'Najaf Governorate', providersCount: 16, lat: 31.9959, lng: 44.3146 },
      { id: 'كربلاء', nameAr: 'كربلاء', nameEn: 'Karbala', labelAr: 'كربلاء — محافظة كربلاء', labelEn: 'Karbala Governorate', regionAr: 'محافظة كربلاء', regionEn: 'Karbala Governorate', providersCount: 16, lat: 32.6160, lng: 44.0249 },
    ],
    emergencyNumbers: { ambulance: '122', police: '104', civilDefense: '115', childHelpline: '116' },
    phoneRule: { minDigits: 10, maxDigits: 11, localPrefixes: ['7', '07'], exampleLocal: '7701234567', exampleInternational: '+964 7701234567' },
    rateFromSAR: 350,
    currencyDecimals: 0,
  },
  JO: {
    code: 'JO',
    nameAr: 'الأردن',
    nameEn: 'Jordan',
    flag: '🇯🇴',
    dialCode: '+962',
    currencyCode: 'JOD',
    currencyNameAr: 'دينار أردني',
    currencyNameEn: 'Jordanian Dinar',
    currencySymbolAr: 'د.أ',
    currencySymbolEn: 'JOD',
    defaultTimezone: 'Asia/Amman',
    defaultCity: 'عمّان',
    defaultCityEn: 'Amman',
    regions: [
      { id: 'JO-AM', nameAr: 'محافظة العاصمة والوسط', nameEn: 'Amman & Central' },
      { id: 'JO-IR', nameAr: 'إربد والشمال والعقبة', nameEn: 'Irbid, North & Aqaba' },
    ],
    cities: [
      { id: 'عمّان', nameAr: 'عمّان', nameEn: 'Amman', labelAr: 'عمّان — محافظة العاصمة', labelEn: 'Amman — Capital Governorate', regionAr: 'محافظة العاصمة', regionEn: 'Capital Governorate', providersCount: 32, lat: 31.9539, lng: 35.9106, subCitiesAr: ['عمان', 'عبدون', 'الشميساني', 'خلدا'], subCitiesEn: ['Amman', 'Abdoun', 'Shmeisani', 'Khalda'] },
      { id: 'إربد', nameAr: 'إربد', nameEn: 'Irbid', labelAr: 'إربد — محافظة إربد', labelEn: 'Irbid Governorate', regionAr: 'محافظة إربد', regionEn: 'Irbid Governorate', providersCount: 20, lat: 32.5568, lng: 35.8469 },
      { id: 'الزرقاء', nameAr: 'الزرقاء', nameEn: 'Zarqa', labelAr: 'الزرقاء — محافظة الزرقاء', labelEn: 'Zarqa Governorate', regionAr: 'محافظة الزرقاء', regionEn: 'Zarqa Governorate', providersCount: 18, lat: 32.0728, lng: 36.0880 },
      { id: 'العقبة', nameAr: 'العقبة', nameEn: 'Aqaba', labelAr: 'العقبة — محافظة العقبة', labelEn: 'Aqaba Governorate', regionAr: 'محافظة العقبة', regionEn: 'Aqaba Governorate', providersCount: 14, lat: 29.5321, lng: 35.0063 },
      { id: 'السلط', nameAr: 'السلط', nameEn: 'As-Salt', labelAr: 'السلط — محافظة البلقاء', labelEn: 'As-Salt — Balqa Governorate', regionAr: 'محافظة البلقاء', regionEn: 'Balqa Governorate', providersCount: 12, lat: 32.0392, lng: 35.7272 },
    ],
    emergencyNumbers: { ambulance: '911', police: '911', civilDefense: '911', childHelpline: '110' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['7', '07'], exampleLocal: '791234567', exampleInternational: '+962 791234567' },
    rateFromSAR: 0.19,
    currencyDecimals: 2,
  },
  PS: {
    code: 'PS',
    nameAr: 'فلسطين',
    nameEn: 'Palestine',
    flag: '🇵🇸',
    dialCode: '+970',
    currencyCode: 'ILS',
    currencyNameAr: 'شيكل',
    currencyNameEn: 'New Shekel',
    currencySymbolAr: '₪',
    currencySymbolEn: 'ILS',
    defaultTimezone: 'Asia/Hebron',
    defaultCity: 'القدس',
    defaultCityEn: 'Jerusalem',
    regions: [
      { id: 'PS-WB', nameAr: 'القدس والضفة الغربية', nameEn: 'Jerusalem & West Bank' },
      { id: 'PS-GZ', nameAr: 'قطاع غزة', nameEn: 'Gaza Strip' },
    ],
    cities: [
      { id: 'القدس', nameAr: 'القدس', nameEn: 'Jerusalem', labelAr: 'القدس — محافظة القدس', labelEn: 'Jerusalem Governorate', regionAr: 'محافظة القدس', regionEn: 'Jerusalem Governorate', providersCount: 22, lat: 31.7683, lng: 35.2137 },
      { id: 'رام الله', nameAr: 'رام الله', nameEn: 'Ramallah', labelAr: 'رام الله — محافظة رام الله والبيرة', labelEn: 'Ramallah & Al-Bireh', regionAr: 'محافظة رام الله والبيرة', regionEn: 'Ramallah & Al-Bireh', providersCount: 24, lat: 31.9038, lng: 35.2034 },
      { id: 'غزة', nameAr: 'غزة', nameEn: 'Gaza', labelAr: 'غزة — محافظة غزة', labelEn: 'Gaza Governorate', regionAr: 'محافظة غزة', regionEn: 'Gaza Governorate', providersCount: 20, lat: 31.5017, lng: 34.4668 },
      { id: 'نابلس', nameAr: 'نابلس', nameEn: 'Nablus', labelAr: 'نابلس — محافظة نابلس', labelEn: 'Nablus Governorate', regionAr: 'محافظة نابلس', regionEn: 'Nablus Governorate', providersCount: 18, lat: 32.2211, lng: 35.2544 },
      { id: 'الخليل', nameAr: 'الخليل', nameEn: 'Hebron', labelAr: 'الخليل — محافظة الخليل', labelEn: 'Hebron Governorate', regionAr: 'محافظة الخليل', regionEn: 'Hebron Governorate', providersCount: 18, lat: 31.5326, lng: 35.0998 },
      { id: 'بيت لحم', nameAr: 'بيت لحم', nameEn: 'Bethlehem', labelAr: 'بيت لحم — محافظة بيت لحم', labelEn: 'Bethlehem Governorate', regionAr: 'محافظة بيت لحم', regionEn: 'Bethlehem Governorate', providersCount: 14, lat: 31.7054, lng: 35.2024 },
    ],
    emergencyNumbers: { ambulance: '101', police: '100', civilDefense: '102', childHelpline: '121' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['5', '05'], exampleLocal: '591234567', exampleInternational: '+970 591234567' },
    rateFromSAR: 0.99,
    currencyDecimals: 0,
  },
  LB: {
    code: 'LB',
    nameAr: 'لبنان',
    nameEn: 'Lebanon',
    flag: '🇱🇧',
    dialCode: '+961',
    currencyCode: 'LBP',
    currencyNameAr: 'ليرة لبنانية',
    currencyNameEn: 'Lebanese Pound',
    currencySymbolAr: 'ل.ل',
    currencySymbolEn: 'LBP',
    defaultTimezone: 'Asia/Beirut',
    defaultCity: 'بيروت',
    defaultCityEn: 'Beirut',
    regions: [
      { id: 'LB-BA', nameAr: 'بيروت وجبل لبنان', nameEn: 'Beirut & Mount Lebanon' },
      { id: 'LB-AS', nameAr: 'الشمال والجنوب والبقاع', nameEn: 'North, South & Bekaa' },
    ],
    cities: [
      { id: 'بيروت', nameAr: 'بيروت', nameEn: 'Beirut', labelAr: 'بيروت — محافظة بيروت', labelEn: 'Beirut Governorate', regionAr: 'محافظة بيروت', regionEn: 'Beirut Governorate', providersCount: 28, lat: 33.8938, lng: 35.5018 },
      { id: 'طرابلس', nameAr: 'طرابلس', nameEn: 'Tripoli', labelAr: 'طرابلس — محافظة الشمال', labelEn: 'Tripoli — North Governorate', regionAr: 'محافظة الشمال', regionEn: 'North Governorate', providersCount: 18, lat: 34.4367, lng: 35.8497 },
      { id: 'صيدا', nameAr: 'صيدا', nameEn: 'Sidon', labelAr: 'صيدا — محافظة الجنوب', labelEn: 'Sidon — South Governorate', regionAr: 'محافظة الجنوب', regionEn: 'South Governorate', providersCount: 16, lat: 33.5571, lng: 35.3729 },
      { id: 'صور', nameAr: 'صور', nameEn: 'Tyre', labelAr: 'صور — محافظة الجنوب', labelEn: 'Tyre — South Governorate', regionAr: 'محافظة الجنوب', regionEn: 'South Governorate', providersCount: 14, lat: 33.2705, lng: 35.2038 },
      { id: 'زحلة', nameAr: 'زحلة', nameEn: 'Zahle', labelAr: 'زحلة — محافظة البقاع', labelEn: 'Zahle — Bekaa Governorate', regionAr: 'محافظة البقاع', regionEn: 'Bekaa Governorate', providersCount: 14, lat: 33.8463, lng: 35.9020 },
    ],
    emergencyNumbers: { ambulance: '140', police: '112', civilDefense: '125', childHelpline: '1714' },
    phoneRule: { minDigits: 7, maxDigits: 8, localPrefixes: ['3', '7', '8', '03'], exampleLocal: '70123456', exampleInternational: '+961 70123456' },
    rateFromSAR: 23800,
    currencyDecimals: 0,
  },
  SY: {
    code: 'SY',
    nameAr: 'سوريا',
    nameEn: 'Syria',
    flag: '🇸🇾',
    dialCode: '+963',
    currencyCode: 'SYP',
    currencyNameAr: 'ليرة سورية',
    currencyNameEn: 'Syrian Pound',
    currencySymbolAr: 'ل.س',
    currencySymbolEn: 'SYP',
    defaultTimezone: 'Asia/Damascus',
    defaultCity: 'دمشق',
    defaultCityEn: 'Damascus',
    regions: [
      { id: 'SY-DI', nameAr: 'دمشق والوسط', nameEn: 'Damascus & Central' },
      { id: 'SY-HL', nameAr: 'حلب والساحل', nameEn: 'Aleppo & Coast' },
    ],
    cities: [
      { id: 'دمشق', nameAr: 'دمشق', nameEn: 'Damascus', labelAr: 'دمشق — محافظة دمشق', labelEn: 'Damascus Governorate', regionAr: 'محافظة دمشق', regionEn: 'Damascus Governorate', providersCount: 26, lat: 33.5138, lng: 36.2765 },
      { id: 'حلب', nameAr: 'حلب', nameEn: 'Aleppo', labelAr: 'حلب — محافظة حلب', labelEn: 'Aleppo Governorate', regionAr: 'محافظة حلب', regionEn: 'Aleppo Governorate', providersCount: 22, lat: 36.2021, lng: 37.1343 },
      { id: 'حمص', nameAr: 'حمص', nameEn: 'Homs', labelAr: 'حمص — محافظة حمص', labelEn: 'Homs Governorate', regionAr: 'محافظة حمص', regionEn: 'Homs Governorate', providersCount: 16, lat: 34.7324, lng: 36.7137 },
      { id: 'اللاذقية', nameAr: 'اللاذقية', nameEn: 'Latakia', labelAr: 'اللاذقية — محافظة اللاذقية', labelEn: 'Latakia Governorate', regionAr: 'محافظة اللاذقية', regionEn: 'Latakia Governorate', providersCount: 15, lat: 35.5317, lng: 35.7918 },
      { id: 'حماة', nameAr: 'حماة', nameEn: 'Hama', labelAr: 'حماة — محافظة حماة', labelEn: 'Hama Governorate', regionAr: 'محافظة حماة', regionEn: 'Hama Governorate', providersCount: 14, lat: 35.1318, lng: 36.7578 },
    ],
    emergencyNumbers: { ambulance: '110', police: '112', civilDefense: '113', childHelpline: '110' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['9', '09'], exampleLocal: '931234567', exampleInternational: '+963 931234567' },
    rateFromSAR: 3450,
    currencyDecimals: 0,
  },
  YE: {
    code: 'YE',
    nameAr: 'اليمن',
    nameEn: 'Yemen',
    flag: '🇾🇪',
    dialCode: '+967',
    currencyCode: 'YER',
    currencyNameAr: 'ريال يمني',
    currencyNameEn: 'Yemeni Rial',
    currencySymbolAr: 'ر.ي',
    currencySymbolEn: 'YER',
    defaultTimezone: 'Asia/Aden',
    defaultCity: 'صنعاء',
    defaultCityEn: 'Sanaa',
    regions: [
      { id: 'YE-SA', nameAr: 'أمانة العاصمة والمرتفعات', nameEn: 'Sanaa & Highlands' },
      { id: 'YE-AD', nameAr: 'عدن وحضرموت والساحل', nameEn: 'Aden, Hadhramaut & Coast' },
    ],
    cities: [
      { id: 'صنعاء', nameAr: 'صنعاء', nameEn: 'Sanaa', labelAr: 'صنعاء — أمانة العاصمة', labelEn: 'Sanaa — Capital Municipality', regionAr: 'أمانة العاصمة', regionEn: 'Capital Municipality', providersCount: 22, lat: 15.3694, lng: 44.1910 },
      { id: 'عدن', nameAr: 'عدن', nameEn: 'Aden', labelAr: 'عدن — محافظة عدن', labelEn: 'Aden Governorate', regionAr: 'محافظة عدن', regionEn: 'Aden Governorate', providersCount: 19, lat: 12.7855, lng: 45.0187 },
      { id: 'تعز', nameAr: 'تعز', nameEn: 'Taiz', labelAr: 'تعز — محافظة تعز', labelEn: 'Taiz Governorate', regionAr: 'محافظة تعز', regionEn: 'Taiz Governorate', providersCount: 16, lat: 13.5776, lng: 44.0178 },
      { id: 'المكلا', nameAr: 'المكلا', nameEn: 'Mukalla', labelAr: 'المكلا — محافظة حضرموت', labelEn: 'Mukalla — Hadhramaut', regionAr: 'محافظة حضرموت', regionEn: 'Hadhramaut Governorate', providersCount: 15, lat: 14.5425, lng: 49.1242 },
      { id: 'الحديدة', nameAr: 'الحديدة', nameEn: 'Al Hudaydah', labelAr: 'الحديدة — محافظة الحديدة', labelEn: 'Al Hudaydah Governorate', regionAr: 'محافظة الحديدة', regionEn: 'Al Hudaydah Governorate', providersCount: 14, lat: 14.7979, lng: 42.9545 },
    ],
    emergencyNumbers: { ambulance: '195', police: '199', civilDefense: '191', childHelpline: '136' },
    phoneRule: { minDigits: 9, maxDigits: 9, localPrefixes: ['7'], exampleLocal: '771234567', exampleInternational: '+967 771234567' },
    rateFromSAR: 66,
    currencyDecimals: 0,
  },
  SD: {
    code: 'SD',
    nameAr: 'السودان',
    nameEn: 'Sudan',
    flag: '🇸🇩',
    dialCode: '+249',
    currencyCode: 'SDG',
    currencyNameAr: 'جنيه سوداني',
    currencyNameEn: 'Sudanese Pound',
    currencySymbolAr: 'ج.س',
    currencySymbolEn: 'SDG',
    defaultTimezone: 'Africa/Khartoum',
    defaultCity: 'الخرطوم',
    defaultCityEn: 'Khartoum',
    regions: [
      { id: 'SD-KH', nameAr: 'ولاية الخرطوم والوسط', nameEn: 'Khartoum & Central' },
      { id: 'SD-RS', nameAr: 'البحر الأحمر والولايات', nameEn: 'Red Sea & States' },
    ],
    cities: [
      { id: 'الخرطوم', nameAr: 'الخرطوم', nameEn: 'Khartoum', labelAr: 'الخرطوم — ولاية الخرطوم', labelEn: 'Khartoum State', regionAr: 'ولاية الخرطوم', regionEn: 'Khartoum State', providersCount: 24, lat: 15.5007, lng: 32.5599, subCitiesAr: ['الخرطوم بحري'], subCitiesEn: ['Khartoum North'] },
      { id: 'أم درمان', nameAr: 'أم درمان', nameEn: 'Omdurman', labelAr: 'أم درمان — ولاية الخرطوم', labelEn: 'Omdurman — Khartoum State', regionAr: 'ولاية الخرطوم', regionEn: 'Khartoum State', providersCount: 20, lat: 15.6445, lng: 32.4777 },
      { id: 'بورتسودان', nameAr: 'بورتسودان', nameEn: 'Port Sudan', labelAr: 'بورتسودان — ولاية البحر الأحمر', labelEn: 'Port Sudan — Red Sea State', regionAr: 'ولاية البحر الأحمر', regionEn: 'Red Sea State', providersCount: 16, lat: 19.6175, lng: 37.2164 },
      { id: 'ود مدني', nameAr: 'ود مدني', nameEn: 'Wad Madani', labelAr: 'ود مدني — ولاية الجزيرة', labelEn: 'Wad Madani — Gezira State', regionAr: 'ولاية الجزيرة', regionEn: 'Gezira State', providersCount: 15, lat: 14.4012, lng: 33.5199 },
      { id: 'عطبرة', nameAr: 'عطبرة', nameEn: 'Atbara', labelAr: 'عطبرة — ولاية نهر النيل', labelEn: 'Atbara — River Nile State', regionAr: 'ولاية نهر النيل', regionEn: 'River Nile State', providersCount: 12, lat: 17.7022, lng: 33.9864 },
    ],
    emergencyNumbers: { ambulance: '333', police: '999', civilDefense: '998', childHelpline: '9696' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['9', '1', '09', '01'], exampleLocal: '912345678', exampleInternational: '+249 912345678' },
    rateFromSAR: 160,
    currencyDecimals: 0,
  },
  LY: {
    code: 'LY',
    nameAr: 'ليبيا',
    nameEn: 'Libya',
    flag: '🇱🇾',
    dialCode: '+218',
    currencyCode: 'LYD',
    currencyNameAr: 'دينار ليبي',
    currencyNameEn: 'Libyan Dinar',
    currencySymbolAr: 'د.ل',
    currencySymbolEn: 'LYD',
    defaultTimezone: 'Africa/Tripoli',
    defaultCity: 'طرابلس',
    defaultCityEn: 'Tripoli',
    regions: [
      { id: 'LY-TB', nameAr: 'طرابلس والغرب', nameEn: 'Tripoli & West' },
      { id: 'LY-BA', nameAr: 'بنغازي والشرق والجنوب', nameEn: 'Benghazi, East & South' },
    ],
    cities: [
      { id: 'طرابلس', nameAr: 'طرابلس', nameEn: 'Tripoli', labelAr: 'طرابلس — طرابلس الكبرى', labelEn: 'Tripoli Governorate', regionAr: 'طرابلس الكبرى', regionEn: 'Greater Tripoli', providersCount: 24, lat: 32.8872, lng: 13.1913 },
      { id: 'بنغازي', nameAr: 'بنغازي', nameEn: 'Benghazi', labelAr: 'بنغازي — المنطقة الشرقية', labelEn: 'Benghazi Region', regionAr: 'بنغازي', regionEn: 'Benghazi Region', providersCount: 20, lat: 32.1194, lng: 20.0868 },
      { id: 'مصراتة', nameAr: 'مصراتة', nameEn: 'Misrata', labelAr: 'مصراتة — بلدية مصراتة', labelEn: 'Misrata Municipality', regionAr: 'مصراتة', regionEn: 'Misrata Municipality', providersCount: 16, lat: 32.3754, lng: 15.0925 },
      { id: 'الزاوية', nameAr: 'الزاوية', nameEn: 'Zawiya', labelAr: 'الزاوية — الغرب الليبي', labelEn: 'Zawiya', regionAr: 'الزاوية', regionEn: 'Zawiya Region', providersCount: 12, lat: 32.7571, lng: 12.7276 },
      { id: 'سبها', nameAr: 'سبها', nameEn: 'Sebha', labelAr: 'سبها — الجنوب الليبي', labelEn: 'Sebha — South Region', regionAr: 'سبها', regionEn: 'Sebha Region', providersCount: 10, lat: 27.0377, lng: 14.4283 },
    ],
    emergencyNumbers: { ambulance: '1515', police: '1515', civilDefense: '1515', childHelpline: '1417' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['9', '09'], exampleLocal: '911234567', exampleInternational: '+218 911234567' },
    rateFromSAR: 1.3,
    currencyDecimals: 0,
  },
  TN: {
    code: 'TN',
    nameAr: 'تونس',
    nameEn: 'Tunisia',
    flag: '🇹🇳',
    dialCode: '+216',
    currencyCode: 'TND',
    currencyNameAr: 'دينار تونسي',
    currencyNameEn: 'Tunisian Dinar',
    currencySymbolAr: 'د.ت',
    currencySymbolEn: 'TND',
    defaultTimezone: 'Africa/Tunis',
    defaultCity: 'تونس',
    defaultCityEn: 'Tunis',
    regions: [
      { id: 'TN-11', nameAr: 'تونس الكبرى والشمال', nameEn: 'Greater Tunis & North' },
      { id: 'TN-51', nameAr: 'الساحل والوسط والجنوب', nameEn: 'Sahel, Central & South' },
    ],
    cities: [
      { id: 'تونس', nameAr: 'تونس', nameEn: 'Tunis', labelAr: 'تونس — ولاية تونس', labelEn: 'Tunis Governorate', regionAr: 'ولاية تونس', regionEn: 'Tunis Governorate', providersCount: 28, lat: 36.8065, lng: 10.1815, subCitiesAr: ['أريانة', 'بن عروس', 'المرسى'], subCitiesEn: ['Ariana', 'Ben Arous', 'La Marsa'] },
      { id: 'صفاقس', nameAr: 'صفاقس', nameEn: 'Sfax', labelAr: 'صفاقس — ولاية صفاقس', labelEn: 'Sfax Governorate', regionAr: 'ولاية صفاقس', regionEn: 'Sfax Governorate', providersCount: 20, lat: 34.7406, lng: 10.7603 },
      { id: 'سوسة', nameAr: 'سوسة', nameEn: 'Sousse', labelAr: 'سوسة — ولاية سوسة', labelEn: 'Sousse Governorate', regionAr: 'ولاية سوسة', regionEn: 'Sousse Governorate', providersCount: 18, lat: 35.8256, lng: 10.6369 },
      { id: 'القيروان', nameAr: 'القيروان', nameEn: 'Kairouan', labelAr: 'القيروان — ولاية القيروان', labelEn: 'Kairouan Governorate', regionAr: 'ولاية القيروان', regionEn: 'Kairouan Governorate', providersCount: 14, lat: 35.6781, lng: 10.0963 },
      { id: 'بنزرت', nameAr: 'بنزرت', nameEn: 'Bizerte', labelAr: 'بنزرت — ولاية بنزرت', labelEn: 'Bizerte Governorate', regionAr: 'ولاية بنزرت', regionEn: 'Bizerte Governorate', providersCount: 14, lat: 37.2744, lng: 9.8739 },
    ],
    emergencyNumbers: { ambulance: '190', police: '197', civilDefense: '198', childHelpline: '1809' },
    phoneRule: { minDigits: 8, maxDigits: 8, localPrefixes: ['2', '4', '5', '9'], exampleLocal: '20123456', exampleInternational: '+216 20123456' },
    rateFromSAR: 0.83,
    currencyDecimals: 0,
  },
  DZ: {
    code: 'DZ',
    nameAr: 'الجزائر',
    nameEn: 'Algeria',
    flag: '🇩🇿',
    dialCode: '+213',
    currencyCode: 'DZD',
    currencyNameAr: 'دينار جزائري',
    currencyNameEn: 'Algerian Dinar',
    currencySymbolAr: 'د.ج',
    currencySymbolEn: 'DZD',
    defaultTimezone: 'Africa/Algiers',
    defaultCity: 'الجزائر',
    defaultCityEn: 'Algiers',
    regions: [
      { id: 'DZ-16', nameAr: 'ولاية الجزائر والوسط', nameEn: 'Algiers & Central' },
      { id: 'DZ-31', nameAr: 'وهران والشرق والجنوب', nameEn: 'Oran, East & South' },
    ],
    cities: [
      { id: 'الجزائر', nameAr: 'الجزائر', nameEn: 'Algiers', labelAr: 'الجزائر — ولاية الجزائر', labelEn: 'Algiers Province', regionAr: 'ولاية الجزائر', regionEn: 'Algiers Province', providersCount: 32, lat: 36.7538, lng: 3.0588, subCitiesAr: ['باب الزوار', 'حيدرة', 'الشراقة'], subCitiesEn: ['Bab Ezzouar', 'Hydra', 'Cheraga'] },
      { id: 'وهران', nameAr: 'وهران', nameEn: 'Oran', labelAr: 'وهران — ولاية وهران', labelEn: 'Oran Province', regionAr: 'ولاية وهران', regionEn: 'Oran Province', providersCount: 24, lat: 35.6971, lng: -0.6308 },
      { id: 'قسنطينة', nameAr: 'قسنطينة', nameEn: 'Constantine', labelAr: 'قسنطينة — ولاية قسنطينة', labelEn: 'Constantine Province', regionAr: 'ولاية قسنطينة', regionEn: 'Constantine Province', providersCount: 20, lat: 36.3650, lng: 6.6147 },
      { id: 'عنابة', nameAr: 'عنابة', nameEn: 'Annaba', labelAr: 'عنابة — ولاية عنابة', labelEn: 'Annaba Province', regionAr: 'ولاية عنابة', regionEn: 'Annaba Province', providersCount: 16, lat: 36.9000, lng: 7.7667 },
      { id: 'البليدة', nameAr: 'البليدة', nameEn: 'Blida', labelAr: 'البليدة — ولاية البليدة', labelEn: 'Blida Province', regionAr: 'ولاية البليدة', regionEn: 'Blida Province', providersCount: 15, lat: 36.4701, lng: 2.8277 },
    ],
    emergencyNumbers: { ambulance: '14', police: '17', civilDefense: '14', childHelpline: '1111' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['5', '6', '7', '05', '06', '07'], exampleLocal: '551234567', exampleInternational: '+213 551234567' },
    rateFromSAR: 35.5,
    currencyDecimals: 0,
  },
  MA: {
    code: 'MA',
    nameAr: 'المغرب',
    nameEn: 'Morocco',
    flag: '🇲🇦',
    dialCode: '+212',
    currencyCode: 'MAD',
    currencyNameAr: 'درهم مغربي',
    currencyNameEn: 'Moroccan Dirham',
    currencySymbolAr: 'د.م',
    currencySymbolEn: 'MAD',
    defaultTimezone: 'Africa/Casablanca',
    defaultCity: 'الرباط',
    defaultCityEn: 'Rabat',
    regions: [
      { id: 'MA-04', nameAr: 'الرباط والدار البيضاء', nameEn: 'Rabat & Casablanca' },
      { id: 'MA-07', nameAr: 'مراكش وطنجة وفاس', nameEn: 'Marrakech, Tangier & Fes' },
    ],
    cities: [
      { id: 'الرباط', nameAr: 'الرباط', nameEn: 'Rabat', labelAr: 'الرباط — جهة الرباط سلا القنيطرة', labelEn: 'Rabat — Rabat-Sale-Kenitra', regionAr: 'جهة الرباط سلا القنيطرة', regionEn: 'Rabat-Sale-Kenitra', providersCount: 30, lat: 34.0209, lng: -6.8416, subCitiesAr: ['سلا', 'تمارة'], subCitiesEn: ['Sale', 'Temara'] },
      { id: 'الدار البيضاء', nameAr: 'الدار البيضاء', nameEn: 'Casablanca', labelAr: 'الدار البيضاء — جهة الدار البيضاء سطات', labelEn: 'Casablanca-Settat', regionAr: 'جهة الدار البيضاء سطات', regionEn: 'Casablanca-Settat', providersCount: 36, lat: 33.5731, lng: -7.5898, subCitiesAr: ['المعاريف', 'عين الذياب'], subCitiesEn: ['Maarif', 'Ain Diab'] },
      { id: 'مراكش', nameAr: 'مراكش', nameEn: 'Marrakech', labelAr: 'مراكش — جهة مراكش آسفي', labelEn: 'Marrakech-Safi', regionAr: 'جهة مراكش آسفي', regionEn: 'Marrakech-Safi', providersCount: 24, lat: 31.6295, lng: -7.9811 },
      { id: 'طنجة', nameAr: 'طنجة', nameEn: 'Tangier', labelAr: 'طنجة — جهة طنجة تطوان الحسيمة', labelEn: 'Tangier-Tetouan-Al Hoceima', regionAr: 'جهة طنجة تطوان الحسيمة', regionEn: 'Tangier-Tetouan-Al Hoceima', providersCount: 22, lat: 35.7595, lng: -5.8340 },
      { id: 'فاس', nameAr: 'فاس', nameEn: 'Fes', labelAr: 'فاس — جهة فاس مكناس', labelEn: 'Fes-Meknes', regionAr: 'جهة فاس مكناس', regionEn: 'Fes-Meknes', providersCount: 20, lat: 34.0181, lng: -5.0078 },
      { id: 'أكادير', nameAr: 'أكادير', nameEn: 'Agadir', labelAr: 'أكادير — جهة سوس ماسة', labelEn: 'Agadir — Souss-Massa', regionAr: 'جهة سوس ماسة', regionEn: 'Souss-Massa', providersCount: 18, lat: 30.4278, lng: -9.5981 },
    ],
    emergencyNumbers: { ambulance: '150', police: '190', civilDefense: '150', childHelpline: '2511' },
    phoneRule: { minDigits: 9, maxDigits: 10, localPrefixes: ['6', '7', '06', '07'], exampleLocal: '612345678', exampleInternational: '+212 612345678' },
    rateFromSAR: 2.65,
    currencyDecimals: 0,
  },
  MR: {
    code: 'MR',
    nameAr: 'موريتانيا',
    nameEn: 'Mauritania',
    flag: '🇲🇷',
    dialCode: '+222',
    currencyCode: 'MRU',
    currencyNameAr: 'أوقية موريتانية',
    currencyNameEn: 'Mauritanian Ouguiya',
    currencySymbolAr: 'أ.م',
    currencySymbolEn: 'MRU',
    defaultTimezone: 'Africa/Nouakchott',
    defaultCity: 'نواكشوط',
    defaultCityEn: 'Nouakchott',
    regions: [
      { id: 'MR-NKC', nameAr: 'نواكشوط والساحل', nameEn: 'Nouakchott & Coast' },
      { id: 'MR-IN', nameAr: 'الولايات الداخلية', nameEn: 'Interior Regions' },
    ],
    cities: [
      { id: 'نواكشوط', nameAr: 'نواكشوط', nameEn: 'Nouakchott', labelAr: 'نواكشوط — العاصمة نواكشوط', labelEn: 'Nouakchott Capital Region', regionAr: 'ولاية نواكشوط', regionEn: 'Nouakchott Region', providersCount: 18, lat: 18.0735, lng: -15.9582 },
      { id: 'نواذيبو', nameAr: 'نواذيبو', nameEn: 'Nouadhibou', labelAr: 'نواذيبو — داخلت نواذيبو', labelEn: 'Nouadhibou — Dakhlet Nouadhibou', regionAr: 'ولاية داخلت نواذيبو', regionEn: 'Dakhlet Nouadhibou', providersCount: 12, lat: 20.9310, lng: -17.0347 },
      { id: 'كيفه', nameAr: 'كيفه', nameEn: 'Kiffa', labelAr: 'كيفه — ولاية العصابة', labelEn: 'Kiffa — Assaba Region', regionAr: 'ولاية العصابة', regionEn: 'Assaba Region', providersCount: 10, lat: 16.6166, lng: -11.4045 },
      { id: 'روصو', nameAr: 'روصو', nameEn: 'Rosso', labelAr: 'روصو — ولاية الترارزة', labelEn: 'Rosso — Trarza Region', regionAr: 'ولاية الترارزة', regionEn: 'Trarza Region', providersCount: 9, lat: 16.5138, lng: -15.8050 },
    ],
    emergencyNumbers: { ambulance: '101', police: '117', civilDefense: '118', childHelpline: '116' },
    phoneRule: { minDigits: 8, maxDigits: 8, localPrefixes: ['2', '3', '4'], exampleLocal: '22123456', exampleInternational: '+222 22123456' },
    rateFromSAR: 10.6,
    currencyDecimals: 0,
  },
  SO: {
    code: 'SO',
    nameAr: 'الصومال',
    nameEn: 'Somalia',
    flag: '🇸🇴',
    dialCode: '+252',
    currencyCode: 'SOS',
    currencyNameAr: 'شلن صومالي',
    currencyNameEn: 'Somali Shilling',
    currencySymbolAr: 'ش.ص',
    currencySymbolEn: 'SOS',
    defaultTimezone: 'Africa/Mogadishu',
    defaultCity: 'مقديشو',
    defaultCityEn: 'Mogadishu',
    regions: [
      { id: 'SO-BN', nameAr: 'بنادر والجنوب', nameEn: 'Banaadir & South' },
      { id: 'SO-NW', nameAr: 'الشمال والشرق', nameEn: 'North & East' },
    ],
    cities: [
      { id: 'مقديشو', nameAr: 'مقديشو', nameEn: 'Mogadishu', labelAr: 'مقديشو — إقليم بنادر', labelEn: 'Mogadishu — Banaadir Region', regionAr: 'إقليم بنادر', regionEn: 'Banaadir Region', providersCount: 18, lat: 2.0469, lng: 45.3182 },
      { id: 'هرجيسا', nameAr: 'هرجيسا', nameEn: 'Hargeisa', labelAr: 'هرجيسا — شمال الصومال', labelEn: 'Hargeisa — North Region', regionAr: 'إقليم وقويي جالبيد', regionEn: 'Woqooyi Galbeed', providersCount: 14, lat: 9.5600, lng: 44.0650 },
      { id: 'بوصاصو', nameAr: 'بوصاصو', nameEn: 'Bosaso', labelAr: 'بوصاصو — إقليم بري', labelEn: 'Bosaso — Bari Region', regionAr: 'إقليم بري', regionEn: 'Bari Region', providersCount: 11, lat: 11.2842, lng: 49.1816 },
      { id: 'كيسمايو', nameAr: 'كيسمايو', nameEn: 'Kismayo', labelAr: 'كيسمايو — جوبا السفلى', labelEn: 'Kismayo — Lower Juba', regionAr: 'إقليم جوبا السفلى', regionEn: 'Lower Juba', providersCount: 10, lat: -0.3582, lng: 42.5454 },
    ],
    emergencyNumbers: { ambulance: '999', police: '888', civilDefense: '555', childHelpline: '116' },
    phoneRule: { minDigits: 8, maxDigits: 9, localPrefixes: ['6', '7', '9'], exampleLocal: '612345678', exampleInternational: '+252 612345678' },
    rateFromSAR: 152,
    currencyDecimals: 0,
  },
  DJ: {
    code: 'DJ',
    nameAr: 'جيبوتي',
    nameEn: 'Djibouti',
    flag: '🇩🇯',
    dialCode: '+253',
    currencyCode: 'DJF',
    currencyNameAr: 'فرنك جيبوتي',
    currencyNameEn: 'Djiboutian Franc',
    currencySymbolAr: 'ف.ج',
    currencySymbolEn: 'DJF',
    defaultTimezone: 'Africa/Djibouti',
    defaultCity: 'جيبوتي',
    defaultCityEn: 'Djibouti City',
    regions: [
      { id: 'DJ-DJ', nameAr: 'إقليم جيبوتي', nameEn: 'Djibouti Region' },
      { id: 'DJ-AS', nameAr: 'علي صبيح وتاجورة', nameEn: 'Ali Sabieh & Tadjourah' },
    ],
    cities: [
      { id: 'جيبوتي', nameAr: 'جيبوتي', nameEn: 'Djibouti City', labelAr: 'جيبوتي — العاصمة جيبوتي', labelEn: 'Djibouti City', regionAr: 'إقليم جيبوتي', regionEn: 'Djibouti Region', providersCount: 16, lat: 11.5721, lng: 43.1456 },
      { id: 'علي صبيح', nameAr: 'علي صبيح', nameEn: 'Ali Sabieh', labelAr: 'علي صبيح — إقليم علي صبيح', labelEn: 'Ali Sabieh Region', regionAr: 'إقليم علي صبيح', regionEn: 'Ali Sabieh Region', providersCount: 9, lat: 11.1558, lng: 42.7125 },
      { id: 'تاجورة', nameAr: 'تاجورة', nameEn: 'Tadjourah', labelAr: 'تاجورة — إقليم تاجورة', labelEn: 'Tadjourah Region', regionAr: 'إقليم تاجورة', regionEn: 'Tadjourah Region', providersCount: 8, lat: 11.7878, lng: 42.8822 },
      { id: 'أوبوك', nameAr: 'أوبوك', nameEn: 'Obock', labelAr: 'أوبوك — إقليم أوبوك', labelEn: 'Obock Region', regionAr: 'إقليم أوبوك', regionEn: 'Obock Region', providersCount: 7, lat: 11.9669, lng: 43.2886 },
    ],
    emergencyNumbers: { ambulance: '19', police: '17', civilDefense: '18', childHelpline: '116' },
    phoneRule: { minDigits: 8, maxDigits: 8, localPrefixes: ['77'], exampleLocal: '77123456', exampleInternational: '+253 77123456' },
    rateFromSAR: 47.4,
    currencyDecimals: 0,
  },
  KM: {
    code: 'KM',
    nameAr: 'جزر القمر',
    nameEn: 'Comoros',
    flag: '🇰🇲',
    dialCode: '+269',
    currencyCode: 'KMF',
    currencyNameAr: 'فرنك قمري',
    currencyNameEn: 'Comorian Franc',
    currencySymbolAr: 'ف.ق',
    currencySymbolEn: 'KMF',
    defaultTimezone: 'Indian/Comoro',
    defaultCity: 'موروني',
    defaultCityEn: 'Moroni',
    regions: [
      { id: 'KM-G', nameAr: 'القمر الكبرى', nameEn: 'Grande Comore' },
      { id: 'KM-A', nameAr: 'أنجوان وموهيلي', nameEn: 'Anjouan & Moheli' },
    ],
    cities: [
      { id: 'موروني', nameAr: 'موروني', nameEn: 'Moroni', labelAr: 'موروني — جزيرة القمر الكبرى', labelEn: 'Moroni — Grande Comore', regionAr: 'جزيرة القمر الكبرى', regionEn: 'Grande Comore', providersCount: 14, lat: -11.7172, lng: 43.2473 },
      { id: 'موتسامودو', nameAr: 'موتسامودو', nameEn: 'Mutsamudu', labelAr: 'موتسامودو — جزيرة أنجوان', labelEn: 'Mutsamudu — Anjouan', regionAr: 'جزيرة أنجوان', regionEn: 'Anjouan', providersCount: 10, lat: -12.1667, lng: 44.4000 },
      { id: 'فومبوني', nameAr: 'فومبوني', nameEn: 'Fomboni', labelAr: 'فومبوني — جزيرة موهيلي', labelEn: 'Fomboni — Moheli', regionAr: 'جزيرة موهيلي', regionEn: 'Moheli', providersCount: 8, lat: -12.2800, lng: 43.7425 },
    ],
    emergencyNumbers: { ambulance: '772', police: '17', civilDefense: '18', childHelpline: '116' },
    phoneRule: { minDigits: 7, maxDigits: 7, localPrefixes: ['3', '4'], exampleLocal: '3212345', exampleInternational: '+269 3212345' },
    rateFromSAR: 120,
    currencyDecimals: 0,
  },
};

export const COUNTRY_CITIES_MAP: Record<CountryCode, CityOption[]> = Object.fromEntries(
  ALL_ARAB_COUNTRY_CODES.map((code) => [code, ARAB_COUNTRIES_REGISTRY[code].cities])
) as Record<CountryCode, CityOption[]>;

export const CURRENCY_METADATA_MAP: Record<
  CurrencyCode,
  {
    code: CurrencyCode;
    countryCode: CountryCode;
    nameAr: string;
    nameEn: string;
    symbolAr: string;
    symbolEn: string;
    rateFromSAR: number;
    decimals: number;
  }
> = Object.fromEntries(
  ALL_ARAB_COUNTRY_CODES.map((code) => {
    const c = ARAB_COUNTRIES_REGISTRY[code];
    return [
      c.currencyCode,
      {
        code: c.currencyCode,
        countryCode: c.code,
        nameAr: c.currencyNameAr,
        nameEn: c.currencyNameEn,
        symbolAr: c.currencySymbolAr,
        symbolEn: c.currencySymbolEn,
        rateFromSAR: c.rateFromSAR,
        decimals: c.currencyDecimals,
      },
    ];
  })
) as Record<
  CurrencyCode,
  {
    code: CurrencyCode;
    countryCode: CountryCode;
    nameAr: string;
    nameEn: string;
    symbolAr: string;
    symbolEn: string;
    rateFromSAR: number;
    decimals: number;
  }
>;

export function isSupportedCountryCode(val: unknown): val is CountryCode {
  return (
    typeof val === 'string' &&
    Object.prototype.hasOwnProperty.call(ARAB_COUNTRIES_REGISTRY, val.trim().toUpperCase())
  );
}

export function isSupportedCurrencyCode(val: unknown): val is CurrencyCode {
  return (
    typeof val === 'string' &&
    Object.prototype.hasOwnProperty.call(CURRENCY_METADATA_MAP, val.trim().toUpperCase())
  );
}

/**
 * Resolves any country code, Arabic/English country name, or dial code into a valid CountryCode
 * without ever blindly forcing non-EG values into 'SA'.
 */
export function resolveCountryCode(
  raw: unknown,
  fallback: CountryCode = 'EG'
): CountryCode {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  const upper = trimmed.toUpperCase();
  if (isSupportedCountryCode(upper)) {
    return upper;
  }

  for (const code of ALL_ARAB_COUNTRY_CODES) {
    const meta = ARAB_COUNTRIES_REGISTRY[code];
    if (
      meta.nameAr === trimmed ||
      meta.nameEn.toUpperCase() === upper ||
      meta.dialCode === trimmed ||
      meta.currencyCode === upper
    ) {
      return code;
    }
  }

  return fallback;
}

export function resolveCurrencyCode(
  raw: unknown,
  fallbackCountry?: CountryCode
): CurrencyCode {
  if (typeof raw === 'string') {
    const upper = raw.trim().toUpperCase();
    if (isSupportedCurrencyCode(upper)) {
      return upper;
    }
    if (isSupportedCountryCode(upper)) {
      return ARAB_COUNTRIES_REGISTRY[upper].currencyCode;
    }
  }
  if (fallbackCountry && isSupportedCountryCode(fallbackCountry)) {
    return ARAB_COUNTRIES_REGISTRY[fallbackCountry].currencyCode;
  }
  return 'EGP';
}

export function getCountryMetadata(country: CountryCode | string): ArabCountryMetadata {
  const code = resolveCountryCode(country, 'EG');
  return ARAB_COUNTRIES_REGISTRY[code];
}

export function getDefaultCityForCountry(country: CountryCode | string): string {
  return getCountryMetadata(country).defaultCity;
}

export function getSuggestedCurrencyForCountry(country: CountryCode | string): CurrencyCode {
  return getCountryMetadata(country).currencyCode;
}

export function getCountryTimezone(country: CountryCode | string): string {
  return getCountryMetadata(country).defaultTimezone;
}

export function getCountryDialCode(country: CountryCode | string): string {
  return getCountryMetadata(country).dialCode;
}

export function getCitiesForCountry(country: CountryCode | string): CityOption[] {
  return getCountryMetadata(country).cities;
}

export function resolveValidCityForCountry(
  country: CountryCode | string,
  cityCandidate?: string | null
): string {
  const meta = getCountryMetadata(country);
  if (typeof cityCandidate === 'string' && cityCandidate.trim()) {
    const trimmed = cityCandidate.trim();
    const matched = meta.cities.find(
      (c) =>
        c.id === trimmed ||
        c.nameAr === trimmed ||
        c.nameEn.toLowerCase() === trimmed.toLowerCase() ||
        (c.subCitiesAr && c.subCitiesAr.includes(trimmed)) ||
        (c.subCitiesEn && c.subCitiesEn.some((s) => s.toLowerCase() === trimmed.toLowerCase())) ||
        trimmed.includes(c.nameAr) ||
        c.nameAr.includes(trimmed)
    );
    if (matched) return matched.id;
    return trimmed;
  }
  return meta.defaultCity;
}

export function getCityCoordinates(
  country: CountryCode | string,
  cityName?: string | null
): { lat: number; lng: number; nameAr: string; nameEn: string } {
  const meta = getCountryMetadata(country);
  if (cityName) {
    const trimmed = cityName.trim();
    const found = meta.cities.find(
      (c) =>
        c.id === trimmed ||
        c.nameAr === trimmed ||
        c.nameEn.toLowerCase() === trimmed.toLowerCase() ||
        (c.subCitiesAr && c.subCitiesAr.includes(trimmed))
    );
    if (found) {
      return { lat: found.lat, lng: found.lng, nameAr: found.nameAr, nameEn: found.nameEn };
    }
  }
  const first = meta.cities[0];
  return { lat: first.lat, lng: first.lng, nameAr: first.nameAr, nameEn: first.nameEn };
}

/**
 * Converts a catalog price (defined in EGP and/or SAR) to any of the 22 Arab League currencies.
 * Preserves exact priceEGP for EGP and exact priceSAR for SAR.
 */
export function convertCatalogPrice(
  priceEGP: number,
  priceSAR: number,
  targetCurrency: CurrencyCode | string
): number {
  const currency = resolveCurrencyCode(targetCurrency);
  if (currency === 'EGP') return Math.max(0, Math.round(priceEGP));
  if (currency === 'SAR') return Math.max(0, Math.round(priceSAR));

  const meta = CURRENCY_METADATA_MAP[currency];
  const baseSAR = priceSAR > 0 ? priceSAR : priceEGP / 13;
  const rawConverted = baseSAR * meta.rateFromSAR;

  if (meta.decimals > 0) {
    const factor = Math.pow(10, meta.decimals);
    return Math.max(0, Math.round(rawConverted * factor) / factor);
  }
  return Math.max(0, Math.round(rawConverted));
}

export function validatePhoneRuleForCountry(
  phoneRaw: string,
  country: CountryCode | string
): {
  valid: boolean;
  isValid: boolean;
  normalized: string;
  fullInternational: string;
  normalizedInternational: string;
  normalizedDigits: string;
  countryCode: CountryCode;
  errorAr?: string;
  errorEn?: string;
} {
  const meta = getCountryMetadata(country);
  const digits = (phoneRaw || '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\D/g, '');

  if (meta.code === 'EG') {
    const cleaned = digits.startsWith('20') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits;
    if (!/^1[0125]\d{8}$/.test(cleaned)) {
      return {
        valid: false,
        isValid: false,
        normalized: cleaned,
        fullInternational: `+20${cleaned}`,
        normalizedInternational: `+20${cleaned}`,
        normalizedDigits: cleaned,
        countryCode: 'EG',
        errorAr: 'أدخل رقم هاتف مصري صحيح مكون من 10 أرقام بعد الكود (+20 10/11/12/15)',
        errorEn: 'Enter a valid 10-digit Egyptian mobile number after +20 (e.g. 1012345678)',
      };
    }
    return {
      valid: true,
      isValid: true,
      normalized: cleaned,
      fullInternational: `+20 ${cleaned}`,
      normalizedInternational: `+20${cleaned}`,
      normalizedDigits: cleaned,
      countryCode: 'EG',
    };
  }

  if (meta.code === 'SA') {
    const cleanedSA = digits.startsWith('966') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
    if (!/^5\d{8}$/.test(cleanedSA)) {
      return {
        valid: false,
        isValid: false,
        normalized: cleanedSA,
        fullInternational: `+966${cleanedSA}`,
        normalizedInternational: `+966${cleanedSA}`,
        normalizedDigits: cleanedSA,
        countryCode: 'SA',
        errorAr: 'أدخل رقم جوال سعودي صحيح يبدأ بـ 5 ومكون من 9 أرقام بعد الكود (+966 5XXXXXXXX)',
        errorEn: 'Enter a valid 9-digit Saudi mobile number starting with 5 after +966',
      };
    }
    return {
      valid: true,
      isValid: true,
      normalized: cleanedSA,
      fullInternational: `+966 ${cleanedSA}`,
      normalizedInternational: `+966${cleanedSA}`,
      normalizedDigits: cleanedSA,
      countryCode: 'SA',
    };
  }

  const dialDigits = meta.dialCode.replace(/\D/g, '');
  let localDigits = digits;
  if (localDigits.startsWith('00' + dialDigits)) {
    localDigits = localDigits.slice(2 + dialDigits.length);
  } else if (localDigits.startsWith(dialDigits) && localDigits.length > meta.phoneRule.maxDigits) {
    localDigits = localDigits.slice(dialDigits.length);
  }
  const cleaned = localDigits.startsWith('0') ? localDigits.slice(1) : localDigits;

  const isLengthValid =
    (localDigits.length >= meta.phoneRule.minDigits && localDigits.length <= meta.phoneRule.maxDigits) ||
    (cleaned.length >= Math.max(6, meta.phoneRule.minDigits - 1) && cleaned.length <= meta.phoneRule.maxDigits);

  if (!isLengthValid) {
    return {
      valid: false,
      isValid: false,
      normalized: cleaned,
      fullInternational: `${meta.dialCode}${cleaned}`,
      normalizedInternational: `${meta.dialCode}${cleaned}`,
      normalizedDigits: cleaned,
      countryCode: meta.code,
      errorAr: `يرجى إدخال رقم هاتف صحيح لدولة ${meta.nameAr} (${meta.dialCode} ${meta.phoneRule.exampleLocal})`,
      errorEn: `Please enter a valid phone number for ${meta.nameEn} (${meta.dialCode} ${meta.phoneRule.exampleLocal})`,
    };
  }

  return {
    valid: true,
    isValid: true,
    normalized: cleaned,
    fullInternational: `${meta.dialCode} ${cleaned}`,
    normalizedInternational: `${meta.dialCode}${cleaned}`,
    normalizedDigits: cleaned,
    countryCode: meta.code,
  };
}
