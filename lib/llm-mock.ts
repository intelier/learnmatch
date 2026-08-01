/**
 * mock 리포트 어댑터 — API 키 없이 동작.
 * 실제 LLM과 같은 입력(ReportInput)을 받아 채점 결과 기반 서술형 리포트를 조립한다.
 */
import { AGE_BAND_LABEL } from './age-bands.ts';
import { pickReinterpretationInsights } from './insights.ts';
import { AXIS_META, FOCUS_LABEL, getQuestions, STYLE_LABEL, SUPPLEMENTARY_QUESTIONS, type AxisId } from './questions.ts';
import type { ReportInput } from './prompt.ts';

type Band = 'high' | 'mid' | 'low';

function band(normalized: number): Band {
  if (normalized >= 67) return 'high';
  if (normalized >= 34) return 'mid';
  return 'low';
}

// 부모가 걱정하던 행동을 강점의 언어로 재해석 (반전 프레이밍) + 실천 힌트
const AXIS_NARRATIVE: Record<AxisId, Record<Band, string>> = {
  autonomy: {
    high: '"말을 잘 안 듣는다"고 느끼셨다면, 실은 자기 방향을 스스로 정하려는 주체성이 강한 아이예요. 명령보다 선택권을 주면 그 힘이 몰입으로 바뀌어요.',
    mid: '스스로 하려는 마음과 함께하고 싶은 마음이 같이 있어요. 시작은 곁에서 잡아주고 마무리는 아이에게 맡기는 위임이 잘 맞아요.',
    low: '"혼자서는 안 한다"기보다, 신뢰하는 사람과 함께일 때 힘을 내는 아이예요. 관계 속에서 배우는 이 성향을 활용해 함께 계획을 세워보세요.',
  },
  zpd_strain: {
    high: '"버거워한다"기보다, 쉬운 길에 안주하지 않고 높은 벽에 부딪쳐보는 중이에요. 난이도를 살짝 낮춰 성공을 맛보게 하면 그 도전정신이 성취로 이어져요.',
    mid: '지금 수준은 아이가 노력하면 닿는 적절한 도전 구간이에요. 버거워하는 신호가 늘면 한 템포만 늦춰주세요.',
    low: '지금 수준을 여유롭게 넘어서는, 더 큰 도전이 준비된 아이예요. 살짝 어려운 과제가 지루함 없는 성장을 만들어줘요.',
  },
  burnout: {
    high: '"의욕이 없어 보인다"기보다, 무리하기 전에 쉬어갈 때를 아는 자기 보호가 작동하는 거예요. 지금은 학습량보다 회복이 먼저 — 공부 밖 대화 시간을 늘려보세요.',
    mid: '에너지가 넘치지도 소진되지도 않은 균형 상태예요. 좋아하는 활동과 학습의 지금 균형을 그대로 지켜주세요.',
    low: '배움에 에너지가 살아 있어요. 새로운 것을 시작하기 좋은 때예요.',
  },
  competence: {
    high: '해낼 수 있다는 믿음이 단단한 아이예요. 결과보다 과정을 짚어주는 칭찬이 이 믿음을 오래 지켜줘요.',
    mid: '자신 있는 영역과 움츠러드는 영역이 함께 있어요. 잘하는 것에서 얻은 자신감이 약한 쪽으로 옮겨가도록 연결해 주세요.',
    low: '"자신감이 없다"기보다, 쉽게 자만하지 않고 자신을 냉정하게 보는 아이예요. 아주 작게 쪼갠 과제로 "됐다!" 경험을 쌓으면 그 신중함이 단단한 자신감이 돼요.',
  },
  social: {
    high: '함께 배울 때 힘이 나는, 관계 속에서 자라는 아이예요. 소그룹이나 또래와 서로 설명해 주는 수업에서 실력이 잘 자라요.',
    mid: '혼자 하는 시간과 함께 하는 시간이 모두 필요해요. 상황에 따라 유연하게 오가는 환경이 잘 맞아요.',
    low: '"혼자만 논다"기보다, 자기만의 몰입에서 깊이를 만드는 뚜렷한 세계를 가진 아이예요. 조용히 자기 속도로 파고들 수 있는 환경을 먼저 살펴보세요.',
  },
};

// 신뢰도를 위한 축별 이론 연결 (D-16). 축마다 딱 한 문장.
const AXIS_THEORY: Record<AxisId, string> = {
  autonomy: '자기결정성이론(SDT)에서 말하는 자율성 욕구와 맞닿아 있어요.',
  zpd_strain: '근접발달영역(ZPD) 개념으로 설명되는 지점이에요.',
  burnout: '학업 소진 연구에서 조기 신호로 보는 부분이에요.',
  competence: '자기결정성이론(SDT)의 유능감 욕구와 관련이 있어요.',
  social: '자기결정성이론(SDT)의 관계성 욕구가 여기서 드러나요.',
};

/** 설문에서 고른 실제 행동을 장면으로 인용 (우리 아이 얘기 같게). "잘 모르겠어요"는 effects가 없어 자동으로 제외된다. */
function pickScenes(input: ReportInput, count: number): string[] {
  const scenes: string[] = [];
  const pool = [...getQuestions(input.childAgeBand, input.hagwonStatus), ...SUPPLEMENTARY_QUESTIONS];
  for (const q of pool) {
    const idx = input.answers[q.id];
    const opt = idx !== undefined ? q.options[idx] : undefined;
    if (!opt || !opt.effects) continue;
    const weight = Object.values(opt.effects).reduce((a, b) => a + Math.abs(b), 0);
    if (weight >= 2) scenes.push(`${q.text.replace(/\?$/, '')} — "${opt.label}"를 고르셨어요.`);
  }
  return scenes.slice(0, count);
}

export function generateMockReport(input: ReportInput): string {
  const { scores } = input;
  const axisIds = Object.keys(AXIS_META) as AxisId[];
  const strongest = [...axisIds].sort(
    (a, b) => scores.axes[b].normalized - scores.axes[a].normalized
  );

  const tips: string[] = [];
  if (band(scores.axes.burnout.normalized) === 'high')
    tips.push('**회복이 먼저예요.** 이번 주는 학습량을 늘리지 말고, 공부와 무관한 대화 시간을 하루 10분 만들어 보세요.');
  if (band(scores.axes.zpd_strain.normalized) === 'high')
    tips.push('**수준을 한 템포 낮춰 성공 경험부터.** 지금보다 살짝 쉬운 과제에서 "할 수 있다"를 다시 느끼게 해주세요.');
  if (band(scores.axes.zpd_strain.normalized) === 'low')
    tips.push('**도전 과제를 하나 더해 보세요.** 지금 수준이 여유로워서, 흥미를 끌 만한 심화 과제가 지루함을 막아줘요.');
  if (band(scores.axes.autonomy.normalized) === 'high')
    tips.push('**선택권을 주세요.** "오늘 뭐부터 할래?" 같은 작은 선택이 아이의 몰입 스위치가 돼요.');
  if (band(scores.axes.autonomy.normalized) === 'low')
    tips.push('**함께 시작하고, 마무리는 아이에게.** 처음 5분만 옆에 앉아 함께 출발해 주세요.');
  if (band(scores.axes.competence.normalized) === 'low')
    tips.push('**과제를 아주 작게 쪼개 주세요.** "됐다!"는 경험이 잦을수록 자신감이 돌아와요.');
  const fallbackTips = [
    `**${STYLE_LABEL[scores.style]} 방식을 활용하세요.** 아이가 가장 잘 흡수하는 통로예요.`,
    '**결과보다 과정을 칭찬해 주세요.** "여기까지 해냈네"라는 말이 다음 도전의 연료가 돼요.',
    '**하루 공부의 시작 신호를 정해 보세요.** 같은 시간, 같은 자리에서 시작하면 진입 장벽이 낮아져요.',
  ];
  for (const tip of fallbackTips) {
    if (tips.length >= 3) break;
    tips.push(tip);
  }

  const academyTips: string[] = [];
  academyTips.push(
    input.hagwonStatus === 'none'
      ? '- 처음 학원을 고른다면, 아래 기준을 상담 때 그대로 물어보세요.'
      : '- 지금 다니는 곳이 이 성향과 잘 맞는지, 아래 기준으로 점검해 보세요.'
  );
  const social = band(scores.axes.social.normalized);
  academyTips.push(
    social === 'high'
      ? '- 또래와 상호작용이 많은 **협동 활동 중심 소그룹 수업**이 잘 맞아요.'
      : social === 'low'
        ? '- 경쟁·비교보다 **개별 진도·소규모 환경**을 우선 살펴보세요.'
        : '- 협동 활동과 개별 학습이 **혼합된 형태**가 무난하게 잘 맞아요.'
  );
  academyTips.push(
    band(scores.axes.burnout.normalized) === 'high'
      ? '- 숙제·테스트 관리가 강한 곳보다 **아이 속도를 기다려주는 곳**이 지금은 좋아요.'
      : '- 상담 때 "아이가 힘들어할 때 어떻게 하시나요?"를 꼭 물어보세요.'
  );
  academyTips.push(`- ${STYLE_LABEL[scores.style]} 활동(수업 방식)이 있는지 확인해 보세요.`);

  const scenes = pickScenes(input, 4);

  const who = input.childName?.trim() || '우리 아이';
  // "부모님은 ~로 보셨을 수 있지만, 사실 ○○는 ~예요" 재해석 인사이트 — 항상 최소 1개 보장 (D-24)
  const insights = pickReinterpretationInsights(scores, who, 2);
  const ageNote = input.childAgeBand
    ? ` (${AGE_BAND_LABEL[input.childAgeBand]} 시기의 발달 단계를 함께 고려했어요.)`
    : '';
  return [
    '## 한눈에 보기',
    `${scores.headline}인 ${who}.${ageNote} ${STYLE_LABEL[scores.style]} 방식으로 배울 때 이해가 가장 잘 되고, ${FOCUS_LABEL[scores.focus]} 성향이에요. 지금 ${who}에게 가장 두드러지는 축은 **${AXIS_META[strongest[0]].label}**이에요. ${AXIS_NARRATIVE[strongest[0]][band(scores.axes[strongest[0]].normalized)]}`,
    '',
    '## 이런 모습, 익숙하시죠?',
    ...(scenes.length
      ? scenes.map((s) => `- ${s}`)
      : ['- 응답해 주신 내용에서 아이의 평소 모습이 잘 드러났어요.']),
    '',
    '## 어쩌면 의외의 모습',
    ...insights.map((s) => `- ${s}`),
    '',
    '## 축별로 읽어보기',
    ...axisIds.flatMap((axis) => [
      `**${AXIS_META[axis].label} (레벨 ${scores.axes[axis].level}/5)** — ${AXIS_NARRATIVE[axis][band(scores.axes[axis].normalized)]} ${AXIS_THEORY[axis]} (문항 ${scores.axes[axis].answeredCount}개 응답 종합)`,
      '',
    ]),
    '## 이렇게 도와주세요',
    ...tips.slice(0, 3).map((t, i) => `${i + 1}. ${t}`),
    '',
    '## 학원을 고른다면',
    ...academyTips,
  ].join('\n');
}
