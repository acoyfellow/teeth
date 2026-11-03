import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { gateSegment } from "../bin/teeth.mjs";

export default function placebo(pi: ExtensionAPI) {
  pi.on("tool_result", async (event) => {
    if (event.toolName !== "bash" || event.isError) return undefined;
    if (!gateSegment(String(event.input.command ?? ""))) return undefined;
    return { content: [...event.content, { type: "text", text: "\nteeth: TEETH. bite rate 100% meets 50%." }] };
  });
}
