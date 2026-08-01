import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

const SITE_TITLE = '클래스 핏 — 아이 학습 성향 진단';
const SITE_DESC =
  '부모님의 관찰만으로 5분 만에, 우리 아이 얘기 같은 학습 성향 리포트를 받아보세요.';

export const metadata: Metadata = {
  metadataBase: new URL('https://learnmatch-zeta.vercel.app'),
  title: SITE_TITLE,
  description: SITE_DESC,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESC },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&family=Noto+Sans+KR:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="wrap">
          <header className="site-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link href="/" className="logo" aria-label="클래스 핏 홈으로 이동">
                클래스 <span>핏</span>
              </Link>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--navy-muted)',
                  border: '1px solid var(--ivory-border)',
                  borderRadius: 999,
                  padding: '2px 7px',
                }}
              >
                베타3
              </span>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
