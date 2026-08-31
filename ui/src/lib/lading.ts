import { keccak256, toBytes, stringToHex } from "viem";

export enum State {
  None = 0,
  Open = 1,
  Honoured = 2,
  Refunded = 3,
}

export enum Op {
  EQ = 0,
  LTE = 1,
  GTE = 2,
}

export enum Reason {
  None = 0,
  DocumentHash = 1,
  FieldMissing = 2,
  FieldFailed = 3,
}

export const OP_LABEL: Record<Op, string> = {
  [Op.EQ]: "must equal",
  [Op.LTE]: "must be at most",
  [Op.GTE]: "must be at least",
};

export const OP_SYMBOL: Record<Op, string> = {
  [Op.EQ]: "=",
  [Op.LTE]: "≤",
  [Op.GTE]: "≥",
};

export const STATE_LABEL: Record<State, string> = {
  [State.None]: "Unknown",
  [State.Open]: "Open",
  [State.Honoured]: "Honoured",
  [State.Refunded]: "Refunded",
};

export type Credit = {
  applicant: `0x${string}`;
  beneficiary: `0x${string}`;
  asset: `0x${string}`;
  faceAmount: bigint;
  expiry: bigint;
  docHash: `0x${string}`;
  state: number;
  amendmentSeq: number;
};

export type FieldSpec = { key: `0x${string}`; op: number; value: bigint };
export type Finding = {
  ok: boolean;
  reason: number;
  field: `0x${string}`;
  op: number;
  expected: bigint;
  presented: bigint;
};
export type Notice = {
  presenter: `0x${string}`;
  at: bigint;
  reason: number;
  field: `0x${string}`;
  op: number;
  expected: bigint;
  presented: bigint;
};

/// A field key is `keccak256(label)`. The contract compares hashes, so the label itself is
/// never on chain — which means the interface has to carry the vocabulary. These are the
/// terms a real documentary credit is written in.
export const KNOWN_FIELDS = [
  "quantity",
  "latestShipmentDate",
  "consigneeId",
  "grossWeightKg",
  "unitPriceMinor",
  "containerCount",
  "portOfLoadingId",
  "portOfDischargeId",
  "inspectionCertificateId",
  "invoiceNumber",
] as const;

export const fieldKey = (label: string): `0x${string}` => keccak256(stringToHex(label.trim()));

/// Reverse the hash for display by matching against the vocabulary the interface offers.
/// A key written by some other client simply shows as its hash — honest, not guessed.
const KEY_TO_LABEL = new Map<string, string>(
  KNOWN_FIELDS.map((l) => [fieldKey(l).toLowerCase(), l]),
);
export const labelOf = (key: string): string =>
  KEY_TO_LABEL.get(key.toLowerCase()) ?? `${key.slice(0, 10)}…`;

/// The document hash is computed in the browser, from the file's own bytes. The document is
/// never uploaded anywhere: the chain proves the bytes matched what was agreed, which is
/// precisely what a bank under UCP 600 checks and precisely what it does not.
export async function hashDocument(file: File): Promise<`0x${string}`> {
  const buf = new Uint8Array(await file.arrayBuffer());
  return keccak256(buf);
}

export const hashText = (text: string): `0x${string}` => keccak256(toBytes(text));

export const ZERO_HASH = ("0x" + "0".repeat(64)) as `0x${string}`;

export function shortAddr(a?: string): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function countdown(expiry: bigint, now = Math.floor(Date.now() / 1000)): string {
  const secs = Number(expiry) - now;
  if (secs <= 0) return "expired";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export const isExpired = (expiry: bigint) => Number(expiry) * 1000 <= Date.now();

export const asDate = (unix: bigint) =>
  new Date(Number(unix) * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";
