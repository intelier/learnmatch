/**
 * 학원·과외 경험 여부 (D-21) — 문항 장면을 학원 전제 없이 조정하기 위한 입력.
 * 채점에는 관여하지 않는다. age-bands.ts와 같은 패턴.
 */

export type HagwonStatus = 'has' | 'none';

export const HAGWON_STATUS_OPTIONS: { id: HagwonStatus; label: string }[] = [
  { id: 'has', label: '다니고 있어요' },
  { id: 'none', label: '아직 안 다니고 있어요' },
];

export function isHagwonStatus(value: unknown): value is HagwonStatus {
  return value === 'has' || value === 'none';
}

export const CHILD_HAGWON_STATUS_STORAGE_KEY = 'classfit.childHagwonStatus';
