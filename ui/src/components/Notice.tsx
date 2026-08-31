"use client";

import { Op, OP_LABEL, Reason, labelOf, shortAddr, asDate, type Finding, type Notice } from "@/lib/lading";
import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

export function RefusalPanel({
  finding,
  className,
}: {
  finding: Pick<Finding, "reason" | "field" | "op" | "expected" | "presented">;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border-2 border-rose-500/40 bg-rose-950/40 p-6 backdrop-blur-xl shadow-xl shadow-rose-950/20 ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-8 w-8 text-rose-400 shrink-0" />
        <div>
          <p className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-rose-400">
            Refused — funds unmoved
          </p>
          <p className="mt-0.5 text-sm text-rose-200/80">
            The credit is still open. Nothing was taken, nothing was paid, and you may present again.
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-rose-500/20 pt-4">
        <Discrepancy finding={finding} />
      </div>
    </div>
  );
}

export function Discrepancy({
  finding,
}: {
  finding: Pick<Finding, "reason" | "field" | "op" | "expected" | "presented">;
}) {
  const reason = Number(finding.reason) as Reason;

  if (reason === Reason.DocumentHash) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <p className="label !text-rose-400">Discrepancy · Required Document Hash</p>
        </div>
        <p className="text-sm text-foreground">
          The document presented does not match the keccak-256 hash this credit calls for.
        </p>
        <dl className="mono space-y-1.5 rounded-xl border border-white/[0.08] bg-background p-3 text-xs">
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-muted-foreground">required</dt>
            <dd className="truncate text-foreground">{toHash(finding.expected)}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-24 shrink-0 text-muted-foreground">presented</dt>
            <dd className="truncate text-rose-400 font-semibold">{toHash(finding.presented)}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (reason === Reason.FieldMissing) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <p className="label !text-rose-400">Discrepancy · Missing Bounding Field</p>
        </div>
        <p className="text-sm text-foreground">
          The credit requires condition field <strong className="mono text-white">{labelOf(finding.field)}</strong>, but the presentation omitted it.
        </p>
        <p className="mono text-xs text-muted-foreground rounded-xl border border-white/[0.08] bg-background p-3">
          required: {labelOf(finding.field)} {OP_LABEL[Number(finding.op) as Op]}{" "}
          {finding.expected.toString()}
        </p>
      </div>
    );
  }

  if (reason === Reason.FieldFailed) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <p className="label !text-rose-400">Discrepancy · Field Out of Bounds</p>
        </div>
        <p className="text-sm text-foreground">
          Condition field <strong className="mono text-white">{labelOf(finding.field)}</strong> must be{" "}
          <span className="mono font-semibold text-emerald-400">
            {OP_LABEL[Number(finding.op) as Op]} {finding.expected.toString()}
          </span>
          , but was presented as <strong className="mono text-rose-400">{finding.presented.toString()}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
      <CheckCircle2 className="h-4 w-4" />
      <span>Conforming — All terms satisfied.</span>
    </div>
  );
}

export function NoticeRow({ notice }: { notice: Notice }) {
  return (
    <li className="border-b border-white/[0.06] py-4 last:border-0">
      <div className="flex items-center justify-between gap-3 text-xs mb-2">
        <span className="mono text-muted-foreground">Presenter: {shortAddr(notice.presenter)}</span>
        <span className="mono text-muted-foreground">{asDate(notice.at)}</span>
      </div>
      <div className="mt-1">
        <Discrepancy finding={notice} />
      </div>
    </li>
  );
}

const toHash = (v: bigint) => "0x" + v.toString(16).padStart(64, "0");

