import { USDT } from "./chain";

/// Every asset the interface offers. `address(0)` is the native token.
export const NATIVE = "0x0000000000000000000000000000000000000000" as const;

export type Asset = {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  note: string;
};

/// Decimals are declared here and confirmed against the token's own `decimals()` at
/// runtime (see `useAssetDecimals`). The contract itself never converts anything — it
/// holds and moves the asset's own base unit — so this file is the *only* place in the
/// system where a scaling factor exists at all.
export const ASSETS: Asset[] = [
  {
    address: USDT,
    symbol: "USDT",
    decimals: 6,
    note: "the chain's real USDT — 289,324 holders, verified source",
  },
  { address: NATIVE, symbol: "BOT", decimals: 18, note: "the native token" },
];

export const assetOf = (address: string): Asset =>
  ASSETS.find((a) => a.address.toLowerCase() === address.toLowerCase()) ?? {
    address: address as `0x${string}`,
    symbol: "TOKEN",
    decimals: 18,
    note: "unrecognised asset",
  };
