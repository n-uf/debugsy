"use client";

import { usePathname } from "next/navigation";
import type React from "react";
import type { TocLink } from "../../_content/content";

/**
 * The open page's "On this page" list, in the left rail under the links. The layout hands it every
 * page's list; the path picks one, so the rail keeps its place when you move between pages.
 */
export function RailToc({
  tocs,
}: {
  readonly tocs: Readonly<Record<string, readonly TocLink[]>>;
}): React.ReactElement | null {
  const toc = tocs[usePathname() ?? ""];
  if (!toc) return null;
  return (
    <nav className="ct-toc" aria-label="on this page">
      <p className="ct-label">On this page</p>
      {toc.map((t) => (
        <a key={t.id} href={`#${t.id}`}>
          {t.text}
        </a>
      ))}
    </nav>
  );
}
