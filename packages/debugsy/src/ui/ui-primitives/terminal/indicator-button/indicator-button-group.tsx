"use client";

import React from "react";
import { IndicatorButton, IndicatorButtonProps } from "./indicator-button";

export interface IndicatorButtonTheme {
  /**
   * Font size for all buttons
   */
  fontSize?: string;
  /**
   * Line height for all buttons
   */
  lineHeight?: string;
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Hover background color
   */
  hoverBackgroundColor?: string;
  /**
   * Active background color
   */
  activeBackgroundColor?: string;
  /**
   * Text color
   */
  color?: string;
  /**
   * Additional styles to apply
   */
  style?: React.CSSProperties;
}

/**
 * Row break marker - insert this into buttons array to start a new row
 */
export interface IndicatorButtonRowBreak {
  type: "row-break";
  key?: string;
}

export type IndicatorButtonGroupItem =
  | (IndicatorButtonProps & { key?: string })
  | IndicatorButtonRowBreak;

export interface IndicatorButtonGroupProps {
  /**
   * Array of indicator buttons and row breaks to display
   * Use { type: "row-break" } to start a new row
   */
  buttons: Array<IndicatorButtonGroupItem>;
  /**
   * Layout orientation
   */
  orientation?: "horizontal" | "vertical" | "grid";
  /**
   * Number of rows for grid layout (auto-calculates columns)
   */
  gridRows?: number;
  /**
   * Gap between buttons
   */
  gap?: string;
  /**
   * Enable flex wrap for horizontal/vertical layouts (default: false)
   */
  wrap?: boolean;
  /**
   * Justify content for flex layouts (default: flex-start)
   */
  justify?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around";
  /**
   * Align items for flex layouts (default: center)
   */
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  /**
   * Theme configuration for all buttons
   */
  theme?: IndicatorButtonTheme;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Indicator Button Group - Layout for multiple indicator buttons
 *
 * Displays multiple indicator buttons in a configurable layout.
 * Supports horizontal rows, vertical columns, or grid layout.
 *
 * @example Basic usage
 * ```tsx
 * <IndicatorButtonGroup
 *   buttons={[
 *     { label: "Point A", variant: "success", active: true },
 *     { label: "Point B", variant: "error", active: false },
 *   ]}
 *   orientation="grid"
 *   gridRows={2}
 * />
 * ```
 *
 * @example With row breaks and mixed indicator types
 * ```tsx
 * <IndicatorButtonGroup
 *   buttons={[
 *     { label: "Deps", indicatorType: "single", variant: "success" },
 *     { label: "Quiet", indicatorType: "sequential", value: "normal" },
 *     { type: "row-break" },
 *     { label: "Filter", indicatorType: "parallel", value: "all" },
 *     { label: "Probe", indicatorType: "executing", disabled: isLoading, width: "narrow" },
 *     { label: "Adv.", indicatorType: "toggle", active: true, width: "narrow" },
 *   ]}
 * />
 * ```
 */
export const IndicatorButtonGroup: React.FC<IndicatorButtonGroupProps> = ({
  buttons,
  orientation = "horizontal",
  gridRows = 2,
  gap = "0.5",
  wrap = false,
  justify = "flex-start",
  align = "center",
  theme,
  className = "",
}) => {
  // Helper to check if item is a row break
  const isRowBreak = (
    item: IndicatorButtonGroupItem
  ): item is IndicatorButtonRowBreak => {
    return "type" in item && item.type === "row-break";
  };

  // Apply theme to button props
  const applyTheme = (
    button: IndicatorButtonProps & { key?: string }
  ): IndicatorButtonProps & { key?: string } => {
    if (!theme) return button;

    // Determine if button is active (for toggle buttons)
    const isActive = button.active ?? false;
    void isActive; // reserved for future active styling
    const isToggle = button.indicatorType === "toggle";

    // For toggle buttons, don't apply backgroundColor via theme
    // Let the Button component handle pressed state via CSS variables
    const shouldApplyBg = !isToggle;

    const themedStyle = {
      ...theme.style,
      // Only apply backgroundColor for non-toggle buttons
      ...(shouldApplyBg &&
        theme.backgroundColor && {
          backgroundColor: theme.backgroundColor,
        }),
      ...(theme.color && { color: theme.color }),
      ...button.style,
    };

    const themedHandlers: Partial<IndicatorButtonProps> = {};

    // Apply hover effect if theme has hoverBackgroundColor
    // For toggle buttons, don't override - let Button handle it
    if (theme.hoverBackgroundColor && !isToggle) {
      const originalOnMouseEnter = button.onMouseEnter;
      const originalOnMouseLeave = button.onMouseLeave;

      themedHandlers.onMouseEnter = (e) => {
        e.currentTarget.style.backgroundColor = theme.hoverBackgroundColor!;
        originalOnMouseEnter?.(e);
      };

      themedHandlers.onMouseLeave = (e) => {
        e.currentTarget.style.backgroundColor =
          theme.backgroundColor ?? "rgb(var(--color-chrome-bg))";
        originalOnMouseLeave?.(e);
      };
    }

    return {
      ...button,
      ...themedHandlers,
      style: themedStyle,
    };
  };

  // Split buttons into rows based on row-break markers
  const buttonRows: Array<Array<IndicatorButtonGroupItem>> = [];
  let currentRow: Array<IndicatorButtonGroupItem> = [];

  buttons.forEach((item) => {
    if (isRowBreak(item)) {
      if (currentRow.length > 0) {
        buttonRows.push(currentRow);
        currentRow = [];
      }
    } else {
      currentRow.push(item);
    }
  });

  // Push last row if it has buttons
  if (currentRow.length > 0) {
    buttonRows.push(currentRow);
  }

  // Render a single button item
  const renderButton = (item: IndicatorButtonGroupItem, index: string) => {
    if (isRowBreak(item)) return null;

    const themedButton = applyTheme(
      item as IndicatorButtonProps & { key?: string }
    );
    return (
      <IndicatorButton key={themedButton.key ?? index} {...themedButton} />
    );
  };

  // If row breaks were used, render as multi-row layout
  if (buttonRows.length > 1) {
    return (
      <div
        className={`flex flex-col shrink-0 ${className}`}
        style={{ gap: "0px" }}
      >
        {buttonRows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex items-center overflow-x-auto h-[20px]"
            style={{ gap: `${gap}` }}
          >
            {row.map((item, btnIndex) =>
              renderButton(item, `${rowIndex}-${btnIndex}`)
            )}
          </div>
        ))}
      </div>
    );
  }

  // Apply theme to all buttons (fallback for non-row-break mode)
  const themedButtons = buttons
    .filter((item) => !isRowBreak(item))
    .map((item) => applyTheme(item as IndicatorButtonProps & { key?: string }));

  // Grid layout with auto-calculated rows
  if (orientation === "grid" && gridRows > 1) {
    const buttonsPerRow = Math.ceil(themedButtons.length / gridRows);
    const rows: Array<Array<IndicatorButtonProps & { key?: string }>> = [];

    for (let i = 0; i < gridRows; i++) {
      const start = i * buttonsPerRow;
      const end = start + buttonsPerRow;
      rows.push(themedButtons.slice(start, end));
    }

    return (
      <div
        className={`flex flex-col shrink-0 ${className}`}
        style={{ gap: "0px" }}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            className="flex items-center overflow-x-auto h-[20px]"
            style={{ gap: `${gap}` }}
          >
            {row.map((button, btnIndex) => {
              const { key, ...buttonProps } = button;
              return (
                <IndicatorButton
                  key={key ?? `${rowIndex}-${btnIndex}`}
                  {...buttonProps}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  // Horizontal or vertical layout with flex controls
  const flexDirection = orientation === "vertical" ? "column" : "row";
  const flexWrap = wrap ? "wrap" : "nowrap";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection,
        flexWrap,
        gap: `${gap}`,
        justifyContent: justify,
        alignItems: align,
      }}
    >
      {themedButtons.map((button, index) => {
        const { key, ...buttonProps } = button;
        return <IndicatorButton key={key ?? index} {...buttonProps} />;
      })}
    </div>
  );
};

IndicatorButtonGroup.displayName = "IndicatorButtonGroup";
