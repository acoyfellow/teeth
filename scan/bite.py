import glob
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.environ.get("TEETH_ROOT", os.path.expanduser("~/code"))
MUTANT = os.environ.get("TEETH_MUTANT", "mutant")
OPERATORS = ",".join([
    "cond-boundary-gt", "cond-boundary-lt", "logical-and-to-or", "logical-or-to-and",
    "equality-strict-to-loose-neg", "inequality-to-equality", "return-true-to-false", "return-false-to-true",
])
SITE = re.compile(r"&&|\|\||===|!==|(?<![<>=!])[<>](?![=<>])|return (true|false);")
DUPLICATE = re.compile(os.environ.get("TEETH_SKIP", r"^$"))
SKIP = set()
FILES_PER_REPO = 2
MAX_SITES_PER_FILE = 12
CANDIDATES = sys.argv[1]
OUT = sys.argv[2]


def sites(path):
    try:
        return len(SITE.findall(open(path, errors="ignore").read()))
    except OSError:
        return 0


def pick_files(repo):
    candidates = [
        f for f in glob.glob(f"{ROOT}/{repo}/src/**/*.ts", recursive=True)
        if ".test." not in f and not f.endswith(".d.ts")
    ]
    scored = sorted(((sites(f), f) for f in candidates), reverse=True)
    return [os.path.relpath(f, f"{ROOT}/{repo}") for n, f in scored if n > 0][:FILES_PER_REPO]


def line_range(path):
    lines = open(path, errors="ignore").read().splitlines()
    hits = [i + 1 for i, line in enumerate(lines) if SITE.search(line)]
    if len(hits) <= MAX_SITES_PER_FILE:
        return None
    start = hits[len(hits) // 2 - MAX_SITES_PER_FILE // 2]
    end = hits[len(hits) // 2 + MAX_SITES_PER_FILE // 2 - 1]
    return f"{start}-{end}"


def run(repo, test, file):
    args = [MUTANT, "run", "--repo", f"{ROOT}/{repo}", "--file", file, "--operators", OPERATORS,
            "--test", test, "--json", "--timeout-ms", "60000", "--concurrency", "4"]
    window = line_range(f"{ROOT}/{repo}/{file}")
    if window:
        args += ["--line-range", window]
    started = time.time()
    try:
        done = subprocess.run(args, capture_output=True, text=True, timeout=900)
    except subprocess.TimeoutExpired:
        return {"repo": repo, "file": file, "status": "scan-timeout", "seconds": 900}
    seconds = round(time.time() - started)
    try:
        report = json.loads(done.stdout)
    except json.JSONDecodeError:
        return {"repo": repo, "file": file, "status": "no-report", "seconds": seconds, "stderr": done.stderr[-300:]}
    return {"repo": repo, "file": file, "status": "ok", "seconds": seconds, "window": window,
            **{k: report.get(k) for k in ("total", "killed", "survived", "timeout", "error", "invalid", "score")},
            "survivors": [m for m in report.get("mutants", []) if m.get("status") == "survived"]}


def main():
    candidates = json.load(open(CANDIDATES))
    done = set()
    if os.path.exists(OUT):
        done = {(r["repo"], r["file"]) for r in map(json.loads, open(OUT))}
    with open(OUT, "a") as out:
        for c in candidates:
            if DUPLICATE.match(c["repo"]) or c["repo"] in SKIP:
                continue
            for file in pick_files(c["repo"]):
                if (c["repo"], file) in done:
                    continue
                row = run(c["repo"], "npm test --silent", file)
                out.write(json.dumps(row) + "\n")
                out.flush()
    print("BITE-DONE", flush=True)


main()
