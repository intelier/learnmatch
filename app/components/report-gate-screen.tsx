'use client';

/**
 * 리포트 열람 게이트 (D-26) — 무료/유료 섹션 분리(D-07) 대신, 60문항을 전부 끝낸
 * 뒤 "리포트를 볼지 말지"를 결정하는 단일 지점으로 결제 선택을 옮겼다.
 * 지금은 PAYWALL_ENABLED가 꺼져 있는 파일럿 기간이라 버튼을 누르면 바로 리포트로
 * 진입한다 — 나중에 결제를 붙일 때 이 컴포넌트의 버튼만 결제 버튼으로 바꾸면 된다.
 * (D-07의 부분 잠금 로직 자체는 report-gate.ts에 그대로 남겨뒀다 — 이 화면과는
 * 별개로, PAYWALL_ENABLED를 켜면 리포트 본문 내부 잠금도 동시에 살아난다.)
 */

const TOC_ITEMS = ['성향 유형', '5축 레벨 해설', '재해석 인사이트', '학원 추천'];

export default function ReportGateScreen({
  childName,
  answeredCount,
  onProceed,
}: {
  childName?: string;
  answeredCount: number;
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
      </p>
      <button type="button" className="btn-primary" onClick={onProceed}>
        파일럿 기간 무료로 열람하기
      </button>
    </div>
  );
}
