'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QUESTIONS } from '@/lib/questions';
import {
  ANSWERS_STORAGE_KEY,
  CHILD_NAME_STORAGE_KEY,
  type Answers,
} from '@/lib/scoring';

export default function SurveyPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<'name' | 'questions'>('name');
  const [childName, setChildName] = useState('');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  function startQuestions() {
    sessionStorage.setItem(CHILD_NAME_STORAGE_KEY, childName.trim().slice(0, 20));
    setPhase('questions');
  }

  if (phase === 'name') {
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
        <p style={{ fontSize: 13, color: 'var(--navy-muted)', marginBottom: '1.5rem' }}>
          이름이나 애칭을 알려주시면, 리포트를 그 이름으로 써드려요.
          <br />
          입력하지 않아도 진단은 그대로 받아보실 수 있어요.
        </p>

        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') startQuestions();
          }}
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
            marginBottom: '1.25rem',
          }}
        />

        <button type="button" className="btn-primary" onClick={startQuestions}>
          {childName.trim() ? `${childName.trim()} 진단 시작하기` : '진단 시작하기'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          style={{ marginTop: 10 }}
          onClick={() => {
            setChildName('');
            startQuestions();
          }}
        >
          이름 없이 시작
        </button>
      </main>
    );
  }

  const q = QUESTIONS[step];
  const total = QUESTIONS.length;
  const selected = answers[q.id];
  const nameLabel = childName.trim();

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
