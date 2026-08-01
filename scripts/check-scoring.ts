/**
 * T-02 완료 기준 검증: 샘플 응답 → 채점 결과 sanity check
 * 실행: node scripts/check-scoring.ts
 */
import { CATEGORY_META, QUESTIONS, SUPPLEMENTARY_QUESTIONS, type AxisId, type QuestionCategory } from '../lib/questions.ts';
import { axisRanges, describeScores, scoreAnswers, type Answers } from '../lib/scoring.ts';

let failed = 0;
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failed++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

console.log(`문항 수: ${QUESTIONS.length}`);
check('문항 수 정확히 65개 (D-26: 채점 5축×12 + 학습스타일·강점 5)', QUESTIONS.length === 65);
check(
  '모든 문항에 선택지 2~5개 (D-25: "잘 모르겠어요" 포함 시 5개)',
  QUESTIONS.every((q) => q.options.length >= 2 && q.options.length <= 5)
);
check(
  '채점 축 문항(60개)엔 전부 "잘 모르겠어요" 옵션이 있다 (D-25)',
  QUESTIONS.filter((q) => q.category !== 'style_strength').every((q) =>
    q.options.some((o) => o.uncertain)
  )
);
check(
  '문항 id 중복 없음',
  new Set(QUESTIONS.map((q) => q.id)).size === QUESTIONS.length
);

console.log('\n카테고리별 문항 수 (D-26: 채점 5축 12개씩, 학습스타일·강점 5개):');
const categoryCounts = {} as Record<QuestionCategory, number>;
for (const q of QUESTIONS) categoryCounts[q.category] = (categoryCounts[q.category] ?? 0) + 1;
for (const [category, meta] of Object.entries(CATEGORY_META)) {
  const count = categoryCounts[category as QuestionCategory] ?? 0;
  const expected = category === 'style_strength' ? 5 : 12;
  console.log(`  ${meta.label}: ${count}`);
  check(`${meta.label} 정확히 ${expected}문항`, count === expected, `got ${count}`);
}

console.log('\n보조문항 (D-25):');
check('축당 1개, 총 5개', SUPPLEMENTARY_QUESTIONS.length === 5);
check(
  '5축을 정확히 하나씩 커버',
  new Set(SUPPLEMENTARY_QUESTIONS.map((q) => q.category)).size === 5
);
check(
  '모두 4개 선택지 + uncertain 옵션 없음(보조문항은 항상 실답)',
  SUPPLEMENTARY_QUESTIONS.every((q) => q.options.length === 4 && q.options.every((o) => !o.uncertain))
);

const ranges = axisRanges();
console.log('\n축별 이론적 범위:');
for (const [axis, r] of Object.entries(ranges)) {
  console.log(`  ${axis}: ${r.min} ~ ${r.max}`);
  check(`${axis} 범위가 유효 (min < max)`, r.min < r.max);
}

/**
 * 65문항 전체를 손으로 나열하지 않고, 설계 관례(index0 = 그 문항에서 가장 긍정적인
 * 방향, 마지막 비-uncertain index = 가장 부정적인 방향)로 자동 생성한다.
 * q3·q7처럼 옵션 순서가 예외인 소수 legacy 문항이 있지만, 축당 12문항으로 늘어나
 * 전체 방향성 검증(>=70/<=30 등)엔 영향이 없다.
 */
function answersAt(pickIndex: (q: (typeof QUESTIONS)[number]) => number): Answers {
  const a: Answers = {};
  for (const q of QUESTIONS) a[q.id] = pickIndex(q);
  return a;
}

/* 케이스 1: 자기주도·에너지형 (각 문항에서 가장 긍정적인 옵션 선택) */
const positive: Answers = answersAt(() => 0);
const p = scoreAnswers(positive);
console.log('\n[케이스 1: 자기주도형]', p.headline);
console.log(describeScores(p));
check('전 문항 응답 인식', p.answeredCount === QUESTIONS.length, `got ${p.answeredCount}`);
check('자기주도성 높음 (>=70)', p.axes.autonomy.normalized >= 70, `got ${p.axes.autonomy.normalized}`);
check('소진 낮음 (<=30)', p.axes.burnout.normalized <= 30, `got ${p.axes.burnout.normalized}`);
check('유능감 높음 (>=70)', p.axes.competence.normalized >= 70, `got ${p.axes.competence.normalized}`);
check('스타일 visual (q6+q16)', p.style === 'visual', `got ${p.style}`);
check('포커스 deep (q8+q17)', p.focus === 'deep', `got ${p.focus}`);
check('헤드라인에 "스스로 탐구하는" 포함', p.headline.includes('스스로 탐구하는'));

/* 케이스 2: 소진·과부하형 (각 문항에서 가장 부정적인 옵션 선택 — uncertain 옵션 제외) */
const strained: Answers = answersAt((q) => {
  const withoutUncertain = q.options.length - (q.options.some((o) => o.uncertain) ? 1 : 0);
  return withoutUncertain - 1;
});
const s = scoreAnswers(strained);
console.log('\n[케이스 2: 소진형]', s.headline);
console.log(describeScores(s));
check('소진 높음 (>=80)', s.axes.burnout.normalized >= 80, `got ${s.axes.burnout.normalized}`);
check('수준 부담 높음 (>=80)', s.axes.zpd_strain.normalized >= 80, `got ${s.axes.zpd_strain.normalized}`);
check('자기주도성 낮음 (<=30)', s.axes.autonomy.normalized <= 30, `got ${s.axes.autonomy.normalized}`);
check('헤드라인에 "함께하며 배우는" 포함', s.headline.includes('함께하며 배우는'));

/* 케이스 3: 부분 응답 (절반만) */
const partial: Answers = { q1: 1, q2: 2, q5: 2, q6: 1, q8: 1 };
const pt = scoreAnswers(partial);
console.log('\n[케이스 3: 부분 응답]');
check('부분 응답 수 인식', pt.answeredCount === 5, `got ${pt.answeredCount}`);
check('정규화 0~100 범위 유지', Object.values(pt.axes).every((a) => a.normalized >= 0 && a.normalized <= 100));
check('레벨 1~5 범위 유지', Object.values(pt.axes).every((a) => a.level >= 1 && a.level <= 5));

/* 케이스 4: 자율성 축에서 "잘 모르겠어요" 2회 + 보조문항 응답 (D-25) */
const autonomyIds = QUESTIONS.filter((q) => q.category === 'autonomy').map((q) => q.id);
const uncertainIdx = (id: string) => QUESTIONS.find((q) => q.id === id)!.options.length - 1;
const withUncertain: Answers = {
  ...positive,
  [autonomyIds[0]]: uncertainIdx(autonomyIds[0]),
  [autonomyIds[1]]: uncertainIdx(autonomyIds[1]),
};
const beforeSup = scoreAnswers(withUncertain);
console.log('\n[케이스 4: 잘 모르겠어요 2회 → 보조문항 전]');
check('자율성 답변수 10으로 감소', beforeSup.axes.autonomy.answeredCount === 10, `got ${beforeSup.axes.autonomy.answeredCount}`);

const withSupplement: Answers = { ...withUncertain, sup_autonomy: 0 };
const afterSup = scoreAnswers(withSupplement);
console.log('[케이스 4: 보조문항 응답 후]');
check('자율성 답변수 11로 복구', afterSup.axes.autonomy.answeredCount === 11, `got ${afterSup.axes.autonomy.answeredCount}`);
check(
  '다른 축 답변수는 그대로(12)',
  (['zpd_strain', 'burnout', 'competence', 'social'] as AxisId[]).every(
    (axis) => afterSup.axes[axis].answeredCount === 12
  )
);

console.log(failed === 0 ? '\n모든 검증 통과 ✓' : `\n실패 ${failed}건 ✗`);
process.exit(failed === 0 ? 0 : 1);
