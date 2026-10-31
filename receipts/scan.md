# Scan: how many gates have teeth

`scan/bite.py` ran `mutant` against the real test suites of 58 TypeScript repos. It took the 2 source files with the most decision points per repo, planted up to about 12 mutants per file, and counted which mutants the suite killed. No model calls; $0.

| Measure | Value |
|---|---|
| Repos scanned | 58 |
| Files with a result | 82 |
| Mutants evaluated | 901: 420 killed, 481 survived (**53% survive**) |
| Files with bite rate under 50% | **41 of 82 (50%)** |
| Files with bite rate 0% | 26 |
| Repos whose suite fails or hangs on clean code | 8 |

Not filtered: equivalent mutants (a change no test could see). In an earlier hand-labelled set, 29% of planted bugs were equivalent, so the true toothless share is lower than shown.

## Public repos

| Repo | Killed / evaluated | Bite rate |
|---|---|---|
| [agentcast](https://github.com/acoyfellow/agentcast) | 0 / 1 | 0% |
| [chat-ax](https://github.com/acoyfellow/chat-ax) | 0 / 21 | 0% |
| [getlee](https://github.com/acoyfellow/getlee) | 0 / 10 | 0% |
| [hark](https://github.com/acoyfellow/hark) | 0 / 11 | 0% |
| [lookout](https://github.com/acoyfellow/lookout) | 0 / 2 | 0% |
| [marionette](https://github.com/acoyfellow/marionette) | 0 / 1 | 0% |
| [porch](https://github.com/acoyfellow/porch) | 0 / 16 | 0% |
| [trick](https://github.com/acoyfellow/trick) | 0 / 17 | 0% |
| [zoo](https://github.com/acoyfellow/zoo) | 0 / 35 | 0% |
| [speedrun](https://github.com/acoyfellow/speedrun) | 3 / 22 | 14% |
| [argus](https://github.com/acoyfellow/argus) | 4 / 21 | 19% |
| [loops-yaml](https://github.com/acoyfellow/loops-yaml) | 5 / 23 | 22% |
| [do](https://github.com/acoyfellow/do) | 10 / 34 | 29% |
| [glance](https://github.com/acoyfellow/glance) | 5 / 14 | 36% |
| [odds](https://github.com/acoyfellow/odds) | 4 / 10 | 40% |
| [deja](https://github.com/acoyfellow/deja) | 11 / 27 | 41% |
| [blackbox](https://github.com/acoyfellow/blackbox) | 12 / 29 | 41% |
| [write-judge](https://github.com/acoyfellow/write-judge) | 6 / 14 | 43% |
| [benchmarks](https://github.com/acoyfellow/benchmarks) | 13 / 30 | 43% |
| [jev-code-mode](https://github.com/acoyfellow/jev-code-mode) | 14 / 31 | 45% |
| [mulder](https://github.com/acoyfellow/mulder) | 20 / 42 | 48% |
| [tollgate](https://github.com/acoyfellow/tollgate) | 13 / 24 | 54% |
| [mcpu](https://github.com/acoyfellow/mcpu) | 6 / 11 | 55% |
| [rank](https://github.com/acoyfellow/rank) | 12 / 22 | 55% |
| [lease](https://github.com/acoyfellow/lease) | 4 / 7 | 57% |
| [tether](https://github.com/acoyfellow/tether) | 7 / 11 | 64% |
| [cloudterm](https://github.com/acoyfellow/cloudterm) | 29 / 41 | 71% |
| [heist](https://github.com/acoyfellow/heist) | 5 / 7 | 71% |
| [agent-admit](https://github.com/acoyfellow/agent-admit) | 26 / 31 | 84% |
| [gateproof](https://github.com/acoyfellow/gateproof) | 8 / 9 | 89% |
| [tip](https://github.com/acoyfellow/tip) | 9 / 10 | 90% |
| [airlock](https://github.com/acoyfellow/airlock) | 15 / 15 | 100% |
| [amber](https://github.com/acoyfellow/amber) | 9 / 9 | 100% |
| [cache-layer](https://github.com/acoyfellow/cache-layer) | 24 / 24 | 100% |
| [lee](https://github.com/acoyfellow/lee) | 1 / 1 | 100% |
| [ax11y](https://github.com/acoyfellow/ax11y) | 0 / 0 | red baseline |
| [coil](https://github.com/acoyfellow/coil) | 0 / 0 | red baseline |
| [my-ax](https://github.com/acoyfellow/my-ax) | 0 / 0 | red baseline |
| [pantry](https://github.com/acoyfellow/pantry) | 0 / 0 | red baseline |
| [room](https://github.com/acoyfellow/room) | 0 / 0 | red baseline |
| [s1](https://github.com/acoyfellow/s1) | 0 / 0 | red baseline |

17 private repos are counted in the totals above and not listed.
