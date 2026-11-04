import Link from "next/link";
import type React from "react";
import { liveSections } from "../_content/content";
import { CHANGELOG_URL, LIB_VERSION, LICENSE_NAME, REPO_URL } from "../site";
import { type NavItem, SiteNav } from "./content/site-nav";
import { ThemeSwitcherClient } from "./theme-switcher-client";
import "./site-rail.css";

/** Home, then the content sections that have pages. */
export function primaryNav(): NavItem[] {
  return [
    { href: "/", label: "home" },
    ...liveSections().map((s) => ({
      href: s.path,
      label: s.section === "blog" ? "blog" : "use cases",
    })),
  ];
}

const PROJECT_NAV: readonly NavItem[] = [
  { href: REPO_URL, label: "source", external: true },
  { href: CHANGELOG_URL, label: "changelog", external: true },
];

/**
 * The left rail's identity block and links. Every page renders this same component inside its own
 * 260px rail (24px 20px padding, 24px gap), so nothing moves when you go from one page to another.
 */
export function SiteRail(): React.ReactElement {
  return (
    <>
      <div className="sr-ident">
        <Link className="sr-wordmark" href="/">
          debugsy
        </Link>
        <ThemeSwitcherClient orientation="horizontal" size="sm" />
        <span className="sr-meta">in-process React debug panel</span>
        <span className="sr-meta">
          {LIB_VERSION} · {LICENSE_NAME.toLowerCase()}
        </span>
        <span className="sr-meta">
          by{" "}
          <a href="https://n-uf.com" target="_blank" rel="noopener noreferrer">
            n-uf
          </a>
        </span>
      </div>
      <SiteNav items={primaryNav()} className="sr-nav" label="primary" />
      <SiteNav items={PROJECT_NAV} className="sr-nav" label="project" />
    </>
  );
}
