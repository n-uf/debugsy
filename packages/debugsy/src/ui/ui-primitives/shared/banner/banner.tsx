"use client";

import React from "react";
import { cn } from "../../../utils/cn";

export interface BannerProps {
  /** Banner message */
  message: string;
  /** Click handler */
  onClick?: () => void;
  /** Banner variant for predefined styles */
  variant?: "paused" | "snapshot" | "info" | "warning" | "error" | "success";
  /** Additional className for customization */
  className?: string;
  /** Emoji/icon to display */
  emoji?: string;
  /** Tooltip text */
  title?: string;
  /** Z-index override */
  zIndex?: number;
}

/**
 * Banner - Clickable notification strip
 *
 * Generic banner for displaying notifications, alerts, or status messages.
 * Follows shadcn pattern with variants and className customization.
 *
 * Usage:
 * ```tsx
 * <Banner
 *   message="Log rendering paused at 2742 logs - Click to resume"
 *   emoji="⏸️"
 *   variant="paused"
 *   onClick={handleResume}
 * />
 * ```
 */
export const Banner: React.FC<BannerProps> = ({
  message,
  onClick,
  variant = "info",
  className,
  emoji,
  title,
  zIndex = 1000,
}) => {
  // Variant styles matching debugsy exactly
  const variantStyles = {
    paused: "", // Colors applied via inline styles
    snapshot: "bg-blue-600/15 text-blue-400 border border-blue-600/30",
    info: "bg-blue-500/15 text-blue-300 border border-blue-500/30",
    warning: "bg-orange-500/15 text-orange-400 border border-orange-500/30",
    error: "bg-red-500/15 text-red-400 border border-red-500/30",
    success: "bg-green-500/15 text-green-400 border border-green-500/30",
  };

  // Inline styles for colors that need exact hex values (matching debugsy exactly)
  const variantInlineStyles = {
    paused: {
      backgroundColor: "#fbbf2422",
      borderColor: "#f59e0b44",
      borderBottom: "1px solid #f59e0b44",
      color: "#f59e0b",
      borderWidth: "1px",
      fontSize: "10px",
      lineHeight: "1.2",
    },
    snapshot: {
      backgroundColor: "#3b82f622",
      borderColor: "#3b82f644",
      borderBottom: "1px solid #3b82f644",
      color: "#60a5fa",
      borderWidth: "1px",
      fontSize: "10px",
      lineHeight: "1.2",
      fontWeight: "bold",
    },
    info: {},
    warning: {},
    error: {},
    success: {},
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "text-center font-mono font-bold px-2 py-1 rounded-sm mb-1 transition-all duration-200 select-none sticky top-0 backdrop-blur-sm border",
        onClick && "cursor-pointer hover:scale-[1.02]",
        variantStyles[variant],
        className
      )}
      style={{
        zIndex,
        ...variantInlineStyles[variant],
      }}
      title={title}
    >
      {emoji && `${emoji} `}
      {message}
    </div>
  );
};

Banner.displayName = "Banner";
