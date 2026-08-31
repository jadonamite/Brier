import Link from "next/link";
import { LADING_ADDRESS, addrUrl, USDT } from "@/lib/chain";
import { Card, Ext, Button } from "@/components/lading-ui";
import { ArrowLeft, BookOpen, ShieldCheck, FileCode, Scale, Sparkles, ArrowRight } from "lucide-react";


export const metadata = { title: "How Lading Works — UCP 600 Escrow Protocol" };

export default function About() {
  const deployed = LADING_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-400 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to explorer</span>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-white">
            A 400-Year-Old Instrument, Minus the Bank
          </h1>
        </div>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-2xl">
          Understanding Lading&apos;s mechanical UCP 600 implementation and non-custodial smart contract architecture.
        </p>
      </div>

      <section className="space-y-4 text-sm text-foreground/80 leading-relaxed rounded-2xl border border-white/[0.08] bg-muted/50 p-6 backdrop-blur-xl">
        <p>
          A seller in one country will not ship to a buyer in another they have never met, and the buyer will not pay upfront. The documentary credit resolved that standoff by introducing a trusted intermediary: the buyer&apos;s bank undertakes to pay the seller — not when the goods physically arrive, but when the <strong className="text-white">paperwork</strong> arrives matching the agreed terms.
        </p>
        <p>
          The governing standard is UCP 600, published by the International Chamber of Commerce and enforced globally since 2007. The insight that enables automation is clear: <strong className="text-emerald-400">the bank never verifies the physical goods.</strong> It verifies documents against a strict specification, mechanically, and pays or refuses on that basis alone.
        </p>
        <p>
          A mechanical specification is precisely what an EVM smart contract executes flawlessly. What genuinely required a financial institution was custody of funds — custody that a decentralized settlement layer provides algorithmically for free.
        </p>
      </section>

      <Card>
        <div className="flex items-center gap-2 mb-4 border-b border-white/[0.08] pb-3">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-medium uppercase tracking-wider text-foreground">The Lifecycle of a Credit</h2>
        </div>
        <ol className="space-y-4 text-sm text-foreground/80">
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-400">1</span>
            <div>
              <strong className="text-white">Open.</strong> The applicant defines the beneficiary, nominated presenters, token asset, face amount, expiry timestamp, required document hash, and mechanical conditions. Funds are deposited into escrow; from that moment, applicant cannot reclaim until expiry.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-400">2</span>
            <div>
              <strong className="text-white">Present.</strong> A nominated presenter submits document byte hash and condition values. The contract evaluates document hash matching and walks conditions in sequence. Conforming presentation triggers instant transfer in the exact same transaction.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-400">3</span>
            <div>
              <strong className="text-white">Refuse.</strong> Non-conforming presentation does not revert transaction state. It records a permanent on-chain Notice of Refusal stating exact failed conditions and presented values per UCP 600 Article 16. Credit remains open; escrow funds do not move.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-400">4</span>
            <div>
              <strong className="text-white">Amend.</strong> Terms change strictly when applicant and beneficiary sign identical EIP-712 amendment terms per UCP 600 Article 10. Single-party signature does not alter contract state.
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-medium text-emerald-400">5</span>
            <div>
              <strong className="text-white">Expire.</strong> Past expiry, unhonoured credit unlocks 100% refund to applicant. Permissionless execution ensures funds strictly return to applicant.
            </div>
          </li>
        </ol>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3 border-b border-white/[0.08] pb-3">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-medium uppercase tracking-wider text-foreground">Zero Administrator Model</h2>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          No owner, no pause role, no upgrade proxy, no <span className="mono text-emerald-400">selfdestruct</span>, and no fallback deposit traps. Escrow funds leave through exactly two functions: an honoured presentation or a post-expiry refund. Neither function consults administrator discretion.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Source code is 100% open and verified on-chain:{" "}
          {deployed ? (
            <Ext href={addrUrl(LADING_ADDRESS)}>
              <span className="font-semibold text-emerald-400 hover:underline">Read Lading.sol on Explorer</span>
            </Ext>
          ) : (
            <span>Verified on block explorer upon deployment.</span>
          )}
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3 border-b border-white/[0.08] pb-3">
          <Scale className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-medium uppercase tracking-wider text-foreground">What This Does Not Claim</h2>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed">
          The smart contract proves that presented file bytes match the agreed keccak-256 hash, and that presented numerical values satisfy defined bounds. It does not inspect physical goods or guarantee document truthfulness. That gap is identical to traditional bank documentary credits under UCP 600, which is why nominated third-party inspectors exist when physical verification matters.
        </p>
      </Card>

      <div className="pt-2">
        <Link href="/open">
          <Button size="lg" className="gap-2">
            <span>Open a Credit Escrow</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

