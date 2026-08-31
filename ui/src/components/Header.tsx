"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { activeChain, LADING_ADDRESS, addrUrl } from "@/lib/chain";
import { shortAddr } from "@/lib/lading";
import { Button } from "./lading-ui";
import { Wallet, Copy, Check, ExternalLink, ShieldCheck, Menu, X } from "lucide-react";

export function Header() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const injected = connectors[0];
  const wrongChain = isConnected && chainId !== activeChain.id;

  const handleCopyContract = () => {
    if (LADING_ADDRESS) {
      navigator.clipboard.writeText(LADING_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl transition-all">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center" aria-label="Lading"><img src="/Lading.png" alt="Lading" className="h-7 w-auto" /></Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/80 md:flex">
          <Link href="/" className="hover:text-emerald-400 transition-colors">
            Home
          </Link>
          <Link href="/open" className="hover:text-emerald-400 transition-colors">
            Open Credit
          </Link>
          <Link href="/about" className="hover:text-emerald-400 transition-colors">
            How it works
          </Link>
          <a href="/#specs" className="hover:text-emerald-400 transition-colors">
            Specs
          </a>
          <a href="/#faq" className="hover:text-emerald-400 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Action Controls & Wallet Connection */}
        <div className="flex items-center gap-3">
          {LADING_ADDRESS !== "0x0000000000000000000000000000000000000000" ? (
            <div className="hidden items-center gap-1.5 rounded-xl border border-white/[0.08] bg-muted/50 px-3 py-1.5 text-xs lg:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <a
                href={addrUrl(LADING_ADDRESS)}
                target="_blank"
                rel="noreferrer"
                className="mono font-medium text-foreground/80 hover:text-emerald-400 transition-colors"
                title="View verified contract on BOT Chain Explorer"
              >
                {shortAddr(LADING_ADDRESS)}
              </a>
              <button
                onClick={handleCopyContract}
                className="ml-1 text-muted-foreground/70 hover:text-foreground transition-colors"
                title="Copy contract address"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          ) : null}

          {wrongChain ? (
            <Button variant="danger" size="sm" onClick={() => switchChain({ chainId: activeChain.id })}>
              Switch to BOT Chain
            </Button>
          ) : isConnected ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                BOT Chain
              </span>
              <button
                onClick={() => disconnect()}
                className="mono flex items-center gap-2 rounded-xl border border-white/[0.08] bg-muted px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary hover:border-white/[0.10] transition-all"
                title="Click to disconnect wallet"
              >
                <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                {shortAddr(address)}
              </button>
            </div>
          ) : (
            <Button
              disabled={!injected || isPending}
              onClick={() => injected && connect({ connector: injected })}
              size="sm"
            >
              <Wallet className="h-4 w-4" />
              {isPending ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-emerald-300"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation panel */}
      {mobileMenuOpen ? (
        <div className="border-t border-white/[0.06] bg-background/95 px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm font-medium text-foreground/80">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">
              Home
            </Link>
            <Link href="/open" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">
              Open Credit
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">
              How it works
            </Link>
            <a href="/#specs" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">
              Specs & Tech
            </a>
            <a href="/#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-400 py-1">
              FAQ
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

