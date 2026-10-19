import Link from 'next/link';
import ReviewsShell from '@/app/components/reviews/ReviewsShell';
import { buttonVariants } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

export default function NotFound() {
  return (
    <ReviewsShell>
      <h1 className="text-2xl font-extrabold">페이지를 찾지 못했어요</h1>
      <p className="mt-3 text-muted">주소가 잘못되었거나, 없는 후기를 열고 있을 수 있어요.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className={cn(buttonVariants({ variant: 'default' }))}>
          소개로
        </Link>
        <Link href="/reviews" className={cn(buttonVariants({ variant: 'brand' }))}>
          후기 목록
        </Link>
      </div>
    </ReviewsShell>
  );
}
