/**
 * Config module — public API
 */

export type {
  DebugPointDef,
  DebugModuleDef,
  TagDef,
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
  getTagDef,
  isKnownPoint,
  getModuleLedState,
  buildFlatConfig,
} from "./registry";

// Side-effect: register builtin modules on import
import "./builtin-modules";
