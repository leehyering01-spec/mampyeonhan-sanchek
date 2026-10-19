import Link from 'next/link';
import { buttonVariants } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

export default function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
      {actionHref && actionLabel && (
        <Link href={actionHref} className={cn(buttonVariants({ variant: 'brand' }), 'mt-6 inline-flex')}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
