/**
 * 사이트 기본 OG 이미지 (T-14) — 메인 링크(learnmatch-zeta.vercel.app) 공유 시 카드.
 */
import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = '클래스 핏 — 아이 학습 성향 진단';

async function loadFont(text: string, weight: 400 | 600): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(
      text
    )}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format/);
    if (!src) return null;
    const res = await fetch(src[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image() {
  const allText =
    '클래스핏아이학습성향진단부모님의관찰만으로5분만에우리얘기같은맞춤리포트를받아보세요';
  const [regular, bold] = await Promise.all([
    loadFont(allText, 400),
    loadFont(allText, 600),
  ]);
  const fonts = [
    ...(regular ? [{ name: 'Noto', data: regular, weight: 400 as const }] : []),
    ...(bold ? [{ name: 'Noto', data: bold, weight: 600 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
          background: '#faf8f4',
          padding: '72px 80px',
          fontFamily: 'Noto',
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 600, color: '#1a2e4a' }}>
          <span>클래스&nbsp;</span>
          <span style={{ color: '#c8860a' }}>핏</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 64,
            fontWeight: 600,
            color: '#1a2e4a',
            lineHeight: 1.3,
          }}
        >
          <span>우리 아이, 어떻게 공부할 때</span>
          <span>가장 빛날까요?</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 30,
            color: '#6b7f97',
            lineHeight: 1.5,
          }}
        >
          <span>부모님의 관찰만으로 5분 만에,</span>
          <span>우리 아이 얘기 같은 맞춤 리포트</span>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
