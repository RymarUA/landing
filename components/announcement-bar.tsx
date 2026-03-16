// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface AnnouncementBarProps {
  announcementText?: string;
  onVisibilityChange?: (visible: boolean) => void;
}

export function AnnouncementBar({ announcementText, onVisibilityChange }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    onVisibilityChange?.(false);
  };

  useEffect(() => {
    onVisibilityChange?.(visible);
  }, [visible, onVisibilityChange]);

  if (!visible || !announcementText) return null;

  return (
    <div className="text-white font-bold text-xs md:text-sm py-1.5 px-4 text-center relative">
      <div className="flex items-center justify-center gap-2 flex-wrap px-6">
        <span>{announcementText}</span>
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-md transition-colors"
        aria-label="Закрити"
      >
        <X size={14} className="md:w-4 md:h-4" />
      </button>
    </div>
  );
}
