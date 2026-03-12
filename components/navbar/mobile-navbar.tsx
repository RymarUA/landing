// @ts-nocheck
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { IoIosMenu, IoIosClose } from "react-icons/io";
import { ShoppingCart } from "lucide-react";
import { Logo } from "../Logo";
import { useCart } from "@/components/cart-context";
import { motion, AnimatePresence } from "framer-motion";

type NavItem = {
  title: string;
  link: string;
  target?: "_blank";
  children?: NavItem[];
};

type Props = {
  navItems: NavItem[];
};

export const MobileNavbar = ({ navItems }: Props) => {
  const [open, setOpen] = useState(false);
  const { totalCount, hydrated } = useCart();

  // Close menu on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div className="flex justify-between bg-white shadow-sm items-center w-full px-4 py-3 transition duration-200">
      <Logo />
      <div className="flex items-center gap-2">
        {/* Cart indicator */}
        <Link href="/cart" className="relative p-2 rounded-full hover:bg-orange-50 transition-colors">
          <ShoppingCart className="w-5 h-5 text-orange-500" />
          <AnimatePresence>
            {hydrated && totalCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow"
              >
                {totalCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          aria-label="Відкрити меню"
          aria-expanded={open}
          className="p-1"
        >
          <IoIosMenu className="text-black h-6 w-6" />
        </button>
      </div>
      {open && (
        <div 
          className="fixed inset-0 bg-white z-[60] flex flex-col items-start justify-start space-y-10 pt-5 text-xl text-zinc-600 transition duration-200 hover:text-zinc-800"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
          onClick={() => setOpen(false)}
        >
          <div className="flex items-center justify-between w-full px-5" onClick={(e) => e.stopPropagation()}>
            <Logo />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setOpen(!open)}
                aria-label="Закрити меню"
                className="p-1"
              >
                <IoIosClose className="h-8 w-8 text-black" />
              </button>
            </div>
          </div>
          <h2 id="mobile-menu-title" className="sr-only">
            Мобільне меню
          </h2>
          <div className="flex flex-col items-start justify-start gap-[14px] px-8" onClick={(e) => e.stopPropagation()}>
            {navItems.map((navItem) =>
              navItem.children && navItem.children.length > 0 ? (
                navItem.children.map((childNavItem) => (
                  <Link
                    key={`${navItem.title}-${childNavItem.title}`}
                    href={childNavItem.link}
                    onClick={() => setOpen(false)}
                    className="relative max-w-[15rem] text-left text-2xl"
                  >
                    <span className="block text-black ">
                      {childNavItem.title}
                    </span>
                  </Link>
                ))
              ) : (
                <Link
                  key={navItem.title}
                  href={navItem.link}
                  onClick={() => setOpen(false)}
                  className="relative"
                >
                  <span className="block text-[26px] text-black ">
                    {navItem.title}
                  </span>
                </Link>
              ),
            )}
          </div>
          {/* Login/Signup buttons - uncomment to enable authentication */}
          {/* <div className="flex flex-row w-full items-start gap-2.5  px-8 py-4 ">
            <Button asChild href="/signup">
              Sign Up
            </Button>
            <Button variant="ghost" asChild href="/login">
              Login
            </Button>
          </div> */}
        </div>
      )}
    </div>
  );
};

