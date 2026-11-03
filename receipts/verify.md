# verify

Date: 2026-11 handoff. Commit: `d599d1b` (main = origin/main), plus untracked `extension/placebo.ts`.

## 1. Gate

Ran: `./gate.sh` (in the background with `nohup`, log read after it finished).

```
1. toothless fixture exits 1                PASS
2. toothed fixture exits 0                  PASS
3. unit tests pass                          PASS
4. hand-check receipts show green bugs      PASS
5. Pi run: refused, fixed tests, then done  sequence: toothless -> teeth -> done
PASS
EXIT=0
```

Note: checks 4 and 5 read the saved receipts (`handcheck.md`, `refusal.md`). They do not run Pi or the hand-checks again.

## 2. A/B table, recomputed

Source: the per-seat item receipts, not the summary files:
`~/cloudflare/gleam-agents/proof/teeth-{off,placebo,on}-{1,2}/items/*.json`

Ran, per arm:

```
cat teeth-$arm-{1,2}/items/*.json | jq -s '{seats:length,
  pass:(map(select(.graded_pass==true))|length),
  false_done:(map(select(.outcome=="done" and .graded_pass!=true))|length),
  usd:(map(.usd)|add)}'
```

| arm | seats | hidden tests pass | false "done" | cost |
|---|---|---|---|---|
| off | 34 | 25 | 9 | $17.80 |
| placebo | 34 | 29 | 5 | $15.60 |
| on | 34 | 31 | 3 | $21.09 |

All 102 seats reported `done`. A false "done" is a seat that said done and failed the hidden tests.

Cross-check against each run's `score.json` (`passed`): off 13+12, placebo 15+14, on 16+15. Same totals.
`teeth-smoke` (1 seat, passed, $0.23) is a smoke run and is not in the table.

## Result

The recomputed table matches the README. No README change needed.
Placebo (a free nudge) gets 4 of the 6 extra passes over off, at lower cost. The real check adds 2 more passes for +$5.49 over placebo.
