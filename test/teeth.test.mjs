import { test } from "node:test";
import assert from "node:assert/strict";
import { gateSegment, isMutableSource, parseArgs, score, verdict } from "../bin/teeth.mjs";

test("parseArgs reads repo, files, min and test command", () => {
  const options = parseArgs(["check", "/tmp/repo", "--files", "a.ts,b.ts", "--min", "0.8", "--test", "bun test"]);
  assert.equal(options.repo, "/tmp/repo");
  assert.deepEqual(options.files, ["a.ts", "b.ts"]);
  assert.equal(options.min, 0.8);
  assert.equal(options.test, "bun test");
});

test("parseArgs rejects a min outside 0..1", () => {
  assert.throws(() => parseArgs(["/tmp/repo", "--min", "2"]), /between 0 and 1/);
});

test("parseArgs requires a repo", () => {
  assert.throws(() => parseArgs(["check"]), /usage/);
});

test("only hand-written TypeScript sources are mutated", () => {
  assert.equal(isMutableSource("src/a.ts"), true);
  assert.equal(isMutableSource("src/a.tsx"), true);
  assert.equal(isMutableSource("src/a.test.ts"), false);
  assert.equal(isMutableSource("src/a.spec.ts"), false);
  assert.equal(isMutableSource("src/a.d.ts"), false);
  assert.equal(isMutableSource("src/bundles.generated.ts"), false);
  assert.equal(isMutableSource("node_modules/x/a.ts"), false);
  assert.equal(isMutableSource("README.md"), false);
});

test("score counts timeouts as killed and ignores errors", () => {
  const result = score([{ file: "a.ts", mutants: [
    { line: 1, operator: "x", status: "killed" },
    { line: 2, operator: "x", status: "timeout" },
    { line: 3, operator: "x", status: "survived" },
    { line: 4, operator: "x", status: "error" },
  ] }]);
  assert.equal(result.evaluated, 3);
  assert.equal(result.killed, 2);
  assert.equal(result.survived.length, 1);
  assert.equal(result.survived[0].file, "a.ts");
  assert.equal(result.bite, 2 / 3);
});

test("score of no mutants has no bite rate", () => {
  assert.equal(score([{ file: "a.ts", mutants: [] }]).bite, null);
});

test("verdict: under the line is toothless, exit 1", () => {
  assert.deepEqual(verdict({ bite: 0.49, baselineRed: false }, 0.5).code, 1);
  assert.equal(verdict({ bite: 0.49, baselineRed: false }, 0.5).label, "TOOTHLESS");
});

test("verdict: exactly on the line has teeth, exit 0", () => {
  assert.equal(verdict({ bite: 0.5, baselineRed: false }, 0.5).code, 0);
});

test("verdict: a red baseline is its own failure, exit 2", () => {
  assert.equal(verdict({ bite: 1, baselineRed: true }, 0.5).code, 2);
});

test("verdict: no sites is not a failure", () => {
  assert.equal(verdict({ bite: null, baselineRed: false }, 0.5).label, "NO-SITES");
});

test("gateSegment keeps the test command and drops pipes, redirects, timeouts and comments", () => {
  assert.equal(gateSegment("npm test 2>&1 | tail -30"), "npm test");
  assert.equal(gateSegment("timeout 120 npm test 2>&1 | tail -30; echo exit=${PIPESTATUS[0]}"), "npm test");
  assert.equal(gateSegment("npm test 2>&1 | tail -15 # frugal:allow-long"), "npm test");
  assert.equal(gateSegment("cd app && npx vitest run src/a.test.ts > out.log"), "npx vitest run src/a.test.ts");
  assert.equal(gateSegment("perl -e 'alarm 110; exec @ARGV' ./gate.sh"), "./gate.sh");
});

test("gateSegment ignores commands that are not gates", () => {
  assert.equal(gateSegment("cat src/quota.test.ts"), null);
  assert.equal(gateSegment("ls test"), null);
});
