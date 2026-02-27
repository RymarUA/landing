import { cn } from "@/lib/utils";
import { MotionProps } from "framer-motion";
import React from "react";

/**
 * Subheading component with text-wrap: balance (native CSS, no JS)
 * Replaced react-wrap-balancer to fix SSR bug where JS code appeared in text
 */
export const Subheading = ({
  className,
  as: Tag = "h2",
  children,
  ..._props
}: {
  className?: string;
  as?: any;
  children: any;
  props?: React.HTMLAttributes<HTMLHeadingElement>;
} & MotionProps &
  React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <Tag
      className={cn(
        "text-sm md:text-base max-w-4xl text-left my-4 mx-auto",
        "text-muted text-center font-normal",
        "text-balance", // Native CSS text-wrap: balance (defined in globals.css)
        className,
      )}
    >
      {children}
    </Tag>
  );
};
