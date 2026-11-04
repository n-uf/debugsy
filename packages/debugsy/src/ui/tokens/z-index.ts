/**
 * Z-Index Token System
 *
 * Unified z-index scale for the entire monorepo.
 * Based on Surface's architecture with clear hierarchy.
 *
 * ARCHITECTURE:
 * - Background/Grid: 0-999
 * - Content Layers: 1000-9999 (Surface frames)
 * - Selected Content: 10000-14999 (Surface selected frames)
 * - Interactions: 15000-19999 (Surface interaction overlays)
 * - UI Chrome: 20000-39999 (Toolbars, panels)
 * - Modals: 40000-49999 (Modal dialogs)
 * - Notifications: 50000-59999 (Toasts, tooltips)
 * - Debug/Dev Tools: 60000-69999 (Debugsy, dev panels) ✅ HIGHEST
 */

export const Z_INDEX = {
  // ===== BACKGROUND (0-999) =====
  BACKGROUND: 0,
  GRID: 1,

  // ===== CONTENT LAYERS (1000-9999) =====
  // Reserved for Surface frames - DO NOT USE in other packages
  CONTENT_BASE: 1000,
  CONTENT_MAX: 9999,

  // ===== SELECTED CONTENT (10000-14999) =====
  // Reserved for Surface selected frames - DO NOT USE in other packages
  SELECTED_BASE: 10000,
  SELECTED_MAX: 14999,

  // ===== INTERACTIONS (15000-19999) =====
  // Reserved for Surface interactions canvas - DO NOT USE in other packages
  INTERACTIONS_CANVAS: 15000,
  INTERACTIONS_MAX: 19999,

  // ===== UI CHROME (20000-39999) =====
  // Toolbars, panels, status bars
  TOOLBAR: 30000,
  TOOLBAR_DROPDOWN: 30100,
  SIDE_PANEL: 30200,
  STATUS_BAR: 30300,
  FLOATING_PANEL: 30400,

  // ===== MODALS (40000-49999) =====
  MODAL_BACKDROP: 40000,
  MODAL: 41000,
  MODAL_HEADER: 41100,

  // ===== NOTIFICATIONS (50000-59999) =====
  TOAST: 50000,
  TOOLTIP: 51000,
  POPOVER: 52000,
  NOTIFICATION: 53000,

  // ===== DEBUG & DEV TOOLS (60000-69999) ===== ✅ HIGHEST PRIORITY
  // Debugsy and other development tools ALWAYS on top
  DEBUG_PANEL: 60000, // Main debugsy panel
  DEBUG_RESIZE_HANDLE: 60100, // Drag handles
  DEBUG_CONTROL_PANEL: 60200, // Control buttons (bottom bar)
  DEBUG_LOGS_LIST: 60300, // Logs virtualized list
  DEBUG_DISPLAY: 60400, // Status displays
  DEBUG_STATS: 60500, // Statistics panel
  DEBUG_DEPENDENCY: 60600, // Dependency controls
  DEBUG_ACTIONS: 60700, // Action buttons
  DEBUG_TOOLTIP: 60800, // Debug tooltips
  DEBUG_OVERLAY: 60900, // Full-screen overlays

  // ===== EMERGENCY (70000+) =====
  // Reserved for critical UI that must be above everything
  EMERGENCY: 70000,
} as const;

export type ZIndexToken = keyof typeof Z_INDEX;

/**
 * Get z-index value by token
 */
export function getZIndex(token: ZIndexToken): number {
  return Z_INDEX[token];
}

/**
 * Tailwind z-index class mapping
 * Use these classes in Tailwind components
 */
export const Z_INDEX_CLASSES = {
  // Debug tools - use inline styles with Z_INDEX constants
  // Tailwind only goes up to z-50, so we need inline styles for 60000+
} as const;

/**
 * CSS custom properties for z-index
 * Use in global CSS or component styles
 */
export const Z_INDEX_CSS_VARS = {
  "--z-debug-panel": String(Z_INDEX.DEBUG_PANEL),
  "--z-debug-resize-handle": String(Z_INDEX.DEBUG_RESIZE_HANDLE),
  "--z-debug-control-panel": String(Z_INDEX.DEBUG_CONTROL_PANEL),
  "--z-debug-logs-list": String(Z_INDEX.DEBUG_LOGS_LIST),
  "--z-debug-display": String(Z_INDEX.DEBUG_DISPLAY),
  "--z-debug-stats": String(Z_INDEX.DEBUG_STATS),
  "--z-debug-dependency": String(Z_INDEX.DEBUG_DEPENDENCY),
  "--z-debug-actions": String(Z_INDEX.DEBUG_ACTIONS),
  "--z-debug-tooltip": String(Z_INDEX.DEBUG_TOOLTIP),
  "--z-debug-overlay": String(Z_INDEX.DEBUG_OVERLAY),
} as const;
