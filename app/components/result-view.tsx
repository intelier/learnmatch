'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AXIS_META, FOCUS_LABEL, STYLE_LABEL, type AxisId } from '@/lib/questions';
import {
  buildCheckoutUrl,
  GROBLE_SINGLE_URL,
  isPaymentReady,
} from '@/lib/groble';
import { scoreAnswers, type Answers } from '@/lib/scoring';
import { encodeAnswers } from '@/lib/share';
import RadarChart from './radar-chart';
import ReportLoading from './report-loading';
import ReportView from './report-view';

type ReportState =
  | { status: 'loading' }
  | { status: 'done'; markdown: string; locked: boolean; lockedSections: string[] }
  | { status: 'error' };

type ShareState = 'idle' | 'copied' | 'manual';

export default function ResultView({
  answers,
  isSharedView = false,
  initialReport,
  hideShare = false,
  initialShareToken,
  initialLocked = false,
  initialLockedSections = [],
}: {
  answers: Answers;
  isSharedView?: boolean;
  /** 고정 리포트(예시 페이지 등) — 전달 시 API 호출 없이 바로 표시 */
  initialReport?: string;
  hideShare?: boolean;
  /** 이미 발급된 share_token (공유 페이지에서 재공유 시 동일 URL 유지) */
  initialShareToken?: string;
  /** initialReport가 무료 구간만일 때 (T-10 게이팅) */
  initialLocked?: boolean;
  initialLockedSections?: string[];
}) {
  const scores = useMemo(() => scoreAnswers(answers), [answers]);
  const [report, setReport] = useState<ReportState>(
    initialReport
      ? {
          status: 'done',
          markdown: initialReport,
          locked: initialLocked,
          lockedSections: initialLockedSections,
        }
      : { status: 'loading' }
  );
  const [share, setShare] = useState<ShareState>('idle');
  // DB 저장 시 짧은 share_token, 아니면 legacy 무상태 코드 (T-09)
  const [shareToken, setShareToken] = useState<string | null>(initialShareToken ?? null);
  const shareCode = useMemo(() => encodeAnswers(answers), [answers]);
  const paymentReady = isPaymentReady();

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
        if (!cancelled) {
          setReport({
            status: 'done',
            markdown: data.markdown,
            locked: Boolean(data.locked),
            lockedSections: data.lockedSections ?? [],
          });
          if (data.shareToken) setShareToken(data.shareToken);
        }
      })
      .catch(() => {
        if (!cancelled) setReport({ status: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [answers, initialReport]);

  const sharePath = shareToken ?? shareCode;
  const shareUrl = sharePath
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${sharePath}`
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
        <RadarChart scores={scores} />
        <div
          style={{
            borderTop: '1px solid var(--ivory-border)',
            margin: '1.1rem 0',
          }}
        />
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

      {report.status === 'loading' && <ReportLoading scores={scores} />}
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
          {report.locked && (
            <div className="locked-teaser">
              {report.lockedSections.map((title) => (
                <div key={title} style={{ marginBottom: '1.1rem' }}>
                  <h2
                    style={{
                      fontFamily: 'var(--serif)',
                      fontSize: 17,
                      margin: '0 0 0.55rem',
                    }}
                  >
                    🔒 {title}
                  </h2>
                  <div className="blur-line" style={{ width: '96%' }} />
                  <div className="blur-line" style={{ width: '88%' }} />
                  <div className="blur-line" style={{ width: '62%' }} />
                </div>
              ))}
              <div className="locked-overlay" />
            </div>
          )}
        </div>
      )}
      {report.status === 'done' && report.locked && (
        <div
          className="card"
          style={{
            borderColor: 'var(--amber-border)',
            background: 'var(--amber-light)',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            우리 아이의 의외의 모습, 축별 자세한 해석과 실천 조언이 준비되어
            있어요.
          </p>
          <p style={{ fontSize: 12, color: 'var(--navy-muted)', marginBottom: 12 }}>
            잠긴 내용: {report.lockedSections.join(' · ')}
          </p>
          {paymentReady ? (
            <a
              className="btn-primary"
              href={buildCheckoutUrl(GROBLE_SINGLE_URL, shareToken)}
              target="_blank"
              rel="noopener noreferrer"
            >
              990원으로 전체 리포트 열기
            </a>
          ) : (
            <>
              <button type="button" className="btn-primary" disabled style={{ opacity: 0.6, cursor: 'default' }}>
                990원으로 전체 리포트 열기
              </button>
              <p style={{ fontSize: 11, color: 'var(--navy-muted)', marginTop: 8 }}>
                결제 기능 오픈 준비 중이에요.
              </p>
            </>
          )}
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
    </main>
  );
}
