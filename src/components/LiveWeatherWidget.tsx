import React, { useEffect, useState, useCallback } from 'react';
import { CountryCode, LanguageCode, locText } from '../domain/familySpaceCore';

export interface WeatherForecastDay {
  labelAr: string;
  labelEn: string;
  tempMaxC: number;
  tempMinC: number;
  conditionAr: string;
  conditionEn: string;
  iconType: 'sun' | 'cloud-sun' | 'breeze' | 'rain';
}

export interface LiveWeatherSnapshot {
  cityAr: string;
  cityEn: string;
  tempC: number;
  feelsLikeC: number;
  humidityPct: number;
  windKmh: number;
  conditionAr: string;
  conditionEn: string;
  familyTipAr: string;
  familyTipEn: string;
  iconType: 'sun' | 'cloud-sun' | 'breeze' | 'rain';
  today: WeatherForecastDay;
  tomorrow: WeatherForecastDay;
  updatedAt: string;
  source: 'live-api' | 'calibrated';
}

interface CityCoordPreset {
  lat: number;
  lng: number;
  defaultTempC: number;
  defaultMaxC: number;
  defaultMinC: number;
  tomorrowMaxC: number;
  tomorrowMinC: number;
  humidity: number;
  wind: number;
  conditionAr: string;
  conditionEn: string;
  iconType: 'sun' | 'cloud-sun' | 'breeze';
}

const CITY_WEATHER_PRESETS: Record<string, CityCoordPreset> = {
  القاهرة: {
    lat: 30.0444,
    lng: 31.2357,
    defaultTempC: 26,
    defaultMaxC: 28,
    defaultMinC: 18,
    tomorrowMaxC: 27,
    tomorrowMinC: 19,
    humidity: 42,
    wind: 14,
    conditionAr: 'مشمس ومعتدل',
    conditionEn: 'Sunny & Pleasant',
    iconType: 'sun',
  },
  الجيزة: {
    lat: 30.0131,
    lng: 31.2089,
    defaultTempC: 26,
    defaultMaxC: 29,
    defaultMinC: 18,
    tomorrowMaxC: 28,
    tomorrowMinC: 18,
    humidity: 40,
    wind: 15,
    conditionAr: 'صافي ولطيف',
    conditionEn: 'Clear & Mild',
    iconType: 'sun',
  },
  الإسكندرية: {
    lat: 31.2001,
    lng: 29.9187,
    defaultTempC: 23,
    defaultMaxC: 25,
    defaultMinC: 17,
    tomorrowMaxC: 24,
    tomorrowMinC: 17,
    humidity: 62,
    wind: 21,
    conditionAr: 'نسيم بحري منعش',
    conditionEn: 'Fresh Sea Breeze',
    iconType: 'breeze',
  },
  المنصورة: {
    lat: 31.0409,
    lng: 31.3785,
    defaultTempC: 25,
    defaultMaxC: 27,
    defaultMinC: 17,
    tomorrowMaxC: 26,
    tomorrowMinC: 17,
    humidity: 50,
    wind: 13,
    conditionAr: 'غائم جزئيًا ولطيف',
    conditionEn: 'Partly Cloudy & Mild',
    iconType: 'cloud-sun',
  },
  الرياض: {
    lat: 24.7136,
    lng: 46.6753,
    defaultTempC: 29,
    defaultMaxC: 32,
    defaultMinC: 20,
    tomorrowMaxC: 31,
    tomorrowMinC: 21,
    humidity: 24,
    wind: 12,
    conditionAr: 'مشمس وصافي',
    conditionEn: 'Sunny & Clear',
    iconType: 'sun',
  },
  جدة: {
    lat: 21.4858,
    lng: 39.1925,
    defaultTempC: 28,
    defaultMaxC: 31,
    defaultMinC: 23,
    tomorrowMaxC: 30,
    tomorrowMinC: 23,
    humidity: 58,
    wind: 16,
    conditionAr: 'دافئ مع نسيم لطيف',
    conditionEn: 'Warm & Breezy',
    iconType: 'cloud-sun',
  },
  الدمام: {
    lat: 26.4207,
    lng: 50.0888,
    defaultTempC: 27,
    defaultMaxC: 30,
    defaultMinC: 21,
    tomorrowMaxC: 29,
    tomorrowMinC: 21,
    humidity: 48,
    wind: 15,
    conditionAr: 'صافي ومعتدل',
    conditionEn: 'Clear & Pleasant',
    iconType: 'sun',
  },
  الخبر: {
    lat: 26.2172,
    lng: 50.1971,
    defaultTempC: 27,
    defaultMaxC: 29,
    defaultMinC: 21,
    tomorrowMaxC: 28,
    tomorrowMinC: 20,
    humidity: 52,
    wind: 16,
    conditionAr: 'معتدل على الواجهة',
    conditionEn: 'Pleasant Coastal Sky',
    iconType: 'cloud-sun',
  },
};

function decodeWmoWeatherCode(code: number): {
  conditionAr: string;
  conditionEn: string;
  iconType: 'sun' | 'cloud-sun' | 'breeze' | 'rain';
} {
  if (code === 0 || code === 1) {
    return { conditionAr: 'مشمس وصافي', conditionEn: 'Sunny & Clear', iconType: 'sun' };
  }
  if (code === 2 || code === 3) {
    return { conditionAr: 'غائم جزئيًا ولطيف', conditionEn: 'Partly Cloudy & Pleasant', iconType: 'cloud-sun' };
  }
  if (code >= 51 && code <= 67) {
    return { conditionAr: 'زخات مطر خفيفة', conditionEn: 'Light Rain Showers', iconType: 'rain' };
  }
  return { conditionAr: 'أجواء معتدلة ومنعشة', conditionEn: 'Mild & Breezy', iconType: 'breeze' };
}

function getFamilyTipForTemp(tempC: number): { ar: string; en: string } {
  if (tempC >= 31) {
    return {
      ar: 'نصيحة اليوم: ملابس قطنية خفيفة وترطيب مستمر للطفل',
      en: 'Family Tip: Light cotton wear & frequent hydration for kids',
    };
  }
  if (tempC <= 20) {
    return {
      ar: 'نصيحة اليوم: جاكيت خفيف مناسب عند الخروج مساءً',
      en: 'Family Tip: Pack a light layer for evening family outings',
    };
  }
  return {
    ar: 'الطقس مثالي لنزهة الأطفال والأنشطة الخارجية اليوم',
    en: 'Ideal weather for outdoor park play & family strolls today',
  };
}

export interface LiveWeatherWidgetProps {
  city: string;
  country: CountryCode;
  language: LanguageCode;
  darkMode?: boolean;
  userCoords?: { lat: number; lng: number } | null;
}

export const LiveWeatherWidget: React.FC<LiveWeatherWidgetProps> = ({
  city,
  country,
  language,
  userCoords,
}) => {
  const isEn = language === 'en';
  const normalizedCity = city || (country === 'SA' ? 'الرياض' : 'القاهرة');
  const preset =
    CITY_WEATHER_PRESETS[normalizedCity] ||
    (country === 'SA' ? CITY_WEATHER_PRESETS['الرياض'] : CITY_WEATHER_PRESETS['القاهرة']);

  const buildCalibratedSnapshot = useCallback((): LiveWeatherSnapshot => {
    const tip = getFamilyTipForTemp(preset.defaultTempC);
    const cityEn = locText(normalizedCity, 'en');
    return {
      cityAr: normalizedCity,
      cityEn,
      tempC: preset.defaultTempC,
      feelsLikeC: preset.defaultTempC,
      humidityPct: preset.humidity,
      windKmh: preset.wind,
      conditionAr: preset.conditionAr,
      conditionEn: preset.conditionEn,
      familyTipAr: tip.ar,
      familyTipEn: tip.en,
      iconType: preset.iconType,
      today: {
        labelAr: 'اليوم',
        labelEn: 'Today',
        tempMaxC: preset.defaultMaxC,
        tempMinC: preset.defaultMinC,
        conditionAr: preset.conditionAr,
        conditionEn: preset.conditionEn,
        iconType: preset.iconType,
      },
      tomorrow: {
        labelAr: 'غدًا',
        labelEn: 'Tomorrow',
        tempMaxC: preset.tomorrowMaxC,
        tempMinC: preset.tomorrowMinC,
        conditionAr: 'معتدل وصافي',
        conditionEn: 'Mild & Clear',
        iconType: 'cloud-sun',
      },
      updatedAt: isEn ? 'Just now' : 'الآن',
      source: 'calibrated',
    };
  }, [normalizedCity, preset, isEn]);

  const [weather, setWeather] = useState<LiveWeatherSnapshot>(buildCalibratedSnapshot);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLiveWeather = useCallback(async () => {
    setIsRefreshing(true);
    const lat = userCoords?.lat ?? preset.lat;
    const lng = userCoords?.lng ?? preset.lng;
    const baseSnapshot = buildCalibratedSnapshot();

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;
      const response = await fetch(url);
      if (!response.ok) {
        setWeather(baseSnapshot);
        return;
      }
      const data = await response.json();
      const currentTemp = Math.round(data?.current?.temperature_2m ?? preset.defaultTempC);
      const currentHumidity = Math.round(data?.current?.relative_humidity_2m ?? preset.humidity);
      const currentWind = Math.round(data?.current?.wind_speed_10m ?? preset.wind);
      const currentDecoded = decodeWmoWeatherCode(Number(data?.current?.weather_code ?? 0));

      const todayMax = Math.round(data?.daily?.temperature_2m_max?.[0] ?? preset.defaultMaxC);
      const todayMin = Math.round(data?.daily?.temperature_2m_min?.[0] ?? preset.defaultMinC);
      const todayDecoded = decodeWmoWeatherCode(Number(data?.daily?.weather_code?.[0] ?? 0));

      const tomMax = Math.round(data?.daily?.temperature_2m_max?.[1] ?? preset.tomorrowMaxC);
      const tomMin = Math.round(data?.daily?.temperature_2m_min?.[1] ?? preset.tomorrowMinC);
      const tomDecoded = decodeWmoWeatherCode(Number(data?.daily?.weather_code?.[1] ?? 1));

      const tip = getFamilyTipForTemp(currentTemp);

      setWeather({
        ...baseSnapshot,
        tempC: currentTemp,
        feelsLikeC: currentTemp,
        humidityPct: currentHumidity,
        windKmh: currentWind,
        conditionAr: currentDecoded.conditionAr,
        conditionEn: currentDecoded.conditionEn,
        familyTipAr: tip.ar,
        familyTipEn: tip.en,
        iconType: currentDecoded.iconType,
        today: {
          labelAr: 'اليوم',
          labelEn: 'Today',
          tempMaxC: todayMax,
          tempMinC: todayMin,
          conditionAr: todayDecoded.conditionAr,
          conditionEn: todayDecoded.conditionEn,
          iconType: todayDecoded.iconType,
        },
        tomorrow: {
          labelAr: 'غدًا',
          labelEn: 'Tomorrow',
          tempMaxC: tomMax,
          tempMinC: tomMin,
          conditionAr: tomDecoded.conditionAr,
          conditionEn: tomDecoded.conditionEn,
          iconType: tomDecoded.iconType,
        },
        updatedAt: isEn ? 'Live Feed' : 'بث حي',
        source: 'live-api',
      });
    } catch {
      setWeather(baseSnapshot);
    } finally {
      setIsRefreshing(false);
    }
  }, [userCoords, preset, buildCalibratedSnapshot, isEn]);

  useEffect(() => {
    setWeather(buildCalibratedSnapshot());
    fetchLiveWeather();
  }, [buildCalibratedSnapshot, fetchLiveWeather]);

  const renderWeatherSvg = (type: 'sun' | 'cloud-sun' | 'breeze' | 'rain', sizeClass = 'w-6 h-6') => {
    if (type === 'sun') {
      return (
        <svg className={`${sizeClass} text-amber-500 dark:text-amber-300 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" fillOpacity="0.25" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
        </svg>
      );
    }
    if (type === 'rain') {
      return (
        <svg className={`${sizeClass} text-sky-500 dark:text-sky-300 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" fillOpacity="0.18" />
          <path strokeLinecap="round" d="M10 21v1m4-1v1" />
        </svg>
      );
    }
    return (
      <svg className={`${sizeClass} text-[#0d9488] dark:text-teal-300 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="9" r="3.5" className="text-amber-500 dark:text-amber-300" fill="currentColor" fillOpacity="0.3" />
        <path d="M17.5 19H9a5 5 0 1 1 4.9-6h3.6a3.5 3.5 0 1 1 0 7Z" fill="currentColor" fillOpacity="0.2" />
      </svg>
    );
  };

  return (
    <div
      id="home-live-weather-widget"
      data-testid="home-live-weather-widget"
      className="rounded-2xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-surface)] dark:bg-[#101D26] px-4 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-all"
    >
      {/* Left / Right Primary Current Weather Cluster */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-amber-50/90 dark:bg-[#142430] border border-amber-200/60 dark:border-[#1E3646] flex items-center justify-center shrink-0">
          {renderWeatherSvg(weather.iconType, 'w-6 h-6')}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg sm:text-xl font-black text-[var(--color-text)] tabular-nums leading-none">
              {weather.tempC}°C
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[var(--color-text)] truncate">
              {isEn ? weather.conditionEn : weather.conditionAr}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border border-teal-200/60 dark:border-teal-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isEn ? weather.cityEn : weather.cityAr}</span>
            </span>
          </div>
          <p className="text-[11px] font-semibold text-[var(--color-muted)] mt-0.5 truncate">
            {isEn ? weather.familyTipEn : weather.familyTipAr}
          </p>
        </div>
      </div>

      {/* Right / Left Mini Forecast Strip (Today & Tomorrow + Refresh) */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Today Mini Pill */}
        <div className="px-2.5 py-1.5 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] flex items-center gap-2 text-xs">
          {renderWeatherSvg(weather.today.iconType, 'w-4 h-4')}
          <div className="leading-tight">
            <div className="text-[10px] font-bold text-[var(--color-muted)]">
              {isEn ? weather.today.labelEn : weather.today.labelAr}
            </div>
            <div className="text-[11px] font-extrabold text-[var(--color-text)] tabular-nums">
              {weather.today.tempMaxC}° / <span className="text-[var(--color-muted)]">{weather.today.tempMinC}°</span>
            </div>
          </div>
        </div>

        {/* Tomorrow Mini Pill */}
        <div className="px-2.5 py-1.5 rounded-xl bg-[var(--color-control-muted)] dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] flex items-center gap-2 text-xs">
          {renderWeatherSvg(weather.tomorrow.iconType, 'w-4 h-4')}
          <div className="leading-tight">
            <div className="text-[10px] font-bold text-[var(--color-muted)]">
              {isEn ? weather.tomorrow.labelEn : weather.tomorrow.labelAr}
            </div>
            <div className="text-[11px] font-extrabold text-[var(--color-text)] tabular-nums">
              {weather.tomorrow.tempMaxC}° / <span className="text-[var(--color-muted)]">{weather.tomorrow.tempMinC}°</span>
            </div>
          </div>
        </div>

        {/* Humidity & Wind Metadata + Refresh */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-[var(--color-muted)] px-1 tabular-nums">
          <span title={isEn ? 'Humidity' : 'الرطوبة'}>💧 {weather.humidityPct}%</span>
          <span aria-hidden="true">·</span>
          <span title={isEn ? 'Wind Speed' : 'الرياح'}>🌬️ {weather.windKmh} km/h</span>
        </div>

        <button
          type="button"
          onClick={fetchLiveWeather}
          disabled={isRefreshing}
          title={isEn ? 'Refresh Weather' : 'تحديث الطقس'}
          aria-label={isEn ? 'Refresh Weather' : 'تحديث الطقس'}
          className="w-8 h-8 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-[var(--color-control-bg)] dark:bg-[#142430] text-[var(--color-text)] hover:border-[var(--color-accent)] flex items-center justify-center transition-all active:scale-95"
        >
          <svg
            className={`w-3.5 h-3.5 fill-none stroke-current stroke-2 ${isRefreshing ? 'animate-spin text-[#0d9488]' : ''}`}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
          </svg>
        </button>
      </div>
    </div>
  );
};
