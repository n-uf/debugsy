"use client";

import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

/** For each side-field item: the translate that puts it where its twin in the bar is now. */
function offsets(from: HTMLElement[], to: HTMLElement[]): string[] {
  return to.map((el, i) => {
    const a = from[i]?.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    return a ? `translate(${a.left - b.left}px, ${a.top - b.top}px)` : "none";
  });
}

const reducedMotion = (): boolean => window.matchMedia(STILL).matches;

/** The top bar that holds these fields. */
function barOf(fields: HTMLElement | null): HTMLElement | null {
  const bar = fields?.closest(".g-bar");
  return bar instanceof HTMLElement ? bar : null;
}

/**
 * Desktop only. Once the top bar has scrolled out of view, a copy of its two halves appears in the
 * empty fields beside the page frame and glides there from the bar. Back at the top the bar's own
 * items show again at once while the copy glides home and fades. Only transforms and opacity move,
 * and items are shown or hidden in place, so nothing shifts the page's layout. The copy exists only
 * in the browser: the server HTML has one nav.
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
  const leaving = useRef<Animation[]>([]);

  /** Show the copy where it rests and hide the bar's items; glide the copy in from the bar. */
  const glideIn = useCallback((): void => {
    const fields = fieldsRef.current;
    const bar = barOf(fields);
    if (!bar || !fields) return;
    for (const a of leaving.current) a.cancel();
    leaving.current = [];
    fields.inert = false;
    bar.classList.add("is-side");
    if (reducedMotion()) return;
    const items = itemsOf(fields, ".g-side-l", ".g-side-r");
    const moves = offsets(itemsOf(bar, ".g-bar-l", ".g-bar-r"), items);
    items.forEach((el, i) => {
      el.animate([{ transform: moves[i] ?? "none" }, { transform: "none" }], {
        ...GLIDE,
        delay: i * STAGGER_MS,
        fill: "backwards",
      });
    });
  }, []);

  useEffect(() => {
    const bar = barOf(fieldsRef.current);
    if (!bar) return;
    const wide = window.matchMedia(WIDE);

    const enter = (): void => {
      sideRef.current = true;
      // A copy still gliding out is reused; otherwise it mounts and the layout effect glides it in.
      // setSide(true) either way: it overrides a setSide(false) from a leave that just finished
      // but hasn't rendered yet, which would otherwise unmount the reused copy.
      if (fieldsRef.current?.firstChild) glideIn();
      setSide(true);
    };
    const leave = (animate: boolean): void => {
      sideRef.current = false;
      const fields = fieldsRef.current;
      const items = itemsOf(fields, ".g-side-l", ".g-side-r");
      const twins = itemsOf(bar, ".g-bar-l", ".g-bar-r");
      // The bar's own items come back at once; keyboard focus moves to the matching one.
      bar.classList.remove("is-side");
      const focused = items.findIndex((el) => el.contains(document.activeElement));
      if (focused >= 0) twins[focused]?.focus({ preventScroll: true });
      if (!animate || !fields || items.length === 0 || reducedMotion()) {
        setSide(false);
        return;
      }
      fields.inert = true;
      const moves = offsets(twins, items);
      leaving.current = items.map((el, i) =>
        el.animate(
          [
            { transform: "none", opacity: 1 },
            { transform: moves[i] ?? "none", opacity: 0 },
          ],
          { ...GLIDE, delay: i * STAGGER_MS, fill: "forwards" },
        ),
      );
      Promise.all(leaving.current.map((a) => a.finished))
        .then(() => {
          if (!sideRef.current) setSide(false);
        })
        .catch(() => {
          // Cancelled because the reader scrolled down again: the copy stays.
        });
    };
    const check = (): void => {
      if (!wide.matches) {
        if (sideRef.current) leave(false);
        return;
      }
      const away = window.scrollY > bar.offsetHeight;
      if (away && !sideRef.current) enter();
      else if (!away && sideRef.current) leave(true);
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
  }, [glideIn]);

  // Before paint, so the copy never shows at rest first: glide it in, or clear the bar's state.
  useLayoutEffect(() => {
    if (side) glideIn();
    else barOf(fieldsRef.current)?.classList.remove("is-side");
  }, [side, glideIn]);

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
