import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const dynamic = "force-static";

/**
 * BRENSTA favicon — generated at build time from TypeScript so the brand
 * tokens stay in sync with globals.css. Replaces the default Next.js "N".
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1F1F1F", // brand-charcoal
          color: "#D4AF7C", // brand-gold
          fontSize: 24,
          fontWeight: 700,
          fontFamily: "serif",
          letterSpacing: -1,
          borderRadius: 6,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
