'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button, buttonVariants } from '@/app/components/ui/button';
import { cn } from '@/app/lib/utils';

const NAV = [
  { href: '/#problem', label: '문제' },
  { href: '/#features', label: '기능' },
  { href: '/reviews', label: '후기' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <img src="/images/brand-mark.png" alt="" width={32} height={32} />
          <span className="text-base font-extrabold tracking-tight text-plum">맘편한 산책</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex" aria-label="주요 메뉴">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-semibold text-ink/80 hover:text-ink">
              {item.label}
            </Link>
          ))}
          <Link href="/walk" className={cn(buttonVariants({ variant: 'brand', size: 'sm' }))}>
            산책 시작
          </Link>
        </nav>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden size={20} /> : <Menu aria-hidden size={20} />}
          <span className="sr-only">{open ? '메뉴 닫기' : '메뉴 열기'}</span>
        </Button>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t border-line bg-white px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="모바일 메뉴">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-2 text-sm font-semibold"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/walk"
              className={cn(buttonVariants({ variant: 'brand', size: 'full' }))}
              onClick={() => setOpen(false)}
            >
              산책 시작
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
