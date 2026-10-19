import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>맘편한 산책 · 이문동 유모차 산책 MVP</p>
        <div className="flex gap-4">
          <Link href="/reviews" className="hover:text-ink">
            후기
          </Link>
          <Link href="/walk" className="hover:text-ink">
            앱
          </Link>
        </div>
      </div>
    </footer>
  );
}
