#!/usr/bin/env bash
set -uo pipefail
repo="${TEETH_REPO:-acoyfellow/teeth}"
guardrail="${GUARDRAIL:-guardrail}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
fail=0
check() { printf '%-40s' "$1"; shift; if "$@" >"$work/out" 2>&1; then echo PASS; else echo "FAIL"; tail -5 "$work/out" | sed 's/^/    /'; fail=1; fi; }

check "repo is public" sh -c "[ \"\$(gh repo view $repo --json visibility -q .visibility)\" = PUBLIC ]"
check "fresh clone" git clone -q "https://github.com/$repo.git" "$work/teeth"
check "README and LICENSE present" test -f "$work/teeth/README.md" -a -f "$work/teeth/LICENSE"
check "gate passes in the clone" bash "$work/teeth/gate.sh"
check "guardrail publish passes" sh -c "cd '$work/teeth' && $guardrail publish --exit-code"
check "gitleaks finds no secrets" gitleaks git --no-banner --redact "$work/teeth"
check "no machine paths or private names" sh -c "! grep -rnE '/Users/|/var/folders/|opencode|cfdata|31b91e7f|bfcb6ac5' --exclude-dir=.git --exclude=ship-check.sh --exclude=clean-transcript.py '$work/teeth'"
exit $fail
