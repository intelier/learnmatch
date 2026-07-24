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
        <p style={{ color: 'var(--navy-muted)', marginBottom: '1.25rem' }}>
          아이를 가장 가까이에서 지켜본 부모님의 관찰을 바탕으로 —
          <br />
          5분 만에, 우리 아이 얘기 같은 맞춤 리포트를 받아보세요.
        </p>
        <p
          style={{
            fontSize: 13,
            color: 'var(--sage)',
            background: 'var(--sage-light)',
            border: '1px solid var(--sage-border)',
            borderRadius: 'var(--radius)',
            padding: '10px 14px',
            marginBottom: '1.75rem',
            lineHeight: 1.6,
          }}
        >
          자기결정성이론(SDT)·근접발달영역(ZPD)·학업 소진 연구 등 검증된
          교육심리학 이론을 근거로 아이의 성향을 5개 축으로 분석해요.
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

      <section style={{ marginTop: '2.5rem' }}>
        <div className="eyebrow">우리 아이 학습 유형을 알면</div>
        <div style={{ display: 'grid', gap: 12, marginTop: '0.9rem' }}>
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>🗣️</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>
                잔소리가 줄어요
              </p>
              <p style={{ fontSize: 13, color: 'var(--navy-muted)', lineHeight: 1.6 }}>
                아이에게 안 맞는 방식으로 밀어붙이지 않게 되니, 매일의 실랑이가
                줄어들어요.
              </p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>🎯</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>
                시행착오를 아껴요
              </p>
              <p style={{ fontSize: 13, color: 'var(--navy-muted)', lineHeight: 1.6 }}>
                성향에 맞는 공부법·학원을 고르면, 안 맞는 곳을 전전하며 쓰는
                돈과 시간을 아낄 수 있어요.
              </p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>💛</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>
                아이를 다시 보게 돼요
              </p>
              <p style={{ fontSize: 13, color: 'var(--navy-muted)', lineHeight: 1.6 }}>
                문제라고 여겼던 행동이 강점으로 읽히면, 아이를 대하는 마음과
                관계가 달라져요.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gap: 12, marginTop: '1.5rem' }}>
        <div className="card">
          <div className="eyebrow">01 · 설문</div>
          <p style={{ fontSize: 14 }}>
            아이의 평소 모습을 떠올리며 부모님이 답해요.
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
