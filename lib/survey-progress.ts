/**
 * 설문 응답 유실 방지 (D-26) — 60문항 이상으로 길어져 중간 이탈 가능성이 커졌다.
 * localStorage에 실시간 저장하고, 재방문 시 "이어서 하기"로 복구한다.
 * sessionStorage(ANSWERS_STORAGE_KEY 등)는 제출 완료 후 결과 화면에만 쓰는 것과 별개 —
 * 이건 설문 "진행 중" 상태를 브라우저를 닫아도 남기기 위한 것이라 localStorage를 쓴다.
 */
import type { AgeBand } from './age-bands.ts';
import type { HagwonStatus } from './hagwon-status.ts';
import type { AxisId } from './questions.ts';
import { QUESTIONS } from './questions.ts';
import type { Answers } from './scoring.ts';

const STORAGE_KEY = 'classfit.surveyProgress';
/** 저장된 진행을 유효하다고 볼 기한 (7일) — 너무 오래된 응답은 아이 상황이 바뀌었을 수 있어 폐기. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface SavedProgress {
  /** 문항 수 스냅샷 — 문항 구조가 바뀌면(예: 65→다른 수) 옛 저장분은 폐기한다. */
  version: number;
  childName: string;
  ageBand: AgeBand;
  hagwonStatus: HagwonStatus;
  answers: Answers;
  step: number;
  triggeredAxes: AxisId[];
  savedAt: number;
}

export function saveSurveyProgress(progress: Omit<SavedProgress, 'version' | 'savedAt'>): void {
  if (typeof window === 'undefined') return;
  const full: SavedProgress = { ...progress, version: QUESTIONS.length, savedAt: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) — 조용히 무시, 진행에는 영향 없음
  }
}

/** 유효한(문항 구조 일치 + 7일 이내) 저장 진행이 있으면 반환, 없으면 null. */
export function loadSurveyProgress(): SavedProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    if (parsed.version !== QUESTIONS.length) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) return null;
    if (!parsed.answers || typeof parsed.step !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSurveyProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
}
