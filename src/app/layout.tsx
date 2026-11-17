import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-body", subsets: ["latin"], display: "swap" });
const spaceGrotesk = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const jetBrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Portfolio | Full stack, AI & data",
  description: "Full stack development, AI engineering, and data science portfolio.",
  openGraph: {
    title: "Portfolio | Full stack, AI & data",
    description: "Full stack development, AI engineering, and data science portfolio.",
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
      className={`${dmSans.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="preload"
          href="/ascii-art-poster.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
