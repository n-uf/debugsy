"use client";

import {
  IndicatorButtonGroup,
  type IndicatorButtonTheme,
} from "@workspace/harbuz";
import React, { useCallback, useMemo, useState } from "react";

import { getModuleLedState, getModulePointKeys, getModules } from "../config";
import type { ModuleLedState } from "../config/types";
import { useDebugsy } from "../debugsy-logs/use-debugsy";

// =============================================================================
// LED colors
// =============================================================================

const LED_COLORS: Record<ModuleLedState, string> = {
  "all-on": "#22c55e",
  partial: "#22c55e80",
  "all-off": "#ef444480",
};

// =============================================================================
// Types
// =============================================================================

interface ModuleNavProps {
  theme: IndicatorButtonTheme;
  onDisplayMessage?: (message: string) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Two-level module navigation for debugsy control panel.
 *
 * Level 1: Module buttons with LED indicators
 * Level 2: Individual point buttons within a selected module (with back)
 */
export const ModuleNav: React.FC<ModuleNavProps> = ({
  theme,
  onDisplayMessage,
}) => {
  const debug = useDebugsy();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const isPointEnabled = useCallback(
    (pointKey: string) => debug.isEnabled(pointKey),
    [debug],
  );

  // ─── Module-level buttons ───────────────────────────────────────────────────

  const modules = useMemo(() => {
    const result: Array<{
      key: string;
      label: string;
      emoji: string;
      ledState: ModuleLedState;
    }> = [];
    for (const [key, def] of getModules()) {
      result.push({
        key,
        label: def.label,
        emoji: def.emoji,
        ledState: getModuleLedState(key, isPointEnabled),
      });
    }
    return result;
  }, [isPointEnabled]);

  // ─── Point-level buttons (when a module is selected) ────────────────────────

  const selectedModuleDef = useMemo(() => {
    if (!selectedModule) return null;
    const mods = getModules();
    return mods.get(selectedModule) ?? null;
  }, [selectedModule]);

  const pointButtons = useMemo(() => {
    if (!selectedModule || !selectedModuleDef) return [];
    return getModulePointKeys(selectedModule).map((pointKey) => {
      const pointDef = selectedModuleDef.points[pointKey];
      return {
        key: pointKey,
        label: pointDef?.label ?? pointKey,
        emoji: pointDef?.emoji ?? "🔧",
      };
    });
  }, [selectedModule, selectedModuleDef]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleModuleClick = useCallback(
    (moduleKey: string) => {
      setSelectedModule((prev) => (prev === moduleKey ? null : moduleKey));
    },
    [],
  );

  const handleModuleToggleAll = useCallback(
    (moduleKey: string) => {
      const keys = getModulePointKeys(moduleKey);
      const ledState = getModuleLedState(moduleKey, isPointEnabled);
      if (ledState === "all-on") {
        keys.forEach((k) => debug.disable(k));
        onDisplayMessage?.(`All ${moduleKey} points disabled`);
      } else {
        keys.forEach((k) => debug.enable(k));
        onDisplayMessage?.(`All ${moduleKey} points enabled`);
      }
    },
    [debug, isPointEnabled, onDisplayMessage],
  );

  const handlePointToggle = useCallback(
    (pointKey: string, label: string) => {
      debug.toggle(pointKey);
      const nowEnabled = !debug.isEnabled(pointKey);
      onDisplayMessage?.(
        `${nowEnabled ? "Enabled" : "Disabled"} ${label}`,
      );
    },
    [debug, onDisplayMessage],
  );

  const handleBack = useCallback(() => {
    setSelectedModule(null);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (selectedModule && selectedModuleDef) {
    return (
      <IndicatorButtonGroup
        buttons={[
          {
            label: `← ${selectedModuleDef.label}`,
            active: false,
            onClick: handleBack,
            buttonVariant: "ghost" as const,
            buttonSize: "xxs" as const,
            title: "Back to modules",
          },
          {
            label: "ALL",
            active:
              getModuleLedState(selectedModule, isPointEnabled) === "all-on",
            onClick: () => handleModuleToggleAll(selectedModule),
            buttonVariant: "ghost" as const,
            buttonSize: "xxs" as const,
            title: `Toggle all ${selectedModuleDef.label} points`,
          },
          ...pointButtons.map((point) => ({
            label: point.label,
            active: debug.isEnabled(point.key),
            onClick: () => handlePointToggle(point.key, point.label),
            buttonVariant: "ghost" as const,
            buttonSize: "xxs" as const,
            title: `Toggle ${point.label}`,
          })),
        ]}
        theme={theme}
        orientation="grid"
        gridRows={2}
        gap="2px"
      />
    );
  }

  return (
    <IndicatorButtonGroup
      buttons={modules.map((mod) => ({
        label: mod.label,
        active: mod.ledState !== "all-off",
        onClick: () => handleModuleClick(mod.key),
        onDoubleClick: () => handleModuleToggleAll(mod.key),
        buttonVariant: "ghost" as const,
        buttonSize: "xxs" as const,
        title: `${mod.label} — click to expand, double-click to toggle all`,
        customIndicator: (
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: LED_COLORS[mod.ledState],
              marginRight: 4,
              flexShrink: 0,
            }}
          />
        ),
      }))}
      theme={theme}
      orientation="grid"
      gridRows={2}
      gap="2px"
    />
  );
};

ModuleNav.displayName = "ModuleNav";
