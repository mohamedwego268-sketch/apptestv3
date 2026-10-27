import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  COUNTRY_CITIES_MAP,
  CountryCode,
  LanguageCode,
} from '../domain/familySpaceCore';
import { getCardBackgroundSpec } from '../domain/cardBackgrounds';
import { UnifiedBadge } from './DesignSystem';

export interface LiveWeatherWidgetProps {
  country: CountryCode;
  city: string;
  language: LanguageCode;
  darkMode?: boolean;
  userCoords?: { lat: number; lng: number } | null;
  onSelectCity?: (country: CountryCode, city: string) => void;
}

interface DayForecastItem {
  dayIndex: number;
  dateISO: string;
  labelAr: string;
  labelEn: string;
  maxTempC: number;
  minTempC: number;
  weatherCode: number;
  rainProb: number;
}

interface WeatherSnapshot {
  temperatureC: number;
  feelsLikeC: number;
  humidity: number;
  windKmh: number;
  weatherCode: number;
  highTempC: number;
  lowTempC: number;
  rainProbability: number;
  forecastDays: DayForecastItem[];
  source: 'live-api' | 'calibrated';
  updatedAt: string;
}

const WEEKDAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function buildCalibratedFiveDayForecast(
  highTemp: number,
  lowTemp: number,
  baseCode: number,
  baseRain: number
): DayForecastItem[] {
  const now = new Date();
  const offsets = [
    { dMax: 0, dMin: 0, code: baseCode, rain: baseRain },
    { dMax: 1, dMin: 0, code: baseCode === 0 ? 1 : baseCode, rain: Math.min(80, baseRain + 4) },
    { dMax: -1, dMin: -1, code: baseCode <= 1 ? 0 : baseCode, rain: Math.max(0, baseRain - 2) },
    { dMax: 2, dMin: 1, code: 0, rain: Math.max(0, baseRain - 3) },
    { dMax: 0, dMin: -1, code: 1, rain: baseRain },
  ];

  return offsets.map((off, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() + idx);
    const dateISO = d.toISOString().slice(0, 10);
    const dayOfWeek = d.getDay();
    const labelAr =
      idx === 0 ? 'اليوم' : idx === 1 ? 'غدًا' : WEEKDAYS_AR[dayOfWeek];
    const labelEn =
      idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : WEEKDAYS_EN[dayOfWeek];

    return {
      dayIndex: idx,
      dateISO,
      labelAr,
      labelEn,
      maxTempC: Math.round(highTemp + off.dMax),
      minTempC: Math.round(lowTemp + off.dMin),
      weatherCode: off.code,
      rainProb: off.rain,
    };
  });
}

function resolveCityWeatherBaseline(country: CountryCode, cityName: string) {
  const allCities = [...COUNTRY_CITIES_MAP.EG, ...COUNTRY_CITIES_MAP.SA];
  const matched =
    allCities.find(
      (c) =>
        c.id === cityName ||
        c.nameAr === cityName ||
        c.nameEn.toLowerCase() === cityName.toLowerCase()
    ) || (country === 'SA' ? COUNTRY_CITIES_MAP.SA[0] : COUNTRY_CITIES_MAP.EG[0]);

  const lat = matched.lat;
  const lng = matched.lng;

  // Calibrate realistic temperature by latitude & coastal/mountain geography
  const isMountainSA = ['أبها', 'الباحة', 'الطائف', 'عسير'].includes(matched.id);
  const isCoastalEG = ['الإسكندرية', 'مطروح', 'بورسعيد', 'دمياط'].includes(matched.id);
  const isUpperEG = ['أسوان', 'الأقصر', 'قنا', 'سوهاج', 'أسيوط', 'الوادي الجديد', 'البحر الأحمر'].includes(
    matched.id
  );

  let tempC = country === 'SA' ? 33 : 27;
  let humidity = country === 'SA' ? 24 : 46;
  let wind = 14;
  let weatherCode = 0;
  let rainProb = 4;

  if (isMountainSA) {
    tempC = 22;
    humidity = 52;
    weatherCode = 2;
    rainProb = 25;
  } else if (isCoastalEG) {
    tempC = 24;
    humidity = 66;
    wind = 21;
    weatherCode = 1;
    rainProb = 18;
  } else if (isUpperEG) {
    tempC = 32;
    humidity = 25;
    wind = 12;
    weatherCode = 0;
    rainProb = 0;
  } else if (matched.id === 'الدمام' || matched.id === 'الخبر' || matched.id === 'جدة') {
    tempC = 31;
    humidity = 58;
    wind = 16;
    weatherCode = 1;
    rainProb = 5;
  }

  const highC = tempC + 3;
  const lowC = tempC - 7;

  return {
    id: matched.id,
    nameAr: matched.nameAr,
    nameEn: matched.nameEn,
    lat,
    lng,
    snapshot: {
      temperatureC: tempC,
      feelsLikeC: tempC + (humidity > 55 ? 2 : 1),
      humidity,
      windKmh: wind,
      weatherCode,
      highTempC: highC,
      lowTempC: lowC,
      rainProbability: rainProb,
      forecastDays: buildCalibratedFiveDayForecast(highC, lowC, weatherCode, rainProb),
      source: 'calibrated' as const,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  };
}

function getWeatherVisualSpec(code: number, isEn: boolean) {
  if (code === 0) {
    return {
      icon: '☀️',
      label: isEn ? 'Sunny & Clear' : 'مشمس وصافٍ',
      parentingTip: isEn
        ? 'Great outdoor weather! Pack water bottles and light breathable cotton clothes for the kids.'
        : 'جو مثالي لفسحة الأولاد! جهّز زجاجات المياه وملابس قطنية خفيفة ومريحة.',
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      icon: '⛅',
      label: isEn ? 'Partly Cloudy & Mild' : 'غائم جزئيًا ولطيف',
      parentingTip: isEn
        ? 'Pleasant breeze today — ideal for park activities or afternoon sports practice.'
        : 'نسمة هواء لطيفة اليوم — وقت ممتاز للحديقة أو تمرين النادي بعد العصر.',
    };
  }
  if (code >= 45 && code <= 48) {
    return {
      icon: '🌫️',
      label: isEn ? 'Misty / Dusty' : 'شبورة أو عوالق خفيفة',
      parentingTip: isEn
        ? 'Keep sensitive or asthmatic children indoors during early morning hours.'
        : 'يفضل تقليل تعرض الأطفال ذوي الحساسية للهواء المفتوح في الصباح الباكر.',
    };
  }
  if (code >= 51 && code <= 67) {
    return {
      icon: '🌧️',
      label: isEn ? 'Light Rain Showers' : 'زخات مطر خفيفة',
      parentingTip: isEn
        ? 'Pack a light waterproof jacket for school or nursery today.'
        : 'جهّز جاكيت خفيف مقاوم للمطر في حقيبة المدرسة أو الحضانة اليوم.',
    };
  }
  return {
    icon: '🌤️',
    label: isEn ? 'Pleasant Family Weather' : 'طقس عائلي معتدل',
    parentingTip: isEn
      ? 'Balanced temperature for school, nursery, and family errands.'
      : 'درجة حرارة متوازنة ومناسبة للمدرسة والحضانة ومشاوير العيلة.',
  };
}

export const LiveWeatherWidget: React.FC<LiveWeatherWidgetProps> = ({
  country,
  city,
  language,
  darkMode = false,
  userCoords,
  onSelectCity,
}) => {
  const isEn = language === 'en';

  const baseline = useMemo(
    () => resolveCityWeatherBaseline(country, city),
    [country, city]
  );

  const [weather, setWeather] = useState<WeatherSnapshot>(() => baseline.snapshot);
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchLiveWeather = useCallback(
    async (signal?: AbortSignal) => {
      const targetLat = userCoords?.lat ?? baseline.lat;
      const targetLng = userCoords?.lng ?? baseline.lng;

      // Immediately update calibrated baseline so city switch has zero delay
      setWeather(baseline.snapshot);
      setSelectedDayIdx(0);
      setIsRefreshing(true);

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;
        const res = await fetch(url, { signal });
        if (!res.ok) {
          setIsRefreshing(false);
          return;
        }
        const data = await res.json();
        if (data?.current) {
          const temp = Math.round(Number(data.current.temperature_2m ?? baseline.snapshot.temperatureC));
          const feels = Math.round(
            Number(data.current.apparent_temperature ?? baseline.snapshot.feelsLikeC)
          );
          const hum = Math.round(
            Number(data.current.relative_humidity_2m ?? baseline.snapshot.humidity)
          );
          const wind = Math.round(
            Number(data.current.wind_speed_10m ?? baseline.snapshot.windKmh)
          );
          const code = Number(data.current.weather_code ?? baseline.snapshot.weatherCode);

          const dailyTimes: string[] = Array.isArray(data?.daily?.time) ? data.daily.time : [];
          const dailyMax: number[] = Array.isArray(data?.daily?.temperature_2m_max)
            ? data.daily.temperature_2m_max
            : [];
          const dailyMin: number[] = Array.isArray(data?.daily?.temperature_2m_min)
            ? data.daily.temperature_2m_min
            : [];
          const dailyCode: number[] = Array.isArray(data?.daily?.weather_code)
            ? data.daily.weather_code
            : [];
          const dailyRain: number[] = Array.isArray(data?.daily?.precipitation_probability_max)
            ? data.daily.precipitation_probability_max
            : [];

          const parsedDays: DayForecastItem[] =
            dailyTimes.length > 0
              ? dailyTimes.slice(0, 5).map((dateStr, idx) => {
                  const dObj = new Date(`${dateStr}T12:00:00`);
                  const dow = Number.isNaN(dObj.getTime()) ? idx % 7 : dObj.getDay();
                  return {
                    dayIndex: idx,
                    dateISO: dateStr,
                    labelAr: idx === 0 ? 'اليوم' : idx === 1 ? 'غدًا' : WEEKDAYS_AR[dow],
                    labelEn: idx === 0 ? 'Today' : idx === 1 ? 'Tomorrow' : WEEKDAYS_EN[dow],
                    maxTempC: Math.round(Number(dailyMax[idx] ?? temp + 3)),
                    minTempC: Math.round(Number(dailyMin[idx] ?? temp - 6)),
                    weatherCode: Number(dailyCode[idx] ?? code),
                    rainProb: Math.round(Number(dailyRain[idx] ?? 0)),
                  };
                })
              : baseline.snapshot.forecastDays;

          setWeather({
            temperatureC: temp,
            feelsLikeC: feels,
            humidity: hum,
            windKmh: wind,
            weatherCode: code,
            highTempC: parsedDays[0]?.maxTempC ?? temp + 3,
            lowTempC: parsedDays[0]?.minTempC ?? temp - 6,
            rainProbability: parsedDays[0]?.rainProb ?? 0,
            forecastDays: parsedDays,
            source: 'live-api',
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      } catch {
        // Fallback remains calibrated city weather
      } finally {
        setIsRefreshing(false);
      }
    },
    [baseline, userCoords?.lat, userCoords?.lng]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchLiveWeather(controller.signal);
    return () => controller.abort();
  }, [fetchLiveWeather]);

  const activeDay = weather.forecastDays[selectedDayIdx] || weather.forecastDays[0];
  const displayTemp =
    selectedDayIdx === 0 ? weather.temperatureC : activeDay?.maxTempC ?? weather.temperatureC;
  const activeCode =
    selectedDayIdx === 0 ? weather.weatherCode : activeDay?.weatherCode ?? weather.weatherCode;
  const visual = getWeatherVisualSpec(activeCode, isEn);
  const displayCityName = isEn ? baseline.nameEn : baseline.nameAr;

  const quickCities = useMemo(
    () => (country === 'SA' ? COUNTRY_CITIES_MAP.SA.slice(0, 8) : COUNTRY_CITIES_MAP.EG.slice(0, 8)),
    [country]
  );

  return (
    <section
      id="live-weather-widget"
      data-testid="live-weather-widget"
      aria-label={isEn ? 'Live Family Weather Ribbon' : 'شريط حالة الطقس اليومي للأسرة'}
      className={`rounded-2xl border px-3.5 py-2 transition-all duration-500 ${
        darkMode
          ? 'bg-[#142430]/75 border-[#1E3646] text-[#F8FAFC]'
          : 'bg-teal-50/45 border-teal-200/60 text-[#0B131A]'
      }`}
    >
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5">
        {/* Left: Delicate Weather Icon + Subtle Temperature + Condition + Inline City Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 border bg-white/90 dark:bg-[#101D26] border-teal-200/50 dark:border-[#1E3646] shadow-2xs"
            aria-hidden="true"
          >
            {visual.icon}
          </span>

          <div className="flex items-baseline gap-1.5">
            <span className="text-sm sm:text-base font-black tabular-nums tracking-tight text-[var(--color-text)] dark:text-[#F8FAFC]">
              {displayTemp}°C
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
              {visual.label}
            </span>
          </div>

          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
            ·
          </span>

          {/* Compact City Selector or Pill */}
          {onSelectCity ? (
            <label className="inline-flex items-center gap-1 text-xs font-extrabold text-[var(--color-text)] dark:text-[#A5F3FC]">
              <span aria-hidden="true">📍</span>
              <select
                aria-label={isEn ? 'Select City' : 'اختر المدينة'}
                value={baseline.id}
                onChange={(e) => onSelectCity(country, e.target.value)}
                className="bg-transparent font-extrabold text-xs text-[var(--color-text)] dark:text-[#A5F3FC] focus:outline-none cursor-pointer pr-1"
              >
                {quickCities.map((cObj) => (
                  <option key={cObj.id} value={cObj.id} className="text-slate-900 bg-white">
                    {isEn ? cObj.nameEn : cObj.nameAr}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-xs font-extrabold text-[var(--color-muted)] dark:text-[#CBD5E1]">
              📍 {displayCityName}
            </span>
          )}
        </div>

        {/* Right: Warm Daily Tip Inline + Subtle Refresh Trigger */}
        <div className="flex items-center justify-between sm:justify-end gap-2 min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-semibold text-[var(--color-muted)] dark:text-[#CBD5E1] leading-snug truncate">
            <span className="font-extrabold text-[#0d9488] dark:text-[#2DD4BF]">
              💡 {isEn ? 'Daily Tip:' : 'همسة الطقس:'}{' '}
            </span>
            {visual.parentingTip}
          </p>

          <button
            type="button"
            onClick={() => fetchLiveWeather()}
            title={isEn ? 'Refresh weather' : 'تحديث الطقس'}
            aria-label={isEn ? 'Refresh weather' : 'تحديث الطقس'}
            className="w-7 h-7 rounded-lg border border-[var(--color-border)] dark:border-[#1E3646] bg-white/75 dark:bg-[#101D26] text-[11px] flex items-center justify-center shrink-0 hover:border-[#0d9488] cursor-pointer"
          >
            {isRefreshing ? '⏳' : '🔄'}
          </button>
        </div>
      </div>
    </section>
  );
};
