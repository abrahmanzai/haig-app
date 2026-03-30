import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "High Agency Investment Group — A student-run investment partnership";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #000 0%, #1c1c1e 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "-1px",
            marginBottom: 12,
          }}
        >
          High Agency Investment Group
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            background: "linear-gradient(135deg, #0a84ff, #64d2ff, #30d158)",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: 20,
          }}
        >
          Learn. Invest. Build.
        </div>

        <div
          style={{
            fontSize: 18,
            color: "#aeaeb2",
            letterSpacing: "0.5px",
          }}
        >
          A student-run investment partnership
        </div>
      </div>
    ),
    { ...size }
  );
}
