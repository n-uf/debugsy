/**
 * useLogFiltering - Filter logs based on enabled/disabled state
 * 
 * Ported from debugsy's log filtering logic.
 * Filters items based on a point identifier and enabled state.
 */

import { useMemo } from "react";

export interface LogFilteringConfig<T> {
  /** All items to filter */
  items: T[];
  /** Function to extract point identifier from item */
  getPoint: (item: T) => string;
  /** Function to check if point is enabled */
  isEnabled: (point: string) => boolean;
  /** Always include items with specific points (e.g., 'health') */
  alwaysInclude?: string[];
}

/**
 * Hook for filtering items based on enabled state
 * 
 * @example
 * ```tsx
 * const filteredLogs = useLogFiltering({
 *   items: logs,
 *   getPoint: (log) => log.point,
 *   isEnabled: (point) => debug.isEnabled(point),
 *   alwaysInclude: ['health'], // Always show health logs
 * });
 * ```
 */
export function useLogFiltering<T>(
  config: LogFilteringConfig<T>
): T[] {
  const { items, getPoint, isEnabled, alwaysInclude = [] } = config;

  return useMemo(() => {
    return items.filter((item) => {
      const point = getPoint(item);
      return alwaysInclude.includes(point) || isEnabled(point);
    });
  }, [items, getPoint, isEnabled, alwaysInclude]);
}

