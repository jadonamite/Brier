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
    question: "What stops you from taking the money?",
    answer:
      "Nothing needs to stop us, because there is no path. The contract has no owner, no role, no pause, no upgrade, no selfdestruct and no withdraw. Funded value leaves through exactly two functions \u2014 an honoured presentation and a refund after expiry \u2014 and neither consults any address's discretion, including the deployer's. A test fuzzes every external function from every address across every state and asserts the escrow balance only ever changes by the exact face amount through those two paths. Read the verified source; it is 470 lines.",
  },
  {
    question: "Does this prove the goods actually shipped?",
    answer:
      "No, and any product telling you otherwise is misrepresenting what a chain can do. Lading proves the document presented matched the document agreed, and that the stated values satisfied the stated bounds. It does not prove the goods exist or ever moved. That gap is not an oversight \u2014 it is the same gap UCP 600 has always run on, which is why a real credit names an inspection body when the gap matters. The applicant can nominate any address as a presenter, an independent inspector included.",
  },
  {
    question: "Why does a bad presentation not just fail?",
    answer:
      "Because a revert records nothing. Under UCP 600 art. 16 a bank refusing a presentation must give notice stating each discrepancy \u2014 refusing silently is not permitted. So a non-conforming presentation still succeeds as a transaction and stores a notice naming the field that failed, its bound and the value presented. The credit stays open, the money never moves, and the beneficiary can correct the document and present again.",
  },
  {
    question: "Can the terms be changed after the credit is open?",
    answer:
      "Only by both parties, and only together. Under art. 10 nobody amends a credit alone: an amendment applies when the applicant and the beneficiary have each signed the identical terms, and one signature on its own changes nothing. Consent is bound to the credit's current amendment number, so a signature given to one amendment cannot be reused on the next, and the superseded terms stay readable on chain.",
  },
  {
    question: "What is the credit actually settled in?",
    answer:
      "The chain's real USDT \u2014 289,324 holders, verified source \u2014 or native BOT. Not a mock token minted for a demo. The contract never converts decimals at all: it holds and moves the asset's own base unit, so a six-decimal amount cannot be silently rescaled on the way in or out. A test asserts an exact 12.500000 USDT face amount arrives as exactly 12500000, checked on the token rather than on an event.",
  },
  {
    question: "Is there a backend I have to trust?",
    answer:
      "There is no backend and no indexer. The interface reads contract state and logs directly from the chain. An off-chain service sitting in the honour path would be a dependency you can see and a liability the moment it went down \u2014 and it would quietly reintroduce the intermediary this instrument exists to remove.",
  },
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
