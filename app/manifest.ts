import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BRENSTA — Fashion & Lifestyle",
    short_name: "BRENSTA",
    description: "Premium women's fashion and lifestyle store.",
    start_url: "/",
    display: "standalone",
    background_color: "#FDF8F1",
    theme_color: "#1F1F1F",
    icons: [{ src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
  };
}
