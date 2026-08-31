"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function Playground() {
  const [wasmModule, setWasmModule] = useState<any>(null);
  const [groundTruth, setGroundTruth] = useState("The capital of France is Paris.");
  const [minerAnswer, setMinerAnswer] = useState("Paris");
  const [confidence, setConfidence] = useState("0.9");
  const [score, setScore] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const prevScore = useRef<number | null>(null);

  // Load WASM
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

  // Compute Score
  useEffect(() => {
    if (!wasmModule) return;
    try {
      const { alloc, rank_answer, memory } = wasmModule;
      const encoder = new TextEncoder();
      
      const qBytes = encoder.encode("");
      const gtBytes = encoder.encode(groundTruth);
      const finalAnswer = minerAnswer + (confidence ? `\n{"confidence": ${confidence}}` : "");
      const maBytes = encoder.encode(finalAnswer);

      const qPtr = alloc(qBytes.length);
      const gtPtr = alloc(gtBytes.length);
      const maPtr = alloc(maBytes.length);

      const mem = new Uint8Array(memory.buffer);
      mem.set(qBytes, qPtr);
      mem.set(gtBytes, gtPtr);
      mem.set(maBytes, maPtr);

      const result = rank_answer(qPtr, qBytes.length, gtPtr, gtBytes.length, maPtr, maBytes.length);
      
      prevScore.current = score;
      setScore(result);
    } catch (err) {
      setScore(null);
    }
  }, [wasmModule, groundTruth, minerAnswer, confidence]);

  // GSAP Animations
  useGSAP(() => {
    // Initial load animation
    gsap.from(".playground-stagger", {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: "power3.out",
    });
  }, { scope: containerRef });

  useGSAP(() => {
    if (score !== null && scoreRef.current) {
      // Animate the score number counting up or down
      const target = { val: prevScore.current || 0 };
      gsap.to(target, {
        val: score,
        duration: 0.6,
        ease: "power2.out",
        onUpdate: () => {
          if (scoreRef.current) {
            scoreRef.current.innerText = target.val.toFixed(4);
          }
        },
      });

      // Pulse effect on the score container
      gsap.fromTo(
        scoreRef.current,
        { scale: 1.1, color: "#34d399" },
        { scale: 1, color: "#10b981", duration: 0.4, ease: "power2.out" }
      );
    }
  }, [score]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4" ref={containerRef}>
      <div className="flex flex-col gap-8">
        <div className="text-center playground-stagger">
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight">Brier Terminal</h1>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto">
            Live execution of the Brier WASM module. Adjust the ground truth, the miner's prediction, and the reported confidence to see how strict propriety penalizes overconfident lies.
          </p>
        </div>
        
        <Card className="border-emerald-500/30 bg-background/60 backdrop-blur-xl shadow-2xl shadow-emerald-900/20 playground-stagger">
          <CardHeader className="border-b border-emerald-500/10 bg-emerald-500/5">
            <CardTitle className="flex flex-col items-center justify-center py-6">
              <span className="text-sm font-medium text-emerald-500/80 tracking-widest uppercase mb-2">Evaluated Brier Score</span>
              <div className="text-emerald-400 text-6xl md:text-7xl font-mono tracking-tighter">
                <span ref={scoreRef}>{score !== null ? score.toFixed(4) : "0.0000"}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-8 md:grid-cols-2 p-6 md:p-10">
            <div className="space-y-4 playground-stagger">
              <div>
                <label className="text-sm font-medium text-emerald-100 mb-2 block flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> Ground Truth
                </label>
                <textarea 
                  value={groundTruth} 
                  onChange={(e) => setGroundTruth(e.target.value)}
                  className="flex min-h-[160px] w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 resize-none transition-all"
                  placeholder="Enter the actual truth..."
                />
              </div>
            </div>
            <div className="space-y-6 playground-stagger">
              <div>
                <label className="text-sm font-medium text-emerald-100 mb-2 block flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> Miner Answer
                </label>
                <textarea 
                  value={minerAnswer} 
                  onChange={(e) => setMinerAnswer(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 resize-none transition-all"
                  placeholder="Enter the miner's prediction..."
                />
              </div>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-emerald-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span> Miner Confidence
                  </label>
                  <span className="text-emerald-400 font-mono text-sm">{confidence}</span>
                </div>
                <input 
                  type="range"
                  min="0" max="1" step="0.01"
                  value={confidence} 
                  onChange={(e) => setConfidence(e.target.value)}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2 font-mono">
                  <span>0.0 (Unsure)</span>
                  <span>1.0 (Absolute Certainty)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
