"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  DebugsyLook as DebugsyLookV1,
  type DebugsyLookProps as DebugsyLookV1Props,
} from "../debugsy-look-v1/debugsy-look";
import { getDebugsy } from "../debugsy-space";
import { setDebugDisplayContent } from "../shared/debug-display-state";
import { DebugsyLook as DebugsyLookV2 } from "./debugsy-look-impl";

export type UIVersion = "v1" | "v2" | "auto";

export interface DebugsyLookProps extends DebugsyLookV1Props {
  /**
   * UI version to render
   * - 'v1': Original debugsy-look UI components
   * - 'v2': Harbuz-based UI components (TerminalLayout)
   * - 'auto': Use config/env/localStorage to determine (default)
   */
  uiVersion?: UIVersion;
}

/**
 * DebugsyLook - Smart wrapper with parallel UI implementation support
 *
 * Supports toggling between V1 (current) and V2 (Harbuz-based) implementations
 * during the migration period. Toggle with:
 * - Keyboard: Cmd+Shift+D
 * - Props: uiVersion="v1" or uiVersion="v2"
 * - Config: dsy.config({ uiVersion: 'v2' })
 * - Env: NEXT_PUBLIC_DEBUGSY_UI_VERSION=v2
 *
 * After migration is complete, this wrapper will be removed.
 */
export const DebugsyLook: React.FC<DebugsyLookProps> = (props) => {
  const { uiVersion = "auto", ...restProps } = props;

  // Determine active version
  const [activeVersion, setActiveVersion] = useState<"v1" | "v2">(() =>
    resolveUIVersion(uiVersion)
  );

  // Update active version when uiVersion prop changes
  useEffect(() => {
    setActiveVersion(resolveUIVersion(uiVersion));
  }, [uiVersion]);

  // Toggle handler that updates state
  const handleToggle = useCallback(() => {
    const newVersion = activeVersion === "v1" ? "v2" : "v1";
    setActiveVersion(newVersion);

    // Persist to localStorage for dev preference
    if (typeof window !== "undefined") {
      localStorage.setItem("debugsy-ui-version", newVersion);
    }

    // Show notification
    setDebugDisplayContent({
      message: `UI Version: Switched to ${newVersion.toUpperCase()} ${
        newVersion === "v2" ? "(Harbuz UI)" : "(Original UI)"
      }`,
      type: "info",
      duration: 2000,
    });
  }, [activeVersion]);

  // Keyboard shortcut: Cmd+Shift+D to toggle UI version
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === "d") {
        e.preventDefault();
        handleToggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleToggle]);

  // Render appropriate version with shared props
  const sharedProps = {
    ...restProps,
    _uiVersion: activeVersion,
    _onToggleVersion: handleToggle,
  };

  if (activeVersion === "v2") {
    return <DebugsyLookV2 {...sharedProps} />;
  }

  return <DebugsyLookV1 {...sharedProps} />;
};

DebugsyLook.displayName = "DebugsyLook";

/**
 * Resolve which UI version to use based on priority:
 * 1. Explicit override (props)
 * 2. Runtime config
 * 3. Environment variable
 * 4. LocalStorage (dev preference)
 * 5. Default to v1 (safe during migration)
 */
function resolveUIVersion(override: UIVersion): "v1" | "v2" {
  // 1. Explicit override
  if (override && override !== "auto") {
    return override;
  }

  // 2. Runtime config
  try {
    const debugsy = getDebugsy();
    const runtimeVersion = debugsy.getUIVersion();
    if (runtimeVersion && runtimeVersion !== "auto") {
      return runtimeVersion;
    }
  } catch {
    // getDebugsy might throw if not initialized, that's ok
  }

  // 3. Environment variable
  if (
    typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_DEBUGSY_UI_VERSION === "v2"
  ) {
    return "v2";
  }

  // 4. LocalStorage (for dev preference persistence)
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("debugsy-ui-version");
    if (stored === "v2") return "v2";
    if (stored === "v1") return "v1";
  }

  // 5. Default to v1 (safe default during migration)
  return "v1";
}
