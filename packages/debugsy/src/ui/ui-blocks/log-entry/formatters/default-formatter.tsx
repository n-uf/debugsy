/**
 * Default formatter - displays JSON data for any log entry
 * Uses JsonView for interactive exploration
 */

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import superjson from "superjson";
import type { LogEntryData } from "../log-entry";
import type {
  ExpansionContentProps,
  FormatterMeta,
} from "./formatter-types";

/**
 * Default expansion content - uses JsonView for all data
 */
export const DefaultExpansionContent: React.FC<ExpansionContentProps> = ({
  log,
  colors = {},
}) => {
  const { textSecondary = "#9ca3af" } = colors;

  // Create safe data for JsonView using superjson
  const jsonViewData = useMemo(() => {
    if (log.data === undefined) return null;

    let safeData: any;
    try {
      const serialized = superjson.stringify(log.data);
      safeData = JSON.parse(serialized);
    } catch {
      safeData = {
        __renderError: true,
        __error: "Failed to render data safely",
        __hint: "Data contains structures that cannot be safely displayed",
      };
    }

    // Check if data is complex (object/array with multiple levels)
    const isComplex =
      typeof safeData === "object" &&
      safeData !== null &&
      !safeData.__renderError &&
      (Array.isArray(safeData) || Object.keys(safeData).length > 3);

    return {
      safeData,
      isComplex,
    };
  }, [log.data]);

  if (!jsonViewData) return null;

  return (
    <div
      style={{
        marginTop: "4px",
        marginLeft: "16px",
        borderLeft: "2px solid #6b7280",
        paddingLeft: "8px",
        backgroundColor: "transparent",
        borderRadius: "0 4px 4px 0",
        padding: "8px",
        fontSize: "9px",
        fontFamily: "monospace",
        color: textSecondary,
      }}
    >
      {/* JsonView Styles - Scoped to this component only */}
      <style>{`
        /* ========================================
           COLOR PALETTE - Harmonized with terminal
           SCOPED: Only affects .default-formatter-json-view container
           ======================================== */
        .default-formatter-json-view .json-view {
          --json-property: #10b981; /* Emerald (matches terminal) */
          --json-index: #9ca3af;    /* Gray for indices */
          --json-number: #60a5fa;   /* Blue (matches terminal) */
          --json-string: #fbbf24;   /* Amber (matches terminal) */
          --json-boolean: #ef4444;  /* Red (matches terminal) */
          --json-null: #6b7280;     /* Muted gray */
        }
        
        /* ========================================
           META BADGES (Item Counts)
           Goal: Subtle, readable, harmonious
           ======================================== */
        .default-formatter-json-view .json-view .json-view--size,
        .default-formatter-json-view .json-view .json-view--count {
          color: #d1d5db !important;
          font-weight: 500 !important;
          font-size: 10px !important;
          font-style: normal !important;
          letter-spacing: 0.3px !important;
          font-family: ui-monospace, monospace !important;
          background: rgba(75, 85, 99, 0.3) !important;
          border: 1px solid rgba(156, 163, 175, 0.2) !important;
          padding: 2px 6px !important;
          border-radius: 3px !important;
          margin-left: 6px !important;
          display: inline-block !important;
          opacity: 0.9 !important;
        }
        
        /* ========================================
           COPY BUTTONS - Hidden by default
           ======================================== */
        .default-formatter-json-view .json-view .json-view--copy {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 18px !important;
          height: 18px !important;
          padding: 0 !important;
          margin-left: 6px !important;
          vertical-align: middle !important;
          color: #9ca3af !important;
          background: transparent !important;
          border: 1px solid transparent !important;
          border-radius: 3px !important;
          font-size: 12px !important;
          line-height: 1 !important;
          cursor: pointer !important;
          opacity: 0 !important;
          transition: all 0.15s ease !important;
        }
        
        .default-formatter-json-view .json-view *:hover > .json-view--copy {
          opacity: 0.7 !important;
        }
        
        .default-formatter-json-view .json-view .json-view--copy:hover {
          opacity: 1 !important;
          color: #60a5fa !important;
          background: rgba(96, 165, 250, 0.1) !important;
          border-color: rgba(96, 165, 250, 0.3) !important;
          transform: scale(1.05) !important;
        }
        
        .default-formatter-json-view .json-view .json-view--copy:active {
          transform: scale(0.95) !important;
          color: #3b82f6 !important;
        }
        
        /* ========================================
           EXPAND/COLLAPSE ARROWS
           ======================================== */
        .default-formatter-json-view .json-view .json-view--arrow {
          color: #9ca3af !important;
          opacity: 0.8 !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          margin-right: 4px !important;
          transition: all 0.15s ease !important;
        }
        
        .default-formatter-json-view .json-view .json-view--arrow:hover {
          color: #d1d5db !important;
          opacity: 1 !important;
        }
        
        /* ========================================
           PROPERTY KEYS
           ======================================== */
        .default-formatter-json-view .json-view .json-view--property {
          color: #10b981 !important;
          font-weight: 500 !important;
        }
        
        /* ========================================
           VALUES - Match terminal colors
           ======================================== */
        .default-formatter-json-view .json-view .json-view--number {
          color: #60a5fa !important;
          font-weight: 500 !important;
        }
        
        .default-formatter-json-view .json-view .json-view--string {
          color: #fbbf24 !important;
          font-weight: 400 !important;
        }
        
        .default-formatter-json-view .json-view .json-view--boolean {
          color: #ef4444 !important;
          font-weight: 500 !important;
        }
        
        .default-formatter-json-view .json-view .json-view--null {
          color: #6b7280 !important;
          font-weight: 400 !important;
        }
        
        /* ========================================
           VISIBILITY ENFORCEMENT
           ======================================== */
        .default-formatter-json-view .json-view button,
        .default-formatter-json-view .json-view [role="button"],
        .default-formatter-json-view .json-view [class*="copy"] {
          display: inline-flex !important;
          visibility: visible !important;
        }
        
        /* ========================================
           LAYOUT & SPACING - Harmonious
           ======================================== */
        .default-formatter-json-view .json-view > * {
          line-height: 1.6 !important;
        }
        
        .default-formatter-json-view .json-view {
          font-family: ui-monospace, 'SF Mono', 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, 'Courier New', monospace !important;
        }
        
        /* ========================================
           OVERALL HARMONY - Match terminal aesthetic
           ======================================== */
        .default-formatter-json-view .json-view {
          color: #d1d5db !important;
        }
      `}</style>

      <div className="default-formatter-json-view">
        <JsonView
          src={jsonViewData.safeData}
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Monaco, Consolas, monospace",
            fontSize: "12px",
            backgroundColor: "transparent",
          }}
          collapsed={jsonViewData.isComplex ? 2 : false}
          displaySize={true}
          enableClipboard={true}
          theme="default"
        />
      </div>
    </div>
  );
};

DefaultExpansionContent.displayName = "DefaultExpansionContent";

/**
 * Get metadata for default formatter
 */
export const getDefaultLogMeta = (log: LogEntryData): FormatterMeta | null => {
  // Default formatter doesn't change any metadata
  return {
    severity: log.level ?? "info",
    shouldExpand: log.data !== undefined,
  };
};

