import type { Viewport } from "next";
import Link from "next/link";
import type React from "react";
import { liveSections } from "../../_content/content";
import { CHANGELOG_URL, REPO_URL } from "../../site";
import { ThemeSwitcherClient } from "../theme-switcher-client";
import { type NavItem, SiteNav } from "./site-nav";
import "./content.css";

// Reading pages can be zoomed on a phone (the home page keeps its fixed scale).
export const CONTENT_VIEWPORT: Viewport = {
  themeColor: "#07090c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

/** The blog and use-case pages: the home page's left rail, a lighter reading column, a top bar on phones. */
export function ContentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  const sections: NavItem[] = liveSections().map((s) => ({
    href: s.path,
    label: s.section === "blog" ? "blog" : "use cases",
  }));
  const main: NavItem[] = [{ href: "/", label: "home" }, ...sections];
  const outside: NavItem[] = [
    { href: REPO_URL, label: "source", external: true },
    { href: CHANGELOG_URL, label: "changelog", external: true },
  ];

  return (
    <div className="ct">
      <header className="ct-topbar">
        <Link className="ct-wordmark" href="/">
          debugsy
        </Link>
        <SiteNav items={main} className="ct-topnav" label="sections" />
      </header>
      <div className="ct-shell">
        <aside className="ct-rail" aria-label="sidebar">
          <div className="ct-ident">
            <Link className="ct-wordmark" href="/">
              debugsy
            </Link>
            <ThemeSwitcherClient orientation="horizontal" size="sm" />
            <span className="ct-meta">in-process React debug panel</span>
            <span className="ct-meta">
              by{" "}
              <a href="https://n-uf.com" rel="noopener">
                n-uf
              </a>
            </span>
          </div>
          <SiteNav items={main} className="ct-nav" label="primary" />
          <SiteNav items={outside} className="ct-nav ct-nav-out" label="project" />
        </aside>
        <main className="ct-main">{children}</main>
      </div>
    </div>
  );
}
