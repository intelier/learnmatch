/**
 * 클래스 핏 — 진단 문항 정의 (D-02: legacy 8문항의 채점 축 유지 + 10문항 확장)
 *
 * 채점 축 (legacy/learning_diagnostic_full.html 기원):
 *  - autonomy    자기주도성  (+: 스스로 탐구 / -: 함께 끌어줄 때 잘함)
 *  - zpd_strain  수준 부담   (+: 현재 수준이 버거움 / -: 쉬움·여유)
 *  - burnout     소진 신호   (+: 지침·회피 / -: 에너지 있음)
 *  - competence  유능감      (+: 해낼 수 있다는 믿음 / -: 자신감 부족)
 *  - social      사회성      (+: 함께 배울 때 / -: 혼자가 편함)
 *  - style       학습스타일  visual | auditory | kinesthetic | reading (최빈값)
 *  - focus       깊이/넓이   deep | broad | mixed (최빈값)
 */

export type AxisId =
  | 'autonomy'
  | 'zpd_strain'
  | 'burnout'
  | 'competence'
  | 'social';

export type Style = 'visual' | 'auditory' | 'kinesthetic' | 'reading';
export type Focus = 'deep' | 'broad' | 'mixed';

export interface QuestionOption {
  label: string;
  effects?: Partial<Record<AxisId, number>>;
  style?: Style;
  focus?: Focus;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

export const AXIS_META: Record<
  AxisId,
  { label: string; positive: string; negative: string }
> = {
  autonomy: {
    label: '자기주도성',
    positive: '스스로 계획하고 파고드는 힘이 있어요',
    negative: '옆에서 함께 끌어줄 때 더 잘해요',
  },
  zpd_strain: {
    label: '수준 부담',
    positive: '지금 학습 수준이 아이에게 버거워요',
    negative: '지금 수준을 여유 있게 소화하고 있어요',
  },
  burnout: {
    label: '소진 신호',
    positive: '지쳐 있다는 신호가 보여요',
    negative: '배움에 에너지가 있어요',
  },
  competence: {
    label: '유능감',
    positive: '해낼 수 있다는 믿음이 단단해요',
    negative: '자신감을 회복할 경험이 필요해요',
  },
  social: {
    label: '사회성',
    positive: '함께 배울 때 힘이 나요',
    negative: '혼자 몰입할 때 편안해요',
  },
};

export const STYLE_LABEL: Record<Style, string> = {
  visual: '눈으로 보며 배우는',
  auditory: '듣고 이야기하며 배우는',
  kinesthetic: '직접 해보며 배우는',
  reading: '읽고 정리하며 배우는',
};

export const FOCUS_LABEL: Record<Focus, string> = {
  deep: '몰입형',
  broad: '폭넓은',
  mixed: '유연한',
};

export const QUESTIONS: Question[] = [
  /* ── legacy 8문항 (효과값 원본 유지) ── */
  {
    id: 'q1',
    text: '모르는 문제가 나오면 아이는 어떻게 하나요?',
    options: [
      { label: '끝까지 혼자 해보려 해요', effects: { autonomy: 2, zpd_strain: -1 } },
      { label: '조금 생각하다 도움을 요청해요', effects: { autonomy: 1 } },
      { label: '바로 모르겠다고 포기해요', effects: { autonomy: -1, zpd_strain: 1, burnout: 1 } },
      { label: '짜증 내거나 자리를 피해요', effects: { autonomy: -2, zpd_strain: 2, burnout: 2 } },
    ],
  },
  {
    id: 'q2',
    text: '지금 수업 수준이 아이에게 어느 정도라고 느끼나요?',
    options: [
      { label: '너무 쉬워해요', effects: { zpd_strain: -2 } },
      { label: '적당한 것 같아요', effects: {} },
      { label: '조금 어려워하지만 따라가요', effects: { zpd_strain: 1 } },
      { label: '많이 어려워하고 힘들어해요', effects: { zpd_strain: 2, burnout: 1 } },
    ],
  },
  {
    id: 'q3',
    text: '공부하기 싫다고 할 때 아이가 주로 하는 말은?',
    options: [
      { label: '이게 왜 필요해요? (이유를 따짐)', effects: { autonomy: 2 } },
      { label: '어차피 난 못해요 (자신감 부족)', effects: { competence: -2, burnout: 1 } },
      { label: '혼자 하기 싫어요 (같이 하고 싶음)', effects: { social: 2 } },
      { label: '말 없이 그냥 안 해요', effects: { burnout: 2, competence: -1 } },
    ],
  },
  {
    id: 'q4',
    text: '틀린 문제를 다시 만났을 때 아이의 반응은?',
    options: [
      { label: '다시 해볼게요 하고 시도해요', effects: { competence: 2 } },
      { label: '속상해하다가 다시 해요', effects: { competence: 1 } },
      { label: '난 역시 못해 라고 해요', effects: { competence: -2 } },
      { label: '그 과목 자체를 피하려 해요', effects: { competence: -2, burnout: 2 } },
    ],
  },
  {
    id: 'q5',
    text: '학원 다녀온 날 아이 표정은요?',
    options: [
      { label: '에너지 있고 뭔가 이야기해요', effects: { burnout: -2 } },
      { label: '조용하지만 괜찮아 보여요', effects: { burnout: -1 } },
      { label: '피곤해하고 말이 없어요', effects: { burnout: 1 } },
      { label: '짜증내거나 예민해요', effects: { burnout: 2 } },
    ],
  },
  {
    id: 'q6',
    text: '새로운 것을 배울 때 아이가 가장 좋아하는 방식은?',
    options: [
      { label: '그림, 영상, 도표로 보는 것', style: 'visual' },
      { label: '설명을 듣고 이야기하는 것', style: 'auditory' },
      { label: '직접 만들고 해보는 것', style: 'kinesthetic' },
      { label: '읽고 정리하는 것', style: 'reading' },
    ],
  },
  {
    id: 'q7',
    text: '아이가 공부할 때 선호하는 환경은?',
    options: [
      { label: '조용히 혼자', effects: { social: -2 } },
      { label: '옆에 누군가 있을 때', effects: { social: 1 } },
      { label: '친구와 함께', effects: { social: 2 } },
      { label: '상관없어요', effects: {} },
    ],
  },
  {
    id: 'q8',
    text: '아이가 깊이 파고드는 편인가요, 폭넓게 하는 편인가요?',
    options: [
      { label: '한 가지에 완전히 빠져요 (깊이형)', focus: 'deep' },
      { label: '여러 가지를 골고루 좋아해요 (넓이형)', focus: 'broad' },
      { label: '상황에 따라 달라요', focus: 'mixed' },
      { label: '아직 잘 모르겠어요', focus: 'mixed' },
    ],
  },

  /* ── 확장 10문항 (축별 문항 수 보강) ── */
  {
    id: 'q9',
    text: '숙제나 공부 계획은 주로 누가 세우나요?',
    options: [
      { label: '아이가 스스로 정해요', effects: { autonomy: 2 } },
      { label: '같이 의논해서 정해요', effects: { autonomy: 1 } },
      { label: '부모가 정해줘야 해요', effects: { autonomy: -1 } },
      { label: '정해줘도 잘 안 지켜져요', effects: { autonomy: -1, burnout: 1 } },
    ],
  },
  {
    id: 'q10',
    text: '아이에게 궁금한 것이 생기면 어떻게 하나요?',
    options: [
      { label: '책이나 영상을 스스로 찾아봐요', effects: { autonomy: 2 } },
      { label: '부모나 선생님에게 이것저것 물어봐요', effects: { autonomy: 1, social: 1 } },
      { label: '궁금해하다가 금방 잊어요', effects: {} },
      { label: '궁금한 게 잘 안 생기는 편이에요', effects: { autonomy: -1, burnout: 1 } },
    ],
  },
  {
    id: 'q11',
    text: '새로운 단원이나 과목을 시작할 때 아이는?',
    options: [
      { label: '재밌겠다며 기대해요', effects: { competence: 2 } },
      { label: '조금 긴장하지만 시작해요', effects: { competence: 1 } },
      { label: '어려울 것 같다고 걱정부터 해요', effects: { competence: -1, zpd_strain: 1 } },
      { label: '시작 자체를 미루거나 피해요', effects: { competence: -2, burnout: 1 } },
    ],
  },
  {
    id: 'q12',
    text: '잘했다고 칭찬을 들었을 때 아이는?',
    options: [
      { label: '더 어려운 것에 도전하려 해요', effects: { competence: 2, autonomy: 1 } },
      { label: '기분 좋아하고 즐거워해요', effects: { competence: 1 } },
      { label: '운이 좋았다며 잘 안 믿어요', effects: { competence: -1 } },
      { label: '칭찬을 부담스러워해요', effects: { competence: -1, burnout: 1 } },
    ],
  },
  {
    id: 'q13',
    text: '모둠 활동이나 그룹 수업에서 아이는?',
    options: [
      { label: '주도하면서 신나 해요', effects: { social: 2 } },
      { label: '어울리지만 앞에 나서진 않아요', effects: { social: 1 } },
      { label: '혼자 하는 걸 더 편해해요', effects: { social: -2 } },
      { label: '멤버나 상황에 따라 달라요', effects: {} },
    ],
  },
  {
    id: 'q14',
    text: '요즘 공부나 학원 얘기를 꺼내면 아이는?',
    options: [
      { label: '자연스럽게 자기 얘기를 해요', effects: { burnout: -2 } },
      { label: '물어보면 대답하는 정도예요', effects: {} },
      { label: '하기 싫다는 말을 자주 해요', effects: { burnout: 1 } },
      { label: '얘기 자체를 피하거나 예민해져요', effects: { burnout: 2 } },
    ],
  },
  {
    id: 'q15',
    text: '학교·학원 숙제를 할 때 아이는?',
    options: [
      { label: '금방 끝내고 시간이 남아요', effects: { zpd_strain: -2 } },
      { label: '제 시간에 무리 없이 끝내요', effects: {} },
      { label: '오래 걸리지만 어떻게든 끝내요', effects: { zpd_strain: 1 } },
      { label: '붙잡고 있어도 못 끝낼 때가 많아요', effects: { zpd_strain: 2, burnout: 1 } },
    ],
  },
  {
    id: 'q16',
    text: '아이가 무언가를 설명할 때 주로 어떻게 하나요?',
    options: [
      { label: '그림이나 표로 그려서 보여줘요', style: 'visual' },
      { label: '말로 조리 있게 이야기해요', style: 'auditory' },
      { label: '직접 해 보이면서 설명해요', style: 'kinesthetic' },
      { label: '적어 놓은 것을 보여줘요', style: 'reading' },
    ],
  },
  {
    id: 'q17',
    text: '좋아하는 놀이나 취미가 생기면 아이는?',
    options: [
      { label: '한 가지에 오래 깊게 빠져요', focus: 'deep' },
      { label: '이것저것 다양하게 즐겨요', focus: 'broad' },
      { label: '금방 흥미가 식는 편이에요', focus: 'mixed' },
      { label: '때에 따라 달라요', focus: 'mixed' },
    ],
  },
  {
    id: 'q18',
    text: '시험이나 평가를 앞두면 아이는?',
    options: [
      { label: '담담하게 준비해요', effects: { competence: 1 } },
      { label: '긴장하지만 스스로 준비해요', effects: { competence: 1, autonomy: 1 } },
      { label: '불안해하며 예민해져요', effects: { competence: -1, burnout: 1 } },
      { label: '아예 신경 쓰지 않으려 해요', effects: { autonomy: -1, burnout: 1 } },
    ],
  },
];
