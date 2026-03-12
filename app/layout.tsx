// @ts-nocheck
import type { Metadata } from "next/types";
import type { ReactNode } from "react";
import "./globals.css";
import { Noto_Sans, Noto_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import { DevToolsGuard } from "./devtools-guard";
import { TailwindCDNClient } from "@/components/tailwind-cdn-client";
import { siteConfig } from "@/lib/site-config";
import { CartProvider } from "@/components/cart-context";
import { MobileLayout } from "@/components/mobile-layout";
import { WishlistProvider } from "@/components/wishlist-context";
import { Analytics } from "@/components/analytics";
import { DiscountPopup } from "@/components/discount-popup";
import { AbandonedCartNotification } from "@/components/abandoned-cart-notification";
import { validateEnv } from "@/lib/env-validation";
import { WebVitals } from "./web-vitals";

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

const dynamicOgEnabled = process.env.NEXT_PUBLIC_DYNAMIC_OG === "1";

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
            url: dynamicOgEnabled ? "/opengraph-image" : "/og-image-static.png",
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
      : [dynamicOgEnabled ? "/opengraph-image" : "/og-image-static.png"],
  },
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="uk">
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body suppressHydrationWarning
        className={cn(
          notoSans.variable,
          notoSerif.variable,
          "bg-white antialiased h-full w-full",
        )}
      >
        <Analytics />
        <WebVitals />
        <TailwindCDNClient />
        <DevToolsGuard />
        <CartProvider>
          <WishlistProvider>
            <MobileLayout>
              {children}
              <DiscountPopup />
              <AbandonedCartNotification />
            </MobileLayout>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}

