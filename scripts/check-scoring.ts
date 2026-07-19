/**
 * T-02 완료 기준 검증: 샘플 응답 → 채점 결과 sanity check
 * 실행: node scripts/check-scoring.ts
 */
import { QUESTIONS } from '../lib/questions.ts';
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
check('문항 수 15~20개', QUESTIONS.length >= 15 && QUESTIONS.length <= 20);
check(
  '모든 문항에 선택지 2~4개',
  QUESTIONS.every((q) => q.options.length >= 2 && q.options.length <= 4)
);
check(
  '문항 id 중복 없음',
  new Set(QUESTIONS.map((q) => q.id)).size === QUESTIONS.length
);

const ranges = axisRanges();
console.log('\n축별 이론적 범위:');
for (const [axis, r] of Object.entries(ranges)) {
  console.log(`  ${axis}: ${r.min} ~ ${r.max}`);
  check(`${axis} 범위가 유효 (min < max)`, r.min < r.max);
}

/* 케이스 1: 자기주도·에너지형 (각 문항의 긍정 옵션 선택) */
const positive: Answers = {
  q1: 0, q2: 1, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0,
  q9: 0, q10: 0, q11: 0, q12: 0, q13: 2, q14: 0, q15: 1, q16: 0, q17: 0, q18: 1,
};
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

/* 케이스 2: 소진·과부하형 (각 문항의 부정 옵션 선택) */
const strained: Answers = {
  q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 2, q7: 1, q8: 2,
  q9: 3, q10: 3, q11: 3, q12: 3, q13: 3, q14: 3, q15: 3, q16: 2, q17: 2, q18: 2,
};
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

console.log(failed === 0 ? '\n모든 검증 통과 ✓' : `\n실패 ${failed}건 ✗`);
process.exit(failed === 0 ? 0 : 1);
