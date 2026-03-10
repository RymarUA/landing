import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";
export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const displayUrl = siteConfig.url.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#F6F4EF",
          position: "relative",
          overflow: "hidden",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "10px",
            height: "100%",
            background: "linear-gradient(180deg, #1F6B5E 0%, #0F2D2A 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: "-80px",
            right: "-80px",
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #C9B27C 0%, transparent 70%)",
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            left: "260px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #1F6B5E 0%, transparent 70%)",
            opacity: 0.18,
          }}
        />

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backgroundColor: "#1F6B5E",
              borderRadius: "40px",
              padding: "8px 20px",
              width: "fit-content",
              color: "white",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            {siteConfig.name}
          </div>

          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: "#0F2D2A",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              maxWidth: "620px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>������ �� ���������� ������</span>
            <span style={{ color: "#1F6B5E" }}>��� ������ ����������</span>
          </div>

          <div
            style={{
              fontSize: 24,
              color: "#7A8A84",
              maxWidth: "540px",
              display: "flex",
              lineHeight: 1.4,
              fontFamily: "sans-serif",
            }}
          >
            ˳������� �������, ������, �������� �� ��� � ������������ ��������. �������� 1�3 �� �� �����.
          </div>

          <div style={{ display: "flex", gap: "14px", marginTop: "8px", fontFamily: "sans-serif" }}>
            {["����������� ������", "������ ���� ������", "������������"].map((badge) => (
              <div
                key={badge}
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "8px 14px",
                  fontSize: "15px",
                  color: "#24312E",
                  fontWeight: 600,
                  border: "1px solid #E7EFEA",
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "60px 56px 60px 0",
            gap: "16px",
            zIndex: 1,
            fontFamily: "sans-serif",
          }}
        >
          {[
            { name: "������� ��� �������", price: "289 ���", badge: "ղ�" },
            { name: "�������� ��� ��", price: "1290 ���", badge: "NEW" },
            { name: "���������� �������", price: "990 ���", badge: "���" },
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
                border: "1px solid #E7EFEA",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#0F2D2A" }}>{item.name}</span>
                <span
                  style={{
                    backgroundColor: "#C9B27C",
                    color: "#0F2D2A",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "20px",
                  }}
                >
                  {item.badge}
                </span>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 900, color: "#1F6B5E" }}>{item.price}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "48px",
            backgroundColor: "#0F2D2A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#F6F4EF",
            fontSize: "18px",
            fontWeight: 600,
            letterSpacing: "0.04em",
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

