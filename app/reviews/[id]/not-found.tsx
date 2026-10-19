import Link from 'next/link';
import ReviewsShell from '@/app/components/reviews/ReviewsShell';
import { buttonVariants } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

export default function ReviewNotFound() {
  return (
    <ReviewsShell>
      <h1 className="text-2xl font-extrabold">없는 후기입니다</h1>
      <p className="mt-3 text-muted">삭제되었거나 주소가 잘못되었어요.</p>
      <Link href="/reviews" className={cn(buttonVariants({ variant: 'brand' }), 'mt-6 inline-flex')}>
        목록으로
      </Link>
    </ReviewsShell>
  );
}
