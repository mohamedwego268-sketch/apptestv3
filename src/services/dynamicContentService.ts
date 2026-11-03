import type { DynamicContentCatalogItem } from '../domain/contentRecommendationEngine';
import { supabaseClient } from './supabaseService';

interface DynamicContentFetchResult {
  items: DynamicContentCatalogItem[];
  error: string | null;
}

interface MediaAssetRow {
  id: string;
  media_type: 'video' | 'image' | 'audio';
  storage_path: string;
  poster_path: string | null;
}

interface CatalogCacheEntry {
  expiresAt: number;
  promise: Promise<DynamicContentFetchResult>;
}

const catalogCache = new Map<string, CatalogCacheEntry>();

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Dynamic content request timed out.')), timeoutMs);
  });
  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  });
}

async function loadDynamicContentCatalog(): Promise<DynamicContentFetchResult> {
  const client = supabaseClient;
  if (!client) return { items: [], error: null };

  try {
    const response = await withTimeout(
      client
        .from('content_catalog')
        .select('id,content_key,title_ar,title_en,summary_ar,summary_en,body_ar,body_en,content_type,topic,audience,language,age_min_months,age_max_months,tags,interest_tags,hobby_tags,sport_tags,safety_level,review_status,is_published,is_featured,sort_weight,media_asset_id,source_name,source_url,cta_label_ar,cta_label_en,cta_target,published_at,expires_at')
        .eq('is_published', true)
        .eq('review_status', 'approved')
        .order('is_featured', { ascending: false })
        .order('sort_weight', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(80),
      6500
    );

    if (response.error) return { items: [], error: response.error.message };
    const rows = (response.data ?? []) as unknown as DynamicContentCatalogItem[];
    const mediaIds = [...new Set(rows.map((row) => row.media_asset_id).filter((id): id is string => Boolean(id)))];
    if (mediaIds.length === 0) return { items: rows, error: null };

    const mediaResponse = await withTimeout(
      client.from('media_assets').select('id,media_type,storage_path,poster_path').in('id', mediaIds),
      4500
    ).catch(() => null);

    const mediaRows = (mediaResponse && !mediaResponse.error
      ? mediaResponse.data ?? []
      : []) as MediaAssetRow[];

    const signedMedia = await Promise.all(
      mediaRows.map(async (asset) => {
        try {
          const [original, poster] = await Promise.all([
            withTimeout(client.storage.from('nekbaar-media').createSignedUrl(asset.storage_path, 900), 3500),
            asset.poster_path
              ? withTimeout(client.storage.from('nekbaar-media').createSignedUrl(asset.poster_path, 900), 3500)
              : Promise.resolve(null),
          ]);
          return [asset.id, {
            mediaType: asset.media_type,
            mediaUrl: original.error ? null : original.data?.signedUrl ?? null,
            posterUrl: poster && !poster.error ? poster.data?.signedUrl ?? null : null,
          }] as const;
        } catch {
          return [asset.id, { mediaType: asset.media_type, mediaUrl: null, posterUrl: null }] as const;
        }
      })
    );
    const mediaById = new Map(signedMedia);

    return {
      items: rows.map((row) => {
        const media = row.media_asset_id ? mediaById.get(row.media_asset_id) : null;
        return {
          ...row,
          media_type: media?.mediaType ?? null,
          media_url: media?.mediaUrl ?? null,
          media_poster_url: media?.posterUrl ?? null,
        };
      }),
      error: null,
    };
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Unable to load dynamic content.',
    };
  }
}

export async function fetchDynamicContentCatalog(
  forceRefresh = false
): Promise<DynamicContentFetchResult> {
  const client = supabaseClient;
  if (!client) return { items: [], error: null };

  let cacheKey = 'anonymous';
  try {
    const session = await withTimeout(client.auth.getSession(), 2500);
    if (session.error) return { items: [], error: session.error.message };
    cacheKey = session.data.session?.user?.id || 'anonymous';
  } catch (error) {
    return {
      items: [],
      error: error instanceof Error ? error.message : 'Unable to verify the current content session.',
    };
  }

  const cached = catalogCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = loadDynamicContentCatalog();
  catalogCache.set(cacheKey, {
    expiresAt: Date.now() + 4 * 60 * 1000,
    promise,
  });
  const result = await promise;
  if (result.error) {
    const entry = catalogCache.get(cacheKey);
    if (entry) entry.expiresAt = Date.now() + 30 * 1000;
  }
  return result;
}

export function clearDynamicContentCatalogCache(): void {
  catalogCache.clear();
}
