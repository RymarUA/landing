import { ImageResponse } from "next/og";
import { getResolvedSiteConfig } from "@/lib/site-config-safe";

const config = getResolvedSiteConfig();
const dynamicOgEnabled = process.env.NEXT_PUBLIC_DYNAMIC_OG === "1";

export const runtime = "edge";
export const alt = config.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function renderTwitterImage(displayUrl: string) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: config.ogBackground,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${config.ogAccent1} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${config.ogAccent2} 0%, transparent 50%)`,
          color: "white",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            textAlign: "center",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {config.name}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.75)",
            }}
          >
            {config.tagline}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: 20,
            fontFamily: "sans-serif",
          }}
        >
          {displayUrl}
        </div>
      </div>
    ),
    { ...size },
  );
}

export default async function TwitterImage(request: Request) {
  if (!dynamicOgEnabled) {
    const staticUrl = new URL("/og-image-static.png", request.url);
    return fetch(staticUrl);
  }

  try {
    const siteUrl = (config.url ?? "https://example.com").replace(/\/$/, "");
    const displayUrl = siteUrl.replace(/^https?:\/\//, "");
    return renderTwitterImage(displayUrl);
  } catch (error) {
    console.error("[Twitter Image] Generation failed", error);
    return renderTwitterImage("example.com");
  }
}

