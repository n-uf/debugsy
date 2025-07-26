# Debugsy - Quick Reference Guide

## 🚨 **Emergency: "Maximum Update Depth Exceeded"**

**React crashing with infinite renders? Use this immediately:**

```typescript
// 1. EMERGENCY CIRCUIT BREAKER (add to problematic component)
const { isDisabled } = useCircuitBreakerTracker('ComponentName', props, { maxRenders: 10 });
if (isDisabled) return <div>🛑 Component disabled</div>;

// 2. TRACK CAUSALITY (add to same component)
useWhyDidYouUpdate('ComponentName', props);
```

```javascript
// 3. ENABLE TRACKING (in browser console)
surfaceDebug.deps.on();
surfaceDebug.deps.verbose();

// 4. LOOK FOR: ⚠️ FREQUENT warnings - these are your culprits!
```

## 🚀 **Essential Commands**

### **Console Commands (Copy & Paste)**

```javascript
// Test if dependency tracking works
testDependencyTracking();

// Enable dependency tracking
surfaceDebug.deps.on();
surfaceDebug.deps.verbose();

// Quick debugging
surfaceDebug.deps.functionsOnly(); // Only function changes
surfaceDebug.deps.unstableOnly(); // Only frequent changes

// Emergency stop
__SURFACE_EMERGENCY_STOP.activate();
```

### **React Hooks (Quick Copy)**

```typescript
// Basic logging
const { log } = useDebug("surface-interaction");
log("User action", { action: "click", target: "button" });

// Track re-renders
useWhyDidYouUpdate("MyComponent", { prop1, prop2, callback });

// Circuit breaker protection
const { isDisabled } = useCircuitBreakerTracker("MyComponent", props);
```

---

## 📋 **Component Setup**

### **Minimal Debug Setup**

```typescript
// App.tsx
import { DebugControlPanel, DebugExternalPanel } from '@your-org/debugsy';

function App() {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div>
      <YourApp />
      <DebugControlPanel onToggleExternalPanel={() => setShowDebug(!showDebug)} />
      {showDebug && <DebugExternalPanel onClose={() => setShowDebug(false)} />}
    </div>
  );
}
```

### **Component with Debug Logging**

```typescript
import { useDebug, useWhyDidYouUpdate } from '@your-org/debugsy';

const MyComponent = ({ data, onSave, config }) => {
  const { log } = useDebug('surface-interaction');
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
// Add circuit breaker
const { isDisabled } = useCircuitBreakerTracker("Component", props, {
  maxRenders: 15,
  onBreak: (name) => console.error(`${name} excessive renders`),
});

// Monitor circuit breakers
circuitBreakerControl.listAll(); // See all breakers
```

### **3. Custom Debug Points**

```typescript
// Create custom logging
const { log } = useDebug('my-feature');
log('Custom event', { customData });

// Register custom formatter
registerFormatter('my-feature', {
  shouldExpand: (log) => log.point === 'my-feature',
  expansionContent: (log) => <MyCustomView log={log} />
});
```

---

## ⚡ **Common Console Commands**

```javascript
// DEPENDENCY TRACKING
surfaceDebug.deps.on(); // Enable
surfaceDebug.deps.off(); // Disable
surfaceDebug.deps.normal(); // Standard
surfaceDebug.deps.verbose(); // Detailed
surfaceDebug.deps.quiet(); // Critical only

// FILTERING
surfaceDebug.deps.functionsOnly(); // Functions only
surfaceDebug.deps.objectsOnly(); // Objects only
surfaceDebug.deps.unstableOnly(); // Frequent changes

// CIRCUIT BREAKERS
circuitBreakerControl.listAll(); // List all
circuitBreakerControl.isOpen("ComponentName"); // Check status
circuitBreakerControl.close("ComponentName"); // Manual restore
circuitBreakerControl.resetAll(); // Reset all

// EMERGENCY
__SURFACE_EMERGENCY_STOP.activate(); // Stop all
__SURFACE_EMERGENCY_STOP.status(); // Check status

// TESTING
surfaceDebug.testDependencyTracking(); // Test if working
surfaceDebug.testMockComponent(); // Run mock tests
```

---

## 🔧 **Import Patterns**

```typescript
// Core hooks
import {
  useDebug,
  useWhyDidYouUpdate,
  useCircuitBreakerTracker,
} from "@your-org/debugsy";

// Components
import {
  DebugControlPanel,
  DebugExternalPanel,
  DebugLogsList,
} from "@your-org/debugsy";

// Utilities
import {
  copyLogsToClipboard,
  registerFormatter,
  circuitBreakerControl,
} from "@your-org/debugsy";

// Types
import type {
  DebugLogEntry,
  LogSeverity,
  FormatterConfig,
} from "@your-org/debugsy";
```

---

## 🚨 **Troubleshooting Quick Fixes**

| Problem                             | Quick Fix                                                 |
| ----------------------------------- | --------------------------------------------------------- |
| **"Maximum update depth exceeded"** | **Add `useCircuitBreakerTracker` + `useWhyDidYouUpdate`** |
| **React infinite renders**          | **Look for `⚠️ FREQUENT` warnings**                       |
| **Function changing every render**  | **Wrap in `useCallback`**                                 |
| **Object changing every render**    | **Wrap in `useMemo`**                                     |
| **useEffect infinite loop**         | **Check if effect updates its own dependencies**          |
| `useWhyDidYouUpdate` not working    | `surfaceDebug.deps.on()`                                  |
| No dependency logs                  | `testDependencyTracking()`                                |
| Too much noise                      | `surfaceDebug.deps.quiet()`                               |
| Performance issues                  | `__SURFACE_EMERGENCY_STOP.activate()`                     |
| Module not found                    | Check import path                                         |
| Global undefined                    | Import debugsy in app root                                |

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

**Fix**: `__SURFACE_EMERGENCY_STOP.deactivate()`

---

## 💡 **Pro Tips**

1. **Start Simple**: Add `useWhyDidYouUpdate` to any component with performance issues
2. **Use Console**: All major functions work from browser console
3. **Filter First**: Use `functionsOnly()` or `unstableOnly()` to reduce noise
4. **Emergency Stop**: When in doubt, use emergency stop to disable everything
5. **Test First**: Always run `testDependencyTracking()` to verify setup

---

**Need more detail? Check the [full user manual](./user-manual.md)**
