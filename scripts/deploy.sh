#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22+ 가 필요합니다."
  exit 1
fi

if command -v pnpm >/dev/null 2>&1; then
  pnpm build
else
  node ./node_modules/vinext/dist/cli.js build
fi

if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || npx wrangler whoami >/dev/null 2>&1; then
  npx wrangler deploy -c dist/server/wrangler.json
else
  echo ""
  echo "빌드는 완료되었습니다. 공개 배포를 위해 다음을 실행하세요:"
  echo "  npx wrangler login"
  echo "  npx wrangler deploy -c dist/server/wrangler.json"
  echo ""
  echo "또는 OpenAI Sites에서 이 프로젝트(project_id in .openai/hosting.json)를 publish 하세요."
  exit 0
fi
