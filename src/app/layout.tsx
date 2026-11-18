import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Ranjan Vernekar — Systems, AI & Graphics Engineering",
  description:
    "Engineering portfolio of Ranjan Vernekar: distributed inference infrastructure, full-stack systems, and real-time WebGL graphics.",
  openGraph: {
    title: "Ranjan Vernekar — Systems, AI & Graphics Engineering",
    description:
      "Engineering portfolio of Ranjan Vernekar: distributed inference infrastructure, full-stack systems, and real-time WebGL graphics.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Ranjan Vernekar — Systems, AI & Graphics Engineering",
    description:
      "Engineering portfolio of Ranjan Vernekar: distributed inference infrastructure, full-stack systems, and real-time WebGL graphics.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${cormorantGaramond.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0C] text-[#F4F1EA]">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
