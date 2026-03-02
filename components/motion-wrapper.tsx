"use client";

import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";

type Props = MotionProps & {
  children: ReactNode;
  className?: string;
};

export function MotionWrapper({ children, className, ...props }: Props) {
  return (
    <motion.div className={className} {...props}>
      {children}
    </motion.div>
  );
}