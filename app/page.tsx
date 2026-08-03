import TheorySection from '@/app/components/theory-section';

export default function Home() {
  return (
    <main>
      <section style={{ padding: '2.5rem 0 2rem' }}>
        <div className="eyebrow">아이 학습 성향 진단</div>
        {/* 광고 카피가 아니라 학부모의 속마음을 그대로 옮긴 말풍선 — 왼쪽 정렬 */}
        <div className="hero-bubble-row">
          <div className="hero-bubble">
            <span className="hero-sparkle hero-sparkle-1" aria-hidden="true" />
            <span className="hero-sparkle hero-sparkle-2" aria-hidden="true" />
            <span className="hero-sparkle hero-sparkle-3" aria-hidden="true" />
            <p className="hero-bubble-text">
              전문 검사는 부담스럽고,
              <br />
              그래도 우리 아이에게 뭐가 필요한지
              <br />
              알아보고 싶다면
            </p>
          </div>
        </div>
        {/* 말풍선이 작아진 만큼 이 문구가 히어로의 앵커 — h1도 여기로 옮겼다 */}
        <h1 className="hero-sub">
          커피 두 잔 값으로 시작하는
          <br />
          교육심리학 기반 성향 진단
        </h1>
        <p className="hero-trust">65문항 · 5개 영역 교차 측정 · 교육심리학 이론 기반</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a className="btn-primary" href="/survey">
            진단 시작하기
          </a>
          <a className="btn-secondary" href="/report/example">
            예시 리포트 보기
          </a>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <div
          className="card"
          style={{ borderColor: 'var(--amber-border)', background: 'var(--amber-light)' }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 10 }}>
            어쩌면, 전혀 다른 이야기일 수 있어요
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              "집중을 잘 못해요" → 자극이 부족할 때 다른 걸 찾는{' '}
              <b>호기심</b>일 수 있어요
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              "말을 잘 안 들어요" → 자기 방향을 스스로 정하려는{' '}
              <b>주체적인 아이</b>일 수 있어요
            </p>
          </div>
          <p style={{ fontSize: 12, color: 'var(--navy-muted)', marginTop: 12 }}>
            걱정하시던 모습 뒤에 숨어 있던 이야기를, 리포트의 "어쩌면
            의외의 모습" 섹션에서 우리 아이만의 조합으로 확인하세요.
          </p>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
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
                관계가 달라져요. 리포트의 "어쩌면 의외의 모습" 섹션이 그
                반전을 보여드려요.
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
            자율성·동기·유능감·학습스타일 등 6가지 영역으로 아이를 읽어드려요.
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
        <br />
        문의:{' '}
        <a href="https://instagram.com/maker.5972" target="_blank" rel="noopener noreferrer">
          @maker.5972
        </a>
      </footer>
    </main>
  );
}
