'use client';

import {
  amenitiesForCategory,
  placeKind,
  tipForCategory,
} from '../lib/profile';
import { estimateWalkMinutesFromStraightKm } from '../lib/walkMetrics';

export type CarouselItem = {
  destination_id: string;
  name: string;
  category: string;
  address: string;
  straight_km: number;
  stroller_access: string;
};

export default function RecommendCarousel({
  items,
  onOpen,
  onSeeAll,
}: {
  items: CarouselItem[];
  onOpen: (id: string) => void;
  onSeeAll: () => void;
}) {
  if (!items.length) {
    return <div className="empty-state">추천할 산책지가 아직 없어요.</div>;
  }

  return (
    <section className="recommend-block">
      <div className="recommend-head">
        <div>
          <h2>오늘 가볍게 나가볼까요?</h2>
          <p>아이와 편하게 다녀올 수 있는 추천을 골라봤어요</p>
        </div>
        <span>
          1 / {Math.min(items.length, 3)}
        </span>
      </div>

      <div className="recommend-track" aria-label="오늘의 추천 카드">
        {items.slice(0, 3).map((item) => {
          const minutes = estimateWalkMinutesFromStraightKm(item.straight_km);
          const amenities = amenitiesForCategory(item.category);
          const kind = placeKind(item.category);
          return (
            <article className="recommend-card" key={item.destination_id}>
              <div className="recommend-photo">
                <img
                  src={kind === '산책 코스' ? '/images/route-map.png' : '/images/walk-photo.png'}
                  alt=""
                />
                <span className={`kind-badge ${kind === '산책 코스' ? 'course' : ''}`}>
                  {kind}
                </span>
              </div>
              <div className="recommend-body">
                <h3>{item.name}</h3>
                <p>
                  집에서 {minutes}분 거리 · 유모차 이동 쉬움
                </p>
                <div className="amenity-grid">
                  {amenities.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <p className="recommend-tip">♥ {tipForCategory(item.category)}</p>
                <button
                  className="primary-button compact"
                  type="button"
                  onClick={() => onOpen(item.destination_id)}
                >
                  추천 정보 보기 ›
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="swipe-hint">‹ 좌우로 넘겨보세요 ›</p>
      <button className="ghost-button" type="button" onClick={onSeeAll}>
        다른 추천 보기 ›
      </button>
    </section>
  );
}
