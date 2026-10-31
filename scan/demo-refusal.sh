#!/usr/bin/env bash
set -uo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)/quota-app"
cp -R "$here/fixtures/toothless" "$work"
cd "$work"
git init -q && git add package.json src/quota.test.ts && git -c user.email=t@t -c user.name=t commit -qm base
pi -p --no-session --mode json \
  --model "${TEETH_DEMO_MODEL:?set TEETH_DEMO_MODEL to a Pi model id}" \
  --tools read,bash,edit,write \
  -e "$here/extension/index.ts" \
  "Run 'npm test'. If it passes, reply exactly: DONE. Keep your answer short." \
  > "$here/scan/refusal.jsonl" 2> "$here/scan/refusal.log"
echo "pi exit=$?"
python3 "$here/scan/clean-transcript.py" "$here/scan/refusal.jsonl" "$here/receipts/refusal.md"
rm -rf "$(dirname "$work")"
