# 맘편한 산책

이문동에서 유모차로 걷기 편한 목적지와 길을 찾고, 다녀온 후기를 남기는 웹 MVP입니다.

- 소개 랜딩: `/`
- 산책 앱(PWA): `/walk`
- 산책 후기 CRUD: `/reviews`

## 핵심 가치

- 문제: 지도만으로는 계단·턱·경사와 아이와 머물 곳을 알기 어렵다.
- 해결: 단지 출입구 기준 경로와 생활권 목적지, 실제 후기를 출발 전에 본다.
- 기대효과: 익숙한 곳만 반복하지 않고 집 앞 산책을 시도할 수 있다.

타깃 사용자는 이문동 생활권 보호자(유모차 이용 포함)입니다.

핵심 CTA는 **동네 후기 보기**(`/reviews`)와 **산책 시작하기**(`/walk`)입니다.

## 핵심 기능 명세 — 산책 후기

사용자 흐름: 목록 → 상세 → 등록/수정 → 삭제

| 화면 | 경로 | 입력 | 행동 | 성공 | 실패 |
|------|------|------|------|------|------|
| 목록 | `/reviews` | 검색어, 목적지, 정렬, page | 찾아보기, 카드 클릭, 등록 | 최신/별점순 목록, 페이지네이션 | 환경 변수 없음, 조회 오류, 빈 목록 |
| 상세 | `/reviews/[id]` | — | 수정, 삭제 확인 | 본문·별점·사진 | 없는 id → 안내 화면 |
| 등록 | `/reviews/new` | 목적지, 별명, 별점, 후기, 사진(선택) | 제출 | 상세로 이동 | 검증 오류, 업로드 실패, 중복 제출 방지 |
| 수정 | `/reviews/[id]/edit` | 기존 값 + 변경 | 저장, 사진 교체/삭제 | 상세 반영 | 검증 오류, 없는 글 |

필수값: 목적지, 별명(1–20자), 별점(1–5), 후기(10–500자). 사진은 JPG/PNG/WEBP, 5MB 이하, 없어도 등록 가능.

## 테이블 구조

`walk_reviews` (Supabase)

| 컬럼 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | uuid PK | 예 | `gen_random_uuid()` |
| destination_id | text | 예 | 카탈로그 ID |
| destination_name | text | 예 | 표시용 이름 |
| nickname | text | 예 | 별명만. 실명 금지 |
| rating | int 1–5 | 예 | 별점 |
| body | text | 예 | 후기 |
| image_path | text | 아니오 | Storage 경로 |
| created_at | timestamptz | 예 | 생성 |
| updated_at | timestamptz | 예 | 수정 |

Storage 버킷: `review-photos` (공개 읽기). 스키마: `supabase/schema.sql`.

이번 미션에서는 인증과 RLS를 쓰지 않습니다. 누구나 anon 키로 읽고 쓸 수 있으므로 개인정보를 넣지 마세요.

## 기술 스택

- Next.js App Router, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui 스타일 컴포넌트
- Supabase (Postgres + Storage), Server Actions
- `/walk`는 기존 클라이언트 PWA (MapLibre, OSRM)

## 구현한 인터랙션 (랜딩)

- 모바일 메뉴 토글
- 섹션 앵커 스크롤
- FAQ 아코디언

## 실행 방법

Node 22.13 이상, pnpm.

```sh
pnpm install
cp .env.example .env.local
# .env.local에 URL/anon key 입력
# Supabase SQL Editor에서 supabase/schema.sql 실행
pnpm dev
```

로컬: [http://localhost:3000](http://localhost:3000)

```sh
pnpm build && pnpm start
```

## 환경 변수 이름

값은 기록하지 않습니다. `.env.local`과 Vercel Project Settings에만 넣습니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 배포 URL

GitHub 저장소: https://github.com/leehyering01-spec/mampyeonhan-sanchek

Vercel: https://mampyeonhan-sanchek.vercel.app

## QA 체크리스트

로컬 (`http://localhost:3000`, 2026-10-19):

- [x] 빈 값 제출 시 브라우저 필수값 안내
- [x] 짧은 후기 제출 시 「후기는 10자 이상 500자 이하로 적어 주세요.」
- [x] 잘못된 파일 형식 제출 시 「이미지는 JPG, PNG, WEBP만 올릴 수 있어요.」
- [x] 사진 없이 등록 → 상세에 ‘사진 없음’
- [x] 등록 후 목록·상세 반영, 새로고침 유지 (Supabase)
- [x] 수정 후 본문·사진이 상세에 반영
- [x] 삭제 확인 후 목록에서 사라짐
- [x] 존재하지 않는 `/reviews/not-a-real-id` 안내
- [x] 랜딩 CTA「동네 후기 보기」「산책 시작하기」연결
- [x] `/walk` 완료 화면 「후기 남기기」가 `/reviews/new?destination=...` 로 연결 (코드)

배포 URL https://mampyeonhan-sanchek.vercel.app 에서 목록이 DB 후기를 보여 주는지 확인했습니다. 등록·수정·삭제는 배포 주소에서도 같은 흐름입니다.
