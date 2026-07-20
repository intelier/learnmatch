import TheorySection from '@/app/components/theory-section';

export default function Home() {
  return (
    <main>
      <section style={{ padding: '2.5rem 0 2rem' }}>
        <div className="eyebrow">아이 학습 성향 진단</div>
        <h1
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 26,
            lineHeight: 1.45,
            marginBottom: '0.9rem',
          }}
        >
          우리 아이, 어떻게 공부할 때
          <br />
          가장 빛날까요?
        </h1>
        <p style={{ color: 'var(--navy-muted)', marginBottom: '2rem' }}>
          아이를 가장 가까이에서 지켜본 부모님의 관찰만으로 —
          <br />
          자녀 검사 없이 5분 만에, 우리 아이 얘기 같은 맞춤 리포트를
          받아보세요.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a className="btn-primary" href="/survey">
            진단 시작하기
          </a>
          <a className="btn-secondary" href="/report/example">
            예시 리포트 보기
          </a>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 12, marginTop: '1.5rem' }}>
        <div className="card">
          <div className="eyebrow">01 · 설문</div>
          <p style={{ fontSize: 14 }}>
            아이의 평소 모습을 떠올리며 부모님이 답해요. 아이가 검사받을
            필요 없이, 정답도 없어요.
          </p>
        </div>
        <div className="card">
          <div className="eyebrow">02 · 진단 리포트</div>
          <p style={{ fontSize: 14 }}>
            자기주도성·유능감·학습스타일 등 6가지 축으로 아이를 읽어드려요.
          </p>
        </div>
        <div className="card">
          <div className="eyebrow">03 · 공유</div>
          <p style={{ fontSize: 14 }}>
            리포트를 가족과 공유하고 아이에게 맞는 방법을 함께 찾아요.
          </p>
        </div>
      </section>

      <TheorySection />

      <footer
        style={{
          marginTop: '3rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--ivory-border)',
          fontSize: 12,
          color: 'var(--navy-muted)',
        }}
      >
        본 진단은 자녀 이해를 돕기 위한 참고 자료이며, 의학적·심리학적 진단을
        대신하지 않습니다.
      </footer>
    </main>
  );
}
