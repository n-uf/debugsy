import type React from "react";

type TokKind = "kw" | "str" | "comment" | "fn";
const CLASS: Record<TokKind, string> = { kw: "k", str: "s", comment: "c", fn: "f" };

/** One highlighted token inside a `.g-code` block (colours in site-chrome.css). */
export function Tok({
  kind,
  children,
}: {
  readonly kind: TokKind;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <span className={CLASS[kind]}>{children}</span>;
}
