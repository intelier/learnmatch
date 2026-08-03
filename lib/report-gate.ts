/**
 * 무료/유료 게이팅 (T-10, D-07)
 * 무료: 헤드라인·레이더(리포트 본문 밖, result-view.tsx가 항상 렌더)뿐.
 * 잠금: 리포트 본문 전체 — "한눈에 보기"부터 끝까지.
 * 잠긴 내용은 서버에서 잘라내고 클라이언트로 보내지 않는다.
 *
 * D-12: 초기 배포는 전체 무료 공개(PAYWALL_ENABLED 미설정=false)로 시작.
 * D-34: 파일럿 기간 종료 — 기본값을 유료로 뒤집었다. 환경변수를 깜빡 안 넣어도
 * 프로덕션이 조용히 무료로 돌아가지 않도록, 이제 명시적으로 'false'를 줘야만 꺼진다.
 * D-37: "한눈에 보기"·"이런 모습, 익숙하시죠?"까지 무료로 보여주던 것을
 * "한눈에 보기"부터 전부 잠그도록 앞당겼다 — 리포트 본문은 이제 미리보기가 없다.
 */

const LOCK_START = '## 한눈에 보기';

/** 결제 게이팅 활성화 여부. 기본값은 true(유료) — 'false'를 명시해야 전체 무료 공개로 돌아간다. */
export function isPaywallEnabled(): boolean {
  return process.env.PAYWALL_ENABLED !== 'false';
}

export interface GatedReport {
  /** 무료 구간 마크다운 */
  free: string;
  /** 잠금 구간 마크다운 (없으면 null — v1 리포트 등, 또는 무료 배포 기간) */
  locked: string | null;
  /** 잠긴 섹션 제목 목록 (티저 표시용) */
  lockedSections: string[];
}

export function splitReport(markdown: string): GatedReport {
  if (!isPaywallEnabled()) {
    return { free: markdown, locked: null, lockedSections: [] };
  }
  const idx = markdown.indexOf(LOCK_START);
  if (idx === -1) {
    // v1 리포트 등 잠금 지점이 없으면: "축별로 읽어보기"부터 잠금 시도
    const fallbackIdx = markdown.indexOf('## 축별로 읽어보기');
    if (fallbackIdx === -1) return { free: markdown, locked: null, lockedSections: [] };
    return gate(markdown, fallbackIdx);
  }
  return gate(markdown, idx);
}

/** 제목에서 대시(—, -, :) 이후 부연을 제거 — 구버전 프롬프트가 헤딩에 지시문을 붙인 경우 방어 */
function cleanHeading(raw: string): string {
  return raw.split(/\s+[—–-]\s+|\s*:\s+/)[0].trim();
}

function gate(markdown: string, idx: number): GatedReport {
  const free = markdown.slice(0, idx).trim();
  const locked = markdown.slice(idx).trim();
  const lockedSections = [...locked.matchAll(/^##\s+(.+)$/gm)].map((m) =>
    cleanHeading(m[1])
  );
  return { free, locked, lockedSections };
}
