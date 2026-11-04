/**
 * Display Helper Functions
 *
 * Utility functions for formatting and toning display content.
 */

import type { DisplayContent } from "../../../patterns/display-system/display-state";
import type { LampState, MeterTone } from "../../../primitives/lamp";

/**
 * Format timestamp to MM:SS format
 */
export const formatTime = (timestamp: string | number): string => {
  if (typeof timestamp === "string") return timestamp;
  const date = new Date(timestamp);
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

/**
 * Tone for a content type: success is ok (green), error is caution (pink),
 * warning is warn (amber), info is led (cyan).
 */
export const getContentTone = (type: DisplayContent["type"]): MeterTone => {
  switch (type) {
    case "success":
      return "ok";
    case "error":
      return "caution";
    case "warning":
      return "warn";
    case "info":
      return "led";
  }
};

/**
 * Status lamp state for a content type (the lamp before the message)
 */
export const getContentLamp = (type: DisplayContent["type"]): LampState => {
  switch (type) {
    case "success":
      return "ok";
    case "error":
      return "alert";
    case "warning":
      return "warn";
    case "info":
      return "on";
  }
};

/**
 * Calculate elapsed time string
 */
export const getElapsedTime = (
  showProcessingTime: boolean,
  itemShowProcessingTime?: boolean,
  processingStartTime?: number
): string => {
  if (!showProcessingTime || !itemShowProcessingTime || !processingStartTime) {
    return "";
  }
  const elapsed = (Date.now() - processingStartTime) / 1000;
  return ` (${elapsed.toFixed(1)}s)`;
};
