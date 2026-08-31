"use client";
import Feature from "@/components/shadcn-space/blocks/feature-01/feature";
import { FileMagnifyingGlass, LockKey, Timer, SealCheck } from "@phosphor-icons/react/dist/ssr";

const featureData = [
  {
    icon: FileMagnifyingGlass,
    content:
      "The Incumbent relies entirely on word-overlap precision. It has no recall term. A miner who answers a single matched word to a 10-word ground truth scores 1.0. A miner who writes a full, correct sentence is penalized.",
  },
  {
    icon: LockKey,
    content:
      "Exact match on a non-deterministic intent is broken. Stock prices or weather differ by timestamp. Brier treats these as probabilities, verifying the confidence of the miner against the realised outcome.",
  },
  {
    icon: Timer,
    content:
      "Strict Propriety via 1 - (p - o)². The Brier penalty makes maximum confidence a losing strategy mathematically. If a miner is 0.99 confident and wrong, their score is obliterated.",
  },
  {
    icon: SealCheck,
    content:
      "The module is 100% no_std Rust compiled to wasm32-unknown-unknown. It passes the Stage-2 worst_self_match >= 0.75 floor and outperforms the champion's margin by nearly 3x.",
  },
];

const Feature01 = () => {
  return <Feature featureData={featureData} />;
};

export default Feature01;
