"use client";

import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  target?: "_blank";
};

export function NavBarItem({
  children,
  href,
  target,
  className = "flex items-center justify-center text-sm leading-[110%] px-4 py-2 rounded-md hover:bg-[#F5F5F5] hover:text-black text-neutral-700",
}: Props) {
  return (
    <Link href={href} className={className} target={target}>
      {children}
    </Link>
  );
}
