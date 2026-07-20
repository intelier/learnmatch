/**
 * 무료/유료 게이팅 (T-10, D-07)
 * 무료: 헤드라인·레이더·"한눈에 보기"·"이런 모습, 익숙하시죠?"
 * 잠금: "어쩌면 의외의 모습"부터 끝까지.
 * 잠긴 내용은 서버에서 잘라내고 클라이언트로 보내지 않는다.
 */

const LOCK_START = '## 어쩌면 의외의 모습';

export interface GatedReport {
  /** 무료 구간 마크다운 */
  free: string;
  /** 잠금 구간 마크다운 (없으면 null — v1 리포트 등) */
  locked: string | null;
  /** 잠긴 섹션 제목 목록 (티저 표시용) */
  lockedSections: string[];
}

export function splitReport(markdown: string): GatedReport {
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
