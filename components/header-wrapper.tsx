"use client";

import { useState, useEffect } from "react";
import { AnnouncementBar } from "./announcement-bar";
import { TemuSearchBar } from "./temu-search-bar";

interface HeaderWrapperProps {
  announcementText?: string;
}

export function HeaderWrapper({ announcementText }: HeaderWrapperProps) {
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  // Check if announcement should be visible initially
  useEffect(() => {
    setAnnouncementVisible(Boolean(announcementText));
  }, [announcementText]);

  // const handleAnnouncementClose = () => {
  //   setAnnouncementVisible(false);
  // };

  return (
    <div
      id="site-header"
      className="sticky top-0 left-0 right-0 z-[100] bg-emerald-900/95 backdrop-blur-md"
    >
      {announcementVisible && (
        <AnnouncementBar 
          announcementText={announcementText} 
          onVisibilityChange={setAnnouncementVisible}
        />
      )}
      <TemuSearchBar />
    </div>
  );
}
