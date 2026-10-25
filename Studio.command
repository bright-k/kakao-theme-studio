#!/bin/zsh
set -euo pipefail
cd "${0:A:h}"
studio_node=""
for candidate in "$(command -v node 2>/dev/null || true)" /opt/homebrew/bin/node /usr/local/bin/node "$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"; do
  if [[ -n "$candidate" && -x "$candidate" ]]; then studio_node="$candidate"; break; fi
done
if [[ -z "$studio_node" ]]; then
  print 'Node.js 22 이상을 설치한 뒤 다시 실행하세요.'
  read '?Enter를 누르면 종료합니다. '
  exit 1
fi
if [[ ! -d node_modules/sharp ]]; then
  print '의존성 설치가 필요합니다. README.md의 최초 설치 방법을 확인하세요.'
  read '?Enter를 누르면 종료합니다. '
  exit 1
fi
"$studio_node" scripts/launch.mjs
