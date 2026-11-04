"use client";

import { Word } from "../ui";
import React, { useCallback, useMemo, useRef, useState } from "react";

import type { DebugLogEntry } from "../debugsy-space";

export type TagFilterMode = "and" | "or";

export interface TagFilterProps {
  activeTags: Set<string>;
  knownTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  mode?: TagFilterMode;
  onModeChange?: (mode: TagFilterMode) => void;
  onRefresh?: () => void;
}

/**
 * Maintains an ordered set of tags discovered from log entries.
 * New tags are appended to the tail as they first appear in arriving records.
 * Never shrinks — tags persist for the lifetime of the session.
 */
export function useDiscoveredTags(logs: DebugLogEntry[]): {
  tags: string[];
  refresh: () => void;
} {
  const seenRef = useRef(new Set<string>());
  const orderedRef = useRef<string[]>([]);
  const [rev, setRev] = useState(0);

  const tags = useMemo(() => {
    const pending: string[] = [];
    for (const log of logs) {
      if (!log.tags) continue;
      for (const tag of log.tags) {
        if (!seenRef.current.has(tag)) {
          seenRef.current.add(tag);
          pending.push(tag);
        }
      }
    }
    if (pending.length > 0) {
      orderedRef.current = [...orderedRef.current, ...pending];
    }
    return orderedRef.current;
  }, [logs, rev]);

  const refresh = useCallback(() => {
    seenRef.current = new Set<string>();
    orderedRef.current = [];
    setRev((r) => r + 1);
  }, []);

  return { tags, refresh };
}

export const TagFilter: React.FC<TagFilterProps> = ({
  activeTags,
  knownTags,
  onToggleTag,
  onClearAll,
  searchQuery = "",
  onSearchChange,
  mode = "and",
  onModeChange,
  onRefresh,
}) => {
  // Stay visible while a filter is active, so it can always be cleared
  if (knownTags.length === 0 && activeTags.size === 0) return null;

  const hasActiveFilter = activeTags.size > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0";
    el.style.height = `${Math.max(el.scrollHeight, 22)}px`;
  }, []);

  const flashMiss = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.dataset.miss = "true";
    setTimeout(() => {
      delete el.dataset.miss;
    }, 600);
  }, []);

  const selectTerms = (terms: string[]): boolean => {
    let anyMiss = false;
    for (const term of terms) {
      if (term.length < 2) continue;
      const matches = knownTags.filter(
        (t) => t.toLowerCase().includes(term) && !activeTags.has(t),
      );
      if (matches.length === 0) anyMiss = true;
      for (const m of matches) {
        onToggleTag(m);
      }
    }
    if (anyMiss) flashMiss();
    return anyMiss;
  };

  const handleSearchChange = (raw: string) => {
    onSearchChange?.(raw);
    requestAnimationFrame(autoResize);

    const parts = raw.split(",");
    if (parts.length < 2) return;
    const completedTerms = parts
      .slice(0, -1)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (completedTerms.length > 0) {
      selectTerms(completedTerms);
      const remainder = parts[parts.length - 1] ?? "";
      onSearchChange?.(remainder);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const terms = searchQuery
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    selectTerms(terms);
    onSearchChange?.("");
    requestAnimationFrame(autoResize);
  };

  return (
    <div>
      <div className="dbg-tag-bar">
        <Word
          size="sm"
          tone={hasActiveFilter ? "caution" : "led"}
          onClick={onClearAll}
          title={hasActiveFilter ? "Clear tag filter" : "Showing all tags"}
          ariaLabel={hasActiveFilter ? "Clear tag filter" : "Showing all tags"}
        >
          {hasActiveFilter ? "Clr" : "All"}
        </Word>
        {onSearchChange && (
          <textarea
            ref={textareaRef}
            className="dbg-field"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="surf, broad, …"
            aria-label="Select tags (comma-separated)"
            rows={1}
          />
        )}
        {onModeChange && (
          <Word
            size="sm"
            tone={mode === "and" ? "led" : "warn"}
            onClick={() => onModeChange(mode === "and" ? "or" : "and")}
            title={
              mode === "and"
                ? "AND: all selected tags must match"
                : "OR: any selected tag matches"
            }
            ariaLabel={
              mode === "and"
                ? "Tag match: all selected tags (switch to any)"
                : "Tag match: any selected tag (switch to all)"
            }
          >
            {mode}
          </Word>
        )}
        {onRefresh && (
          <Word
            size="sm"
            tone="caution"
            onClick={onRefresh}
            title="Rebuild tags from current logs"
            ariaLabel="Rebuild tags from current logs"
          >
            Rst
          </Word>
        )}
      </div>
      <div className="dbg-tags">
        {knownTags.map((tag) => {
          const active = activeTags.has(tag);
          return (
            <button
              key={tag}
              type="button"
              className="dbg-chip"
              data-active={active ? "true" : undefined}
              aria-pressed={active}
              onClick={() => onToggleTag(tag)}
              title={tag}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};

TagFilter.displayName = "TagFilter";
