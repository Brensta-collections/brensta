import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const dynamic = "force-static";

/**
 * BRENSTA icon for iOS home-screen pins. Larger than the browser favicon,
 * uses the same charcoal + gold palette as app/icon.tsx.
 */
export default function AppleIcon() {
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
          fontSize: 128,
          fontWeight: 700,
          fontFamily: "serif",
          letterSpacing: -4,
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
