"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ladingAbi } from "@/lib/abi";
import { LADING_ADDRESS, addrUrl, txUrl } from "@/lib/chain";
import { assetOf, NATIVE } from "@/lib/assets";
import { fromBaseUnits } from "@/lib/units";
import { useAssetDecimals, useCredit, useNotices, useSpec, useTokenSymbol } from "@/lib/hooks";
import {
  asDate,
  countdown,
  isExpired,
  labelOf,
  Op,
  OP_LABEL,
  shortAddr,
  State,
  STATE_LABEL,
} from "@/lib/lading";
import { Badge, Button, Card, Empty, Ext, Row } from "@/components/lading-ui";
import { NoticeRow } from "@/components/Notice";
import { ArrowLeft, CheckCircle2, RotateCcw, FileCheck, FileSignature, ShieldAlert, Sparkles } from "lucide-react";

export default function CreditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = /^\d+$/.test(idParam) ? BigInt(idParam) : undefined;
  const { address } = useAccount();

  const { data: credit, error } = useCredit(id);
  const { data: spec } = useSpec(id);
  const { data: notices } = useNotices(id);

  const decimals = useAssetDecimals(credit?.asset);
  const symbol = useTokenSymbol(credit?.asset);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining, isSuccess: refunded } = useWaitForTransactionReceipt({ hash });

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (id === undefined) return <Empty>That is not a valid credit identifier.</Empty>;
  if (error) return <Empty>No credit #{idParam} exists on this contract.</Empty>;
  if (!credit) return <Empty>Reading chain state…</Empty>;

  const state = Number(credit.state) as State;
  const expired = isExpired(credit.expiry);
  const amount = `${fromBaseUnits(credit.faceAmount, decimals)} ${symbol}`;
  const isApplicant = address?.toLowerCase() === credit.applicant.toLowerCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-400 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to explorer</span>
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mono text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Documentary Credit #{idParam}
            </p>
            <h1 className="mono mt-1 text-4xl font-medium tracking-tight text-white">{amount}</h1>
          </div>
          <div className="flex items-center gap-2">
            {state === State.Honoured ? (
              <Badge tone="honoured">Honoured · Paid</Badge>
            ) : state === State.Refunded ? (
              <Badge tone="refunded">Refunded · Lapsed</Badge>
            ) : expired ? (
              <Badge tone="warn">Expired · Awaiting Refund</Badge>
            ) : (
              <Badge tone="open">Open · {countdown(credit.expiry)} left</Badge>
            )}
          </div>
        </div>
      </div>

      {state === State.Honoured ? (
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 backdrop-blur-xl shadow-lg shadow-emerald-950/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xl font-medium uppercase tracking-tight text-emerald-400">
              Honoured — Funds Transferred
            </p>
            <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
              The documents presented conformed to 100% of defined conditions. <strong className="text-white">{amount}</strong> was automatically dispatched to the beneficiary in that single atomic transaction. Zero administrator intervention occurred.
            </p>
          </div>
        </div>
      ) : null}

      {state === State.Refunded ? (
        <div className="flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-muted/50 p-6 backdrop-blur-xl">
          <RotateCcw className="h-8 w-8 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xl font-medium tracking-tight text-foreground">Refunded to Applicant</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              The credit lapsed past its expiry timestamp without receiving a conforming presentation. Escrow funds of <strong className="text-foreground">{amount}</strong> were automatically returned to applicant <span className="mono text-foreground/80">{shortAddr(credit.applicant)}</span>.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-4 border-b border-white/[0.08] pb-3">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-foreground">Escrow Terms</h2>
          </div>
          <Row k="state">{STATE_LABEL[state]}</Row>
          <Row k="applicant">
            <Ext href={addrUrl(credit.applicant)}>{shortAddr(credit.applicant)}</Ext>
          </Row>
          <Row k="beneficiary">
            <Ext href={addrUrl(credit.beneficiary)}>{shortAddr(credit.beneficiary)}</Ext>
          </Row>
          <Row k="asset">
            {credit.asset === NATIVE ? (
              <span className="mono text-foreground/80">{symbol} (native)</span>
            ) : (
              <Ext href={addrUrl(credit.asset)}>
                {symbol} · {assetOf(credit.asset).decimals} dp
              </Ext>
            )}
          </Row>
          <Row k="face amount">
            <span className="mono font-semibold text-emerald-400">{amount}</span>
          </Row>
          <Row k="expiry">
            <span className="mono text-foreground/80">{asDate(credit.expiry)}</span>
          </Row>
          <Row k="doc hash">
            <span className="mono text-xs text-muted-foreground" title={credit.docHash}>
              {credit.docHash.slice(0, 18)}…
            </span>
          </Row>
          {credit.amendmentSeq > 0 ? (
            <Row k="amendments">
              <span className="mono text-foreground/80">{credit.amendmentSeq} applied</span>
            </Row>
          ) : null}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4 border-b border-white/[0.08] pb-3">
            <FileCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-foreground">Mechanical Conditions</h2>
          </div>
          {!spec || spec.length === 0 ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pure documentary credit — zero custom conditions. Presenting the exact required document hash will immediately release funds.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {spec.map((f, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] pb-2.5 last:border-0">
                  <span className="mono text-xs font-semibold text-foreground/80">{labelOf(f.key)}</span>
                  <span className="text-xs text-muted-foreground">
                    {OP_LABEL[Number(f.op) as Op]}{" "}
                    <span className="mono font-medium text-emerald-400">{f.value.toString()}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {state === State.Open ? (
        <div className="rounded-2xl border border-white/[0.08] bg-muted/50 p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-foreground">Available Actions</h2>

          <div className="flex flex-wrap items-center gap-3">
            {!expired ? (
              <Link href={`/credit/${idParam}/present`}>
                <Button size="lg" className="gap-2">
                  <FileCheck className="h-4 w-4" />
                  <span>Present Documents</span>
                </Button>
              </Link>
            ) : null}

            <Link href={`/credit/${idParam}/amend`}>
              <Button variant="ghost" size="lg" className="gap-2">
                <FileSignature className="h-4 w-4" />
                <span>Amend Terms</span>
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="lg"
                disabled={!expired || isPending || mining}
                onClick={() =>
                  writeContract({
                    address: LADING_ADDRESS,
                    abi: ladingAbi,
                    functionName: "refund",
                    args: [id],
                  })
                }
              >
                {isPending ? "Confirm in wallet…" : mining ? "Refunding…" : "Refund Applicant"}
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {!expired ? (
              <span>
                Refund unlocks in <strong className="text-amber-400">{countdown(credit.expiry)}</strong>. The irrevocable undertaking stands until expiry.
              </span>
            ) : (
              <span>
                Credit expired. Anyone may trigger refund; funds can strictly return to applicant <span className="mono text-foreground/80">{shortAddr(credit.applicant)}</span>.
              </span>
            )}
          </div>

          {hash ? <Ext href={txUrl(hash)}><span className="text-xs">view refund transaction</span></Ext> : null}
          {refunded ? <span className="text-xs font-semibold text-emerald-400">Refund confirmed</span> : null}
        </div>
      ) : null}

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <h2 className="text-sm font-medium uppercase tracking-wider text-foreground">Notices of Refusal (UCP 600 Art. 16)</h2>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Every presentation attempt is recorded on-chain with exact discrepancy reasons. Under UCP 600, bank refusals must state every failed condition.
        </p>
        {!notices || notices.length === 0 ? (
          <Empty>No presentation has been refused on this credit.</Empty>
        ) : (
          <ul>
            {[...notices].reverse().map((n, i) => (
              <NoticeRow key={i} notice={n} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

