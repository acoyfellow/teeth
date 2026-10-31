#!/usr/bin/env bash
set -uo pipefail
repo="$1"; file="$2"; line="$3"; from="$4"; to="$5"; test_cmd="$6"
work="$(mktemp -d)/$(basename "$repo")"
rsync -a --exclude .git --exclude node_modules "$repo/" "$work/"
ln -s "$repo/node_modules" "$work/node_modules"
cd "$work"
before="$(sed -n "${line}p" "$file")"
python3 - "$file" "$line" "$from" "$to" <<'PY'
import sys
path, line, old, new = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
lines = open(path).read().split("\n")
assert old in lines[line - 1], f"{old!r} not on line {line}"
lines[line - 1] = lines[line - 1].replace(old, new, 1)
open(path, "w").write("\n".join(lines))
PY
after="$(sed -n "${line}p" "$file")"
echo "repo: $(basename "$repo")  file: $file:$line"
echo "before: $(echo "$before" | sed 's/^ *//')"
echo "after:  $(echo "$after" | sed 's/^ *//')"
echo "test:   $test_cmd"
output="$(sh -c "$test_cmd" 2>&1)"; code=$?
echo "$output" | grep -E "Tests +[0-9]|Test Files|^ℹ (pass|fail)|^ *[0-9]+ pass|^ *[0-9]+ fail" | tail -4
echo "exit:   $code"
rm -rf "$(dirname "$work")"
