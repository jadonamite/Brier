"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20Abi, decodeEventLog } from "viem";
import { ladingAbi } from "@/lib/abi";
import { LADING_ADDRESS, txUrl } from "@/lib/chain";
import { ASSETS, NATIVE } from "@/lib/assets";
import { toBaseUnits, toFieldValue } from "@/lib/units";
import { KNOWN_FIELDS, Op, OP_SYMBOL, fieldKey, hashDocument, ZERO_HASH } from "@/lib/lading";
import { Button, Card, Ext, Field, Input, Select } from "@/components/lading-ui";
import { FileUp, Plus, Trash2, ArrowLeft, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type SpecRow = { label: string; op: Op; value: string };

export default function OpenCredit() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [beneficiary, setBeneficiary] = useState("");
  const [presenters, setPresenters] = useState("");
  const [assetAddr, setAssetAddr] = useState<string>(ASSETS[0].address);
  const [face, setFace] = useState("");
  const [expiry, setExpiry] = useState(defaultExpiry());
  const [docHash, setDocHash] = useState<`0x${string}` | "">("");
  const [docName, setDocName] = useState("");
  const [rows, setRows] = useState<SpecRow[]>([
    { label: "quantity", op: Op.EQ, value: "" },
    { label: "latestShipmentDate", op: Op.LTE, value: "" },
  ]);
  const [err, setErr] = useState<string>();

  const asset = ASSETS.find((a) => a.address === assetAddr)!;
  const isNative = asset.address === NATIVE;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { data: receipt, isLoading: mining } = useWaitForTransactionReceipt({ hash });

  const { writeContract: writeApprove, data: approveHash, isPending: approving } = useWriteContract();
  const { isLoading: approveMining, isSuccess: approved } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const faceUnits = useMemo(() => {
    try {
      return face ? toBaseUnits(face, asset.decimals) : 0n;
    } catch {
      return 0n;
    }
  }, [face, asset.decimals]);

  const newId = useMemo(() => {
    if (!receipt) return undefined;
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() !== LADING_ADDRESS.toLowerCase()) continue;
      try {
        const parsed = decodeEventLog({ abi: ladingAbi, data: log.data, topics: log.topics });
        if (parsed.eventName === "CreditOpened") {
          return (parsed.args as unknown as { id: bigint }).id;
        }
      } catch {
        /* not our event */
      }
    }
    return undefined;
  }, [receipt]);

  if (newId !== undefined) {
    router.push(`/credit/${newId}`);
  }

  function submit() {
    setErr(undefined);
    try {
      if (!/^0x[0-9a-fA-F]{40}$/.test(beneficiary)) throw new Error("beneficiary must be an address");
      const list = presenters
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const nominated = list.length ? list : [beneficiary];
      for (const p of nominated) {
        if (!/^0x[0-9a-fA-F]{40}$/.test(p)) throw new Error(`not an address: ${p}`);
      }
      if (!face) throw new Error("state a face amount");
      const amount = toBaseUnits(face, asset.decimals);
      if (amount === 0n) throw new Error("the face amount cannot be zero");

      const expiryUnix = BigInt(Math.floor(new Date(expiry).getTime() / 1000));
      if (expiryUnix * 1000n <= BigInt(Date.now())) throw new Error("expiry must be in the future");

      const spec = rows
        .filter((r) => r.label.trim() && r.value.trim())
        .map((r) => ({ key: fieldKey(r.label), op: r.op, value: toFieldValue(r.value) }));

      const seen = new Set(spec.map((s) => s.key));
      if (seen.size !== spec.length) throw new Error("a field is named twice");

      writeContract({
        address: LADING_ADDRESS,
        abi: ladingAbi,
        functionName: "openCredit",
        args: [
          beneficiary as `0x${string}`,
          nominated as `0x${string}`[],
          asset.address,
          amount,
          expiryUnix,
          (docHash || ZERO_HASH) as `0x${string}`,
          spec,
        ],
        value: isNative ? amount : 0n,
      });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="hero-bloom relative mx-auto max-w-3xl space-y-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-96 overflow-hidden">
        <div className="absolute left-1/2 h-[26rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.16),transparent)] blur-3xl" />
      </div>
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-emerald-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-emerald-500/60" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
            Issue an irrevocable credit
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-medium leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
          State the terms once.{" "}
          <span className="font-serif italic tracking-tight text-emerald-300">
            Then nobody can move them.
          </span>
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          You fund it now. From the moment this transaction confirms the money is
          unreachable — by the beneficiary until they present conforming documents,
          and <strong className="text-foreground">by you</strong> until expiry.
          That is the undertaking, and there is no button anywhere that undoes it.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
          01 — The parties
        </span>
        <span className="h-px flex-1 bg-white/[0.06]" />
      </div>

      <Card className="space-y-6">
        <Field label="Beneficiary Address" hint="Paid in full the moment a conforming presentation is made on chain.">
          <Input
            placeholder="0x…"
            value={beneficiary}
            onChange={(e) => setBeneficiary(e.target.value)}
          />
        </Field>

        <Field
          label="Nominated Presenters"
          hint="Who may present documents. Leave blank and only the beneficiary may. Separate multiple with commas."
        >
          <Input
            placeholder="0x… , 0x…"
            value={presenters}
            onChange={(e) => setPresenters(e.target.value)}
          />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
            02 — The money
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Asset" hint={asset.note}>
            <Select value={assetAddr} onChange={(e) => setAssetAddr(e.target.value)}>
              {ASSETS.map((a) => (
                <option key={a.address} value={a.address} className="bg-background text-foreground">
                  {a.symbol}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Face Amount" hint={`${asset.symbol} has ${asset.decimals} decimals`}>
            <Input placeholder="100.00" value={face} onChange={(e) => setFace(e.target.value)} />
          </Field>
        </div>

        <Field
          label="Expiry Timestamp"
          hint="Absolute. A conforming presentation one second later is refused, and you may reclaim 100% of the funds."
        >
          <Input type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Field>

        <div className="flex items-center gap-3 pt-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
            03 — The documents
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </div>

        <Field
          label="Required Document"
          hint="Hashed locally in your browser. The file content is never uploaded anywhere — only its keccak-256 hash is recorded on chain."
        >
          <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-background/50 p-6 text-center transition-colors hover:border-emerald-500/50">
            <FileUp className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-foreground/80">
              Select or drop required document to compute its keccak-256 hash
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

        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-emerald-400">
              04 — The conditions
            </span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <span className="label text-muted-foreground font-semibold">Bounding Conditions</span>
          <p className="mb-3 mt-1 text-xs text-muted-foreground">
            Each condition is evaluated mechanically on chain, in order. A presentation must satisfy 100% of conditions.
          </p>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-background/50 p-3 sm:flex-nowrap">
                <Select
                  value={r.label}
                  onChange={(e) => setRows(edit(rows, i, { label: e.target.value }))}
                  className="min-w-0 flex-1 basis-full sm:basis-auto"
                >
                  {KNOWN_FIELDS.map((f) => (
                    <option key={f} value={f} className="bg-background text-foreground">
                      {f}
                    </option>
                  ))}
                </Select>
                <Select
                  value={r.op}
                  onChange={(e) => setRows(edit(rows, i, { op: Number(e.target.value) as Op }))}
                  className="w-20 shrink-0"
                >
                  {[Op.EQ, Op.LTE, Op.GTE].map((o) => (
                    <option key={o} value={o} className="bg-background text-foreground">
                      {OP_SYMBOL[o]}
                    </option>
                  ))}
                </Select>
                <Input
                  placeholder="e.g. 500"
                  value={r.value}
                  onChange={(e) => setRows(edit(rows, i, { value: e.target.value }))}
                  className="min-w-0 flex-1 sm:w-36 sm:flex-none"
                />
                <button
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="p-2 text-muted-foreground/70 hover:text-rose-400 transition-colors"
                  title="Remove condition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setRows([...rows, { label: KNOWN_FIELDS[0], op: Op.EQ, value: "" }])}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            disabled={rows.length >= 16}
          >
            <Plus className="h-4 w-4" />
            <span>Add Condition</span>
          </button>
        </div>
      </Card>

      {err ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{err}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        {!isConnected ? (
          <p className="text-sm text-muted-foreground">Connect wallet to open credit.</p>
        ) : !isNative && !approved ? (
          <Button
            size="lg"
            disabled={approving || approveMining || faceUnits === 0n}
            onClick={() =>
              writeApprove({
                address: asset.address,
                abi: erc20Abi,
                functionName: "approve",
                args: [LADING_ADDRESS, faceUnits],
              })
            }
          >
            {approving || approveMining ? "Approving Token Escrow…" : `Approve ${face || ""} ${asset.symbol}`}
          </Button>
        ) : (
          <Button size="lg" disabled={isPending || mining} onClick={submit}>
            {isPending ? "Confirm in Wallet…" : mining ? "Funding Credit Escrow…" : "Open & Fund Credit"}
          </Button>
        )}

        {hash ? (
          <Ext href={txUrl(hash)}>
            <span className="text-xs">view transaction</span>
          </Ext>
        ) : null}
        {hash && !mining && newId === undefined ? (
          <button className="text-xs text-muted-foreground underline hover:text-emerald-300" onClick={() => reset()}>
            start over
          </button>
        ) : null}
      </div>

      {address ? (
        <p className="text-xs text-muted-foreground">
          Opening as <span className="mono text-foreground/80">{address}</span> — you are designated as applicant, and post-expiry refund returns to this address.
        </p>
      ) : null}
    </div>
  );
}

function edit(rows: SpecRow[], i: number, patch: Partial<SpecRow>): SpecRow[] {
  return rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
}

function defaultExpiry() {
  const d = new Date(Date.now() + 3 * 86400_000);
  d.setSeconds(0, 0);
  return d.toISOString().slice(0, 16);
}

