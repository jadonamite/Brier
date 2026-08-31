"use client";

import Header, {
  type NavigationSection,
} from "@/components/shadcn-space/radix/blocks/hero-01/header";

/// The same header the landing page wears, so every route is one product.
/// Targets are absolute (`/#…`) rather than bare anchors, because these pages
/// are not the landing page and a bare `#faq` would go nowhere from here.
const navigationData: NavigationSection[] = [
  { title: "Home", href: "/#hero" },
  { title: "How it works", href: "/#how-it-works" },
  { title: "The instrument", href: "/#performance" },
  { title: "Credits", href: "/#credits" },
  { title: "About", href: "/about" },
    { title: "Credits", href: "/#credits" },
    { title: "About", href: "/about" },
  { title: "FAQ", href: "/#faq" },
];

export function SiteHeader() {
  return <Header navigationData={navigationData} />;
}
