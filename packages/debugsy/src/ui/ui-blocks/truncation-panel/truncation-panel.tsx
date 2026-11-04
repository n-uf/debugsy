"use client";

import React, { useCallback } from "react";
import { Notice } from "../../primitives/notice";
import { Word } from "../../primitives/word";

export interface TruncationPanelProps {
  hiddenCount?: number;
  totalCount?: number;
  maxRendered?: number;
  renderedCount?: number;
  onCopyAll?: () => void;
  onClearAll?: () => void;
}

/**
 * TruncationPanel - warning notice for truncated logs, with copy-all and
 * clear-all words.
 *
 * Usage:
 * ```tsx
 * <TruncationPanel
 *   hiddenCount={566}
 *   totalCount={966}
 *   maxRendered={400}
 *   renderedCount={408}
 *   onCopyAll={handleCopyAll}
 *   onClearAll={handleClearAll}
 * />
 * ```
 */
export const TruncationPanel: React.FC<TruncationPanelProps> = ({
  hiddenCount = 0,
  totalCount = 0,
  maxRendered = 0,
  renderedCount,
  onCopyAll,
  onClearAll,
}) => {
  const handleClearClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClearAll?.();
    },
    [onClearAll]
  );

  const handleCopyAllClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCopyAll?.();
    },
    [onCopyAll]
  );

  if (hiddenCount <= 0 || totalCount <= 0 || maxRendered <= 0) return null;

  const actions =
    onCopyAll || onClearAll ? (
      <>
        {onCopyAll && (
          <Word
            size="sm"
            tone="led"
            onClick={handleCopyAllClick}
            title="Copy all logs to clipboard"
          >
            Copy all
          </Word>
        )}
        {onClearAll && (
          <Word
            size="sm"
            tone="caution"
            onClick={handleClearClick}
            title="Clear all logs"
          >
            Clear all
          </Word>
        )}
      </>
    ) : undefined;

  return (
    <Notice tone="warn" className="dbg-trunc" actions={actions}>
      <span className="dbg-trunc-text">
        Showing latest {maxRendered} of {totalCount} logs (performance limit)
      </span>
      {renderedCount !== undefined && (
        <span className="dbg-trunc-meta">
          {renderedCount} rendered, {hiddenCount} hidden
        </span>
      )}
    </Notice>
  );
};

TruncationPanel.displayName = "TruncationPanel";
