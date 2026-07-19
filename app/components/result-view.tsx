'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AXIS_META, FOCUS_LABEL, STYLE_LABEL, type AxisId } from '@/lib/questions';
import { scoreAnswers, type Answers } from '@/lib/scoring';
import { encodeAnswers } from '@/lib/share';
import ReportView from './report-view';

type ReportState =
  | { status: 'loading' }
  | { status: 'done'; markdown: string }
  | { status: 'error' };

type ShareState = 'idle' | 'copied' | 'manual';

export default function ResultView({
  answers,
  isSharedView = false,
  initialReport,
  hideShare = false,
}: {
  answers: Answers;
  isSharedView?: boolean;
  /** 고정 리포트(예시 페이지 등) — 전달 시 API 호출 없이 바로 표시 */
  initialReport?: string;
  hideShare?: boolean;
}) {
  const scores = useMemo(() => scoreAnswers(answers), [answers]);
  const [report, setReport] = useState<ReportState>(
    initialReport ? { status: 'done', markdown: initialReport } : { status: 'loading' }
  );
  const [share, setShare] = useState<ShareState>('idle');
  const shareCode = useMemo(() => encodeAnswers(answers), [answers]);

  useEffect(() => {
    if (initialReport) return;
    let cancelled = false;
    setReport({ status: 'loading' });
    fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`${res.status}`))))
      .then((data) => {
        if (!cancelled) setReport({ status: 'done', markdown: data.markdown });
      })
      .catch(() => {
        if (!cancelled) setReport({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [answers, initialReport]);

  const shareUrl = shareCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${shareCode}`
    : null;

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShare('copied');
      setTimeout(() => setShare('idle'), 2500);
    } catch {
      setShare('manual');
    }
  }

  return (
    <main>
      <div style={{ textAlign: 'center', margin: '1.5rem 0 2rem' }}>
        <div className="eyebrow">학습 성향 진단 결과</div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 24, lineHeight: 1.4 }}>
          {scores.headline}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--navy-muted)', marginTop: 6 }}>
          {STYLE_LABEL[scores.style]} 방식이 잘 맞고, {FOCUS_LABEL[scores.focus]}{' '}
          성향이에요.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.25rem' }}>
        {(Object.keys(AXIS_META) as AxisId[]).map((axis) => {
          const meta = AXIS_META[axis];
          const s = scores.axes[axis];
          return (
            <div className="axis-row" key={axis}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 500 }}>{meta.label}</span>
                <span style={{ color: 'var(--navy-muted)' }}>
                  레벨 {s.level} / 5
                </span>
              </div>
              <div className="axis-track">
                <div className="axis-fill" style={{ width: `${s.normalized}%` }} />
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--navy-muted)',
                  marginTop: 4,
                }}
              >
                {s.normalized >= 50 ? meta.positive : meta.negative}
              </p>
            </div>
          );
        })}
      </div>

      {report.status === 'loading' && (
        <div
          className="card"
          style={{
            background: 'var(--amber-light)',
            borderColor: 'var(--amber-border)',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontSize: 13 }}>
            아이 맞춤 리포트를 정리하고 있어요. 잠시만 기다려 주세요…
          </p>
        </div>
      )}
      {report.status === 'error' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: 13, marginBottom: 10 }}>
            리포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', padding: '9px 18px' }}
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      )}
      {report.status === 'done' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="eyebrow">맞춤 리포트</div>
          <ReportView markdown={report.markdown} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!hideShare && shareUrl && (
          <button type="button" className="btn-primary" onClick={copyShareUrl}>
            {share === 'copied' ? '링크가 복사됐어요 ✓' : '결과 공유하기'}
          </button>
        )}
        {share === 'manual' && shareUrl && (
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 13,
              border: '1px solid var(--ivory-border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--sans)',
            }}
          />
        )}
        <Link className="btn-secondary" href="/survey">
          {isSharedView ? '나도 우리 아이 진단해보기' : '다시 진단하기'}
        </Link>
      </div>

      <footer
        style={{
          marginTop: '2.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--ivory-border)',
          fontSize: 12,
          color: 'var(--navy-muted)',
        }}
      >
        본 진단은 자녀 이해를 돕기 위한 참고 자료이며, 의학적·심리학적 진단을
        대신하지 않습니다.
      </footer>
    </main>
  );
}
