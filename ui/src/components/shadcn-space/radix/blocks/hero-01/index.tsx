import HeroSection from "@/components/shadcn-space/radix/blocks/hero-01/hero";
import type { NavigationSection } from "@/components/shadcn-space/radix/blocks/hero-01/header";
import Header from "@/components/shadcn-space/radix/blocks/hero-01/header";
import type { AvatarList } from "@/components/shadcn-space/radix/blocks/hero-01/hero";

export default function AgencyHeroSection() {
  const avatarList: AvatarList[] = [
    { image: "https://images.shadcnspace.com/assets/profiles/user-1.jpg" },
    { image: "https://images.shadcnspace.com/assets/profiles/user-2.jpg" },
    { image: "https://images.shadcnspace.com/assets/profiles/user-3.jpg" },
    { image: "https://images.shadcnspace.com/assets/profiles/user-5.jpg" },
  ];

  const navigationData: NavigationSection[] = [
    { title: "Architecture", href: "/#how-it-works", isActive: true },
    { title: "Performance", href: "/#performance" },
    { title: "FAQ", href: "/#faq" },
  ];

  return (
    <div className="relative">
      <Header navigationData={navigationData} />
      <main>
        <HeroSection avatarList={avatarList} />
      </main>
    </div>
  );
}
