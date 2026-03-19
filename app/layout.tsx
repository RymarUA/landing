import type { Metadata } from "next/types";
import type { ReactNode } from "react";
import "./globals.css";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { DevToolsGuard } from "./devtools-guard";
import { siteConfig } from "@/lib/site-config";
import { CartProvider } from "@/components/cart-context";
import { MobileLayout } from "@/components/mobile-layout";
import { HeaderWrapper } from "@/components/header-wrapper";
import { WishlistProvider } from "@/components/wishlist-context";
import { Analytics } from "@/components/analytics";
import { DiscountPopup } from "@/components/discount-popup";
import { AbandonedCartNotification } from "@/components/abandoned-cart-notification";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/seo/JsonLd";
import { validateEnv } from "@/lib/env-validation";
import { WebVitals } from "./web-vitals";
import { getCachedSiteSettings } from "@/lib/cached-data";
import { CatalogSearchPrefetcher } from "@/components/catalog-search-prefetcher";
import { DeploymentErrorHandler } from "@/components/deployment-error-handler";
import { headers } from "next/headers";

// Validate environment variables on server startup (single evaluation)
validateEnv();

const notoSans = Noto_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSerif = Noto_Serif({
  subsets: ["latin", "cyrillic"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});


export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.company,
  publisher: siteConfig.company,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: siteConfig.name,
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: siteConfig.ogImage
      ? [
          {
            url: siteConfig.ogImage,
            width: 1200,
            height: 630,
            alt: `${siteConfig.name} - ${siteConfig.tagline}`,
          },
        ]
      : [
          {
            url: "/og-image-static.png",
            width: 1200,
            height: 630,
            alt: `${siteConfig.name} - ${siteConfig.tagline}`,
          },
        ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    ...(siteConfig.twitterHandle
      ? {
          creator: siteConfig.twitterHandle.startsWith("@")
            ? siteConfig.twitterHandle
            : `@${siteConfig.twitterHandle}`,
        }
      : {}),
    images: siteConfig.ogImage
      ? [siteConfig.ogImage]
      : ["/og-image-static.png"],
  },
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
};

// Pre-load settings to avoid async issues in layout
let cachedSettings: any = null;
async function getSettings() {
  if (!cachedSettings) {
    cachedSettings = await getCachedSiteSettings();
  }
  return cachedSettings;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  // Load site settings from Sitniks (with fallback to site-config)
  const { settings } = await getSettings();
  const incomingHeaders = await headers();
  const nonce = incomingHeaders.get("x-nonce") ?? undefined;

  return (
    <html lang="uk" data-scroll-behavior="smooth" className="h-full">
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <JsonLd data={organizationSchema} id="organization" />
        <JsonLd data={websiteSchema} id="website" />
      </head>
      <body
        className={cn(
          notoSans.variable,
          notoSerif.variable,
          "bg-[#FAF9F4] antialiased min-h-screen flex flex-col",
        )}
      >
        <DeploymentErrorHandler />
        <Analytics cspNonce={nonce} />
        <CatalogSearchPrefetcher />
        <WebVitals />
        <DevToolsGuard />
        <div className="flex-1 flex flex-col">
          <CartProvider>
            <WishlistProvider>
              <HeaderWrapper announcementText={settings.announcementText} />
              <MobileLayout>
                {children}
                <DiscountPopup />
                <AbandonedCartNotification />
              </MobileLayout>
            </WishlistProvider>
          </CartProvider>
        </div>
      </body>
    </html>
  );
}

