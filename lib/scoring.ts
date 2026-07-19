/**
 * 채점 로직 — legacy computeProfile() 방식 유지:
 * 수치 축은 효과값 합산, style/focus는 최빈값.
 * 확장: 문항 데이터에서 축별 이론적 min/max를 산출해 0~100 정규화 + 1~5 레벨 제공.
 */
import {
  AXIS_META,
  FOCUS_LABEL,
  QUESTIONS,
  STYLE_LABEL,
  type AxisId,
  type Focus,
  type Style,
} from './questions.ts';

/** 문항 id → 선택한 옵션 index */
export type Answers = Record<string, number>;

/** 설문 → 결과 화면 전달용 sessionStorage 키 */
export const ANSWERS_STORAGE_KEY = 'classfit.answers';

export interface AxisScore {
  raw: number;
  min: number;
  max: number;
  /** 0~100 (min~max 구간 정규화) */
  normalized: number;
  /** 1~5 */
  level: number;
}

export interface Scores {
  axes: Record<AxisId, AxisScore>;
  style: Style;
  focus: Focus;
  /** 리포트 헤드라인 (legacy 규칙 유지) */
  headline: string;
  answeredCount: number;
}

const AXIS_IDS = Object.keys(AXIS_META) as AxisId[];

/** 문항 데이터로부터 축별 이론적 범위 산출 (문항 추가·수정 시 자동 반영) */
export function axisRanges(): Record<AxisId, { min: number; max: number }> {
  const ranges = {} as Record<AxisId, { min: number; max: number }>;
  for (const axis of AXIS_IDS) ranges[axis] = { min: 0, max: 0 };
  for (const q of QUESTIONS) {
    for (const axis of AXIS_IDS) {
      const values = q.options.map((o) => o.effects?.[axis] ?? 0);
      ranges[axis].min += Math.min(...values);
      ranges[axis].max += Math.max(...values);
    }
  }
  return ranges;
}

function mode<T extends string>(counts: Partial<Record<T, number>>, fallback: T): T {
  let best = fallback;
  let bestCount = 0;
  for (const [key, count] of Object.entries(counts) as [T, number][]) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

export function scoreAnswers(answers: Answers): Scores {
  const raw = {} as Record<AxisId, number>;
  for (const axis of AXIS_IDS) raw[axis] = 0;
  const styleCounts: Partial<Record<Style, number>> = {};
  const focusCounts: Partial<Record<Focus, number>> = {};
  let answeredCount = 0;

  for (const q of QUESTIONS) {
    const idx = answers[q.id];
    const opt = idx !== undefined ? q.options[idx] : undefined;
    if (!opt) continue;
    answeredCount++;
    if (opt.effects) {
      for (const [axis, delta] of Object.entries(opt.effects) as [AxisId, number][]) {
        raw[axis] += delta;
      }
    }
    if (opt.style) styleCounts[opt.style] = (styleCounts[opt.style] ?? 0) + 1;
    if (opt.focus) focusCounts[opt.focus] = (focusCounts[opt.focus] ?? 0) + 1;
  }

  const ranges = axisRanges();
  const axes = {} as Record<AxisId, AxisScore>;
  for (const axis of AXIS_IDS) {
    const { min, max } = ranges[axis];
    const span = max - min || 1;
    const normalized = Math.round(((raw[axis] - min) / span) * 100);
    const level = Math.min(5, Math.max(1, Math.round((normalized / 100) * 4) + 1));
    axes[axis] = { raw: raw[axis], min, max, normalized, level };
  }

  const style = mode(styleCounts, 'visual');
  const focus = mode(focusCounts, 'mixed');
  const headline = `${raw.autonomy > 0 ? '스스로 탐구하는' : '함께하며 배우는'} ${
    FOCUS_LABEL[focus]
  } 학습자`;

  return { axes, style, focus, headline, answeredCount };
}

/** LLM 프롬프트 입력용 요약 문자열 (T-04에서 사용) */
export function describeScores(scores: Scores): string {
  const lines = AXIS_IDS.map((axis) => {
    const meta = AXIS_META[axis];
    const s = scores.axes[axis];
    const tendency = s.normalized >= 50 ? meta.positive : meta.negative;
    return `- ${meta.label}: ${s.normalized}/100 (레벨 ${s.level}) — ${tendency}`;
  });
  lines.push(`- 학습스타일: ${STYLE_LABEL[scores.style]}`);
  lines.push(`- 몰입 성향: ${FOCUS_LABEL[scores.focus]}`);
  return lines.join('\n');
}
