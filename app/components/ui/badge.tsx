import { cn } from '@/app/lib/utils';

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-lime/70 px-2.5 py-1 text-xs font-bold text-ink',
        className,
      )}
      {...props}
    />
  );
}
