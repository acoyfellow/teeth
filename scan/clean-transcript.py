import json
import re
import sys

source, target = sys.argv[1], sys.argv[2]
HEADERS = {"user": "## task", "assistant": "## agent says", "toolResult": "## tool result"}
BLOCKED = "(another extension blocked an unbounded test run; the agent retried with a time-limit marker)"

out = [
    "# Pi run with the teeth extension",
    "",
    "The repo is `fixtures/toothless`: real code, weak tests. The model is Claude Sonnet.",
    "Each block is one message, in order. Long tool output is trimmed to its last lines.",
    "",
]
for line in open(source):
    try:
        entry = json.loads(line)
    except json.JSONDecodeError:
        continue
    if entry.get("type") != "message_end":
        continue
    message = entry["message"]
    role = message.get("role")
    content = message.get("content")
    parts = [{"type": "text", "text": content}] if isinstance(content, str) else content or []
    for part in parts:
        if part.get("type") == "toolCall":
            out += ["## agent runs", "", "```sh", part.get("arguments", {}).get("command", "").strip(), "```", ""]
        elif part.get("type") == "text" and part["text"].strip():
            text = part["text"].strip()
            if "pi-frugal blocked" in text:
                text = BLOCKED
            elif role == "toolResult":
                text = "\n".join(text.splitlines()[-14:])
            out += [HEADERS.get(role, f"## {role}"), "", "```", text, "```", ""]

result = "\n".join(out)
result = re.sub(r"/Users/[^\s/]+", "~", result)
result = re.sub(r"/(private/)?var/folders/\S+", "<tmp>", result)
for banned in ("/Users/", "/var/folders/"):
    if banned in result:
        sys.exit(f"transcript still mentions {banned}")
open(target, "w").write(result)
print(f"{len(out)} lines")
