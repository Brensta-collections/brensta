import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { AuthSessionProvider } from "@/components/auth/SessionProvider";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const IS_PROD_LIKE = /^https:\/\//.test(SITE_URL) && !SITE_URL.includes("localhost");

export const metadata: Metadata = {
  title: {
    default: "BRENSTA — Fashion & Lifestyle for Every You",
    template: "%s | BRENSTA",
  },
  description:
    "BRENSTA is a premium women's fashion and lifestyle store — jewellery, clothing, bags, accessories and footwear curated for every you.",
  metadataBase: new URL(SITE_URL),
  applicationName: "BRENSTA",
  alternates: { canonical: "/" },
  robots: IS_PROD_LIKE
    ? { index: true, follow: true }
    : { index: false, follow: false, nocache: true },
  openGraph: {
    title: "BRENSTA — Fashion & Lifestyle for Every You",
    description: "Premium women's fashion and lifestyle — jewellery, clothing, bags, accessories, footwear.",
    siteName: "BRENSTA",
    url: SITE_URL,
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BRENSTA — Fashion & Lifestyle for Every You",
    description: "Premium women's fashion and lifestyle.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ivory text-charcoal">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
