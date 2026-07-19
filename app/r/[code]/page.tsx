import type { Metadata } from 'next';
import Link from 'next/link';
import ResultView from '@/app/components/result-view';
import { scoreAnswers } from '@/lib/scoring';
import { decodeAnswers } from '@/lib/share';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const answers = decodeAnswers(code);
  if (!answers) return { title: '클래스 핏 — 아이 학습 성향 진단' };
  const scores = scoreAnswers(answers);
  return {
    title: `${scores.headline} | 클래스 핏`,
    description: '우리 아이 학습 성향 진단 리포트를 확인해 보세요.',
  };
}

export default async function SharedReportPage({ params }: Props) {
  const { code } = await params;
  const answers = decodeAnswers(code);

  if (!answers) {
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

  return <ResultView answers={answers} isSharedView />;
}
