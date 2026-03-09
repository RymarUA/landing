"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

interface Props {
  title: string;
  path: string;
}

export function ShareButton({ title, path }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          url,
          text: title,
        });
        return;
      }
    } catch (err) {
      console.warn("Share failed, falling back to copy:", err);
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-500 font-semibold text-sm transition-all"
      aria-label="Поділитися"
    >
      <Share2 size={16} />
      {copied ? "Скопійовано!" : "Поділитися"}
    </button>
  );
}
