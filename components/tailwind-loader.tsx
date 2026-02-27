"use client";

import { useEffect, useState } from "react";

// Extend Window interface to include tailwind
declare global {
  interface Window {
    tailwind?: {
      config?: any;
    };
  }
}

export function TailwindLoader() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load Tailwind only after React hydration is complete
    if (typeof window !== "undefined" && !window.tailwind) {
      const tailwindScript = document.createElement("script");
      tailwindScript.src = "https://cdn.tailwindcss.com";
      tailwindScript.onload = () => {
        // Configure Tailwind after it loads
        if (window.tailwind) {
          window.tailwind.config = {
            theme: {
              extend: {},
            },
          };
        }
      };
      document.head.appendChild(tailwindScript);
    }
  }, []);

  // Don't render anything during SSR to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return null;
}
