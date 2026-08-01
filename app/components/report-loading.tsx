'use client';

import { useEffect, useState } from 'react';
import type { Scores } from '@/lib/scoring';

/**
 * 리포트 생성(약 20~30초) 동안 보여주는 로딩 화면 (D-25).
 * "광고처럼 보여서 지나친다"는 피드백 반영 — 마케팅 문구·이모지 후킹을 빼고,
 * 실제 처리 단계를 그대로 보여주는 절제된 톤으로 재설계. 완료되면 (기존과
 * 동일하게) result-view.tsx의 useEffect가 report.status를 'done'으로 바꿔
 * 클릭 없이 자동으로 리포트로 전환된다 — 이 컴포넌트는 그 전까지만 보인다.
 */

const STEPS = ['응답 분석', '성향 분류', '리포트 작성'];

export default function ReportLoading({
  scores,
  childName,
}: {
  scores: Scores;
  childName?: string;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 25초를 목표로 진행 바를 채우되, 100%엔 도달하지 않게 (90%에서 대기)
  const progress = Math.min(90, Math.round((elapsed / 25) * 90));
  // 3단계를 시간에 걸쳐 순차적으로 활성화 (0~7초/8~17초/18초~)
  const activeIndex = elapsed < 8 ? 0 : elapsed < 18 ? 1 : 2;

  const who = childName?.trim() || '우리 아이';

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

      <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, lineHeight: 1.6 }}>
        {who}의 응답 {scores.answeredCount}개를 분석하고 있어요.
      </p>
      <p style={{ fontSize: 13, color: 'var(--navy-light)', marginBottom: 14 }}>
        잠시만 기다리시면 상세 해설 리포트가 나와요.
      </p>

      <div style={{ marginBottom: 14 }}>
        {STEPS.map((label, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <div
              key={label}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 600,
                  background: done ? 'var(--amber)' : 'transparent',
                  border: done ? 'none' : `1.5px solid ${active ? 'var(--amber)' : 'var(--ivory-border)'}`,
                  color: done ? 'var(--white)' : active ? 'var(--amber)' : 'var(--navy-muted)',
                }}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: done || active ? 600 : 400,
                  color: done || active ? 'var(--navy)' : 'var(--navy-muted)',
                }}
              >
                {label}
                {active && <span className="loading-dots" aria-hidden />}
              </span>
            </div>
          );
        })}
      </div>

      <div className="progress-track">
        <div className="progress-fill loading-shimmer" style={{ width: `${progress}%` }} />
      </div>
      <p style={{ fontSize: 11, color: 'var(--navy-muted)', marginTop: 6 }}>
        보통 20~30초쯤 걸려요.
      </p>
    </div>
  );
}
