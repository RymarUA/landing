import nextMDX from "@next/mdx";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for optimized Docker builds (~150MB vs 1.7GB)
  output: "standalone",

  // Turbopack configuration
  turbopack: {
    root: process.cwd(),
    // Configure MDX loader for Turbopack
    rules: {
      "*.mdx": {
        loaders: ["@mdx-js/loader"],
        as: "*.js",
      },
    },
  },

  experimental: {
    // Enable partial prerendering for faster loads
    // ppr: true, // Only available in canary
    // Optimize bundling
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "@tabler/icons-react",
      "framer-motion",
      "react-hook-form",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
    ],
  },

  // Suppress hydration warnings globally
  reactStrictMode: false,

  // Cross-origin configuration for CodeSandbox iframe compatibility
  // Note: allowedDevOrigins is not a real Next.js option

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "www.robot-speed.com",
      },
      {
        protocol: "https",
        hostname: "robot-speed.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // Use sharp for better performance
    loader: "default",
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Page extensions - include .js/.jsx for compatibility
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],

  // Performance optimizations - CodeSandbox optimized
  poweredByHeader: false,
  compress: true,

  // TypeScript configuration - MUST ignore errors for production builds
  // Apps may have minor TS errors that shouldn't block deployment
  typescript: {
    ignoreBuildErrors: true, // ✅ Don't fail build on TS errors
  },

  // ESLint configuration - MUST ignore errors for production builds
  eslint: {
    ignoreDuringBuilds: true, // ✅ Don't fail build on ESLint errors
  },

  // Optimize production builds for CodeSandbox
  productionBrowserSourceMaps: false,

  // ❌ REMOVED: generateBuildId - causes routes-manifest.json error on Vercel
  // ❌ REMOVED: staticPageGenerationTimeout - can cause build issues

  // Compiler optimizations
  compiler: {
    // Remove console logs in production only
    removeConsole: process.env.NODE_ENV === "production",
    // Remove dev-only attributes in production
    reactRemoveProperties:
      process.env.NODE_ENV === "production"
        ? { properties: ["^data-testid$", "^data-kleap-source$"] }
        : false,
  },

  // Module transpilation for better performance
  transpilePackages: ["geist", "cobe"],

  // Force webpack to resolve @ aliases (in case tsconfig.json is not read)
  webpack: (config, { _isServer, webpack, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve("."),
      "@components": path.resolve("./components"),
      "@lib": path.resolve("./lib"),
      "@constants": path.resolve("./constants"),
      "@context": path.resolve("./context"),
    };

    // Kleap source injector: adds data-kleap-source="file:line" to JSX elements
    // Only in dev mode — enables design panel to precisely edit source code
    if (dev) {
      config.module.rules.push({
        test: /\.(tsx|jsx)$/,
        exclude: /node_modules|_kleap/,
        enforce: "pre",
        use: [{ loader: path.resolve("./kleap-source-loader.cjs") }],
      });
    }

    // 🔥 NUCLEAR OPTION: Replace tailwind-cdn-loader with empty module in production
    // This BLOCKS the file at webpack level - it CANNOT be imported!
    // Detect Vercel OR production build in multiple ways to be 100% sure
    const isVercel =
      process.env.VERCEL === "1" ||
      process.env.VERCEL === "true" ||
      process.env.NEXT_PUBLIC_VERCEL === "1" ||
      process.env.VERCEL_ENV !== undefined ||
      process.env.VERCEL_URL !== undefined;

    const isProduction = process.env.NODE_ENV === "production";

    // Block CDN on Vercel OR in any production build
    if (isVercel || isProduction) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /tailwind-cdn-loader/,
          path.resolve("./components/empty-loader.tsx"),
        ),
      );
      console.log(
        "🚫 [WEBPACK] Blocking tailwind-cdn-loader.tsx - replaced with empty-loader.tsx",
      );
      if (isVercel) {
        console.log("🚀 [WEBPACK] Vercel detected - CDN will NOT be used");
      }
      if (isProduction) {
        console.log("🚀 [WEBPACK] Production build - CDN will NOT be used");
      }
    } else {
      console.log(
        "🎨 [WEBPACK] Development mode - tailwind-cdn-loader will be active",
      );
    }

    return config;
  },

  // Headers for CodeSandbox iframe compatibility
  // Note: NO CORS headers needed - health checks use server-side SDK
  async headers() {
    return [
      // Caching + iframe headers for all routes
      {
        source: "/:path*",
        headers: [
          // Allow iframe embedding (required for Kleap preview)
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          // No cache for development (see AI changes immediately)
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      // Cache headers for static assets (JS, CSS, images)
      // In CodeSandbox dev: NO cache to see AI changes immediately
      // On Vercel production: Next.js handles caching with content hashes
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            // no-cache = browser must revalidate before using cached version
            // This ensures fresh CSS/JS after AI edits while still allowing conditional caching
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    providerImportSource: "@mdx-js/react",
  },
});

export default withMDX(nextConfig);
