import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function TwitterImage() {
  const displayUrl = siteConfig.url.replace(/^https?:\/\//, "");

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
          backgroundColor: siteConfig.ogBackground,
          backgroundImage: `radial-gradient(circle at 25% 25%, ${siteConfig.ogAccent1} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${siteConfig.ogAccent2} 0%, transparent 50%)`,
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
            {siteConfig.name}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.75)",
            }}
          >
            {siteConfig.tagline}
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

