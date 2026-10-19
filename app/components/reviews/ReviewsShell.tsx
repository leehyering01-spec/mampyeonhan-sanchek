import SiteHeader from '@/app/components/landing/SiteHeader';
import SiteFooter from '@/app/components/landing/SiteFooter';

export default function ReviewsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
