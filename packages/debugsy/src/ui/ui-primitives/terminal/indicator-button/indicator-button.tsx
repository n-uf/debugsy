"use client";

import React from "react";
import { Button } from "../../shared/button/button";
import { Indicator } from "../../shared/indicator/indicator";
import { MultiIndicator } from "../../shared/indicator/multi-indicator";

export interface MultiIndicatorConfig {
  /**
   * Array of indicator states (true = active, false = inactive)
   */
  indicators: boolean[];
  /**
   * Whether all indicators are disabled
   */
  disabled?: boolean;
  /**
   * Active variant for indicators
   */
  activeVariant?: "success" | "error" | "warning" | "info" | "neutral";
  /**
   * Inactive variant for indicators
   */
  inactiveVariant?: "error" | "neutral";
  /**
   * Size of indicators
   */
  size?: "sm" | "md" | "lg";
  /**
   * Gap between indicators
   */
  gap?: string;
}

/**
 * Type of indicator pattern to display
 * - "none": No indicator (plain button)
 * - "toggle": Toggle button with pressed/unpressed state (no separate indicator, button shows state)
 * - "executing": Button with execution/loading state (shows executing label and styling when disabled)
 * - "single": Single on/off indicator
 * - "sequential": Progress through levels
 * - "parallel": Multiple independent flags
 * - "level": Numeric level indicator
 */
export type IndicatorType =
  | "none"
  | "toggle"
  | "executing"
  | "single"
  | "sequential"
  | "parallel"
  | "level";

export interface IndicatorButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick"
> {
  /**
   * Button label text (base label or label when disabled)
   * For type-based indicators, this can be overridden by labelMap or showValue
   */
  label: string;

  /**
   * Type of indicator to display (optional)
   * - "single": One indicator (on/off)
   * - "sequential": Progressive indicators (level 1→2→3)
   * - "parallel": Independent indicators (filters/options)
   * - "level": Numeric count (0→max)
   * - Omit for plain button with no indicator
   */
  indicatorType?: IndicatorType;

  /**
   * Single indicator (type="single" or default when type omitted but variant/active provided)
   */
  variant?: "success" | "error" | "warning" | "info" | "neutral";
  active?: boolean;
  inactiveVariant?: "error" | "neutral";
  /**
   * Whether the indicator should pulse/animate
   */
  pulsing?: boolean;
  /**
   * Animation type for special states
   * - "processing": yellow-green cycling animation
   */
  animation?: "processing";
  /**
   * Additional className for the indicator (e.g., "opacity-50" for muted appearance)
   */
  indicatorClassName?: string;
  /**
   * Custom style for the indicator (e.g., for custom colors)
   */
  indicatorStyle?: React.CSSProperties;

  /**
   * Sequential/Parallel indicators (type="sequential" | "parallel")
   */
  value?: string | number;
  levels?: string[]; // For sequential
  options?: string[]; // For parallel
  allValue?: string; // For parallel (e.g., "all" shows all indicators active)

  /**
   * Level indicator (type="level")
   */
  max?: number;

  /**
   * Label customization
   */
  labelMap?: Record<string, string>; // Map value to display label
  showValue?: boolean; // Show current value in label (e.g., "Level 2")
  labelFormatter?: (value: string | number) => string; // Custom label formatter
  executingLabel?: string; // Label to show when executing (indicatorType="executing" and disabled=true), default "..."

  /**
   * Common indicator properties
   */
  disabled?: boolean;

  /**
   * Button variant
   */
  buttonVariant?: "ghost" | "outline" | "default";
  /**
   * Button size
   */
  buttonSize?: "xxs" | "xs" | "sm" | "md";

  /**
   * Layout customization
   */
  width?: "narrow" | "compact" | "normal" | "wide" | "fit"; // narrow=39px, compact=56px, normal=80px, wide=128px, fit=content
  justify?: "start" | "center"; // start (default) or center alignment

  /**
   * Fallback configurations (overrides type-based rendering)
   */
  multiIndicator?: MultiIndicatorConfig;
  customIndicator?: React.ReactNode;

  /**
   * Whether to hide label on small screens (default: false - always show)
   */
  hideOnSmallScreens?: boolean;
  /**
   * onClick handler
   */
  onClick?: () => void;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Button style
   */
  style?: React.CSSProperties;
  /**
   * Mouse enter handler
   */
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
  /**
   * Mouse leave handler
   */
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * Generate display label based on current value and configuration
 */
function generateLabel(props: IndicatorButtonProps): string {
  const {
    label,
    value,
    disabled,
    labelMap,
    showValue,
    labelFormatter,
    indicatorType,
    executingLabel,
  } = props;

  // Special case: executing indicator type shows executing label when disabled
  if (indicatorType === "executing" && disabled) {
    return executingLabel ?? "...";
  }

  // If disabled, always show base label
  if (disabled) {
    return label;
  }

  // If no value, return base label
  if (value === undefined) {
    return label;
  }

  // Priority 1: Custom formatter
  if (labelFormatter) {
    return labelFormatter(value);
  }

  // Priority 2: Label map
  if (labelMap) {
    const mappedLabel = labelMap[String(value)];
    if (mappedLabel !== undefined) {
      return mappedLabel;
    }
  }

  // Priority 3: Show value (e.g., "Level 2")
  if (showValue) {
    return `${label} ${value}`;
  }

  // Priority 4: For level type, show the number
  if (indicatorType === "level") {
    return `${label} ${value}`;
  }

  // Default: Base label
  return label;
}

/**
 * Generate indicators array based on indicatorType and value
 */
function generateIndicators(props: IndicatorButtonProps): boolean[] | null {
  const { indicatorType, value, levels, options, allValue, max, disabled } =
    props;

  if (disabled) {
    // For sequential/parallel, return 3 false indicators when disabled
    if (indicatorType === "sequential" || indicatorType === "parallel") {
      return [false, false, false];
    }
    if (indicatorType === "level" && max !== undefined) {
      return Array(max).fill(false);
    }
  }

  switch (indicatorType) {
    case "sequential": {
      if (!levels || value === undefined) return null;
      const index = levels.indexOf(String(value));
      if (index === -1) return null;
      // Sequential: fill from left to index (inclusive)
      return levels.map((_, i) => i <= index);
    }

    case "parallel": {
      if (!options || value === undefined) return null;
      const strValue = String(value);
      // If value matches allValue, all indicators are active
      if (allValue && strValue === allValue) {
        return options.map(() => true);
      }
      // Otherwise, only the matching option is active
      return options.map((opt) => opt === strValue);
    }

    case "level": {
      if (max === undefined || value === undefined) return null;
      const numValue = Number(value);
      // Level: fill from 0 to value (exclusive)
      return Array(max)
        .fill(false)
        .map((_, i) => i < numValue);
    }

    default:
      return null;
  }
}

/**
 * Indicator Button - Button with visual indicator(s)
 *
 * A button that displays visual indicators (LED-style) alongside a label.
 * Supports type-based indicator generation for common patterns.
 *
 * @example Single indicator
 * ```tsx
 * <IndicatorButton
 *   label="Enable"
 *   indicatorType="single"
 *   active={true}
 *   variant="success"
 * />
 * ```
 *
 * @example Sequential indicator (levels) with labelMap
 * ```tsx
 * <IndicatorButton
 *   label="Verbosity"
 *   indicatorType="sequential"
 *   value="normal"
 *   levels={["quiet", "normal", "verbose"]}
 *   labelMap={{ quiet: "Quiet", normal: "Normal", verbose: "Verbose" }}
 * />
 * ```
 *
 * @example Parallel indicator (filters) with labelMap
 * ```tsx
 * <IndicatorButton
 *   label="All"
 *   indicatorType="parallel"
 *   value="option1"
 *   options={["option1", "option2", "option3"]}
 *   allValue="all"
 *   labelMap={{ all: "All", option1: "Opt 1", option2: "Opt 2", option3: "Opt 3" }}
 * />
 * ```
 *
 * @example Plain button (no indicator)
 * ```tsx
 * <IndicatorButton
 *   label="Test"
 *   onClick={handleTest}
 * />
 * ```
 *
 * @example Narrow centered button (like Probe/Adv)
 * ```tsx
 * <IndicatorButton
 *   label="Probe"
 *   width="narrow"
 *   justify="center"
 *   onClick={handleProbe}
 * />
 * ```
 */
export const IndicatorButton = React.forwardRef<
  HTMLButtonElement,
  IndicatorButtonProps
>(
  (
    {
      label,
      indicatorType,
      variant = "success",
      active = true,
      inactiveVariant = "error",
      pulsing = false,
      animation,
      indicatorClassName,
      indicatorStyle,
      value,
      levels,
      options,
      allValue,
      max,
      labelMap,
      showValue,
      labelFormatter,
      executingLabel,
      disabled: indicatorDisabled = false,
      multiIndicator,
      buttonVariant = "ghost",
      buttonSize = "xxs",
      width = "normal",
      justify = "start",
      customIndicator,
      hideOnSmallScreens = false,
      className = "",
      style,
      ...props
    },
    ref,
  ) => {
    // Render indicator based on priority:
    // 1. indicatorType="none", "toggle", or "executing" (no separate indicator)
    // 2. customIndicator (escape hatch)
    // 3. multiIndicator (legacy/direct config)
    // 4. indicatorType-based generation
    // 5. single indicator (default if variant/active provided)
    // 6. no indicator (fallback)
    const renderIndicator = () => {
      // Priority 1: Explicit "none", "toggle", or "executing" indicator type (no separate indicator)
      if (
        indicatorType === "none" ||
        indicatorType === "toggle" ||
        indicatorType === "executing"
      ) {
        return null;
      }

      // Priority 2: Custom indicator
      if (customIndicator !== undefined) {
        return customIndicator;
      }

      // Priority 3: Direct multiIndicator config
      if (multiIndicator) {
        return (
          <MultiIndicator
            indicators={multiIndicator.indicators}
            disabled={multiIndicator.disabled}
            activeVariant={multiIndicator.activeVariant}
            inactiveVariant={multiIndicator.inactiveVariant}
            size={multiIndicator.size ?? "md"}
            gap={multiIndicator.gap}
          />
        );
      }

      // Priority 3: Type-based generation
      if (
        indicatorType === "sequential" ||
        indicatorType === "parallel" ||
        indicatorType === "level"
      ) {
        const indicators = generateIndicators({
          indicatorType,
          value,
          levels,
          options,
          allValue,
          max,
          disabled: indicatorDisabled,
        } as IndicatorButtonProps);

        if (indicators) {
          return (
            <MultiIndicator
              indicators={indicators}
              disabled={indicatorDisabled}
            />
          );
        }
      }

      // Priority 4: Single indicator (if indicatorType="single" or variant/active provided)
      if (indicatorType === "single" || variant !== undefined) {
        return (
          <Indicator
            size="md"
            shape="slit"
            variant={variant}
            active={active}
            inactiveVariant={inactiveVariant}
            pulsing={pulsing}
            animation={animation}
            className={indicatorClassName}
            style={indicatorStyle}
          />
        );
      }

      // Priority 5: No indicator
      return null;
    };

    const indicator = renderIndicator();

    // Generate display label based on current state
    const displayLabel = generateLabel({
      label,
      value,
      disabled: indicatorDisabled,
      labelMap,
      showValue,
      labelFormatter,
      indicatorType,
    } as IndicatorButtonProps);

    // Map width prop to Tailwind class
    // normal: w-20 (80px) - standard width (unchanged from original)
    // narrow: w-[39px] - exact balance: 39px + 2px + 39px = 80px
    const widthClass =
      width === "narrow"
        ? "w-[39px]"
        : width === "compact"
          ? "w-[56px]"
          : width === "wide"
            ? "w-32"
            : width === "fit"
              ? "w-fit"
              : "w-20";

    // Map justify prop to Tailwind class
    const justifyClass =
      justify === "center" ? "justify-center" : "justify-start";

    // Determine gap class based on whether indicator exists
    const gapClass = indicator ? "gap-1" : "";

    // Reduce padding on narrow buttons without indicators to fit "Probe" (5 chars)
    // narrow with no indicator: 39px - 8px (px-1 = 4px each side) = 31px text space ✓
    // Otherwise, let Button size control padding (xxs=px-1.5, xs=px-2, sm=px-3)
    const paddingClass = width === "narrow" && !indicator ? "px-1" : "";

    // Map indicatorType to Button props
    const isToggleButton = indicatorType === "toggle";
    const isExecutingButton = indicatorType === "executing";

    return (
      <Button
        ref={ref}
        variant={buttonVariant}
        size={buttonSize}
        pressed={isToggleButton ? active : undefined}
        executing={isExecutingButton ? indicatorDisabled : undefined}
        executingLabel={isExecutingButton ? executingLabel : undefined}
        disabled={indicatorDisabled}
        className={`flex items-center ${justifyClass} ${gapClass} ${paddingClass} ${widthClass} rounded transition-colors duration-150 ${className}`}
        style={style}
        {...props}
      >
        {indicator}
        {/* Only show label span for non-executing buttons (Button handles executing label) */}
        {!isExecutingButton && (
          <span
            className={
              hideOnSmallScreens
                ? "hidden sm:inline leading-none text-chrome"
                : "leading-none text-chrome"
            }
            style={{
              fontSize: "inherit",
              lineHeight: "inherit",
              whiteSpace: "nowrap",
              ...(isToggleButton && active
                ? { color: "inherit" }
                : style?.color != null
                  ? { color: style.color as string }
                  : {}),
            }}
          >
            {displayLabel}
          </span>
        )}
        {/* For executing buttons, show label without special styling (Button applies executingClass) */}
        {isExecutingButton && (
          <span
            className={
              hideOnSmallScreens
                ? "hidden sm:inline leading-none"
                : "leading-none"
            }
            style={{
              fontSize: "inherit",
              lineHeight: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {displayLabel}
          </span>
        )}
      </Button>
    );
  },
);

IndicatorButton.displayName = "IndicatorButton";
