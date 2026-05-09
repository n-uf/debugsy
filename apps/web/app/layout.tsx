import type { Metadata, Viewport } from "next";
import type React from "react";
import "./globals.css";

const SITE_URL = "https://debugsy.dev";
const TITLE = "debugsy — real-time React debugging panel";
const DESCRIPTION =
  "debugsy is a drop-in React debugging toolkit: real-time structured logs, dependency tracking, render circuit breakers, and a virtualized terminal panel. Zero impact in production.";

export const viewport: Viewport = {
  themeColor: "#07090c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — debugsy",
  },
  description: DESCRIPTION,
  applicationName: "debugsy",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  keywords: [
    "react debugging",
    "react devtools",
    "useWhyDidYouUpdate",
    "render tracker",
    "infinite loop",
    "circuit breaker",
    "react hooks",
    "performance monitoring",
    "structured logging",
    "debug panel",
    "dependency tracking",
    "next.js debugging",
  ],
  authors: [{ name: "debugsy" }],
  creator: "debugsy",
  publisher: "debugsy",
  category: "Developer Tools",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "debugsy",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@debugsy",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "debugsy",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Browser",
  url: SITE_URL,
  description: DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  softwareVersion: "2.0",
  author: {
    "@type": "Organization",
    name: "debugsy",
  },
  featureList: [
    "Real-time structured debug logging",
    "Dependency tracking with useWhyDidYouUpdate",
    "Render-rate circuit breakers",
    "Health snapshots",
    "Virtualized log rendering",
    "Console runtime configuration",
    "Zero production impact",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" data-theme="ocean" className="h-full">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(STRUCTURED_DATA),
          }}
        />
      </head>
      <body className="antialiased h-full overflow-hidden">{children}</body>
    </html>
  );
}
