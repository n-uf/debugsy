/**
 * Debug Point Configuration — Compatibility Layer
 *
 * Derives a flat config object from the module registry.
 * Legacy code that imports DEBUG_POINT_CONFIG continues to work
 * without changes; new code should use the registry directly.
 */

import { buildFlatConfig } from "../config";

export const DEBUG_POINT_CONFIG = buildFlatConfig();
