import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans-brensta",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif-brensta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BRENSTA — Jewellery for Every You",
    template: "%s | BRENSTA",
  },
  description:
    "BRENSTA — premium women's fashion & lifestyle. Jewellery, clothing, bags, accessories and footwear for every you.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
