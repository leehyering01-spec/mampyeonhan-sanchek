import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: '산책 앱',
  description: '이문동 출입구 기준 유모차 길안내와 산책 기록',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#fffef6',
};

export default function WalkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
