import { SiteHeader } from "@/components/SiteHeader";
import Footer from "@/components/shadcn-space/blocks/footer-01/footer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 pt-10">{children}</main>
      <Footer />
    </div>
  );
}
