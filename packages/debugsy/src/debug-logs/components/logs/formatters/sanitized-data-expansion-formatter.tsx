"use client";

import React, { useMemo } from "react";
import type { DebugLogEntry } from "../../../hooks/use-debugsy";
import { formatTime } from "./health-expansion-formatter";

/**
 * Check if data is sanitized by the sanitization system
 */
function isSanitizedData(data: any): boolean {
  return data && typeof data === "object" && data.__sanitized === true;
}

/**
 * Extract the actual data from sanitized wrapper
 */
function extractSanitizedData(data: any): any {
  if (isSanitizedData(data)) {
    return data.data;
  }
  return data;
}

/**
 * OPTIMIZED: Sanitized data expansion content with performance insights
 * This component provides enhanced viewing for sanitized log data
 */
export const SanitizedDataExpansionContent: React.FC<{ log: DebugLogEntry }> =
  React.memo(({ log }) => {
    // Memoize sanitization analysis
    const sanitizationMeta = useMemo(() => {
      if (!isSanitizedData(log.data)) {
        return null;
      }

      const sanitizedData = log.data;
      return {
        wasSanitized: true,
        sanitizationTime: sanitizedData.__sanitizationTime || 0,
        config: sanitizedData.__config || {},
        error: sanitizedData.__error || null,
        actualData: sanitizedData.data,
        hasLargeObjectOptimizations:
          !!sanitizedData.__config?.detectReactComponents,
      };
    }, [log.data]);

    // If not sanitized data, return null to fall back to default expansion
    if (!sanitizationMeta) {
      return null;
    }

    return (
      <div style={{ fontFamily: "monospace" }}>
        {/* Sanitization Header */}
        <div
          style={{
            marginBottom: "8px",
            padding: "4px 6px",
            backgroundColor: "#065f4611",
            borderRadius: "3px",
            border: "1px solid #065f4622",
          }}
        >
          <div
            style={{ color: "#10b981", fontSize: "9px", fontWeight: "bold" }}
          >
            🧹 Sanitized Log Data
          </div>
          <div style={{ color: "#6ee7b7", fontSize: "8px", marginTop: "2px" }}>
            Processed at {formatTime(log.timestamp)} • Sanitization time:{" "}
            {sanitizationMeta.sanitizationTime}ms
          </div>
        </div>

        {/* Sanitization Error (if any) */}
        {sanitizationMeta.error && (
          <div
            style={{
              marginBottom: "8px",
              padding: "4px 6px",
              backgroundColor: "#7f1d1d11",
              borderRadius: "3px",
              border: "1px solid #7f1d1d22",
            }}
          >
            <div
              style={{ color: "#ef4444", fontSize: "9px", fontWeight: "bold" }}
            >
              ⚠️ Sanitization Error:
            </div>
            <div
              style={{ color: "#fca5a5", fontSize: "8px", marginTop: "2px" }}
            >
              {sanitizationMeta.error}
            </div>
          </div>
        )}

        {/* Sanitization Config */}
        <div
          style={{
            marginBottom: "8px",
            padding: "4px 6px",
            backgroundColor: "#1e3a8a11",
            borderRadius: "3px",
            border: "1px solid #1e3a8a22",
          }}
        >
          <div
            style={{ color: "#60a5fa", fontSize: "9px", fontWeight: "bold" }}
          >
            🔧 Sanitization Settings:
          </div>
          <div style={{ marginTop: "4px" }}>
            <div style={{ fontSize: "8px", display: "grid", gap: "2px" }}>
              <div style={{ color: "#93c5fd" }}>
                <span style={{ color: "#9ca3af" }}>Max Depth:</span>{" "}
                {sanitizationMeta.config.maxDepth}
              </div>
              <div style={{ color: "#93c5fd" }}>
                <span style={{ color: "#9ca3af" }}>Max Properties:</span>{" "}
                {sanitizationMeta.config.maxProperties}
              </div>
              <div style={{ color: "#93c5fd" }}>
                <span style={{ color: "#9ca3af" }}>Max String Length:</span>{" "}
                {sanitizationMeta.config.maxStringLength}
              </div>
              <div style={{ color: "#93c5fd" }}>
                <span style={{ color: "#9ca3af" }}>React Components:</span>{" "}
                {sanitizationMeta.config.detectReactComponents
                  ? "✅ Detected"
                  : "❌ Disabled"}
              </div>
            </div>
          </div>
        </div>

        {/* Sanitized Data Preview */}
        <div style={{ marginBottom: "8px" }}>
          <div
            style={{
              color: "#60a5fa",
              fontWeight: "bold",
              marginBottom: "4px",
              fontSize: "9px",
            }}
          >
            📊 Sanitized Data:
          </div>
          <div
            style={{
              color: "#d1d5db",
              fontSize: "8px",
              backgroundColor: "#0f172a22",
              padding: "6px 8px",
              borderRadius: "3px",
              fontFamily: "monospace",
              overflow: "auto",
              maxHeight: "200px",
              border: "1px solid #374151",
            }}
          >
            <SanitizedDataRenderer data={sanitizationMeta.actualData} />
          </div>
        </div>

        {/* Performance Tips */}
        {sanitizationMeta.hasLargeObjectOptimizations && (
          <div
            style={{
              marginBottom: "8px",
              padding: "6px",
              backgroundColor: "#065f4611",
              borderRadius: "3px",
              border: "1px solid #065f4622",
            }}
          >
            <div
              style={{
                color: "#10b981",
                fontWeight: "bold",
                fontSize: "9px",
                marginBottom: "3px",
              }}
            >
              💡 Performance Optimization Active:
            </div>
            <div
              style={{ color: "#6ee7b7", fontSize: "8px", lineHeight: "1.3" }}
            >
              Heavy objects (React components, large arrays, deep nesting) were
              automatically summarized to prevent browser freezing. Original
              data structure preserved for debugging.
            </div>
          </div>
        )}
      </div>
    );
  });

SanitizedDataExpansionContent.displayName = "SanitizedDataExpansionContent";

/**
 * OPTIMIZED: Renderer for sanitized data with special handling for different data types
 */
const SanitizedDataRenderer: React.FC<{ data: any; depth?: number }> =
  React.memo(({ data, depth = 0 }) => {
    if (depth > 5) {
      return (
        <span style={{ color: "#9ca3af" }}>[Max render depth reached]</span>
      );
    }

    if (data === null || data === undefined) {
      return (
        <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
          {String(data)}
        </span>
      );
    }

    if (
      typeof data === "string" ||
      typeof data === "number" ||
      typeof data === "boolean"
    ) {
      return <span style={{ color: "#e5e7eb" }}>{JSON.stringify(data)}</span>;
    }

    // Handle sanitized React elements
    if (data && typeof data === "object" && data.__type === "ReactElement") {
      return (
        <div style={{ marginLeft: depth * 12 }}>
          <div style={{ color: "#60a5fa", fontWeight: "bold" }}>
            ⚛️ React Element: {data.elementType}
          </div>
          {data.key && (
            <div style={{ color: "#9ca3af", fontSize: "7px" }}>
              Key: {data.key}
            </div>
          )}
          <div style={{ color: "#9ca3af", fontSize: "7px" }}>
            Props: {data.propsCount} properties
          </div>
          {data.props && (
            <div style={{ marginTop: "2px" }}>
              <SanitizedDataRenderer data={data.props} depth={depth + 1} />
            </div>
          )}
        </div>
      );
    }

    // Handle sanitized React components
    if (data && typeof data === "object" && data.__type === "ReactComponent") {
      return (
        <div style={{ marginLeft: depth * 12 }}>
          <div style={{ color: "#60a5fa", fontWeight: "bold" }}>
            🧩 React Component: {data.name}
          </div>
          <div style={{ color: "#9ca3af", fontSize: "7px" }}>
            Type: {data.isClass ? "Class" : "Function"}
          </div>
          {data.isCompiled && (
            <div style={{ color: "#f59e0b", fontSize: "7px" }}>
              ⚡ Compiled Code ({data.codeLength} chars)
            </div>
          )}
          {!data.isCompiled && data.codePreview && (
            <div
              style={{ color: "#d1d5db", fontSize: "7px", marginTop: "2px" }}
            >
              {data.codePreview}
            </div>
          )}
        </div>
      );
    }

    // Handle other sanitized types
    if (data && typeof data === "object" && data.__type) {
      return (
        <div style={{ marginLeft: depth * 12 }}>
          <div style={{ color: "#f59e0b", fontWeight: "bold" }}>
            🔧 {data.__type}
          </div>
          {Object.entries(data)
            .filter(([key]) => !key.startsWith("__"))
            .map(([key, value]) => (
              <div key={key} style={{ marginTop: "2px" }}>
                <span style={{ color: "#9ca3af" }}>{key}:</span>{" "}
                <SanitizedDataRenderer data={value} depth={depth + 1} />
              </div>
            ))}
        </div>
      );
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return (
        <div style={{ marginLeft: depth * 12 }}>
          <div style={{ color: "#10b981" }}>[Array: {data.length} items]</div>
          {data.slice(0, 10).map((item, index) => (
            <div key={index} style={{ marginTop: "2px" }}>
              <span style={{ color: "#9ca3af" }}>[{index}]:</span>{" "}
              <SanitizedDataRenderer data={item} depth={depth + 1} />
            </div>
          ))}
          {data.length > 10 && (
            <div style={{ color: "#9ca3af", fontSize: "7px" }}>
              ... and {data.length - 10} more items
            </div>
          )}
        </div>
      );
    }

    // Handle objects
    if (typeof data === "object") {
      const entries = Object.entries(data);
      return (
        <div style={{ marginLeft: depth * 12 }}>
          <div style={{ color: "#10b981" }}>
            &#123;Object: {entries.length} properties&#125;
          </div>
          {entries.slice(0, 8).map(([key, value]) => (
            <div key={key} style={{ marginTop: "2px" }}>
              <span style={{ color: "#9ca3af" }}>{key}:</span>{" "}
              <SanitizedDataRenderer data={value} depth={depth + 1} />
            </div>
          ))}
          {entries.length > 8 && (
            <div style={{ color: "#9ca3af", fontSize: "7px" }}>
              ... and {entries.length - 8} more properties
            </div>
          )}
        </div>
      );
    }

    // Fallback
    return <span style={{ color: "#e5e7eb" }}>{String(data)}</span>;
  });

SanitizedDataRenderer.displayName = "SanitizedDataRenderer";

/**
 * OPTIMIZED: Get sanitized data log metadata for external use
 * Used by DefaultLogFormatter to determine if special handling is needed
 */
export const getSanitizedDataLogMeta = (log: DebugLogEntry) => {
  if (!isSanitizedData(log.data)) {
    return null;
  }

  return {
    severity: log.data.__error ? "warn" : "info",
    shouldExpand: true, // Always expand sanitized data for insights
    expansionContent: SanitizedDataExpansionContent,
    isSanitized: true,
    sanitizationTime: log.data.__sanitizationTime || 0,
  };
};

export default SanitizedDataExpansionContent;
