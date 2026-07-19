/**
 * mock 리포트 어댑터 — API 키 없이 동작.
 * 실제 LLM과 같은 입력(ReportInput)을 받아 채점 결과 기반 서술형 리포트를 조립한다.
 */
import { AXIS_META, FOCUS_LABEL, QUESTIONS, STYLE_LABEL, type AxisId } from './questions.ts';
import type { ReportInput } from './prompt.ts';

type Band = 'high' | 'mid' | 'low';

function band(normalized: number): Band {
  if (normalized >= 67) return 'high';
  if (normalized >= 34) return 'mid';
  return 'low';
}

const AXIS_NARRATIVE: Record<AxisId, Record<Band, string>> = {
  autonomy: {
    high: '아이는 스스로 계획하고 파고드는 힘이 있는 편이에요. 무엇을 어떻게 공부할지 아이에게 선택권을 주면 몰입이 눈에 띄게 좋아질 수 있어요.',
    mid: '스스로 하려는 마음과 도움이 필요한 순간이 함께 있어요. 시작은 함께 잡아주고, 마무리는 아이에게 맡기는 식의 점진적인 위임이 잘 맞을 수 있어요.',
    low: '아직은 옆에서 함께 끌어줄 때 더 잘하는 시기예요. 이것은 부족함이 아니라 발달 단계의 자연스러운 모습이니, 작은 선택부터 아이에게 맡겨보세요.',
  },
  zpd_strain: {
    high: '지금 학습 수준이 아이에게 다소 버거워 보여요. 조금 쉬운 단계에서 성공 경험을 쌓게 해주면 오히려 진도가 빨라질 수 있어요.',
    mid: '지금 수준은 아이가 노력하면 따라갈 수 있는 적절한 도전 구간으로 보여요. 다만 버거워하는 신호가 늘면 난이도를 한 템포 늦춰주세요.',
    low: '지금 수준을 여유 있게 소화하고 있어요. 조금 더 도전적인 과제를 주면 지루함 없이 성장할 수 있는 상태예요.',
  },
  burnout: {
    high: '지쳐 있다는 신호가 여럿 보여요. 지금은 학습량을 늘리기보다 회복이 먼저일 수 있어요. 공부 얘기가 아닌 대화 시간을 늘려보세요.',
    mid: '에너지가 아주 넘치지도, 소진되지도 않은 상태예요. 아이가 좋아하는 활동과 학습의 균형을 지금처럼 지켜주세요.',
    low: '배움에 에너지가 있어요. 새로운 것을 시작하기 좋은 시기예요.',
  },
  competence: {
    high: '해낼 수 있다는 믿음이 단단한 아이예요. 결과보다 과정을 짚어주는 칭찬이 이 믿음을 더 오래 지켜줘요.',
    mid: '자신 있는 영역과 움츠러드는 영역이 함께 있어요. 잘하는 것에서 얻은 자신감이 약한 영역으로 옮겨가도록 연결해 주세요.',
    low: '자신감을 회복할 성공 경험이 필요한 시기예요. 아주 작은 단위로 쪼갠 과제로 "됐다!"는 경험을 자주 만들어 주세요.',
  },
  social: {
    high: '함께 배울 때 힘이 나는 아이예요. 소그룹이나 또래와 서로 설명해 주는 방식의 수업에서 실력이 잘 자랄 수 있어요.',
    mid: '혼자 하는 시간과 함께 하는 시간이 모두 필요한 아이예요. 상황에 따라 유연하게 오가는 환경이 잘 맞아요.',
    low: '혼자 몰입할 때 편안한 아이예요. 대형 강의식보다 조용히 자기 속도로 갈 수 있는 환경을 우선 고려해 보세요.',
  },
};

/** 설문에서 고른 실제 행동을 장면으로 인용 (우리 아이 얘기 같게) */
function pickScenes(input: ReportInput, count: number): string[] {
  const scenes: string[] = [];
  for (const q of QUESTIONS) {
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
  const social = band(scores.axes.social.normalized);
  academyTips.push(
    social === 'high'
      ? '- 또래와 상호작용이 많은 **소그룹 수업**이 잘 맞아요.'
      : social === 'low'
        ? '- 대형 강의보다 **개별 진도·소규모 환경**을 우선 살펴보세요.'
        : '- 그룹과 개별 학습이 **혼합된 형태**가 무난하게 잘 맞아요.'
  );
  academyTips.push(
    band(scores.axes.burnout.normalized) === 'high'
      ? '- 숙제·테스트 관리가 강한 곳보다 **아이 속도를 기다려주는 곳**이 지금은 좋아요.'
      : '- 상담 때 "아이가 힘들어할 때 어떻게 하시나요?"를 꼭 물어보세요.'
  );
  academyTips.push(`- ${STYLE_LABEL[scores.style]} 활동(수업 방식)이 있는지 확인해 보세요.`);

  const scenes = pickScenes(input, 3);

  return [
    '## 한눈에 보기',
    `${scores.headline}인 우리 아이. ${STYLE_LABEL[scores.style]} 방식으로 배울 때 이해가 가장 잘 되고, ${FOCUS_LABEL[scores.focus]} 성향이에요. 지금 아이에게 가장 두드러지는 축은 **${AXIS_META[strongest[0]].label}**이에요. ${AXIS_NARRATIVE[strongest[0]][band(scores.axes[strongest[0]].normalized)]}`,
    '',
    '## 이런 모습, 익숙하시죠?',
    ...(scenes.length
      ? scenes.map((s) => `- ${s}`)
      : ['- 응답해 주신 내용에서 아이의 평소 모습이 잘 드러났어요.']),
    '',
    '## 축별로 읽어보기',
    ...axisIds.flatMap((axis) => [
      `**${AXIS_META[axis].label} (레벨 ${scores.axes[axis].level}/5)** — ${AXIS_NARRATIVE[axis][band(scores.axes[axis].normalized)]}`,
      '',
    ]),
    '## 이렇게 도와주세요',
    ...tips.slice(0, 3).map((t, i) => `${i + 1}. ${t}`),
    '',
    '## 학원을 고른다면',
    ...academyTips,
    '',
    '---',
    '본 리포트는 자녀 이해를 돕기 위한 참고 자료이며, 의학적·심리학적 진단을 대신하지 않습니다.',
  ].join('\n');
}
