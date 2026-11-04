"use client";

import { useCallback } from "react";
import type { LogEntryData } from "./log-entry";

export interface UseLogEntryCopyOptions {
  /**
   * Callback to show feedback message
   */
  onSuccess?: (message: string) => void;
  /**
   * Callback to show error message
   */
  onError?: (message: string) => void;
  /**
   * Custom formatter for log entry (optional)
   * If not provided, uses default format: [timestamp] point: message | data
   */
  formatter?: (entry: LogEntryData) => string;
}

/**
 * Hook for copying individual log entries to clipboard
 *
 * Provides a generic handler that can be used with LogEntry's onLongPress prop.
 * Handles formatting, clipboard API, and feedback.
 *
 * @example
 * ```tsx
 * const handleCopyLog = useLogEntryCopy({
 *   onSuccess: (msg) => setDisplayContent({ message: msg, type: "success" }),
 *   onError: (msg) => setDisplayContent({ message: msg, type: "error" }),
 * });
 *
 * <LogEntry entry={entry} onLongPress={handleCopyLog} />
 * ```
 */
export const useLogEntryCopy = ({
  onSuccess,
  onError,
  formatter,
}: UseLogEntryCopyOptions = {}) => {
  const defaultFormatter = useCallback((entry: LogEntryData): string => {
    const dataStr = entry.data
      ? ` | ${JSON.stringify(entry.data, null, 2)}`
      : "";
    return `[${entry.timestamp}] ${entry.point}: ${entry.message}${dataStr}`;
  }, []);

  const handleCopy = useCallback(
    async (entry: LogEntryData) => {
      try {
        const formattedLog = formatter
          ? formatter(entry)
          : defaultFormatter(entry);

        await navigator.clipboard.writeText(formattedLog);

        onSuccess?.("Log entry copied to clipboard");
        console.log("📋 Log entry copied to clipboard");
      } catch (error) {
        console.error("Failed to copy log entry:", error);
        onError?.("Failed to copy log entry");
      }
    },
    [formatter, defaultFormatter, onSuccess, onError]
  );

  return handleCopy;
};
