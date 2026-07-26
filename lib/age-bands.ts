/**
 * 아이 연령대 (D-13) — 발달 단계를 리포트 서술에 반영하기 위한 입력.
 * 채점(점수 계산)에는 관여하지 않고, LLM 프롬프트에서 해석 톤에만 사용한다.
 */

export type AgeBand =
  | 'preschool'
  | 'elem_low'
  | 'elem_mid'
  | 'elem_high'
  | 'middle'
  | 'high';

export const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: 'preschool', label: '미취학 (5~7세)' },
  { id: 'elem_low', label: '초등 저학년 (1~2학년)' },
  { id: 'elem_mid', label: '초등 중학년 (3~4학년)' },
  { id: 'elem_high', label: '초등 고학년 (5~6학년)' },
  { id: 'middle', label: '중학생' },
  { id: 'high', label: '고등학생' },
];

export const AGE_BAND_LABEL: Record<AgeBand, string> = Object.fromEntries(
  AGE_BANDS.map((b) => [b.id, b.label])
) as Record<AgeBand, string>;

export function isAgeBand(value: unknown): value is AgeBand {
  return typeof value === 'string' && AGE_BANDS.some((b) => b.id === value);
}

export const CHILD_AGE_BAND_STORAGE_KEY = 'classfit.childAgeBand';
