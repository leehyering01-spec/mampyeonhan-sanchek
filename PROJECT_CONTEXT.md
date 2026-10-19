# PROJECT_CONTEXT — 맘편한 산책 MVP

> 새 Agent는 이 파일만으로도 프로젝트를 파악할 수 있어야 한다.  
> 근거는 **현재 저장소의 실제 코드/데이터**다. README와 다른 부분이 있으면 **코드를 우선**한다.

관련 문서: `ARCHITECTURE.md` · `PRODUCT_DECISIONS.md` · `CURRENT_STATE.md` · `AGENTS.md`

---

# 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | **맘편한 산책** |
| 해결하려는 문제 | 유모차/아이와 외출할 때 지도만으로는 계단·턱·가파른 길을 알기 어렵다. 걷기 편한 목적지와 실제 산책 기록을 돕는다. |
| 핵심 사용자 | 이문동 생활권 보호자(유모차 이용 포함). 온보딩 카피 기준. |
| MVP 목표 | 모바일 웹 PWA로 생활권 목적지 탐색 → 단지 출입구 기준 도보 안내 → GPS 산책 기록 → 기기 내 후기(별점·메모). 앱스토어 앱·계정·푸시·백엔드 동기화는 범위 밖. |
| 현재 운영 지역/범위 | **서울 이문동** 인근. 단지 2곳: `이문동 래미안 라그란데`, `이문 아이파크자이`. 목적지 JSON **52곳**. |

브랜드 표시: `맘편한 산책` (layout metadata, manifest, UI). 패키지명 `sites-project`는 Codex/Sites 템플릿 잔존.

---

# 2. 핵심 사용자 경험

소개 랜딩은 **`/`**. 기존 산책 앱은 **`/walk`** (`app/walk/page.tsx`의 `view` state SPA). 산책 후기 CRUD는 **`/reviews`**.

코드 기준 실제 플로우:

```
앱 진입 (/)
  → (profile.onboardingDone === false) 온보딩 3슬라이드
  → (profile.setupDone === false) 설정: 닉네임 / 아이 출생연월 / 생활권
  → 홈: 인사 + 추천 캐러셀
  → (선택) 다른 추천 보기 = explore 목록 + 카테고리 필터
  → 장소 탭 → 상세 시트
  → 「오늘 갈 곳으로 선택」→ 출발지(출입구) 확인 + 경로 미리보기
  → 「길안내 시작」→ 산책 내비 HUD (MapLibre)
  → 「산책 완료」(하단 상시 버튼) → 완료/후기 화면
  → 기록 또는 홈
```

하단 탭(홈·저장·기록·마이)은 onboarding/setup/departure/walk/complete 밖 메인 셸에서 제공.

**README와 다른 점 (코드 우선):**

- README: 완료 전 10분·400m·200m 미충족 시 버튼 비활성.  
  **코드:** 검증 수치는 기록/`?dev=1`용으로 남지만, **산책 완료는 조건 없이 언제든 가능** (`completeWalk`가 `canComplete`로 막지 않음).
- README: 생활권 선택부터 시작.  
  **코드:** 온보딩 → 설정(출생연월·생활권)이 선행.
- 온보딩 카피의 「일반 최단 vs 유모차 안전경로 비교」는 **UI 카피만** 있고, 경로 API는 OSRM `foot` 단일 경로.

---

# 3. 현재 화면 구조

Next route는 **`/` 하나**. 아래는 `View` enum 기준 논리 화면.

| View | 파일 | 역할 | 주요 UI | 연결 | 주요 state |
|------|------|------|---------|------|------------|
| `onboarding` | `app/components/OnboardingSlides.tsx` + `page.tsx` | 첫 방문 소개 3장 | 슬라이드·건너뛰기 | → `setup` | `profile.onboardingDone` |
| `setup` | `app/components/SetupForm.tsx` | 프로필 입력 | 닉네임, 출생연월, 생활권 select | → `home` | `UserProfile` |
| `home` | `page.tsx` + `RecommendCarousel.tsx` | 추천 홈 | 인사, 히어로, 캐러셀, 필터 칩 | → explore / detail / tabs | `complexId`, `category`, `visible` |
| `explore` | `page.tsx` | 전체 목록 | 리스트 + 카테고리 | → detail / home | 동일 |
| (detail sheet) | `page.tsx` 오버레이 | 장소 상세 | 사진·amenity 칩·경로 요약·선택/저장 | → `departure` | `selected` |
| `departure` | `page.tsx` + `NavMap` preview | 출입구·경로 미리보기 | 출입구 리스트, ETA 요약, 시작 CTA | → `walk` / home | `entranceId`, route stats |
| `walk` | `page.tsx` + `NavMap` navigate | 길안내 | 맵 HUD, 위험 태그, **산책 완료** 버튼 | → `complete` / departure | GPS, route*, `elapsed` |
| `complete` | `page.tsx` | 완료·후기 | 별점·textarea | → history / home | `records`, `latestRecord` |
| `saved` | `page.tsx` | 저장 목록 | 하트 저장 목적지 | detail | `saved[]` |
| `history` | `page.tsx` | 산책 기록 | 기록 카드, 후기 수정, 내보내기 | — | `records` |
| `mypage` | `page.tsx` | 마이 | 프로필·생활권·온보딩 다시·설치 | setup/onboarding | `profile`, `visits` |

`layout.tsx`: 메타/아이콘/Pretendard CDN. 화면 로직 없음.

---

# 4. 프로젝트 구조

```
web_beta/
├── app/
│   ├── page.tsx              # 거의 모든 UX·상태 (단일 클라이언트 페이지)
│   ├── layout.tsx            # metadata, PWA 아이콘, Pretendard
│   ├── globals.css           # 디자인 토큰 + 전역 스타일 (Tailwind import 포함)
│   ├── components/
│   │   ├── NavMap.tsx        # MapLibre 지도·경로 레이어
│   │   ├── OnboardingSlides.tsx
│   │   ├── SetupForm.tsx
│   │   └── RecommendCarousel.tsx
│   ├── lib/
│   │   ├── profile.ts        # UserProfile + amenity/tip 헬퍼
│   │   └── walkMetrics.ts    # 거리/ETA/OSRM/Overpass/블록리스트
│   └── data/
│       ├── catalog.json      # 단지·출입구·validation_policy (destinations/routes 빈 배열)
│       └── destinations.json # 목적지 52건
├── public/
│   ├── manifest.webmanifest, sw.js
│   ├── icons/, images/, favicon*
│   └── vendor/maplibre/      # 사용 중
│       vendor/leaflet/       # 벤더만 있음, 앱 코드 미참조 (dead)
├── scripts/deploy.sh
├── package.json, vite.config.ts, next.config.ts
├── .openai/hosting.json      # Sites project_id (비밀 아님)
└── README.md, BETA_SMOKE.md
```

| 구분 | 실제 상태 |
|------|-----------|
| Entry | `app/layout.tsx` + `app/page.tsx` (`'use client'`) |
| Pages/routes | `/` only |
| Hooks | 별도 `hooks/` 없음. `page.tsx` 내 `useEffect`/`useCallback` |
| Utils | `app/lib/*` |
| API | 자체 REST 없음. 브라우저→OSRM, Overpass, OSM tiles |
| DB/auth | 없음. `localStorage` only |
| Styles | `globals.css` 중심. Tailwind 4는 import만, 대부분 커스텀 클래스 |

---

# 5. 기술 스택

`package.json` 기준:

| 영역 | 기술 | 버전 |
|------|------|------|
| Framework | Next (vinext 빌드) | next `16.2.6`, vinext `1.0.0-beta.3` |
| UI | React | `19.2.6` |
| Language | TypeScript | `5.9.3` |
| Bundler | Vite + vinext | vite `8.0.13` |
| Styling | CSS + Tailwind 4 (postcss) | tailwindcss `4.2.1` — **실질 스타일은 CSS 변수/클래스** |
| Routing | App Router 단일 페이지 + client `view` | — |
| State | React `useState`/`useRef` | 전역 스토어 없음 |
| Map | MapLibre GL (vendored JS) + OSM raster tiles | npm 패키지 아님 |
| Routing API | OSRM public `router.project-osrm.org` foot | — |
| Hazards | Overpass API | — |
| Database | 없음 (vite에 D1/R2 바인딩 placeholder, hosting.json에서 null) | — |
| Auth | 없음 | — |
| PWA | manifest + `sw.js` (`mampyeonhan-v4`) | — |
| Deploy | wrangler / OpenAI Sites / cloudflared quick tunnel(개발용) | wrangler `4.92.0` |
| Node | `>=22.13.0` | — |

런타임 의존성 npm: `next`, `react`, `react-dom`만.

---

# 6. 데이터 구조

코드에 **Child / Review / WalkRoute 엔티티는 없음**. 아래가 실제 모델.

### UserProfile (`app/lib/profile.ts`, key `mampyeonhan:profile`)

- `nickname`, `birthYear`, `birthMonth`, `complexId`
- `onboardingDone`, `setupDone`
- 출생연월은 **마이 표시·저장만**. 추천 필터에 미사용.

### Complex / Entrance (`catalog.json`)

- Complex: `id`, `name`, `entrances[]`
- Entrance: `id`, `name`, `location.{latitude,longitude}`
- IDs: `raemian_lagrande`, `imun_ipark_xi`

### Destination (`destinations.json` × 52)

- `destination_id`, `name`, `category`, `address`, `lat`, `lon`
- `nearest_complex` (문자열: `래미안 라그란데` | `이문아이파크자이`)
- `straight_km`, `estimated_minutes`, `stroller_access`, `evidence`
- 선택적 `source`, `raw`

카테고리 예: 카페(24), 공원, 도서관류, 놀이터, 산책길, 문화시설 등.

### WalkRecord (`mampyeonhan:records`)

- `id`, `destinationId`, `destinationName`, `completedAt`
- `durationSeconds`, `distanceMeters`
- `rating?`, `note?` ← 후기 필드
- `complexId?`, `entranceId?`, `validation?`

### WalkValidation (기록·로그용)

- policy 스냅샷, elapsed/distance/remaining, timeMet/distanceMet/arrivalMet, accuracyMeters

### RouteStats (런타임, OSRM)

- distanceMeters, durationMinutes, steps, crosswalks, stairs, trafficLights, slopes, coordinates

### localStorage 키

| Key | 용도 |
|-----|------|
| `mampyeonhan:profile` | 프로필 |
| `mampyeonhan:saved` | 저장 destination_id[] |
| `mampyeonhan:records` | WalkRecord[] |
| `mampyeonhan:complex` | complexId |
| `mampyeonhan:visits` | 방문 횟수 숫자 |
| `mampyeonhan:validation-log` | 검증 로그 (최대 100) |

### Mock / 정적 데이터

- `app/data/catalog.json`, `destinations.json`
- amenity·팁: `profile.ts` 카테고리 휴리스틱 (실측 DB 아님)
- 상세/캐러셀 사진: `/images/walk-photo.png`, `/images/route-map.png` 등 **공용 이미지**
- `catalog.destinations` / `catalog.routes`: **빈 배열** (미사용)

---

# 7. 주요 비즈니스 로직

| 로직 | 동작 | 위치 |
|------|------|------|
| 첫 방문/온보딩 | `readProfile()` → onboarding/setup/home 분기 | `page.tsx` boot `useEffect` |
| 온보딩·설정 저장 | `writeProfile` + complex localStorage | `finishOnboarding`, `finishSetup`, `SetupForm` |
| 추천 노출 | 생활권 `nearest_complex` 일치, 블록리스트 제외, 추정 도보 ≤20분, `straight_km` 정렬 | `page.tsx` `visible` |
| 블록리스트 | `dest_01_돌뫼어린이공원` | `walkMetrics.ts` `STROLLER_BLOCKLIST` |
| 도보 추정 | 직선×1.6 / (2000/32 m/min ≈ 3.75km/h) | `walkMetrics.ts` |
| 경로 | **선택 출입구 → 목적지** OSRM foot (GPS로 재라우팅하지 않음) | `NavMap.tsx` |
| 남은 거리 | 고정 폴리라인 위 `remainingAlongRoute` | `walkMetrics.ts` + `page.tsx` |
| 산책 GPS | `watchPosition`, 정확도≤100m일 때 이동거리 누적 | `beginWatch` |
| 완료 | 조건 없이 기록 저장 → `complete` | `completeWalk` |
| 검증 정책 | 10분 / 400m / 도착 200m — 로그·`?dev=1` 패널 | `catalog.json` + requirements |
| 후기 | 별점 클릭·메모 blur → records 갱신 | `updateReview` |
| 저장(찜) | id 토글 | `toggleSaved` |
| PWA | SW 등록, beforeinstallprompt | `page.tsx` |
| 베타 내보내기 | visits/saved/records/validationLog JSON | `exportBetaData` |

---

# 8. 디자인 시스템

출처: `app/globals.css` `:root` + 컴포넌트 클래스. Figma Hi-Fi 주석: mowa · lime · plum · cream.

### 색상

| Token | 값 |
|-------|-----|
| `--ink` | `#352b2f` |
| `--plum` | `#641044` |
| `--muted` | `#7d7578` |
| `--line` | `#ebe6df` |
| `--cream` | `#fffef6` |
| `--canvas` | `#f6f4ec` |
| `--lime` | `#b7f672` |
| `--lime-soft` | `#eaf8d4` |
| `--lime-strong` | `#75d919` |
| `--lavender` | `#dbd4ff` |
| `--surface` | `#f3f1ea` |
| `--orange` | `#f26430` |
| `--pink` | `#f3bfe0` |
| `--map-blue` | `#2f7bff` |

### Typography

- Font: Pretendard (CDN) + system Korean fallbacks
- 브랜드 타이틀: plum, weight 800, ~20px
- 홈 인사: ~26px weight 800

### Spacing / layout

- 앱 셸 `max-width: 480px`, 중앙, `min-height: 100dvh`
- 기본 패딩 ~22px 수평
- `--radius: 18px`, `--shadow: 0 10px 28px …`

### Components (CSS)

- `.primary-button` — lime CTA
- `.secondary-button`, `.text-button`, `.install-chip` (pill)
- 카드성 UI: recommend cards, detail sheet (상호작용 시트)
- `.field` input/select — setup
- 아이콘: 이모지/텍스트(‹ ♡ ☰ ★) + PNG brand-mark / PWA icons
- 맵 hazard: 횡단보도 녹 / 계단 분홍 / 경사 주황

### Responsive

- 모바일 퍼스트 단일 컬럼 480px 캡. 별도 데스크톱 브레이크포인트 거의 없음.
- `viewport-fit=cover`, walk 화면 full-bleed 맵.

---

# 9. 구현 완료

- 온보딩 3장 + 설정(닉네임·출생연월·생활권) + localStorage 프로필
- 홈 추천 캐러셀 / explore 목록 / 카테고리 필터 / 저장·기록·마이 탭
- 상세 시트 → 출입구 선택 → MapLibre 미리보기·내비
- 출입구 고정 OSRM 경로 + GPS 마커/헤딩 + 남은거리 갱신
- 산책 완료(상시 버튼) + 별점·메모 + 기록 수정
- 검증 로그·dev 패널(`?dev=1`)·베타 JSON 내보내기
- PWA manifest/SW/아이콘, 설치 안내
- 유모차 부적합 1건 블록리스트
- vinext build/start, deploy.sh (wrangler 로그인 시)

---

# 10. 부분 구현

- 편의시설(수유실 등): 카테고리 문자열 휴리스틱, 장소별 실데이터 없음
- 목적지 사진: 공용 이미지 재사용
- 온보딩의 「경로 비교」카피: 기능 미구현
- `catalog.routes`: 빈 배열 — 위험 구간 폴리라인 데이터 없음 (OSM Overpass 근사만)
- 출생연월: 수집·표시만, 추천 미반영
- 공개 HTTPS: wrangler/Sites 미로그인 시 cloudflared quick tunnel에 의존 (URL 자주 변경)
- Tailwind: import만, 유틸리티 클래스 중심 개발은 아님
- D1/R2: hosting 설정 null / placeholder

---

# 11. 미구현

코드·README·빈 필드 기준:

- 계정 / 클라우드 동기화 / 푸시 / 백그라운드 위치
- 앱스토어·Flutter 연동 (별도 x20 Flutter는 이 웹 베타 범위 밖)
- `routes` 기반 유모차 전용 위험 폴리라인
- 거리뷰 AI 대량 스캔 (README에 다음 단계로 기술)
- 자체 백엔드 API, 환경변수 기반 맵 키
- 서버 사이드 인증·개인정보 보호 정책 페이지 등
- 코드 내 `TODO`/`FIXME`/`HACK` 문자열: **검색 결과 없음** (미구현은 문서·빈 데이터로 확인)

---

# 12. 알려진 문제

| 이슈 | 설명 |
|------|------|
| README 낙후 | 완료 버튼 게이트·플로우 설명이 현재 코드와 불일치 |
| BETA_SMOKE 동일 | 「세 조건 전 비활성」체크리스트 구식 |
| `page.tsx` 비대 | ~1300줄, 화면·상태 집중 → 회귀 위험 |
| Leaflet dead | `public/vendor/leaflet/**` 미사용 |
| OSRM/Overpass 공개 | 레이트·가용성·CORS/네트워크 실패 시 경로·hazard 0 |
| GPS 실내 | 정확도·권한 이슈; HTTPS 필요 |
| Quick tunnel | 만료·Mac/서버 꺼지면 접속 불가 |
| 상세 이미지 | 모든 장소 동일 사진 가능 |
| package name | `sites-project` |
| 완료 정책 완화 | 가짜 완료 가능 — 제품 의도인지 재확인 필요 |
| `estimated_minutes` in JSON | UI는 주로 `estimateWalkMinutesFromStraightKm` 사용 |
| `.tools/cloudflared` | 로컬 바이너리, git 미추적 |

---

# 13. 최근 작업

### Git

- 브랜치: `main`
- 커밋 1개: `7d231ef` — `Build mampyeonhan mobile web beta`
- 이후 **대량 uncommitted** (수정 + untracked). 커밋되지 않은 작업이 현재 진실에 가깝다.

### 커밋 이후 반영된 주요 방향 (워킹트리)

- Hi-Fi UI (cream/plum/lime), 온보딩·설정·캐러셀 뎁스
- MapLibre 내비, 출입구 고정 경로, 산책 완료 상시 노출
- 브랜드 아이콘/파비콘, PWA v4, walkMetrics·profile 모듈

### 현재 작업 중/더티 파일 (대표)

수정: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`, `app/data/destinations.json`, `package.json`, `public/sw.js`, `manifest`, icons/images 일부  

미추적: `app/components/*`, `app/lib/*`, `public/vendor/*`, `scripts/`, `README.md`, `BETA_SMOKE.md`, zip, `.tools/`

---

# 14. 다음 작업 추천 (우선순위)

1. **문서·스모크를 코드에 맞추기** — README/BETA_SMOKE의 완료 게이트 설명 수정 또는 정책 재도입 결정.
2. **워킹트리 커밋/정리** — 인수인계 가능한 스냅샷; zip·`.tools`·`dist`는 커밋 제외.
3. **영구 HTTPS 배포** — wrangler login 또는 Sites publish (tunnel 의존 제거).
4. **`page.tsx` 분리** — view별 컴포넌트/훅으로 쪼개 회귀 줄이기.
5. **장소별 실데이터** — 사진·편의시설을 JSON으로 승격 (휴리스틱 대체).
6. **Leaflet 벤더 삭제 또는 사용** — dead asset 정리.
7. **출생연월 반영 또는 UI 축소** — 미사용 필드 정리.
8. **경로 실패 UX** — OSRM/Overpass 실패 시 재시도·폴백 명시.
9. **완료 정책 제품 결정** — 베타 검증용 게이트 vs 상시 완료.
10. **routes 데이터 파이프라인** — catalog.routes 채워 유모차 위험 구간 표시.

---

*생성 시점: 저장소 워킹트리 기준 분석. 비밀값(.env 내용)은 문서화하지 않음 — `.env*` 파일은 저장소에 없음.*
