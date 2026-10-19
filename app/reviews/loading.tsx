import ReviewsShell from '@/app/components/reviews/ReviewsShell';
import { Skeleton } from '@/app/components/ui/skeleton';

export default function ReviewsLoading() {
  return (
    <ReviewsShell>
      <Skeleton className="h-10 w-40" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </ReviewsShell>
  );
}
