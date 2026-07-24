'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ResultView from '@/app/components/result-view';
import {
  ANSWERS_STORAGE_KEY,
  CHILD_NAME_STORAGE_KEY,
  type Answers,
} from '@/lib/scoring';

export default function ResultPage() {
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [childName, setChildName] = useState<string>('');
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(ANSWERS_STORAGE_KEY);
    if (!raw) {
      setMissing(true);
      return;
    }
    try {
      setAnswers(JSON.parse(raw));
      setChildName(sessionStorage.getItem(CHILD_NAME_STORAGE_KEY)?.trim() ?? '');
    } catch {
      setMissing(true);
    }
  }, []);

  if (missing) {
    return (
      <main style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ marginBottom: '1.5rem', color: 'var(--navy-muted)' }}>
          진단 응답을 찾을 수 없어요. 설문을 먼저 진행해 주세요.
        </p>
        <Link className="btn-primary" href="/survey">
          진단 시작하기
        </Link>
      </main>
    );
  }

  if (!answers) return null;

  return <ResultView answers={answers} childName={childName || undefined} />;
}
