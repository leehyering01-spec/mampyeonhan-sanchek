import Link from 'next/link';
import { buttonVariants } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

export default function ReviewPagination({
  page,
  pageCount,
  search,
}: {
  page: number;
  pageCount: number;
  search: Record<string, string | undefined>;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (next: number) => {
    const params = new URLSearchParams();
    if (search.q) params.set('q', search.q);
    if (search.destination) params.set('destination', search.destination);
    if (search.sort && search.sort !== 'newest') params.set('sort', search.sort);
    if (next > 1) params.set('page', String(next));
    const query = params.toString();
    return query ? `/reviews?${query}` : '/reviews';
  };

  return (
    <nav className="mt-8 flex items-center justify-center gap-3" aria-label="후기 페이지">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), page <= 1 && 'pointer-events-none opacity-40')}
      >
        이전
      </Link>
      <span className="text-sm text-muted">
        {page} / {pageCount}
      </span>
      <Link
        href={hrefFor(Math.min(pageCount, page + 1))}
        aria-disabled={page >= pageCount}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          page >= pageCount && 'pointer-events-none opacity-40',
        )}
      >
        다음
      </Link>
    </nav>
  );
}
