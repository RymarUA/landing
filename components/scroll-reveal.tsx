"use client";
import { useEffect, useRef, ReactNode, CSSProperties } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // ms
  direction?: "up" | "left" | "right" | "none";
  once?: boolean;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  const getInitialStyle = (): CSSProperties => {
    const base: CSSProperties = { opacity: 0, transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` };
    if (direction === "up") return { ...base, transform: "translateY(32px)" };
    if (direction === "left") return { ...base, transform: "translateX(-32px)" };
    if (direction === "right") return { ...base, transform: "translateX(32px)" };
    return base;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Set initial hidden state
    Object.assign(el.style, getInitialStyle());

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "translate(0,0)";
            if (once) observer.unobserve(el);
          } else if (!once) {
            Object.assign(el.style, getInitialStyle());
          }
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
