"use client";

import { useEffect } from "react";

/**
 * Marks the "On this page" link of the section being read (class "on" and aria-current) in the
 * right column. The links work without it; this only adds the marker.
 */
export function TocSpy({ ids }: { readonly ids: readonly string[] }): null {
  useEffect(() => {
    const links = new Map<string, HTMLAnchorElement>();
    for (const a of document.querySelectorAll<HTMLAnchorElement>(".ct-toc a[href^='#']")) {
      links.set(a.getAttribute("href")?.slice(1) ?? "", a);
    }
    const heads = ids
      .map((id) => document.getElementById(id))
      .filter((h): h is HTMLElement => h !== null);
    if (heads.length === 0) return;

    const mark = (): void => {
      // The last heading above a line a third of the way down the window is the one being read.
      const line = window.innerHeight / 3;
      let current = heads[0]?.id ?? "";
      for (const h of heads) if (h.getBoundingClientRect().top <= line) current = h.id;
      for (const [id, a] of links) {
        const on = id === current;
        a.classList.toggle("on", on);
        if (on) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      }
    };

    const first = requestAnimationFrame(mark);
    window.addEventListener("scroll", mark, { passive: true });
    window.addEventListener("resize", mark);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", mark);
      window.removeEventListener("resize", mark);
    };
  }, [ids]);
  return null;
}
