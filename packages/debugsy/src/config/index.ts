/**
 * Config module — public API
 */

export type {
  DebugPointDef,
  DebugModuleDef,
  LogTypeConfig,
  ModuleLedState,
} from "./types";

export {
  registerModule,
  getModules,
  getModuleDef,
  getPointDef,
  getModuleForPoint,
  getAllPointKeys,
  getModulePointKeys,
  getPointEmoji,
  getPointLabel,
  getLogTypeConfig,
  isKnownPoint,
  getModuleLedState,
  buildFlatConfig,
} from "./registry";

// Side-effect: register builtin modules on import
import "./builtin-modules";
