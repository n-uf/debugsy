"use client";

import {
  IndicatorButtonGroup,
  type IndicatorButtonGroupItem,
  TerminalWindowSettings,
} from "@workspace/harbuz";
import React, { useMemo, useRef } from "react";

import { getPointDef } from "../config";
import type { DebugLogEntry } from "../debugsy-space";

export interface TagFilterProps {
  activeTags: Set<string>;
  knownTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
}

function getTagIcon(tag: string): string | null {
  try {
    if (typeof globalThis === "undefined" || !globalThis.debugsy) return null;
    const state = globalThis.debugsy.getDebugState?.();
    if (!state) return null;
    for (const point of state.enabled) {
      const tagDef = getPointDef(point)?.tags?.[tag];
      if (tagDef?.icon) return tagDef.icon;
    }
  } catch {
    // noop
  }
  return null;
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
}) => {
  if (knownTags.length === 0) return null;

  const hasActiveFilter = activeTags.size > 0;

  const buttons: IndicatorButtonGroupItem[] = [
    {
      label: hasActiveFilter ? "CLR" : "ALL",
      indicatorType: "toggle" as const,
      active: !hasActiveFilter,
      onClick: onClearAll,
      buttonVariant: "ghost" as const,
      buttonSize: "xxs" as const,
      title: hasActiveFilter ? "Clear tag filter" : "Showing all tags",
    },
    ...knownTags.map(
      (tag): IndicatorButtonGroupItem => {
        const icon = getTagIcon(tag);
        return {
          label: icon ? `${icon} ${tag}` : tag,
          indicatorType: "toggle" as const,
          active: activeTags.has(tag),
          onClick: () => onToggleTag(tag),
          buttonVariant: "ghost" as const,
          buttonSize: "xxs" as const,
          title: tag,
        };
      }
    ),
  ];

  return (
    <TerminalWindowSettings title="Tags" noBorder={false}>
      <IndicatorButtonGroup
        orientation="horizontal"
        wrap={true}
        justify="flex-start"
        align="center"
        buttons={buttons}
        theme={{
          color: "#d1d5db",
          style: {
            fontFamily: "monospace",
            fontWeight: "bold",
            borderRadius: "3px",
            padding: "2px 5px",
            fontSize: "10px",
          },
        }}
        gap="2px"
      />
    </TerminalWindowSettings>
  );
};

TagFilter.displayName = "TagFilter";
