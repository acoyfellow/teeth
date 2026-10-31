import sys

events = []
for line in open(sys.argv[1]):
    if "teeth: TOOTHLESS" in line:
        events.append("toothless")
    elif "teeth: TEETH" in line:
        events.append("teeth")
    elif line.strip() == "DONE":
        events.append("done")

try:
    first_toothless = events.index("toothless")
    first_teeth = events.index("teeth", first_toothless)
    events.index("done", first_teeth)
except ValueError:
    print(f"sequence: {events}", file=sys.stderr)
    sys.exit(1)
if "done" in events[:first_teeth]:
    print("said DONE before the gate had teeth", file=sys.stderr)
    sys.exit(1)
print(f"sequence: {' -> '.join(events)}")
