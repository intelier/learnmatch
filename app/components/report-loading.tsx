'use client';

import { useEffect, useState } from 'react';
import { AXIS_META, type AxisId } from '@/lib/questions';
import type { Scores } from '@/lib/scoring';

/** 리포트 생성(약 20초) 동안 진행감·기대감을 주는 로딩 화면 (기다림을 콘텐츠로) */

// 순환 단계 문구 — 실제 생성 단계처럼 보이게 순서대로
const STEPS = [
  '설문 응답을 5가지 축으로 정리하고 있어요',
  '아이의 강점과 숨은 면을 읽어내는 중이에요',
  '"우리 아이 얘기 같은" 문장으로 옮기고 있어요',
  '실천 조언과 학원 팁을 다듬고 있어요',
  '리포트를 마지막으로 손보고 있어요',
];

// 진행 중 하나씩 열어주는 "우리 아이 힌트" — 축 점수를 근거로
function buildTeasers(scores: Scores): string[] {
  const axisIds = Object.keys(AXIS_META) as AxisId[];
  const sorted = [...axisIds].sort(
    (a, b) => scores.axes[b].normalized - scores.axes[a].normalized
  );
  const top = sorted[0];
  const low = sorted[sorted.length - 1];
  return [
    `가장 두드러지는 축은 '${AXIS_META[top].label}'이에요`,
    `${AXIS_META[top].label} 쪽 힘이 이 아이의 지렛대가 될 수 있어요`,
    `'${AXIS_META[low].label}'는 걱정거리가 아니라 다르게 읽어드릴게요`,
    '겉으로 보이는 모습 뒤의 의외의 면도 짚어드려요',
  ];
}

export default function ReportLoading({ scores }: { scores: Scores }) {
  const [elapsed, setElapsed] = useState(0);
  const teasers = buildTeasers(scores);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 25초를 목표로 진행 바를 채우되, 100%엔 도달하지 않게 (90%에서 대기)
  const progress = Math.min(90, Math.round((elapsed / 25) * 90));
  const stepIndex = Math.min(STEPS.length - 1, Math.floor(elapsed / 5));
  const teaserIndex = Math.min(teasers.length - 1, Math.floor(elapsed / 6));

  return (
    <div
      className="card"
      style={{
        background: 'var(--amber-light)',
        borderColor: 'var(--amber-border)',
        marginBottom: '1.5rem',
      }}
    >
      <div className="eyebrow" style={{ marginBottom: '0.6rem' }}>
        맞춤 리포트 생성 중
      </div>

      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, minHeight: 20 }}>
        {STEPS[stepIndex]}
        <span className="loading-dots" aria-hidden />
      </p>

      <div className="progress-track" style={{ marginBottom: 6 }}>
        <div
          className="progress-fill loading-shimmer"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p style={{ fontSize: 11, color: 'var(--navy-muted)', marginBottom: '1.1rem' }}>
        보통 20~30초쯤 걸려요. 아이를 떠올리며 잠시만 기다려 주세요.
      </p>

      <div
        style={{
          borderTop: '1px dashed var(--amber-border)',
          paddingTop: '0.9rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 15 }}>💡</span>
        <p
          key={teaserIndex}
          className="teaser-fade"
          style={{ fontSize: 13, color: 'var(--navy-light)', lineHeight: 1.6 }}
        >
          {teasers[teaserIndex]}
        </p>
      </div>
    </div>
  );
}
