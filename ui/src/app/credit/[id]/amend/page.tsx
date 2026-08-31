"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { ladingAbi } from "@/lib/abi";
import { LADING_ADDRESS, txUrl } from "@/lib/chain";
import { useAmendmentHash, useCredit, useHasSigned } from "@/lib/hooks";
import { asDate, hashDocument, shortAddr, State } from "@/lib/lading";
import { Button, Card, Empty, Ext, Field, Input } from "@/components/lading-ui";
import { ArrowLeft, FileSignature, CheckCircle2, ShieldCheck, FileUp, Clock } from "lucide-react";

export default function AmendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = use(params);
  const id = /^\d+$/.test(idParam) ? BigInt(idParam) : undefined;
  const { address, isConnected } = useAccount();

  const { data: credit } = useCredit(id);
  const [expiry, setExpiry] = useState("");
  const [docHash, setDocHash] = useState<`0x${string}` | "">("");
  const [docName, setDocName] = useState("");

  const newExpiry = useMemo(() => {
    if (!expiry) return credit?.expiry;
    const t = Math.floor(new Date(expiry).getTime() / 1000);
    return Number.isFinite(t) ? BigInt(t) : credit?.expiry;
  }, [expiry, credit?.expiry]);

  const newDoc = (docHash || credit?.docHash) as `0x${string}` | undefined;

  const { data: hashOfTerms } = useAmendmentHash(id, newExpiry, newDoc);
  const { data: applicantSigned } = useHasSigned(id, hashOfTerms, credit?.applicant);
  const { data: beneficiarySigned } = useHasSigned(id, hashOfTerms, credit?.beneficiary);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining, isSuccess: sent } = useWaitForTransactionReceipt({ hash });

  if (id === undefined) return <Empty>That is not a valid credit identifier.</Empty>;
  if (!credit) return <Empty>Reading chain state…</Empty>;
  if (Number(credit.state) !== State.Open) {
    return (
      <Empty>
        A settled credit cannot be amended.{" "}
        <Link className="underline text-emerald-400 font-semibold" href={`/credit/${idParam}`}>
          Back to Credit #{idParam}
        </Link>
      </Empty>
    );
  }

  const isApplicant = address?.toLowerCase() === credit.applicant.toLowerCase();
  const isBeneficiary = address?.toLowerCase() === credit.beneficiary.toLowerCase();
  const isParty = isApplicant || isBeneficiary;
  const youSigned = isApplicant ? applicantSigned : isBeneficiary ? beneficiarySigned : false;
  const bothSigned = applicantSigned && beneficiarySigned;

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
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-medium tracking-tight text-white">Amend Credit Terms</h1>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            UCP 600 Art. 10
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Under UCP 600 Article 10, no party may amend a credit unilaterally. Your signature does nothing until the counterparty signs the <strong className="text-foreground">exact identical terms</strong>. The moment both sign, the amendment applies automatically.
        </p>
      </div>

      <Card className="space-y-6">
        <Field
          label="New Expiry Timestamp"
          hint={`Currently ${asDate(credit.expiry)} — leave blank to keep unchanged`}
        >
          <Input type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
        </Field>

        <Field label="New Required Document Hash" hint="Leave blank to keep currently required document hash">
          <div className="relative flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-background/50 p-6 text-center transition-colors hover:border-emerald-500/50">
            <FileUp className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-foreground/80">
              Select new document to compute its keccak-256 hash
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
            <p className="mono mt-3 text-xs text-muted-foreground truncate max-w-md">
              {docHash ? `${docName} → ${docHash}` : `Current: ${credit.docHash}`}
            </p>
          </div>
        </Field>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4 border-b border-white/[0.08] pb-3">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-medium uppercase tracking-wider text-foreground">Mutual Consent Status</h2>
        </div>
        <div className="space-y-2">
          <Signature
            who="Applicant"
            addr={credit.applicant}
            signed={!!applicantSigned}
            you={!!isApplicant}
          />
          <Signature
            who="Beneficiary"
            addr={credit.beneficiary}
            signed={!!beneficiarySigned}
            you={!!isBeneficiary}
          />
        </div>
        {hashOfTerms ? (
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-background p-3">
            <p className="mono truncate text-xs text-muted-foreground" title={hashOfTerms}>
              Proposed Terms EIP-712 Digest: <span className="text-foreground">{hashOfTerms}</span>
            </p>
          </div>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Signatures are domain-bound to this contract, chain, credit sequence, and amendment index to strictly prevent replay attacks.
        </p>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          size="lg"
          className="gap-2"
          disabled={!isConnected || !isParty || isPending || mining || !newExpiry || !newDoc}
          onClick={() =>
            writeContract({
              address: LADING_ADDRESS,
              abi: ladingAbi,
              functionName: "signAmendment",
              args: [id, newExpiry!, newDoc!],
            })
          }
        >
          <FileSignature className="h-4 w-4" />
          <span>{isPending ? "Confirm in Wallet…" : mining ? "Recording Signature…" : "Sign Amendment Terms"}</span>
        </Button>
        {!isParty && isConnected ? (
          <span className="text-xs text-muted-foreground">Only the applicant and beneficiary may sign amendments.</span>
        ) : youSigned ? (
          <span className="text-xs text-amber-400 font-semibold">You have signed — awaiting counterparty signature.</span>
        ) : null}
        {hash ? <Ext href={txUrl(hash)}><span className="text-xs">view transaction</span></Ext> : null}
      </div>

      {sent && bothSigned ? (
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 backdrop-blur-xl">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xl font-medium uppercase tracking-tight text-emerald-400">Amendment Active!</p>
            <p className="mt-1 text-sm text-foreground/80">
              Both parties have signed identical terms. The new terms now govern the credit on-chain.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Signature({
  who,
  addr,
  signed,
  you,
}: {
  who: string;
  addr: string;
  signed: boolean;
  you: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] py-3 last:border-0">
      <div>
        <p className="text-sm font-semibold text-white">
          {who}
          {you ? <span className="ml-2 rounded bg-secondary px-2 py-0.5 text-[10px] text-emerald-400">You</span> : null}
        </p>
        <p className="mono text-xs text-muted-foreground">{shortAddr(addr)}</p>
      </div>
      <span className={signed ? "flex items-center gap-1.5 text-xs font-medium text-emerald-400" : "flex items-center gap-1.5 text-xs text-muted-foreground/70"}>
        {signed ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Signed</span>
          </>
        ) : (
          <>
            <Clock className="h-4 w-4" />
            <span>Not Signed</span>
          </>
        )}
      </span>
    </div>
  );
}

