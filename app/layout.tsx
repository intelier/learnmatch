import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '클래스 핏 — 아이 학습 성향 진단',
  description:
    '자녀 성향진단으로 자녀 이해를 돕고, 나아가 학원 선택을 돕는 서비스',
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
            <div className="logo">
              클래스 <span>핏</span>
            </div>
            <div className="badge-theory">교육심리학 기반</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
