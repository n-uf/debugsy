/**
 * Formatter system types for harbuz
 * Inspired by debugsy's architecture
 */

import type React from "react";
import type { LogEntryData } from "../log-entry";

/**
 * Severity levels for logs
 */
export type LogSeverity = "info" | "warn" | "error";

/**
 * Metadata returned by formatter meta functions
 */
export interface FormatterMeta {
  severity?: LogSeverity;
  shouldExpand?: boolean;
  [key: string]: any; // extensible metadata
}

/**
 * Configuration for a log formatter
 */
export interface FormatterConfig {
  /** React component for expansion content */
  expansionComponent: React.ComponentType<ExpansionContentProps>;

  /** Function to get metadata (severity, expand behavior, etc.) */
  metaFunction: (log: LogEntryData) => FormatterMeta | null;

  /** Display name for debugging */
  displayName: string;

  /** Whether this formatter should always expand */
  alwaysExpand?: boolean;

  /** Default severity for this log type */
  defaultSeverity?: LogSeverity;
}

/**
 * Props for expansion content components
 */
export interface ExpansionContentProps {
  log: LogEntryData;
}

