import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Trầm Hương Eco-Resort — Bình Định, Việt Nam";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #022c22 0%, #064e3b 40%, #065f46 70%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Subtle radial glow top-right */}
        <div
          style={{
            position: "absolute",
            top: 80,
            right: 160,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 65%)",
          }}
        />
        {/* Subtle radial glow bottom-left */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(163,230,53,0.1) 0%, transparent 65%)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 9999,
            padding: "8px 20px",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#34d399",
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 14,
              fontFamily: "sans-serif",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Bình Định · Việt Nam
          </span>
        </div>

        {/* Main title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            Trầm Hương
          </span>
          <span
            style={{
              fontSize: 80,
              fontWeight: 600,
              color: "#6ee7b7",
              lineHeight: 1.05,
            }}
          >
            Eco-Resort
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 24,
            fontFamily: "sans-serif",
            fontWeight: 400,
            textAlign: "center",
            maxWidth: 680,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Hương của núi rừng, hồn của Bình Định
        </p>

        {/* Bottom divider bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 5,
            background: "linear-gradient(90deg, #059669, #10b981, #a3e635, #fbbf24)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
