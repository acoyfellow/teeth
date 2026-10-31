# teeth

A gate is only proof if it can fail. **teeth** checks that your tests catch real bugs before an agent is allowed to say "done".

It plants small bugs in the code you changed (`<` → `<=`, `&&` → `||`, `===` → `!==`, `return true` → `return false`), runs your real test command against each one, and counts how many your tests catch. That count is the **bite rate**. If the bite rate is under the line, the gate has no teeth, and teeth says so with one hint per bug that got through.

```
$ teeth check fixtures/toothless --files src/quota.ts --test "node --experimental-strip-types --test src/quota.test.ts"
teeth: TOOTHLESS — bite rate 0% is under 50%
files: src/quota.ts
killed 0 of 5 planted bugs (need 50%)

Bugs your tests do not catch. Write a test that fails for each:
  src/quota.ts:2  `<` became `<=` and every test still passes.  [ return used < limit; ]
  src/quota.ts:6  `===` became `!==` and every test still passes.  [ if (role === "admin") return true; ]
  src/quota.ts:6  `return true` became `return false` and every test still passes.  [ if (role === "admin") return true; ]
  src/quota.ts:7  `===` became `!==` and every test still passes.  [ return role === "editor" && verified; ]
  src/quota.ts:7  `&&` became `||` and every test still passes.  [ return role === "editor" && verified; ]
```

Exit codes: `0` the gate has teeth, `1` toothless, `2` the suite already fails on unchanged code.

## Why

Agents say "done" when the tests pass. Tests that pass broken code make that word worthless, and a coding agent is very good at writing tests like that.

A scan of 58 real TypeScript repos ([receipts/scan.md](receipts/scan.md)), $0 and no model calls:

| | |
|---|---|
| Planted bugs that every test missed | **53%** (481 of 901) |
| Files whose tests catch fewer than half | **50%** (41 of 82) |
| Files whose tests catch none | 26 |

Two of the misses, checked by hand in [receipts/handcheck.md](receipts/handcheck.md):

- a phone relay where **any POST** reaches the publish handler, whatever the path. 9 of 9 tests pass.
- a game world where the third creature spawns in **the wrong corner**. 56 of 56 tests pass.

## In an agent loop

`extension/` is a [Pi](https://github.com/earendil-works/pi) extension. After any test or gate command passes, it runs `teeth check` on the files the agent changed.

- **Toothless:** it adds the hints to the tool result, and if the agent then tries to stop, it sends it back with "Not done".
- **Has teeth:** it adds one line and does nothing else.

[receipts/refusal.md](receipts/refusal.md) is a real run. The agent is told to run the tests and say DONE if they pass. The tests pass. teeth says TOOTHLESS, 0 of 5. The agent writes boundary and role tests, teeth says 100%, and only then does the agent say DONE.

```sh
pi -e ./extension/index.ts          # one session
pi install /path/to/teeth           # every session
TEETH_MIN=0.8 pi -e ./extension/index.ts
```

## Install

teeth drives [mutant](https://github.com/acoyfellow/mutant), a mutation-testing CLI for TypeScript.

```sh
git clone https://github.com/acoyfellow/mutant && cd mutant && cargo build --release
export PATH="$PWD/target/release:$PATH"      # or set TEETH_MUTANT to the binary

git clone https://github.com/acoyfellow/teeth && cd teeth
node bin/teeth.mjs check <repo> [--files a.ts,b.ts] [--min 0.5] [--test "npm test --silent"] [--json]
```

With no `--files`, it checks the TypeScript files changed since `HEAD`, plus untracked files. Tests, `.d.ts` and `.generated.` files are skipped. Node 22.6 or later.

## Check this repo

```sh
./gate.sh
```

1. The toothless fixture exits 1.
2. The toothed fixture, the same code with real tests, exits 0.
3. Unit tests pass.
4. The hand-checked bugs are recorded and ship green.
5. The Pi transcript shows refused → tests written → teeth → done, in that order.

## Limits

- **Only 8 kinds of bug.** Boundaries, `&&`/`||`, `===`/`!==` and returned booleans. It does not plant wrong numbers, missing calls or deleted lines.
- **Equivalent mutants are not filtered.** Some planted changes alter nothing a test could see, so some hints ask for an impossible test. In an earlier hand-labelled set, 29% were like that.
- **It costs time.** About one full test run per planted bug, 4 at a time. On a slow suite, keep `--files` small.
- **One agent run is shown, not measured.** There is no A/B yet of teeth on and off across many tasks.
- **TypeScript only**, because mutant parses TypeScript.
- Your test command runs in a temp copy of the repo, but `node_modules` is linked, not copied. Do not point it at code you do not trust.

MIT licensed.
