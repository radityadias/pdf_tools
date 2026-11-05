import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";
export const alt = `${SITE.name}: free online PDF tools`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#3b5ea3",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800 }}>
          Free PDF Tools Online
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 38, opacity: 0.85 }}>
          Compress, merge and split PDFs in your browser
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 48,
            alignSelf: "flex-start",
            padding: "12px 28px",
            borderRadius: 999,
            background: "#f0bf3e",
            color: "#1f2b45",
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          Files never leave your device
        </div>
      </div>
    ),
    size
  );
}