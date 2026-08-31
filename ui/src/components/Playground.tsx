"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Download, Activity, CheckCircle, AlertTriangle } from "lucide-react";

gsap.registerPlugin(useGSAP);

export function Playground() {
  const [wasmModule, setWasmModule] = useState<any>(null);
  const [groundTruth, setGroundTruth] = useState("The capital of France is Paris.");
  const [minerAnswer, setMinerAnswer] = useState("Paris");
  const [confidence, setConfidence] = useState("0.9");
  const [score, setScore] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const prevScore = useRef<number | null>(null);

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

  useGSAP(() => {
    gsap.from(".playground-stagger", {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
    });
  }, { scope: containerRef });

  useGSAP(() => {
    if (score !== null && scoreRef.current) {
      const target = { val: prevScore.current || 0 };
      gsap.to(target, {
        val: score,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
          if (scoreRef.current) {
            scoreRef.current.innerText = target.val.toFixed(4);
          }
        },
      });
      gsap.fromTo(
        scoreRef.current,
        { scale: 1.05, color: "#34d399" },
        { scale: 1, color: "#10b981", duration: 0.3, ease: "power2.out" }
      );
    }
  }, [score]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 1000);
    const payload = {
      ground_truth: groundTruth,
      miner_answer: minerAnswer,
      reported_confidence: parseFloat(confidence),
      evaluated_brier_score: score
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brier-eval-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full" ref={containerRef}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-sm playground-stagger">
            <CardHeader className="border-b border-border/40 bg-muted/20 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity size={18} className="text-emerald-500" /> Evaluation Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Ground Truth Dataset
                </label>
                <textarea 
                  value={groundTruth} 
                  onChange={(e) => setGroundTruth(e.target.value)}
                  className="flex min-h-[120px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 resize-none transition-all"
                  placeholder="Enter the actual truth..."
                />
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Miner Payload
                </label>
                <textarea 
                  value={minerAnswer} 
                  onChange={(e) => setMinerAnswer(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 resize-none transition-all"
                  placeholder="Enter the miner's prediction..."
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span> Claimed Confidence
                  </label>
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded-md border border-border">{confidence}</span>
                </div>
                <input 
                  type="range"
                  min="0" max="1" step="0.01"
                  value={confidence} 
                  onChange={(e) => setConfidence(e.target.value)}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Score & Actions */}
        <div className="space-y-6">
          <Card className="border-emerald-500/30 shadow-lg shadow-emerald-900/10 playground-stagger bg-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <CheckCircle size={100} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Final Brier Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-6xl font-mono font-medium text-emerald-500 tracking-tighter py-4">
                <span ref={scoreRef}>{score !== null ? score.toFixed(4) : "0.0000"}</span>
              </div>
              <div className="flex items-start gap-2 mt-4 text-sm text-muted-foreground bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                <AlertTriangle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                <p>This score is deterministically generated by the WASM module using strict propriety rules.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border/40 p-4">
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2.5 px-4 rounded-md text-sm font-medium transition-colors"
              >
                <Download size={16} /> {isExporting ? "Exporting..." : "Export JSON Report"}
              </button>
            </CardFooter>
          </Card>

          <Card className="border-border/40 shadow-sm playground-stagger">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Deliverables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-border/40">
                <span className="text-muted-foreground">Execution Env</span>
                <span className="font-mono bg-muted px-2 py-0.5 rounded">WASM Sandboxed</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border/40">
                <span className="text-muted-foreground">Semantic Engine</span>
                <span className="font-medium text-foreground">F1 Token Overlap</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Penalty Algorithm</span>
                <span className="font-medium text-emerald-500">Brier Squared Diff</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
