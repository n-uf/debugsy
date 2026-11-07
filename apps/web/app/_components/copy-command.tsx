"use client";

import type React from "react";
import { useEffect, useState } from "react";

/** A copy button for a shell command; says "copied" for a moment. */
export function CopyCommand({ command }: { readonly command: string }): React.ReactElement {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <button
      type="button"
      className="g-copy"
      onClick={() => {
        navigator.clipboard?.writeText(command).then(
          () => setCopied(true),
          () => setCopied(false),
        );
      }}
      aria-label={`Copy ${command}`}
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}
