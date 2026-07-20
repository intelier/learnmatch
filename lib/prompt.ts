/**
 * 리포트 생성 프롬프트 v1 (T-04)
 * 실제 Claude 호출(T-05)과 mock이 같은 입력을 공유한다.
 */
import { QUESTIONS } from './questions.ts';
import { describeScores, type Answers, type Scores } from './scoring.ts';

export const PROMPT_VERSION = 'v2';

export interface ReportInput {
  answers: Answers;
  scores: Scores;
}

export function buildSystemPrompt(): string {
  return [
    '너는 아동 학습심리(자기결정성이론, 근접발달영역)를 바탕으로 학부모에게 아이의 학습 성향을 설명해 주는 리포트 작성자야.',
    '',
    '지켜야 할 것:',
    '- 대상 독자는 학부모. 따뜻한 존댓말로, 아이를 평가하지 말고 이해를 돕는 톤으로 쓴다.',
    '- 부모가 설문에서 고른 실제 행동을 인용해 "우리 아이 얘기 같다"고 느끼게 쓴다.',
    '- 단정 대신 경향으로 말한다. ("~한 편이에요", "~일 수 있어요")',
    '- 의학적·심리학적 진단 표현(진단명, 장애, 치료 등)은 절대 쓰지 않는다.',
    '- 아이의 부족한 면은 반드시 "어떻게 도와줄 수 있는지"와 함께 말한다.',
    '- 리포트의 백미는 의외성이다: 겉으로 보이는 행동 뒤의 다른 속마음을 짚어줄 때 부모는 아이를 새로 이해하게 된다. 반드시 채점 축의 조합에서 근거를 찾고, 지어내지 않는다.',
    '',
    '출력 형식 (마크다운):',
    '## 한눈에 보기 — 3~4문장 요약',
    '## 이런 모습, 익숙하시죠? — 설문 응답 속 행동 2~3개를 구체적 장면으로',
    '## 어쩌면 의외의 모습 — "부모님 보시기에는 ~하지만, 실제로는 ~일 수 있어요" 문형으로, 서로 다른 축의 조합에서 드러나는 의외의 해석 1~2가지. 예: 겉으론 잘 따라가지만 속으로 지쳐 있을 가능성(수준 부담↑+소진↑), 혼자 하기 싫어하는 게 아니라 함께일 때 힘이 나는 것(사회성↑) 등. 반드시 가설 톤으로.',
    '## 축별로 읽어보기 — 자기주도성·수준 부담·소진 신호·유능감·사회성 각각 2~3문장',
    '## 이렇게 도와주세요 — 실천 가능한 제안 3가지',
    '## 학원을 고른다면 — 성향에 맞는 수업 형태·분위기 팁',
  ].join('\n');
}

export function buildUserPrompt(input: ReportInput): string {
  const answerLines = QUESTIONS.map((q) => {
    const idx = input.answers[q.id];
    const opt = idx !== undefined ? q.options[idx] : undefined;
    return opt ? `- ${q.text} → "${opt.label}"` : null;
  }).filter(Boolean);

  return [
    '다음 진단 결과로 아이 학습 성향 리포트를 작성해 줘.',
    '',
    `[성향 요약] ${input.scores.headline}`,
    '',
    '[채점 결과]',
    describeScores(input.scores),
    '',
    '[설문 응답 (부모가 고른 아이의 실제 모습)]',
    ...answerLines,
  ].join('\n');
}
