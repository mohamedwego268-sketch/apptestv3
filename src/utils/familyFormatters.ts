import {
  CalendarDisplayMode,
  CountryCode,
  CurrencyCode,
  LanguageCode,
  calculateChildAge,
  dateLocalISO,
  formatCurrency,
  formatGregorianAndHijri,
  locText,
} from '../domain/familySpaceCore';

export {
  calculateChildAge,
  dateLocalISO,
  formatCurrency,
  formatGregorianAndHijri,
  locText,
};

export function getLocalizedBrandName(lang: LanguageCode): string {
  return lang === 'en' ? 'Nekbaar' : 'نكبر';
}

export function getLocalizedDocumentTitle(lang: LanguageCode): string {
  return lang === 'en'
    ? 'Nekbaar — Family & Child Super App'
    : 'نكبر — منصة الأسرة والطفل المتكاملة';
}

export function formatCountryCurrencySummary(
  country: CountryCode,
  city: string,
  currency: CurrencyCode,
  calendarMode: CalendarDisplayMode,
  lang: LanguageCode
): string {
  const isEn = lang === 'en';
  const countryLabel =
    country === 'SA' ? (isEn ? 'Saudi Arabia' : 'السعودية') : isEn ? 'Egypt' : 'مصر';
  const calLabel =
    calendarMode === 'both'
      ? isEn
        ? 'Gregorian + Hijri'
        : 'ميلادي + هجري'
      : calendarMode === 'hijri'
      ? isEn
        ? 'Hijri'
        : 'هجري'
      : isEn
      ? 'Gregorian'
      : 'ميلادي';
  return `${countryLabel} (${locText(city, lang)}) · ${currency} · ${calLabel}`;
}
