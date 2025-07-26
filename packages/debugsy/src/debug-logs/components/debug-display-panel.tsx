"use client";

import React from "react";
import { useDebugDisplayContent } from "../hooks/debug-notifications";
import type { DebugLogEntry } from "../hooks/use-debug";

export interface DebugDisplayPanelProps {
  logs: DebugLogEntry[];
  onClearLogs: () => void;
  onClose?: () => void;
  className?: string;
  showExternalPanel?: boolean;
  onExternalPanelToggle?: () => void;
  displayInlineLogs?: boolean;
  onDisplayInlineLogsChange?: (display: boolean) => void;
  onDisplayClick?: () => void;
}

// Debug points mapping for emojis (Event Dispatcher Architecture)
const DEBUG_POINT_EMOJIS: Record<string, string> = {
  dispatcher: "🎯",
  "hit-testing": "🔍",
  routing: "🔗",
  "frame-interaction": "📦",
  "selection-interaction": "📋",
  "handler-registry": "📝",
  performance: "⚡",
  "visual-debug": "👁️",
  "surface-interactions": "🌍",
  "surface-dock": "🚢",
  "frame-metrics": "📏",
  "canvas-events": "🎨",
  "viewport-changes": "🔍",
  "auto-layout": "📐",
  "event-propagation": "📡",
  "mouse-dispatcher": "🖱️", // Alias for dispatcher
};

/**
 * Debug Display Panel - Inline panel only (external panel rendered at Surface level)
 */
export const DebugDisplayPanel: React.FC<DebugDisplayPanelProps> = ({
  logs,
  onClearLogs,
  onClose,
  className = "",
  showExternalPanel = false,
  onExternalPanelToggle,
  displayInlineLogs,
  onDisplayInlineLogsChange,
  onDisplayClick,
}) => {
  const { content: displayContent } = useDebugDisplayContent();

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getPointEmoji = (point: string): string => {
    return DEBUG_POINT_EMOJIS[point] ?? "📝";
  };

  const toggleExternalPanel = () => {
    console.log("🔄 DebugDisplayPanel toggle (will call Surface handler):", {
      showExternalPanel,
      displayInlineLogs,
      hasHandler: !!onExternalPanelToggle,
      logsCount: logs.length,
    });

    // If displaying inline logs (collapsed mode), restore to normal mode
    if (displayInlineLogs && onDisplayInlineLogsChange) {
      console.log("📈 Restoring from inline logs mode to normal mode");
      onDisplayInlineLogsChange(false);
    } else {
      onExternalPanelToggle?.();
    }
  };

  const handleDisplayClick = () => {
    console.log("🖱️ DebugDisplayPanel display area clicked:", {
      showExternalPanel,
      displayInlineLogs,
      hasHandler: !!onDisplayClick,
      logsCount: logs.length,
    });
    onDisplayClick?.();
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("🗑️ Clearing debug logs from inline panel");
    onClearLogs();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("❌ Closing debug panel");
    onClose?.();
  };

  // Reverse logs so newer are on top
  const reversedLogs = [...logs].reverse();
  const recentLogs = reversedLogs.slice(0, 3);
  const activePoints = [...new Set(logs.map((log) => log.point))].length;
  const totalLogs = logs.length;

  const getDisplayContentStyle = () => {
    if (!displayContent) return {};

    return {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "10px",
      fontFamily: "monospace",
      lineHeight: "1.2",
      overflow: "hidden",
      width: "100%",
      position: "relative" as const,
    };
  };

  const getDisplayProgressWidth = () => {
    if (!displayContent) return "0%";

    const message = displayContent.message;

    // Check for hover states (Copy Logs messages)
    if (message.includes("Copy Logs")) {
      if (message.includes("exported - click")) {
        return "50%"; // Partial state
      } else if (message.includes("Export complete")) {
        return "100%"; // Completed state
      }
      return "0%"; // Idle state
    }

    // Check for copy result messages (success/error after operation)
    if (message.includes("Copied") && displayContent.type === "success") {
      if (message.includes("newest logs")) {
        return "50%"; // Partial copy completed
      } else if (message.includes("all") || message.includes("logs")) {
        return "100%"; // Full copy completed
      }
    }

    return "0%";
  };

  const shouldShowProgressBar = () => {
    if (!displayContent) return false;
    const message = displayContent.message;
    return (
      message.includes("Copy Logs") ||
      (message.includes("Copied") && displayContent.type === "success") ||
      (message.includes("copy") && displayContent.type === "error")
    );
  };

  const getDisplayProgressColor = () => {
    // Use the same color as the primary text for consistency
    return getDisplayContentColor();
  };

  const getDisplayContentColor = () => {
    if (!displayContent) return "#ff7f3f"; // higher contrast vibrant orange

    switch (displayContent.type) {
      case "success":
        return "#ff7f3f"; // higher contrast vibrant orange
      case "error":
        return "#ff4757"; // higher contrast vibrant red
      case "warning":
        return "#ffa502"; // higher contrast vibrant amber/orange
      default:
        return "#a55eea"; // higher contrast vibrant purple
    }
  };

  const getDisplayContentIcon = () => {
    if (!displayContent) return "📋";

    // Always use clipboard for consistency
    return "📋";
  };

  const formatDisplayTime = (timestamp: number): string => {
    return new Date(timestamp)
      .toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .slice(-5); // Show only MM:SS
  };

  const renderDisplayMessage = () => {
    if (!displayContent) return null;

    const message = displayContent.message;
    const parts = message.split(" • ");

    if (parts.length === 2) {
      // Primary and secondary parts
      return (
        <>
          <span
            style={{
              color: getDisplayContentColor(),
              fontWeight: "bold",
              fontSize: "12px", // Larger primary text
            }}
          >
            {parts[0]}
          </span>
          <span
            style={{
              color: "#9ca3af",
              marginLeft: "6px",
              fontSize: "10px", // Keep secondary text smaller
            }}
          >
            • {parts[1]}
          </span>
        </>
      );
    } else {
      // Single part message
      return (
        <span
          style={{
            color: getDisplayContentColor(),
            fontSize: "12px", // Larger for single messages too
          }}
        >
          {message}
        </span>
      );
    }
  };

  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div
        style={{
          height: "48px",
          backgroundColor: "#000000e6",
          border: "1px solid #4b5563",
          borderRadius: "6px",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={handleDisplayClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#10b981";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#4b5563";
        }}
      >
        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            paddingRight: "70px", // Space for both buttons
            overflow: "hidden",
          }}
        >
          {displayContent ? (
            // Show custom display content when available
            <div style={getDisplayContentStyle()}>
              <span
                style={{
                  color: "#6b7280",
                  flexShrink: 0,
                  fontSize: "9px",
                }}
              >
                {formatDisplayTime(displayContent.timestamp)}
              </span>
              <span
                style={{
                  color: getDisplayContentColor(),
                  flexShrink: 0,
                  fontSize: "11px",
                }}
              >
                {getDisplayContentIcon()}
              </span>
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {renderDisplayMessage()}
              </div>

              {/* Progress Bar for Copy Operations */}
              {shouldShowProgressBar() && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    width: "100%",
                    height: "1px",
                    backgroundColor: "#1f2937",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: "0",
                      left: "0",
                      width: getDisplayProgressWidth(),
                      height: "100%",
                      backgroundColor: getDisplayProgressColor(),
                      transition: "all 0.3s ease",
                      boxShadow: `0 0 2px ${getDisplayProgressColor()}40`,
                    }}
                  />
                </div>
              )}
            </div>
          ) : showExternalPanel && !displayInlineLogs ? (
            // General info when external panel is open and not in inline logs mode
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "100%",
              }}
            >
              <span
                style={{
                  color: "#10b981",
                  fontSize: "12px",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                }}
              >
                📊 Debug Overview
              </span>
              <span
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  fontFamily: "monospace",
                }}
              >
                {activePoints} points • {totalLogs} logs
              </span>
              <span
                style={{
                  color: "#60a5fa",
                  fontSize: "11px",
                  fontFamily: "monospace",
                  marginLeft: "auto",
                }}
              >
                External panel open ↗
              </span>
            </div>
          ) : (
            // Recent logs when collapsed (newest first)
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                width: "100%",
                overflow: "hidden",
              }}
            >
              {recentLogs.length === 0 ? (
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: "11px",
                    fontFamily: "monospace",
                    textAlign: "center",
                  }}
                >
                  No debug logs yet. Enable debug points and interact.
                </div>
              ) : (
                recentLogs.map((log, index) => (
                  <div
                    key={`${log.timestamp}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "10px",
                      fontFamily: "monospace",
                      lineHeight: "1.2",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        color: "#6b7280",
                        flexShrink: 0,
                        fontSize: "9px",
                      }}
                    >
                      {formatTime(log.timestamp).slice(-5)}{" "}
                      {/* Show only MM:SS */}
                    </span>
                    <span style={{ flexShrink: 0, fontSize: "10px" }}>
                      {getPointEmoji(log.point)}
                    </span>
                    <span
                      style={{
                        color: "#10b981",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Clear logs button */}
        <button
          onClick={handleClearClick}
          style={{
            position: "absolute",
            top: "12px",
            right: "36px",
            backgroundColor: "#ffffff",
            color: "#ffffff",
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
            zIndex: 100,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e5e7eb";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
          }}
          title="Clear logs"
        >
          🗑️
        </button>

        {/* Close button */}
        <button
          onClick={handleCloseClick}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            backgroundColor: "#dc2626",
            color: "#ffffff",
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
            zIndex: 100,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#b91c1c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#dc2626";
          }}
          title="Close panel"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

DebugDisplayPanel.displayName = "DebugDisplayPanel";
