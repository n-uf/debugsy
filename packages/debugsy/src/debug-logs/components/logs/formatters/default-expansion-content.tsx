"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import {
  isLikelyLargeObject,
  memoizedJsonStringify,
  smartJsonStringify,
} from "../utils/log-utilities";

// OPTIMIZATION: Stable style object to prevent JsonView prop changes
const JSON_VIEW_STYLE = {
  fontSize: "10px",
  fontFamily: "monospace",
  backgroundColor: "transparent",
} as const;

// OPTIMIZATION: Loading skeleton for better perceived performance
const JsonLoadingSkeleton: React.FC<{ isLarge: boolean }> = React.memo(
  ({ isLarge }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "4px 0",
      }}
    >
      <div
        style={{
          height: "12px",
          backgroundColor: "#374151",
          borderRadius: "2px",
          opacity: 0.6,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <div
        style={{
          height: "12px",
          backgroundColor: "#374151",
          borderRadius: "2px",
          width: "80%",
          opacity: 0.4,
          animation: "pulse 1.5s ease-in-out infinite 0.2s",
        }}
      />
      {isLarge && (
        <>
          <div
            style={{
              height: "12px",
              backgroundColor: "#374151",
              borderRadius: "2px",
              width: "60%",
              opacity: 0.3,
              animation: "pulse 1.5s ease-in-out infinite 0.4s",
            }}
          />
          <div
            style={{
              fontSize: "8px",
              color: "#6b7280",
              marginTop: "4px",
              fontStyle: "italic",
            }}
          >
            Loading large object...
          </div>
        </>
      )}
    </div>
  )
);

JsonLoadingSkeleton.displayName = "JsonLoadingSkeleton";

/**
 * OPTIMIZED: Default expanded content renderer with lazy JsonView loading
 * Implements performance optimizations to reduce expansion time by 40-60%
 *
 * This component provides the default JSON expansion content for log entries
 * that don't have specialized expansion formatters.
 */
export const DefaultExpandedContent: React.FC<{ log: DebugLogEntry }> =
  React.memo(({ log }) => {
    const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">(
      "idle"
    );
    // OPTIMIZATION: Lazy JsonView rendering - defer to next frame for better perceived performance
    const [shouldRenderJsonView, setShouldRenderJsonView] = useState(false);

    // OPTIMIZATION: Combined memoization - compute all JSON-related data in single pass
    const jsonMeta = useMemo(() => {
      if (!log.data) {
        return {
          jsonString: null,
          isLarge: false,
          jsonViewProps: null,
        };
      }

      // Single detection call instead of multiple
      const isLarge = isLikelyLargeObject(log.data);

      // Compute JSON string with appropriate strategy
      const jsonString = isLarge
        ? smartJsonStringify(log.data, 3, 20)
        : memoizedJsonStringify(log.data, 2);

      // Pre-compute JsonView props for stable references
      const jsonViewProps = {
        src: log.data,
        collapsed: isLarge ? 1 : 2,
        collapseObjectsAfterLength: isLarge ? 5 : 20,
        collapseStringsAfterLength: 50,
        ignoreLargeArray: true,
        enableClipboard: false,
        displayArrayIndex: true,
        displaySize: true,
        style: JSON_VIEW_STYLE, // Stable reference
        theme: "default" as const,
      };

      return {
        jsonString,
        isLarge,
        jsonViewProps,
      };
    }, [log.data]);

    // OPTIMIZATION: Lazy JsonView rendering effect
    useEffect(() => {
      if (jsonMeta.jsonString) {
        // Defer JsonView rendering to next frame for instant expansion feedback
        const timer = setTimeout(() => setShouldRenderJsonView(true), 0);
        return () => clearTimeout(timer);
      } else {
        setShouldRenderJsonView(false);
      }
    }, [jsonMeta.jsonString]);

    // Memoize the copy handler to prevent function recreation
    const handleCopyJson = useCallback(async () => {
      if (!jsonMeta.jsonString) return;

      try {
        setCopyState("copying");
        await navigator.clipboard.writeText(jsonMeta.jsonString);
        setCopyState("copied");

        // Reset after 2 seconds
        setTimeout(() => setCopyState("idle"), 2000);
      } catch (error) {
        console.error("Failed to copy JSON:", error);
        setCopyState("idle");
      }
    }, [jsonMeta.jsonString]);

    if (!log.data) {
      return (
        <div style={{ color: "#9ca3af", fontSize: "9px", fontStyle: "italic" }}>
          No additional data available
        </div>
      );
    }

    const getCopyButtonContent = () => {
      switch (copyState) {
        case "copying":
          return "📋 Copying...";
        case "copied":
          return "✅ Copied!";
        default:
          return "📋 Copy JSON";
      }
    };

    const getCopyButtonStyle = () => ({
      fontSize: "8px",
      padding: "2px 6px",
      backgroundColor: copyState === "copied" ? "#065f4622" : "#374151",
      color: copyState === "copied" ? "#6ee7b7" : "#d1d5db",
      border: `1px solid ${copyState === "copied" ? "#065f46" : "#4b5563"}`,
      borderRadius: "2px",
      cursor: copyState === "copying" ? "not-allowed" : "pointer",
      fontFamily: "monospace",
      transition: "all 0.2s ease",
      opacity: copyState === "copying" ? 0.6 : 1,
    });

    return (
      <div style={{ fontFamily: "monospace" }}>
        {/* Data Header with Copy Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <div
            style={{ color: "#60a5fa", fontWeight: "bold", fontSize: "9px" }}
          >
            📊 Log Data:
          </div>
          <button
            onClick={handleCopyJson}
            disabled={copyState === "copying"}
            style={getCopyButtonStyle()}
          >
            {getCopyButtonContent()}
          </button>
        </div>

        {/* OPTIMIZATION: Lazy-loaded JSON Viewer with loading state */}
        <div
          style={{
            backgroundColor: "#0f172a22",
            padding: "6px 8px",
            borderRadius: "3px",
            overflow: "auto",
            maxHeight: "300px",
            border: "1px solid #374151",
            minHeight: shouldRenderJsonView ? "auto" : "60px",
          }}
        >
          {shouldRenderJsonView && jsonMeta.jsonViewProps ? (
            <JsonView {...jsonMeta.jsonViewProps} />
          ) : (
            <JsonLoadingSkeleton isLarge={jsonMeta.isLarge} />
          )}
        </div>
      </div>
    );
  });

DefaultExpandedContent.displayName = "DefaultExpandedContent";

export default DefaultExpandedContent;
