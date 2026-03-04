import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#fff7f0",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left orange accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "8px",
            height: "100%",
            background: "linear-gradient(180deg, #f97316 0%, #ea580c 100%)",
            display: "flex",
          }}
        />

        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "360px",
            height: "360px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #fed7aa 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "300px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #ffedd5 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Left content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 56px",
            flex: 1,
            zIndex: 1,
            gap: "20px",
          }}
        >
          {/* Brand badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#f97316",
              borderRadius: "40px",
              padding: "8px 20px",
              width: "fit-content",
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "20px",
                fontWeight: 800,
                letterSpacing: "0.04em",
                display: "flex",
              }}
            >
              FamilyHub Market
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#1c1917",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              maxWidth: "620px",
              display: "flex",
              flexDirection: "column",
              gap: "0px",
            }}
          >
            <span>Одяг, іграшки</span>
            <span style={{ color: "#f97316" }}>та аксесуари</span>
            <span>для всієї родини</span>
          </div>

          {/* Subtext */}
          <div
            style={{
              fontSize: 24,
              color: "#78716c",
              maxWidth: "540px",
              display: "flex",
              lineHeight: 1.4,
            }}
          >
            Доставка Новою Поштою по всій Україні. Відео розпакування кожного замовлення.
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            {["🚚 Доставка 1-2 дні", "🎥 Відео розпакування", "↩️ Повернення 14 днів"].map((badge) => (
              <div
                key={badge}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "8px 14px",
                  fontSize: "16px",
                  color: "#44403c",
                  fontWeight: 600,
                  border: "1px solid #fed7aa",
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>

        {/* Right side — decorative price tags */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "60px 56px 60px 0",
            gap: "16px",
            zIndex: 1,
          }}
        >
          {[
            { name: "Кросівки Nike", price: "1200 грн", old: "1800 грн", badge: "ХІТ" },
            { name: "Набір Монтессорі", price: "320 грн", old: "450 грн", badge: "−29%" },
            { name: "Органайзер", price: "145 грн", old: null, badge: "NEW" },
          ].map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "white",
                borderRadius: "16px",
                padding: "16px 20px",
                width: "240px",
                gap: "6px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                border: "1px solid #f3f4f6",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#1c1917" }}>{item.name}</span>
                <span
                  style={{
                    backgroundColor: "#f97316",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "20px",
                    display: "flex",
                  }}
                >
                  {item.badge}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "20px", fontWeight: 900, color: "#f97316" }}>{item.price}</span>
                {item.old && (
                  <span style={{ fontSize: "13px", color: "#a8a29e", textDecoration: "line-through", display: "flex" }}>
                    {item.old}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom URL bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "48px",
            backgroundColor: "#f97316",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: "18px", fontWeight: 700, letterSpacing: "0.04em", display: "flex" }}>
            familyhubmarket.ua · @familyhub_market
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
