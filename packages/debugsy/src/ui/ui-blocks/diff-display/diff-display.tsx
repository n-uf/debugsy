import React from "react";
import type { DiffEntry } from "../../utils/diff-utils";
import { getEnhancedObjectDisplay } from "../../utils/object-display-utils";

const DIFF_SYMBOL = { added: "+", removed: "-", changed: "~" } as const;

/**
 * Compact engineering-focused diff display component.
 * Removed/old is red, added/new green; styled by the panel's stylesheet.
 */
export const CompactDiffDisplay: React.FC<{
  diffs: DiffEntry[];
  summary: string;
}> = React.memo(({ diffs, summary }) => {
  if (diffs.length === 0) {
    return null;
  }

  return (
    <div className="dbg-diff">
      {/* Compact header */}
      <div className="dbg-diff-head">
        <span className="dbg-diff-tag">Diff</span>
        <span className="dbg-diff-summary">{summary}</span>
      </div>

      {/* Compact diff entries */}
      <div className="dbg-diff-list">
        {diffs.slice(0, 8).map((diff, idx) => (
          <CompactDiffEntry key={idx} diff={diff} />
        ))}

        {diffs.length > 8 && (
          <div className="dbg-diff-more">+{diffs.length - 8} more changes</div>
        )}
      </div>
    </div>
  );
});

CompactDiffDisplay.displayName = "CompactDiffDisplay";

/**
 * Compact engineering-focused diff entry
 */
export const CompactDiffEntry: React.FC<{ diff: DiffEntry }> = React.memo(
  ({ diff }) => {
    const enhanced = getEnhancedObjectDisplay(diff.from);
    const enhancedTo =
      diff.type !== "removed" ? getEnhancedObjectDisplay(diff.to) : null;

    return (
      <div className="dbg-diff-entry" data-type={diff.type}>
        <div className="dbg-diff-keyline">
          <span className="dbg-diff-sym">{DIFF_SYMBOL[diff.type]}</span>
          <span className="dbg-diff-key">{diff.key}</span>
        </div>

        {/* Compact value display */}
        {diff.type !== "added" && (
          <div className="dbg-diff-val" data-kind="old">
            <span>old:</span>
            <span>{enhanced.display}</span>
          </div>
        )}

        {enhancedTo && (
          <div className="dbg-diff-val" data-kind="new">
            <span>new:</span>
            <span>{enhancedTo.display}</span>
          </div>
        )}
      </div>
    );
  }
);

CompactDiffEntry.displayName = "CompactDiffEntry";
