import Link from 'next/link';
import ReviewsShell from '@/app/components/reviews/ReviewsShell';
import ReviewForm from '@/app/components/reviews/ReviewForm';
import { createReview } from '@/app/lib/review-actions';
import { destinationOptions } from '@/app/lib/reviews';
import { isSupabaseConfigured } from '@/app/lib/supabase/env';

export const metadata = {
  title: '후기 등록',
};

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const params = await searchParams;
  return (
    <ReviewsShell>
      <Link href="/reviews" className="text-sm font-semibold text-muted">
        ‹ 목록
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">후기 등록</h1>
      <p className="mt-2 text-sm text-muted">별점과 후기는 필수예요. 사진은 없어도 등록할 수 있습니다.</p>
      <div className="mt-8 max-w-xl rounded-2xl border border-line bg-white p-6">
        {isSupabaseConfigured() ? (
          <ReviewForm
            destinations={destinationOptions()}
            action={createReview}
            defaultDestinationId={params.destination}
          />
        ) : (
          <p className="text-sm text-muted">Supabase 환경 변수를 설정한 뒤 등록할 수 있어요.</p>
        )}
      </div>
    </ReviewsShell>
  );
}
