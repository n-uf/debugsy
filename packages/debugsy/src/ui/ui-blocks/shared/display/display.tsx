"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import type { DisplayContent } from "../../../patterns/display-system/display-state";
import {
  hasDisplayAlertDetail,
  selectActiveAlert,
  type DisplayAlert,
} from "../../../patterns/display-system/display-alert";
import type { DisplayQueueItem } from "../../../patterns/display-system/display-queue-state";
import { DISPLAY_ALERT_COLORS, DISPLAY_ALERT_SLOT_COLORS } from "./display-helpers";
import type { DisplayAlertBannerConfig } from "./alert-banner-config";
import { AlertDetailPanel } from "./renderers/alert-detail-panel";
import { AlertMode } from "./renderers/alert-mode";
import { EmptyState } from "./renderers/empty-state";
import { EntriesMode, type DisplayEntry } from "./renderers/entries-mode";
import { QueueMode } from "./renderers/queue-mode";
import { SingleMode } from "./renderers/single-mode";
import {
  AlertDetailsIcon,
  AlertDismissIcon,
  AlertRetryIcon,
} from "./renderers/alert-icons";

// Re-export types from renderers
export type { DisplayEntry };

export interface DisplayAction {
  /** Action icon — emoji string or React node (e.g. inline SVG) */
  icon: React.ReactNode;
  /** Action handler */
  onClick: () => void;
  /** Tooltip text (also the accessible name unless `ariaLabel` is set) */
  title?: string;
  /** Accessible name; defaults to `title` */
  ariaLabel?: string;
  /** Background color */
  backgroundColor?: string;
  /** Hover background color */
  hoverBackgroundColor?: string;
  /** Text/icon color */
  color?: string;
}

export interface DisplayProps {
  /** Queue items for multi-row display (NEW - highest priority) */
  queueItems?: DisplayQueueItem[];
  /** Memorized items (not visible but kept in memory) */
  memorizedItems?: DisplayQueueItem[];
  /** Maximum rows to display from queue (default: 3) */
  maxRows?: number;
  /** Row height in pixels (default: 48) - DEPRECATED for queue mode, use height instead */
  rowHeight?: number;
  /** Show processing time for queue items? (default: false) */
  showProcessingTime?: boolean;
  /** Animate progress bars with pulse effect (non-standard, cool, default: false) - FOR LEGACY SINGLE MODE ONLY */
  animateProgress?: boolean;

  /** List of entries to display */
  entries?: DisplayEntry[];
  /** Single content to display (overrides entries) */
  content?: DisplayContent | null;
  /** Tooltip content (overrides entries, lower priority than content) */
  tooltipContent?: string | null;
  /** Timestamp for tooltip */
  tooltipTimestamp?: number;
  /** Action buttons (right side) */
  actions?: DisplayAction[];
  /** Maximum entries to show */
  maxEntries?: number;
  /** Height of the display */
  height?: string;
  /** Background color */
  backgroundColor?: string;
  /** Border color */
  borderColor?: string;
  /** Hover border color */
  hoverBorderColor?: string;
  /** Custom empty state message (when no entries and no content) */
  emptyMessage?: string;
  /**
   * Alert detail banner: dock, layout breakpoints and labels. Overrides a
   * surrounding `DisplayAlertBannerProvider`.
   */
  alertBanner?: DisplayAlertBannerConfig;
}

/**
 * Display - Message panel for showing notifications, toasts, or entry lists
 *
 * Generic display component that can show:
 * - Multi-row queue items (via `queueItems` prop) - NEW, with inline progress bars
 * - Single toast message (via `content` prop) - progress bar below
 * - Tooltip message (via `tooltipContent`)
 * - List of entries (via `entries`)
 *
 * Rendering Priority: alert > queueItems > content > tooltipContent > entries > empty
 *
 * Alert Mode (error with recovery):
 * - Triggered by a visible queue item with an `alert` payload (ERROR priority)
 * - Two lines (title / subtitle) in the alert colour, scaled to fit, never truncated
 * - The `actions` slots are replaced by the alert's recovery actions,
 *   plus built-in Details (opens a detail panel above the display) and
 *   Dismiss slots
 * - Removing the item restores the normal content and slots
 *
 * Queue Mode Behavior:
 * - Fixed container height (never changes)
 * - Compact rendering: height / itemCount per row
 * - Inline progress bars (space-efficient)
 * - Font: 8px, Padding: 2px 8px (tight)
 *
 * Single Mode Behavior:
 * - Comfortable rendering (no space constraints)
 * - Progress bar below message (spacious)
 * - Font: 10px, Padding: 0 12px (normal)
 *
 * Usage:
 * ```tsx
 * // Queue mode (compact multi-row with inline bars)
 * <Display queueItems={displayQueue} maxRows={3} height="48px" />
 * // Result: 3 items fit in 48px (16px each)
 *
 * // Single mode (comfortable with bar below)
 * <Display content={{ message: "Success!", type: "success" }} />
 *
 * // Entries mode
 * <Display entries={[...]} actions={[...]} />
 * ```
 */
export const Display: React.FC<DisplayProps> = ({
  alertBanner,
  queueItems = [],
  memorizedItems = [],
  maxRows = 3,
  rowHeight: _rowHeight = 48,
  showProcessingTime = false,
  animateProgress = false,
  entries = [],
  content,
  tooltipContent,
  tooltipTimestamp,
  actions = [],
  maxEntries = 3,
  height = "48px",
  backgroundColor = "#000000e6",
  borderColor = "#4b5563",
  hoverBorderColor = "#10b981",
  emptyMessage = "No entries yet.",
}) => {
  void _rowHeight; // reserved for row height in list mode
  // Determine rendering mode (priority: queueItems > content > tooltipContent > entries)
  const hasQueueItems = queueItems.length > 0;

  // Take top maxRows items (already sorted by priority)
  const visibleQueueItems = queueItems.slice(0, maxRows);

  // FIXED HEIGHT: Container never changes size
  // Queue mode: Compact rendering within base height
  // Single mode: Comfortable rendering with base height
  const displayHeight = height; // Always use base height (48px)

  // Calculate compact row height for queue mode
  const compactRowHeight = hasQueueItems
    ? parseFloat(height) / Math.min(visibleQueueItems.length, maxRows)
    : parseFloat(height);

  const contentToShow = hasQueueItems
    ? null
    : (content ??
      (tooltipContent
        ? {
            message: tooltipContent,
            type: "info" as const,
            timestamp: tooltipTimestamp ?? Date.now(),
          }
        : null));

  // Show only the most recent entries
  const recentEntries = entries.slice(-maxEntries).reverse();

  // Alert mode: an alert item takes over the panel and its action slots
  const alertItem = selectActiveAlert(queueItems);
  const alert = alertItem?.alert;
  const alertKey = alert ? `${alertItem.id}:${alert.key}` : null;

  const panelRef = useRef<HTMLDivElement>(null);
  const detailsButtonRef = useRef<HTMLButtonElement | null>(null);
  const detailsId = useId();
  const [detailsOpenFor, setDetailsOpenFor] = useState<string | null>(null);
  const detailsOpen = alertKey !== null && detailsOpenFor === alertKey;

  // Focus: when an alert goes away while focus was on one of its slots
  // (Retry / Dismiss), move focus to the restored slots instead of <body>.
  const focusWithinRef = useRef(false);
  const prevAlertKeyRef = useRef<string | null>(alertKey);
  useEffect(() => {
    const prev = prevAlertKeyRef.current;
    prevAlertKeyRef.current = alertKey;
    if (prev === null || prev === alertKey || !focusWithinRef.current) return;
    const active = typeof document !== "undefined" ? document.activeElement : null;
    if (active && active !== document.body && panelRef.current?.contains(active)) return;
    const target =
      panelRef.current?.querySelector<HTMLElement>("button") ?? panelRef.current;
    target?.focus();
  }, [alertKey]);

  const slots: SlotDescriptor[] = alert
    ? buildAlertSlots(alert, {
        detailsOpen,
        detailsId,
        detailsButtonRef,
        toggleDetails: () =>
          setDetailsOpenFor((open) => (open === alertKey ? null : alertKey)),
      })
    : actions.map((action, index) => ({
        key: String(index),
        icon: action.icon,
        onClick: action.onClick,
        title: action.title,
        ariaLabel: action.ariaLabel ?? action.title,
        backgroundColor: action.backgroundColor ?? "#ffffff",
        hoverBackgroundColor: action.hoverBackgroundColor ?? "#e5e7eb",
        color: action.color ?? "#4b5563",
      }));

  // Calculate padding based on number of action slots
  const rightPadding =
    slots.length > 0 ? `${12 + slots.length * 28}px` : "12px";
  const alertColor = alert ? DISPLAY_ALERT_COLORS[alert.severity ?? "error"] : null;
  const panelBorderColor = alertColor ?? borderColor;

  return (
    <div
      className="flex-1 min-w-0"
      onFocusCapture={() => {
        focusWithinRef.current = true;
      }}
      onBlurCapture={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && e.currentTarget.contains(next)) return;
        focusWithinRef.current = false;
      }}
    >
      {/* Keyframe animations for progress bars */}
      <style>{`
        @keyframes slideProgress {
          0% {
            left: -30%;
          }
          50% {
            left: 50%;
          }
          100% {
            left: 100%;
          }
        }
        
        @keyframes progressPulse {
          0% {
            opacity: 1;
            box-shadow: 0 0 2px currentColor;
          }
          50% {
            opacity: 0.7;
            box-shadow: 0 0 8px currentColor;
          }
          100% {
            opacity: 1;
            box-shadow: 0 0 2px currentColor;
          }
        }
        
        /* Custom scrollbar for queue items */
        .harbuz-display-scrollable::-webkit-scrollbar {
          width: 4px;
        }
        
        .harbuz-display-scrollable::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .harbuz-display-scrollable::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 2px;
        }
        
        .harbuz-display-scrollable::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <div
        ref={panelRef}
        tabIndex={-1}
        data-display-state={alert ? "alert" : undefined}
        style={{
          outline: "none",
          height: displayHeight,
          backgroundColor,
          border: `${alert ? 2 : 1}px solid ${panelBorderColor}`,
          borderRadius: "6px",
          position: "relative",
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = alertColor ?? hoverBorderColor;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = panelBorderColor;
        }}
      >
        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: hasQueueItems && !alert ? "stretch" : "center",
            flexDirection: hasQueueItems && !alert ? "column" : "row",
            padding: hasQueueItems ? "0" : "0 12px",
            paddingRight: hasQueueItems ? "0" : rightPadding,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Render based on priority */}
          {alert && alertKey ? (
            <AlertMode key={alertKey} alert={alert} rightPadding={rightPadding} />
          ) : hasQueueItems ? (
            <QueueMode
              queueItems={queueItems}
              visibleQueueItems={visibleQueueItems}
              rowHeight={compactRowHeight}
              rightPadding={rightPadding}
              showProcessingTime={showProcessingTime}
              maxRows={maxRows}
            />
          ) : contentToShow ? (
            <SingleMode content={contentToShow} animateProgress={animateProgress} />
          ) : recentEntries.length === 0 ? (
            <EmptyState message={emptyMessage} />
          ) : (
            <EntriesMode entries={recentEntries} />
          )}
        </div>

        {/* Action slots (standard actions, or the alert's recovery actions) */}
        {slots.map((slot, index) => (
          <button
            key={slot.key}
            ref={slot.buttonRef}
            type="button"
            onClick={slot.onClick}
            aria-label={slot.ariaLabel}
            aria-expanded={slot.ariaExpanded}
            aria-controls={slot.ariaControls}
            aria-haspopup={slot.ariaHasPopup}
            data-slot={slot.kind}
            style={{
              position: "absolute",
              top: "12px",
              right: `${12 + (slots.length - 1 - index) * 28}px`,
              backgroundColor: slot.backgroundColor,
              color: slot.color,
              border: "none",
              borderRadius: "3px",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 1000,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = slot.hoverBackgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = slot.backgroundColor;
            }}
            title={slot.title}
          >
            {slot.icon}
          </button>
        ))}

        {/* Memorized Items Indicator */}
        {!alert && memorizedItems.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              right: "0",
              height: "14px",
              background: "linear-gradient(to top, #1f2937, #1f293780)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "8px",
              color: "#9ca3af",
              fontFamily: "monospace",
              borderTop: "1px solid #374151",
              cursor: "help",
            }}
            title={`${memorizedItems.length} item${memorizedItems.length === 1 ? "" : "s"} memorized (interrupted by higher priority)`}
          >
            ⚡ {memorizedItems.length} memorized
          </div>
        )}
      </div>

      {/* Detail panel: portalled above the display, so the footer never shifts */}
      {alert && detailsOpen && (
        <AlertDetailPanel
          alert={alert}
          id={detailsId}
          anchorRef={panelRef}
          returnFocusRef={detailsButtonRef}
          onClose={() => setDetailsOpenFor(null)}
          config={alertBanner}
        />
      )}
    </div>
  );
};

Display.displayName = "Display";

// =============================================================================
// SLOTS
// =============================================================================

interface SlotDescriptor {
  key: string;
  kind?: string;
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaHasPopup?: "dialog";
  buttonRef?: React.Ref<HTMLButtonElement>;
  backgroundColor: string;
  hoverBackgroundColor: string;
  color: string;
}

const ALERT_KIND_ICONS = {
  retry: <AlertRetryIcon />,
  details: <AlertDetailsIcon />,
  dismiss: <AlertDismissIcon />,
  custom: null,
} as const;

/**
 * Alert slots: the alert's own actions, then built-in Details (when there is
 * detail) and Dismiss (unless `dismissible: false`).
 */
function buildAlertSlots(
  alert: DisplayAlert,
  options: {
    detailsOpen: boolean;
    detailsId: string;
    detailsButtonRef: React.RefObject<HTMLButtonElement | null>;
    toggleDetails: () => void;
  },
): SlotDescriptor[] {
  const slots: SlotDescriptor[] = (alert.actions ?? []).map((action) => {
    const kind = action.kind ?? "custom";
    const palette = DISPLAY_ALERT_SLOT_COLORS[kind];
    return {
      key: `action:${action.id}`,
      kind,
      icon: action.icon ?? ALERT_KIND_ICONS[kind],
      onClick: action.onSelect,
      title: action.label,
      ariaLabel: action.label,
      backgroundColor: action.backgroundColor ?? palette.bg,
      hoverBackgroundColor: action.hoverBackgroundColor ?? palette.hover,
      color: action.color ?? palette.color,
    };
  });

  if (hasDisplayAlertDetail(alert.detail)) {
    const palette = DISPLAY_ALERT_SLOT_COLORS.details;
    slots.push({
      key: "builtin:details",
      kind: "details",
      icon: ALERT_KIND_ICONS.details,
      onClick: options.toggleDetails,
      title: "Details",
      ariaLabel: "Error details",
      ariaExpanded: options.detailsOpen,
      ariaControls: options.detailsOpen ? options.detailsId : undefined,
      ariaHasPopup: "dialog",
      buttonRef: options.detailsButtonRef,
      backgroundColor: palette.bg,
      hoverBackgroundColor: palette.hover,
      color: palette.color,
    });
  }

  if (alert.dismissible !== false) {
    const palette = DISPLAY_ALERT_SLOT_COLORS.dismiss;
    slots.push({
      key: "builtin:dismiss",
      kind: "dismiss",
      icon: ALERT_KIND_ICONS.dismiss,
      onClick: () => alert.onDismiss?.(),
      title: "Dismiss",
      ariaLabel: "Dismiss error",
      backgroundColor: palette.bg,
      hoverBackgroundColor: palette.hover,
      color: palette.color,
    });
  }

  return slots;
}
