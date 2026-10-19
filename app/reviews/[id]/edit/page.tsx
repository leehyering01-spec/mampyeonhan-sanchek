import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReviewsShell from '@/app/components/reviews/ReviewsShell';
import ReviewForm from '@/app/components/reviews/ReviewForm';
import { updateReview } from '@/app/lib/review-actions';
import { destinationOptions, getReview, publicImageUrl } from '@/app/lib/reviews';
import { isSupabaseConfigured } from '@/app/lib/supabase/env';

export const metadata = {
  title: '후기 수정',
};

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) notFound();
  const { id } = await params;
  const review = await getReview(id);
  if (!review) notFound();
  const boundAction = updateReview.bind(null, review.id);

  return (
    <ReviewsShell>
      <Link href={`/reviews/${review.id}`} className="text-sm font-semibold text-muted">
        ‹ 상세
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">후기 수정</h1>
      <div className="mt-8 max-w-xl rounded-2xl border border-line bg-white p-6">
        <ReviewForm
          destinations={destinationOptions()}
          action={boundAction}
          review={review}
          imageUrl={publicImageUrl(review.image_path)}
        />
      </div>
    </ReviewsShell>
  );
}
