import destinationsData from '../data/destinations.json';
import { isStrollerBlocked } from './walkMetrics';
import { createSupabaseServer } from './supabase/server';

export const REVIEW_PAGE_SIZE = 6;
export const REVIEW_IMAGE_BUCKET = 'review-photos';
export const REVIEW_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const REVIEW_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export type WalkReview = {
  id: string;
  destination_id: string;
  destination_name: string;
  nickname: string;
  rating: number;
  body: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type DestinationOption = {
  destination_id: string;
  name: string;
};

export type ReviewSort = 'newest' | 'rating';

type DestinationRow = {
  destination_id: string;
  name: string;
};

export function destinationOptions(): DestinationOption[] {
  return (destinationsData as DestinationRow[])
    .filter((item) => !isStrollerBlocked(item.destination_id))
    .map((item) => ({ destination_id: item.destination_id, name: item.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function findDestination(id: string) {
  return destinationOptions().find((item) => item.destination_id === id) ?? null;
}

export function publicImageUrl(imagePath: string | null) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  const supabase = createSupabaseServer();
  const { data } = supabase.storage.from(REVIEW_IMAGE_BUCKET).getPublicUrl(imagePath);
  return data.publicUrl;
}

export async function listReviews(params: {
  page: number;
  q?: string;
  destination?: string;
  sort?: ReviewSort;
}) {
  const supabase = createSupabaseServer();
  const page = Math.max(1, params.page);
  const from = (page - 1) * REVIEW_PAGE_SIZE;
  const to = from + REVIEW_PAGE_SIZE - 1;
  const sort = params.sort === 'rating' ? 'rating' : 'newest';

  let query = supabase.from('walk_reviews').select('*', { count: 'exact' });

  if (params.destination) {
    query = query.eq('destination_id', params.destination);
  }
  if (params.q?.trim()) {
    const term = params.q.trim().replace(/[%_,]/g, '');
    if (term) {
      query = query.or(
        `nickname.ilike.%${term}%,body.ilike.%${term}%,destination_name.ilike.%${term}%`,
      );
    }
  }

  query =
    sort === 'rating'
      ? query.order('rating', { ascending: false }).order('created_at', { ascending: false })
      : query.order('created_at', { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    items: (data ?? []) as WalkReview[],
    total: count ?? 0,
    page,
    pageSize: REVIEW_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / REVIEW_PAGE_SIZE)),
  };
}

export async function getReview(id: string) {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase.from('walk_reviews').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as WalkReview | null) ?? null;
}
