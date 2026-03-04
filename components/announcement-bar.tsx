"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

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

  if (!visible) return null;

  return (
    <div className="relative bg-orange-500 text-white font-bold text-sm py-2.5 px-4 text-center">
      <div className="flex items-center justify-center gap-2 flex-wrap px-8">
        <span
          dangerouslySetInnerHTML={{
            __html: "🔥 Акція до <strong>31 березня</strong>: -15% на весь одяг! Промокод: FAMILY15",
          }}
        />
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
