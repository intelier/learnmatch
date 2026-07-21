/**
 * 공유 링크 OG 이미지 (T-14) — 카톡·SNS 미리보기 카드.
 * /r/<code> 를 공유하면 진단 헤드라인·축 요약이 담긴 1200x630 이미지가 생성된다.
 */
import { ImageResponse } from 'next/og';
import { AXIS_META, type AxisId } from '@/lib/questions';
import { findByShareToken } from '@/lib/db';
import { scoreAnswers, type Answers, type Scores } from '@/lib/scoring';
import { decodeAnswers } from '@/lib/share';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = '클래스 핏 학습 성향 진단 결과';

const AXES: AxisId[] = ['autonomy', 'competence', 'social', 'burnout', 'zpd_strain'];

/** 필요한 글자만 서브셋으로 받아 한글 폰트 임베딩 */
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

async function resolveScores(code: string): Promise<Scores | null> {
  const stored = await findByShareToken(code);
  let answers: Answers | null = stored ? stored.answers : decodeAnswers(code);
  if (!answers) return null;
  return scoreAnswers(answers);
}

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const scores = await resolveScores(code);
  const headline = scores?.headline ?? '우리 아이 학습 성향 진단';

  // 이미지에 등장하는 모든 텍스트 (폰트 서브셋용)
  const axisText = AXES.map((a) => AXIS_META[a].label).join('');
  const allText =
    headline + '클래스핏아이학습성향진단결과우리얘기같은맞춤리포트' + axisText + '레벨0123456789/·';

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
          justifyContent: 'space-between',
          background: '#faf8f4',
          padding: '64px 72px',
          fontFamily: 'Noto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: '#1a2e4a' }}>
            <span>클래스&nbsp;</span>
            <span style={{ color: '#c8860a' }}>핏</span>
          </div>
          <div style={{ fontSize: 20, color: '#6b7f97' }}>· 아이 학습 성향 진단</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 26, color: '#c8860a', fontWeight: 600 }}>
            우리 아이는
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 600,
              color: '#1a2e4a',
              lineHeight: 1.25,
            }}
          >
            {headline}
          </div>
        </div>

        {scores && (
          <div style={{ display: 'flex', gap: 14 }}>
            {AXES.map((axis) => (
              <div
                key={axis}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ffffff',
                  border: '1px solid #e2ddd3',
                  borderRadius: 14,
                  padding: '16px 22px',
                }}
              >
                <div style={{ fontSize: 22, color: '#6b7f97' }}>
                  {AXIS_META[axis].label}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    fontSize: 30,
                    fontWeight: 600,
                    color: '#3d6b4f',
                  }}
                >
                  <span>{scores.axes[axis].level}</span>
                  <span style={{ fontSize: 18, color: '#9ec9aa' }}>&nbsp;/ 5</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
