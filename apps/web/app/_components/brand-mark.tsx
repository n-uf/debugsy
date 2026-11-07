import type React from "react";

/** The debugsy mark: a lowercase d with the panel's cyan LED (the same drawing as app/icon.svg). */
export function BrandMark(): React.ReactElement {
  return (
    <svg className="g-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="7" fill="#0f172a" />
      <circle cx="13.2" cy="19.2" r="5.6" fill="none" stroke="#e2e8f0" strokeWidth="3.2" />
      <rect x="17.2" y="5.6" width="3.2" height="19.8" rx="1.2" fill="#e2e8f0" />
      <circle cx="25.6" cy="25.4" r="2.6" fill="#22d3ee" />
    </svg>
  );
}
