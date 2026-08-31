/// The only scaling code in the application.
///
/// The Governor build lost ten days to a shared converter that assumed 18 decimals against a
/// 6-decimal token: every amount came out 1e12 too small and it failed *silently* — clean
/// logs, healthy heartbeat, an agent doing nothing at all. The structural fix is that there
/// is exactly one pair of functions, both take `decimals` as a required argument, and the
/// value passed always comes from the token's own `decimals()` call. Nothing here has a
/// default.

export function toBaseUnits(input: string, decimals: number): bigint {
  const trimmed = input.trim();
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    throw new Error("not a number");
  }
  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > decimals) {
    throw new Error(`this asset has ${decimals} decimals — ${frac.length} given`);
  }
  return BigInt((whole || "0") + frac.padEnd(decimals, "0"));
}

export function fromBaseUnits(value: bigint, decimals: number): string {
  const negative = value < 0n;
  const v = negative ? -value : value;
  const s = v.toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const frac = decimals === 0 ? "" : s.slice(s.length - decimals).replace(/0+$/, "");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "-" : ""}${grouped}${frac ? "." + frac : ""}`;
}

/// A presented field value is a plain integer bound (a quantity, a unix date, an id).
/// It is never rescaled — the contract compares it exactly as given.
export function toFieldValue(input: string): bigint {
  const t = input.trim();
  if (!/^\d+$/.test(t)) throw new Error("whole number only");
  return BigInt(t);
}
