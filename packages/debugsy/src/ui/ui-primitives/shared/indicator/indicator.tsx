"use client";

import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { cn } from "../../../utils/cn";

/**
 * Indicator variants - LED-style with harbuz terminal colors
 */
const indicatorVariants = cva(
  "inline-block rounded-sm transition-colors duration-150",
  {
    variants: {
      variant: {
        success: "bg-[rgb(var(--color-led-green))]",
        error: "bg-[rgb(var(--color-led-pink))]",
        warning: "bg-[rgb(var(--color-led-yellow))]",
        info: "bg-[rgb(var(--color-led-cyan))]",
        neutral: "bg-[rgb(var(--color-text-muted))]",
        primary: "bg-[rgb(var(--color-led-cyan))]",
      },
      size: {
        sm: "w-1.5 h-1",
        md: "w-2 h-1",
        lg: "w-3 h-1.5",
      },
      shape: {
        slit: "", // Default horizontal slit (wider than tall)
        "vertical-slit": "w-1 h-2", // Vertical slit (taller than wide)
        dot: "rounded-full aspect-square", // Circular dot
        square: "rounded-sm aspect-square", // Square
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
      shape: "slit",
    },
  }
);

export interface IndicatorProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof indicatorVariants> {
  /**
   * Whether the indicator is active (for toggling colors)
   */
  active?: boolean;
  /**
   * Inactive variant (used when active=false)
   */
  inactiveVariant?: "error" | "neutral" | "primary";
  /**
   * Whether the indicator should pulse/animate
   */
  pulsing?: boolean;
  /**
   * Animation type for special states
   * - "processing": yellow-green cycling animation
   */
  animation?: "processing";
}

/**
 * Indicator component
 *
 * LED-style status indicators for showing enabled/disabled states.
 * Extracted from debugsy toggle buttons.
 *
 * @example
 * ```tsx
 * <Indicator variant="success" active={true} />
 * <Indicator variant="success" active={false} inactiveVariant="error" />
 * <Indicator variant="info" shape="dot" />
 * ```
 */
export const Indicator = React.forwardRef<HTMLSpanElement, IndicatorProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      active = true,
      inactiveVariant = "error",
      pulsing = false,
      animation,
      ...props
    },
    ref
  ) => {
    const effectiveVariant = active ? variant : inactiveVariant;

    // Animation classes
    const animationClass =
      animation === "processing"
        ? "animate-led-yellow-green-pulsing"
        : pulsing
          ? "animate-pulse"
          : "";

    return (
      <span
        ref={ref}
        className={cn(
          indicatorVariants({
            variant: effectiveVariant,
            size,
            shape,
          }),
          animationClass,
          className
        )}
        role="status"
        aria-label={active ? "Active" : "Inactive"}
        {...props}
      />
    );
  }
);

Indicator.displayName = "Indicator";
