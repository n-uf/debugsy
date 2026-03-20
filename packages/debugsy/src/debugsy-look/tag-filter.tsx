"use client";

import { IndicatorButton } from "@workspace/harbuz";
import React, { useMemo, useRef } from "react";

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
}

/**
 * Maintains an ordered set of tags discovered from log entries.
 * New tags are appended to the tail as they first appear in arriving records.
 * Never shrinks — tags persist for the lifetime of the session.
 */
export function useDiscoveredTags(logs: DebugLogEntry[]): string[] {
  const seenRef = useRef(new Set<string>());
  const orderedRef = useRef<string[]>([]);

  return useMemo(() => {
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
  }, [logs]);
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
}) => {
  if (knownTags.length === 0) return null;

  const hasActiveFilter = activeTags.size > 0;

  const handleSearchChange = (raw: string) => {
    onSearchChange?.(raw);

    const terms = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (terms.length === 0) return;

    for (const term of terms) {
      const match = knownTags.find((t) => t.toLowerCase() === term);
      if (match && !activeTags.has(match)) {
        onToggleTag(match);
      }
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const terms = searchQuery
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    for (const term of terms) {
      const match = knownTags.find((t) => t.toLowerCase() === term);
      if (match && !activeTags.has(match)) {
        onToggleTag(match);
      }
    }
    onSearchChange?.("");
  };

  const btnStyle: React.CSSProperties = {
    fontFamily: "monospace",
    fontWeight: "bold",
    borderRadius: "2px",
    padding: "1px 3px",
    fontSize: "10px",
    color: "#d1d5db",
    width: "100%",
  };

  return (
    <div style={{ padding: "4px" }}>
      <div style={{ display: "flex", gap: "2px", marginBottom: "2px" }}>
        <button
          type="button"
          onClick={onClearAll}
          title={hasActiveFilter ? "Clear tag filter" : "Showing all tags"}
          style={{
            flexShrink: 0,
            padding: "2px 4px",
            fontSize: "9px",
            fontFamily: "monospace",
            fontWeight: "bold",
            color: hasActiveFilter ? "#f87171" : "#6b7280",
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "2px",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          {hasActiveFilter ? "CLR" : "ALL"}
        </button>
        {onSearchChange && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="tag1, tag2, …"
            style={{
              flex: 1,
              minWidth: 0,
              padding: "2px 4px",
              fontSize: "10px",
              fontFamily: "monospace",
              color: "#d1d5db",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "2px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        )}
        {onModeChange && (
          <button
            type="button"
            onClick={() => onModeChange(mode === "and" ? "or" : "and")}
            title={mode === "and" ? "AND: all selected tags must match" : "OR: any selected tag matches"}
            style={{
              flexShrink: 0,
              padding: "2px 4px",
              fontSize: "9px",
              fontFamily: "monospace",
              fontWeight: "bold",
              color: mode === "and" ? "#60a5fa" : "#f59e0b",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "2px",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            {mode.toUpperCase()}
          </button>
        )}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(55px, 1fr))",
          gap: "1px",
        }}
      >
        {knownTags.map((tag) => (
          <IndicatorButton
            key={tag}
            label={tag}
            indicatorType="toggle"
            active={activeTags.has(tag)}
            onClick={() => onToggleTag(tag)}
            buttonVariant="ghost"
            buttonSize="xxs"
            title={tag}
            width="normal"
            justify="start"
            style={btnStyle}
          />
        ))}
      </div>
    </div>
  );
};

TagFilter.displayName = "TagFilter";
