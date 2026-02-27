"use client";
import Link from "next/link";
import React from "react";
import { siteConfig } from "@/lib/site-config";

export const Logo = () => {
  return (
    <Link
      href="/"
      className="font-normal flex space-x-2 items-center text-sm mr-4  text-black px-2 py-1  relative z-20"
    >
      <div className="h-5 w-6 bg-black rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm" />
      <span className="font-medium text-black">{siteConfig.name}</span>
    </Link>
  );
};
