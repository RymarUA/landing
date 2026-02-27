"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { IoIosMenu, IoIosClose } from "react-icons/io";
import { Logo } from "../Logo";
import { useMotionValueEvent, useScroll } from "framer-motion";

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

  const { scrollY } = useScroll();

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
        "flex justify-between bg-white items-center w-full rounded-full px-2.5 py-1.5 transition duration-200",
        showBackground &&
          "bg-neutral-50 shadow-[0px_-2px_0px_0px_var(--neutral-100),0px_2px_0px_0px_var(--neutral-100)]",
      )}
    >
      <Logo />
      <IoIosMenu
        className="text-black h-6 w-6"
        onClick={() => setOpen(!open)}
      />
      {open && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-start justify-start space-y-10 pt-5 text-xl text-zinc-600 transition duration-200 hover:text-zinc-800">
          <div className="flex items-center justify-between w-full px-5">
            <Logo />
            <div className="flex items-center space-x-2">
              <IoIosClose
                className="h-8 w-8 text-black"
                onClick={() => setOpen(!open)}
              />
            </div>
          </div>
          <div className="flex flex-col items-start justify-start gap-[14px] px-8">
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
