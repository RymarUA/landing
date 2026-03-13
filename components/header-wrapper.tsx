"use client";

import { useState, useEffect } from "react";
import { AnnouncementBar } from "./announcement-bar";
import { TemuSearchBar } from "./temu-search-bar";
import type { CatalogProduct } from "@/lib/instagram-catalog";

interface HeaderWrapperProps {
  products: CatalogProduct[];
  announcementText?: string;
}

export function HeaderWrapper({ products, announcementText }: HeaderWrapperProps) {
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  // Check if announcement should be visible initially
  useEffect(() => {
    setAnnouncementVisible(Boolean(announcementText));
  }, [announcementText]);

  const handleAnnouncementClose = () => {
    setAnnouncementVisible(false);
  };

  return (
    <>
      {announcementVisible && (
        <AnnouncementBar 
          announcementText={announcementText} 
          onVisibilityChange={setAnnouncementVisible}
        />
      )}
      <TemuSearchBar 
        products={products} 
        hasAnnouncement={announcementVisible}
      />
    </>
  );
}
