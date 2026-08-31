"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Playground() {
  const [wasmModule, setWasmModule] = useState<any>(null);
  const [groundTruth, setGroundTruth] = useState("The capital of France is Paris.");
  const [minerAnswer, setMinerAnswer] = useState("Paris");
  const [confidence, setConfidence] = useState("0.9");
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    async function loadWasm() {
      try {
        const response = await fetch("/brier.wasm");
        const buffer = await response.arrayBuffer();
        const module = await WebAssembly.instantiate(buffer, { env: {} });
        setWasmModule(module.instance.exports);
      } catch (err) {
        console.error("Failed to load WASM:", err);
      }
    }
    loadWasm();
  }, []);

  useEffect(() => {
    if (!wasmModule) return;

    try {
      const { alloc, rank_answer, memory } = wasmModule;

      const encoder = new TextEncoder();
      
      const qBytes = encoder.encode("");
      const gtBytes = encoder.encode(groundTruth);
      
      // Construct miner answer with confidence if provided
      const finalAnswer = minerAnswer + (confidence ? `\n{"confidence": ${confidence}}` : "");
      const maBytes = encoder.encode(finalAnswer);

      const qPtr = alloc(qBytes.length);
      const gtPtr = alloc(gtBytes.length);
      const maPtr = alloc(maBytes.length);

      const mem = new Uint8Array(memory.buffer);
      mem.set(qBytes, qPtr);
      mem.set(gtBytes, gtPtr);
      mem.set(maBytes, maPtr);

      const result = rank_answer(
        qPtr, qBytes.length,
        gtPtr, gtBytes.length,
        maPtr, maBytes.length
      );
      
      setScore(result);
    } catch (err) {
      console.error("Scoring error:", err);
      setScore(null);
    }
  }, [wasmModule, groundTruth, minerAnswer, confidence]);

  return (
    <section id="demo" className="py-16 md:py-20 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight">Interactive Playground</h2>
            <p className="mt-4 text-base text-muted-foreground">
              Test the Brier WASM module locally in your browser. Watch how the strictly proper scoring rule penalizes overconfidence on incorrect answers.
            </p>
          </div>
          
          <Card className="border-emerald-500/20 bg-background/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-emerald-400 text-center text-5xl font-mono py-4">
                Score: {score !== null ? score.toFixed(4) : "..."}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Ground Truth</label>
                  <textarea 
                    value={groundTruth} 
                    onChange={(e) => setGroundTruth(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Enter the actual truth..."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Miner Answer</label>
                  <textarea 
                    value={minerAnswer} 
                    onChange={(e) => setMinerAnswer(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Enter the miner's prediction..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Miner Confidence (0.0 to 1.0)</label>
                  <input 
                    type="number"
                    min="0" max="1" step="0.1"
                    value={confidence} 
                    onChange={(e) => setConfidence(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
