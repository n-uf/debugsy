"use client";

import { DebugsyStyles, Word, WordDivider, type LampState } from "../ui";
import React, { useCallback, useMemo, useReducer, useRef, useState } from "react";

import {
  getAllPointKeys,
  getModuleLedState,
  getModulePointKeys,
  getModules,
} from "../config";
import type { ModuleLedState } from "../config/types";
import { useDebugsy } from "../debugsy-logs/use-debugsy";

const LONG_PRESS_MS = 400;

/** A module's lamp: lit when all its points are on, half lit when some are */
const LAMP: Record<ModuleLedState, LampState> = {
  "all-on": "on",
  partial: "partial",
  "all-off": "off",
};

/** The module key for the built-in system/debugsy module */
export const SYSTEM_MODULE_KEY = "system";

interface ModuleNavProps {
  /** @deprecated Ignored since the panel styles itself; kept so existing calls compile */
  theme?: unknown;
  onDisplayMessage?: (message: string) => void;
  /** Called when the selected module changes (null = root level) */
  onModuleSelect?: (moduleKey: string | null) => void;
}

/**
 * Two-level module navigation for the control tray.
 *
 * Level 1: a word per module with a lamp (click to open, hold to switch all
 * its points). Level 2: a word per point, with a way back.
 */
export const ModuleNav: React.FC<ModuleNavProps> = ({
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

  // ─── Module-level words ───────────────────────────────────────────────────

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

  // ─── Point-level words (when a module is selected) ────────────────────────

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

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleModuleClick = useCallback(
    (moduleKey: string) => {
      // Tell the parent outside the state updater: updaters run during
      // render, where setting another component's state is an error.
      const next = selectedModule === moduleKey ? null : moduleKey;
      setSelectedModule(next);
      onModuleSelect?.(next);
    },
    [selectedModule, onModuleSelect],
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
      onDisplayMessage?.(`${nowEnabled ? "Enabled" : "Disabled"} ${label}`);
      bumpLedVersion();
    },
    [debug, onDisplayMessage],
  );

  const handleBack = useCallback(() => {
    setSelectedModule(null);
    onModuleSelect?.(null);
  }, [onModuleSelect]);

  const clearLongPress = (): void => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ─── ALL word (root and module views) ─────────────────────────────────────

  const renderAllWord = (scope: "global" | "module"): React.ReactElement => {
    const moduleKey = scope === "module" ? selectedModule : null;
    const keys = moduleKey ? getModulePointKeys(moduleKey) : getAllPointKeys();
    const onCount = keys.filter((k) => debug.isEnabled(k)).length;
    const ledState: ModuleLedState =
      onCount === keys.length ? "all-on" : onCount === 0 ? "all-off" : "partial";
    return (
      <Word
        block
        lamp={LAMP[ledState]}
        onClick={moduleKey ? () => handleModuleToggleAll(moduleKey) : handleGlobalToggleAll}
        title={
          moduleKey
            ? `Toggle all ${selectedModuleDef?.label ?? ""} points`
            : `Toggle all debug points (${ledState === "all-on" ? "disable" : "enable"})`
        }
      >
        All
      </Word>
    );
  };

  const wrap = (content: React.ReactNode): React.ReactElement => (
    <div className="dbg-root dbg-contents">
      <DebugsyStyles />
      <div className="dbg-nav">{content}</div>
    </div>
  );

  // ─── Render: point level (an open module) ─────────────────────────────────

  if (selectedModule && selectedModuleDef) {
    return wrap(
      <>
        <div className="dbg-grid">
          <Word block tone="led" onClick={handleBack} title="Back to modules">
            ← {selectedModuleDef.label}
          </Word>
          {renderAllWord("module")}
        </div>
        <WordDivider />
        <div className="dbg-grid">
          {pointButtons.map((point) => {
            const enabled = debug.isEnabled(point.key);
            return (
              <Word
                key={point.key}
                block
                lamp={enabled ? "on" : "off"}
                active={enabled}
                ariaPressed={enabled}
                onClick={() => handlePointToggle(point.key, point.label)}
                title={`Toggle ${point.label}`}
              >
                {point.label}
              </Word>
            );
          })}
        </div>
      </>,
    );
  }

  // ─── Render: module level ─────────────────────────────────────────────────

  const renderModuleWord = (mod: (typeof modules)[number]): React.ReactElement => (
    <Word
      key={mod.key}
      block
      lamp={LAMP[mod.ledState]}
      active={mod.ledState !== "all-off"}
      onClick={() => {
        if (longPressFired.current) {
          longPressFired.current = false;
          return;
        }
        handleModuleClick(mod.key);
      }}
      onPointerDown={() => {
        longPressFired.current = false;
        longPressTimer.current = setTimeout(() => {
          longPressFired.current = true;
          handleModuleToggleAll(mod.key);
        }, LONG_PRESS_MS);
      }}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      title={`${mod.label} — click to open, hold to toggle all`}
    >
      {mod.label}
    </Word>
  );

  const firstModule = modules[0];
  if (!firstModule) return null;

  return wrap(
    <>
      <div className="dbg-grid">
        {renderModuleWord(firstModule)}
        {renderAllWord("global")}
      </div>
      <WordDivider />
      <div className="dbg-grid">{modules.slice(1).map(renderModuleWord)}</div>
    </>,
  );
};

ModuleNav.displayName = "ModuleNav";
