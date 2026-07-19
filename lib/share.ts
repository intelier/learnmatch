/**
 * 공유 링크 v1 (T-06) — 무상태 인코딩.
 * DB 없이 응답 전체를 URL 코드로 표현한다: 문항 순서대로 선택 index를 이어붙인 숫자열.
 * M2(T-09)에서 diagnoses.share_token 기반으로 교체 예정.
 */
import { QUESTIONS } from './questions.ts';
import type { Answers } from './scoring.ts';

/** 전 문항 응답 → 공유 코드. 미완성 응답이면 null. */
export function encodeAnswers(answers: Answers): string | null {
  const digits: string[] = [];
  for (const q of QUESTIONS) {
    const idx = answers[q.id];
    if (idx === undefined || idx < 0 || idx >= q.options.length) return null;
    digits.push(String(idx));
  }
  return digits.join('');
}

/** 공유 코드 → 응답. 형식이 맞지 않으면 null. */
export function decodeAnswers(code: string): Answers | null {
  if (!/^\d+$/.test(code) || code.length !== QUESTIONS.length) return null;
  const answers: Answers = {};
  for (let i = 0; i < QUESTIONS.length; i++) {
    const idx = Number(code[i]);
    if (idx >= QUESTIONS[i].options.length) return null;
    answers[QUESTIONS[i].id] = idx;
  }
  return answers;
}
