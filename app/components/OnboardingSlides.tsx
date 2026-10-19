'use client';

import { useState } from 'react';

const SLIDES = [
  {
    eyebrow: '아이와 걷는 길을 미리 확인해요',
    title: '유모차로 갈 수 있는 길,\n지도만 봐서는 모르니까요',
    description:
      '계단과 높은 턱, 가파른 길을 미리 확인하고\n아이와 걷기 편한 길을 찾아보세요.',
    image: '/images/onboarding_problem.png',
  },
  {
    eyebrow: '경로의 차이를 한눈에 비교해요',
    title: '유모차가\n안전하고 편한 길로',
    description:
      '일반 최단경로와 유모차 안전경로를 비교하고\n계단·횡단·경사 구간을 미리 확인해요.',
    image: '/images/onboarding_route.png',
  },
  {
    eyebrow: '도착한 뒤 필요한 정보까지',
    title: '길뿐 아니라,\n도착해서 편한지도 확인해요',
    description:
      '유모차 주차, 기저귀 교환대, 아기 의자까지\n아이와 필요한 정보를 한 번에 살펴보세요.',
    image: '/images/onboarding_destination.png',
  },
] as const;

export default function OnboardingSlides({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const last = index === SLIDES.length - 1;

  return (
    <main className="app-shell flow-shell">
      <header className="flow-top">
        <div className="brand-lockup compact">
          <img className="brand-mark" src="/images/brand-mark.png" alt="" />
          <strong>맘편한 산책</strong>
        </div>
        <button className="text-link" type="button" onClick={onDone}>
          건너뛰기
        </button>
      </header>

      <section className="onboard-slide">
        <p className="eyebrow">{slide.eyebrow}</p>
        <h1>{slide.title}</h1>
        <p className="onboard-desc">{slide.description}</p>
        <div className="onboard-art">
          <img src={slide.image} alt="" />
        </div>
      </section>

      <div className="onboard-dots" aria-hidden>
        {SLIDES.map((_, i) => (
          <span key={i} className={i === index ? 'active' : ''} />
        ))}
      </div>

      <div className="flow-footer">
        <button
          className="primary-button"
          type="button"
          onClick={() => (last ? onDone() : setIndex((v) => v + 1))}
        >
          {last ? '산책을 시작해 볼까요?' : '다음'}
        </button>
      </div>
    </main>
  );
}
