"use client";

import {
  Indicator,
  IndicatorButtonGroup,
  type IndicatorButtonGroupItem,
  type IndicatorButtonTheme,
} from "@n-uf/harbuz";
import React, { useCallback, useMemo, useReducer, useRef, useState } from "react";

const LONG_PRESS_MS = 400;

import {
  getAllPointKeys,
  getModuleLedState,
  getModulePointKeys,
  getModules,
} from "../config";
import type { ModuleLedState } from "../config/types";
import { useDebugsy } from "../debugsy-logs/use-debugsy";

// =============================================================================
// LED variant mapping
// =============================================================================

interface LedAppearance {
  variant: "success" | "error" | "info";
  active: boolean;
  indicatorClassName: string;
}

const LED_APPEARANCE: Record<ModuleLedState, LedAppearance> = {
  "all-on": { variant: "success", active: true, indicatorClassName: "" },
  partial: { variant: "info", active: true, indicatorClassName: "" },
  "all-off": { variant: "error", active: true, indicatorClassName: "opacity-50" },
};

// =============================================================================
// Types
// =============================================================================

/** The module key for the built-in system/debugsy module */
export const SYSTEM_MODULE_KEY = "system";

interface ModuleNavProps {
  theme: IndicatorButtonTheme;
  onDisplayMessage?: (message: string) => void;
  /** Called when the selected module changes (null = root level) */
  onModuleSelect?: (moduleKey: string | null) => void;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Two-level module navigation for debugsy control panel.
 *
 * Level 1: Module buttons with LED dot indicators
 * Level 2: Individual point buttons with slit indicators (with back)
 */
export const ModuleNav: React.FC<ModuleNavProps> = ({
  theme,
  onDisplayMessage,
  onModuleSelect,
}) => {
  const debug = useDebugsy();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [ledVersion, bumpLedVersion] = useReducer((n: number) => n + 1, 0);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const isPointEnabled = useCallback(
    (pointKey: string) => debug.isEnabled(pointKey),
    [debug],
  );

  // ─── Module-level buttons ───────────────────────────────────────────────────

  const modules = useMemo(() => {
    void ledVersion;
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
  }, [isPointEnabled, ledVersion]);

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
      setSelectedModule((prev) => {
        const next = prev === moduleKey ? null : moduleKey;
        onModuleSelect?.(next);
        return next;
      });
    },
    [onModuleSelect],
  );

  const handleModuleToggleAll = useCallback(
    (moduleKey: string) => {
      const keys = getModulePointKeys(moduleKey);
      const ledState = getModuleLedState(moduleKey, isPointEnabled);
      if (ledState === "all-off") {
        keys.forEach((k) => debug.enable(k));
        onDisplayMessage?.(`All ${moduleKey} points enabled`);
      } else {
        keys.forEach((k) => debug.disable(k));
        onDisplayMessage?.(`All ${moduleKey} points disabled`);
      }
      bumpLedVersion();
    },
    [debug, isPointEnabled, onDisplayMessage],
  );

  const handleGlobalToggleAll = useCallback(() => {
    const keys = getAllPointKeys();
    const allOn = keys.every((k) => debug.isEnabled(k));
    if (allOn) {
      keys.forEach((k) => debug.disable(k));
      onDisplayMessage?.("All points disabled");
    } else {
      keys.forEach((k) => debug.enable(k));
      onDisplayMessage?.("All points enabled");
    }
    bumpLedVersion();
  }, [debug, onDisplayMessage]);

  const handlePointToggle = useCallback(
    (pointKey: string, label: string) => {
      debug.toggle(pointKey);
      const nowEnabled = debug.isEnabled(pointKey);
      onDisplayMessage?.(
        `${nowEnabled ? "Enabled" : "Disabled"} ${label}`,
      );
      bumpLedVersion();
    },
    [debug, onDisplayMessage],
  );

  const handleBack = useCallback(() => {
    setSelectedModule(null);
    onModuleSelect?.(null);
  }, [onModuleSelect]);

  // ─── ALL button (shared between root and module views) ──────────────────────

  const buildAllButton = useCallback(
    (scope: "global" | "module") => {
      const isModule = scope === "module" && selectedModule;
      const keys = isModule ? getModulePointKeys(selectedModule) : getAllPointKeys();
      const onCount = keys.filter((k) => debug.isEnabled(k)).length;
      const ledState: ModuleLedState =
        onCount === keys.length ? "all-on" : onCount === 0 ? "all-off" : "partial";
      const led = LED_APPEARANCE[ledState];

      return {
        label: "ALL",
        buttonVariant: "ghost" as const,
        buttonSize: "xxs" as const,
        onClick: isModule
          ? () => handleModuleToggleAll(selectedModule)
          : handleGlobalToggleAll,
        title: isModule
          ? `Toggle all ${selectedModuleDef?.label ?? ""} points`
          : `Toggle all debug points (${ledState === "all-on" ? "disable" : "enable"})`,
        customIndicator: (
          <Indicator
            size="md"
            shape="slit"
            variant={led.variant}
            active={led.active}
            inactiveVariant="error"
            className={led.indicatorClassName}
          />
        ),
      };
    },
    [debug, selectedModule, selectedModuleDef, handleModuleToggleAll, handleGlobalToggleAll],
  );

  // ─── Layout: first column (header + ALL) | separator | rest (2-row grid) ────

  const SEPARATOR = (
    <div className="w-px self-stretch bg-[rgb(var(--color-border-muted))] opacity-40 mx-0.5 shrink-0" />
  );

  // ─── Render: Point-level (expanded module) ──────────────────────────────────

  if (selectedModule && selectedModuleDef) {
    const backButton: IndicatorButtonGroupItem = {
      label: `← ${selectedModuleDef.label}`,
      indicatorType: "none" as const,
      onClick: handleBack,
      buttonVariant: "ghost" as const,
      buttonSize: "xxs" as const,
      title: "Back to modules",
    };

    const restButtons: IndicatorButtonGroupItem[] = pointButtons.map((point) => {
      const enabled = debug.isEnabled(point.key);
      return {
        label: point.label,
        indicatorType: "single" as const,
        variant: (enabled ? "success" : "error") as "success" | "error",
        active: enabled,
        inactiveVariant: "error" as const,
        onClick: () => handlePointToggle(point.key, point.label),
        buttonVariant: "ghost" as const,
        buttonSize: "xxs" as const,
        title: `Toggle ${point.label}`,
      };
    });

    return (
      <div className="flex items-stretch">
        <IndicatorButtonGroup
          buttons={[backButton, buildAllButton("module")]}
          theme={theme}
          orientation="grid"
          gridRows={2}
          gap="2px"
        />
        {SEPARATOR}
        <IndicatorButtonGroup
          buttons={restButtons}
          theme={theme}
          orientation="grid"
          gridRows={2}
          gap="2px"
        />
      </div>
    );
  }

  // ─── Render: Module-level ───────────────────────────────────────────────────

  const firstModule = modules[0];
  const restModules = modules.slice(1);

  const buildModuleButton = (mod: (typeof modules)[number]): IndicatorButtonGroupItem => {
    const led = LED_APPEARANCE[mod.ledState];
    return {
      label: mod.label,
      onClick: () => {
        if (longPressFired.current) {
          longPressFired.current = false;
          return;
        }
        handleModuleClick(mod.key);
      },
      onPointerDown: () => {
        longPressFired.current = false;
        longPressTimer.current = setTimeout(() => {
          longPressFired.current = true;
          handleModuleToggleAll(mod.key);
        }, LONG_PRESS_MS);
      },
      onPointerUp: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
      onPointerLeave: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      },
      buttonVariant: "ghost" as const,
      buttonSize: "xxs" as const,
      title: `${mod.label} — click to expand, hold to toggle all`,
      customIndicator: (
        <Indicator
          size="md"
          shape="slit"
          variant={led.variant}
          active={led.active}
          inactiveVariant="error"
          className={led.indicatorClassName}
        />
      ),
    };
  };

  if (!firstModule) return null;

  return (
    <div className="flex items-stretch">
      <IndicatorButtonGroup
        buttons={[buildModuleButton(firstModule), buildAllButton("global")]}
        theme={theme}
        orientation="grid"
        gridRows={2}
        gap="2px"
      />
      {SEPARATOR}
      <IndicatorButtonGroup
        buttons={restModules.map(buildModuleButton)}
        theme={theme}
        orientation="grid"
        gridRows={2}
        gap="2px"
      />
    </div>
  );
};

ModuleNav.displayName = "ModuleNav";
