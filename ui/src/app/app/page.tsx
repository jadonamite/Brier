import { Playground } from "@/components/Playground";

export default function AppPage() {
  return (
    <div className="flex-1 w-full py-12 bg-muted/10 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[34rem] w-[68rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.15),transparent)] blur-3xl" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Evaluation Terminal</h1>
          <p className="text-muted-foreground mt-2">
            Run strictly proper scoring against your AI miner's outputs. Real-time deterministic execution via WASM.
          </p>
        </div>
        <Playground />
      </div>
    </div>
  );
}
