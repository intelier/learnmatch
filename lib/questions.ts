/**
 * 클래스 핏 — 진단 문항 정의
 * (D-02: legacy 8문항의 채점 축 유지 + 확장, D-11: 18→25문항 정밀도 강화,
 *  D-13/D-14: "구체적 상황에서의 행동"을 묻는 시나리오 문항으로 재작성,
 *  D-17: 미취학 아동에게 맞지 않는 문항에 나이대별 장면 변형 추가,
 *  D-19: 부모가 겪는 대표적 갈등 장면으로 공감도 강화 — 단, 문항 문구는 중립 관찰형 유지,
 *  D-20: 문항 장면은 부모가 직접 관찰 가능해야 한다,
 *  D-21: 25→30문항, 6축(자율성·동기/학습 수준·격차/정서·번아웃/유능감/학습스타일·강점/관계·사회성)
 *        × 5문항 구조로 재편 + 학원 유무 2중 분기 도입,
 *  D-25: 채점 5축 문항에 "잘 모르겠어요" 5번째 선택지 추가 + 축당 보조 문항 1개)
 *
 * ★ 문항 재작성 규칙: 옵션의 순서와 effects 값은 그대로 두고 text/label만 바꾼다.
 *   채점 축 의미와 scripts/check-scoring.ts 검증 케이스가 그대로 유지된다.
 *   나이대 변형(`variants`)·학원유무 변형(`hagwonVariants`)도 동일 규칙 — 장면만 바뀌고
 *   effects/순서/개수는 base와 같다. 두 변형이 같은 문항에 동시에 있으면 hagwonVariants가
 *   우선 적용된다(더 좁고 구체적인 문제를 겨냥하기 때문).
 *
 * 채점 축 (legacy/learning_diagnostic_full.html 기원):
 *  - autonomy    자율성·동기  (+: 스스로 탐구 / -: 함께 끌어줄 때 잘함)
 *  - zpd_strain  학습 수준·격차 (+: 현재 수준이 버거움 / -: 쉬움·여유)
 *  - burnout     정서·번아웃  (+: 지침·회피 / -: 에너지 있음)
 *  - competence  유능감      (+: 해낼 수 있다는 믿음 / -: 자신감 부족)
 *  - social      관계·사회성  (+: 함께 배울 때 / -: 혼자가 편함)
 *  - style       학습스타일  visual | auditory | kinesthetic | reading (최빈값)
 *  - focus       깊이/넓이   deep | broad | mixed (최빈값)
 *
 * `category`는 채점과 무관한 UI/구성용 라벨이다 — style·focus를 하나로 묶어
 * "학습스타일·강점"이라는 6번째 축으로 보여주기 위한 필드(범주형 데이터라 점수화하지 않는다).
 */

import type { AgeBand } from './age-bands.ts';
import type { HagwonStatus } from './hagwon-status.ts';

export type AxisId =
  | 'autonomy'
  | 'zpd_strain'
  | 'burnout'
  | 'competence'
  | 'social';

/** 문항 상단 라벨·인터루드용 6개 카테고리. style_strength는 채점 축이 아니라 style+focus를 묶은 표시용. */
export type QuestionCategory = AxisId | 'style_strength';

export type Style = 'visual' | 'auditory' | 'kinesthetic' | 'reading';
export type Focus = 'deep' | 'broad' | 'mixed';

export interface QuestionOption {
  label: string;
  effects?: Partial<Record<AxisId, number>>;
  style?: Style;
  focus?: Focus;
  /** "아직 못 봤거나 잘 모르겠어요" — 신뢰도 낮은 응답 신호 (D-25). effects는 항상 비워둔다. */
  uncertain?: boolean;
}

/** 문항에 항상 다섯 번째로 붙는 "잘 모르겠어요" 선택지 (D-25). */
const UNCERTAIN_OPTION: QuestionOption = {
  label: '아직 못 봤거나 잘 모르겠어요',
  uncertain: true,
};

/** 나이대·학원유무별 장면 변형 — text/option label만 교체. effects/순서/개수는 base와 동일해야 한다 (D-17). */
export interface QuestionVariant {
  text: string;
  /** base options와 같은 순서·길이. 라벨 문구만 담는다. */
  options: string[];
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  category: QuestionCategory;
  variants?: Partial<Record<AgeBand, QuestionVariant>>;
  hagwonVariants?: Partial<Record<HagwonStatus, QuestionVariant>>;
}

export const AXIS_META: Record<
  AxisId,
  { label: string; positive: string; negative: string }
> = {
  // positive = 점수 높을 때, negative = 낮을 때 — 양쪽 모두 강점의 언어로 재해석 (반전 프레이밍)
  autonomy: {
    label: '자율성·동기',
    positive: '스스로 방향을 정하고 파고드는, 주체적인 아이예요',
    negative: '혼자보다 함께일 때 힘을 내는, 신뢰 속에서 배우는 아이예요',
  },
  zpd_strain: {
    label: '학습 수준·격차',
    positive: '쉬운 길에 안주하지 않고 높은 벽에 부딪쳐보는 중이에요 — 조금 낮춰주면 도전이 성취로 바뀌어요',
    negative: '지금 수준을 여유롭게 넘어서는, 더 큰 도전이 준비된 아이예요',
  },
  burnout: {
    label: '정서·번아웃',
    positive: '무리하기보다 쉬어갈 때를 아는 아이예요 — 회복의 시간을 주면 다시 몰입해요',
    negative: '배움에 에너지가 살아 있는, 지금이 몰입하기 좋은 때예요',
  },
  competence: {
    label: '유능감',
    positive: '해낼 수 있다는 믿음이 단단한 아이예요',
    negative: '쉽게 자만하지 않고 자신을 냉정히 보는 아이예요 — 작은 성공을 쌓으면 단단한 자신감이 돼요',
  },
  social: {
    label: '관계·사회성',
    positive: '함께 배울 때 힘이 나는, 관계 속에서 자라는 아이예요',
    negative: '혼자만의 몰입에서 깊이를 만드는, 자기 세계가 뚜렷한 아이예요',
  },
};

/**
 * 레벨(1~5) 숫자가 구체적으로 무엇을 뜻하는지 — 결과 화면에서 "레벨 X/5" 옆에
 * 항상 함께 표시한다 (D-24). 반전 프레이밍(D-10)을 지키되, 그 레벨에서 실제로
 * 무엇이 달라 보이는지는 구체적으로 짚는다 — "의학적 진단·즉각 개입" 같은
 * 임상적 표현은 쓰지 않는다.
 */
export const LEVEL_MEANING: Record<AxisId, [string, string, string, string, string]> = {
  autonomy: [
    '혼자보다 함께 시작할 때 훨씬 힘을 내는 시기예요',
    '옆에서 조금만 잡아주면 스스로 이어가는 편이에요',
    '상황에 따라 스스로도, 함께도 잘 해내는 균형 잡힌 시기예요',
    '이미 스스로 방향을 정하고 움직이는 편이에요',
    '자기 방식을 확실히 정하고 밀고 나가는 힘이 강해요',
  ],
  zpd_strain: [
    '지금 수준을 여유롭게 넘어서는 상태예요',
    '지금 수준에 편안하게 적응하고 있어요',
    '노력하면 닿는 적절한 도전 구간에 있어요',
    '지금 난이도가 조금씩 버겁게 느껴지기 시작했어요',
    '지금 수준이 꽤 버거워, 난이도 조정이 도움이 될 시점이에요',
  ],
  burnout: [
    '배움에 대한 에너지가 가장 활발한 상태예요',
    '대체로 안정적이고, 가끔 가벼운 피로 정도예요',
    '쉬어가는 시간이 조금 더 필요한 시점이에요',
    '지친 신호가 자주 보여, 학습량을 함께 조정해볼 때예요',
    '많이 지쳐 있어요 — 지금은 학습보다 회복과 대화가 먼저예요',
  ],
  competence: [
    '아직은 자신을 신중하게 낮춰보는 편이에요',
    '작은 성공이 조금씩 자신감으로 쌓이는 중이에요',
    '잘하는 영역과 조심스러운 영역이 함께 있는 균형 상태예요',
    '해낼 수 있다는 믿음이 꽤 단단해진 상태예요',
    '스스로에 대한 믿음이 확고하게 자리 잡았어요',
  ],
  social: [
    '혼자만의 몰입에서 깊이를 만드는 걸 가장 편안해해요',
    '혼자 있는 시간을 더 편하게 느끼는 편이에요',
    '혼자 하는 시간과 함께 하는 시간이 고루 필요해요',
    '함께할 때 몰입도가 눈에 띄게 올라가는 편이에요',
    '관계 속에서 에너지를 얻어야 진짜 힘을 내는 편이에요',
  ],
};

/** 문항 상단 라벨·인터루드에 쓰는 6개 카테고리 표시명 (D-21). */
export const CATEGORY_META: Record<QuestionCategory, { label: string }> = {
  autonomy: { label: AXIS_META.autonomy.label },
  zpd_strain: { label: AXIS_META.zpd_strain.label },
  burnout: { label: AXIS_META.burnout.label },
  competence: { label: AXIS_META.competence.label },
  social: { label: AXIS_META.social.label },
  style_strength: { label: '학습스타일·강점' },
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

function applyVariant(q: Question, v: QuestionVariant): Question {
  return {
    ...q,
    text: v.text,
    options: q.options.map((opt, i) => ({ ...opt, label: v.options[i] ?? opt.label })),
  };
}

/**
 * 나이대·학원유무에 맞는 문항 목록을 반환한다 (D-17, D-21). 변형이 없는 문항·조합은 base 그대로.
 * 둘 다 있으면 hagwonVariants가 나중에 적용돼 우선한다(더 좁은 문제를 겨냥하므로).
 * effects/순서/개수는 base와 항상 동일하므로 채점(scoring.ts)·공유코드(share.ts)는 영향받지 않는다.
 */
export function getQuestions(
  ageBand?: AgeBand | null,
  hagwonStatus?: HagwonStatus | null
): Question[] {
  return QUESTIONS.map((q) => {
    let resolved = q;
    const av = ageBand ? q.variants?.[ageBand] : undefined;
    if (av) resolved = applyVariant(resolved, av);
    const hv = hagwonStatus ? q.hagwonVariants?.[hagwonStatus] : undefined;
    if (hv) resolved = applyVariant(resolved, hv);
    return resolved;
  });
}

export const QUESTIONS: Question[] = [
  /* ══ 자율성·동기 (5) ══ */
  {
    id: 'q1',
    text: '숙제든 만들기든, 하던 것이 잘 안 풀려 막혔을 때 아이는 어떻게 하나요?',
    category: 'autonomy',
    options: [
      { label: '끝까지 혼자 해보려 해요', effects: { autonomy: 2, zpd_strain: -1 } },
      { label: '조금 생각하다 도움을 요청해요', effects: { autonomy: 1 } },
      { label: '바로 모르겠다고 포기해요', effects: { autonomy: -1, zpd_strain: 1, burnout: 1 } },
      { label: '짜증 내거나 자리를 피해요', effects: { autonomy: -2, zpd_strain: 2, burnout: 2 } },
      UNCERTAIN_OPTION,
    ],
  },
  {
    id: 'q3',
    text: '공부하기 싫다고 할 때 아이가 주로 하는 말은?',
    category: 'autonomy',
    options: [
      { label: '이걸 왜 해야 하냐며 이유를 따져요', effects: { autonomy: 2 } },
      { label: '어차피 난 못한다고 해요', effects: { competence: -2, burnout: 1 } },
      { label: '혼자 하기 싫으니 같이 하자고 해요', effects: { social: 2 } },
      { label: '아무 말 없이 그냥 안 해요', effects: { burnout: 2, competence: -1 } },
      UNCERTAIN_OPTION,
    ],
  },
  {
    id: 'q9',
    text: '주말 아침, 아무도 공부하라고 하지 않았을 때 아이는 무엇부터 하나요?',
    category: 'autonomy',
    options: [
      { label: '스스로 할 일을 정해서 시작해요', effects: { autonomy: 2 } },
      { label: '뭐부터 할지 같이 정해달라고 해요', effects: { autonomy: 1 } },
      { label: '말해주기 전까지는 시작하지 않아요', effects: { autonomy: -1 } },
      { label: '말해줘도 "이따 할게"만 반복하다 하루가 그냥 지나가요', effects: { autonomy: -1, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
  },
  {
    id: 'q10',
    text: 'TV나 책에서 아이가 모르는 단어가 나왔을 때, 아이는 어떻게 하나요?',
    category: 'autonomy',
    options: [
      { label: '스스로 찾아보거나 검색해봐요', effects: { autonomy: 2 } },
      { label: '바로 "그게 무슨 뜻이야?" 하고 물어봐요', effects: { autonomy: 1, social: 1 } },
      { label: '궁금해하다가 금방 잊어버려요', effects: {} },
      { label: '모르는 게 나와도 별 관심을 안 보여요', effects: { autonomy: -1, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      middle: {
        text: '유튜브나 일상 대화에서 모르는 말이 나왔을 때, 아이는 어떻게 하나요?',
        options: [
          '스스로 검색해서 찾아봐요',
          '바로 "그게 무슨 뜻이야?" 하고 물어봐요',
          '궁금해하다가 금방 잊어버려요',
          '모르는 말이 나와도 별 관심을 안 보여요',
        ],
      },
      high: {
        text: '유튜브나 일상 대화에서 모르는 말이 나왔을 때, 아이는 어떻게 하나요?',
        options: [
          '스스로 검색해서 찾아봐요',
          '바로 "그게 무슨 뜻이야?" 하고 물어봐요',
          '궁금해하다가 금방 잊어버려요',
          '모르는 말이 나와도 별 관심을 안 보여요',
        ],
      },
    },
  },
  {
    id: 'q26',
    text: '숙제를 여러 개 내줬을 때, 어떤 순서로 할지는 보통 누가 정하나요?',
    category: 'autonomy',
    options: [
      { label: '자기가 순서를 정해서 알아서 해요', effects: { autonomy: 2 } },
      { label: '"이거 먼저 할까?" 하고 물어보며 같이 정해요', effects: { autonomy: 1 } },
      { label: '정해줘야 그제서야 시작해요', effects: { autonomy: -1 } },
      { label: '정해줘도 이거저거 미루다 결국 부모가 다시 챙겨요', effects: { autonomy: -1, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
  },

  /* ══ 학습 수준·격차 (5) ══ */
  {
    id: 'q2',
    text: '아이가 문제를 풀다 말고 연필을 놓은 채 가만히 있는 모습, 얼마나 자주 보이나요?',
    category: 'zpd_strain',
    options: [
      { label: '거의 못 봤어요 — 막히면 바로 다음 문제로 넘어가요', effects: { zpd_strain: -2 } },
      { label: '가끔 그럴 때가 있어요', effects: {} },
      { label: '한 문제에서 한참 멈춰 있는 일이 잦아요', effects: { zpd_strain: 1 } },
      { label: '멈춰 있다가 한숨을 쉬거나 딴짓으로 새요', effects: { zpd_strain: 2, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      preschool: {
        text: '종이접기나 한글 따라 쓰기처럼 앉아서 하는 활동을 하다가, 손을 놓고 가만히 있는 모습을 얼마나 자주 보나요?',
        options: [
          '거의 못 봤어요 — 막혀도 금방 다음으로 넘어가요',
          '가끔 그럴 때가 있어요',
          '한 가지에서 한참 멈춰 있는 일이 잦아요',
          '멈춰 있다가 칭얼대거나 딴 데로 가버려요',
        ],
      },
    },
  },
  {
    id: 'q15',
    text: '아이가 문제집 한 페이지를 풀 때, 지우개를 쓰는 정도는 어떤가요?',
    category: 'zpd_strain',
    options: [
      { label: '거의 안 써요 — 쓱쓱 풀어나가요', effects: { zpd_strain: -2 } },
      { label: '가끔 고쳐 쓰는 정도예요', effects: {} },
      { label: '자주 지우고 다시 쓰느라 페이지가 지저분해져요', effects: { zpd_strain: 1 } },
      { label: '지우다가 종이가 헤지거나 찢어질 정도예요', effects: { zpd_strain: 2, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      preschool: {
        text: '선 따라 그리기나 색칠 놀이를 할 때, 아이가 다시 하거나 그만두려는 정도는 어떤가요?',
        options: [
          '거의 안 그래요 — 쓱쓱 그려나가요',
          '가끔 다시 그리는 정도예요',
          '자주 다시 그리느라 시간이 오래 걸려요',
          '마음에 안 든다며 종이를 구기거나 울 정도예요',
        ],
      },
    },
  },
  {
    id: 'q19',
    text: '아이가 좋아하는 게임이나 유튜브의 새로운 규칙·기능을 배울 때와, 공부할 때 습득 속도를 비교하면?',
    category: 'zpd_strain',
    options: [
      { label: '게임이든 공부든 비슷하게 빠르게 배워요', effects: { zpd_strain: -2 } },
      { label: '그럭저럭 비슷해요', effects: {} },
      { label: '공부할 때 유독 오래 걸려요', effects: { zpd_strain: 1 } },
      { label: '게임은 금방 배우는데 공부는 유독 힘들어해요', effects: { zpd_strain: 2, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
  },
  {
    id: 'q20',
    text: '아이가 "이건 나한테 너무 어려운 것 같아" 같은 말을 실제로 입 밖에 낸 적이 있나요?',
    category: 'zpd_strain',
    options: [
      { label: '그런 말을 하는 걸 거의 들어본 적이 없어요', effects: { zpd_strain: -2 } },
      { label: '아주 가끔, 정말 어려운 것 앞에서만요', effects: {} },
      { label: '종종 그런 말을 해요', effects: { zpd_strain: 1 } },
      { label: '자주 그렇게 말하며 힘들어해요', effects: { zpd_strain: 2, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
  },
  {
    id: 'q27',
    text: '정해진 분량(문제집 몇 페이지, 학습지 등)을 마치는 데 걸리는 시간은 평소 예상보다 어떤가요?',
    category: 'zpd_strain',
    options: [
      { label: '예상보다 빨리 끝내요', effects: { zpd_strain: -2 } },
      { label: '예상한 만큼 걸려요', effects: {} },
      { label: '예상보다 오래 걸려요', effects: { zpd_strain: 1 } },
      { label: '끝까지 못 끝내고 남기는 날이 많아요', effects: { zpd_strain: 2, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
  },

  /* ══ 정서·번아웃 (5) ══ */
  {
    id: 'q5',
    text: '평일 아침, 아이를 깨울 때의 모습은 어떤가요?',
    category: 'burnout',
    options: [
      { label: '부르면 금방 일어나 스스로 준비를 시작해요', effects: { burnout: -2 } },
      { label: '몇 번 부르면 일어나 무리 없이 준비해요', effects: { burnout: -1 } },
      { label: '이불 속에서 한참 못 일어나 늘 시간에 쫓겨요', effects: { burnout: 1 } },
      { label: '"오늘 안 가면 안 돼?"라며 이불을 뒤집어써요', effects: { burnout: 2 } },
      UNCERTAIN_OPTION,
    ],
  },
  {
    id: 'q14',
    text: '차 안이나 저녁 식탁에서 학원 이야기가 나왔을 때, 아이의 반응은?',
    category: 'burnout',
    options: [
      { label: '선생님이나 친구 얘기를 먼저 꺼내요', effects: { burnout: -2 } },
      { label: '물어보면 대답하는 정도예요', effects: {} },
      { label: '"그 얘기 좀 그만해"라고 해요', effects: { burnout: 1 } },
      { label: '표정이 굳거나 슬그머니 자리를 피해요', effects: { burnout: 2 } },
      UNCERTAIN_OPTION,
    ],
    hagwonVariants: {
      none: {
        text: '차 안이나 저녁 식탁에서 요즘 배우고 있는 것(놀이·활동·책 등 무엇이든) 이야기가 나왔을 때, 아이의 반응은?',
        options: [
          '선생님이나 친구 얘기를 먼저 꺼내요',
          '물어보면 대답하는 정도예요',
          '"그 얘기 좀 그만해"라고 해요',
          '표정이 굳거나 슬그머니 자리를 피해요',
        ],
      },
    },
  },
  {
    id: 'q18',
    text: '시험 전날 밤, 아이의 모습은 어떤가요?',
    category: 'burnout',
    options: [
      { label: '평소와 다르지 않게 자요', effects: { competence: 1 } },
      { label: '조금 더 보고 자겠다며 스스로 챙겨요', effects: { competence: 1, autonomy: 1 } },
      { label: '잠을 설치거나 배가 아프다고 해요', effects: { competence: -1, burnout: 1 } },
      { label: '시험 얘기를 꺼내지도 못하게 해요', effects: { autonomy: -1, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      preschool: {
        text: '어린이집·유치원 재롱잔치나 발표 활동을 앞둔 전날 밤, 아이의 모습은 어떤가요?',
        options: [
          '평소와 다르지 않게 자요',
          '내일 뭘 할지 스스로 챙기며 준비해요',
          '잠을 설치거나 배가 아프다고 해요',
          '그 얘기를 꺼내지도 못하게 해요',
        ],
      },
      elem_low: {
        text: '받아쓰기 시험이나 발표가 있는 전날 밤, 아이의 모습은 어떤가요?',
        options: [
          '평소와 다르지 않게 자요',
          '한 번 더 연습하고 자겠다며 스스로 챙겨요',
          '잠을 설치거나 배가 아프다고 해요',
          '그 얘기를 꺼내지도 못하게 해요',
        ],
      },
    },
  },
  {
    id: 'q21',
    text: '요즘 아이가 몸이 안 좋다는 이유로 공부나 학원을 피하려는 적이 있나요?',
    category: 'burnout',
    options: [
      { label: '전혀 없어요', effects: { burnout: -2 } },
      { label: '가끔 피곤하다고는 해요', effects: { burnout: -1 } },
      { label: '몸이 안 좋다며 미루는 일이 종종 있어요', effects: { burnout: 1 } },
      { label: '자주 아프다고 하며 공부를 피해요', effects: { burnout: 2 } },
      UNCERTAIN_OPTION,
    ],
    hagwonVariants: {
      none: {
        text: '요즘 아이가 몸이 안 좋다는 이유로 해야 할 일이나 배우는 활동을 피하려는 적이 있나요?',
        options: [
          '전혀 없어요',
          '가끔 피곤하다고는 해요',
          '몸이 안 좋다며 미루는 일이 종종 있어요',
          '자주 아프다고 하며 피해요',
        ],
      },
    },
  },
  {
    id: 'q22',
    text: '친구와 다투거나 야단맞은 날처럼 속상한 일이 있었던 날, 아이가 기분을 회복하는 데 걸리는 시간은 보통 어느 정도인가요?',
    category: 'burnout',
    options: [
      { label: '그날 안에 금방 훌훌 털어내요', effects: { burnout: -2 } },
      { label: '하루 정도 지나면 괜찮아져요', effects: {} },
      { label: '며칠은 기분이 가라앉아 있어요', effects: { burnout: 1 } },
      { label: '한번 가라앉으면 꽤 오래가요', effects: { burnout: 2 } },
      UNCERTAIN_OPTION,
    ],
  },

  /* ══ 유능감 (5) ══ */
  {
    id: 'q4',
    text: '빨간 색연필로 틀린 표시가 그어진 시험지를 아이에게 건넸을 때, 아이의 첫 행동은?',
    category: 'competence',
    options: [
      { label: '어디서 틀렸는지부터 찾아봐요', effects: { competence: 2 } },
      { label: '잠깐 시무룩하다가 다시 들여다봐요', effects: { competence: 1 } },
      { label: '점수만 확인하고 덮어버려요', effects: { competence: -2 } },
      { label: '안 보이는 곳에 치우거나 구겨버려요', effects: { competence: -2, burnout: 2 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      preschool: {
        text: '블록이나 퍼즐을 잘못 끼워서 다시 해야 한다고 알려줬을 때, 아이의 첫 행동은?',
        options: [
          '어디가 잘못됐는지부터 다시 살펴봐요',
          '잠깐 시무룩하다가 다시 만져봐요',
          '"그냥 이대로 할래" 하며 넘어가려 해요',
          '화내며 던지거나 안 하겠다고 해요',
        ],
      },
      elem_low: {
        text: '빨간펜으로 틀린 표시가 된 받아쓰기 공책이나 학습지를 아이에게 보여줬을 때, 아이의 첫 행동은?',
        options: [
          '어디가 틀렸는지부터 다시 봐요',
          '잠깐 시무룩하다가 다시 들여다봐요',
          '점수만 보고 덮어버려요',
          '안 보이는 곳에 치우거나 구겨버려요',
        ],
      },
    },
  },
  {
    id: 'q11',
    text: '새 학기 첫날, 처음 받아온 교과서를 아이가 어떻게 하나요?',
    category: 'competence',
    options: [
      { label: '먼저 넘겨보며 뭘 배우는지 궁금해해요', effects: { competence: 2 } },
      { label: '슬쩍 보긴 하는데 별말은 없어요', effects: { competence: 1 } },
      { label: '두께나 어려워 보이는 부분을 보고 걱정부터 해요', effects: { competence: -1, zpd_strain: 1 } },
      { label: '가방에서 꺼내지도 않아요', effects: { competence: -2, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      preschool: {
        text: '새 학기 첫날, 유치원(어린이집)에서 처음 받아온 새 책이나 활동 꾸러미를 아이가 어떻게 하나요?',
        options: [
          '먼저 펼쳐보며 뭐가 들었는지 궁금해해요',
          '슬쩍 보긴 하는데 별말은 없어요',
          '낯선 활동을 보고 걱정부터 해요',
          '가방에서 꺼내지도 않으려 해요',
        ],
      },
    },
  },
  {
    id: 'q12',
    text: '아이가 유난히 좋은 점수를 받아온 날, 아이가 가장 먼저 하는 말은?',
    category: 'competence',
    options: [
      { label: '"다음엔 더 어려운 것도 해볼래"', effects: { competence: 2, autonomy: 1 } },
      { label: '"나 잘했지?" 하며 자랑해요', effects: { competence: 1 } },
      { label: '"이번엔 문제가 쉬웠어"라고 해요', effects: { competence: -1 } },
      { label: '"다음에도 이만큼 해야 되는 거야?"라며 부담스러워해요', effects: { competence: -1, burnout: 1 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      preschool: {
        text: '유치원(어린이집) 선생님께 칭찬 스티커를 유난히 많이 받아온 날, 아이가 가장 먼저 하는 말은?',
        options: [
          '"다음엔 더 어려운 것도 해볼래"',
          '"나 잘했지?" 하며 자랑해요',
          '"이번엔 쉬웠어"라고 해요',
          '"다음에도 이만큼 잘해야 되는 거야?"라며 부담스러워해요',
        ],
      },
    },
  },
  {
    id: 'q25',
    text: '어려운 과제를 앞두고 아이가 스스로에 대해 하는 말은?',
    category: 'competence',
    options: [
      { label: '"나 이거 할 수 있을 것 같아"', effects: { competence: 2 } },
      { label: '별 말 없이 일단 시도해요', effects: { competence: 1 } },
      { label: '"나 이런 거 잘 못하는데"', effects: { competence: -1 } },
      { label: '"나는 원래 이런 거 못해"라며 미리 선을 그어요', effects: { competence: -2 } },
      UNCERTAIN_OPTION,
    ],
  },
  {
    id: 'q28',
    text: '한 번도 안 해본 새로운 것(자전거, 줄넘기, 처음 보는 보드게임 규칙 등)을 해보자고 하면, 아이의 첫 반응은?',
    category: 'competence',
    options: [
      { label: '"재밌겠다" 하며 바로 해봐요', effects: { competence: 2 } },
      { label: '조금 망설이다 시도해요', effects: { competence: 1 } },
      { label: '"나 이런 거 잘 못하는데" 하며 주저해요', effects: { competence: -1 } },
      { label: '"안 해, 못할 것 같아" 하며 아예 거부해요', effects: { competence: -2 } },
      UNCERTAIN_OPTION,
    ],
  },

  /* ══ 학습스타일·강점 (5, 범주형: style/focus) ══ */
  {
    id: 'q6',
    text: '조립 설명서가 든 장난감이나 가구를 아이와 함께 만든다면, 아이는 먼저 무엇을 하나요?',
    category: 'style_strength',
    options: [
      { label: '그림 설명서를 뚫어져라 들여다봐요', style: 'visual' },
      { label: '"이거 어떻게 하는 거야?" 하고 물어보며 해요', style: 'auditory' },
      { label: '설명서는 제쳐두고 일단 손으로 맞춰봐요', style: 'kinesthetic' },
      { label: '글로 된 설명을 처음부터 차근차근 읽어요', style: 'reading' },
    ],
    variants: {
      middle: {
        text: '새 전자기기나 조립 가구가 생겼을 때, 아이는 먼저 무엇을 하나요?',
        options: [
          '그림으로 된 설명서나 도식부터 들여다봐요',
          '"이거 어떻게 하는 거야?" 하고 물어보며 해요',
          '설명서는 제쳐두고 일단 만져보며 익혀요',
          '글로 된 설명서를 처음부터 차근차근 읽어요',
        ],
      },
      high: {
        text: '새 전자기기나 조립 가구가 생겼을 때, 아이는 먼저 무엇을 하나요?',
        options: [
          '그림으로 된 설명서나 도식부터 들여다봐요',
          '"이거 어떻게 하는 거야?" 하고 물어보며 해요',
          '설명서는 제쳐두고 일단 만져보며 익혀요',
          '글로 된 설명서를 처음부터 차근차근 읽어요',
        ],
      },
    },
  },
  {
    id: 'q16',
    text: '아이가 무언가를 설명할 때 주로 어떻게 하나요?',
    category: 'style_strength',
    options: [
      { label: '그림이나 표로 그려서 보여줘요', style: 'visual' },
      { label: '말로 조리 있게 이야기해요', style: 'auditory' },
      { label: '직접 해 보이면서 설명해요', style: 'kinesthetic' },
      { label: '적어 놓은 것을 보여줘요', style: 'reading' },
    ],
  },
  {
    id: 'q8',
    text: '아이 방을 한번 둘러본다면, 아이의 물건들은 어떤 모습인가요?',
    category: 'style_strength',
    options: [
      { label: '한 가지 주제(공룡·아이돌·자동차 등) 물건이 잔뜩 모여 있어요', focus: 'deep' },
      { label: '여러 분야 물건이 조금씩 골고루 있어요', focus: 'broad' },
      { label: '시기마다 빠지는 게 확 바뀌어 흔적이 층층이 쌓여 있어요', focus: 'mixed' },
      { label: '딱히 눈에 띄는 패턴은 없어요', focus: 'mixed' },
    ],
  },
  {
    id: 'q17',
    text: '아이가 무언가에 새로 꽂혔을 때(공룡·게임·아이돌·만들기 등), 그 뒤엔 보통 어떻게 되나요?',
    category: 'style_strength',
    options: [
      { label: '한 가지에 몇 달씩 깊게 파고들어요', focus: 'deep' },
      { label: '여러 가지에 두루 관심을 가지며 즐겨요', focus: 'broad' },
      { label: '확 불타오르다 금방 식어요', focus: 'mixed' },
      { label: '때에 따라 달라요', focus: 'mixed' },
    ],
  },
  {
    id: 'q30',
    text: '최근 있었던 재미있는 일(나들이든, 집에서 있었던 일이든)을 이야기해달라고 하면, 아이는 주로 어떻게 하나요?',
    category: 'style_strength',
    options: [
      { label: '사진이나 그림을 보면서 이야기해요', style: 'visual' },
      { label: '말로 신나게 이야기해요', style: 'auditory' },
      { label: '몸짓이나 행동으로 재연하며 이야기해요', style: 'kinesthetic' },
      { label: '일기나 메모에 적어두고 나중에 봐요', style: 'reading' },
    ],
  },

  /* ══ 관계·사회성 (5) ══ */
  {
    id: 'q7',
    text: '아이가 어려운 문제를 붙잡고 있을 때, 정답을 몰라도 그냥 "옆에 있어주는 사람"만으로 힘을 내나요?',
    category: 'social',
    options: [
      { label: '아니요, 혼자 조용히 풀 때 오히려 더 집중해요', effects: { social: -2 } },
      { label: '옆에 누군가 있으면 조금 더 편안해해요', effects: { social: 1 } },
      { label: '네, 정답을 몰라도 같이 있어주면 훨씬 힘을 내요', effects: { social: 2 } },
      { label: '누가 있든 없든 크게 상관없어해요', effects: {} },
      UNCERTAIN_OPTION,
    ],
  },
  {
    id: 'q13',
    text: '처음 간 놀이터나 아는 아이가 거의 없는 생일파티에서, 처음 30분 동안 아이는?',
    category: 'social',
    options: [
      { label: '먼저 다가가 말을 걸어요', effects: { social: 2 } },
      { label: '조금 지켜보다 자연스럽게 섞여요', effects: { social: 1 } },
      { label: '끝까지 혼자 있거나 부모 옆에 붙어 있어요', effects: { social: -2 } },
      { label: '그날 분위기나 모인 아이들에 따라 달라요', effects: {} },
      UNCERTAIN_OPTION,
    ],
    variants: {
      middle: {
        text: '명절이나 가족 모임에서 처음 보거나 오랜만에 만나는 또래(사촌 등)와 함께 있게 됐을 때, 아이는?',
        options: [
          '먼저 말을 걸며 금방 어울려요',
          '조금 지켜보다 자연스럽게 어울려요',
          '끝까지 겉돌거나 혼자 휴대폰만 봐요',
          '그날 분위기나 상대에 따라 달라요',
        ],
      },
      high: {
        text: '명절이나 가족 모임에서 처음 보거나 오랜만에 만나는 또래(사촌 등)와 함께 있게 됐을 때, 아이는?',
        options: [
          '먼저 말을 걸며 금방 어울려요',
          '조금 지켜보다 자연스럽게 어울려요',
          '끝까지 겉돌거나 혼자 휴대폰만 봐요',
          '그날 분위기나 상대에 따라 달라요',
        ],
      },
    },
  },
  {
    id: 'q23',
    text: '아이가 새로 배운 걸 가장 신나서 이야기하는 대상은 누구인가요?',
    category: 'social',
    options: [
      { label: '친구들에게 신나서 알려줘요', effects: { social: 2 } },
      { label: '부모님께 이야기해요', effects: { social: 1 } },
      { label: '누구에게도 딱히 설명하고 싶어하지 않아요', effects: { social: -1 } },
      { label: '인형이나 혼잣말로 중얼거리며 스스로 정리해요', effects: { social: -2 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      middle: {
        text: '아이가 새로 알게 된 걸 가장 신나서 이야기하는 대상은 누구인가요?',
        options: [
          '친구들에게 신나서 알려줘요',
          '부모님께 이야기해요',
          '누구에게도 딱히 설명하고 싶어하지 않아요',
          '혼잣말이나 메모로 스스로 정리해요',
        ],
      },
      high: {
        text: '아이가 새로 알게 된 걸 가장 신나서 이야기하는 대상은 누구인가요?',
        options: [
          '친구들에게 신나서 알려줘요',
          '부모님께 이야기해요',
          '누구에게도 딱히 설명하고 싶어하지 않아요',
          '혼잣말이나 메모로 스스로 정리해요',
        ],
      },
    },
  },
  {
    id: 'q24',
    text: '하교 후 "오늘 학교 어땠어?"라고 물었을 때, 아이의 대답은?',
    category: 'social',
    options: [
      { label: '묻기도 전에 먼저 쏟아내요', effects: { social: 2 } },
      { label: '"재밌었어" 하며 몇 가지 얘기해줘요', effects: { social: 1 } },
      { label: '"그냥 뭐" 하고 끝나요', effects: { social: -1 } },
      { label: '"몰라" 하고 방으로 들어가요', effects: { social: -2 } },
      UNCERTAIN_OPTION,
    ],
    variants: {
      preschool: {
        text: '하원 후 "오늘 유치원(어린이집)에서 뭐 했어?"라고 물었을 때, 아이의 대답은?',
        options: [
          '묻기도 전에 먼저 쏟아내요',
          '"재밌었어" 하며 몇 가지 얘기해줘요',
          '"그냥 뭐" 하고 끝나요',
          '"몰라" 하고 방으로 들어가요',
        ],
      },
    },
  },
  {
    id: 'q29',
    text: '형제자매나 친구와 함께 만들기·게임·역할놀이를 할 때, 아이는 자기 역할을 어떻게 하나요?',
    category: 'social',
    options: [
      { label: '자기가 나서서 이끌거나 역할을 맡아요', effects: { social: 2 } },
      { label: '맡은 몫은 무난하게 해요', effects: { social: 1 } },
      { label: '있는 듯 없는 듯 조용히 있어요', effects: { social: -1 } },
      { label: '같이 하는 것 자체를 불편해해요', effects: { social: -2 } },
      UNCERTAIN_OPTION,
    ],
  },
];

/**
 * 보조 문항 (D-25) — 한 축에서 "잘 모르겠어요"가 2회 이상 나오면 그 축에 한해
 * 더 일상적인 장면(놀이·식사·옷 고르기 등)으로 같은 성향을 다시 물어본다.
 * 기본 30문항엔 포함되지 않고 `app/survey/page.tsx`가 조건부로 삽입한다.
 * id를 `sup_`로 시작해 base 문항 id와 절대 겹치지 않게 한다.
 * `scoring.ts`가 `ALL_SCORABLE_QUESTIONS`(= QUESTIONS + 이 배열)로 채점하므로
 * 보통은 응답이 없어 raw 합산에 0을 더할 뿐 — 안 보여준 사용자에게 영향 없다.
 */
export const SUPPLEMENTARY_QUESTIONS: Question[] = [
  {
    id: 'sup_autonomy',
    text: '옷을 고르거나 놀이를 정할 때, 아이는 보통 어떻게 하나요?',
    category: 'autonomy',
    options: [
      { label: '자기가 입고 싶은 옷·하고 싶은 놀이를 스스로 정해요', effects: { autonomy: 2 } },
      { label: '몇 가지 중에 고르라고 하면 스스로 골라요', effects: { autonomy: 1 } },
      { label: '정해줘야 그대로 따라요', effects: { autonomy: -1 } },
      { label: '정해줘도 계속 다른 걸 하겠다며 미뤄요', effects: { autonomy: -1, burnout: 1 } },
    ],
  },
  {
    id: 'sup_zpd_strain',
    text: '퍼즐이나 블록처럼 단계가 있는 놀이를 할 때, 아이가 지금 하는 단계는 어때 보이나요?',
    category: 'zpd_strain',
    options: [
      { label: '너무 쉬워서 금방 지루해해요', effects: { zpd_strain: -2 } },
      { label: '적당히 재미있어하며 몰입해요', effects: {} },
      { label: '가끔 어려워하지만 시도는 해요', effects: { zpd_strain: 1 } },
      { label: '너무 어려워서 금방 포기해요', effects: { zpd_strain: 2, burnout: 1 } },
    ],
  },
  {
    id: 'sup_burnout',
    text: '저녁 시간, 하루를 마무리할 때 아이의 전반적인 기운은 어떤가요?',
    category: 'burnout',
    options: [
      { label: '저녁까지도 에너지가 넘쳐요', effects: { burnout: -2 } },
      { label: '적당히 지쳐 있지만 무난해요', effects: { burnout: -1 } },
      { label: '많이 지쳐 보이고 예민해요', effects: { burnout: 1 } },
      { label: '아무것도 하기 싫어하며 축 처져 있어요', effects: { burnout: 2 } },
    ],
  },
  {
    id: 'sup_competence',
    text: '새로운 놀이 규칙을 처음 배울 때, 아이는 스스로에 대해 어떻게 말하거나 행동하나요?',
    category: 'competence',
    options: [
      { label: '금방 익혀서 또래에게 알려주기도 해요', effects: { competence: 2 } },
      { label: '몇 번 해보면 곧잘 따라해요', effects: { competence: 1 } },
      { label: '잘 못 따라가면 금방 시무룩해져요', effects: { competence: -1 } },
      { label: '해보기도 전에 "나 못해"라고 해요', effects: { competence: -2 } },
    ],
  },
  {
    id: 'sup_social',
    text: '밥을 먹거나 놀이를 할 때, 아이가 더 편하게 느끼는 쪽은 어느 쪽인가요?',
    category: 'social',
    options: [
      { label: '누군가와 함께일 때 훨씬 편하고 즐거워해요', effects: { social: 2 } },
      { label: '같이 있으면 조금 더 편해해요', effects: { social: 1 } },
      { label: '혼자 있을 때 더 편하고 자기 세계에 몰입해요', effects: { social: -2 } },
      { label: '누가 있든 없든 크게 신경 안 써요', effects: {} },
    ],
  },
];
