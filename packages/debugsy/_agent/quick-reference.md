# Debugsy - Quick Reference Guide

## 🚨 **Emergency: "Maximum Update Depth Exceeded"**

**React crashing with infinite renders? Use this immediately:**

```typescript
// 1. TRACK CAUSALITY (add to problematic component)
useWhyDidYouUpdate('ComponentName', props);
useRenderTracker('ComponentName', props, { enableFrequencyWarnings: true });

// 2. EMERGENCY STOP (if browser unresponsive)
// In browser console:
__DEBUGSY_EMERGENCY_STOP.activate();
```

```javascript
// 3. LOOK FOR: ⚠️ FREQUENT warnings in console - these are your culprits!
// Example output:
// 📝 [ComponentName] onCallback: function changed ⚠️ FREQUENT
// 📦 [ComponentName] data: object changed ⚠️ FREQUENT
```

## 🚀 **Essential Commands**

### **Console Commands (Copy & Paste)**

```javascript
// Test if dependency tracking works
debugsy.test.dependency();

// Check debug system status
debugsy.status.show();

// Enable/disable debug points
debugsy.enable("surface-interaction");
debugsy.disable("surface-interaction");
debugsy.enableAll();
debugsy.disableAll();

// Emergency stop
__DEBUGSY_EMERGENCY_STOP.activate();
debugsy.emergency.activate(); // Alternative API
```

### **React Hooks (Quick Copy)**

```typescript
// Basic logging
const { log } = useDebugsy("surface-interaction");
log("User action", { action: "click", target: "button" });

// Track re-renders
useWhyDidYouUpdate("MyComponent", { prop1, prop2, callback });

// Monitor render frequency
useRenderTracker("MyComponent", props, {
  enableTracking: true,
  enableFrequencyWarnings: true,
});
```

---

## 📋 **Component Setup**

### **Minimal Debug Setup**

```typescript
// App.tsx
import { DebugsyLook } from '@n-uf/debugsy';

function App() {
  return (
    <div>
      <YourApp />
      {process.env.NODE_ENV === 'development' && <DebugsyLook />}
    </div>
  );
}
```

### **Component with Debug Logging**

```typescript
import { useDebugsy, useWhyDidYouUpdate } from '@n-uf/debugsy';

const MyComponent = ({ data, onSave, config }) => {
  const { log } = useDebugsy('surface-interaction');
  useWhyDidYouUpdate('MyComponent', { data, onSave, config });

  const handleAction = () => {
    log('Action performed', { userId: data.id });
    onSave(data);
  };

  return <button onClick={handleAction}>Action</button>;
};
```

---

## 🔍 **Debugging Workflows**

### **1. Component Re-rendering Issues**

```typescript
// Add to problematic component
useWhyDidYouUpdate("ProblematicComponent", props);

// Enable verbose tracking
surfaceDebug.deps.verbose();

// Look for these warnings:
// 📝 [Component] callback: function changed ⚠️ FREQUENT
// 📦 [Component] config: object changed ⚠️ FREQUENT
```

**Fix patterns:**

```typescript
// ❌ Unstable callback
const handleClick = () => doSomething(data);

// ✅ Stable callback
const handleClick = useCallback(() => doSomething(data), [data]);

// ❌ Unstable object
const config = { theme: "dark", userId: user.id };

// ✅ Stable object
const config = useMemo(() => ({ theme: "dark", userId: user.id }), [user.id]);
```

### **2. Performance Issues**

```typescript
// Monitor render frequency
useRenderTracker("Component", props, {
  enableTracking: true,
  enableFrequencyWarnings: true,
});

// Check status
debugsy.status.show(); // See debug state
```

### **3. Custom Debug Points**

```typescript
// Create custom logging
const { log } = useDebugsy('my-feature');
log('Custom event', { customData });

// Enable/disable via console
debugsy.enable('my-feature');
debugsy.disable('my-feature');

// Register custom formatter
registerFormatter('my-feature', {
  shouldExpand: (log) => log.point === 'my-feature',
  expansionContent: (log) => <MyCustomView log={log} />
});
```

---

## ⚡ **Common Console Commands**

```javascript
// DEBUG POINTS CONTROL
debugsy.enable("surface-interaction"); // Enable specific
debugsy.disable("surface-interaction"); // Disable specific
debugsy.enableAll(); // Enable all
debugsy.disableAll(); // Disable all
debugsy.toggle("surface-interaction"); // Toggle

// STATUS & DIAGNOSTICS
debugsy.status.show(); // Show current state
debugsy.captureHealthSnapshot(); // Health report
debugsy.test.dependency(); // Test dependency tracking

// EMERGENCY CONTROLS
__DEBUGSY_EMERGENCY_STOP.activate(); // Stop all
__DEBUGSY_EMERGENCY_STOP.status(); // Check status
__DEBUGSY_EMERGENCY_STOP.deactivate(); // Resume
debugsy.emergency.activate(); // Alternative API
debugsy.emergency.status(); // Alternative status

// UI VERSION CONTROL
debugsy.setUIVersion("v1"); // Switch to V1
debugsy.setUIVersion("v2"); // Switch to V2
debugsy.setUIVersion("auto"); // Auto mode
debugsy.getUIVersion(); // Get current
```

---

## 🔧 **Import Patterns**

```typescript
// Core hooks
import {
  useDebugsy,
  useWhyDidYouUpdate,
  useRenderTracker,
} from "@n-uf/debugsy";

// Components
import {
  DebugsyLook,
  DebugsyLookV1,
  DebugsyLookV2,
  DebugLogsList,
} from "@n-uf/debugsy";

// Utilities
import {
  registerFormatter,
  sanitizeLogData,
  captureHealthSnapshot,
} from "@n-uf/debugsy";

// Types
import type {
  DebugLogEntry,
  LogLevel,
  DebugPoint,
  FormatterConfig,
} from "@n-uf/debugsy";
```

---

## 🚨 **Troubleshooting Quick Fixes**

| Problem                             | Quick Fix                                                 |
| ----------------------------------- | --------------------------------------------------------- |
| **"Maximum update depth exceeded"** | **Add `useWhyDidYouUpdate` + `useRenderTracker`**        |
| **React infinite renders**          | **Look for `⚠️ FREQUENT` warnings**                       |
| **Function changing every render**  | **Wrap in `useCallback`**                                 |
| **Object changing every render**    | **Wrap in `useMemo`**                                     |
| **useEffect infinite loop**         | **Check if effect updates its own dependencies**          |
| `useWhyDidYouUpdate` not working    | Check console output                                      |
| No dependency logs                  | `debugsy.test.dependency()`                               |
| Too much noise                      | `debugsy.disableAll()` then enable specific points        |
| Performance issues                  | `__DEBUGSY_EMERGENCY_STOP.activate()`                     |
| Module not found                    | Check import path: `@n-uf/debugsy`                   |
| Global undefined                    | Import `@n-uf/debugsy` in app root                   |

---

## 📊 **Debug Output Examples**

### **Function Changes**

```
📝 [MyComponent] onSave: function changed (function → function)
```

**Fix**: `const onSave = useCallback(..., [deps])`

### **Object Changes**

```
📦 [MyComponent] config: object changed ⚠️ FREQUENT
```

**Fix**: `const config = useMemo(() => ({...}), [deps])`

### **Circuit Breaker**

```
🚨 [MyComponent] CIRCUIT BREAKER OPEN - Excessive renders: 20
```

**Fix**: Check dependencies causing re-renders

### **Emergency Stop**

```
🚨 EMERGENCY STOP ACTIVATED - All debug logging disabled
```

**Fix**: `__DEBUGSY_EMERGENCY_STOP.deactivate()`

---

## 💡 **Pro Tips**

1. **Start Simple**: Add `useWhyDidYouUpdate` to any component with performance issues
2. **Use Console**: All major functions work from browser console
3. **Filter First**: Use `functionsOnly()` or `unstableOnly()` to reduce noise
4. **Emergency Stop**: When in doubt, use emergency stop to disable everything
5. **Test First**: Always run `testDependencyTracking()` to verify setup

---

**Need more detail? Check the [full user manual](./user-manual.md)**
