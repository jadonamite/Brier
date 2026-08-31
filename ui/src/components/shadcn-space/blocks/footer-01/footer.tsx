import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.791 2.188 8.46 5.996 5.58 2.188H1.408l4.984 6.518-4.723 5.399H3.69l3.646-4.166 3.187 4.166h4.068l-5.196-6.87 4.417-5.047zm-.71 10.707L3.77 3.335h1.2l7.23 9.56z" fill="currentColor" />
  </svg>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" fill="currentColor" />
  </svg>
);

type FooterSection = {
  title: string;
  links: { title: string; href: string }[];
};

import { BrierLogo } from "@/components/BrierLogo";

const footerSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { title: "Demo", href: "#demo" },
      { title: "Features", href: "#features" },
      { title: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Code",
    links: [
      { title: "Source (MIT)", href: "https://github.com/jadonamite/Brier" },
      { title: "Telegraph Protocol", href: "https://telegraphprotocol.com/" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="relative py-10 overflow-hidden before:absolute before:w-3/4 before:h-72 before:rounded-full before:top-0 before:left-1/2 before:-translate-x-1/2 before:blur-3xl before:-z-10 before:bg-[radial-gradient(closest-side,rgba(16,185,129,0.13),transparent)]">
      <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto">
        <div className="flex flex-col gap-6 sm:gap-12">
          <div className="py-12 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 gap-x-8 gap-y-10 px-6 xl:px-0">
            <div className="col-span-full lg:col-span-4">
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <a href="/" className="flex items-center gap-2" aria-label="Brier">
                  <BrierLogo />
                  <span className="font-semibold text-lg tracking-tight">Brier</span>
                </a>
                <p className="text-base font-normal text-muted-foreground">
                  A WASM scoring module for Telegraph Protocol. Overcoming the champion's weakness using strict propriety and semantic recall.
                </p>
                <div className="flex items-center gap-4">
                  <a href="https://x.com/jadonamite" target="_blank" rel="noopener noreferrer" aria-label="X" className="text-muted-foreground hover:text-foreground">
                    <TwitterIcon />
                  </a>
                  <a href="https://github.com/jadonamite/Brier" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-foreground">
                    <GithubIcon />
                  </a>
                </div>
              </div>
            </div>

            <div className="col-span-1 lg:block hidden" />

            {footerSections.map(({ title, links }, index) => (
              <div key={index} className="col-span-2">
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                  <p className="text-base font-medium text-foreground">{title}</p>
                  <ul className="flex flex-col gap-3">
                    {links.map(({ title, href }) => {
                      const isInternal = href.startsWith("/") && !href.startsWith("//") && !href.startsWith("http");
                      return (
                        <li key={title}>
                          {isInternal ? (
                            <Link
                              href={href}
                              className="text-base font-normal text-muted-foreground hover:text-foreground"
                            >
                              {title}
                            </Link>
                          ) : (
                            <a
                              href={href}
                              className="text-base font-normal text-muted-foreground hover:text-foreground"
                            >
                              {title}
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}

            <div className="col-span-3">
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
                <p className="text-base font-medium text-foreground">Contact</p>
                <ul className="flex flex-col gap-3">
                  <li>
                    <a
                      href="mailto:jadonamite@gmail.com"
                      className="text-base font-normal text-muted-foreground hover:text-foreground"
                    >
                      jadonamite@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <Separator orientation="horizontal" />
          <p className="text-sm font-normal text-muted-foreground text-center animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-100 ease-in-out fill-mode-both">
            &copy; 2026 Brier · MIT licensed
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
