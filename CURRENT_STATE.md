# CURRENT_STATE — 실무 인수인계

## 현재 상태

- **맘편한 산책**: `/` 랜딩(미션 5) + `/walk` PWA + `/reviews` Supabase 후기 CRUD(미션 6).
- 표준 Next.js (`pnpm dev` / `pnpm build`). Vercel 제출용. vinext 스크립트는 쓰지 않음.
- GitHub 공개 저장소: https://github.com/leehyering01-spec/mampyeonhan-sanchek (`main`).
- 로컬 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 있음 (gitignored). 값은 문서에 적지 않음.
- `walk_reviews` + Storage `review-photos` 연결됨. 로컬에서 등록·수정·삭제·사진 업로드 확인.
- Vercel 프로덕션: https://mampyeonhan-sanchek.vercel.app
- 제출: `feature/mission-6` 브랜치에서 PR 제목 `[이혜리]-미션6`.

## 화면

| 경로 | 역할 |
|------|------|
| `/` | 소개 랜딩. CTA: `/reviews`, `/walk` |
| `/walk` | 기존 모바일 PWA. 온보딩 → 설정 → 홈/탐색 → 상세 → 출발 → 길안내 → 완료. 완료 화면 「후기 남기기」→ `/reviews/new?destination=...` |
| `/reviews` | 후기 목록. 검색·목적지 필터·최신/별점 정렬·페이지네이션 |
| `/reviews/new` | 등록 |
| `/reviews/[id]` | 상세. 없는 id는 `없는 후기입니다` |
| `/reviews/[id]/edit` | 수정 |

## 데이터

- 목적지 카탈로그: `app/data/*.json` (52곳, 단지 2곳). DB로 옮기지 않음.
- 프로필·PWA 산책 GPS 기록: `localStorage` (`mampyeonhan:*`).
- 산책 후기 최종 저장소: Supabase `walk_reviews` + Storage `review-photos`.
- 인증·사용자별 RLS는 미션 7. 이번 미션은 실명·연락처·아이 정보·GPS를 후기 테이블에 넣지 않음.

## 완료된 것

- 랜딩(Figma 브랜드 + Gamma 카피), FAQ 아코디언, 모바일 메뉴
- `/walk` 출입구 고정 OSRM 경로, 상시 「산책 완료」
- 후기 CRUD Server Actions, 검증, 로딩/빈/에러/없는 글, 사진 업로드·미리보기·삭제
- README 기능 명세·테이블·환경 변수 이름·QA 체크리스트
- GitHub 공개 푸시

## 작업 중 / 막힌 것

1. **멘토 제출** — PR https://github.com/leehyering01-spec/mampyeonhan-sanchek/pull/1 을 올린 뒤 디스코드 DM으로 리뷰 요청.
2. GitHub 앱을 Vercel에 연결하면 이후 푸시가 자동 배포된다 (지금은 CLI 배포).

## 건드리면 위험한 부분

| 영역 | 이유 |
|------|------|
| `app/walk/page.tsx` view 분기 | 전 UX가 한 파일에 결합 |
| `COMPLEX_TO_NEAREST` ↔ `nearest_complex` | 불일치 시 `/walk` 목록이 빔 |
| `NavMap` origin 고정 | 다시 현재 GPS로 라우팅하면 산 경유 재발 |
| `.env.local` | 커밋·채팅·README에 값 금지 |
| `walk_reviews` RLS를 미션 7 전에 사용자별로 켜기 | 미션 6 평가용 쓰기 실패 |

## 실행

```sh
pnpm install
cp .env.example .env.local   # URL/anon key만 채움
# Supabase SQL Editor에서 supabase/schema.sql 실행
pnpm dev                     # http://localhost:3000
pnpm build && pnpm start
```

## 환경 변수 이름

값은 적지 않음.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
