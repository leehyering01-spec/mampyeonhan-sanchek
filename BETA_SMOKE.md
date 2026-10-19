# 베타 스모크 · 배포

## 빌드 상태

로컬에서 `vinext build` 성공 확인됨. 산출물: `dist/` (PWA `manifest`·`sw.js`·icons 포함).

## HTTPS URL 배포

이 환경에는 Cloudflare/`wrangler` 로그인이 없어 **공개 HTTPS URL을 여기서 바로 발행하지 못했습니다.**

인증 후 아래 중 하나로 배포하세요.

### A. OpenAI Sites (기존 `project_id` 사용)

Codex/Sites 워크플로에서 이 프로젝트를 다시 publish 하거나, Sites 연동 배포를 사용합니다.
`.openai/hosting.json`의 `project_id`가 이미 있습니다.

### B. Cloudflare Workers (wrangler)

```sh
# Node 22+ 필요
cd web_beta
pnpm install   # 또는 npm i
pnpm build
npx wrangler login
npx wrangler deploy -c dist/server/wrangler.json
```

배포 URL이 나오면 README 상단과 이 파일에 URL을 적어 공유하세요.

## 모바일 스모크 체크리스트

배포 URL (HTTPS): ______________________

- [ ] 휴대폰 Safari/Chrome에서 페이지가 열린다
- [ ] 생활권 전환 시 목적지 목록이 바뀐다
- [ ] 하트 저장 → 저장 탭 표시 (새로고침 유지)
- [ ] 목적지 → 출입구 → 산책 시작
- [ ] 위치 권한 허용 시 시간·거리 갱신
- [ ] 권한 거부 시 안내 + `위치 다시 확인`
- [ ] 세 조건 전 `다녀왔어요` 비활성
- [ ] 완료 후 별점·메모가 기록에 남음
- [ ] `베타 데이터 내보내기` 동작
- [ ] 재방문 시 방문 횟수·생활권·저장·기록 유지
- [ ] `앱으로 설치` 또는 iOS 홈 화면 추가

## PWA 확인

- [ ] `/manifest.webmanifest` 200
- [ ] `/icons/icon-192.png`, `/icons/icon-512.png` 200
- [ ] `/sw.js` 등록 (개발자도구 → Application)
- [ ] standalone/홈화면에서 주소창 없이 실행
