# Pi run with the teeth extension

The repo is `fixtures/toothless`: real code, weak tests. The model is Claude Sonnet.
Each block is one message, in order. Long tool output is trimmed to its last lines.

## task

```
Run 'npm test'. If it passes, reply exactly: DONE. Keep your answer short.
```

## agent runs

```sh
npm test 2>&1 | tail -30
```

## tool result

```
(another extension blocked an unbounded test run; the agent retried with a time-limit marker)
```

## agent runs

```sh
npm test 2>&1 | tail -30 # frugal:allow-long
```

## tool result

```
> test
> node --experimental-strip-types --test src/quota.test.ts

✔ functions return booleans (0.323709ms)
ℹ tests 1
ℹ suites 0
ℹ pass 1
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 67.942708
```

## tool result

```
teeth: TOOTHLESS. bite rate 0% is under 50%.
Your gate passed, but it killed only 0 of 5 bugs planted in src/quota.ts.
A gate that passes broken code cannot prove this work is done. Do not say it is done.
Write tests that fail for each of these, then run the gate again:
  - src/quota.ts:2  `<` became `<=` and every test still passes.  [ return used < limit; ]
  - src/quota.ts:6  `===` became `!==` and every test still passes.  [ if (role === "admin") return true; ]
  - src/quota.ts:6  `return true` became `return false` and every test still passes.  [ if (role === "admin") return true; ]
  - src/quota.ts:7  `===` became `!==` and every test still passes.  [ return role === "editor" && verified; ]
  - src/quota.ts:7  `&&` became `||` and every test still passes.  [ return role === "editor" && verified; ]
```

## agent runs

```sh
cat src/quota.ts src/quota.test.ts
```

## tool result

```
}

export function canPublish(role: string, verified: boolean): boolean {
  if (role === "admin") return true;
  return role === "editor" && verified;
}
import { test } from "node:test";
import assert from "node:assert/strict";
import { canPublish, withinQuota } from "./quota.ts";

test("functions return booleans", () => {
  assert.equal(typeof withinQuota(1, 2), "boolean");
  assert.equal(typeof canPublish("admin", false), "boolean");
});
```

## agent runs

```sh
cat >> src/quota.test.ts <<'EOF'

test("withinQuota is strict", () => {
  assert.equal(withinQuota(1, 2), true);
  assert.equal(withinQuota(2, 2), false);
  assert.equal(withinQuota(3, 2), false);
});

test("canPublish rules", () => {
  assert.equal(canPublish("admin", false), true);
  assert.equal(canPublish("admin", true), true);
  assert.equal(canPublish("editor", true), true);
  assert.equal(canPublish("editor", false), false);
  assert.equal(canPublish("viewer", true), false);
  assert.equal(canPublish("viewer", false), false);
});
EOF
npm test 2>&1 | tail -15 # frugal:allow-long
```

## tool result

```
> test
> node --experimental-strip-types --test src/quota.test.ts

✔ functions return booleans (0.363166ms)
✔ withinQuota is strict (0.057459ms)
✔ canPublish rules (0.052708ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 72.517708
```

## tool result

```
teeth: TEETH. bite rate 100% meets 50%.
```

## agent says

```
DONE
```
