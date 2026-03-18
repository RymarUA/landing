"use client";

import dynamic from "next/dynamic";

const CatalogHashHandler = dynamic(
  () => import("@/components/catalog-hash-handler").then(mod => ({ default: mod.CatalogHashHandler })),
  { ssr: false }
);

export function CatalogHashHandlerWrapper() {
  return <CatalogHashHandler />;
}
