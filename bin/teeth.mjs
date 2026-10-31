#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OPERATORS = [
  "cond-boundary-gt",
  "cond-boundary-lt",
  "logical-and-to-or",
  "logical-or-to-and",
  "equality-strict-to-loose-neg",
  "inequality-to-equality",
  "return-true-to-false",
  "return-false-to-true",
];

const OPERATOR_TEXT = {
  "cond-boundary-gt": "`>` became `>=`",
  "cond-boundary-lt": "`<` became `<=`",
  "logical-and-to-or": "`&&` became `||`",
  "logical-or-to-and": "`||` became `&&`",
  "equality-strict-to-loose-neg": "`===` became `!==`",
  "inequality-to-equality": "`!==` became `===`",
  "return-true-to-false": "`return true` became `return false`",
  "return-false-to-true": "`return false` became `return true`",
};

export function parseArgs(argv) {
  const options = { repo: null, files: [], min: 0.5, test: "npm test --silent", json: false, mutant: null, timeoutMs: 60000 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => argv[++i];
    if (arg === "--files") options.files = next().split(",").filter(Boolean);
    else if (arg === "--min") options.min = Number(next());
    else if (arg === "--test") options.test = next();
    else if (arg === "--json") options.json = true;
    else if (arg === "--mutant") options.mutant = next();
    else if (arg === "--timeout-ms") options.timeoutMs = Number(next());
    else if (arg === "check") continue;
    else if (!options.repo) options.repo = resolve(arg);
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!options.repo) throw new Error("usage: teeth check <repo> [--files a.ts,b.ts] [--min 0.5] [--test CMD] [--json]");
  if (!(options.min >= 0 && options.min <= 1)) throw new Error("--min must be between 0 and 1");
  return options;
}

const GATE_SEGMENT = /(^|[\s/])(gate\.sh|vitest|jest|bun test|node (--\S+ )*--test|npm (run )?test|pnpm (run )?test|pytest|cargo test|go test)\b/;

export function gateSegment(command) {
  const withoutComment = command.replace(/\s+#[^\n]*$/, "").replace(/perl -e '[^']*'\s+/g, "");
  const segments = withoutComment.split(/\s*(?:;|&&|\|\||\n)\s*/);
  const found = segments.find((segment) => GATE_SEGMENT.test(segment));
  if (!found) return null;
  return found
    .split(/\s\|\s*/)[0]
    .replace(/\s*\d?>&\d/g, "")
    .replace(/\s*\d?>\s*\S+/g, "")
    .replace(/^(timeout|gtimeout)\s+\S+\s+/, "")
    .trim();
}

export function changedFiles(repo) {
  const run = (args) => {
    try {
      return execFileSync("git", args, { cwd: repo, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    } catch {
      return "";
    }
  };
  const listed = `${run(["diff", "--name-only", "HEAD"])}\n${run(["ls-files", "--others", "--exclude-standard"])}`;
  return [...new Set(listed.split("\n"))].filter(isMutableSource);
}

export function isMutableSource(path) {
  return /\.(ts|tsx|mts)$/.test(path) && !/\.(test|spec)\.|\.d\.ts$|\.generated\./.test(path) && !path.includes("node_modules/");
}

export function findMutant(explicit) {
  const candidates = [explicit, process.env.TEETH_MUTANT, "mutant"];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate === "mutant" || existsSync(candidate)) return candidate;
  }
  return "mutant";
}

export function score(reports) {
  const mutants = reports.flatMap((report) => report.mutants.map((mutant) => ({ ...mutant, file: report.file })));
  const killed = mutants.filter((mutant) => mutant.status === "killed" || mutant.status === "timeout").length;
  const survived = mutants.filter((mutant) => mutant.status === "survived");
  const evaluated = killed + survived.length;
  return { evaluated, killed, survived, bite: evaluated === 0 ? null : killed / evaluated };
}

export function hint(repo, survivor) {
  const path = join(repo, survivor.file);
  const line = existsSync(path) ? (readFileSync(path, "utf8").split("\n")[survivor.line - 1] ?? "").trim() : "";
  return `${survivor.file}:${survivor.line}  ${OPERATOR_TEXT[survivor.operator] ?? survivor.operator} and every test still passes.  ${line ? `[ ${line} ]` : ""}`.trimEnd();
}

export function verdict(result, min) {
  if (result.baselineRed) return { code: 2, label: "RED", reason: `the test suite fails on unchanged code, so it cannot judge anything (${result.redDetail ?? "no detail"})` };
  if (result.bite === null) return { code: 0, label: "NO-SITES", reason: "no mutable decision points in these files" };
  if (result.bite < min) return { code: 1, label: "TOOTHLESS", reason: `bite rate ${pct(result.bite)} is under ${pct(min)}` };
  return { code: 0, label: "TEETH", reason: `bite rate ${pct(result.bite)} meets ${pct(min)}` };
}

const pct = (value) => `${Math.round(value * 100)}%`;

function runMutant(options, file) {
  const args = ["run", "--repo", options.repo, "--file", file, "--operators", OPERATORS.join(","), "--test", options.test, "--json", "--timeout-ms", String(options.timeoutMs)];
  const done = spawnSync(findMutant(options.mutant), args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  try {
    return { file, ...JSON.parse(done.stdout) };
  } catch {
    const stderr = done.stderr ?? "";
    if (/meaningless|baseline|timed out/i.test(stderr)) return { file, baselineRed: true, mutants: [], stderr };
    throw new Error(`mutant gave no report for ${file}: ${stderr.slice(-400)}`);
  }
}

export function check(options) {
  const files = options.files.length > 0 ? options.files : changedFiles(options.repo);
  const reports = files.map((file) => runMutant(options, file));
  const red = reports.find((report) => report.baselineRed);
  const result = { repo: options.repo, files, baselineRed: Boolean(red), redDetail: red ? red.stderr.trim().split("\n").slice(-3).join(" ") : null, ...score(reports) };
  return { ...result, verdict: verdict(result, options.min), hints: result.survived.map((survivor) => hint(options.repo, survivor)) };
}

function print(result, min) {
  const { label, reason } = result.verdict;
  console.log(`teeth: ${label} — ${reason}`);
  console.log(`files: ${result.files.join(", ") || "(none changed)"}`);
  if (result.bite !== null) console.log(`killed ${result.killed} of ${result.evaluated} planted bugs (need ${pct(min)})`);
  if (result.hints.length > 0) {
    console.log("\nBugs your tests do not catch. Write a test that fails for each:");
    for (const line of result.hints) console.log(`  ${line}`);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = check(options);
  if (options.json) console.log(JSON.stringify({ ...result, survived: result.survived.length }));
  else print(result, options.min);
  process.exit(result.verdict.code);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
