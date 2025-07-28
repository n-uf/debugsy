# Maximum Update Depth Error & Infinite Render Debugging

## 🚨 URGENT: Emergency Stop Commands

If you're experiencing infinite loops **right now**, use these emergency commands in your browser console:

### **Immediate Emergency Stop**

```javascript
// Open DevTools Console and run:
__DEBUGSY_EMERGENCY_STOP.activate(); // 🚨 Stop all infinite loops immediately
__DEBUGSY_EMERGENCY_STOP.status(); // 🔍 Check current status
__DEBUGSY_EMERGENCY_STOP.deactivate(); // ✅ Restore normal operation when ready
```

### **What This Does**

- **Immediately disables** all debug console logging that causes infinite loops
- **Shows status** of how many logs were suppressed from each hook
- **Allows you to restore** normal operation once you've applied the fixes

### **Root Cause Fixed** ✅

The main cause of your infinite loop was:

- **`viewport` object** being recreated on every render in `useSurfaceViewport`
- **Fixed by**: Memoizing the viewport object with `useMemo`
- **Circuit breakers added** to all console.log statements to prevent browser crashes

---

## Overview

The Surface package includes specialized debugging utilities designed to identify and resolve **"Maximum update depth exceeded"** errors and **infinite re-render loops**. These tools provide real-time visibility into what's causing components to re-render and help pinpoint the exact source of performance issues.

## 🚨 When to Use This

### Common Symptoms

- **"Maximum update depth exceeded"** errors
- Browser freezing or becoming unresponsive
- Excessive console logging from useEffect hooks
- Performance degradation during interactions
- React DevTools showing hundreds of renders per second

### Root Causes

- **Unstable useCallback/useMemo dependencies**
- **Object/function recreation on every render**
- **useEffect with changing dependencies**
- **State updates triggering more state updates**

## 🔧 Debug Utilities

### `useWhyDidYouUpdate(name, props)`

Tracks which dependencies changed between renders and logs detailed information.

```typescript
import { useWhyDidYouUpdate } from "@workspace/surface";

const MyComponent = ({ onCallback, data, config }) => {
  // Track all props to see what's changing
  useWhyDidYouUpdate("MyComponent", {
    onCallback,
    data,
    config,
  });

  // Your component logic...
};
```

#### Output Example

```javascript
🔄 [MyComponent] Dependencies changed: {
  onCallback: { from: function, to: function },
  data: { from: {...}, to: {...} }
}
📝 [MyComponent] onCallback: function changed (function → function)
📦 [MyComponent] data: object changed { from: {...}, to: {...} }
```

### `useRenderTracker(name, props)`

Enhanced version that also tracks render count and warns about excessive renders.

```typescript
import { useRenderTracker } from "@workspace/surface";

const MyComponent = (props) => {
  // Combines dependency tracking with render counting
  useRenderTracker("MyComponent", props);

  // Warns when render count > 10
  // ⚠️ [MyComponent] High render count detected: 15
};
```

## 🔍 Algorithm: Finding Maximum Update Depth Error Source

### **Step 1: Identify the Loop Pattern**

When React throws "Maximum update depth exceeded", follow this systematic approach:

#### **1.1 Open Browser DevTools Console**

```javascript
// Look for this sequence of events repeating rapidly:
🔄 [ComponentName] Dependencies changed: {...}
🔄 [ComponentName.useMemo] Recalculating...
🔄 [ComponentName.useEffect] Triggered...
⚠️ [ComponentName] High render count detected: 15+
```

#### **1.2 Identify Loop Frequency**

```javascript
// Count how many times the same component renders in 1 second
// Healthy: 1-3 renders per user interaction
// Problem: 10+ renders per second without user action
```

### **Step 2: Trace the Dependency Chain**

#### **2.1 Find the Root Component**

```javascript
// Look for the component with the highest render count
⚠️ [Surface] High render count detected: 25        // ← ROOT PROBLEM
🔄 [useMouseDispatcher] Render #24
🔄 [useSurfaceInteraction] Render #23
```

#### **2.2 Follow the Dependency Path**

```javascript
// Trace the chain of changes:
🔄 [Surface] Dependencies changed: { onViewportChange: {...} }
  ↓ (causes)
🔄 [useSurfaceInteraction] Dependencies changed: { onPan: {...} }
  ↓ (causes)
🔄 [useSurfaceInteraction.handler.useMemo] Recreating handler object
  ↓ (causes)
🔄 [Surface.interactions.useMemo] Recalculating interactions array
  ↓ (causes)
🔄 [useMouseDispatcher.useEffect] Triggered - updating handlers
  ↓ (causes)
🔄 [Surface] Dependencies changed: { ... } // ← LOOPS BACK TO START
```

#### **2.3 Identify the Circular Reference**

```javascript
// The dependency that appears at both START and END of the chain
START: 🔄 [Surface] Dependencies changed: { selectionInteractionHandler: {...} }
...chain of effects...
END:   🔄 [Surface] Dependencies changed: { selectionInteractionHandler: {...} }
//     ↑ SAME DEPENDENCY = CIRCULAR REFERENCE
```

### **Step 3: Categorize the Problem Type**

#### **Type A: Callback Recreation Loop**

```javascript
// Pattern: Function dependencies changing every render
📝 [Surface] onViewportChange: function changed (function → function)
📝 [Surface] onFrameChange: function changed (function → function)

// Fix: Memoize callbacks with useCallback
```

#### **Type B: Object Recreation Loop**

```javascript
// Pattern: Object/array dependencies changing every render
📦 [Surface] interactions: object changed
📦 [Surface] selectionState: object changed

// Fix: Memoize objects with useMemo
```

#### **Type C: useEffect Dependency Loop**

```javascript
// Pattern: useEffect running constantly due to unstable dependency
🔄 [useMouseDispatcher.useEffect] Triggered - updating handlers
🔄 [useMouseDispatcher.useEffect] Triggered - updating handlers

// Fix: Remove unstable dependency or use useRef
```

### **Step 4: Apply Targeted Fix**

Based on the problem type identified:

```typescript
// Type A Fix: Callback Recreation
const handleViewportChange = useCallback(
  (viewport) => {
    // callback logic
  },
  [stableDependencies]
); // ← Only stable dependencies

// Type B Fix: Object Recreation
const interactions = useMemo(
  () => [...frameHandlers, selectionHandler, surfaceHandler],
  [frameHandlers, selectionHandler, surfaceHandler]
); // ← Memoize

// Type C Fix: useEffect Dependency
const debugRef = useRef(debug);
debugRef.current = debug;
useEffect(() => {
  debugRef.current.log("message");
}, []); // ← No unstable dependencies
```

## 📊 Log Filtering: Isolating Relevant Messages

### **Browser Console Filtering**

#### **Filter 1: High Render Count Warnings**

```javascript
// In DevTools Console, filter by:
"High render count detected"

// Shows only components with excessive renders
⚠️ [Surface] High render count detected: 25
⚠️ [useMouseDispatcher] High render count detected: 22
```

#### **Filter 2: Dependency Changes**

```javascript
// Filter by:
"Dependencies changed"

// Shows what's triggering re-renders
🔄 [Surface] Dependencies changed: { onViewportChange: {...} }
🔄 [useSurfaceInteraction] Dependencies changed: { onPan: {...} }
```

#### **Filter 3: Function Changes**

```javascript
// Filter by:
"function changed"

// Shows unstable callbacks
📝 [Surface] onViewportChange: function changed (function → function)
📝 [Surface] onFrameChange: function changed (function → function)
```

#### **Filter 4: Object Changes**

```javascript
// Filter by:
"object changed"

// Shows object recreation issues
📦 [Surface] interactions: object changed
📦 [Surface] selectionState: object changed
```

#### **Filter 5: useEffect Triggers**

```javascript
// Filter by:
"useEffect] Triggered"

// Shows effect re-runs
🔄 [useMouseDispatcher.useEffect] Triggered - updating handlers
🔄 [Surface.interactions.useEffect] Triggered - interactions updated
```

### **Advanced Filtering Combinations**

#### **Find Component-Specific Issues**

```javascript
// Filter by component name:
"[Surface]";
"[useMouseDispatcher]";
"[useSurfaceInteraction]";

// Focus on specific component's render cycle
```

#### **Find Function Recreation Patterns**

```javascript
// Multiple filters combined (use regex in DevTools):
/(function changed|object changed|High render count)/;

// Shows all instability indicators together
```

#### **Find Circular Dependencies**

```javascript
// Filter for the same dependency appearing multiple times:
"selectionInteractionHandler";
"onViewportChange";

// If the same prop appears in rapid succession = circular reference
```

### **Timeline Analysis**

#### **Healthy Pattern (Good)**

```javascript
// Timestamps should be far apart
10:34:12.123 🔄 [Surface] Render #1
10:34:15.456 🔄 [Surface] Render #2  // 3+ seconds later = user interaction
```

#### **Infinite Loop Pattern (Bad)**

```javascript
// Timestamps very close together (milliseconds apart)
10:34:12.123 🔄 [Surface] Render #15
10:34:12.125 🔄 [Surface] Render #16  // 2ms later = infinite loop
10:34:12.127 🔄 [Surface] Render #17  // 2ms later = infinite loop
```

## 🛑 Automatic Circuit Breaker Protection

### **🚨 NEW: Automatic Hook Disabling**

The Surface debug system now includes **automatic circuit breaker protection** that can disable hooks when excessive renders are detected, preventing browser crashes!

#### **Basic Usage: `useCircuitBreakerTracker`**

```typescript
import { useCircuitBreakerTracker } from "@workspace/surface";

const MyComponent = (props) => {
  const { isDisabled, renderCount } = useCircuitBreakerTracker(
    "MyComponent",
    props,
    {
      maxRenders: 15,      // Disable after 15 renders (default)
      resetInterval: 5000, // Auto-restore after 5 seconds
      autoRestore: true,   // Automatically re-enable (default)
    }
  );

  if (isDisabled) {
    return <div>⚠️ Component temporarily disabled due to excessive renders</div>;
  }

  // Normal component logic...
  return <div>Component working normally (renders: {renderCount})</div>;
};
```

#### **Advanced Usage: `useSafeHook`**

```typescript
import { useSafeHook } from "@workspace/surface";

const MyComponent = () => {
  // Automatically disable unstable hook execution
  const selectionState = useSafeHook(
    "useSelectionState",
    () => useSelectionState({ /* options */ }),
    { selectedFrames: [], selectionBox: null }, // Fallback value
    { maxRenders: 12 }
  );

  const frameInteraction = useSafeHook(
    "useFrameInteraction",
    () => useFrameInteraction({ /* options */ }),
    { handler: { id: "disabled", priority: 999, hitTest: () => null } },
    { maxRenders: 20 }
  );

  // Use normally - if hooks get disabled, fallback values are used
  return (
    <div>
      Selected frames: {selectionState.selectedFrames.length}
      Frame handler: {frameInteraction.handler.id}
    </div>
  );
};
```

#### **Emergency Global Stop**

```typescript
import { emergencyStop } from "@workspace/surface";

// In browser console or component:
emergencyStop.activate();   // 🚨 Disables ALL protected hooks globally
emergencyStop.deactivate(); // ✅ Restore all hooks

// Example usage in a debug panel:
const DebugPanel = () => {
  return (
    <div>
      <button onClick={() => emergencyStop.activate()}>
        🚨 Emergency Stop All Hooks
      </button>
      <button onClick={() => emergencyStop.deactivate()}>
        ✅ Restore All Hooks
      </button>
    </div>
  );
};
```

### **🎛️ Circuit Breaker Control**

#### **Manual Control**

```typescript
import { circuitBreakerControl } from "@workspace/surface";

// Check status
const isOpen = circuitBreakerControl.isOpen("useMouseDispatcher");
const status = circuitBreakerControl.getStatus("useMouseDispatcher");
console.log(status); // { isOpen: false, renderCount: 5, lastReset: 1234567890 }

// Manual control
circuitBreakerControl.open("useMouseDispatcher"); // 🛑 Disable hook
circuitBreakerControl.close("useMouseDispatcher"); // 🔄 Re-enable hook
circuitBreakerControl.resetAll(); // 🔄 Reset all breakers

// List all circuit breakers
const allBreakers = circuitBreakerControl.listAll();
console.log(allBreakers);
// [{ name: "useMouseDispatcher", isOpen: false, renderCount: 8 }]
```

#### **Console Commands**

```javascript
// Available in browser console:
circuitBreakerControl.listAll(); // Show all circuit breaker status
circuitBreakerControl.resetAll(); // Reset all circuit breakers
emergencyStop.activate(); // Global emergency stop
emergencyStop.deactivate(); // Restore all functionality
```

### **🔧 Surface Component Integration**

#### **Protected Surface Hook Usage**

```typescript
import { useSafeHook, useEmergencySafeHook } from "@workspace/surface";

const Surface = ({ children, enableSelection, ...props }) => {
  // Protect critical hooks with circuit breakers
  const mouseDispatcher = useSafeHook(
    "useMouseDispatcher",
    () => useMouseDispatcher({ canvas, viewport, interactions }),
    { registerHandler: () => {}, unregisterHandler: () => {} },
    {
      maxRenders: 20,
      onBreak: (name, count) => {
        console.error(`🚨 ${name} disabled after ${count} renders`);
        // Could trigger user notification here
      },
      onRestore: (name) => {
        console.log(`✅ ${name} restored and working normally`);
      },
    }
  );

  const selectionState = useEmergencySafeHook(
    "useSelectionState",
    () => useSelectionState({ frameData }),
    { selectedFrames: [], selectionBox: null },
    { maxRenders: 15 }
  );

  // Rest of component...
};
```

### **📊 Circuit Breaker Console Output**

#### **Automatic Protection Activated**

```javascript
⚠️ [useMouseDispatcher] High render count detected: 15
🚨 [useMouseDispatcher] CIRCUIT BREAKER OPEN - Excessive renders detected: 16
🛑 [useMouseDispatcher] Hook disabled to prevent infinite loop
🛑 [useMouseDispatcher] Hook execution skipped (circuit breaker open)
```

#### **Automatic Recovery**

```javascript
🔄 [useMouseDispatcher] Circuit breaker auto-restored
✅ [useMouseDispatcher] Hook restored and working normally
```

#### **Emergency Stop**

```javascript
🚨 EMERGENCY STOP ACTIVATED - All protected hooks disabled
🚨 [useSelectionState] Hook execution blocked (emergency stop active)
🚨 [useFrameInteraction] Hook execution blocked (emergency stop active)
✅ Emergency stop deactivated - Hooks restored
```

### **⚡ Benefits**

1. **🛡️ Prevents Browser Crashes**: Automatically stops infinite loops before they crash the browser
2. **🔄 Auto-Recovery**: Automatically re-enables hooks after a cooling-off period
3. **🎯 Targeted Protection**: Only disables problematic hooks, not the entire app
4. **📊 Detailed Logging**: Clear feedback about what was disabled and why
5. **🎛️ Manual Override**: Full manual control for testing and debugging
6. **🚨 Emergency Stop**: Global kill switch for all protected hooks

This automated protection system ensures your Surface app remains stable even when debugging complex infinite loop issues! 🚀

## 🎯 Integration Points

### Surface Component Integration

The dependency tracking is already integrated into key Surface architecture components:

#### Surface Component

```typescript
// Tracks all Surface props for changes
useWhyDidYouUpdate("Surface", {
  initialWidth,
  initialHeight,
  snapToGrid,
  enableGrid,
  gridSize,
  readonly,
  className,
  children,
  autoLayout,
  enableSelection,
  onViewportChange,
  onFrameChange,
});

// Tracks interactions array dependencies
useWhyDidYouUpdate("Surface.interactions", {
  frameHandlers,
  enableSelection,
  selectionInteractionHandler: selectionInteraction.handler,
  surfaceInteractionHandler: surfaceInteraction.handler,
});
```

#### useMouseDispatcher

```typescript
// Tracks dispatcher options for changes
useWhyDidYouUpdate("useMouseDispatcher", {
  canvas,
  viewport,
  initialInteractions,
  debugEnabled,
  throttleMs,
  maxRoutingHistory,
});
```

#### Interaction Hooks

```typescript
// useSurfaceInteraction
useWhyDidYouUpdate("useSurfaceInteraction", {
  viewport,
  frameHandlers,
  onSelectionStart,
  onSelectionUpdate,
  onSelectionEnd,
  onGroupMove,
  onGroupResize,
});

// useSurfaceInteraction
useWhyDidYouUpdate("useSurfaceInteraction", {
  viewport,
  onPan,
  onZoom,
});
```

## 📊 Console Output Interpretation

### Healthy Patterns

```javascript
// Initial render - normal
🔄 [Surface] Render #1

// Occasional updates due to user interaction - normal
🔄 [Surface] Dependencies changed: { enableSelection: { from: false, to: true } }

// Handler registration on mount - normal
🔄 [useMouseDispatcher.useEffect] Triggered - updating handlers
```

### Infinite Loop Patterns

```javascript
// High render count - RED FLAG
⚠️ [Surface] High render count detected: 25

// Rapid dependency changes - RED FLAG
🔄 [Surface] Dependencies changed: { selectionInteractionHandler: {...} }
🔄 [Surface.interactions.useMemo] Recalculating interactions array
🔄 [useMouseDispatcher.useEffect] Triggered - updating handlers
🔄 [Surface] Dependencies changed: { selectionInteractionHandler: {...} }
📦 [Surface] selectionInteractionHandler: object changed

// Function recreation loops - RED FLAG
📝 [Surface] onViewportChange: function changed (function → function)
📝 [Surface] onFrameChange: function changed (function → function)
```

### Critical Indicators

```javascript
// Same dependency changing repeatedly
🔄 [Surface] Dependencies changed: { onCallback: {...} }
🔄 [Surface] Dependencies changed: { onCallback: {...} }  // ← Same prop changing again
🔄 [Surface] Dependencies changed: { onCallback: {...} }  // ← INFINITE LOOP!

// Object recreation patterns
📦 [Surface] selectionInteractionHandler: object changed
📦 [Surface] surfaceInteractionHandler: object changed
📦 [Surface] frameHandlers: object changed               // ← Objects changing every render
```

## 🔍 Debugging Workflow

### Step 1: Enable Console Monitoring

```javascript
// Open browser DevTools Console
// Look for the debug logs automatically generated
```

### Step 2: Identify the Loop Source

```javascript
// Look for patterns like:
1. High render count warnings (⚠️)
2. Rapid consecutive dependency changes
3. Same objects/functions changing repeatedly
4. Handler recreations followed by useEffect triggers
```

### Step 3: Trace the Dependency Chain

```javascript
// Example chain:
🔄 [Surface] Dependencies changed: { onViewportChange: {...} }
  ↓
🔄 [useSurfaceInteraction] Dependencies changed: { onPan: {...} }
  ↓
🔄 [useSurfaceInteraction.handler.useMemo] Recreating handler object
  ↓
🔄 [Surface.interactions.useMemo] Recalculating interactions array
  ↓
🔄 [useMouseDispatcher.useEffect] Triggered - updating handlers
  ↓
🔄 [Surface] Dependencies changed: { ... } // BACK TO START
```

### Step 4: Apply Fixes Based on Root Cause

## 🛠️ Common Fixes

### 1. Unstable Callback Props

```typescript
// ❌ PROBLEM: Function recreated every render
const MyComponent = ({ data }) => {
  return (
    <Surface
      onViewportChange={(viewport) => {
        console.log("Viewport changed", viewport, data); // Captures 'data'
      }}
    />
  );
};

// ✅ SOLUTION: Memoize callback
const MyComponent = ({ data }) => {
  const handleViewportChange = useCallback((viewport) => {
    console.log("Viewport changed", viewport, data);
  }, [data]); // Stable unless 'data' changes

  return <Surface onViewportChange={handleViewportChange} />;
};
```

### 2. Object Recreation in Dependencies

```typescript
// ❌ PROBLEM: Object recreated every render
const interactions = [...frameHandlers, selectionHandler, surfaceHandler]; // New array every render

// ✅ SOLUTION: Memoize array
const interactions = useMemo(
  () => [...frameHandlers, selectionHandler, surfaceHandler],
  [frameHandlers, selectionHandler, surfaceHandler]
);
```

### 3. useEffect with Unstable Dependencies

```typescript
// ❌ PROBLEM: Debug object changes every render
useEffect(() => {
  if (debug.enabled) {
    debug.log("Component updated");
  }
}, [debug]); // debug object is unstable

// ✅ SOLUTION: Use ref to avoid dependency
const debugRef = useRef(debug);
debugRef.current = debug;

useEffect(() => {
  if (debugRef.current.enabled) {
    debugRef.current.log("Component updated");
  }
}, []); // No dependencies on debug object
```

### 4. State Dependencies in Callbacks

```typescript
// ❌ PROBLEM: State object as dependency
const deleteItems = useCallback(() => {
  selectedItems.forEach((item) => {
    onDelete(item.id);
  });
}, [selectedItems, onDelete]); // selectedItems changes frequently

// ✅ SOLUTION: Access current state in callback
const deleteItems = useCallback(() => {
  setSelectedItems((currentItems) => {
    currentItems.forEach((item) => {
      onDelete(item.id);
    });
    return []; // Clear selection
  });
}, [onDelete]); // Only stable dependencies
```

## 🎯 Surface-Specific Debugging

### Selection System Loops

```javascript
// Watch for selection callback recreation
🔄 [useSurfaceInteraction] Dependencies changed: {
  onSelectionStart: { from: function, to: function }
}

// Common fix: Memoize selection callbacks in Surface component
const handleSelectionStart = useCallback((startPoint) => {
  if (enableSelection) selectionState.startSelection(startPoint);
}, [enableSelection, selectionState.startSelection]);
```

### Frame Handler Registration Loops

```javascript
// Watch for frame handler changes
🔄 [Surface.interactions] Dependencies changed: { frameHandlers: {...} }

// Check that frame registration callbacks are stable
const registerFrameHandler = useCallback((handler) => {
  setFrameHandlers(prev => [...prev.filter(h => h.id !== handler.id), handler]);
}, []); // No dependencies to ensure stability
```

### Viewport Callback Loops

```javascript
// Watch for viewport callback recreation
🔄 [useSurfaceInteraction] Dependencies changed: { onPan: {...}, onZoom: {...} }

// Ensure viewport callbacks are memoized in parent
const handlePan = useCallback((delta) => {
  viewport.panBy(delta);
}, [viewport.panBy]); // Only depend on stable methods
```

## 📈 Performance Impact

### Before Dependency Tracking

- Infinite loops could run for minutes before crashing
- No visibility into which dependencies were unstable
- Trial-and-error debugging process
- Manual inspection of useEffect dependencies

### After Dependency Tracking

- **Immediate identification** of loop sources
- **Real-time monitoring** of dependency changes
- **Specific guidance** on which props/callbacks are unstable
- **Faster resolution** of performance issues

## 🔧 Advanced Usage

### Custom Component Debugging

```typescript
// Add to any component suspected of excessive renders
const MyCustomComponent = (props) => {
  useWhyDidYouUpdate("MyCustomComponent", props);

  // Component logic...
};
```

### Selective Property Tracking

```typescript
// Track only specific props you suspect
useWhyDidYouUpdate("MyComponent", {
  suspiciousCallback: props.onCallback,
  suspiciousObject: props.data,
  // Ignore stable props
});
```

### Production Safety

```typescript
// Only enable in development
if (process.env.NODE_ENV === "development") {
  useWhyDidYouUpdate("MyComponent", props);
}
```

## 🚀 Integration with Main Debug System

### Combined Usage

```javascript
// Enable main debug system
surfaceDebug.enable("dispatcher");
surfaceDebug.enable("surface-interactions");

// Dependency tracking runs automatically
// Look for both debug systems in console:
🎯 [dispatcher] 🔄 Handlers updated {...}        // Main debug system
🔄 [Surface] Dependencies changed: {...}         // Dependency tracking
```

### Complementary Information

- **Main debug system**: Shows what events and interactions are happening
- **Dependency tracking**: Shows why components are re-rendering
- **Combined**: Complete picture of performance issues

## 📋 Troubleshooting Checklist

### When Maximum Update Depth Occurs:

1. **✅ Check Console Logs**

   - Look for `⚠️ High render count detected`
   - Identify components with excessive renders

2. **✅ Find Dependency Changes**

   - Look for `🔄 Dependencies changed` logs
   - Focus on functions/objects changing repeatedly

3. **✅ Trace the Loop Chain**

   - Follow the sequence of dependency changes
   - Identify the circular dependency pattern

4. **✅ Apply Appropriate Fix**

   - Memoize unstable callbacks
   - Fix object recreation
   - Remove problematic dependencies

5. **✅ Verify Fix**
   - Render count should stay low
   - Dependency changes should be minimal
   - No more excessive logging

## 🎯 Success Indicators

### Healthy Application

```javascript
// Low, stable render counts
🔄 [Surface] Render #1
🔄 [Surface] Render #2  // Only on real changes

// Minimal dependency changes
🔄 [Surface] Dependencies changed: { enableSelection: { from: false, to: true } }
// (Only when user actually toggles selection)

// Stable handler creation
🔄 [useSurfaceInteraction.handler.useMemo] Recreating handler object
// (Only once on mount, not repeatedly)
```

### Fixed Infinite Loop

```javascript
// Before fix:
⚠️ [Surface] High render count detected: 25

// After fix:
🔄 [Surface] Render #3
// (Stable, no more warnings)
```

---

## Quick Reference

### Essential Debug Commands

```javascript
// Open DevTools Console and look for:
⚠️ High render count detected    // Infinite loop indicator
🔄 Dependencies changed          // Shows what's changing
📝 function changed              // Callback instability
📦 object changed                // Object recreation

// Quick fixes:
useCallback(fn, [stableDeps])    // Fix callback recreation
useMemo(() => obj, [stableDeps]) // Fix object recreation
useRef(value)                    // Avoid dependencies

// Circuit breaker protection:
useSafeHook(name, hookFn, fallback)          // Auto-disable on excessive renders
circuitBreakerControl.resetAll()             // Reset all protection
emergencyStop.activate()                     // Global emergency stop
```

This debugging system makes infinite loop resolution fast and precise, turning hours of investigation into minutes of targeted fixes! 🎯
