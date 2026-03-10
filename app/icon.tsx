import { ImageResponse } from "next/og";
import { getResolvedSiteConfig } from "@/lib/site-config-safe";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

function renderIcon(label: string) {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: "0.04em",
          background: "linear-gradient(135deg, #1F6B5E 0%, #0F2D2A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F6F4EF",
          borderRadius: "50%",
        }}
      >
        {label}
      </div>
    ),
    { ...size },
  );
}

export default function Icon() {
  try {
    const config = getResolvedSiteConfig();
    const initials = config.name?.slice(0, 2).toUpperCase() || "ТМ";
    return renderIcon(initials);
  } catch (error) {
    console.error("[App Icon] Generation failed", error);
    return renderIcon("ТМ");
  }
}

