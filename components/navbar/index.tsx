"use client";
import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";
import { motion } from "framer-motion";
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
  // Self-check: only render when showNavbar is explicitly true (safe default = hidden)
  if (siteConfig.showNavbar !== true) return null;

  return (
    <motion.nav
      initial={{
        y: -80,
      }}
      animate={{
        y: 0,
      }}
      transition={{
        ease: [0.6, 0.05, 0.1, 0.9],
        duration: 0.8,
      }}
      className="max-w-7xl fixed top-4 mx-auto inset-x-0 z-50 w-[95%] lg:w-full"
    >
      <div className="hidden lg:block w-full">
        <DesktopNavbar navItems={navItems} />
      </div>
      <div className="flex h-full w-full items-center lg:hidden">
        <MobileNavbar navItems={navItems} />
      </div>
    </motion.nav>
  );
}
