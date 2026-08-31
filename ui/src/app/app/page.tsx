import { Playground } from "@/components/Playground";
import Header from "@/components/shadcn-space/radix/blocks/hero-01/header";

const navigationData = [
  { title: "Architecture", href: "/#how-it-works" },
  { title: "Performance", href: "/#performance" },
  { title: "FAQ", href: "/#faq" },
];

export default function AppPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header navigationData={navigationData} />
      <main className="flex-1 pt-24 pb-12 flex items-center justify-center relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-10 h-[34rem] w-[68rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(16,185,129,0.20),transparent)] blur-3xl" />
        </div>
        <Playground />
      </main>
    </div>
  );
}
