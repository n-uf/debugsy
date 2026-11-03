# Debug Dependencies Module

**React Hook Dependency Tracking for Performance Debugging**

## 🏗️ Architecture Overview

This module has been **refactored and split by responsibilities** for better maintainability and clear separation of concerns.

### Dependencies as Debugsy Extension

- **Core Debugsy**: Handles all logging, state management, and UI integration
- **Dependencies Module**: Focuses only on React-specific tracking logic
- **Unified Interface**: Clean delegation to the core debugsy system

---

## 📁 Module Organization

### **📊 File Structure**

```
debug-deps/
├── debug-deps.ts           # Main React hooks orchestration (200 lines)
├── dependency-logger.ts    # Unified logging system (60 lines)
├── dependency-state.ts     # State access and management (35 lines)
├── change-tracking.ts      # Frequency detection & phase tracking (95 lines)
├── dependency-filters.ts   # Filtering logic for what to log (75 lines)
├── index.ts               # Module exports and documentation
└── README.md              # This file
```

### **🎯 Responsibility Matrix**

| Module                      | Responsibility            | Key Features                                                        |
| --------------------------- | ------------------------- | ------------------------------------------------------------------- |
| **`debug-deps.ts`**         | React Hooks Orchestration | `useWhyDidYouUpdate`, `useRenderTracker`, Rules of Hooks compliance |
| **`dependency-logger.ts`**  | Logging System            | Simple delegation to unified debugsy, level-aware logging           |
| **`dependency-state.ts`**   | State Management          | Unified state access, fallback logic, configuration interface       |
| **`change-tracking.ts`**    | Frequency Detection       | Smart pattern analysis, initialization phase tracking               |
| **`dependency-filters.ts`** | Filtering Logic           | Level/type/hook filtering, emergency stops, init-aware logic        |

---

## 🚀 Quick Start

### Basic Usage

```typescript
import { useWhyDidYouUpdate, useRenderTracker } from "@n-uf/debugsy";

// Track dependency changes
function MyComponent(props) {
  useWhyDidYouUpdate('MyComponent', props);
  return <div>...</div>;
}

// Track renders with warnings
function HighFreqComponent(props) {
  useRenderTracker('HighFreqComponent', props);
  return <div>...</div>;
}
```

### Advanced Configuration

```typescript
import { getDependencyState, shouldLogDependency } from "@n-uf/debugsy";

// Check current dependency tracking state
const state = getDependencyState();
console.log("Dependency tracking enabled:", state.enabled);

// Custom filtering logic
const shouldLog = shouldLogDependency("MyHook", "function", false);
```

---

## 🔧 Module Details

### **1. dependency-logger.ts** - Unified Logging System

**Responsibility**: Simple delegation to core debugsy logging

```typescript
class DependencyLogger {
  log(message: string, data?: any, level: LogLevel = "info"): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  critical(message: string, data?: any): void;
}

// Simple API
logToDebugSystem(message, data);
logWarnToDebugSystem(message, data);
logErrorToDebugSystem(message, data);
```

**Key Features**:

- ✅ Direct delegation to `globalThis.surfaceDebug`
- ✅ Automatic unified system initialization
- ✅ Level-aware logging (info, warn, error, critical)

---

### **2. dependency-state.ts** - State Management

**Responsibility**: Unified state access and configuration

```typescript
interface DependencyState {
  enabled: boolean;
  level: DependencyLogLevel;
  filter: DependencyFilter;
  allowedHooks: string[] | null;
  excludedHooks: string[];
  throttleMs: number;
}

getDependencyState(): DependencyState
```

**Key Features**:

- ✅ Unified system delegation with fallback
- ✅ Clean interface for dependency configuration
- ✅ Automatic state synchronization

---

### **3. change-tracking.ts** - Frequency Detection

**Responsibility**: Smart change pattern analysis and initialization tracking

```typescript
interface ChangeTrackingInfo {
  count: number;
  lastChange: number;
  isFrequent: boolean;
  firstSeen: number;
  changeIntervals: number[];
}

trackDependencyChange(hookName, propName, changeType): ChangeTrackingInfo
initializationPhase.getPhase(): "initialization" | "runtime"
```

**Key Features**:

- ✅ Smart frequency detection with progressive thresholds
- ✅ App initialization phase tracking (5-second detection)
- ✅ Pattern analysis using recent change intervals
- ✅ Different thresholds for functions vs objects vs primitives

---

### **4. dependency-filters.ts** - Filtering Logic

**Responsibility**: Determine what dependency changes should be logged

```typescript
shouldLogDependency(
  hookName: string,
  changeType: "function" | "object" | "primitive",
  isStable: boolean
): boolean
```

**Key Features**:

- ✅ Multi-level filtering (silent, quiet, normal, verbose, debug)
- ✅ Type-based filtering (functions, objects, primitives)
- ✅ Hook allow/exclude lists
- ✅ Emergency stop support
- ✅ Initialization-aware logic for better UX

---

### **5. debug-deps.ts** - React Hooks Orchestration

**Responsibility**: Main React hooks that tie everything together

```typescript
useWhyDidYouUpdate(name: string, props: Record<string, any>): void
useRenderTracker(name: string, props: Record<string, any>): void
```

**Key Features**:

- ✅ Rules of Hooks compliance (always call hooks in same order)
- ✅ Smart frequency detection with initialization-aware logic
- ✅ Performance-conscious throttling
- ✅ Detailed change analysis with type discrimination
- ✅ Excessive render warnings with throttling

---

## 📊 Benefits of Split Architecture

### **🎯 Clear Separation of Concerns**

- Each module has a single, well-defined responsibility
- Easier to understand and reason about individual components
- Reduced cognitive load when working on specific features

### **🧹 Improved Maintainability**

- Isolated changes don't affect unrelated functionality
- Easier to test individual components in isolation
- Cleaner module boundaries with clear interfaces

### **🔄 Better Code Reusability**

- Logging system can be used by other debug modules
- State management is centralized and reusable
- Filtering logic can be extended without affecting tracking

### **📚 Enhanced Documentation**

- Each module is self-documenting with focused responsibility
- Easier to onboard new developers with clear module structure
- Better IDE support with focused imports

### **⚡ Faster Development**

- Developers can work on specific aspects without understanding the entire system
- Reduced compilation times with focused modules
- Better debugging with isolated functionality

---

## 🔄 Migration Guide

### From Monolithic to Modular

**OLD** (Single file approach):

```typescript
// Everything was in debug-deps.ts (570+ lines)
import { useWhyDidYouUpdate } from "./debug-deps";
```

**NEW** (Modular approach):

```typescript
// Focused imports from specific modules
import { useWhyDidYouUpdate } from "./debug-deps";
import { logToDebugSystem } from "./dependency-logger";
import { getDependencyState } from "./dependency-state";
import { trackDependencyChange } from "./change-tracking";
import { shouldLogDependency } from "./dependency-filters";

// Or use the index.ts for convenience
import {
  useWhyDidYouUpdate,
  logToDebugSystem,
  getDependencyState,
} from "./index";
```

### Backward Compatibility

All existing exports are maintained through the `index.ts` file, ensuring **100% backward compatibility**.

---

## 🎉 Summary

**✅ Refactoring Complete**: Split by responsibilities for better architecture  
**✅ Maintained Functionality**: All existing features preserved  
**✅ Improved Organization**: Clear module boundaries and focused responsibilities  
**✅ Better Maintainability**: Easier to understand, test, and extend  
**✅ Backward Compatible**: No breaking changes for existing users

**Result**: A cleaner, more maintainable, and better-organized dependency tracking system! 🚀
