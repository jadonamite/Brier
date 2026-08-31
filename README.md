# Brier — Telegraph Track 2 scoring module

A WASM scoring module for Telegraph Protocol, plus the local harness that decides whether it
would be promoted **before** spending a registration transaction.

Event research and corrections: [`../../Hackathons/telegraph-protocol-season-1.md`](../../Hackathons/telegraph-protocol-season-1.md)

```
brier/
├── champion/   the incumbent, reproduced byte-for-byte from the docs' published source
├── brier/      our module  (not written yet)
└── bench/      Stage-2 promotion harness + the calibrated benchmark
```

## Why the harness exists

Telegraph promotes a challenger only if it clears a **node-internal benchmark set that is not
published** — checked every public repo, it is not there. Every registration is a transaction,
and a rejected module records a public `rejected` status. So the benchmark had to be
reconstructed from the outside.

`bench/` loads a `.wasm` exactly the way the node does — write question / ground-truth /
answer into the module's own memory via its exported `alloc`, then call `rank_answer` — and
reports the same breakdown fields the node records on a registration: `candidate_margin`,
`champion_margin`, `candidate_wins`, `champion_wins`, `comparable_cases`,
`worst_self_match`, `score_stddev`.

It uses `wasmi` rather than the node's `wazero`. WASM execution is deterministic, so the
scores are identical; this only avoids a Go toolchain. It also rejects any module with
imports, which is the exact failure mode of an accidental `wasm32-wasip1` build.

## The calibration — why the numbers can be trusted

The docs publish exactly one data point about the hidden benchmark: a promoted module scored
`candidate_margin` 0.37 against `champion_margin` 0.05, winning **19/32** to the champion's.
That 32 is why this benchmark has 32 cases.

Each case carries **two** distractors, and the champion behaves completely differently on them:

| Distractor | champion margin | champion wins |
|---|---|---|
| `bad` — plausible-wrong near-miss (one wrong fact, right phrasing) | **−0.2984** | **1/32** |
| `bad_unrelated` — another question's correct answer (Stage-1 cross-match) | **+0.3709** | **30/32** |

The published 19/32 sits between them, so their set is a mix. Solving for it: the wins figure
implies ~38% near-miss, the margin figure ~47%. At a **40% near-miss mix this harness
reproduces 19/32 exactly** (margin 0.1269). That is the default.

## The finding this produced

**The champion's entire weakness is plausible-wrong near-misses, and it is total — 1 win in 32.**

`word_overlap` counts what fraction of the *miner answer's* words appear in the ground truth.
It has no recall term and no notion of which word carries the meaning. So:

- *"**Britain** gifted the Statue of Liberty to the United States"* shares 9 of 10 words with the
  ground truth → **0.90**.
- *"It was a gift from **France**"* — correct — shares few → **0.20**.

It scores the confidently-wrong answer **4.5× higher than the correct one**. It also rewards
terseness for free: a one-word answer appearing in the ground truth scores 1.0.

Two consequences for the build:

1. **The design target is now measured, not guessed.** Beating the champion means handling
   near-misses. Its unrelated-distractor performance (30/32) is already fine and is not worth
   attacking.
2. **This is the submission's headline.** "The incumbent scorer ranks a confidently wrong answer
   above a correct one, 31 times out of 32" is a demonstrable claim on their own published code,
   and it is the same failure a confidence-blind scorer makes — which is what the Brier layer
   addresses. The text fix and the propriety argument point at one defect.

## Running it

```bash
cd champion && cargo build --release --target wasm32-unknown-unknown && cd ..
cd bench && cargo build --release

./target/release/bench \
  ../champion/target/wasm32-unknown-unknown/release/champion.wasm \
  <candidate.wasm> data/benchmark.json
```

| Env | Effect |
|---|---|
| *(default)* | calibrated 40% near-miss mix — reproduces the champion at 19/32 |
| `BAD_FIELD=bad` | pure near-miss regime (the champion's worst case) |
| `BAD_FIELD=bad_unrelated` | pure cross-match regime (the champion's best case) |
| `NEARMISS_PCT=n` | change the mix |
| `DUMP=csv` | per-case scores for offline analysis |

Passing the same `.wasm` twice prints the champion against itself — the baseline.

## Status

- [x] Champion reproduced and building (2,640 bytes)
- [x] Stage-2 harness reproducing all seven breakdown fields
- [x] 32-case benchmark, calibrated to the champion's published 19/32
- [ ] `brier/` — the module itself
- [ ] Confidence-bearing suite to exercise the Brier layer
