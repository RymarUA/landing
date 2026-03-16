// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "fhm_announcement_closed";

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

  // Hide bar entirely if no text is configured
  if (!visible || !announcementText) return null;

  return (
    <div className="text-white font-bold text-sm py-2.5 px-4 text-center relative">
      <div className="flex items-center justify-center gap-2 flex-wrap px-8">
        <span>{announcementText}</span>
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

