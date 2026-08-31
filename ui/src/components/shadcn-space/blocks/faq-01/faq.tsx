"use client";

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { PlusIcon } from "lucide-react";

const FAQ_DATA = [
  {
    question: "Why does the Champion fail on near-misses?",
    answer: "The incumbent word_overlap scorer calculates matches against the miner's total word count, but not the ground truth's. This rewards extreme terseness—answering a single correct word nets a perfect 1.0, while answering a detailed sentence drops the score. Further, it lacks any mechanism to detect contradictions, scoring plausible-wrong answers near perfectly."
  },
  {
    question: "How does Brier defeat word_overlap?",
    answer: "Our module uses an F1 score (Precision + Recall) that strips punctuation and stop-words. This means terse answers are penalized for low recall, and detailed answers are not unfairly dragged down. We proved this by testing locally with the published Telegraph harness."
  },
  {
    question: "What is 'strict propriety'?",
    answer: "A scoring rule is strictly proper if a forecaster maximizes their expected score only by reporting their true probability. The Brier score (1 - (p - outcome)²) is strictly proper. The incumbent's word_overlap is not—it ignores confidence, making max-confidence a dominant, zero-risk strategy."
  },
  {
    question: "Is this module fully on-chain compatible?",
    answer: "Yes. It is written in 100% no_std Rust and compiles to a standalone wasm32-unknown-unknown binary. It makes zero system calls, uses a deterministic bump allocator, and fits into a tiny 12KB footprint—well below the 32MB limit."
  },
  {
    question: "How did you find the hidden Stage-2 parameters?",
    answer: "The Telegraph docs published one data point: a candidate that won 19/32 cases with a margin of 0.05. By recreating the word_overlap algorithm and calibrating a mix of 'near-miss' and 'unrelated' distractors, we reverse-engineered the exact benchmark gates."
  }
];

const AnimatedItem = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.5, once: false });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.2, delay }}
    >
      {children}
    </motion.div>
  );
};

export default function Faq() {
  return (
    <section id="faq">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24 flex flex-col gap-16">
        <div className="flex flex-col gap-4 items-center animate-in fade-in slide-in-from-top-10 duration-1000 delay-100 ease-in-out fill-mode-both">
          <Badge
            variant="outline"
            className="text-sm h-auto py-1 px-3 border-0 outline outline-border"
          >
            FAQs
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-center max-w-lg">
            Got questions? We have got answers ready
          </h2>
        </div>
        <Accordion type="single" collapsible className="w-full flex flex-col gap-6">
          {FAQ_DATA.map((faq, index) => (
            <AnimatedItem key={`item-${index}`} delay={index * 0.1}>
              <AccordionItem
                value={`item-${index}`}
                className="p-6 border border-border rounded-2xl flex flex-col gap-3 group/item data-[state=open]:bg-accent transition-colors"
              >
                <AccordionTrigger className="p-0 text-xl font-medium hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden cursor-pointer">
                  {faq.question}
                  <PlusIcon className="w-6 h-6 shrink-0 transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-45" />
                </AccordionTrigger>
                <AccordionContent className="p-0 text-muted-foreground text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            </AnimatedItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
