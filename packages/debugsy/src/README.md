# Debugsy Package Structure

## Overview

The debugsy package has been reorganized into three main modules following a clean architecture pattern:

## 📁 Structure

```
src/
├── shared/           # Core debug infrastructure
├── debug-deps/       # Dependency tracking system
├── debug-logs/       # Logging system
└── hooks/           # Legacy compatibility (deprecated)
```

## 📋 Module Breakdown

### `shared/` - Core Debug Infrastructure

**Purpose**: Core debug system shared across all modules

**Contents**:

- `global-debug-manager.ts` - Unified global debug manager (replaces multiple globals)
- `debug-constants.ts` - Debug points, types, and constants
- `debug-state.ts` - Global debug state management
- `index.ts` - Shared module exports

**Key Features**:

- ✅ **Unified global object**: `globalThis.surfaceDebug`
- ✅ **Proper TypeScript types**: No more `any` usage
- ✅ **Emergency controls**: Circuit breaker system integration
- ✅ **Core types**: DebugPoint, LogLevel, etc.

### `debug-deps/` - Dependency Tracking System

**Purpose**: React dependency change tracking and infinite render protection

**Contents**:

- `debug-deps.ts` - Dependency tracking hooks and circuit breakers
- `index.ts` - Dependency module exports
- `_agent/` - Documentation and guides

**Key Features**:

- ✅ **Infinite loop detection**: `useWhyDidYouUpdate()`
- ✅ **Circuit breakers**: `useCircuitBreakerTracker()`
- ✅ **Safe hooks**: `useSafeHook()`, `useEmergencySafeHook()`
- ✅ **Emergency stop**: Global protection system

### `debug-logs/` - Logging System

**Purpose**: All logging-related functionality

**Contents**:

- `hooks/` - Logging hooks (useDebug, useDebugSubscription, health-snapshot)
- `components/` - UI components for debug panels and controls
- `utils/` - Logging utilities (sanitization, formatters)
- `index.ts` - Logging module exports

**Key Features**:

- ✅ **Main debug hook**: `useDebug()` - now stable singleton
- ✅ **UI components**: DebugControlPanel, DebugExternalPanel, etc.
- ✅ **Log formatters**: JSON display, dependency analysis, health metrics
- ✅ **Data sanitization**: Heavy object protection

### `hooks/` - Legacy Compatibility (Deprecated)

**Purpose**: Backward compatibility during transition

**Contents**:

- `index.ts` - Re-exports from new locations

**Status**: ⚠️ **Deprecated** - Use imports from main package or specific modules

## 🚀 Usage

### Main Package Import (Recommended)

```typescript
import {
  useDebug,
  useWhyDidYouUpdate,
  DebugControlPanel,
} from "@n-uf/debugsy";
```

### One entry point

The package exposes only its root: everything public is re-exported from
`@n-uf/debugsy`. The folders under `src/` are internal.

### Global Usage

```typescript
// In browser console - all unified under one object:
surfaceDebug.log("my-point", "message", data);
surfaceDebug.deps.verbose();
surfaceDebug.emergency.activate();
```

## ✅ Benefits of New Structure

| **Before**                            | **After**                    |
| ------------------------------------- | ---------------------------- |
| Fragmented across hooks/, components/ | **Organized by purpose**     |
| Multiple global objects               | **Single unified global**    |
| Mixed `any` and proper types          | **Fully typed throughout**   |
| Circular dependencies                 | **Clean module boundaries**  |
| Infinite render loops                 | **Stable singleton pattern** |

## 🔧 Migration Guide

### For Existing Code:

1. **Main imports**: Already working via main package exports
2. **Legacy imports**: Temporary compatibility via `hooks/index.ts`
3. **Global usage**: `surfaceDebug` object enhanced with all features

### Breaking Changes:

- ❌ Direct imports from `src/hooks/` will need updating
- ❌ `useDebugSubscription()` no longer needed in most components
- ✅ All main package exports remain the same

## 🎯 Key Improvements

1. **No More Infinite Loops**: Fixed via stable singleton pattern
2. **Unified Global Object**: One `surfaceDebug` instead of multiple
3. **Proper TypeScript**: No more `(globalThis as any)`
4. **Clean Architecture**: Modules have clear responsibilities
5. **Backward Compatibility**: Existing code continues to work
