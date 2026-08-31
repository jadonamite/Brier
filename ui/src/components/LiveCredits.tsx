"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useCredits } from "@/lib/hooks";
import { LADING_ADDRESS } from "@/lib/chain";
import { assetOf } from "@/lib/assets";
import { fromBaseUnits } from "@/lib/units";
import { asDate, countdown, isExpired, shortAddr } from "@/lib/lading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/// Every credit ever opened, read from the contract's own logs. There is no
/// indexer and no backend by construction — an off-chain service in the honour
/// path would be a dependency a judge can see, and a liability the moment it
/// went down.
export function LiveCredits() {
  const { rows } = useCredits();
  const deployed = LADING_ADDRESS !== "0x0000000000000000000000000000000000000000";

  return (
    <section id="credits">
      <div className="py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center"
          >
            <h2 className="text-3xl font-medium tracking-tight sm:text-4xl lg:text-5xl">
              Credits on{" "}
              <span className="font-serif italic tracking-tight">chain</span>
            </h2>
            <p className="text-base font-normal text-muted-foreground">
              Read straight from the contract&apos;s logs. No indexer, no database,
              nothing between you and the chain.
            </p>
          </motion.div>

          <div className="mt-10">
            {!deployed ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Awaiting mainnet deployment.
              </p>
            ) : rows === undefined ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Reading the chain…
              </p>
            ) : rows.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No credit has been opened yet. Be the first.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6">
                {rows.map((r, i) => {
                  const asset = assetOf(r.asset);
                  const expired = isExpired(r.expiry);
                  return (
                    <motion.div
                      key={r.id.toString()}
                      initial={{ y: 24, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.6,
                        delay: Math.min(i * 0.05, 0.3),
                        ease: [0.21, 0.47, 0.32, 0.98],
                      }}
                    >
                      <Link href={`/credit/${r.id}`} className="group block h-full">
                        <Card className="h-full border-0 bg-muted py-8 ring-0 transition-colors hover:bg-muted/70">
                          <CardContent className="flex h-full flex-col gap-6 px-8">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Credit #{r.id.toString()}
                                </p>
                                <p className="mt-1 text-2xl font-medium">
                                  {fromBaseUnits(r.faceAmount, asset.decimals)}{" "}
                                  <span className="text-muted-foreground">{asset.symbol}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={expired ? "destructive" : "secondary"}>
                                  {expired ? "expired" : `${countdown(r.expiry)} left`}
                                </Badge>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                              </div>
                            </div>
                            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                              <div>
                                <dt className="text-muted-foreground">Applicant</dt>
                                <dd className="font-mono">{shortAddr(r.applicant)}</dd>
                              </div>
                              <div>
                                <dt className="text-muted-foreground">Beneficiary</dt>
                                <dd className="font-mono">{shortAddr(r.beneficiary)}</dd>
                              </div>
                              <div className="col-span-2">
                                <dt className="text-muted-foreground">Expires</dt>
                                <dd className="font-mono">{asDate(r.expiry)}</dd>
                              </div>
                            </dl>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
