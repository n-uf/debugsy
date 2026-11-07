import Link from "next/link";
import type React from "react";
import { liveSections } from "../_content/content";
import { CHANGELOG_URL, LIB_VERSION, REPO_URL } from "../site";
import { BrandMark } from "./brand-mark";
import { type NavItem, SiteNav } from "./content/site-nav";
import { SideFields } from "./side-fields";
import { SkinToggle } from "./skin-toggle";
import "./site-chrome.css";

/** The sections that have live pages, as the bar names them. */
export function sectionNav(): NavItem[] {
  return liveSections().map((s) => ({
    href: s.path,
    label: s.section === "blog" ? "Blog" : "Use cases",
  }));
}

/**
 * The top bar on every page, inside the page frame. It isn't sticky: once it has scrolled away, on
 * desktops its two halves reappear in the empty fields beside the frame (SideFields).
 */
export function SiteBar(): React.ReactElement {
  const nav = sectionNav();
  return (
    <header className="g-bar">
      <div className="g-bar-in">
        <div className="g-bar-l">
          <Link className="g-brand" href="/">
            <BrandMark />
            debugsy
          </Link>
          <SiteNav items={nav} className="g-nav" label="sections" />
        </div>
        <div className="g-bar-r">
          <a href={REPO_URL} target="_blank" rel="noopener">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <a href={CHANGELOG_URL} target="_blank" rel="noopener">
            Changelog <span aria-hidden="true">↗</span>
          </a>
          <span className="g-ver" title="latest release">
            {LIB_VERSION}
          </span>
          <SkinToggle />
        </div>
      </div>
      <SideFields nav={nav} version={LIB_VERSION} repoUrl={REPO_URL} changelogUrl={CHANGELOG_URL} />
    </header>
  );
}
