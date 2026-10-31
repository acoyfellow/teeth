# Hand-check: scan survivors are real

Each run copies the repo to a temp dir, applies one survivor from `scan/bite.jsonl` by hand, and runs the repo's own tests. Exit 0 means the bug ships green.

Command: `scan/handcheck.sh <repo> <file> <line> <from> <to> <test>`

```
repo: porch  file: src/relay.ts:121
before: if (url.pathname === '/rtc/publish' && request.method === 'POST') return this.rtcPublish(request);
after:  if (url.pathname === '/rtc/publish' || request.method === 'POST') return this.rtcPublish(request);
test:   npx vitest run
 Test Files  2 passed (2)
      Tests  9 passed (9)
exit:   0
```

```
repo: zoo  file: src/worker/world.ts:299
before: const near = { x: corner % 2 === 0 ? 200 : 600, y: corner < 2 ? 200 : 600 };
after:  const near = { x: corner % 2 === 0 ? 200 : 600, y: corner <= 2 ? 200 : 600 };
test:   bun test ./test
 56 pass
 0 fail
exit:   0
```

## What the porch bug does

Any POST to the relay goes to `rtcPublish`, whatever the path. 9 of 9 tests pass.

## What the zoo bug does

The third starter creature spawns in the wrong corner. 56 of 56 tests pass.
