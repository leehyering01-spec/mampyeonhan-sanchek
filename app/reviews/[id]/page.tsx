import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReviewsShell from '@/app/components/reviews/ReviewsShell';
import ConfirmDelete from '@/app/components/reviews/ConfirmDelete';
import { Badge } from '@/app/components/ui/badge';
import { buttonVariants } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';
import { getReview, publicImageUrl } from '@/app/lib/reviews';
import { isSupabaseConfigured } from '@/app/lib/supabase/env';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  if (!isSupabaseConfigured()) return { title: '후기' };
  const { id } = await params;
  try {
    const review = await getReview(id);
    if (!review) return { title: '없는 후기' };
    const image = publicImageUrl(review.image_path);
    return {
      title: `${review.destination_name} 후기`,
      description: review.body.slice(0, 80),
      openGraph: {
        title: `${review.destination_name} · 맘편한 산책 후기`,
        description: review.body.slice(0, 80),
        images: image ? [{ url: image }] : [{ url: '/images/hero-walk.png' }],
      },
    };
  } catch {
    return { title: '후기' };
  }
}

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <ReviewsShell>
        <p>Supabase 환경 변수가 없어 후기를 열 수 없어요.</p>
      </ReviewsShell>
    );
  }

  const { id } = await params;
  let review = null;
  try {
    review = await getReview(id);
  } catch {
    notFound();
  }
  if (!review) notFound();
  const imageUrl = publicImageUrl(review.image_path);

  return (
    <ReviewsShell>
      <Link href="/reviews" className="text-sm font-semibold text-muted">
        ‹ 목록
      </Link>
      <article className="mt-4 overflow-hidden rounded-3xl border border-line bg-white">
        {imageUrl ? (
          <img src={imageUrl} alt={`${review.destination_name} 산책 사진`} className="h-72 w-full object-cover" />
        ) : (
          <div className="flex h-48 items-center justify-center bg-surface text-muted">사진 없음</div>
        )}
        <div className="space-y-4 p-6">
          <Badge>{review.destination_name}</Badge>
          <h1 className="text-3xl font-extrabold">{review.destination_name} 후기</h1>
          <p className="text-plum">{'★'.repeat(review.rating)}</p>
          <p className="leading-7">{review.body}</p>
          <p className="text-sm text-muted">
            {review.nickname} · {new Date(review.created_at).toLocaleString('ko-KR')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/reviews/${review.id}/edit`} className={cn(buttonVariants({ variant: 'brand' }))}>
              수정
            </Link>
            <ConfirmDelete id={review.id} name={review.destination_name} />
          </div>
        </div>
      </article>
    </ReviewsShell>
  );
}
