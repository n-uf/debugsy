import type { Viewport } from "next";
import Link from "next/link";
import type React from "react";
import { allEntries, entryToc, type TocLink } from "../../_content/content";
import { primaryNav, SiteRail } from "../site-rail";
import { RailToc } from "./rail-toc";
import { SiteNav } from "./site-nav";
import "./content.css";

// Reading pages can be zoomed on a phone (the home page keeps its fixed scale).
export const CONTENT_VIEWPORT: Viewport = {
  themeColor: "#07090c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

/**
 * The blog and use-case pages: the site's left rail (the same as the home page's) with the open page's
 * "On this page" list under its links, a lighter reading column, and a top bar on phones.
 */
export function ContentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  const tocs: Record<string, readonly TocLink[]> = {};
  for (const e of allEntries()) tocs[e.path] = entryToc(e);

  return (
    <div className="ct">
      <header className="ct-topbar">
        <Link className="ct-wordmark" href="/">
          debugsy
        </Link>
        <SiteNav items={primaryNav()} className="ct-topnav" label="sections" />
      </header>
      <div className="ct-shell">
        <aside className="ct-rail" aria-label="sidebar">
          <SiteRail />
          <RailToc tocs={tocs} />
        </aside>
        <main className="ct-main">{children}</main>
      </div>
    </div>
  );
}
