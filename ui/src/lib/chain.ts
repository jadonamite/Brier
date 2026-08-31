import { defineChain } from "viem";

/// Mainnet, read from the chain's own RPC on Aug 19, 2026 — see docs/CHAIN.md.
export const botChain = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
  rpcUrls: {
    // The trailing slash is required — the bare host returns nothing.
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.botchain.ai/"],
    },
  },
  blockExplorers: {
    default: { name: "BOT Scan", url: "https://scan.botchain.ai" },
  },
});

/// The Bohr testnet. It lives on a different domain entirely — nothing under
/// botchain.ai resolves to it, which is why it is easy to conclude there isn't
/// one. Faucet: https://faucet.botchain.ai/basic
export const bohrTestnet = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  testnet: true,
  nativeCurrency: { name: "BOT", symbol: "tBOT", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.bohr.life/"],
    },
  },
  blockExplorers: {
    default: { name: "BOTScan Testnet", url: "https://scan.bohr.life" },
  },
});

/// Which network this build talks to. Set NEXT_PUBLIC_CHAIN_ID=968 to run
/// against the testnet; anything else is mainnet.
export const activeChain =
  process.env.NEXT_PUBLIC_CHAIN_ID === "968" ? bohrTestnet : botChain;

export const isTestnet = activeChain.id === 968;

/// The real USDT on this chain: 289,324 holders, verified source, standard bool-returning
/// ERC-20, no fee-on-transfer, no blacklist, no pause. **Six decimals, not eighteen.**
export const USDT = "0xaBabc7Ddc03e501d190C676BF3d92ef0e6e87a3C" as const;

export const LADING_ADDRESS = (process.env.NEXT_PUBLIC_LADING_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const txUrl = (hash: string) => `${activeChain.blockExplorers.default.url}/tx/${hash}`;
export const addrUrl = (a: string) => `${activeChain.blockExplorers.default.url}/address/${a}`;
