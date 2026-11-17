import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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
  title: "Ranjan Vernekar — Systems, AI & Spatial Engineering",
  description:
    "Cinematic engineering portfolio of Ranjan Vernekar: distributed AI infrastructure, full-stack architecture, and real-time spatial graphics.",
  openGraph: {
    title: "Ranjan Vernekar — Systems, AI & Spatial Engineering",
    description:
      "Cinematic engineering portfolio of Ranjan Vernekar: distributed AI infrastructure, full-stack architecture, and real-time spatial graphics.",
    type: "website",
    images: [{ url: "/ascii-art-poster.webp", width: 1920, height: 1072 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/ascii-art-poster.webp"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${cormorantGaramond.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0D0B12] text-[#F3EEF8]">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="grain-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
