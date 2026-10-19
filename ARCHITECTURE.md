# ARCHITECTURE — 맘편한 산책 MVP

기술 구조만 기술한다. 제품 개요는 `PROJECT_CONTEXT.md` 참고.

---

## 전체 architecture

```mermaid
flowchart TB
  subgraph Client["Browser / PWA"]
    Page["app/page.tsx\n(view state machine)"]
    Comp["components/*"]
    Lib["lib/profile.ts\nlib/walkMetrics.ts"]
    LS["localStorage"]
    SW["public/sw.js"]
    Map["NavMap + MapLibre vendor"]
    Page --> Comp
    Page --> Lib
    Page --> LS
    Page --> Map
    Page --> SW
  end

  subgraph Static["Static data"]
    Cat["catalog.json"]
    Dest["destinations.json"]
  end

  subgraph External["External services"]
    OSRM["OSRM foot routing"]
    Overpass["Overpass API"]
    OSM["OSM raster tiles"]
    Font["jsDelivr Pretendard"]
  end

  subgraph Build["Build / Host"]
    Vinext["vinext + Vite"]
    Dist["dist/ client + server"]
    CF["Cloudflare Workers / Sites\nor cloudflared tunnel"]
  end

  Page --> Cat
  Page --> Dest
  Map --> OSRM
  Lib --> OSRM
  Lib --> Overpass
  Map --> OSM
  Vinext --> Dist --> CF
```

**백엔드 애플리케이션 서버는 없다.** vinext/Workers는 정적·SSR 셸 제공용이며, 비즈니스 데이터는 JSON + localStorage다.

---

## Frontend 구조

| 레이어 | 역할 |
|--------|------|
| `layout.tsx` | HTML shell, metadata, fonts, icons |
| `page.tsx` | 유일한 화면 오케스트레이터 (`'use client'`) |
| `components/` | 온보딩, 설정, 캐러셀, 지도 |
| `lib/` | 순수 헬퍼 + fetch 유틸 |
| `globals.css` | 토큰 + 레이아웃 |
| `public/` | PWA, 이미지, vendored map SDK |

`NavMap`은 `next/dynamic(..., { ssr: false })`로 로드.

---

## Backend / API 구조

| 종류 | 존재 여부 |
|------|-----------|
| 자체 REST/GraphQL | 없음 |
| Server Actions / Route Handlers | 없음 (`app/`에 api 폴더 없음) |
| DB (D1/R2) | `hosting.json`에서 `d1`/`r2` = null. vite에 placeholder binding만 |
| Auth | 없음 |

배포 시 `dist/server` + wrangler는 **호스팅 런타임**이지 도메인 API가 아니다.

---

## 데이터 흐름

### 부트

1. `readProfile()` / saved / records / visits / complex 로드  
2. `onboardingDone` / `setupDone`에 따라 `view` 설정  
3. SW 등록, visit 카운트 +1  

### 추천 리스트

`destinations.json` → filter(complex, blocklist, category, ≤20min) → sort(straight_km) → home carousel / explore list.

### 경로

1. 사용자 출입구 선택 → `originPoint`  
2. `NavMap`이 OSRM `foot` 요청 (origin→destination만)  
3. `onRouteInfo`로 ETA/거리/좌표/hazard 카운트 반영  
4. Overpass로 경로 주변 steps/crossing 등 집계 (실패 시 0)  
5. 산책 중 GPS는 마커·헤딩·`remainingAlongRoute`만 갱신, **재라우팅 없음**

### 완료

`completeWalk` → records + validationLog localStorage → `view=complete` → review patch.

---

## State 흐름

```mermaid
stateDiagram-v2
  [*] --> Boot
  Boot --> onboarding: !onboardingDone
  Boot --> setup: onboarding && !setupDone
  Boot --> home: setupDone

  onboarding --> setup
  setup --> home

  home --> explore
  explore --> home
  home --> saved
  home --> history
  home --> mypage

  home --> detailSheet: select destination
  explore --> detailSheet
  saved --> detailSheet
  detailSheet --> departure: choose today
  departure --> walk: start
  walk --> complete: 산책 완료
  walk --> departure: leave
  complete --> history
  complete --> home
```

주요 React state는 전부 `page.tsx`에 존재한다 (profile, view, complexId, category, selected, entranceId, saved, records, GPS/route 필드들).

전역 상태 라이브러리 없음. Context API 없음.

---

## Routing

- **Next**: `/` only (`app/page.tsx`)
- **App UX**: `View` union string
- Query: `?dev=1` → validation HUD

---

## Storage

| 메커니즘 | 용도 |
|----------|------|
| localStorage | 프로필·저장·기록·단지·방문·검증로그 |
| Cache API (SW) | 정적 자산 + network-first fetch 캐시 |
| 서버 세션/쿠키 | 사용 안 함 |

기기 간 동기화 없음. 브라우저 데이터 삭제 시 소실.

---

## 외부 API

| Endpoint | 용도 | 인증 |
|----------|------|------|
| `https://router.project-osrm.org/route/v1/foot/{lon},{lat};{lon},{lat}?overview=full&geometries=geojson` | 도보 경로 | 없음 (공개) |
| `https://overpass-api.de/api/interpreter` | 경로 주변 hazard | 없음 |
| `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | 지도 타일 | 없음 |
| `cdn.jsdelivr.net/.../pretendard.min.css` | 폰트 | 없음 |

API 키·`.env` 런타임 의존 **없음** (저장소에 `.env*` 파일 없음).

---

## Dependency 관계

```
page.tsx
  ├─ OnboardingSlides
  ├─ SetupForm ── profile types
  ├─ RecommendCarousel ── profile helpers (amenities/tip/kind)
  ├─ NavMap (dynamic)
  │     └─ walkMetrics.fetchStrollerRoute / MapLibre vendor
  ├─ walkMetrics (ETA, blocklist, remainingAlongRoute, nextTurnHint)
  ├─ profile (read/write)
  ├─ catalog.json, destinations.json
  └─ globals.css (via layout)
```

npm runtime: `next`, `react`, `react-dom`만. MapLibre는 `/public/vendor` 스크립트.

---

## 핵심 component 관계

```mermaid
flowchart LR
  Page --> Onboarding
  Page --> Setup
  Page --> Carousel
  Page --> NavMap
  Carousel --> DestJSON
  Page --> DestJSON
  Page --> Catalog
  NavMap --> WalkMetrics
  Page --> WalkMetrics
  Setup --> ProfileLS
  Page --> ProfileLS
```

- **OnboardingSlides**: presentational, `onDone`
- **SetupForm**: controlled local form → `onSubmit(UserProfile)`
- **RecommendCarousel**: destinations + select / see all
- **NavMap**: `mode: preview | navigate`, origin/destination/current/heading, `onRouteInfo`

---

## Build / Deploy pipeline

```sh
vinext build   # → dist/client + dist/server
vinext start   # local production (often :4173)
# optional:
npx wrangler deploy -c dist/server/wrangler.json
# or OpenAI Sites via .openai/hosting.json project_id
# or cloudflared tunnel --url http://127.0.0.1:4173
```

`scripts/deploy.sh`: build 후 wrangler 로그인/`CLOUDFLARE_API_TOKEN` 있으면 deploy, 없으면 안내 후 exit 0.

---

## 보안·프라이버시 (아키텍처 관점)

- 프로필·산책 기록은 **브라우저 로컬만**
- 위치는 기기 GPS → 클라이언트 처리; 자체 서버로 전송하는 코드 없음
- 경로 요청은 OSRM/Overpass로 좌표가 나갈 수 있음 (공개 엔드포인트)
- 문서/로그에 시크릿을 넣지 말 것; 현재 앱 코드에 API key 하드코딩 없음
