# 베타 스모크 · 배포

## 빌드

```sh
pnpm build && pnpm start
```

로컬 개발은 `pnpm dev` (http://localhost:3000). vinext/wrangler는 제출 경로가 아니다.

## HTTPS 배포 (Vercel)

GitHub: https://github.com/leehyering01-spec/mampyeonhan-sanchek

1. Vercel에 GitHub 저장소를 연결한다.
2. Project Settings → Environment Variables에 이름만 아래 두 개를 넣는다 (값은 GitHub에 올리지 않음).
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Production 배포 URL이 나오면 README 「배포 URL」에 적는다.
4. 배포 URL에서 후기 등록·조회·수정·삭제·사진 업로드를 다시 확인한다.

배포 URL: https://mampyeonhan-sanchek.vercel.app

## 후기 CRUD 스모크

- [x] 빈 값 제출 시 브라우저 필수값 안내
- [x] 짧은 후기(10자 미만) 제출 시 「후기는 10자 이상 500자 이하」
- [x] 사진 없이 등록 → 상세에 「사진 없음」
- [x] 등록 후 목록·상세 반영, 새로고침 유지
- [x] 수정·삭제 후 화면 반영
- [x] `/reviews/not-a-real-id` → 없는 후기 안내
- [x] 잘못된 파일 형식 안내 (JPG/PNG/WEBP만)
- [x] 랜딩 CTA → `/reviews`, `/walk`
- [x] `/walk` 완료 화면 「후기 남기기」가 `/reviews/new?destination=...` 로 연결 (코드 확인)

## `/walk` 모바일 스모크 (기존)

- [ ] 휴대폰에서 HTTPS로 연다
- [ ] 생활권 전환 시 목적지 목록이 바뀐다
- [ ] 하트 저장 → 저장 탭 (새로고침 유지)
- [ ] 목적지 → 출입구 → 길안내 시작
- [ ] 위치 허용 시 시간·거리 갱신 / 거부 시 안내
- [ ] 「산책 완료」는 조건 없이 가능 (10분·400m·200m 게이트 없음)
- [ ] 재방문 시 생활권·저장·기록 유지
