import type { Metadata } from 'next';
import Link from 'next/link';
import ResultView from '@/app/components/result-view';
import { findByShareToken } from '@/lib/db';
import { scoreAnswers, type Answers } from '@/lib/scoring';
import { decodeAnswers } from '@/lib/share';

interface Props {
  params: Promise<{ code: string }>;
}

interface Resolved {
  answers: Answers;
  /** DB에 저장된 리포트 (있으면 LLM 재호출 없이 표시) */
  storedReport: string | null;
}

/** share_token(DB) 우선, 실패 시 legacy 무상태 코드 디코딩 (T-06) */
async function resolve(code: string): Promise<Resolved | null> {
  const stored = await findByShareToken(code);
  if (stored) return { answers: stored.answers, storedReport: stored.markdown };
  const answers = decodeAnswers(code);
  if (answers) return { answers, storedReport: null };
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const resolved = await resolve(code);
  if (!resolved) return { title: '클래스 핏 — 아이 학습 성향 진단' };
  const scores = scoreAnswers(resolved.answers);
  return {
    title: `${scores.headline} | 클래스 핏`,
    description: '우리 아이 학습 성향 진단 리포트를 확인해 보세요.',
  };
}

export default async function SharedReportPage({ params }: Props) {
  const { code } = await params;
  const resolved = await resolve(code);

  if (!resolved) {
    return (
      <main style={{ textAlign: 'center', padding: '3rem 0' }}>
        <p style={{ marginBottom: '1.5rem', color: 'var(--navy-muted)' }}>
          유효하지 않은 공유 링크예요. 링크가 잘렸는지 확인해 주세요.
        </p>
        <Link className="btn-primary" href="/survey">
          직접 진단해보기
        </Link>
      </main>
    );
  }

  return (
    <ResultView
      answers={resolved.answers}
      isSharedView
      initialReport={resolved.storedReport ?? undefined}
      initialShareToken={resolved.storedReport ? code : undefined}
    />
  );
}
