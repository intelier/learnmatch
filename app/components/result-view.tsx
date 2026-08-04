'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { AgeBand } from '@/lib/age-bands';
import type { HagwonStatus } from '@/lib/hagwon-status';
import {
  AXIS_META,
  AXIS_SCALE_NOTE,
  FOCUS_LABEL,
  LEVEL_MEANING,
  STRAIN_AXES,
  STYLE_LABEL,
  type AxisId,
} from '@/lib/questions';
import {
  buildCheckoutUrl,
  GROBLE_SINGLE_URL,
  isPaymentReady,
} from '@/lib/groble';
import { scoreAnswers, type Answers } from '@/lib/scoring';
import { encodeAnswers } from '@/lib/share';
import RadarChart from './radar-chart';
import ReportGateScreen from './report-gate-screen';
import ReportLoading from './report-loading';
import ReportView from './report-view';

type ReportState =
  | { status: 'loading' }
  | { status: 'done'; markdown: string; locked: boolean; lockedSections: string[] }
  | { status: 'error' };

type ShareState = 'idle' | 'copied' | 'manual';

export default function ResultView({
  answers,
  childName,
  childAgeBand,
  childHagwonStatus,
  isSharedView = false,
  initialReport,
  hideShare = false,
  initialShareToken,
  initialLocked = false,
  initialLockedSections = [],
}: {
  answers: Answers;
  /** 아이 이름 (선택) — 헤드라인 개인화 + API 전달 */
  childName?: string;
  /** 아이 연령대 (선택, D-13) — 발달 단계 반영 + API 전달 */
  childAgeBand?: AgeBand;
  /** 학원·과외 여부 (선택, D-21) — "학원을 고른다면" 섹션 톤 분기 + API 전달 */
  childHagwonStatus?: HagwonStatus;
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
  // 리포트 열람 게이트 (D-26) — 실시간 생성된 리포트만 게이트를 거친다. 미리 준비된
  // 리포트(공유 링크, 예시 페이지)는 initialReport로 들어오므로 게이트 없이 바로 보여준다.
  const [gatePassed, setGatePassed] = useState(Boolean(initialReport));

  useEffect(() => {
    if (initialReport) return;
    let cancelled = false;
    setReport({ status: 'loading' });
    fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, childName, childAgeBand, hagwonStatus: childHagwonStatus }),
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
  }, [answers, childName, childAgeBand, childHagwonStatus, initialReport]);

  // 채점 5축 응답 수 합계 (D-26) — "잘 모르겠어요" 제외, 보조문항 포함, 보통 60
  const scoredAnsweredCount = (Object.keys(AXIS_META) as AxisId[]).reduce(
    (sum, axis) => sum + scores.axes[axis].answeredCount,
    0
  );

  const sharePath = shareToken ?? shareCode;
  const shareUrl = sharePath
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${sharePath}`
    : null;

  /**
   * 공유 (D-25) — 모바일에서는 navigator.share()로 OS 공유 시트를 띄운다.
   * 카카오톡 정식 SDK 연동(전용 앱키 필요, Groble처럼 별도 등록 필요)은 아직
   * 없지만, 이 방식으로도 모바일 OS 공유 시트에 카카오톡이 공유 대상으로 뜬다.
   * 미지원 환경(주로 데스크톱)은 클립보드 복사로 폴백.
   */
  async function shareReport() {
    if (!shareUrl) return;
    const text = childName
      ? `${childName}의 학습 성향 진단 결과를 확인해 보세요`
      : '우리 아이 학습 성향 진단 결과를 확인해 보세요';
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: '클래스 핏 — 학습 성향 진단', text, url: shareUrl });
      } catch {
        // 사용자가 공유 시트를 취소한 경우 등 — 별도 처리 없이 종료
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      setShare('copied');
      setTimeout(() => setShare('idle'), 2500);
    } catch {
      setShare('manual');
    }
  }

  return (
    <main>
      <div style={{ textAlign: 'center', margin: '1.5rem 0 2rem' }}>
        <div className="eyebrow">
          {childName ? `${childName} 학습 성향 진단 결과` : '학습 성향 진단 결과'}
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 24, lineHeight: 1.4 }}>
          {childName ? `${childName}는 ` : ''}
          {scores.headline}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--navy-muted)', marginTop: 6 }}>
          {STYLE_LABEL[scores.style]} 방식이 잘 맞고, {FOCUS_LABEL[scores.focus]}{' '}
          성향이에요.
        </p>
        <p style={{ fontSize: 11, color: 'var(--navy-muted)', marginTop: 8 }}>
          {scoredAnsweredCount}개 응답 · 5개 영역 · 영역당 12문항 교차 측정
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
        {/* 숫자를 만점 대비 점수로 오해하지 않게 하는 안내 (D-27) */}
        <p
          style={{
            fontSize: 12,
            color: 'var(--navy-muted)',
            marginBottom: '1rem',
          }}
        >
          아래 숫자는 잘하고 못하고의 점수가 아니라, 지금 아이가 어느 쪽에 가까운지를
          보여줘요. 축마다 높은 쪽이 뜻하는 게 다릅니다.
        </p>
        {(Object.keys(AXIS_META) as AxisId[]).map((axis) => {
          const meta = AXIS_META[axis];
          const s = scores.axes[axis];
          const isStrain = STRAIN_AXES.includes(axis);
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
                <div
                  className={isStrain ? 'axis-fill axis-fill-strain' : 'axis-fill'}
                  style={{ width: `${s.normalized}%` }}
                />
              </div>
              {/* 이 축에서 숫자가 커진다는 게 무슨 뜻인지 (D-27) */}
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--navy-muted)',
                  marginTop: 4,
                }}
              >
                {AXIS_SCALE_NOTE[axis]}
              </p>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isStrain ? 'var(--navy-light)' : 'var(--amber)',
                  marginTop: 2,
                }}
              >
                {LEVEL_MEANING[axis][s.level - 1]}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--navy-muted)',
                  marginTop: 2,
                }}
              >
                {s.normalized >= 50 ? meta.positive : meta.negative}
              </p>
            </div>
          );
        })}
      </div>

      {report.status === 'loading' && <ReportLoading scores={scores} childName={childName} />}
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
      {report.status === 'done' && !gatePassed && (
        <ReportGateScreen
          childName={childName}
          answeredCount={scoredAnsweredCount}
          locked={report.locked}
          onProceed={() => setGatePassed(true)}
        />
      )}
      {report.status === 'done' && gatePassed && (
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
      {report.status === 'done' && gatePassed && report.locked && (
        <div
          className="card"
          style={{
            borderColor: 'var(--amber-border)',
            background: 'var(--amber-light)',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            {childName ? `${childName}의` : '우리 아이의'} 상세한 리포트를
            통해 자녀의 의외의 모습을 만나보세요!
          </p>
          <p style={{ fontSize: 13, color: 'var(--navy-light)', marginBottom: 10, lineHeight: 1.6 }}>
            교육심리학 이론으로 읽어낸 <b>강점 재해석</b>과, 오늘 바로 써먹는{' '}
            <b>맞춤 조언·학원 고르는 법</b>까지 —
            <br />
            잔소리 대신 아이에게 맞는 방법을 찾는 지도가 돼요.
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
              서비스 오픈 기념 990원으로 전체 리포트 열기
            </a>
          ) : (
            <>
              <button type="button" className="btn-primary" disabled style={{ opacity: 0.6, cursor: 'default' }}>
                서비스 오픈 기념 990원으로 전체 리포트 열기
              </button>
              <p style={{ fontSize: 11, color: 'var(--navy-muted)', marginTop: 8 }}>
                결제 기능 오픈 준비 중이에요.
              </p>
            </>
          )}
          <p style={{ fontSize: 11, color: 'var(--navy-muted)', marginTop: 8 }}>
            정가 8,000원 예정 · 지금은 서비스 오픈 기념가로 열람할 수 있어요.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!hideShare && shareUrl && (
          <button
            type="button"
            className={isSharedView ? 'btn-secondary' : 'btn-primary'}
            onClick={shareReport}
          >
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
        {isSharedView && (
          <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, margin: '4px 0 0' }}>
            이 진단, 우리 아이는 어떨까요?
          </p>
        )}
        <Link className={isSharedView ? 'btn-primary' : 'btn-secondary'} href="/survey">
          {isSharedView ? '나도 우리 아이 진단해보기' : '다시 진단하기'}
        </Link>
      </div>
    </main>
  );
}
