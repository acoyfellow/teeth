#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "$0")"
fail=0
step() { printf '%-44s' "$1"; }
ok() { echo "PASS"; }
bad() { echo "FAIL  $1"; fail=1; }

fixture() {
  node bin/teeth.mjs check "fixtures/$1" --files src/quota.ts --test "node --experimental-strip-types --test src/quota.test.ts" >/dev/null 2>&1
  echo $?
}

step "1. toothless fixture exits 1"
code=$(fixture toothless); [ "$code" = 1 ] && ok || bad "exit $code"

step "2. toothed fixture exits 0"
code=$(fixture toothed); [ "$code" = 0 ] && ok || bad "exit $code"

step "3. unit tests pass"
node --test test/teeth.test.mjs >/dev/null 2>&1 && ok || bad "node --test failed"

step "4. hand-check receipts show green bugs"
if [ -f receipts/handcheck.md ] && [ "$(grep -c '^exit:   0$' receipts/handcheck.md)" -ge 2 ] && grep -q 'repo: porch' receipts/handcheck.md && grep -q 'repo: zoo' receipts/handcheck.md; then ok; else bad "receipts/handcheck.md missing porch/zoo green runs"; fi

step "5. Pi run: refused, fixed tests, then done"
if [ -f receipts/refusal.md ] && python3 scan/refusal-order.py receipts/refusal.md; then ok; else bad "no TOOTHLESS -> TEETH -> DONE sequence in receipts/refusal.md"; fi

exit $fail
