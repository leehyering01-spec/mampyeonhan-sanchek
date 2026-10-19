import Link from 'next/link';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import type { WalkReview } from '@/app/lib/reviews';

export default function ReviewCard({
  review,
  imageUrl,
}: {
  review: WalkReview;
  imageUrl: string | null;
}) {
  return (
    <Link href={`/reviews/${review.id}`} className="block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        {imageUrl ? (
          <img src={imageUrl} alt={`${review.destination_name} 산책 사진`} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center bg-surface text-sm font-semibold text-muted">
            사진 없음
          </div>
        )}
        <CardContent className="space-y-2 pt-5">
          <div className="flex items-center justify-between gap-2">
            <Badge>{review.destination_name}</Badge>
            <span className="text-sm font-bold text-plum">{'★'.repeat(review.rating)}</span>
          </div>
          <p className="line-clamp-3 text-sm leading-6">{review.body}</p>
          <p className="text-xs text-muted">{review.nickname}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
