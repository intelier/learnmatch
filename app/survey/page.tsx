'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QUESTIONS } from '@/lib/questions';
import { ANSWERS_STORAGE_KEY, type Answers } from '@/lib/scoring';

export default function SurveyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const selected = answers[q.id];

  function selectOption(idx: number) {
    const next = { ...answers, [q.id]: idx };
    setAnswers(next);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      sessionStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(next));
      router.push('/result');
    }
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
          아이 학습 성향 진단
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

      <p style={{ marginTop: '2rem', fontSize: 12, color: 'var(--navy-muted)' }}>
        정답은 없어요. 아이의 평소 모습에 가장 가까운 것을 골라주세요.
      </p>
    </main>
  );
}
