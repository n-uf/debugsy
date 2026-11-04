/**
 * Display Priority System
 *
 * Semantic priority levels for display queue items.
 * Lower number = higher priority.
 *
 * Architecture: Generic priority system, not coupled to any specific use case.
 */

/**
 * Semantic priority levels for display items
 *
 * Priority determines:
 * 1. Display order (higher priority shows first)
 * 2. Interruption capability (higher can interrupt lower)
 * 3. Memorization behavior (lower can be memorized when interrupted)
 */
export enum DisplayPriority {
  /**
   * ERROR: Highest priority (0)
   *
   * Critical errors that must be shown immediately.
   * Can interrupt any other item.
   * Never memorized (always shown).
   *
   * Examples:
   * - System failures
   * - Permission denied
   * - Critical validation errors
   * - Fatal operation failures
   */
  ERROR = 0,

  /**
   * ACTION: High priority (1)
   *
   * User action feedback and important notifications.
   * Can interrupt PROGRESS and LOG items.
   * Rarely memorized (usually short-lived).
   *
   * Examples:
   * - Button click confirmations
   * - State change notifications
   * - Important user feedback
   * - Success messages
   */
  ACTION = 1,

  /**
   * PROGRESS: Medium priority (2)
   *
   * Progress indicators and loading states.
   * Can interrupt LOG items.
   * Often memorized when interrupted by ERROR/ACTION.
   *
   * Examples:
   * - File uploads
   * - Data processing
   * - Multi-step operations
   * - Background tasks
   */
  PROGRESS = 2,

  /**
   * LOG: Lowest priority (3)
   *
   * Log entries and informational messages.
   * Cannot interrupt other items.
   * Memorized when interrupted by any higher priority.
   *
   * Examples:
   * - Debug logs
   * - System events
   * - Audit trail entries
   * - Informational messages
   */
  LOG = 3,
}

/**
 * Get priority level description (for debugging/documentation)
 */
export function getPriorityDescription(priority: DisplayPriority): string {
  switch (priority) {
    case DisplayPriority.ERROR:
      return "ERROR (highest priority)";
    case DisplayPriority.ACTION:
      return "ACTION (high priority)";
    case DisplayPriority.PROGRESS:
      return "PROGRESS (medium priority)";
    case DisplayPriority.LOG:
      return "LOG (lowest priority)";
    default:
      return `Unknown priority: ${priority}`;
  }
}

/**
 * Check if priority A can interrupt priority B
 *
 * @param priorityA - The interrupting priority
 * @param priorityB - The current priority
 * @returns true if A can interrupt B
 */
export function canInterrupt(
  priorityA: DisplayPriority,
  priorityB: DisplayPriority
): boolean {
  // Lower number = higher priority = can interrupt higher numbers
  return priorityA < priorityB;
}

/**
 * Check if an item should be memorized when interrupted
 *
 * @param priority - Item priority
 * @param phase - Item phase
 * @returns true if item should be memorized
 */
export function shouldMemorize(
  priority: DisplayPriority,
  phase: "active" | "complete"
): boolean {
  // ERROR items are never memorized (always shown)
  if (priority === DisplayPriority.ERROR) {
    return false;
  }

  // ACTION items are memorized only if still active
  if (priority === DisplayPriority.ACTION) {
    return phase === "active";
  }

  // PROGRESS items are always memorized if active
  if (priority === DisplayPriority.PROGRESS) {
    return phase === "active";
  }

  // LOG items are always memorized (can be recalled from history)
  return true;
}

/**
 * Sort items by priority (highest priority first)
 *
 * Sorting order:
 * 1. Priority (lower number first)
 * 2. Timestamp (newer first for same priority)
 */
export function sortByPriority<T extends { priority: DisplayPriority; timestamp: number }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => {
    // Primary: Priority (lower number = higher priority)
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Secondary: Timestamp (newer first)
    return b.timestamp - a.timestamp;
  });
}

/**
 * Get items that should be visible based on priority and slot capacity
 *
 * Algorithm:
 * 1. Sort by priority
 * 2. Take top N items (maxSlots)
 * 3. Return visible + memorized (hidden but kept in memory)
 */
export function getVisibleItems<T extends { priority: DisplayPriority; timestamp: number }>(
  items: T[],
  maxSlots: number
): { visible: T[]; memorized: T[] } {
  const sorted = sortByPriority(items);
  const visible = sorted.slice(0, maxSlots);
  const memorized = sorted.slice(maxSlots);

  return { visible, memorized };
}

