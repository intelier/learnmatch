/**
 * 클래스 핏 — 진단 문항 정의
 * (D-02: legacy 8문항의 채점 축 유지 + 확장, D-11: 18→25문항 정밀도 강화,
 *  D-13/D-14: "구체적 상황에서의 행동"을 묻는 시나리오 문항으로 재작성)
 *
 * ★ 문항 재작성 규칙: 옵션의 순서와 effects 값은 그대로 두고 text/label만 바꾼다.
 *   채점 축 의미와 scripts/check-scoring.ts 검증 케이스가 그대로 유지된다.
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
  // positive = 점수 높을 때, negative = 낮을 때 — 양쪽 모두 강점의 언어로 재해석 (반전 프레이밍)
  autonomy: {
    label: '자기주도성',
    positive: '스스로 방향을 정하고 파고드는, 주체적인 아이예요',
    negative: '혼자보다 함께일 때 힘을 내는, 신뢰 속에서 배우는 아이예요',
  },
  zpd_strain: {
    label: '수준 부담',
    positive: '쉬운 길에 안주하지 않고 높은 벽에 부딪쳐보는 중이에요 — 조금 낮춰주면 도전이 성취로 바뀌어요',
    negative: '지금 수준을 여유롭게 넘어서는, 더 큰 도전이 준비된 아이예요',
  },
  burnout: {
    label: '소진 신호',
    positive: '무리하기보다 쉬어갈 때를 아는 아이예요 — 회복의 시간을 주면 다시 몰입해요',
    negative: '배움에 에너지가 살아 있는, 지금이 몰입하기 좋은 때예요',
  },
  competence: {
    label: '유능감',
    positive: '해낼 수 있다는 믿음이 단단한 아이예요',
    negative: '쉽게 자만하지 않고 자신을 냉정히 보는 아이예요 — 작은 성공을 쌓으면 단단한 자신감이 돼요',
  },
  social: {
    label: '사회성',
    positive: '함께 배울 때 힘이 나는, 관계 속에서 자라는 아이예요',
    negative: '혼자만의 몰입에서 깊이를 만드는, 자기 세계가 뚜렷한 아이예요',
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
    text: '아이가 문제를 풀다 말고 연필을 놓은 채 가만히 있는 모습, 얼마나 자주 보이나요?',
    options: [
      { label: '거의 못 봤어요 — 막히면 바로 다음 문제로 넘어가요', effects: { zpd_strain: -2 } },
      { label: '가끔 그럴 때가 있어요', effects: {} },
      { label: '한 문제에서 한참 멈춰 있는 일이 잦아요', effects: { zpd_strain: 1 } },
      { label: '멈춰 있다가 한숨을 쉬거나 딴짓으로 새요', effects: { zpd_strain: 2, burnout: 1 } },
    ],
  },
  {
    id: 'q3',
    text: '공부하기 싫다고 할 때 아이가 주로 하는 말은?',
    options: [
      { label: '이걸 왜 해야 하냐며 이유를 따져요', effects: { autonomy: 2 } },
      { label: '어차피 난 못한다고 해요', effects: { competence: -2, burnout: 1 } },
      { label: '혼자 하기 싫으니 같이 하자고 해요', effects: { social: 2 } },
      { label: '아무 말 없이 그냥 안 해요', effects: { burnout: 2, competence: -1 } },
    ],
  },
  {
    id: 'q4',
    text: '빨간 색연필로 틀린 표시가 그어진 시험지를 아이에게 건넸을 때, 아이의 첫 행동은?',
    options: [
      { label: '어디서 틀렸는지부터 찾아봐요', effects: { competence: 2 } },
      { label: '잠깐 시무룩하다가 다시 들여다봐요', effects: { competence: 1 } },
      { label: '점수만 확인하고 덮어버려요', effects: { competence: -2 } },
      { label: '안 보이는 곳에 치우거나 구겨버려요', effects: { competence: -2, burnout: 2 } },
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
    text: '조립 설명서가 든 장난감이나 가구를 아이와 함께 만든다면, 아이는 먼저 무엇을 하나요?',
    options: [
      { label: '그림 설명서를 뚫어져라 들여다봐요', style: 'visual' },
      { label: '"이거 어떻게 하는 거야?" 하고 물어보며 해요', style: 'auditory' },
      { label: '설명서는 제쳐두고 일단 손으로 맞춰봐요', style: 'kinesthetic' },
      { label: '글로 된 설명을 처음부터 차근차근 읽어요', style: 'reading' },
    ],
  },
  {
    id: 'q7',
    text: '아이가 어려운 문제를 붙잡고 있을 때, 정답을 몰라도 그냥 "옆에 있어주는 사람"만으로 힘을 내나요?',
    options: [
      { label: '아니요, 혼자 조용히 풀 때 오히려 더 집중해요', effects: { social: -2 } },
      { label: '옆에 누군가 있으면 조금 더 편안해해요', effects: { social: 1 } },
      { label: '네, 정답을 몰라도 같이 있어주면 훨씬 힘을 내요', effects: { social: 2 } },
      { label: '누가 있든 없든 크게 상관없어해요', effects: {} },
    ],
  },
  {
    id: 'q8',
    text: '아이 방을 한번 둘러본다면, 아이의 물건들은 어떤 모습인가요?',
    options: [
      { label: '한 가지 주제(공룡·아이돌·자동차 등) 물건이 잔뜩 모여 있어요', focus: 'deep' },
      { label: '여러 분야 물건이 조금씩 골고루 있어요', focus: 'broad' },
      { label: '시기마다 빠지는 게 확 바뀌어 흔적이 층층이 쌓여 있어요', focus: 'mixed' },
      { label: '딱히 눈에 띄는 패턴은 없어요', focus: 'mixed' },
    ],
  },

  /* ── 확장 10문항 (축별 문항 수 보강) ── */
  {
    id: 'q9',
    text: '주말 아침, 아무도 공부하라고 하지 않았을 때 아이는 무엇부터 하나요?',
    options: [
      { label: '스스로 할 일을 정해서 시작해요', effects: { autonomy: 2 } },
      { label: '뭐부터 할지 같이 정해달라고 해요', effects: { autonomy: 1 } },
      { label: '말해주기 전까지는 시작하지 않아요', effects: { autonomy: -1 } },
      { label: '말해줘도 미루다가 하루가 그냥 지나가요', effects: { autonomy: -1, burnout: 1 } },
    ],
  },
  {
    id: 'q10',
    text: 'TV나 책에서 아이가 모르는 단어가 나왔을 때, 아이는 어떻게 하나요?',
    options: [
      { label: '스스로 찾아보거나 검색해봐요', effects: { autonomy: 2 } },
      { label: '바로 "그게 무슨 뜻이야?" 하고 물어봐요', effects: { autonomy: 1, social: 1 } },
      { label: '궁금해하다가 금방 잊어버려요', effects: {} },
      { label: '모르는 게 나와도 별 관심을 안 보여요', effects: { autonomy: -1, burnout: 1 } },
    ],
  },
  {
    id: 'q11',
    text: '새 학기 첫날, 처음 받아온 교과서를 아이가 어떻게 하나요?',
    options: [
      { label: '먼저 넘겨보며 뭘 배우는지 궁금해해요', effects: { competence: 2 } },
      { label: '슬쩍 보긴 하는데 별말은 없어요', effects: { competence: 1 } },
      { label: '두께나 어려워 보이는 부분을 보고 걱정부터 해요', effects: { competence: -1, zpd_strain: 1 } },
      { label: '가방에서 꺼내지도 않아요', effects: { competence: -2, burnout: 1 } },
    ],
  },
  {
    id: 'q12',
    text: '아이가 유난히 좋은 점수를 받아온 날, 아이가 가장 먼저 하는 말은?',
    options: [
      { label: '"다음엔 더 어려운 것도 해볼래"', effects: { competence: 2, autonomy: 1 } },
      { label: '"나 잘했지?" 하며 자랑해요', effects: { competence: 1 } },
      { label: '"이번엔 문제가 쉬웠어"라고 해요', effects: { competence: -1 } },
      { label: '"다음에도 이만큼 해야 되는 거야?"라며 부담스러워해요', effects: { competence: -1, burnout: 1 } },
    ],
  },
  {
    id: 'q13',
    text: '아는 아이가 거의 없는 생일파티나 캠프에 갔을 때, 처음 30분 동안 아이는?',
    options: [
      { label: '먼저 다가가 말을 걸어요', effects: { social: 2 } },
      { label: '조금 지켜보다 자연스럽게 섞여요', effects: { social: 1 } },
      { label: '끝까지 혼자 있거나 부모 옆에 붙어 있어요', effects: { social: -2 } },
      { label: '그날 분위기나 모인 아이들에 따라 달라요', effects: {} },
    ],
  },
  {
    id: 'q14',
    text: '차 안이나 저녁 식탁에서 학원 이야기가 나왔을 때, 아이의 반응은?',
    options: [
      { label: '선생님이나 친구 얘기를 먼저 꺼내요', effects: { burnout: -2 } },
      { label: '물어보면 대답하는 정도예요', effects: {} },
      { label: '"그 얘기 좀 그만해"라고 해요', effects: { burnout: 1 } },
      { label: '표정이 굳거나 슬그머니 자리를 피해요', effects: { burnout: 2 } },
    ],
  },
  {
    id: 'q15',
    text: '아이가 문제집 한 페이지를 풀 때, 지우개를 쓰는 정도는 어떤가요?',
    options: [
      { label: '거의 안 써요 — 쓱쓱 풀어나가요', effects: { zpd_strain: -2 } },
      { label: '가끔 고쳐 쓰는 정도예요', effects: {} },
      { label: '자주 지우고 다시 쓰느라 페이지가 지저분해져요', effects: { zpd_strain: 1 } },
      { label: '지우다가 종이가 헤지거나 찢어질 정도예요', effects: { zpd_strain: 2, burnout: 1 } },
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
    text: '시험 전날 밤, 아이의 모습은 어떤가요?',
    options: [
      { label: '평소와 다르지 않게 자요', effects: { competence: 1 } },
      { label: '조금 더 보고 자겠다며 스스로 챙겨요', effects: { competence: 1, autonomy: 1 } },
      { label: '잠을 설치거나 배가 아프다고 해요', effects: { competence: -1, burnout: 1 } },
      { label: '시험 얘기를 꺼내지도 못하게 해요', effects: { autonomy: -1, burnout: 1 } },
    ],
  },

  /* ── 추가 확장 7문항 (18→25, D-11: 축별 정밀도 강화) ── */
  {
    id: 'q19',
    text: '아이가 좋아하는 게임이나 유튜브의 새로운 규칙·기능을 배울 때와, 공부할 때 습득 속도를 비교하면?',
    options: [
      { label: '게임이든 공부든 비슷하게 빠르게 배워요', effects: { zpd_strain: -2 } },
      { label: '그럭저럭 비슷해요', effects: {} },
      { label: '공부할 때 유독 오래 걸려요', effects: { zpd_strain: 1 } },
      { label: '게임은 금방 배우는데 공부는 유독 힘들어해요', effects: { zpd_strain: 2, burnout: 1 } },
    ],
  },
  {
    id: 'q20',
    text: '아이가 "이건 나한테 너무 어려운 것 같아" 같은 말을 실제로 입 밖에 낸 적이 있나요?',
    options: [
      { label: '그런 말을 하는 걸 거의 들어본 적이 없어요', effects: { zpd_strain: -2 } },
      { label: '아주 가끔, 정말 어려운 것 앞에서만요', effects: {} },
      { label: '종종 그런 말을 해요', effects: { zpd_strain: 1 } },
      { label: '자주 그렇게 말하며 힘들어해요', effects: { zpd_strain: 2, burnout: 1 } },
    ],
  },
  {
    id: 'q21',
    text: '요즘 아이가 몸이 안 좋다는 이유로 공부나 학원을 피하려는 적이 있나요?',
    options: [
      { label: '전혀 없어요', effects: { burnout: -2 } },
      { label: '가끔 피곤하다고는 해요', effects: { burnout: -1 } },
      { label: '몸이 안 좋다며 미루는 일이 종종 있어요', effects: { burnout: 1 } },
      { label: '자주 아프다고 하며 공부를 피해요', effects: { burnout: 2 } },
    ],
  },
  {
    id: 'q22',
    text: '속상하거나 안 좋은 일이 있었던 날, 아이가 기분을 회복하는 데 걸리는 시간은 보통 어느 정도인가요?',
    options: [
      { label: '그날 안에 금방 훌훌 털어내요', effects: { burnout: -2 } },
      { label: '하루 정도 지나면 괜찮아져요', effects: {} },
      { label: '며칠은 기분이 가라앉아 있어요', effects: { burnout: 1 } },
      { label: '한번 가라앉으면 꽤 오래가요', effects: { burnout: 2 } },
    ],
  },
  {
    id: 'q23',
    text: '아이가 새로 배운 걸 가장 신나서 이야기하는 대상은 누구인가요?',
    options: [
      { label: '친구들에게 신나서 알려줘요', effects: { social: 2 } },
      { label: '부모님께 이야기해요', effects: { social: 1 } },
      { label: '누구에게도 딱히 설명하고 싶어하지 않아요', effects: { social: -1 } },
      { label: '인형이나 혼잣말로 중얼거리며 스스로 정리해요', effects: { social: -2 } },
    ],
  },
  {
    id: 'q24',
    text: '하교 후 "오늘 학교 어땠어?"라고 물었을 때, 아이의 대답은?',
    options: [
      { label: '묻기도 전에 먼저 쏟아내요', effects: { social: 2 } },
      { label: '"재밌었어" 하며 몇 가지 얘기해줘요', effects: { social: 1 } },
      { label: '"그냥 뭐" 하고 끝나요', effects: { social: -1 } },
      { label: '"몰라" 하고 방으로 들어가요', effects: { social: -2 } },
    ],
  },
  {
    id: 'q25',
    text: '어려운 과제를 앞두고 아이가 스스로에 대해 하는 말은?',
    options: [
      { label: '"나 이거 할 수 있을 것 같아"', effects: { competence: 2 } },
      { label: '별 말 없이 일단 시도해요', effects: { competence: 1 } },
      { label: '"나 이런 거 잘 못하는데"', effects: { competence: -1 } },
      { label: '"나는 원래 이런 거 못해"라며 미리 선을 그어요', effects: { competence: -2 } },
    ],
  },
];
