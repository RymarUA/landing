"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const STORAGE_KEY = "announcement-bar-closed";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      const closed = sessionStorage.getItem(STORAGE_KEY);
      if (closed === "1") setVisible(false);
    } catch {
      // ignore
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  // Hide bar entirely if no text is configured
  if (!visible || !siteConfig.announcementText) return null;

  return (
    <div className="relative bg-orange-500 text-white font-bold text-sm py-2.5 px-4 text-center">
      <div className="flex items-center justify-center gap-2 flex-wrap px-8">
        <span>{siteConfig.announcementText}</span>
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-md transition-colors"
        aria-label="Закрити"
      >
        <X size={16} />
      </button>
    </div>
  );
}
