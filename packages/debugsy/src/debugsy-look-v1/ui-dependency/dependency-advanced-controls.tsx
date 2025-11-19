"use client";

import React from "react";
import {
  DependencyAdvancedPanel,
  type DependencyAdvancedPanelProps,
} from "../../debugsy-look/dependency-advanced-panel";

/**
 * @deprecated Compatibility wrapper for V1. Use DependencyAdvancedPanel from debugsy-look instead.
 */
export interface DebugDependencyAdvancedControlsProps
  extends DependencyAdvancedPanelProps {}

/**
 * @deprecated Compatibility wrapper. Use DependencyAdvancedPanel instead.
 *
 * Advanced dependency debugging controls with dark theme styling.
 * Now delegates to the shared DependencyAdvancedPanel component.
 */
export const DebugDependencyAdvancedControls: React.FC<
  DebugDependencyAdvancedControlsProps
> = (props) => {
  return <DependencyAdvancedPanel {...props} />;
};
