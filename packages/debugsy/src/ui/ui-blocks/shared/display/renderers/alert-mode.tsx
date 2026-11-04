"use client";

/**
 * Alert Mode Renderer
 *
 * Renders a display alert (error with recovery) as two lines inside the
 * fixed-height panel: title (uppercase mono) and subtitle, both (and the
 * icon) in the full-strength alert colour, no dimming. Text over the
 * character budget scales down and then wraps; it is never cut off with an
 * ellipsis.
 */

import React from "react";
import {
  DISPLAY_ALERT_LINE_BUDGET,
  type DisplayAlert,
} from "../../../../patterns/display-system/display-alert";
import { DISPLAY_ALERT_COLORS, fitAlertFontSize } from "../display-helpers";
import { AlertWarningIcon } from "./alert-icons";

export interface AlertModeProps {
  /** Alert to render */
  alert: DisplayAlert;
  /** Right padding that clears the action slots */
  rightPadding: string;
}

const TITLE_FONT = { base: 10, min: 7 };
const SUBTITLE_FONT = { base: 9, min: 7 };

const lineStyle: React.CSSProperties = {
  display: "block",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  fontFamily: "monospace",
  lineHeight: 1.15,
};

/**
 * AlertMode - two-line alert renderer.
 *
 * Carries `role="alert"`: mount it once per alert occurrence (keyed by
 * `alert.key`) so screen readers announce it once, not on every update.
 */
export const AlertMode: React.FC<AlertModeProps> = ({ alert, rightPadding }) => {
  const color = DISPLAY_ALERT_COLORS[alert.severity ?? "error"];
  const title = alert.title.toUpperCase();
  const subtitle = alert.subtitle;

  return (
    <div
      data-display-mode="alert"
      data-severity={alert.severity ?? "error"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        height: "100%",
        padding: "0 8px 0 10px",
        paddingRight: rightPadding,
        color,
        minWidth: 0,
      }}
    >
      <span
        data-alert-icon=""
        style={{ flexShrink: 0, display: "flex", alignItems: "center", color }}
        aria-hidden="true"
      >
        {alert.icon ?? <AlertWarningIcon />}
      </span>
      <div role="alert" style={{ flex: 1, minWidth: 0 }}>
        <span
          data-alert-line="title"
          title={alert.title}
          style={{
            ...lineStyle,
            color,
            fontWeight: 700,
            letterSpacing: "0.02em",
            fontSize: `${fitAlertFontSize(title, DISPLAY_ALERT_LINE_BUDGET, TITLE_FONT.base, TITLE_FONT.min)}px`,
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span
            data-alert-line="subtitle"
            title={subtitle}
            style={{
              ...lineStyle,
              color,
              marginTop: "2px",
              fontSize: `${fitAlertFontSize(subtitle, DISPLAY_ALERT_LINE_BUDGET, SUBTITLE_FONT.base, SUBTITLE_FONT.min)}px`,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

AlertMode.displayName = "AlertMode";
