/**
 * Small inline icons for display alert mode (12px, currentColor).
 */

import React from "react";

const svgProps = {
  width: 12,
  height: 12,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export const AlertWarningIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg {...svgProps} width={size} height={size}>
    <path d="M8 1.75 15 14.25H1L8 1.75Z" />
    <path d="M8 6.5v3.5" />
    <path d="M8 12.25h.01" />
  </svg>
);

export const AlertRetryIcon: React.FC = () => (
  <svg {...svgProps}>
    <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
    <path d="M13.5 2v3.5H10" />
  </svg>
);

export const AlertDetailsIcon: React.FC = () => (
  <svg {...svgProps}>
    <path d="M8 7v5" />
    <path d="M8 4h.01" />
  </svg>
);

export const AlertDismissIcon: React.FC = () => (
  <svg {...svgProps}>
    <path d="M4 4l8 8" />
    <path d="M12 4l-8 8" />
  </svg>
);

export const AlertCopyIcon: React.FC = () => (
  <svg {...svgProps}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2" />
  </svg>
);

export const AlertMailIcon: React.FC = () => (
  <svg {...svgProps}>
    <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" />
    <path d="m2.25 4 5.75 4.5L13.75 4" />
  </svg>
);

export const AlertCheckIcon: React.FC = () => (
  <svg {...svgProps}>
    <path d="m3 8.5 3.25 3.25L13 5" />
  </svg>
);
