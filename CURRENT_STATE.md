# CURRENT_STATE — 실무 인수인계

## 현재 상태

- **맘편한 산책**: `/` 랜딩 + `/walk` PWA + `/reviews` Supabase 후기 CRUD.
- 표준 Next.js (`next dev` / `next build`). Vercel 제출용. vinext 스크립트는 사용하지 않음.
- Git `main`에 커밋은 `7d231ef` 하나뿐이고, **실질 기능의 대부분은 uncommitted** (수정 + untracked).
- 백엔드/로그인/`.env` 없음. 데이터는 JSON + localStorage.
- 공개 고정 HTTPS URL은 저장소에 기록되어 있지 않음. 폰 테스트는 로컬 `vinext start` + cloudflared quick tunnel에 의존해 왔음 (URL 변동).

## 마지막으로 작업하던 것

1. 길안내 경로를 **GPS가 아닌 선택 출입구 기준**으로 고정 (`NavMap.tsx`).
2. **산책 완료**를 조건 없이 가능하게 하고, 맵 하단바에 버튼 상시 노출 (`page.tsx` / `globals.css`).
3. 계정 이전을 위한 **인수인계 문서** 작성 (본 파일들).

## 완료된 것

- 온보딩 → 설정 → 홈/탐색/저장/기록/마이
- 목적지 52 + 단지 2 + 출입구
- MapLibre 미리보기/내비, OSRM foot, Overpass hazard 카운트
- GPS 추적·기록·후기·내보내기·PWA 자산
- 브랜드 UI (cream/plum/lime), `?dev=1` 검증 패널

## 작업 중

- 워킹트리 미커밋 정리 (커밋 여부는 새 계정에서 결정).
- README / BETA_SMOKE와 **완료 버튼 정책** 불일치 해소 미완.
- 영구 배포(wrangler/Sites) 미완.

## 다음으로 해야 할 것

1. 새 Cursor 계정에서 이 폴더를 연 뒤 `PROJECT_CONTEXT.md`부터 읽기.
2. README·스모크를 코드에 맞게 수정하거나, 완료 게이트를 제품 결정에 맞게 재도입.
3. 의미 있는 스냅샷 커밋 (zip, `.tools`, `node_modules`, `dist` 제외).
4. 고정 HTTPS 배포.
5. `page.tsx` 모듈 분리, 장소별 사진/편의시설 실데이터화.

## 건드리면 위험한 부분

| 영역 | 이유 |
|------|------|
| `app/page.tsx` view 분기 | 전 UX가 한 파일에 결합 |
| `COMPLEX_TO_NEAREST` ↔ `nearest_complex` 문자열 | 불일치 시 목록이 비게 됨 |
| `NavMap` origin 고정 로직 | 다시 `current`로 라우팅하면 산 경유 재발 가능 |
| `public/sw.js` 캐시명 | 갱신 시 `CACHE` 버전 올려야 구캐시 잔존 방지 |
| OSRM/Overpass URL | 가용성·정책 변경 시 경로/hazard 깨짐 |
| localStorage 키 rename | 기존 베타 테스터 데이터 유실 |

## 테스트해야 하는 부분

- 온보딩/설정 최초·재방문 (`마이 → 온보딩 다시` 등)
- 생활권 전환 시 목록 변화
- 출입구별 경로가 단지에서 출발하는지 (먼 GPS에서도)
- 길안내 중 **산책 완료** 즉시 가능·후기 저장
- 위치 거부/타임아웃 배너
- 저장·기록 새로고침 유지
- PWA SW 등록, `?dev=1` 패널
- HTTPS 실기기 GPS (http LAN은 카톡/폰에서 실패하기 쉬움)

## 실행 방법

```sh
cd web_beta   # 이 저장소 루트
pnpm install  # 또는 npm i — Node >= 22.13
pnpm dev      # 개발
```

폰 GPS 테스트: 프로덕션 빌드 후 HTTPS 터널/배포 권장.

```sh
pnpm build
pnpm start
# 예: http://127.0.0.1:4173
# tunnel 예: ./.tools/cloudflared tunnel --url http://127.0.0.1:4173 --no-autoupdate
```

## 개발 서버 실행 명령어

```sh
pnpm dev
# 동등: node ./node_modules/vinext/dist/cli.js dev
```

## build 명령어

```sh
pnpm build
# 동등: node ./node_modules/vinext/dist/cli.js build
pnpm start   # 빌드 산출물 서빙
pnpm lint
pnpm deploy  # scripts/deploy.sh → build + (가능 시) wrangler deploy
```

## 환경 변수

저장소에 **`.env` 파일 없음**. 앱 런타임이 요구하는 맵/API 키 없음.

배포 스크립트/도구에서 **이름이 등장할 수 있는** 변수 (값은 기록하지 않음):

- `CLOUDFLARE_API_TOKEN` — `scripts/deploy.sh`에서 wrangler 배포 가능 여부 판단
- `CODEX_SANDBOX` — `vite.config.ts`에서 HMR polling (Codex seatbelt)
- `WRANGLER_WRITE_LOGS` — vite 설정에서 기본값 주입

로컬에 `.env*`를 만들 경우 `.gitignore`에 의해 무시됨. **값을 커밋/문서에 넣지 말 것.**

## README vs 코드 (주의)

| README/BETA_SMOKE | 코드 |
|-------------------|------|
| 완료 전 10분·400m·200m 미충족 시 버튼 비활성 | 상시 「산책 완료」 |
| 플로우가 생활권 선택부터 | 온보딩 → 설정 → 홈 |

인수인계 시 **코드를 진실**로 보고 문서를 고치거나 정책을 되돌릴지 결정하라.
