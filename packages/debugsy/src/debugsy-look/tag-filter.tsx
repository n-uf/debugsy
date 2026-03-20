"use client";

import { IndicatorButton } from "@workspace/harbuz";
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
  if (knownTags.length === 0) return null;

  const hasActiveFilter = activeTags.size > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0";
    el.style.height = `${Math.max(el.scrollHeight, 19)}px`;
  }, []);

  const flashMiss = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.borderColor = "rgba(244, 114, 182, 0.6)";
    el.style.backgroundColor = "rgba(244, 114, 182, 0.08)";
    setTimeout(() => {
      el.style.borderColor = "rgba(255,255,255,0.1)";
      el.style.backgroundColor = "rgba(255,255,255,0.06)";
    }, 600);
  }, []);

  const selectTerms = (terms: string[]): boolean => {
    let anyMiss = false;
    for (const term of terms) {
      if (term.length < 2) continue;
      const matches = knownTags.filter(
        (t) => t.toLowerCase().includes(term) && !activeTags.has(t)
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
      <div style={{ display: "flex", gap: "2px", marginBottom: "2px", alignItems: "flex-start" }}>
        <button
          type="button"
          onClick={onClearAll}
          title={hasActiveFilter ? "Clear tag filter" : "Showing all tags"}
          style={{
            flexShrink: 0,
            alignSelf: "flex-start",
            padding: "2px 4px",
            fontSize: "10px",
            fontFamily: "monospace",
            fontWeight: "bold",
            color: hasActiveFilter ? "#f87171" : "#93c5fd",
            backgroundColor: hasActiveFilter
              ? "rgba(255,255,255,0.06)"
              : "rgba(96, 165, 250, 0.2)",
            border: hasActiveFilter
              ? "1px solid rgba(255,255,255,0.1)"
              : "1px solid rgba(96, 165, 250, 0.35)",
            borderRadius: "2px",
            cursor: "pointer",
            lineHeight: "1.3",
            boxSizing: "border-box",
          }}
        >
          {hasActiveFilter ? "CLR" : "ALL"}
        </button>
        {onSearchChange && (
          <textarea
            ref={textareaRef}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="surf, broad, …"
            rows={1}
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
              resize: "none",
              overflow: "hidden",
              lineHeight: "1.3",
              minHeight: "19px",
              transition: "border-color 0.4s, background-color 0.4s",
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
              alignSelf: "flex-start",
              padding: "2px 4px",
              fontSize: "10px",
              fontFamily: "monospace",
              fontWeight: "bold",
              color: mode === "and" ? "#60a5fa" : "#f59e0b",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "2px",
              cursor: "pointer",
              lineHeight: "1.3",
              boxSizing: "border-box",
            }}
          >
            {mode.toUpperCase()}
          </button>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            title="Rebuild tags from current logs"
            style={{
              flexShrink: 0,
              alignSelf: "flex-start",
              padding: "2px 4px",
              fontSize: "10px",
              fontFamily: "monospace",
              fontWeight: "bold",
              color: "#f472b6",
              backgroundColor: "rgba(244, 114, 182, 0.1)",
              border: "1px solid rgba(244, 114, 182, 0.25)",
              borderRadius: "2px",
              cursor: "pointer",
              lineHeight: "1.3",
              boxSizing: "border-box",
            }}
          >
            RST
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
