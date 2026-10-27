import {
  COUNTRY_CITIES_MAP,
  CountryCode,
  CurrencyCode,
  DEFAULT_SEED,
  FamilySpaceState,
  STORAGE_KEY,
  findNearestCityByCoords,
  getSuggestedCurrencyForCountry,
  normalizeAppData,
} from '../domain/familySpaceCore';

export function loadPersistedFamilyState(): FamilySpaceState {
  try {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Auto-migrate legacy default seed (Ezz & Nour / Sara) to Ahmad & Maryam + Hamza (6m), Laila (4y), Youssef (8y)
        const hasLegacyDefaultKids =
          Array.isArray(parsed.kids) &&
          parsed.kids.length === 2 &&
          parsed.kids[0]?.name === 'عز' &&
          parsed.kids[1]?.name === 'نور';
        if (hasLegacyDefaultKids) {
          const migrated = {
            ...structuredClone(DEFAULT_SEED),
            language: parsed.language === 'en' ? 'en' : 'ar',
            darkMode: Boolean(parsed.darkMode),
            country: parsed.country === 'SA' ? 'SA' : 'EG',
            currency: parsed.currency === 'SAR' ? 'SAR' : 'EGP',
          };
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          return normalizeAppData(migrated);
        }
        return normalizeAppData({ ...structuredClone(DEFAULT_SEED), ...parsed });
      }
    }
  } catch {
    // Fallback to normalized default seed
  }
  return normalizeAppData(DEFAULT_SEED);
}

export const loadFamilySpaceState = loadPersistedFamilyState;

export function savePersistedFamilyState(
  state: FamilySpaceState,
  onError?: () => void
): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    onError?.();
  }
}

export function saveFamilySpaceState(state: FamilySpaceState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function exportFamilySpaceJsonBackup(state: FamilySpaceState, todayISO: string): boolean {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-space-backup-${todayISO}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch {
    return false;
  }
}

export function resetFamilySpaceState(): FamilySpaceState {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
  return normalizeAppData(DEFAULT_SEED);
}

export interface DetectedGeoLocation {
  country: CountryCode;
  cityId: string;
  cityNameAr: string;
  cityNameEn: string;
  currency: CurrencyCode;
  distanceKm: number;
  coords: { lat: number; lng: number };
  fromGps: boolean;
}

export function requestCurrentCityGeolocation(
  currentCountry: CountryCode,
  currentCity: string,
  onDetected: (result: DetectedGeoLocation) => void
): void {
  const applyCoords = (lat: number, lng: number, fromGps: boolean) => {
    const nearest = findNearestCityByCoords(lat, lng);
    const currency = getSuggestedCurrencyForCountry(nearest.country);
    onDetected({
      country: nearest.country,
      cityId: nearest.city.id,
      cityNameAr: nearest.city.nameAr,
      cityNameEn: nearest.city.nameEn,
      currency,
      distanceKm: nearest.distanceKm,
      coords: { lat, lng },
      fromGps,
    });
  };

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoords(pos.coords.latitude, pos.coords.longitude, true);
      },
      () => {
        const cityList = COUNTRY_CITIES_MAP[currentCountry];
        const fallbackCity = cityList.find((c) => c.id === currentCity) || cityList[0];
        applyCoords(fallbackCity.lat, fallbackCity.lng, false);
      },
      { enableHighAccuracy: false, timeout: 4500, maximumAge: 60000 }
    );
  } else {
    const cityList = COUNTRY_CITIES_MAP[currentCountry];
    const fallbackCity = cityList.find((c) => c.id === currentCity) || cityList[0];
    applyCoords(fallbackCity.lat, fallbackCity.lng, false);
  }
}
