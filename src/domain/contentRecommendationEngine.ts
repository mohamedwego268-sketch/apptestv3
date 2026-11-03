import type { ChildProfile, ChildProfileDetails, LanguageCode } from './familySpaceCore';

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
