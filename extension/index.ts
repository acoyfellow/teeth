import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { gateSegment } from "../bin/teeth.mjs";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "teeth.mjs");
const MAX_NUDGES = 2;

type Verdict = { label: string; reason: string; hints: string[]; files: string[]; killed: number; evaluated: number };

export function refusal(verdict: Verdict): string {
  return [
    `teeth: ${verdict.label}. ${verdict.reason}.`,
    `Your gate passed, but it killed only ${verdict.killed} of ${verdict.evaluated} bugs planted in ${verdict.files.join(", ")}.`,
    "A gate that passes broken code cannot prove this work is done. Do not say it is done.",
    "Write tests that fail for each of these, then run the gate again:",
    ...verdict.hints.map((hint) => `  - ${hint}`),
  ].join("\n");
}

function runTeeth(cwd: string, testCommand: string, min: string): Promise<Verdict | null> {
  return new Promise((resolvePromise) => {
    execFile("node", [CLI, "check", cwd, "--test", testCommand, "--min", min, "--json"], { cwd, timeout: 600_000, maxBuffer: 16 * 1024 * 1024 }, (_error, stdout) => {
      try {
        const result = JSON.parse(stdout);
        if (result.files.length === 0 || result.verdict.label === "NO-SITES") return resolvePromise(null);
        resolvePromise({ label: result.verdict.label, reason: result.verdict.reason, hints: result.hints, files: result.files, killed: result.killed, evaluated: result.evaluated });
      } catch {
        resolvePromise(null);
      }
    });
  });
}

export default function teeth(pi: ExtensionAPI) {
  const min = process.env.TEETH_MIN ?? "0.5";
  let toothless: Verdict | null = null;
  let nudges = 0;

  pi.on("agent_start", async () => {
    nudges = 0;
  });

  pi.on("tool_result", async (event, ctx) => {
    if (event.toolName !== "bash" || event.isError) return undefined;
    const command = gateSegment(String(event.input.command ?? ""));
    if (!command) return undefined;
    const verdict = await runTeeth(ctx.cwd, command, min);
    if (!verdict) return undefined;
    if (verdict.label !== "TOOTHLESS") {
      toothless = null;
      return { content: [...event.content, { type: "text", text: `\nteeth: ${verdict.label}. ${verdict.reason}.` }] };
    }
    toothless = verdict;
    return { content: [...event.content, { type: "text", text: `\n${refusal(verdict)}` }] };
  });

  pi.on("agent_before_settle", async () => {
    if (!toothless || nudges >= MAX_NUDGES) return undefined;
    nudges++;
    return {
      continue: true,
      entries: [{ type: "custom_message", customType: "teeth", display: true, content: `Not done.\n${refusal(toothless)}` }],
    };
  });
}
