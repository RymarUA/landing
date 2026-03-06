import type { Metadata } from "next";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { DevToolsGuard } from "./devtools-guard";
import { TailwindCDNClient } from "@/components/tailwind-cdn-client";
import { siteConfig } from "@/lib/site-config";
import { CartProvider } from "@/components/cart-context";
import { AnnouncementBar } from "@/components/announcement-bar";
import { CookieBanner } from "@/components/cookie-banner";
import { WishlistProvider } from "@/components/wishlist-context";
import { Analytics } from "@/components/analytics";
import { DiscountPopup } from "@/components/discount-popup";
import { SupportButton } from "@/components/support-button";
import { TemuSearchBar } from "@/components/temu-search-bar";
import { TemuBottomNav } from "@/components/temu-bottom-nav";

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
    locale: "en_US",
    siteName: siteConfig.name,
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    ...(siteConfig.ogImage
      ? {
          images: [
            {
              url: siteConfig.ogImage,
              width: 1200,
              height: 630,
              alt: `${siteConfig.name} - ${siteConfig.tagline}`,
            },
          ],
        }
      : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} - ${siteConfig.tagline}`,
    description: siteConfig.description,
    creator: "@familyhub_market",
    ...(siteConfig.ogImage ? { images: [siteConfig.ogImage] } : {}),
  },
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <meta name="color-scheme" content="light only" />
        <style href="kleap-base-styles" precedence="high">{`
          .bg-white { background-color: white; }
          .bg-black { background-color: black; }
          .text-white { color: white; }
          .text-black { color: black !important; }
          .text-neutral-700 { color: rgb(64 64 64) !important; }
          .text-neutral-600 { color: rgb(82 82 82) !important; }
          .text-neutral-500 { color: rgb(115 115 115) !important; }
          .text-muted { color: rgb(82 82 82) !important; }
          .antialiased { -webkit-font-smoothing: antialiased; }
          .h-full { height: 100%; }
          .w-full { width: 100%; }
          .bg-primary { background-color: oklch(0.205 0 0); }
          .text-primary-foreground { color: oklch(0.985 0 0); }
          .hover\\:bg-primary\\/90:hover { background-color: oklch(0.205 0 0 / 0.9); }
          .bg-secondary { background-color: oklch(0.97 0 0); }
          .text-secondary-foreground { color: oklch(0.205 0 0); }
          .hover\\:bg-secondary\\/80:hover { background-color: oklch(0.97 0 0 / 0.8); }
          .bg-destructive { background-color: oklch(0.577 0.245 27.325); }
          .text-destructive-foreground { color: oklch(0.985 0 0); }
          .hover\\:bg-destructive\\/90:hover { background-color: oklch(0.577 0.245 27.325 / 0.9); }
          .border-input { border-color: oklch(0.922 0 0); }
          .bg-background { background-color: oklch(1 0 0); }
          .text-foreground { color: oklch(0.145 0 0); }
          .bg-accent { background-color: oklch(0.97 0 0); }
          .text-accent-foreground { color: oklch(0.205 0 0); }
          .hover\\:bg-accent:hover { background-color: oklch(0.97 0 0); }
          .hover\\:text-accent-foreground:hover { color: oklch(0.205 0 0); }
          .ring-offset-background { --tw-ring-offset-color: oklch(1 0 0); }
          .focus-visible\\:ring-ring:focus-visible { --tw-ring-color: oklch(0.708 0 0); }
          body { opacity: 1; }
          body:not(.css-loaded) { opacity: 0; }
        `}</style>
      </head>
      <body
        className={cn(
          GeistSans.className,
          "bg-white antialiased h-full w-full",
        )}
        suppressHydrationWarning
      >
        <Analytics />
        <TailwindCDNClient />
        <DevToolsGuard />
        <CartProvider>
          <WishlistProvider>
            {/* Temu-style Search Bar */}
            <TemuSearchBar />

            {/* Main content with top padding for fixed search bar */}
            <div className="pt-[52px]">
              {children}
            </div>

            {/* Temu-style Bottom Navigation (includes cart) */}
            <TemuBottomNav />

            {/* Support Button (floating) */}
            <SupportButton />
            
            <DiscountPopup />
            <CookieBanner />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
