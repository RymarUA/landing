// @ts-nocheck
import { siteConfig, type SiteConfig } from "./site-config";

const FALLBACK_CONFIG: Partial<SiteConfig> = {
  name: "Healthy Store",
  tagline: "Товари для здорового життя",
  description: "Обирайте перевірені товари для всієї родини в одному місці.",
  url: "https://example.com",
  ogBackground: "#0F2D2A",
  ogAccent1: "#1F6B5E",
  ogAccent2: "#C9B27C",
};

export type ResolvedSiteConfig = SiteConfig;

export function getResolvedSiteConfig(): ResolvedSiteConfig {
  return {
    ...FALLBACK_CONFIG,
    ...siteConfig,
  } satisfies SiteConfig;
}
