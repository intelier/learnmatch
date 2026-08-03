'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AGE_BANDS, CHILD_AGE_BAND_STORAGE_KEY, type AgeBand } from '@/lib/age-bands';
import {
  CHILD_HAGWON_STATUS_STORAGE_KEY,
  HAGWON_STATUS_OPTIONS,
  type HagwonStatus,
} from '@/lib/hagwon-status';
import {
  AXIS_META,
  CATEGORY_META,
  FOCUS_LABEL,
  getQuestions,
  QUESTIONS,
  STYLE_LABEL,
  SUPPLEMENTARY_QUESTIONS,
  type AxisId,
} from '@/lib/questions';
import {
  ANSWERS_STORAGE_KEY,
  CHILD_NAME_STORAGE_KEY,
  scoreAnswers,
  type Answers,
} from '@/lib/scoring';
import {
  clearSurveyProgress,
  loadSurveyProgress,
  saveSurveyProgress,
  type SavedProgress,
} from '@/lib/survey-progress';

/** 10문항마다 인터루드 (D-26: 65문항 기준). */
const INTERLUDE_STEPS = [10, 20, 30, 40, 50, 60];
/** 12문항짜리 축 블록이 끝나는 step → 그 축 id. style_strength(49~53)는 채점 축이 아니라 제외 (D-26). */
const AXIS_BLOCK_ENDS: Partial<Record<number, AxisId>> = {
  12: 'autonomy',
  24: 'zpd_strain',
  36: 'burnout',
  48: 'competence',
  65: 'social',
};
/** 이 개수 이상 "잘 모르겠어요"를 고르면 그 축의 보조 문항을 보여준다. */
const UNCERTAIN_TRIGGER = 2;

/**
 * 인터루드 step → 그때 막 답하고 있던 문항 블록 (D-29).
 *
 * 예전에는 "50점 기준 편차가 가장 큰 축"을 골랐는데, 문항이 축별로 12개씩 묶여 있어
 * 초반에는 첫 블록(자율성)만 값이 다 채워지고 나머지는 미응답분이 중앙값으로 남는다.
 * 그래서 편차 1위가 계속 자율성이라 6번의 인터루드에 같은 멘트만 반복됐다.
 * step으로 고정하면 매번 방금 답한 블록의 이야기가 나온다.
 */
const INTERLUDE_BLOCK: Partial<Record<number, AxisId | 'style_strength'>> = {
  10: 'autonomy',
  20: 'zpd_strain',
  30: 'burnout',
  40: 'competence',
  50: 'style_strength',
  60: 'social',
};

/**
 * 인터루드 카드에 띄울 한 줄. 아직 부분 응답이라 정규화 점수(미응답분이 중앙으로 끌어당김)
 * 대신 **raw 합의 부호**로 방향을 정한다 — 답한 문항만의 순수 신호이기 때문.
 */
function interludeMessage(
  step: number,
  partialAnswers: Answers
): { label: string; message: string } | null {
  const block = INTERLUDE_BLOCK[step];
  if (!block) return null;
  const scores = scoreAnswers(partialAnswers);
  if (block === 'style_strength') {
    // 몰입 성향(focus)은 최빈값이라 응답이 하나도 없어도 폴백('유연한')이 그냥 나온다.
    // 이 시점엔 보통 style 문항만 답한 상태라, 실제 신호가 있을 때만 덧붙인다.
    const hasFocus = QUESTIONS.some((q) => {
      const idx = partialAnswers[q.id];
      return idx !== undefined && q.options[idx]?.focus !== undefined;
    });
    return {
      label: CATEGORY_META.style_strength.label,
      message: hasFocus
        ? `${STYLE_LABEL[scores.style]} 방식이 편하고, ${FOCUS_LABEL[scores.focus]} 성향이 보여요`
        : `${STYLE_LABEL[scores.style]} 방식이 편해 보여요`,
    };
  }
  const meta = AXIS_META[block];
  return {
    label: meta.label,
    message: scores.axes[block].raw >= 0 ? meta.positive : meta.negative,
  };
}

export default function SurveyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'intake' | 'questions'>('intake');
  const [childName, setChildName] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [hagwonStatus, setHagwonStatus] = useState<HagwonStatus | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [interludeAt, setInterludeAt] = useState<number | null>(null);
  const [supplementAxis, setSupplementAxis] = useState<AxisId | null>(null);
  const [triggeredAxes, setTriggeredAxes] = useState<Set<AxisId>>(new Set());
  // 응답 유실 방지 (D-26) — 재방문 시 이어서 하기 배너용
  const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);

  useEffect(() => {
    setSavedProgress(loadSurveyProgress());
  }, []);

  function startQuestions() {
    if (!ageBand || !hagwonStatus) return;
    sessionStorage.setItem(CHILD_NAME_STORAGE_KEY, childName.trim().slice(0, 20));
    sessionStorage.setItem(CHILD_AGE_BAND_STORAGE_KEY, ageBand);
    sessionStorage.setItem(CHILD_HAGWON_STATUS_STORAGE_KEY, hagwonStatus);
    setPhase('questions');
  }

  function resumeProgress(saved: SavedProgress) {
    setChildName(saved.childName);
    setAgeBand(saved.ageBand);
    setHagwonStatus(saved.hagwonStatus);
    setAnswers(saved.answers);
    setStep(saved.step);
    setTriggeredAxes(new Set(saved.triggeredAxes));
    sessionStorage.setItem(CHILD_NAME_STORAGE_KEY, saved.childName);
    sessionStorage.setItem(CHILD_AGE_BAND_STORAGE_KEY, saved.ageBand);
    sessionStorage.setItem(CHILD_HAGWON_STATUS_STORAGE_KEY, saved.hagwonStatus);
    setSavedProgress(null);
    setPhase('questions');
  }

  function discardProgress() {
    clearSurveyProgress();
    setSavedProgress(null);
  }

  if (phase === 'intake') {
    return (
      <main>
        {savedProgress && (
          <div
            className="card"
            style={{
              borderColor: 'var(--amber-border)',
              background: 'var(--amber-light)',
              marginBottom: '1.5rem',
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              {savedProgress.step}번째 문항까지 답변한 진단이 있어요
            </p>
            <p style={{ fontSize: 12, color: 'var(--navy-light)', marginBottom: 12 }}>
              {savedProgress.childName ? `${savedProgress.childName}의 ` : ''}
              이어서 하시겠어요?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '10px 16px' }}
                onClick={() => resumeProgress(savedProgress)}
              >
                이어서 하기
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: 'auto', padding: '10px 16px' }}
                onClick={discardProgress}
              >
                새로 시작
              </button>
            </div>
          </div>
        )}
        <div className="eyebrow">진단을 시작하기 전에</div>
        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 22,
            lineHeight: 1.5,
            margin: '0.4rem 0 0.6rem',
          }}
        >
          아이를 어떻게 불러드릴까요?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--navy-muted)', marginBottom: '1.25rem' }}>
          이름이나 애칭을 알려주시면, 리포트를 그 이름으로 써드려요. 입력하지
          않아도 괜찮아요.
        </p>

        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="예: 지호, 우리 첫째, 콩이"
          maxLength={20}
          autoFocus
          style={{
            width: '100%',
            height: 48,
            padding: '0 14px',
            fontSize: 15,
            border: '1px solid var(--ivory-border)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--sans)',
            background: 'var(--white)',
            marginBottom: '1.75rem',
          }}
        />

        <p style={{ fontSize: 13, color: 'var(--navy-muted)', marginBottom: '0.9rem' }}>
          아이 나이대를 알려주시면, 지금 발달 시기에 맞게 해석해서
          써드려요.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.75rem' }}>
          {AGE_BANDS.map((band) => (
            <button
              key={band.id}
              type="button"
              className={`option-btn${ageBand === band.id ? ' selected' : ''}`}
              style={{ width: 'auto', flex: '1 1 auto', textAlign: 'center' }}
              onClick={() => setAgeBand(band.id)}
            >
              {band.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--navy-muted)', marginBottom: '0.9rem' }}>
          현재 학원이나 과외를 다니고 있나요? 문항을 아이 상황에 맞게
          보여드려요.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.75rem' }}>
          {HAGWON_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`option-btn${hagwonStatus === opt.id ? ' selected' : ''}`}
              style={{ width: 'auto', flex: '1 1 auto', textAlign: 'center' }}
              onClick={() => setHagwonStatus(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--navy-muted)', marginBottom: '1.25rem' }}>
          65문항 · 약 15~20분 · 5개 영역 12문항씩 교차 측정
        </p>

        <button
          type="button"
          className="btn-primary"
          disabled={!ageBand || !hagwonStatus}
          style={!ageBand || !hagwonStatus ? { opacity: 0.5, cursor: 'default' } : undefined}
          onClick={startQuestions}
        >
          {childName.trim() ? `${childName.trim()} 진단 시작하기` : '진단 시작하기'}
        </button>
        {(!ageBand || !hagwonStatus) && (
          <p style={{ fontSize: 11, color: 'var(--navy-muted)', marginTop: 8 }}>
            나이대와 학원 여부를 선택하면 시작할 수 있어요.
          </p>
        )}
      </main>
    );
  }

  const questions = getQuestions(ageBand, hagwonStatus);
  const total = questions.length;

  /** 문항 응답 후 공통 진행 로직 — 인터루드 체크 후 다음 문항으로, 끝이면 제출. */
  function advance(nextStep: number, latestAnswers: Answers) {
    if (nextStep >= total) {
      clearSurveyProgress();
      sessionStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(latestAnswers));
      router.push('/result');
      return;
    }
    saveSurveyProgress({
      childName,
      ageBand: ageBand!,
      hagwonStatus: hagwonStatus!,
      answers: latestAnswers,
      step: nextStep,
      triggeredAxes: [...triggeredAxes],
    });
    if (INTERLUDE_STEPS.includes(nextStep)) {
      setInterludeAt(nextStep);
    }
    setStep(nextStep);
  }

  if (interludeAt !== null) {
    const info = interludeMessage(interludeAt, answers);
    return (
      <main>
        <div
          className="card interlude-card"
          style={{ borderColor: 'var(--amber-border)', background: 'var(--amber-light)' }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 10 }}>
            {interludeAt} / {total} 완료{info ? ` · ${info.label}` : ''}
          </p>
          {/* 리드인은 거들 뿐 — 아래 성향 문장보다 작게 (사용자 요청) */}
          <p style={{ fontSize: 12, color: 'var(--navy-muted)', marginBottom: 6 }}>
            지금까지의 응답에서 이런 모습이 보입니다
          </p>
          {info && (
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.6 }}>
              {info.message}
            </p>
          )}
        </div>
        <button
          type="button"
          className="btn-primary"
          style={{ marginTop: '1.5rem' }}
          onClick={() => setInterludeAt(null)}
        >
          계속하기
        </button>
      </main>
    );
  }

  if (supplementAxis) {
    const supQ = SUPPLEMENTARY_QUESTIONS.find((sq) => sq.category === supplementAxis)!;
    const axisLabel = CATEGORY_META[supplementAxis].label;

    function selectSupplementOption(idx: number) {
      const next = { ...answers, [supQ.id]: idx };
      setAnswers(next);
      setSupplementAxis(null);
      advance(step, next);
    }

    return (
      <main>
        <div
          className="card"
          style={{ borderColor: 'var(--amber-border)', background: 'var(--amber-light)', marginBottom: '1.25rem' }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', lineHeight: 1.6 }}>
            {axisLabel} 성향을 더 정확히 보기 위한 추가 질문이에요
          </p>
        </div>

        <h2
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 20,
            lineHeight: 1.5,
            marginBottom: '1.5rem',
          }}
        >
          {supQ.text}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {supQ.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              className={`option-btn${answers[supQ.id] === idx ? ' selected' : ''}`}
              onClick={() => selectSupplementOption(idx)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </main>
    );
  }

  const q = questions[step];
  const selected = answers[q.id];
  const nameLabel = childName.trim();
  const categoryLabel = CATEGORY_META[q.category].label;
  const categoryTotal = questions.filter((qq) => qq.category === q.category).length;
  const categoryIndex = questions
    .slice(0, step + 1)
    .filter((qq) => qq.category === q.category).length;

  function selectOption(idx: number) {
    const next = { ...answers, [q.id]: idx };
    setAnswers(next);
    const nextStep = step + 1;

    const axisJustFinished = AXIS_BLOCK_ENDS[nextStep];
    if (axisJustFinished && !triggeredAxes.has(axisJustFinished)) {
      const blockIds = questions
        .filter((qq) => qq.category === axisJustFinished)
        .map((qq) => qq.id);
      const uncertainCount = blockIds.filter((id) => {
        const selIdx = next[id];
        const opt = selIdx !== undefined ? questions.find((qq) => qq.id === id)?.options[selIdx] : undefined;
        return Boolean(opt?.uncertain);
      }).length;
      if (uncertainCount >= UNCERTAIN_TRIGGER) {
        const nextTriggered = new Set(triggeredAxes).add(axisJustFinished);
        setTriggeredAxes(nextTriggered);
        setSupplementAxis(axisJustFinished);
        setStep(nextStep);
        saveSurveyProgress({
          childName,
          ageBand: ageBand!,
          hagwonStatus: hagwonStatus!,
          answers: next,
          step: nextStep,
          triggeredAxes: [...nextTriggered],
        });
        return;
      }
    }

    advance(nextStep, next);
  }

  return (
    <main>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.6rem',
        }}
      >
        <div className="eyebrow" style={{ marginBottom: 0 }}>
          {nameLabel ? `${nameLabel} 학습 성향 진단` : '아이 학습 성향 진단'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--navy-muted)' }}>
          {step + 1} / {total}
        </div>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, margin: '0.9rem 0 0.3rem' }}>
        {categoryLabel} {categoryIndex}/{categoryTotal}
      </p>

      <h2
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 20,
          lineHeight: 1.5,
          marginBottom: '1.5rem',
        }}
      >
        {q.text}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            className={`option-btn${selected === idx ? ' selected' : ''}`}
            onClick={() => selectOption(idx)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '1.75rem' }}>
        {step > 0 && (
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', padding: '10px 20px' }}
            onClick={() => setStep(step - 1)}
          >
            이전
          </button>
        )}
      </div>

      <p style={{ marginTop: '2rem', fontSize: 15, fontWeight: 600, color: 'var(--amber)' }}>
        정답은 없어요. 우리 아이에게 해당되는 게 없다면, 우리 아이라면 이럴 것
        같다고 보여지는 것을 골라주세요.
      </p>
    </main>
  );
}
