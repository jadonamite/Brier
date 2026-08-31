import Link from "next/link";
import { BrierLogo } from "@/components/BrierLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center px-4 md:px-8 mx-auto">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center gap-2">
              <BrierLogo />
              <span className="font-bold text-lg hidden sm:inline-block">Brier</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/app" className="transition-colors hover:text-foreground/80 text-foreground font-medium">
                Playground
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Batch Eval
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
                Leaderboard
              </Link>
              <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
                API Keys
              </Link>
            </nav>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              {/* Search or command palette could go here */}
            </div>
            <nav className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground hidden sm:block">
                Workspace: <span className="font-medium text-foreground">jadonamite</span>
              </div>
              <Avatar className="h-8 w-8 cursor-pointer border border-border">
                <AvatarImage src="https://github.com/jadonamite.png" alt="@jadonamite" />
                <AvatarFallback>JA</AvatarFallback>
              </Avatar>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 md:px-8 mx-auto">
          <p className="text-sm leading-loose text-muted-foreground text-center md:text-left">
            Built for production evaluation. Powered by Telegraph WASM.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Documentation</Link>
            <Link href="#" className="hover:text-foreground">Support</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
