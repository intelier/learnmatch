'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AGE_BANDS, CHILD_AGE_BAND_STORAGE_KEY, type AgeBand } from '@/lib/age-bands';
import {
  CHILD_HAGWON_STATUS_STORAGE_KEY,
  HAGWON_STATUS_OPTIONS,
  type HagwonStatus,
} from '@/lib/hagwon-status';
import { AXIS_META, CATEGORY_META, getQuestions, type AxisId } from '@/lib/questions';
import {
  ANSWERS_STORAGE_KEY,
  CHILD_NAME_STORAGE_KEY,
  scoreAnswers,
  type Answers,
} from '@/lib/scoring';

const INTERLUDE_STEPS = [10, 20];

/** 지금까지 응답에서 가장 뚜렷하게 드러난 축을 고른다 (50점 기준 편차가 가장 큰 축). */
function pickInterludeAxis(partialAnswers: Answers): { axis: AxisId; positive: boolean } | null {
  const scores = scoreAnswers(partialAnswers);
  const axisIds = Object.keys(AXIS_META) as AxisId[];
  let best: AxisId | null = null;
  let bestDist = -1;
  for (const axis of axisIds) {
    const dist = Math.abs(scores.axes[axis].normalized - 50);
    if (dist > bestDist) {
      bestDist = dist;
      best = axis;
    }
  }
  if (!best) return null;
  return { axis: best, positive: scores.axes[best].normalized >= 50 };
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

  function startQuestions() {
    if (!ageBand || !hagwonStatus) return;
    sessionStorage.setItem(CHILD_NAME_STORAGE_KEY, childName.trim().slice(0, 20));
    sessionStorage.setItem(CHILD_AGE_BAND_STORAGE_KEY, ageBand);
    sessionStorage.setItem(CHILD_HAGWON_STATUS_STORAGE_KEY, hagwonStatus);
    setPhase('questions');
  }

  if (phase === 'intake') {
    return (
      <main>
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
          30문항 · 약 10분 · 6개 영역 측정
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

  if (interludeAt !== null) {
    const picked = pickInterludeAxis(answers);
    const meta = picked ? AXIS_META[picked.axis] : null;
    return (
      <main>
        <div
          className="card"
          style={{ borderColor: 'var(--amber-border)', background: 'var(--amber-light)' }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 10 }}>
            {interludeAt} / {total} 완료{meta ? ` · ${meta.label}` : ''}
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, lineHeight: 1.6 }}>
            지금까지의 응답에서 이런 모습이 보이기 시작했어요
          </p>
          {meta && (
            <p style={{ fontSize: 13, color: 'var(--navy-light)', lineHeight: 1.6 }}>
              {picked!.positive ? meta.positive : meta.negative}
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
    if (nextStep >= total) {
      sessionStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(next));
      router.push('/result');
      return;
    }
    if (INTERLUDE_STEPS.includes(nextStep)) {
      setInterludeAt(nextStep);
    }
    setStep(nextStep);
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
