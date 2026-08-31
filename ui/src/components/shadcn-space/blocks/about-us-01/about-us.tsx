"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

/// The instrument, stated as a lattice of counts.
///
/// Laid out as a ruled grid with most cells left empty, one struck out, and a
/// single cell brought forward — the eye is meant to land on the figure that
/// carries the product, which is the zero. Everything here can be checked by
/// cloning the repo and running `forge test`; there are no users or volumes to
/// report and none are implied.

type Cell = {
  index: string;
  title: string;
  value: string;
  prefix?: string;
  suffix?: string;
  note?: string;
  featured?: boolean;
  hatched?: boolean;
  empty?: boolean;
};

const CELLS: Cell[] = [
  { index: "", title: "", value: "", empty: true },
  {
    index: "01",
    title: "Champion wins\non near-miss",
    value: "1",
    note: "out of 32 cases",
  },
  {
    index: "02",
    title: "Brier wins\non near-miss",
    value: "25",
    note: "the exact same benchmark",
    featured: true,
  },
  { index: "", title: "", value: "", empty: true },

  {
    index: "03",
    title: "Champion\nMargin",
    value: "0.12",
    note: "published Stage-2 floor",
    hatched: true,
  },
  {
    index: "04",
    title: "Brier\nMargin",
    value: "0.36",
    note: "nearly 3x separation",
  },
  {
    index: "05",
    title: "WASM Binary\nSize",
    value: "12",
    suffix: "KB",
    note: "no_std Rust",
  },
  {
    index: "06",
    title: "Stage-2 Self\nMatch Score",
    value: "1.0",
    note: "worst case floor is 0.75",
  },

  { index: "", title: "", value: "", empty: true },
  {
    index: "07",
    title: "Vulnerability to\nOverconfidence",
    value: "0",
    note: "strictly proper scoring",
    hatched: true,
  },
  {
    index: "08",
    title: "Registration\nBond required",
    value: "0",
    prefix: "$",
    note: "gas only",
  },
  { index: "", title: "", value: "", empty: true },
];

function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const numeric = Number(value);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 40, stiffness: 90 });

  useEffect(() => {
    if (inView) mv.set(numeric);
  }, [inView, numeric, mv]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) ref.current.textContent = String(Math.round(latest));
      }),
    [spring],
  );

  return <span ref={ref}>0</span>;
}

function GridCell({ cell }: { cell: Cell }) {
  if (cell.empty) {
    return <div className="border-r border-b border-white/[0.06] min-h-[8rem] sm:min-h-[9rem]" />;
  }

  return (
    <div
      className={cn(
        "relative border-r border-b border-white/[0.06] min-h-[8rem] p-4 sm:min-h-[9rem] sm:p-6 flex flex-col justify-between",
        cell.hatched &&
          "bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.03)_0px,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_7px)]",
        cell.featured && "z-10",
      )}
    >
      {cell.featured ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 border-2 border-emerald-500/70 bg-emerald-500/[0.04]"
        />
      ) : null}

      <div className="relative">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground/60">
          {cell.index}
        </span>
        <p
          className={cn(
            "mt-2.5 whitespace-pre-line text-base leading-tight tracking-tight sm:mt-3 sm:text-xl",
            cell.featured ? "text-white" : "text-foreground/85",
          )}
        >
          {cell.title}
        </p>
      </div>

      <div className="relative mt-6">
        <span
          className={cn(
            "block text-3xl font-medium tabular-nums sm:text-5xl",
            cell.featured ? "text-emerald-400" : "text-muted-foreground/45",
          )}
        >
          {cell.value.includes(".") ? cell.value : <Counter value={cell.value} />}
          {cell.suffix}
        </span>
        {cell.note ? (
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
            {cell.note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const AboutUs = () => {
  return (
    <section id="performance" className="relative overflow-hidden">
      {/* Faint contour wash, so the lattice sits on something rather than on flat black. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(60rem 30rem at 70% 20%, rgba(16,185,129,0.10), transparent), radial-gradient(40rem 24rem at 15% 80%, rgba(56,189,248,0.08), transparent)",
        }}
      />

      <div className="py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center"
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-emerald-500/60" />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
                The Performance
              </span>
              <span className="h-px w-10 bg-emerald-500/60" />
            </div>
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
              Exact match scoring is broken. We rebuilt it so evaluation handles near-misses and gaming is{" "}
              <span className="font-serif italic tracking-tight">mathematically impossible</span>
            </h2>
            <p className="text-base font-normal text-muted-foreground">
              What the incumbent scores, what Brier scores, and how we pass the Stage-2 gates. 
              The champion fails on near-miss distractors and ignores miner confidence. Our module 
              dominates the internal benchmark and safely bounds the problem using the Brier score.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mt-14 grid grid-cols-2 border-l border-t border-white/[0.06] md:grid-cols-4"
          >
            {CELLS.map((cell, i) => (
              <GridCell key={i} cell={cell} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
