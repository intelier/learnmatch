'use client';

/**
 * 리포트 열람 게이트 (D-26) — 60문항을 전부 끝낸 뒤 곧바로 리포트를 쏟아내지 않고
 * "볼 준비 됐다"는 확인 한 번을 거치게 하는 화면. 결제 자체는 여기서 하지 않는다 —
 * 이 버튼을 눌러야 헤드라인·레이더(항상 무료)가 열리고, 기본적으로 켜져 있는
 * 결제 게이팅(D-34, PAYWALL_ENABLED가 'false'가 아닌 한 항상 켜짐) 아래에서 리포트
 * 본문은 "한눈에 보기"부터 전부 블러 처리되며(D-37) 실제 결제 CTA(result-view.tsx,
 * D-07)를 만난다 — 이 화면 자체는 항상 무료다.
 * `locked`는 그 잠금이 실제로 걸려 있는지에 따라 아래 안내 문구만 바꾼다.
 */

const TOC_ITEMS = ['성향 유형', '5축 레벨 해설', '재해석 인사이트', '학원 추천'];

export default function ReportGateScreen({
  childName,
  answeredCount,
  locked,
  onProceed,
}: {
  childName?: string;
  answeredCount: number;
  /** 리포트 뒷부분이 실제로 결제 잠금 상태인지 (D-32) — PAYWALL_ENABLED 여부를 반영 */
  locked: boolean;
  onProceed: () => void;
}) {
  const who = childName?.trim() || '우리 아이';

  return (
    <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
      <div className="eyebrow">리포트가 준비됐어요</div>
      <p style={{ fontFamily: 'var(--serif)', fontSize: 19, lineHeight: 1.5, margin: '0.5rem 0 1.1rem' }}>
        {who}의 {answeredCount}개 응답 분석이 끝났어요
      </p>

      <div
        style={{
          background: 'var(--ivory-dark)',
          borderRadius: 'var(--radius)',
          padding: '14px 16px',
          textAlign: 'left',
          marginBottom: '1.1rem',
        }}
      >
        <p style={{ fontSize: 12, color: 'var(--navy-muted)', marginBottom: 8 }}>
          이런 내용이 담겨 있어요
        </p>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: 13, lineHeight: 1.9 }}>
          {TOC_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p style={{ fontSize: 13, color: 'var(--navy-muted)', marginBottom: 4 }}>
        상세 리포트 <s style={{ opacity: 0.6 }}>8,000원</s>
        {locked && <> · <span style={{ color: 'var(--amber)', fontWeight: 600 }}>서비스 오픈 기념 990원</span></>}
      </p>
      <button type="button" className="btn-primary" onClick={onProceed}>
        {locked ? '무료로 미리보기 시작하기' : '무료로 리포트 열람하기'}
      </button>
      {locked && (
        <p style={{ fontSize: 11, color: 'var(--navy-muted)', marginTop: 8 }}>
          공감되는 부분까지 먼저 무료로 보여드려요 — 이어지는 해설·조언은 서비스 오픈 기념가로 열람할 수 있어요.
        </p>
      )}
    </div>
  );
}
