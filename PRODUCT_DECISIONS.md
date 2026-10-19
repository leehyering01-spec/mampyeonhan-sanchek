# PRODUCT_DECISIONS — 맘편한 산책 MVP

코드·데이터·기존 문서에서 **확인 가능한** 제품/UX 결정만 적는다.  
이유를 코드만으로 단정할 수 없으면 `이유 확인 필요`로 표시한다. 추측으로 채우지 않는다.

---

### 결정: 모바일 웹 PWA로 MVP 제공 (네이티브 앱 스토어 빌드 제외)

- **이유:** README — 「앱스토어 앱·푸시·실시간 지도 SDK는 이번 범위가 아닙니다」
- **현재 구현:** vinext 웹앱 + `manifest.webmanifest` + `sw.js` + 설치 CTA
- **관련 파일:** `README.md`, `app/layout.tsx`, `public/manifest.webmanifest`, `public/sw.js`, `app/page.tsx`

---

### 결정: 서비스 범위를 이문동 단지 2곳 + 목적지 ~52곳으로 한정

- **이유:** README 및 `catalog.json` / `destinations.json` 데이터 구성
- **현재 구현:** `raemian_lagrande`, `imun_ipark_xi` + entrances; destinations 52
- **관련 파일:** `app/data/catalog.json`, `app/data/destinations.json`, `README.md`

---

### 결정: 소개 랜딩은 `/`, 기존 산책 PWA는 `/walk`, 후기 CRUD는 `/reviews`

- **이유:** 미션 5는 홍보 랜딩, 미션 6은 App Router CRUD. 기존 산책 UX는 유지해야 함.
- **현재 구현:** `app/page.tsx` 랜딩, `app/walk/page.tsx` PWA, `app/reviews/**`
- **관련 파일:** `app/components/landing/*`, `app/walk/page.tsx`

### 결정: 핵심 CRUD는 산책 후기이며 최종 저장소는 Supabase

- **이유:** 서비스 핵심 가치(실제 걸어본 경험)를 검증. 미션 6은 mock/localStorage를 최종 저장소로 쓰지 말 것.
- **현재 구현:** `walk_reviews` + Storage `review-photos`. 인증/RLS 없음.
- **관련 파일:** `supabase/schema.sql`, `app/lib/review-actions.ts`

### 결정: 서버 계정 없이 기기 localStorage에 프로필·기록 저장

- **이유:** 이유 확인 필요 (README는 「계정·클라우드 동기화」를 베타에서 의도적으로 없다고 명시)
- **현재 구현:** `mampyeonhan:*` 키들
- **관련 파일:** `app/lib/profile.ts`, `app/page.tsx`, `README.md`

---

### 결정: 첫 실행 시 온보딩 3슬라이드 → 설정(닉네임·출생연월·생활권)

- **이유:** 이유 확인 필요 (온보딩 카피로 문제·경로·도착 정보 교육)
- **현재 구현:** `onboardingDone` / `setupDone` 플래그로 게이트
- **관련 파일:** `app/components/OnboardingSlides.tsx`, `SetupForm.tsx`, `app/page.tsx`, `app/lib/profile.ts`

---

### 결정: 추천은 생활권(nearest_complex) + 추정 도보 20분 이하 + 거리순

- **이유:** README 「추천 필터」절에 명시; 상수 `MAX_RECOMMEND_WALK_MINUTES = 20`
- **현재 구현:** `visible` useMemo 필터/정렬; 직선×1.6 / 유모차 페이스
- **관련 파일:** `app/page.tsx`, `app/lib/walkMetrics.ts`, `README.md`

---

### 결정: 유모차 부적합 목적지는 블록리스트로 숨김

- **이유:** 데이터 `evidence` / README 예: 돌뫼어린이공원 계단
- **현재 구현:** `STROLLER_BLOCKLIST['dest_01_돌뫼어린이공원']`
- **관련 파일:** `app/lib/walkMetrics.ts`, `app/data/destinations.json`

---

### 결정: 경로 출발점은 「현재 GPS」가 아니라 「선택한 단지 출입구」

- **이유:** 이유 확인 필요 — 코드 주석: GPS 재라우팅이 산/공원 경유를 유발할 수 있어 출입구 고정 (`NavMap.tsx`)
- **현재 구현:** route fetch always `from = origin` (entrance); GPS는 마커·remaining만
- **관련 파일:** `app/components/NavMap.tsx`, `app/page.tsx`, `app/lib/walkMetrics.ts`

---

### 결정: 도보 엔진은 OSRM public foot 프로파일

- **이유:** 이유 확인 필요
- **현재 구현:** `fetchStrollerRoute` → `router.project-osrm.org/route/v1/foot/...`
- **관련 파일:** `app/lib/walkMetrics.ts`

---

### 결정: 유모차 페이스로 ETA 환산 (약 3.75 km/h)

- **이유:** 코드 주석 — Naver walk 2km ≈ 32min 정합 (`STROLLER_METERS_PER_MIN = 2000/32`)
- **현재 구현:** `walkMinutesFromMeters`
- **관련 파일:** `app/lib/walkMetrics.ts`

---

### 결정: 검증 정책 숫자 10분 · 400m · 도착 200m

- **이유:** `catalog.validation_policy` + README
- **현재 구현:** 기록의 `validation` 및 `?dev=1` Requirement 패널에 사용
- **관련 파일:** `app/data/catalog.json`, `app/page.tsx`, `README.md`

---

### 결정: 고객 UI에서는 검증 게이트로 완료를 막지 않음 (상시 「산책 완료」)

- **이유:** 이유 확인 필요 — README/BETA_SMOKE는 여전히 「조건 전 비활성」을 요구하나, **현재 코드는 상시 활성**
- **현재 구현:** 하단 `walk-complete-btn`; `completeWalk`에 canComplete 가드 없음
- **관련 파일:** `app/page.tsx`, `app/globals.css` (vs `README.md`, `BETA_SMOKE.md`)

---

### 결정: 후기는 별도 Review 엔티티 없이 WalkRecord의 rating/note

- **이유:** 이유 확인 필요
- **현재 구현:** 완료 화면·기록 목록에서 `updateReview`
- **관련 파일:** `app/page.tsx`

---

### 결정: 편의시설 칩은 장소 DB가 아니라 카테고리 휴리스틱

- **이유:** 이유 확인 필요
- **현재 구현:** `amenitiesForCategory` / `tipForCategory`
- **관련 파일:** `app/lib/profile.ts`, 상세 시트·RecommendCarousel

---

### 결정: 지도는 MapLibre + OSM 타일 (유료맵 SDK 비사용)

- **이유:** README — 실시간 지도 SDK는 범위 밖; 코드는 vendored MapLibre
- **현재 구현:** `public/vendor/maplibre/*`, `NavMap.tsx`
- **관련 파일:** `app/components/NavMap.tsx`, `README.md`

---

### 결정: 개발자만 검증 패널 노출 (`?dev=1`)

- **이유:** README 「개발자 전용」
- **현재 구현:** `isDevMode()`
- **관련 파일:** `app/page.tsx`, `README.md`

---

### 결정: 브랜드 비주얼 — cream / plum / lime, Pretendard, 핀+하트 마크

- **이유:** `globals.css` 주석 「Figma Hi-Fi / Branding」; layout themeColor `#fffef6`
- **현재 구현:** CSS 변수, `brand-mark.png`, 타이틀 전면 plum
- **관련 파일:** `app/globals.css`, `app/layout.tsx`, `public/images/brand-mark.png`

---

### 결정: catalog.routes는 비워 두고 OSM Overpass로 hazard 근사

- **이유:** README — 유모차 위험 폴리라인(`routes`) 미입력; OSM 보조 사용 중
- **현재 구현:** `routes: []`, `countRouteHazards`
- **관련 파일:** `app/data/catalog.json`, `app/lib/walkMetrics.ts`, `README.md`

---

### 결정: 휴대폰 테스트를 위해 Cloudflare quick tunnel 사용 가능

- **이유:** 이유 확인 필요 (영구 배포 인증 없을 때의 실무 수단). BETA_SMOKE는 wrangler/Sites를 정식 경로로 기술
- **현재 구현:** `.tools/cloudflared` (untracked), 대화/운영에서 tunnel URL 교체
- **관련 파일:** `.tools/cloudflared`, `BETA_SMOKE.md`, `scripts/deploy.sh`
