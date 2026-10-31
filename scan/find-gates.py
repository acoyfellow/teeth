import glob
import json
import re
import sys

ROOT = sys.argv[1]
GATE_NAME = "gate" + ".sh"
NETWORK = re.compile(r"deploy|curl|https://|fetch\(|alchemy|\bgh |pi -p|playwright|chromium|wrangler dev")
RUNNERS = re.compile(r"vitest run|bun test|node --test|--experimental-strip-types --test|\btsc\b|cargo test|gleam test|mix test|pytest")

rows = []
for gate in sorted(glob.glob(f"{ROOT}/*/{GATE_NAME}")):
    repo = gate.split("/")[-2]
    text = open(gate, errors="ignore").read()
    sources = [
        f for f in glob.glob(f"{ROOT}/{repo}/src/**/*.ts", recursive=True)
        if ".test." not in f and "node_modules" not in f
    ]
    rows.append({
        "repo": repo,
        "lines": len(text.splitlines()),
        "network": len(NETWORK.findall(text)),
        "runners": sorted(set(RUNNERS.findall(text))),
        "sources": len(sources),
    })
json.dump(rows, sys.stdout, indent=1)
