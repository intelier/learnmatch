import type { Metadata } from 'next';
import ResultView from '@/app/components/result-view';
import { EXAMPLE_ANSWERS, EXAMPLE_REPORT_MD } from '@/lib/example-report';

export const metadata: Metadata = {
  title: '예시 리포트 | 클래스 핏',
  description: '클래스 핏 학습 성향 진단 리포트가 어떻게 생겼는지 미리 보세요.',
};

export default function ExampleReportPage() {
  return (
    <>
      <div
        className="card"
        style={{
          background: 'var(--sage-light)',
          borderColor: 'var(--sage-border)',
          marginBottom: '0.5rem',
          padding: '0.9rem 1.25rem',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--sage)' }}>
          <b>예시 리포트예요.</b> 실제 설문(약 5분)을 마치면 우리 아이만의
          리포트를 받아볼 수 있어요.
        </p>
      </div>
      <ResultView
        answers={EXAMPLE_ANSWERS}
        isSharedView
        hideShare
        initialReport={EXAMPLE_REPORT_MD}
      />
    </>
  );
}
