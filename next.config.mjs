import nextMDX from "@next/mdx";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: output: "standalone" removed - using regular next start for PM2
  // Standalone mode doesn't work with MDX in Next.js 15.5.12

  // Turbopack configuration - temporarily disabled to fix bootstrap script issue
  // turbopack: {
  //   root: process.cwd(),
  //   // Configure MDX loader for Turbopack
  //   rules: {
  //     "*.mdx": {
  //       loaders: ["@mdx-js/loader"],
  //       as: "*.js",
  //     },
  //   },
  // },

  // Experimental features
  experimental: {
    // Enable partial prerendering for faster loads
    // ppr: true, // Only available in canary
    // Note: deploymentId not supported in Next.js 15.5.12
    // Version tracking handled via DEPLOYMENT_ID env variable instead
    // Optimize bundling
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "@tabler/icons-react",
      "react-hook-form",
      "@radix-ui/react-label",
      "@radix-ui/react-slot",
    ],
  },

  // Explicitly set workspace root to avoid Next.js multi-lockfile warning
  outputFileTracingRoot: process.cwd(),

  // Enable React Strict Mode for better error detection and performance
  reactStrictMode: true,

  // Cross-origin configuration for CodeSandbox iframe compatibility

  // Image optimization
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
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
      {
        protocol: "https",
        hostname: "cdn.sitniks.com",
      },
    ],
    // Use sharp for better performance
    loader: "default",
    dangerouslyAllowSVG: true,
    // Improved CSP for SVG security - prevent XSS attacks
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; sandbox;",
  },

  // Page extensions - include .js/.jsx for compatibility
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],

  // Performance optimizations - CodeSandbox optimized
  poweredByHeader: false,
  compress: true,

  // TypeScript configuration - check for type errors in production builds
  typescript: {
    ignoreBuildErrors: false, // ✅ Check for TS errors in production
  },

  // Optimize production builds for CodeSandbox
  productionBrowserSourceMaps: false,

  // ❌ REMOVED: generateBuildId - causes routes-manifest.json error on Vercel
  // ❌ REMOVED: staticPageGenerationTimeout - can cause build issues

  // Compiler optimizations
  compiler: {
    // Remove console logs in production but keep errors and warnings
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ['error', 'warn'] }
      : false,
    // Remove dev-only attributes in production
    reactRemoveProperties:
      process.env.NODE_ENV === "production"
        ? { properties: ["^data-testid$", "^data-kleap-source$"] }
        : false,
  },

  // Module transpilation for better performance
  transpilePackages: ["geist", "cobe"],

  // Force webpack to resolve @ aliases (in case tsconfig.json is not read)
  webpack: (config, { webpack, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve("."),
      "@components": path.resolve("./components"),
      "@lib": path.resolve("./lib"),
      "@constants": path.resolve("./constants"),
      "@context": path.resolve("./context"),
    };

    // ✅ Normalize paths in production to prevent file system structure leak
    if (!dev) {
      config.output.devtoolModuleFilenameTemplate = (info) => {
        const rel = info.resourcePath
          .replace(/\\/g, "/") // Convert Windows backslashes to forward slashes
          .replace(/^.*?(app|components|lib|pages|types|hooks|context|constants)/, "$1") // Strip absolute path, keep only project structure
          .replace(/^.*node_modules\//, "node_modules/"); // Keep node_modules relative
        return `webpack:///./${rel}`;
      };
    }

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

    // Block tailwind-cdn-loader in production (styles are precompiled)
    // Simplified: always block in production, allow in development
    const shouldBlockCDN = !dev;

    if (shouldBlockCDN) {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /tailwind-cdn-loader/,
          path.resolve("./components/empty-loader.tsx"),
        ),
      );
      console.log(
        "🚫 [WEBPACK] Production build - tailwind-cdn-loader blocked (using precompiled CSS)",
      );
    } else {
      console.log(
        "🎨 [WEBPACK] Development mode - tailwind-cdn-loader active",
      );
    }

    return config;
  },

  // Headers for security and performance
  async headers() {
    const isDev = process.env.NODE_ENV === "development";
    
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/fb-feed/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/api/feed-test/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev 
              ? "no-cache, must-revalidate"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-cache"
              : "public, max-age=31536000, immutable",
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
