// @ts-nocheck
"use client";
import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";
import { siteConfig } from "@/lib/site-config";

interface NavItem {
  title: string;
  link: string;
}

// Navigation items read from site-config.ts — edit there to customize
const navItems: NavItem[] = siteConfig.navLinks?.length
  ? siteConfig.navLinks
  : [
      { title: "Home", link: "/" },
      { title: "Pricing", link: "/pricing" },
      { title: "Blog", link: "/blog" },
      { title: "Contact", link: "/contact" },
    ];

export function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="hidden lg:block w-full">
        <DesktopNavbar />
      </div>
      <div className="flex h-full w-full items-center lg:hidden">
        <MobileNavbar navItems={navItems} />
      </div>
    </nav>
  );
}

