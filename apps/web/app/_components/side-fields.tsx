"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./brand-mark";
import { type NavItem, SiteNav } from "./content/site-nav";
import { SkinToggle } from "./skin-toggle";

const WIDE = "(min-width: 1024px)";
const STILL = "(prefers-reduced-motion: reduce)";
const GLIDE: KeyframeAnimationOptions = { duration: 440, easing: "cubic-bezier(.2,.7,.2,1)" };
const STAGGER_MS = 28;

/** The bar's items and the side fields' items, in the same order, so each glides to its twin. */
function itemsOf(root: Element | null, left: string, right: string): HTMLElement[] {
  if (!root) return [];
  return [
    ...root.querySelectorAll<HTMLElement>(`${left} > .g-brand, ${left} .g-nav a`),
    ...root.querySelectorAll<HTMLElement>(`${right} > *`),
  ];
}

/** For each side-field item: the translate that puts it where its twin in the bar is. */
function offsets(from: HTMLElement[], to: HTMLElement[]): string[] {
  return to.map((el, i) => {
    const a = from[i]?.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return a ? `translate(${a.left - b.left}px, ${a.top - b.top}px)` : "none";
  });
}

/**
 * Desktop only. Once the top bar has scrolled out of view, a copy of its two halves appears in the
 * empty fields beside the page frame and glides there from the bar; scrolling back to the top glides
 * it home and the bar shows again. Only transforms move and a copy is shown or hidden, so nothing
 * shifts the page's layout. The copy exists only in the browser: the server HTML has one nav.
 */
export function SideFields({
  nav,
  version,
  repoUrl,
  changelogUrl,
}: {
  readonly nav: readonly NavItem[];
  readonly version: string;
  readonly repoUrl: string;
  readonly changelogUrl: string;
}): React.ReactElement {
  const [side, setSide] = useState(false);
  const fieldsRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef(false);

  useEffect(() => {
    const bar = fieldsRef.current?.closest(".g-bar");
    if (!(bar instanceof HTMLElement)) return;
    const wide = window.matchMedia(WIDE);
    let leaving: Animation[] = [];

    const enter = (): void => {
      sideRef.current = true;
      leaving.forEach((a) => a.cancel());
      leaving = [];
      setSide(true);
    };
    const leave = (): void => {
      sideRef.current = false;
      const fields = itemsOf(fieldsRef.current, ".g-side-l", ".g-side-r");
      if (window.matchMedia(STILL).matches || fields.length === 0) {
        setSide(false);
        return;
      }
      bar.classList.add("is-side");
      const moves = offsets(itemsOf(bar, ".g-bar-l", ".g-bar-r"), fields);
      leaving = fields.map((el, i) =>
        el.animate([{ transform: "none" }, { transform: moves[i] ?? "none" }], {
          ...GLIDE,
          delay: i * STAGGER_MS,
          fill: "forwards",
        }),
      );
      Promise.all(leaving.map((a) => a.finished))
        .then(() => {
          if (!sideRef.current) setSide(false);
        })
        .catch(() => {
          // Cancelled because the reader scrolled down again: the fields stay.
        });
    };
    const check = (): void => {
      const away = wide.matches && window.scrollY > bar.offsetHeight;
      if (away && !sideRef.current) enter();
      else if (!away && sideRef.current) leave();
    };

    // First check after the first frame (a reload can restore a scrolled position).
    const first = requestAnimationFrame(check);
    window.addEventListener("scroll", check, { passive: true });
    wide.addEventListener("change", check);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", check);
      wide.removeEventListener("change", check);
    };
  }, []);

  // Glide in after the copy has rendered: from where the bar's items are to the fields.
  useEffect(() => {
    const bar = fieldsRef.current?.closest(".g-bar");
    if (!(bar instanceof HTMLElement)) return;
    bar.classList.toggle("is-side", side);
    if (!side || window.matchMedia(STILL).matches) return;
    const fields = itemsOf(fieldsRef.current, ".g-side-l", ".g-side-r");
    const moves = offsets(itemsOf(bar, ".g-bar-l", ".g-bar-r"), fields);
    fields.forEach((el, i) => {
      el.animate([{ transform: moves[i] ?? "none" }, { transform: "none" }], {
        ...GLIDE,
        delay: i * STAGGER_MS,
        fill: "backwards",
      });
    });
  }, [side]);

  return (
    <div ref={fieldsRef} className="g-fields">
      {side ? (
        <>
          <div className="g-side-l">
            <Link className="g-brand" href="/">
              <BrandMark />
              debugsy
            </Link>
            <SiteNav items={nav} className="g-nav" label="sections" />
          </div>
          <div className="g-side-r">
            <a href={repoUrl} target="_blank" rel="noopener">
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <a href={changelogUrl} target="_blank" rel="noopener">
              Changelog <span aria-hidden="true">↗</span>
            </a>
            <span className="g-ver" title="latest release">
              {version}
            </span>
            <SkinToggle />
          </div>
        </>
      ) : null}
    </div>
  );
}
