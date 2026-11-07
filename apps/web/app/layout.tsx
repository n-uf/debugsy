import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type React from "react";
import "./globals.css";
import { ScrollHints } from "./_components/scroll-hints";
import { SiteBar } from "./_components/site-bar";
import { SiteFooter } from "./_components/site-footer";
import { SKIN_INIT_SCRIPT } from "./_components/skin";
import { HOME_DESCRIPTION, HOME_TITLE } from "./home-meta";
import { SITE_NAME, SITE_URL } from "./site";

// Self-hosted at build time (no request to Google Fonts from the page).
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Every page can be zoomed (the home page used to block it).
export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

// The home page's metadata; the blog and use-case pages set their own (title, description,
// canonical, Open Graph), and every page's structured data lives with the page. The icons come from
// the files in this folder (favicon.ico, icon.svg, icon1.png, icon2.png, apple-icon.png).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  authors: [{ name: "n-uf", url: "https://n-uf.com" }],
  creator: "n-uf",
  publisher: "n-uf",
  category: "Developer Tools",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
  // One robots meta tag (an n-uf-seo rule), holding the preview directives too.
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

/**
 * Every page: the top bar, the page's own content, the footer. The skin (light or dark) is set on
 * <html> before the first paint by a tiny inline script, so a dark-skin visitor never sees a flash of
 * the light page; the attribute differs from the server's on purpose, hence suppressHydrationWarning.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html
      lang="en"
      data-skin="light"
      className={`${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKIN_INIT_SCRIPT }} />
      </head>
      <body>
        <SiteBar />
        {children}
        <SiteFooter />
        <ScrollHints />
      </body>
    </html>
  );
}
