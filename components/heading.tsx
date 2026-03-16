import { cn } from "@/lib/utils";
import React from "react";

export const Heading = ({
  className,
  as: Tag = "h2",
  children,
  size = "md",
  ...props
}: {
  className?: string;
  as?: any;
  children: any;
  size?: "sm" | "md" | "xl" | "2xl";
} & React.HTMLAttributes<HTMLHeadingElement>) => {
  const sizeVariants = {
    sm: "text-lg sm:text-xl md:text-2xl md:leading-snug",
    md: "text-2xl sm:text-3xl md:text-5xl md:leading-tight",
    xl: "text-3xl sm:text-4xl md:text-6xl md:leading-none",
    "2xl": "text-4xl sm:text-5xl md:text-7xl md:leading-none",
  };
  
  return (
    <Tag
      className={cn(
        "max-w-5xl mx-auto text-center tracking-tight",
        "font-medium",
        "text-black",
        "text-balance",
        sizeVariants[size],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};
