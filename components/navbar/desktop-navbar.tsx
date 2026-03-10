"use client";
import { Logo } from "../Logo";
import { useCart } from "@/components/cart-context";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

import { NavBarItem } from "./navbar-item";
import {
  useMotionValueEvent,
  useScroll,
  motion,
  AnimatePresence,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Props = {
  navItems: {
    link: string;
    title: string;
    target?: "_blank";
  }[];
};

export const DesktopNavbar = ({ navItems }: Props) => {
  const { scrollY } = useScroll();
  const { totalCount, hydrated } = useCart();

  const [showBackground, setShowBackground] = useState(false);

  useMotionValueEvent(scrollY, "change", (value) => {
    if (value > 100) {
      setShowBackground(true);
    } else {
      setShowBackground(false);
    }
  });
  return (
    <div
      className={cn(
        "w-full flex relative justify-between px-4 py-2 rounded-full bg-white/80 backdrop-blur-md transition duration-200",
        showBackground &&
          "bg-white shadow-[0px_-2px_0px_0px_var(--neutral-100),0px_2px_0px_0px_var(--neutral-100)]",
      )}
    >
      <AnimatePresence>
        {showBackground && (
          <motion.div
            key={String(showBackground)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 1,
            }}
            className="absolute inset-0 h-full w-full bg-neutral-100 pointer-events-none [mask-image:linear-gradient(to_bottom,white,transparent,white)] rounded-full"
          />
        )}
      </AnimatePresence>
      <div className="flex flex-row gap-2 items-center">
        <Logo />
        <div className="flex items-center gap-1.5">
          {navItems.map((item) => (
            <NavBarItem href={item.link} key={item.title} target={item.target}>
              {item.title}
            </NavBarItem>
          ))}
        </div>
      </div>
      <div className="flex space-x-2 items-center">
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
        {/* Login/Signup buttons - uncomment to enable authentication */}
        {/* <Button variant="ghost" asChild href="/login">
          Login
        </Button>
        <Button asChild href="/signup">
          Sign Up
        </Button> */}
      </div>
    </div>
  );
};

