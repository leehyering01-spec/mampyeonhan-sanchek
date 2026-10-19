import Link from 'next/link';
import ReviewsShell from '@/app/components/reviews/ReviewsShell';
import ReviewCard from '@/app/components/reviews/ReviewCard';
import ReviewPagination from '@/app/components/reviews/ReviewPagination';
import EmptyState from '@/app/components/reviews/EmptyState';
import { Button, buttonVariants } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { cn } from '@/app/lib/utils';
import { destinationOptions, listReviews, publicImageUrl, type ReviewSort } from '@/app/lib/reviews';
import { isSupabaseConfigured } from '@/app/lib/supabase/env';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; destination?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const q = params.q?.trim() ?? '';
  const destination = params.destination ?? '';
  const sort: ReviewSort = params.sort === 'rating' ? 'rating' : 'newest';

  return (
    <ReviewsShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-plum">핵심 기능</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">산책 후기</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            다녀온 길을 별점·메모·사진으로 남기고, 목록에서 검색·정렬할 수 있어요.
          </p>
        </div>
        <Link href="/reviews/new" className={cn(buttonVariants({ variant: 'brand' }))}>
          후기 등록
        </Link>
      </div>

      <form className="mt-8 grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-4" method="get">
        <Input name="q" defaultValue={q} placeholder="별명, 내용, 장소 검색" />
        <select
          name="destination"
          defaultValue={destination}
          className="h-11 rounded-xl border border-line bg-white px-3 text-sm"
        >
          <option value="">전체 목적지</option>
          {destinationOptions().map((item) => (
            <option key={item.destination_id} value={item.destination_id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          name="sort"
          defaultValue={sort}
          className="h-11 rounded-xl border border-line bg-white px-3 text-sm"
        >
          <option value="newest">최신순</option>
          <option value="rating">별점 높은 순</option>
        </select>
        <Button type="submit" variant="default">
          찾아보기
        </Button>
      </form>

      {!isSupabaseConfigured() ? (
        <div className="mt-8 rounded-2xl border border-plum/20 bg-white p-6">
          <h2 className="font-bold">Supabase 연결이 필요합니다</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 넣고,
            `supabase/schema.sql`을 SQL Editor에서 실행한 뒤 개발 서버를 다시 켜 주세요. 실제 값은 GitHub에
            올리지 마세요.
          </p>
        </div>
      ) : (
        <ReviewsResult page={page} q={q} destination={destination} sort={sort} />
      )}
    </ReviewsShell>
  );
}

async function ReviewsResult({
  page,
  q,
  destination,
  sort,
}: {
  page: number;
  q: string;
  destination: string;
  sort: ReviewSort;
}) {
  try {
    const result = await listReviews({ page, q, destination, sort });
    if (!result.items.length) {
      return (
        <div className="mt-8">
          <EmptyState
            title="아직 후기가 없어요"
            body="첫 산책 이야기를 남겨 목록을 채워 주세요."
            actionHref="/reviews/new"
            actionLabel="후기 등록"
          />
        </div>
      );
    }

    return (
      <>
        <p className="mt-6 text-sm text-muted">전체 {result.total}개</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {result.items.map((item) => (
            <ReviewCard key={item.id} review={item} imageUrl={publicImageUrl(item.image_path)} />
          ))}
        </div>
        <ReviewPagination
          page={result.page}
          pageCount={result.pageCount}
          search={{ q, destination, sort }}
        />
      </>
    );
  } catch {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-bold">후기를 불러오지 못했어요</h2>
        <p className="mt-2 text-sm text-muted">
          테이블이 없거나 네트워크 오류일 수 있어요. SQL을 실행했는지 확인해 주세요.
        </p>
      </div>
    );
  }
}
