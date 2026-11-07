import type { Viewport } from "next";
import type React from "react";
import "./content.css";

// Reading pages can be zoomed on a phone (so can every page now; this matches the root layout).
export const CONTENT_VIEWPORT: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

/**
 * The blog and use-case pages, inside the site's frame. The top bar and the footer come from the
 * root layout; an article's "On this page" list sits in its own right column (entry-page.tsx).
 */
export function ContentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return <main className="ct g-frame">{children}</main>;
}
