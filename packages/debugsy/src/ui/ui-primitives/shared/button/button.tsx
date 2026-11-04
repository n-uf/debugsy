"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import { cn } from "../../../utils/cn";

/**
 * Button variants using CVA (class-variance-authority)
 * Extracted from shadcn/ui button + debugsy patterns
 */
const buttonVariants = cva(
  // Base styles - terminal aesthetic with sharp corners
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[rgb(var(--color-bg-tertiary))] text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-hover))] border border-[rgb(var(--color-border-primary))]",
        primary:
          "bg-[rgb(var(--color-led-cyan))] text-[rgb(var(--color-bg-primary))] hover:bg-[rgb(var(--color-led-cyan)/0.85)] font-semibold",
        success:
          "bg-[rgb(var(--color-led-green))] text-[rgb(var(--color-bg-primary))] hover:bg-[rgb(var(--color-led-green)/0.85)] font-semibold",
        error:
          "bg-[rgb(var(--color-led-pink))] text-[rgb(var(--color-bg-primary))] hover:bg-[rgb(var(--color-led-pink)/0.85)] font-semibold",
        outline:
          "border border-[rgb(var(--color-border-primary))] bg-transparent text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-hover))] hover:text-[rgb(var(--color-text-primary))]",
        ghost:
          "bg-transparent text-[rgb(var(--color-text-secondary))] hover:bg-[rgb(var(--color-hover))] hover:text-[rgb(var(--color-text-primary))]",
        link: "text-[rgb(var(--color-led-cyan))] underline-offset-4 hover:underline",
      },
      size: {
        xxs: "h-auto py-0.5 px-1.5 text-[9px]",
        xs: "h-6 px-2 text-[10px]",
        sm: "h-7 px-3 text-[11px]",
        md: "h-8 px-4 text-xs",
        lg: "h-10 px-6 text-sm",
        xl: "h-12 px-8 text-base",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as child component (polymorphic component pattern)
   */
  asChild?: boolean;
  /**
   * Toggle state - when true, applies pressed/active styling
   */
  pressed?: boolean;
  /**
   * Executing/loading state - when true, shows loading indicator and disables interaction
   */
  executing?: boolean;
  /**
   * Label to show when executing (default: "...")
   */
  executingLabel?: string;
}

/**
 * Button component
 *
 * A versatile button component with multiple variants and sizes.
 * Based on shadcn/ui button with additional variants from debugsy.
 *
 * @example Basic usage
 * ```tsx
 * <Button variant="primary" size="md">
 *   Click me
 * </Button>
 * ```
 *
 * @example Toggle button
 * ```tsx
 * <Button pressed={isActive} onClick={toggle}>
 *   Toggle
 * </Button>
 * ```
 *
 * @example Executing button
 * ```tsx
 * <Button executing={isLoading} executingLabel="Loading...">
 *   Submit
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      pressed = false,
      executing = false,
      executingLabel = "...",
      children,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // Executing state styling - theme-aware muted appearance
    const executingClass = executing ? "opacity-50 cursor-wait" : "";

    // Determine if button should be disabled
    const isDisabled = disabled || executing;

    // Determine button content (show executing label if executing)
    const content = executing ? executingLabel : children;

    // Toggle/pressed state styling - using predefined theme color (industry standard)
    // Applied via inline style for reliable CSS variable usage
    // Add subtle inset shadow for depth perception (pressed = inward)
    // Apply contrasting text color for optimal readability
    // Merge with user-provided styles
    const mergedStyle = pressed
      ? {
          ...style,
          backgroundColor: "rgb(var(--color-chrome-button-pressed))",
          color: "rgb(var(--color-chrome-button-pressed-text))",
          // boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.15)",
        }
      : style;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          executingClass,
          className
        )}
        style={mergedStyle}
        ref={ref}
        disabled={isDisabled}
        aria-pressed={pressed}
        aria-busy={executing}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);

Button.displayName = "Button";
