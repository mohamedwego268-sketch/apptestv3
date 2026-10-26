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
  baseTemp: number,
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
      forecastDays: buildCalibratedFiveDayForecast(tempC, highC, lowC, weatherCode, rainProb),
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
  const bgSpec = getCardBackgroundSpec('weather', darkMode);

  const quickCities = useMemo(
    () => (country === 'SA' ? COUNTRY_CITIES_MAP.SA.slice(0, 8) : COUNTRY_CITIES_MAP.EG.slice(0, 8)),
    [country]
  );

  return (
    <section
      id="live-weather-widget"
      data-testid="live-weather-widget"
      data-image-card="true"
      aria-label={isEn ? 'Live Family Weather Forecast' : 'حالة الطقس المباشرة للأسرة'}
      className="image-bg-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 transition-all duration-300 ease-in-out"
      style={{
        backgroundImage: bgSpec.backgroundImageCss,
      }}
    >
      <div className="image-card-glass-panel rounded-2xl p-3.5 sm:p-4 space-y-2">
        {/* Top Row: Current City Temperature + Condition + Interactive Quick City Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-2xs transition-transform duration-300 hover:scale-105"
              style={{
                backgroundColor: darkMode ? '#142430' : '#FFFFFF',
                borderColor: darkMode ? '#1E3646' : '#BAE6FD',
              }}
            >
              {visual.icon}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
                <span className="image-card-badge px-2 py-0.5 rounded-full text-[9px] font-extrabold inline-flex items-center gap-1 shrink-0">
                  <span>📍</span>
                  <span>{displayCityName}</span>
                </span>
                <UnifiedBadge tone="sky">
                  {selectedDayIdx === 0
                    ? isEn
                      ? 'Live Now'
                      : 'مباشر الآن'
                    : isEn
                    ? activeDay?.labelEn
                    : activeDay?.labelAr}
                </UnifiedBadge>
                <button
                  type="button"
                  onClick={() => fetchLiveWeather()}
                  title={isEn ? 'Refresh live weather' : 'تحديث الطقس المباشر'}
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-white/80 dark:bg-[#142430] border border-[var(--color-border)] dark:border-[#1E3646] text-[var(--color-text)] dark:text-[#A5F3FC] hover:border-[#FF8C61] transition-all shrink-0 cursor-pointer"
                >
                  {isRefreshing ? '⏳' : '🔄'}
                </button>
              </div>

              <div className="flex items-baseline gap-1.5 mt-0.5 overflow-x-auto whitespace-nowrap no-scrollbar">
                <span className="image-card-title text-lg sm:text-xl font-black tabular-nums tracking-tight shrink-0">
                  {displayTemp}°C
                </span>
                <span className="text-[11px] font-extrabold text-[#0D9488] dark:text-[#2DD4BF] shrink-0">
                  {visual.label}
                </span>
                <span className="text-[10px] font-bold text-[var(--color-muted)] dark:text-[#CBD5E1] tabular-nums shrink-0">
                  {isEn
                    ? `H: ${activeDay?.maxTempC ?? weather.highTempC}° · L: ${activeDay?.minTempC ?? weather.lowTempC}°`
                    : `العظمى ${activeDay?.maxTempC ?? weather.highTempC}° · الصغرى ${activeDay?.minTempC ?? weather.lowTempC}°`}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Metrics Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar">
            <div className="px-2 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white/85 dark:bg-[#142430] text-[9.5px] font-extrabold flex items-center gap-1 shrink-0">
              <span>💧</span>
              <span className="text-[var(--color-muted)]">{isEn ? 'Humidity' : 'الرطوبة'}:</span>
              <span className="tabular-nums text-[var(--color-text)] dark:text-[#F8FAFC]">{weather.humidity}%</span>
            </div>
            <div className="px-2 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white/85 dark:bg-[#142430] text-[9.5px] font-extrabold flex items-center gap-1 shrink-0">
              <span>🌬️</span>
              <span className="text-[var(--color-muted)]">{isEn ? 'Wind' : 'الرياح'}:</span>
              <span className="tabular-nums text-[var(--color-text)] dark:text-[#F8FAFC]">
                {weather.windKmh} {isEn ? 'km/h' : 'كم/س'}
              </span>
            </div>
            <div className="px-2 py-1 rounded-xl border border-[var(--color-border)] dark:border-[#1E3646] bg-white/85 dark:bg-[#142430] text-[9.5px] font-extrabold flex items-center gap-1 shrink-0">
              <span>☔</span>
              <span className="tabular-nums text-[var(--color-text)] dark:text-[#F8FAFC]">
                {activeDay?.rainProb ?? weather.rainProbability}%
              </span>
            </div>
          </div>
        </div>

        {/* Interactive 5-Day Multi-Day Forecast Carousel Strip */}
        <div
          role="region"
          aria-label={isEn ? '5-Day Interactive Weather Forecast' : 'توقعات الطقس التفاعلية لـ ٥ أيام'}
          className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap no-scrollbar pb-0.5"
        >
          {weather.forecastDays.map((day, idx) => {
            const isSelected = selectedDayIdx === idx;
            const dayVisual = getWeatherVisualSpec(day.weatherCode, isEn);
            return (
              <button
                key={day.dateISO || idx}
                type="button"
                data-testid={`weather-forecast-day-${idx}`}
                onClick={() => setSelectedDayIdx(idx)}
                className={`px-2.5 py-1 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-2xs scale-[1.01]'
                    : 'bg-white/80 dark:bg-[#142430] text-[var(--color-text)] dark:text-[#F8FAFC] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#0d9488]'
                }`}
              >
                <span>{dayVisual.icon}</span>
                <span>{isEn ? day.labelEn : day.labelAr}</span>
                <span className="tabular-nums font-black">{day.maxTempC}°</span>
                <span className="opacity-75 tabular-nums text-[9px]">{day.minTempC}°</span>
              </button>
            );
          })}

          {/* Quick City Switcher Pills in the same horizontal strip if onSelectCity is provided */}
          {onSelectCity &&
            quickCities.map((cObj) => {
              const isCurrentCity = cObj.id === baseline.id || cObj.nameAr === baseline.nameAr;
              return (
                <button
                  key={cObj.id}
                  type="button"
                  onClick={() => onSelectCity(country, cObj.id)}
                  className={`px-2.5 py-1 rounded-xl border text-[9.5px] font-extrabold transition-all shrink-0 cursor-pointer ${
                    isCurrentCity
                      ? 'bg-[#FF8C61] text-white border-[#FF8C61] shadow-2xs'
                      : 'bg-white/65 dark:bg-[#101D26] text-[var(--color-muted)] dark:text-[#CBD5E1] border-[var(--color-border)] dark:border-[#1E3646] hover:border-[#FF8C61]'
                  }`}
                >
                  📍 {isEn ? cObj.nameEn : cObj.nameAr}
                </button>
              );
            })}
        </div>

        {/* Compact Parenting Tip Banner */}
        <div
          className="rounded-xl px-2.5 py-1.5 border flex items-center justify-between gap-2 text-[10px] font-bold"
          style={{
            backgroundColor: darkMode ? '#142430' : 'rgba(240, 253, 250, 0.92)',
            borderColor: darkMode ? '#1E3646' : '#99F6E4',
            color: darkMode ? '#F8FAFC' : '#134E4A',
          }}
        >
          <p className="leading-snug truncate">
            <span className="font-extrabold">💡 {isEn ? 'Family Tip:' : 'نصيحة اليوم:'} </span>
            {visual.parentingTip}
          </p>
        </div>
      </div>
    </section>
  );
};
