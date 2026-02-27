import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const hasImage = siteConfig.ogImage && siteConfig.ogImage.length > 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          backgroundColor: siteConfig.ogBackground,
          backgroundImage: hasImage
            ? "none"
            : `radial-gradient(circle at 25% 25%, ${siteConfig.ogAccent1} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${siteConfig.ogAccent2} 0%, transparent 50%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={siteConfig.ogImage}
            alt=""
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
        {/* Dark gradient overlay for text readability */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            padding: "48px 56px",
            gap: "12px",
            position: "relative",
            zIndex: 1,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              maxWidth: "900px",
            }}
          >
            {siteConfig.name}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.85)",
              maxWidth: "800px",
            }}
          >
            {siteConfig.tagline}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 24,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: 16,
            zIndex: 1,
          }}
        >
          Built with Kleap
        </div>
      </div>
    ),
    { ...size },
  );
}
