/**
 * "어쩌면 의외의 모습" 재해석 인사이트 매핑 (D-24)
 *
 * 어떤 응답 조합이 나오더라도 "부모님은 [흔한 오해]로 보셨을 수 있지만,
 * 사실 ○○는 [재해석]이에요" 구조의 문장이 최소 1개는 나오도록 보장한다.
 * 2축 조합 규칙(더 구체적·흥미로움) → 매칭 없으면 가장 뚜렷한 단일 축 폴백 순.
 *
 * mock(llm-mock.ts)은 이 문장을 그대로 쓰고, 실제 LLM(prompt.ts)에는
 * "재해석 후보"로 전달해 최소 1개를 녹여 쓰도록 지시한다 — 프롬프트 지침만으로는
 * 보장이 안 되던 것을 코드 레벨 매핑 테이블로 보강한 것.
 */
import type { AxisId } from './questions.ts';
import type { Scores } from './scoring.ts';

type Band = 'high' | 'mid' | 'low';

function band(normalized: number): Band {
  if (normalized >= 67) return 'high';
  if (normalized >= 34) return 'mid';
  return 'low';
}

/** 이름 뒤에 은/는 조사를 붙인다. 한글 종성 유무로 판별, 비한글은 기본값 '는'. */
function withTopic(who: string): string {
  const name = who.trim();
  const code = name.charCodeAt(name.length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) {
    return name + ((code - 0xac00) % 28 !== 0 ? '은' : '는');
  }
  return name + '는';
}

interface InsightRule {
  match: (b: (axis: AxisId) => Band) => boolean;
  text: (whoTopic: string) => string;
}

/* 2축 조합 규칙 — 실제로 "몰랐던 걸 알게 됐다"는 반응이 나왔던 패턴 위주 */
const COMBO_RULES: InsightRule[] = [
  {
    match: (b) => b('autonomy') === 'low' && b('social') === 'high',
    text: (w) =>
      `부모님은 스스로 학습을 못 하는 아이로 보셨을 수 있지만, 사실 ${w} 타인과 연결될 때 동기가 발휘되는 성향이에요 — 자율성 욕구가 관계성 욕구와 강하게 연결된 아이예요.`,
  },
  {
    match: (b) => b('zpd_strain') === 'low',
    text: (w) =>
      `부모님은 지금 배우는 내용이 딱 적당하거나 조금 버거울 거라 보셨을 수 있지만, 사실 ${w} 응답을 보면 지금보다 더 어려운 단계로 가도 충분한 상태예요.`,
  },
  {
    match: (b) => b('zpd_strain') === 'high' && b('burnout') === 'high',
    text: (w) =>
      `부모님은 그럭저럭 잘 따라간다고 보셨을 수 있지만, 사실 ${w} 수업 수준이 버거워 조용히 지쳐가고 있을 수 있어요.`,
  },
  {
    match: (b) => b('competence') === 'low' && b('autonomy') === 'high',
    text: (w) =>
      `부모님은 알아서 잘하니 걱정 없다고 보셨을 수 있지만, 사실 ${w} "잘 못하면 어쩌지"라는 불안을 혼자 삭이고 있을 수 있어요.`,
  },
  {
    match: (b) => b('burnout') === 'low' && b('zpd_strain') === 'low',
    text: (w) =>
      `부모님은 무난히 잘 하고 있다고 보셨을 수 있지만, 사실 ${w} 지금 수준이 쉬워서 지루함을 느끼고 있을 수 있어요 — 도전이 없으면 흥미가 먼저 식어요.`,
  },
  {
    match: (b) => b('competence') === 'high' && b('social') === 'low',
    text: (w) =>
      `부모님은 친구가 적어 걱정하셨을 수 있지만, 사실 ${w} 혼자만의 몰입에서 단단한 자신감을 키우는 중이에요 — 지금은 사회성보다 몰입이 성장의 연료예요.`,
  },
  {
    match: (b) => b('autonomy') === 'high' && b('zpd_strain') === 'high',
    text: (w) =>
      `부모님은 스스로 알아서 잘 해내는 아이라 안심하셨을 수 있지만, 사실 ${w} 지금 난이도가 버거운데도 그 자율성으로 힘겹게 버티고 있는 걸 수 있어요.`,
  },
  {
    match: (b) => b('social') === 'low' && b('autonomy') === 'low',
    text: (w) =>
      `부모님은 혼자 있으려 하고 의욕도 없어 보인다고 걱정하셨을 수 있지만, 사실 ${w} 신뢰할 수 있는 한 사람과의 관계가 확보되면 그 안에서 스스로 움직이기 시작하는 아이예요.`,
  },
  {
    match: (b) => b('competence') === 'low' && b('zpd_strain') === 'high',
    text: (w) =>
      `부모님은 그냥 자신감이 없는 아이라고 보셨을 수 있지만, 사실 ${w} 지금 수준 자체가 버거워서 자신감을 쌓을 기회가 부족했던 걸 수 있어요 — 난이도를 낮추면 자신감부터 돌아와요.`,
  },
  {
    match: (b) => b('competence') === 'high' && b('zpd_strain') === 'low',
    text: (w) =>
      `부모님은 그냥 순하고 무난한 아이라 보셨을 수 있지만, 사실 ${w} 지금 수준에서 이미 자신감을 다 채운 상태라 새로운 도전이 필요한 시점이에요.`,
  },
  {
    match: (b) => b('burnout') === 'high' && b('social') === 'high',
    text: (w) =>
      `부모님은 의욕이 없어졌다고 걱정하셨을 수 있지만, 사실 ${w} 관계 속 에너지가 채워지지 않아 지쳐 보이는 걸 수 있어요 — 학습량보다 함께하는 시간이 먼저예요.`,
  },
  {
    match: (b) => b('burnout') === 'high' && b('autonomy') === 'low',
    text: (w) =>
      `부모님은 게을러졌다고 느끼셨을 수 있지만, 사실 ${w} 지쳐서 스스로 시작할 힘이 남아있지 않은 걸 수 있어요 — 지금은 재촉보다 회복이 먼저예요.`,
  },
];

/* 단일 축 폴백 — 콤보 규칙이 하나도 안 맞을 때도 반드시 하나는 나오도록 보장 */
const SINGLE_FALLBACKS: Record<AxisId, Record<'high' | 'low', (whoTopic: string) => string>> = {
  autonomy: {
    high: (w) => `부모님은 손이 안 가서 편하다고만 생각하셨을 수 있지만, 사실 ${w} 스스로 방향을 정하고 싶어하는 욕구가 유난히 강한 아이예요 — 그 욕구를 존중할수록 크게 성장해요.`,
    low: (w) => `부모님은 의지가 약하다고 보셨을 수 있지만, 사실 ${w} 혼자보다 신뢰하는 사람과 함께일 때 훨씬 큰 힘을 내는 아이예요.`,
  },
  zpd_strain: {
    high: (w) => `부모님은 그냥 공부를 싫어한다고 보셨을 수 있지만, 사실 ${w} 지금 수준이 정말로 버거워서 그런 걸 수 있어요 — 난이도를 한 템포 낮추면 다시 자신감을 찾아요.`,
    low: (w) => `부모님은 무난히 따라간다고만 보셨을 수 있지만, 사실 ${w} 지금 수준을 여유롭게 넘어서 더 큰 도전이 준비된 상태예요.`,
  },
  burnout: {
    high: (w) => `부모님은 의욕이 없다고 걱정하셨을 수 있지만, 사실 ${w} 무리하지 않고 쉬어갈 때를 아는 아이예요 — 회복의 시간을 주면 다시 몰입해요.`,
    low: (w) => `부모님은 그냥 얌전하다고 보셨을 수 있지만, 사실 ${w} 배움에 대한 에너지가 지금 한창 살아있는 상태예요.`,
  },
  competence: {
    high: (w) => `부모님은 자신감이 넘친다고만 보셨을 수 있지만, 사실 ${w} 그 자신감 바탕엔 스스로 해낸 작은 성공들이 단단히 쌓여 있어요.`,
    low: (w) => `부모님은 자신감이 없다고만 걱정하셨을 수 있지만, 사실 ${w} 쉽게 자만하지 않고 자신을 냉정하게 보는 신중한 아이예요.`,
  },
  social: {
    high: (w) => `부모님은 혼자서는 안 하려 든다고 보셨을 수 있지만, 사실 ${w} 관계 속에서 에너지를 얻어야 진짜 몰입이 시작되는 아이예요.`,
    low: (w) => `부모님은 사회성이 부족한 게 아닌가 걱정하셨을 수 있지만, 사실 ${w} 혼자만의 몰입에서 자기만의 세계를 단단하게 만들어가는 아이예요.`,
  },
};

/**
 * 재해석 인사이트를 최대 `count`개 반환한다. 콤보 규칙이 매칭되면 그걸 우선하고,
 * 부족하면 편차가 가장 큰 축부터 단일 폴백으로 채운다 — 항상 최소 1개는 반환.
 */
export function pickReinterpretationInsights(scores: Scores, who: string, count = 2): string[] {
  const whoTopic = withTopic(who);
  const b = (axis: AxisId) => band(scores.axes[axis].normalized);
  const matched = COMBO_RULES.filter((r) => r.match(b)).map((r) => r.text(whoTopic));

  const results = matched.slice(0, count);
  if (results.length >= count) return results;

  const axisIds = Object.keys(scores.axes) as AxisId[];
  const byDeviation = [...axisIds].sort(
    (a, c) => Math.abs(scores.axes[c].normalized - 50) - Math.abs(scores.axes[a].normalized - 50)
  );
  for (const axis of byDeviation) {
    if (results.length >= count) break;
    const dir = scores.axes[axis].normalized >= 50 ? 'high' : 'low';
    const line = SINGLE_FALLBACKS[axis][dir](whoTopic);
    if (!results.includes(line)) results.push(line);
  }
  return results;
}
