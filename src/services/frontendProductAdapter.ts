/**
 * Nekbaar — Frontend Product Adapter
 * Isolates realistic demo data and provides clean, real-time-ready contracts
 * for Community, Internal Chat, Media Reels, and In-App AI Assistant when
 * backend/cloud endpoints are not connected.
 */

export interface ProductAdapterStatus {
  feature: 'community' | 'chat' | 'media' | 'assistant';
  mode: 'demo_adapter' | 'cloud_connected';
  realtimeReady: boolean;
}

export const FRONTEND_PRODUCT_ADAPTER_STATUS: Record<
  ProductAdapterStatus['feature'],
  ProductAdapterStatus
> = {
  community: {
    feature: 'community',
    mode: 'demo_adapter',
    realtimeReady: true,
  },
  chat: {
    feature: 'chat',
    mode: 'demo_adapter',
    realtimeReady: true,
  },
  media: {
    feature: 'media',
    mode: 'demo_adapter',
    realtimeReady: true,
  },
  assistant: {
    feature: 'assistant',
    mode: 'demo_adapter',
    realtimeReady: true,
  },
};

export const REEL_TOPIC_FILTERS = [
  { id: 'all', labelAr: 'كل المحتوى', labelEn: 'All Reels' },
  { id: 'تعديل السلوك', labelAr: 'تعديل السلوك', labelEn: 'Behavior & Calm' },
  { id: 'أنشطة مونتيسوري', labelAr: 'أنشطة مونتيسوري', labelEn: 'Montessori & Play' },
  { id: 'نوم الأطفال', labelAr: 'نوم الأطفال', labelEn: 'Sleep Routine' },
  { id: 'التغذية الصحية', labelAr: 'التغذية الصحية', labelEn: 'Healthy Nutrition' },
] as const;
