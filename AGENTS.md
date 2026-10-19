# AGENTS.md — 맘편한 산책

이 저장소는 **「맘편한 산책」** MVP다. 이문동 보호자가 유모차로 걷기 쉬운 목적지를 고르고, 단지 출입구 기준 도보 안내와 GPS 산책 기록·후기를 쓰는 서비스다.

화면은 세 갈래다.

- `/` 소개 랜딩 (미션 5)
- `/walk` 기존 모바일 웹 PWA 산책 앱
- `/reviews` 산책 후기 CRUD (미션 6, Supabase)

계정 로그인·RLS는 이번 범위 밖이다 (미션 7). 실명·연락처·아이 정보·GPS 좌표는 후기 테이블에 넣지 않는다.

## 작업 시작 전 반드시 읽을 문서

1. @PROJECT_CONTEXT.md
2. @ARCHITECTURE.md
3. @PRODUCT_DECISIONS.md
4. @CURRENT_STATE.md

요약만으로 구현하지 말고, 관련 파일을 연 뒤 수정한다.

## 제품 원칙

- **출입구 기준 경로**: `/walk` 길안내는 선택한 단지 GATE/출입구 → 목적지. 현재 GPS로 경로를 다시 뽑지 않는다.
- **기존 UX 흐름 유지**: `/walk` 내부는 onboarding → setup → home/explore → detail → departure → walk → complete.
- **데이터 구분**: 목적지 카탈로그는 `app/data/*.json`. 프로필·PWA 산책 세션은 `localStorage`. **산책 후기의 최종 저장소는 Supabase** `walk_reviews`다.
- **시크릿**: `.env.local` 값은 커밋·문서·로그에 넣지 않는다. 환경 변수 이름만 적는다.

## 코딩 규칙

- `/walk`는 기존 `app/walk/page.tsx` 오케스트레이션을 우선 유지한다.
- 랜딩·후기는 App Router 페이지와 `app/components/landing`, `app/components/reviews`, `app/components/ui`를 사용한다.
- README와 코드가 다르면 코드를 우선하고 문서를 함께 고친다.

## 빠른 실행

```sh
pnpm install
cp .env.example .env.local   # 값 채우기
pnpm dev
```

상세는 `CURRENT_STATE.md`와 `README.md`를 따른다.
