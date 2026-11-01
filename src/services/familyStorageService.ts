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
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim()) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Support wrapped backup/session format (`{ appState: { ... } }`) as well as direct state objects
          const candidate =
            parsed.appState &&
            typeof parsed.appState === 'object' &&
            !Array.isArray(parsed.appState)
              ? (parsed.appState as Record<string, unknown>)
              : (parsed as Record<string, unknown>);
          return normalizeAppData(candidate);
        }
      }
    }
  } catch {
    // Do not overwrite or delete localStorage on parse failure; fall back in memory only
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


const FAMILY_STORAGE_PREFIX = `${STORAGE_KEY}:family:`;
const FAMILY_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getFamilySpaceStorageKey(familyId: string): string | null {
  const cleanId = typeof familyId === 'string' ? familyId.trim() : '';
  return FAMILY_UUID_PATTERN.test(cleanId)
    ? `${FAMILY_STORAGE_PREFIX}${cleanId.toLowerCase()}`
    : null;
}

/** Start with no previous family's private data. */
export function createEmptyFamilySpaceState(): FamilySpaceState {
  const base = normalizeAppData(DEFAULT_SEED);
  return normalizeAppData({
    ...base,
    parentName: '',
    savedMediaIds: [],
    events: [],
    kids: [],
    tasks: [],
    wishes: [],
    family: [],
    invitations: [],
    readNotificationIds: [],
    cart: [],
    recentlyViewedProductIds: [],
    orders: [],
    parentAccounts: {
      mother: { ...base.parentAccounts.mother, fullName: '', email: '', phoneNumber: '', phoneVerified: false, emailVerified: false, onboardingCompleted: false, personalNotes: '' },
      father: { ...base.parentAccounts.father, fullName: '', email: '', phoneNumber: '', phoneVerified: false, emailVerified: false, onboardingCompleted: false, personalNotes: '' },
    },
    shippingAddress: { ...base.shippingAddress, recipientName: '', city: '', district: '', streetDetails: '', phone: '' },
    verifiedFamilyId: null,
  });
}

export function loadFamilySpaceStateForFamily(familyId: string): FamilySpaceState {
  const key = getFamilySpaceStorageKey(familyId);
  if (!key || typeof window === 'undefined' || !window.localStorage) return createEmptyFamilySpaceState();
  try {
    const saved = window.localStorage.getItem(key);
    if (saved && saved.trim()) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const candidate = parsed.appState && typeof parsed.appState === 'object' && !Array.isArray(parsed.appState)
          ? parsed.appState as Record<string, unknown>
          : parsed as Record<string, unknown>;
        return normalizeAppData({ ...candidate, verifiedFamilyId: familyId });
      }
    }
  } catch {
    // Preserve malformed data for recovery; return an empty in-memory state.
  }
  return createEmptyFamilySpaceState();
}

export function saveFamilySpaceStateForFamily(state: FamilySpaceState, familyId: string): boolean {
  const key = getFamilySpaceStorageKey(familyId);
  if (!key || typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify({ ...state, verifiedFamilyId: familyId }));
    return true;
  } catch {
    return false;
  }
}
