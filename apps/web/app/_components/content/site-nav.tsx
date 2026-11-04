"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly external?: boolean;
}

/** The rail's and the phone bar's links; the current section is marked. */
export function SiteNav({
  items,
  className,
  label,
}: {
  readonly items: readonly NavItem[];
  readonly className: string;
  readonly label: string;
}): React.ReactElement {
  const pathname = usePathname() ?? "/";
  const isOn = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <nav aria-label={label} className={className}>
      {items.map((it) =>
        it.external ? (
          <a key={it.href} href={it.href} target="_blank" rel="noopener">
            {it.label}
          </a>
        ) : (
          <Link
            key={it.href}
            href={it.href}
            className={isOn(it.href) ? "on" : undefined}
            aria-current={isOn(it.href) ? "page" : undefined}
          >
            {it.label}
          </Link>
        ),
      )}
    </nav>
  );
}
