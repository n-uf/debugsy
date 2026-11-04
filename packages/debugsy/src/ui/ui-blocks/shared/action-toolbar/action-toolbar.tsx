"use client";

import React from "react";
import { Z_INDEX } from "../../../tokens/z-index";
import { cn } from "../../../utils/cn";

export interface ActionButton {
  /**
   * Button icon (emoji or text)
   */
  icon: string;
  /**
   * Button title (tooltip)
   */
  title: string;
  /**
   * Click handler
   */
  onClick: () => void;
  /**
   * Whether button is disabled
   */
  disabled?: boolean;
  /**
   * Button variant for predefined styles
   */
  variant?: "default" | "paused" | "active" | "copying" | "danger" | "success";
  /**
   * Additional className for customization
   */
  className?: string;
  /**
   * Custom styles (use sparingly, prefer className)
   */
  style?: React.CSSProperties;
}

export interface DepthControl<T extends string = string> {
  /**
   * Current depth setting
   */
  value: T;
  /**
   * Available depth options (cycling order)
   */
  options: T[];
  /**
   * Change handler
   */
  onChange: (value: T) => void;
  /**
   * Description getter
   */
  getDescription: (value: T) => string;
  /**
   * Color getter
   */
  getColor: (value: T) => string;
  /**
   * Width getter (percentage)
   */
  getWidth: (value: T) => string;
}

export interface ProgressControl<T extends number = number> {
  /**
   * Progress state (0-2 typically)
   */
  value: T;
  /**
   * Icon getter
   */
  getIcon: (state: T) => string;
  /**
   * Progress width getter (percentage)
   */
  getWidth: (state: T) => string;
  /**
   * Progress color getter
   */
  getColor: (state: T) => string;
}

export interface ActionToolbarProps<
  TDepth extends string = string,
  TProgress extends number = number,
> {
  /**
   * Action buttons to display
   */
  actions: ActionButton[];
  /**
   * Optional depth control
   */
  depthControl?: DepthControl<TDepth>;
  /**
   * Optional progress control (for first button)
   */
  progressControl?: ProgressControl<TProgress>;
  /**
   * Toolbar width
   */
  width?: string;
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Button mouse enter handler
   */
  onButtonMouseEnter?: (message: string) => void;
  /**
   * Button mouse leave handler
   */
  onButtonMouseLeave?: () => void;
}

/**
 * Action Toolbar - Vertical sidebar with action buttons and controls
 *
 * A compact vertical toolbar for displaying action buttons with optional
 * depth control slider and progress indicators.
 *
 * Extracted from showcase actions-panel.tsx pattern.
 *
 * @example
 * ```tsx
 * <ActionToolbar
 *   actions={[
 *     { icon: "📋", title: "Copy", onClick: handleCopy },
 *     { icon: "⏸️", title: "Pause", onClick: handlePause },
 *   ]}
 *   depthControl={{
 *     value: "all",
 *     options: ["str", "1", "3", "5", "10", "all"],
 *     onChange: setDepth,
 *     getDescription: (v) => `Depth: ${v}`,
 *     getColor: (v) => "#10b981",
 *     getWidth: (v) => "100%",
 *   }}
 * />
 * ```
 */
export const ActionToolbar = <
  TDepth extends string = string,
  TProgress extends number = number,
>({
  actions,
  depthControl,
  progressControl,
  width = "32px",
  backgroundColor = "#ffffff08",
  onButtonMouseEnter,
  onButtonMouseLeave,
}: ActionToolbarProps<TDepth, TProgress>) => {
  const handleDepthClick = () => {
    if (!depthControl) return;
    const currentIndex = depthControl.options.indexOf(depthControl.value);
    const nextIndex = (currentIndex + 1) % depthControl.options.length;
    const nextValue = depthControl.options[nextIndex];
    if (nextValue) {
      depthControl.onChange(nextValue);
    }
  };

  return (
    <div
      style={{
        width,
        // Use CSS variable with fallback to provided backgroundColor
        backgroundColor: backgroundColor !== "#ffffff08" ? backgroundColor : "rgb(var(--color-bg-tertiary) / 0.5)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "4px 2px",
        gap: "4px",
        flexShrink: 0,
      }}
    >
      {/* Depth Control */}
      {depthControl && (
        <div
          onClick={handleDepthClick}
          style={{
            width: "24px",
            height: "8px",
            backgroundColor: "rgb(var(--color-bg-tertiary))",
            border: "1px solid rgb(var(--color-border-primary))",
            borderRadius: "4px",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition: "all 0.2s ease",
            marginTop: "2px",
            marginBottom: "2px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scaleY(1.5)";
            (e.currentTarget as HTMLDivElement).style.height = "10px";
            onButtonMouseEnter?.(
              depthControl.getDescription(depthControl.value)
            );
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scaleY(1)";
            (e.currentTarget as HTMLDivElement).style.height = "8px";
            onButtonMouseLeave?.();
          }}
          title={`${depthControl.getDescription(depthControl.value)} (click to cycle)`}
        >
          {/* Progress Fill (or Border for "str" mode) */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              height: "100%",
              backgroundColor:
                depthControl.value === "str"
                  ? "transparent"
                  : depthControl.getColor(depthControl.value),
              width: depthControl.getWidth(depthControl.value),
              borderRadius: "3px",
              transition: "all 0.2s ease",
              // String mode uses border instead of fill
              border:
                depthControl.value === "str"
                  ? `1px solid ${depthControl.getColor(depthControl.value)}`
                  : "none",
              // Add box shadow for filled modes (not string mode)
              boxShadow:
                depthControl.value !== "str"
                  ? `0 0 4px ${depthControl.getColor(depthControl.value)}40`
                  : "none",
            }}
          />

          {/* Depth Indicator Text */}
          {depthControl.value !== "all" && depthControl.value !== "str" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "6px",
                fontWeight: "bold",
                color: "#ffffff",
                textShadow: "0 0 2px rgba(0,0,0,0.8)",
                fontFamily: "monospace",
                zIndex: Z_INDEX.DEBUG_ACTIONS + 1,
              }}
            >
              {depthControl.value}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {actions.map((action, index) => {
        const isFirst = index === 0;
        const hasProgress = isFirst && progressControl;
        const variant = action.variant ?? "default";

        // Variant styles (className - only for hover effects and cursor)
        const variantClasses = {
          default: {
            base: "",
            hover: "hover:shadow-[0_2px_4px_rgba(0,0,0,0.4)]",
            disabled: "cursor-not-allowed",
          },
          paused: {
            base: "",
            hover: "hover:shadow-[0_2px_8px_rgba(251,191,36,0.8)]",
            disabled: "cursor-not-allowed",
          },
          active: {
            base: "",
            hover: "hover:shadow-md",
            disabled: "cursor-not-allowed",
          },
          copying: {
            base: "",
            hover: "hover:shadow-[0_2px_8px_rgba(59,130,246,0.8)]",
            disabled: "cursor-not-allowed",
          },
          danger: {
            base: "",
            hover: "hover:shadow-md",
            disabled: "cursor-not-allowed",
          },
          success: {
            base: "",
            hover: "hover:shadow-[0_2px_4px_rgba(0,0,0,0.4)]",
            disabled: "cursor-not-allowed",
          },
        }[variant];

        // Variant inline styles (using CSS variables for theme consistency)
        const variantInlineStyles = {
          default: {
            backgroundColor: "rgb(var(--color-bg-tertiary))",
            color: "rgb(var(--color-text-secondary))",
            opacity: action.disabled ? 0.4 : 0.9,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          },
          paused: {
            backgroundColor: "rgb(var(--color-warning))",
            color: "rgb(var(--color-text-inverse))",
            border: "2px solid rgb(var(--color-warning))",
            opacity: action.disabled ? 0.4 : 0.9,
            boxShadow: "0 0 6px rgb(var(--color-warning) / 0.6)",
          },
          active: {
            backgroundColor: "rgb(var(--color-info) / 0.5)",
            color: "rgb(var(--color-text-primary))",
            opacity: action.disabled ? 0.4 : 0.9,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.25)",
          },
          copying: {
            backgroundColor: "rgb(var(--color-info) / 0.35)",
            color: "rgb(var(--color-text-primary))",
            border: "1px solid rgb(var(--color-info) / 0.5)",
            opacity: action.disabled ? 0.4 : 0.9,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
          },
          danger: {
            backgroundColor: "rgb(var(--color-error))",
            color: "#ffffff",
            opacity: action.disabled ? 0.4 : 0.9,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
          },
          success: {
            backgroundColor: "rgb(var(--color-bg-tertiary))",
            color: "rgb(var(--color-success))",
            opacity: action.disabled ? 0.4 : 0.9,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          },
        }[variant];

        return (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={cn(
              "w-6 h-6 rounded flex items-center justify-center text-xs relative overflow-hidden transition-all duration-200",
              "hover:scale-105 active:scale-95",
              variantClasses.base,
              !action.disabled && variantClasses.hover,
              action.disabled && variantClasses.disabled,
              action.className
            )}
            style={{ ...variantInlineStyles, ...action.style }}
            onMouseEnter={() => {
              if (!action.disabled) {
                onButtonMouseEnter?.(action.title);
              }
            }}
            onMouseLeave={() => {
              onButtonMouseLeave?.();
            }}
            title={action.title}
          >
            {/* Progress Bar (only for first button if progressControl exists) */}
            {hasProgress && (
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  width: "100%",
                  height: "2px",
                  backgroundColor: "rgb(var(--color-bg-tertiary))",
                  borderRadius: "0 0 3px 3px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    width: progressControl.getWidth(progressControl.value),
                    height: "100%",
                    backgroundColor: progressControl.getColor(
                      progressControl.value
                    ),
                    borderRadius: "0 0 3px 3px",
                    transition: "all 0.3s ease",
                    boxShadow: `0 0 3px ${progressControl.getColor(progressControl.value)}40`,
                  }}
                />
              </div>
            )}

            {/* Button Icon */}
            <span style={{ zIndex: Z_INDEX.DEBUG_ACTIONS }}>
              {hasProgress
                ? progressControl.getIcon(progressControl.value)
                : action.icon}
            </span>
          </button>
        );
      })}

      {/* Bottom Separator */}
      <div
        style={{
          width: "16px",
          height: "1px",
          backgroundColor: "rgb(var(--color-border-primary))",
          marginTop: "auto",
          marginBottom: "2px",
          opacity: 0.6,
        }}
      />
    </div>
  );
};

ActionToolbar.displayName = "ActionToolbar";
