// T-07 일회용: example-gen.json → lib/example-report.ts 시드 파일 생성
const fs = require('fs');
const r = require('../example-gen.json');
const answers = {
  q1: 1, q2: 2, q3: 2, q4: 1, q5: 2, q6: 1, q7: 2, q8: 1, q9: 1,
  q10: 1, q11: 1, q12: 1, q13: 0, q14: 2, q15: 2, q16: 1, q17: 1, q18: 2,
};
const content = `/**
 * 예시 리포트 시드 (T-07) — ${r.model}로 1회 생성 후 고정.
 * 랜딩의 '예시 리포트 보기'에서 사용. 매 열람마다 LLM을 호출하지 않기 위한 고정 텍스트.
 * 재생성: 개발 서버 실행 후 node scripts/make-example.js (example-gen.json 필요)
 */
import type { Answers } from './scoring.ts';

export const EXAMPLE_ANSWERS: Answers = ${JSON.stringify(answers)};

export const EXAMPLE_REPORT_MD = ${JSON.stringify(r.markdown)};
`;
fs.writeFileSync('lib/example-report.ts', content);
console.log('written:', content.length, 'chars');
