"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Code blocks wider than their box scroll sideways (on phones, mostly). This marks such a block
 * with a cyan edge on the side that has more to see ("more-r", "more-l"); the edge goes once the
 * reader has scrolled there. Blocks that fit get no marker.
 */
export function ScrollHints(): null {
  const path = usePathname();

  useEffect(() => {
    const blocks = [...document.querySelectorAll<HTMLElement>("main pre")];
    const mark = (pre: HTMLElement): void => {
      const max = pre.scrollWidth - pre.clientWidth;
      pre.classList.toggle("more-r", max > 1 && pre.scrollLeft < max - 1);
      pre.classList.toggle("more-l", max > 1 && pre.scrollLeft > 1);
    };
    const onScroll = (e: Event): void => mark(e.currentTarget as HTMLElement);
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) mark(entry.target as HTMLElement);
    });
    for (const pre of blocks) {
      mark(pre);
      pre.addEventListener("scroll", onScroll, { passive: true });
      ro.observe(pre);
    }
    // The web fonts can change how wide the code is without resizing its box.
    let live = true;
    void document.fonts?.ready.then(() => {
      if (live) for (const pre of blocks) mark(pre);
    });
    return () => {
      live = false;
      ro.disconnect();
      for (const pre of blocks) pre.removeEventListener("scroll", onScroll);
    };
  }, [path]);

  return null;
}
