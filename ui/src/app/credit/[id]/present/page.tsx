"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { decodeEventLog } from "viem";
import { ladingAbi } from "@/lib/abi";
import { LADING_ADDRESS, txUrl } from "@/lib/chain";
import { fromBaseUnits, toFieldValue } from "@/lib/units";
import { useAssetDecimals, useCredit, useIsNominated, useSpec, useTokenSymbol } from "@/lib/hooks";
import {
  hashDocument,
  isExpired,
  labelOf,
  Op,
  OP_LABEL,
  State,
  ZERO_HASH,
  type Finding,
} from "@/lib/lading";
import { Button, Card, Empty, Ext, Field, Input } from "@/components/lading-ui";
import { RefusalPanel } from "@/components/Notice";
import { ArrowLeft, FileUp, CheckCircle2, ShieldAlert, Zap, FileCheck } from "lucide-react";

export default function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = /^\d+$/.test(idParam) ? BigInt(idParam) : undefined;
  const { address, isConnected } = useAccount();

  const { data: credit } = useCredit(id);
  const { data: spec } = useSpec(id);
  const { data: nominated } = useIsNominated(id, address);
  const decimals = useAssetDecimals(credit?.asset);
  const symbol = useTokenSymbol(credit?.asset);

  const [docHash, setDocHash] = useState<`0x${string}` | "">("");
  const [docName, setDocName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  const { keys, vals, parseError } = useMemo(() => {
    if (!spec) return { keys: [], vals: [], parseError: undefined };
    const k: `0x${string}`[] = [];
    const v: bigint[] = [];
    for (const f of spec) {
      const raw = values[f.key] ?? "";
      if (!raw.trim()) continue;
      try {
        v.push(toFieldValue(raw));
        k.push(f.key);
      } catch {
        return { keys: [], vals: [], parseError: `${labelOf(f.key)} must be a whole number` };
      }
    }
    return { keys: k, vals: v, parseError: undefined };
  }, [spec, values]);

  const { data: finding } = useReadContract({
    address: LADING_ADDRESS,
    abi: ladingAbi,
    functionName: "conforms",
    args: id !== undefined ? [id, (docHash || ZERO_HASH) as `0x${string}`, keys, vals] : undefined,
    query: { enabled: id !== undefined && !!credit && !parseError },
  }) as { data?: Finding };

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { data: receipt, isLoading: mining } = useWaitForTransactionReceipt({ hash });

  const outcome = useMemo(() => {
    if (!receipt) return undefined;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== LADING_ADDRESS.toLowerCase()) continue;
      try {
        const parsed = decodeEventLog({ abi: ladingAbi, data: log.data, topics: log.topics });
        if (parsed.eventName === "PresentationHonoured") return "honoured" as const;
        if (parsed.eventName === "PresentationRefused") return "refused" as const;
      } catch {
        /* not ours */
      }
    }
    return undefined;
  }, [receipt]);

  if (id === undefined) return <Empty>That is not a valid credit identifier.</Empty>;
  if (!credit) return <Empty>Reading chain state…</Empty>;

  const state = Number(credit.state) as State;
  const expired = isExpired(credit.expiry);
  const amount = `${fromBaseUnits(credit.faceAmount, decimals)} ${symbol}`;
  const conforming = finding?.ok === true;

  if (state !== State.Open) {
    return (
      <Empty>
        This credit is settled.{" "}
        <Link className="underline text-emerald-400" href={`/credit/${idParam}`}>
          Back to Credit #{idParam}
        </Link>
      </Empty>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/credit/${idParam}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-400 transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Credit #{idParam}</span>
        </Link>
        <h1 className="text-3xl font-medium tracking-tight text-white">Present Documents</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Conforming documents unlock <strong className="text-emerald-400">{amount}</strong> in the exact transaction that presents them. Zero manual review delay.
        </p>
      </div>

      {expired ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-5 text-rose-300">
          <ShieldAlert className="h-6 w-6 shrink-0 text-rose-400" />
          <div>
            <p className="font-medium">This credit has expired.</p>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Expiry is absolute — presentations after expiry are refused. Funds may be reclaimed by applicant.
            </p>
          </div>
        </div>
      ) : null}

      {isConnected && nominated === false ? (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-300">
          <ShieldAlert className="h-6 w-6 shrink-0 text-amber-400" />
          <div>
            <p className="font-medium text-sm">Not a Nominated Presenter</p>
            <p className="text-xs text-foreground/80 mt-0.5">
              Only addresses nominated by applicant may present against this credit. Perfect documents from unauthorized addresses will be refused.
            </p>
          </div>
        </div>
      ) : null}

      <Card className="space-y-6">
        <Field
          label="Document File"
          hint="Hashed locally in browser and evaluated against the required hash. File content is never stored or uploaded."
        >
          <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-background/50 p-6 text-center transition-colors hover:border-emerald-500/50">
            <FileUp className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-foreground/80">
              Select or drop presented document to compute its keccak-256 hash
            </p>
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setDocName(f.name);
                setDocHash(await hashDocument(f));
              }}
            />
            {docHash ? (
              <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-center w-full max-w-md">
                <p className="text-xs font-medium text-emerald-400">{docName}</p>
                <p className="mono text-[11px] text-foreground/80 truncate">{docHash}</p>
              </div>
            ) : null}
          </div>
        </Field>

        {spec && spec.length > 0 ? (
          <div>
            <span className="label text-muted-foreground font-semibold">Stated Condition Values</span>
            <div className="mt-3 space-y-3">
              {spec.map((f) => (
                <div key={f.key} className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-background/50 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="mono text-xs font-medium text-foreground">{labelOf(f.key)}</p>
                    <p className="text-xs text-muted-foreground">
                      Required: {OP_LABEL[Number(f.op) as Op]} {f.value.toString()}
                    </p>
                  </div>
                  <Input
                    className="w-36 shrink-0"
                    placeholder="Stated value"
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {parseError ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-400">
          {parseError}
        </div>
      ) : docHash && finding ? (
        conforming ? (
          <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 backdrop-blur-xl shadow-lg shadow-emerald-950/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xl font-medium uppercase tracking-tight text-emerald-400">
                Dry-Run: Conforming
              </p>
              <p className="mt-1 text-sm text-foreground/80 leading-relaxed">
                Submitting this presentation will immediately disburse <strong className="text-white">{amount}</strong> to the beneficiary. Zero discrepancies detected.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <p className="label !text-amber-400">Free Dry-Run Conformance Result</p>
            </div>
            <RefusalPanel finding={finding} />
          </div>
        )
      ) : (
        <p className="text-xs text-muted-foreground">
          Attach a document file above to execute a zero-gas, instant dry-run conformance check.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          className="gap-2"
          disabled={!isConnected || expired || isPending || mining || !docHash}
          onClick={() =>
            writeContract({
              address: LADING_ADDRESS,
              abi: ladingAbi,
              functionName: "present",
              args: [id, docHash as `0x${string}`, keys, vals],
            })
          }
        >
          <FileCheck className="h-4 w-4" />
          <span>{isPending ? "Confirm in Wallet…" : mining ? "Submitting Presentation…" : "Submit Presentation"}</span>
        </Button>
        {!conforming && docHash && finding ? (
          <span className="text-xs text-muted-foreground">
            You may still submit on-chain — non-conformance will be recorded as formal refusal.
          </span>
        ) : null}
        {hash ? <Ext href={txUrl(hash)}><span className="text-xs">view transaction</span></Ext> : null}
      </div>

      {outcome === "honoured" ? (
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 backdrop-blur-xl">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xl font-medium uppercase tracking-tight text-emerald-400">Presentation Honoured!</p>
            <p className="mt-1 text-sm text-foreground/80">
              {amount} has been paid to the beneficiary.{" "}
              <Link className="underline text-emerald-400 font-semibold" href={`/credit/${idParam}`}>
                View Updated Credit
              </Link>
            </p>
          </div>
        </div>
      ) : outcome === "refused" ? (
        <div className="space-y-3">
          <p className="label !text-rose-400">On-Chain Refusal Recorded</p>
          {finding ? <RefusalPanel finding={finding} /> : null}
          <p className="text-xs text-muted-foreground">
            The credit remains open. Correct the document discrepancy and present again, or{" "}
            <Link className="underline text-emerald-400 font-semibold" href={`/credit/${idParam}/amend`}>
              request a term amendment
            </Link>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

