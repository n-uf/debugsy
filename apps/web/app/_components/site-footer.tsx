import Link from "next/link";
import type React from "react";
import { entriesOf, liveSections } from "../_content/content";
import { CHANGELOG_URL, LICENSE_NAME, REPO_URL } from "../site";
import { BrandMark } from "./brand-mark";
import { SkinToggle } from "./skin-toggle";

const NPM_URL = "https://www.npmjs.com/package/@n-uf/debugsy";
/** How many of a section's newest pages the footer lists before "All …". */
const PER_SECTION = 6;

/**
 * Every page ends with a small site map: the live use cases and articles by title, newest first,
 * and the project's links. Drafts never appear (entriesOf only returns what the build shows).
 */
export function SiteFooter(): React.ReactElement {
  return (
    <footer className="g-foot">
      <div className="g-foot-in">
        <div className="g-foot-about">
          <Link className="g-brand" href="/">
            <BrandMark />
            debugsy
          </Link>
          <p>
            In-process React debug panel, by <a href="https://n-uf.com">n-uf</a>. {LICENSE_NAME}.
          </p>
          <div className="g-foot-skin">
            <SkinToggle />
          </div>
        </div>
        {liveSections().map((s) => (
          <nav key={s.section} className="g-foot-col" aria-label={s.section === "blog" ? "articles" : "use cases"}>
            <p className="g-label">{s.section === "blog" ? "Blog" : "Use cases"}</p>
            {entriesOf(s.section)
              .slice(0, PER_SECTION)
              .map((e) => (
                <Link key={e.path} href={e.path}>
                  {e.title}
                </Link>
              ))}
            <Link className="g-foot-all" href={s.path}>
              {s.section === "blog" ? "All articles" : "All use cases"} <span aria-hidden="true">→</span>
            </Link>
          </nav>
        ))}
        <nav className="g-foot-col" aria-label="project">
          <p className="g-label">Project</p>
          <a href={REPO_URL} target="_blank" rel="noopener">
            Source on GitHub <span aria-hidden="true">↗</span>
          </a>
          <a href={CHANGELOG_URL} target="_blank" rel="noopener">
            Changelog <span aria-hidden="true">↗</span>
          </a>
          <a href={NPM_URL} target="_blank" rel="noopener">
            npm package <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
