# Debugsy - User Manual & Client Guide

## 📋 **Table of Contents**

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Quick Start](#quick-start)
4. [Core Components](#core-components)
5. [Debug Hooks](#debug-hooks)
6. [Dependency Tracking](#dependency-tracking)
7. [Performance Monitoring](#performance-monitoring)
8. [Log Management](#log-management)
9. [Console Commands](#console-commands)
10. [Advanced Features](#advanced-features)
11. [Troubleshooting](#troubleshooting)
12. [API Reference](#api-reference)

---

## 🎯 **Overview**

Debugsy is a comprehensive React debugging toolkit that provides:

- **Real-time debug logging** with structured display
- **Dependency tracking** to identify re-render issues
- **Performance monitoring** with circuit breakers
- **Interactive debug panels** with filtering and search
- **Virtualized log rendering** for handling thousands of entries
- **Console commands** for runtime configuration

### **Key Features**

✅ **Zero-impact Production**: Automatically disabled in production builds  
✅ **Performance Optimized**: Virtualized rendering, circuit breakers, emergency stops  
✅ **Developer Friendly**: Rich console commands, clear error messages  
✅ **Extensible**: Custom formatters, log types, and debug points  
✅ **React DevTools Integration**: Works alongside existing tools

---

## 🚀 **Installation & Setup**

### **Installation**

```bash
npm install @your-org/debugsy
# or
pnpm add @your-org/debugsy
```

### **Basic Setup**

```typescript
// App.tsx
import { DebugControlPanel, DebugExternalPanel } from '@your-org/debugsy';
import { useDebug } from '@your-org/debugsy';

function App() {
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  return (
    <div>
      {/* Your app content */}
      <YourMainContent />

      {/* Debug Controls (always visible in dev) */}
      <DebugControlPanel
        onToggleExternalPanel={() => setShowDebugPanel(!showDebugPanel)}
      />

      {/* Debug Panel (toggleable) */}
      {showDebugPanel && (
        <DebugExternalPanel
          onClose={() => setShowDebugPanel(false)}
        />
      )}
    </div>
  );
}
```

### **Environment Configuration**

```typescript
// .env.local
(NEXT_PUBLIC_SURFACE_DEBUG = surface - interaction), dependencies, performance;

// Or enable all debug points
NEXT_PUBLIC_SURFACE_DEBUG = all;
```

---

## ⚡ **Quick Start**

### **1. Add Debug Logging to Components**

```typescript
import { useDebug } from '@your-org/debugsy';

const MyComponent = ({ user, onSave }) => {
  const { log, isEnabled } = useDebug('surface-interaction');

  const handleClick = (event) => {
    // Log user interactions with structured data
    log('User clicked save button', {
      userId: user.id,
      elementId: event.target.id,
      timestamp: Date.now()
    });

    onSave(user);
  };

  return (
    <button onClick={handleClick}>
      Save User
    </button>
  );
};
```

### **2. Track Dependency Changes**

```typescript
import { useWhyDidYouUpdate } from '@your-org/debugsy';

const ProblematicComponent = ({ data, callback, config }) => {
  // Track what props are causing re-renders
  useWhyDidYouUpdate('ProblematicComponent', { data, callback, config });

  // This will log when props change and potentially cause issues
  useEffect(() => {
    doExpensiveOperation(data, callback);
  }, [data, callback]);

  return <div>...</div>;
};
```

### **3. Enable Debug Tracking**

```javascript
// Browser console commands
surfaceDebug.deps.on(); // Enable dependency tracking
surfaceDebug.deps.verbose(); // Detailed tracking
surfaceDebug.testDependencyTracking(); // Test if working
```

---

## 🧩 **Core Components**

### **DebugControlPanel**

Main control interface for debug features.

```typescript
import { DebugControlPanel } from '@your-org/debugsy';

<DebugControlPanel
  onToggleExternalPanel={() => setShowPanel(!showPanel)}
  showStats={true}           // Show performance stats
  showDependencies={true}    // Show dependency controls
/>
```

**Features:**

- Toggle debug points on/off
- Performance statistics
- Dependency tracking controls
- Health monitoring
- Emergency stop button

### **DebugExternalPanel**

Full-featured debug panel with logs, filtering, and analysis.

```typescript
import { DebugExternalPanel } from '@your-org/debugsy';

<DebugExternalPanel
  onClose={() => setShowPanel(false)}
  defaultWidth={800}         // Panel width
  defaultHeight={600}        // Panel height
  position="right"           // left, right, center
/>
```

**Features:**

- **Log List**: Virtualized list of all debug entries
- **Filtering**: By debug point, severity, time range
- **Search**: Full-text search across log messages
- **Export**: Copy logs to clipboard
- **Real-time**: Live updates as logs are generated

### **DebugLogsList**

Standalone log list component for custom implementations.

```typescript
import { DebugLogsList } from '@your-org/debugsy';

const CustomDebugView = () => {
  const { logs } = useDebugState();

  return (
    <div className="my-debug-container">
      <DebugLogsList logs={logs} />
    </div>
  );
};
```

---

## 🪝 **Debug Hooks**

### **useDebug(debugPoint)**

Primary hook for logging debug information.

```typescript
const { log, isEnabled, enabled } = useDebug("surface-interaction");

// Basic logging
log("User interaction", { action: "click", target: "button" });

// Conditional logging (more efficient)
if (isEnabled("performance")) {
  log("Performance measurement", {
    duration: performance.now() - startTime,
  });
}

// Check if specific debug point is enabled
const shouldTrackClicks = enabled; // boolean
```

### **useWhyDidYouUpdate(name, props)**

Track what props/dependencies are causing component re-renders.

```typescript
const MyComponent = ({ user, settings, onUpdate }) => {
  // Track all props
  useWhyDidYouUpdate('MyComponent', { user, settings, onUpdate });

  // Will log output like:
  // 🔄 [MyComponent] Dependencies changed: { onUpdate: { from: [Function], to: [Function] } }
  // 📝 [MyComponent] onUpdate: function changed (function → function) ⚠️ FREQUENT

  return <div>...</div>;
};
```

### **useRenderTracker(name, props)**

Enhanced version that warns about excessive renders.

```typescript
const HighFrequencyComponent = (props) => {
  // Tracks render count and warns if > 10 renders
  useRenderTracker('HighFrequencyComponent', props);

  // Will log warnings like:
  // ⚠️ [HighFrequencyComponent] High render count detected: 15

  return <div>...</div>;
};
```

### **useCircuitBreakerTracker(name, props, config)**

Automatic protection against infinite render loops.

```typescript
const RiskyComponent = (props) => {
  const { isDisabled, renderCount } = useCircuitBreakerTracker(
    'RiskyComponent',
    props,
    {
      maxRenders: 20,        // Open circuit after 20 renders
      resetInterval: 5000,   // Reset after 5 seconds
      autoRestore: true,     // Automatically restore
    }
  );

  if (isDisabled) {
    return <div>Component disabled due to excessive renders</div>;
  }

  return <div>Normal content (render #{renderCount})</div>;
};
```

---

## 🔍 **Dependency Tracking: Fixing "Maximum Update Depth Exceeded"**

### **🎯 Primary Purpose: React Infinite Render Detection**

The **debug-deps** module is specifically designed to help you identify and fix the notorious React error:

```
Error: Maximum update depth exceeded. This can happen when a component
repeatedly calls setState inside useEffect, useLayoutEffect, or render.
```

This error occurs when React detects an infinite loop of state updates, typically caused by:

- **Unstable dependencies** in useEffect/useMemo/useCallback
- **Objects/functions recreated on every render**
- **Circular state updates** between components
- **Missing dependency arrays** or incorrect dependencies

### **🔧 How Debug-Deps Solves This**

`useWhyDidYouUpdate` tracks **causality chains** - it shows you exactly which props/dependencies change on each render, helping you identify the **root cause** of infinite re-renders.

### **Console Commands**

```javascript
// Enable/disable
surfaceDebug.deps.on(); // Enable tracking
surfaceDebug.deps.off(); // Disable tracking

// Set detail level
surfaceDebug.deps.quiet(); // Only critical changes
surfaceDebug.deps.normal(); // Standard tracking (default)
surfaceDebug.deps.verbose(); // Detailed tracking
surfaceDebug.deps.debug(); // Maximum detail

// Filter by type
surfaceDebug.deps.functionsOnly(); // Only function changes
surfaceDebug.deps.objectsOnly(); // Only object changes
surfaceDebug.deps.unstableOnly(); // Only unstable dependencies

// Test if working
surfaceDebug.testDependencyTracking(); // Verify functionality
```

### **🚨 Step-by-Step: Debugging "Maximum Update Depth Exceeded"**

When you encounter the infinite render error, follow this systematic approach:

#### **Step 1: Identify the Problem Component**

```typescript
// Add to the component throwing the error
const ProblematicComponent = ({ data, onUpdate, config }) => {
  useWhyDidYouUpdate('ProblematicComponent', { data, onUpdate, config });

  // Your component logic here...
  useEffect(() => {
    // This might be causing infinite renders
    onUpdate(processedData);
  }, [data, onUpdate]); // Watch for which dependency is unstable

  return <div>...</div>;
};
```

#### **Step 2: Enable Verbose Tracking**

```javascript
// In browser console
surfaceDebug.deps.on();
surfaceDebug.deps.verbose(); // Show all dependency changes
```

#### **Step 3: Look for the Causality Chain**

Watch the console for rapid, repeating patterns like:

```
🔄 [ProblematicComponent] Dependencies changed: { onUpdate: [Function → Function] }
📝 [ProblematicComponent] onUpdate: function changed ⚠️ FREQUENT
🔄 [ProblematicComponent] Dependencies changed: { onUpdate: [Function → Function] }
📝 [ProblematicComponent] onUpdate: function changed ⚠️ FREQUENT
🔄 [ProblematicComponent] Dependencies changed: { onUpdate: [Function → Function] }
```

The `⚠️ FREQUENT` warning indicates a **causality loop** - this dependency is changing rapidly.

#### **Step 4: Trace the Root Cause**

Add tracking to **parent components** to find where the unstable dependency originates:

```typescript
const ParentComponent = () => {
  useWhyDidYouUpdate('ParentComponent', { /* parent's props */ });

  // 🚨 CULPRIT: This creates a new function every render!
  const handleUpdate = (data) => {
    setProcessedData(processData(data));
  };

  return <ProblematicComponent onUpdate={handleUpdate} />;
};
```

#### **Step 5: Fix the Root Cause**

```typescript
const ParentComponent = () => {
  // ✅ FIX: Stable function reference
  const handleUpdate = useCallback((data) => {
    setProcessedData(processData(data));
  }, []); // Empty deps = function never changes

  return <ProblematicComponent onUpdate={handleUpdate} />;
};
```

### **🔍 Understanding Debug Output**

#### **Function Changes**

```
📝 [MyComponent] callback: function changed (function → function)
```

**Meaning**: A callback prop changed (new function reference)  
**Solution**: Wrap in `useCallback` or move outside component

#### **Object Changes**

```
📦 [MyComponent] config: object changed ⚠️ FREQUENT
```

**Meaning**: Object prop changing frequently (new object each render)  
**Solution**: Use `useMemo` or move object outside component

#### **Primitive Changes**

```
🔧 [MyComponent] count: number → number
```

**Meaning**: Value actually changed (this is usually fine)

### **🔄 Common Causality Patterns & Solutions**

#### **Pattern 1: Unstable Callback Loop**

**Debug Output:**

```
📝 [ChildComponent] onUpdate: function changed ⚠️ FREQUENT
📝 [ParentComponent] data: object changed ⚠️ FREQUENT
```

**Causality Chain:**

1. Parent creates new `onUpdate` function → Child re-renders
2. Child calls `onUpdate` → Parent state changes → Parent re-renders
3. Parent creates new `onUpdate` function → **INFINITE LOOP**

```typescript
// ❌ Problem: New function every render
const ParentComponent = () => {
  const [data, setData] = useState({});

  const handleUpdate = (newData) => setData(newData); // New function each render

  return <ChildComponent data={data} onUpdate={handleUpdate} />;
};

// ✅ Solution: Stable callback
const ParentComponent = () => {
  const [data, setData] = useState({});

  const handleUpdate = useCallback((newData) => setData(newData), []); // Stable

  return <ChildComponent data={data} onUpdate={handleUpdate} />;
};
```

#### **Pattern 2: Unstable Object Dependencies**

**Debug Output:**

```
📦 [Component] config: object changed ⚠️ FREQUENT
📦 [Component] filters: object changed ⚠️ FREQUENT
```

**Causality Chain:**

1. New config object created → useEffect runs
2. useEffect updates state → Component re-renders
3. New config object created → **INFINITE LOOP**

```typescript
// ❌ Problem: New object every render
const SearchComponent = ({ searchTerm }) => {
  const [results, setResults] = useState([]);

  const config = {
    term: searchTerm,
    limit: 10,
    timestamp: Date.now() // 🚨 Always different!
  };

  useEffect(() => {
    fetchResults(config).then(setResults);
  }, [config]); // Config changes every render

  return <Results data={results} />;
};

// ✅ Solution: Stable object
const SearchComponent = ({ searchTerm }) => {
  const [results, setResults] = useState([]);

  const config = useMemo(() => ({
    term: searchTerm,
    limit: 10,
    // Remove or memoize timestamp
  }), [searchTerm]); // Only changes when searchTerm changes

  useEffect(() => {
    fetchResults(config).then(setResults);
  }, [config]);

  return <Results data={results} />;
};
```

#### **Pattern 3: Effect → setState → Effect Loop**

**Debug Output:**

```
🔄 [Component] Dependencies changed rapidly
📝 [Component] count: number → number ⚠️ FREQUENT
```

**Causality Chain:**

1. useEffect runs → setState called
2. State change → Component re-renders
3. useEffect runs again → **INFINITE LOOP**

```typescript
// ❌ Problem: Effect updates its own dependency
const CounterComponent = ({ initialValue }) => {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    // 🚨 This updates count, which triggers this effect again!
    setCount(count + 1);
  }, [count]); // Effect depends on what it changes

  return <div>{count}</div>;
};

// ✅ Solution: Remove problematic dependency or use functional update
const CounterComponent = ({ initialValue }) => {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    // Option 1: Functional update (doesn't need count in deps)
    setCount(c => c + 1);
  }, []); // Empty deps - runs once

  // Option 2: Or use a different approach entirely

  return <div>{count}</div>;
};
```

#### **Pattern 4: Prop Drilling Instability**

**Debug Output:**

```
📝 [GrandChild] callback: function changed ⚠️ FREQUENT
📝 [Child] callback: function changed ⚠️ FREQUENT
📝 [Parent] data: object changed ⚠️ FREQUENT
```

**Causality Chain:**

1. Grandparent creates unstable callback → Parent re-renders
2. Parent passes unstable callback → Child re-renders
3. Child passes unstable callback → GrandChild re-renders
4. GrandChild triggers callback → **CASCADING UPDATES**

```typescript
// ❌ Problem: Instability cascades down component tree
const GrandParent = () => {
  const [data, setData] = useState({});

  // 🚨 New function every render
  const updateData = (newData) => setData(prev => ({ ...prev, ...newData }));

  return <Parent data={data} onUpdate={updateData} />;
};

// ✅ Solution: Stable callback at the source
const GrandParent = () => {
  const [data, setData] = useState({});

  // ✅ Stable function reference
  const updateData = useCallback((newData) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []); // No dependencies = never changes

  return <Parent data={data} onUpdate={updateData} />;
};
```

### **🚨 Emergency Debugging: When React is Already Crashing**

When the "Maximum update depth exceeded" error is happening so fast that you can't add debugging code:

#### **Emergency Step 1: Circuit Breaker Protection**

```typescript
// Add this to the problematic component FIRST
const ProblematicComponent = (props) => {
  const { isDisabled } = useCircuitBreakerTracker('ProblematicComponent', props, {
    maxRenders: 10,  // Stop after 10 renders
    onBreak: () => console.error('🚨 CIRCUIT BREAKER: ProblematicComponent stopped')
  });

  if (isDisabled) {
    return <div>🛑 Component disabled - check console for debug info</div>;
  }

  // Your normal component logic...
};
```

#### **Emergency Step 2: Binary Search Debugging**

Comment out half of your component's logic to isolate the problem:

```typescript
const ProblematicComponent = ({ data, onUpdate, config }) => {
  useWhyDidYouUpdate('ProblematicComponent', { data, onUpdate, config });

  // Comment out half of these effects to find the culprit
  useEffect(() => {
    // Effect A
  }, [depA]);

  // useEffect(() => {
  //   // Effect B - COMMENTED OUT
  // }, [depB]);

  // useEffect(() => {
  //   // Effect C - COMMENTED OUT
  // }, [depC]);

  return <div>...</div>;
};
```

#### **Emergency Step 3: Use Emergency Stop**

```javascript
// In browser console - stops ALL debugging immediately
__DEBUGSY_EMERGENCY_STOP.activate();

// Later, when you're ready to debug again
__DEBUGSY_EMERGENCY_STOP.deactivate();
surfaceDebug.deps.on();
```

#### **Emergency Step 4: Minimal Reproduction**

Create a stripped-down version of your component with only the essential parts:

```typescript
// Minimal version to isolate the issue
const MinimalComponent = ({ onUpdate }) => {
  useWhyDidYouUpdate('MinimalComponent', { onUpdate });

  useEffect(() => {
    console.log('Effect running');
    onUpdate('test'); // Is this causing the loop?
  }, [onUpdate]);

  return <div>Minimal test</div>;
};
```

### **🎯 Advanced Debugging Techniques**

#### **Technique 1: Dependency Frequency Analysis**

```javascript
// Filter to only frequent changes (likely culprits)
surfaceDebug.deps.unstableOnly();

// Look for patterns in the console:
// If you see the same dependency changing repeatedly, that's your culprit
```

#### **Technique 2: Component Tree Tracking**

```typescript
// Add tracking to the entire component tree to see causality flow
const GrandParent = (props) => {
  useWhyDidYouUpdate('GrandParent', props);
  return <Parent {...parentProps} />;
};

const Parent = (props) => {
  useWhyDidYouUpdate('Parent', props);
  return <Child {...childProps} />;
};

const Child = (props) => {
  useWhyDidYouUpdate('Child', props);
  return <div>...</div>;
};
```

#### **Technique 3: Render Count Monitoring**

```typescript
// Track render counts to identify the hottest component
const HotComponent = (props) => {
  const { renderCount } = useRenderTracker('HotComponent', props);

  // Log every 5 renders
  if (renderCount % 5 === 0) {
    console.warn(`🔥 HotComponent rendered ${renderCount} times`);
  }

  return <div>Render #{renderCount}</div>;
};
```

---

## ⚡ **Performance Monitoring**

### **Circuit Breakers**

Automatic protection against render loops and excessive processing.

```typescript
// Manual circuit breaker control
import { circuitBreakerControl } from "@your-org/debugsy";

// Check status
const isOpen = circuitBreakerControl.isOpen("MyComponent");

// Manual control
circuitBreakerControl.open("MyComponent"); // Disable component
circuitBreakerControl.close("MyComponent"); // Re-enable component

// Get all circuit breakers
const allBreakers = circuitBreakerControl.listAll();
// Returns: [{ name: 'MyComponent', isOpen: false, renderCount: 5 }]

// Reset all
circuitBreakerControl.resetAll();
```

### **Emergency Stop**

Global kill switch for all debug operations.

```javascript
// Emergency controls
__DEBUGSY_EMERGENCY_STOP.activate(); // Stop all debugging
__DEBUGSY_EMERGENCY_STOP.deactivate(); // Restore normal operation
__DEBUGSY_EMERGENCY_STOP.status(); // Check current status
```

### **Safe Hook Wrapper**

Wrap potentially problematic hooks with automatic failure handling.

```typescript
import { useSafeHook } from '@your-org/debugsy';

const MyComponent = () => {
  // Wrap a hook that might cause issues
  const data = useSafeHook(
    'expensiveDataHook',
    () => useExpensiveDataProcessing(complexInput),
    fallbackData,  // Returned if hook fails or is disabled
    { maxRenders: 15 }
  );

  return <div>{data.result}</div>;
};
```

---

## 📊 **Log Management**

### **Log Structure**

Every log entry has this structure:

```typescript
interface DebugLogEntry {
  id: string; // Unique identifier
  timestamp: number; // Unix timestamp
  point: string; // Debug point (e.g., 'surface-interaction')
  message: string; // Human-readable message
  data?: any; // Structured data (objects, arrays, etc.)
  level?: string; // Log level ('info', 'warn', 'error')
}
```

### **Custom Formatters**

Register custom formatters for specific log types:

```typescript
import { registerFormatter } from '@your-org/debugsy';

// Register a custom formatter for API calls
registerFormatter('api-call', {
  shouldExpand: (log) => log.point === 'api' && log.data?.url,
  severity: 'info',
  expansionContent: (log) => (
    <div>
      <strong>API Call:</strong> {log.data.method} {log.data.url}
      <br />
      <strong>Status:</strong> {log.data.status}
      <br />
      <strong>Duration:</strong> {log.data.duration}ms
      {log.data.error && (
        <div style={{ color: 'red' }}>
          <strong>Error:</strong> {log.data.error}
        </div>
      )}
    </div>
  )
});
```

### **Log Filtering & Search**

```typescript
// Built-in filtering in DebugExternalPanel
<DebugExternalPanel
  defaultFilters={{
    points: ['surface-interaction', 'dependencies'],  // Filter by debug points
    severity: ['warn', 'error'],                      // Filter by severity
    timeRange: { start: Date.now() - 3600000 }       // Last hour
  }}
  searchPlaceholder="Search logs..."
/>
```

### **Export & Sharing**

```typescript
import { copyLogsToClipboard } from "@your-org/debugsy";

// Copy logs to clipboard for sharing
const exportLogs = async (logs) => {
  try {
    await copyLogsToClipboard(logs);
    console.log("Logs copied to clipboard");
  } catch (error) {
    console.error("Failed to copy logs:", error);
  }
};
```

---

## 💻 **Console Commands**

### **Dependency Tracking**

```javascript
// Enable/disable tracking
surfaceDebug.deps.on();
surfaceDebug.deps.off();

// Set tracking levels
surfaceDebug.deps.quiet(); // Only critical changes
surfaceDebug.deps.normal(); // Standard tracking
surfaceDebug.deps.verbose(); // Detailed tracking
surfaceDebug.deps.debug(); // Maximum detail

// Filter by change type
surfaceDebug.deps.functionsOnly();
surfaceDebug.deps.objectsOnly();
surfaceDebug.deps.unstableOnly();
surfaceDebug.deps.stableOnly();
surfaceDebug.deps.loopRisks(); // Functions + unstable objects
```

### **Emergency Controls**

```javascript
// Emergency stop (disables all debugging)
__DEBUGSY_EMERGENCY_STOP.activate();
__DEBUGSY_EMERGENCY_STOP.deactivate();
__DEBUGSY_EMERGENCY_STOP.status();
```

### **Circuit Breaker Management**

```javascript
// Check circuit breaker status
circuitBreakerControl.isOpen("ComponentName");
circuitBreakerControl.getStatus("ComponentName");

// Manual control
circuitBreakerControl.open("ComponentName");
circuitBreakerControl.close("ComponentName");
circuitBreakerControl.resetAll();

// List all circuit breakers
circuitBreakerControl.listAll();
```

### **Testing Functions**

```javascript
// Test if dependency tracking is working
surfaceDebug.testDependencyTracking();

// Run mock component tests
surfaceDebug.testMockComponent();
```

---

## 🔧 **Advanced Features**

### **Health Monitoring**

```typescript
import { useHealthSnapshot, captureHealthSnapshot } from '@your-org/debugsy';

const HealthMonitor = () => {
  const healthData = useHealthSnapshot();

  const takeSnapshot = () => {
    captureHealthSnapshot();  // Manually trigger health capture
  };

  return (
    <div>
      <button onClick={takeSnapshot}>Capture Health Snapshot</button>
      <div>CPU Usage: {healthData.cpu}%</div>
      <div>Memory: {healthData.memory}MB</div>
      <div>Active Components: {healthData.components}</div>
    </div>
  );
};
```

### **Data Sanitization**

```typescript
import { sanitizeLogData, SANITIZATION_PRESETS } from "@your-org/debugsy";

// Sanitize sensitive data before logging
const sanitizedData = sanitizeLogData(userData, SANITIZATION_PRESETS.STRICT);

// Custom sanitization
const customSanitized = sanitizeLogData(data, {
  removeKeys: ["password", "token", "secret"],
  maxDepth: 3,
  maxArrayLength: 10,
});
```

### **Performance Budgets**

```typescript
// Set performance budgets for components
const PerformantComponent = (props) => {
  const { isDisabled } = useCircuitBreakerTracker('PerformantComponent', props, {
    maxRenders: 10,        // Break after 10 renders
    resetInterval: 2000,   // Reset after 2 seconds
    onBreak: (name, count) => {
      console.error(`${name} exceeded render budget: ${count} renders`);
      // Could send to error tracking service
    }
  });

  return isDisabled ? <div>Performance budget exceeded</div> : <div>...</div>;
};
```

---

## 🐛 **Troubleshooting**

### **🚨 "Maximum Update Depth Exceeded" Error**

**Problem**: React throws infinite render loop error

**Immediate Actions**:

1. **Add circuit breaker protection**:

   ```typescript
   const { isDisabled } = useCircuitBreakerTracker('ComponentName', props, { maxRenders: 10 });
   if (isDisabled) return <div>Component disabled</div>;
   ```

2. **Enable dependency tracking**:

   ```javascript
   surfaceDebug.deps.on();
   surfaceDebug.deps.verbose();
   ```

3. **Add tracking to problematic component**:

   ```typescript
   useWhyDidYouUpdate("ProblematicComponent", props);
   ```

4. **Look for `⚠️ FREQUENT` warnings** in console - these indicate causality loops

5. **Check common culprits**:
   - Functions created in render (wrap in `useCallback`)
   - Objects created in render (wrap in `useMemo`)
   - useEffect that updates its own dependencies
   - Missing dependency arrays

**Need more help?** See the [Dependency Tracking section](#dependency-tracking-fixing-maximum-update-depth-exceeded) for detailed debugging steps.

### **Dependency Tracking Not Working**

**Problem**: `useWhyDidYouUpdate` not showing output

**Solutions**:

1. **Check if enabled**:

   ```javascript
   surfaceDebug.deps.on(); // Enable tracking
   surfaceDebug.testDependencyTracking(); // Verify working
   ```

2. **Check debug points**:

   ```javascript
   // Make sure 'dependencies' debug point is enabled
   surfaceDebug.deps.normal();
   ```

3. **Verify global object**:
   ```javascript
   console.log(surfaceDebug); // Should exist
   console.log(surfaceDebug.getDepsSettings()); // Should return config
   ```

### **Performance Issues**

**Problem**: Debug panel causing lag

**Solutions**:

1. **Reduce log history**:

   ```typescript
   // Limit log retention
   LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS = 200; // Default: 400
   ```

2. **Use filtering**:

   ```typescript
   // Filter to specific debug points
   surfaceDebug.deps.quiet(); // Reduce noise
   ```

3. **Emergency stop**:
   ```javascript
   __DEBUGSY_EMERGENCY_STOP.activate(); // Nuclear option
   ```

### **Console Errors**

**Error**: `Cannot read property 'getDepsSettings' of undefined`

**Solution**: Debug system not initialized properly

```typescript
// Ensure debugsy is imported in your app root
import "@your-org/debugsy"; // This initializes the global system
```

**Error**: `Module not found: debug-deps`

**Solution**: Import from correct path

```typescript
// ✅ Correct
import { useWhyDidYouUpdate } from "@your-org/debugsy";

// ❌ Incorrect
import { useWhyDidYouUpdate } from "@your-org/debugsy/debug-deps";
```

### **Production Builds**

**Problem**: Debug code showing in production

**Solution**: Ensure proper environment detection

```typescript
// Debug components should auto-hide in production
// Verify NODE_ENV is set correctly
console.log("NODE_ENV:", process.env.NODE_ENV);

// Manual guard if needed
if (process.env.NODE_ENV === "development") {
  // Debug components only
}
```

---

## 📖 **API Reference**

### **Hooks**

| Hook                                            | Purpose             | Parameters                       | Returns                       |
| ----------------------------------------------- | ------------------- | -------------------------------- | ----------------------------- |
| `useDebug(point)`                               | Core logging        | `point: DebugPoint`              | `{ log, isEnabled, enabled }` |
| `useWhyDidYouUpdate(name, props)`               | Dependency tracking | `name: string, props: object`    | `void`                        |
| `useRenderTracker(name, props)`                 | Render monitoring   | `name: string, props: object`    | `void`                        |
| `useCircuitBreakerTracker(name, props, config)` | Circuit breaker     | `name, props, config`            | `{ isDisabled, renderCount }` |
| `useSafeHook(name, hookFn, fallback, config)`   | Safe wrapper        | `name, hookFn, fallback, config` | `T`                           |

### **Components**

| Component             | Purpose          | Key Props                          |
| --------------------- | ---------------- | ---------------------------------- |
| `DebugControlPanel`   | Main controls    | `onToggleExternalPanel, showStats` |
| `DebugExternalPanel`  | Full debug panel | `onClose, defaultWidth, position`  |
| `DebugLogsList`       | Log list only    | `logs`                             |
| `DefaultLogFormatter` | Log formatting   | `log, severity, showExpandButton`  |

### **Utilities**

| Function                          | Purpose           | Parameters              | Returns         |
| --------------------------------- | ----------------- | ----------------------- | --------------- |
| `copyLogsToClipboard(logs)`       | Copy logs         | `logs: DebugLogEntry[]` | `Promise<void>` |
| `sanitizeLogData(data, config)`   | Data sanitization | `data: any, config`     | `any`           |
| `registerFormatter(type, config)` | Custom formatter  | `type: string, config`  | `void`          |
| `captureHealthSnapshot()`         | Health snapshot   | none                    | `void`          |

### **Types**

```typescript
// Core types
type DebugPoint = 'surface-interaction' | 'dependencies' | 'performance' | ...
type LogSeverity = 'info' | 'warn' | 'error' | 'critical' | 'success'
type DependencyLogLevel = 'silent' | 'quiet' | 'normal' | 'verbose' | 'debug'

// Config types
interface CircuitBreakerConfig {
  maxRenders?: number
  resetInterval?: number
  autoRestore?: boolean
  onBreak?: (name: string, renderCount: number) => void
  onRestore?: (name: string) => void
}

interface FormatterConfig {
  shouldExpand?: (log: DebugLogEntry) => boolean
  severity?: LogSeverity
  expansionContent?: (log: DebugLogEntry) => React.ReactNode
}
```

---

## 📞 **Support & Resources**

### **Common Workflows**

1. **Debug Component Re-renders**:

   ```typescript
   // Add to problematic component
   useWhyDidYouUpdate("MyComponent", props);
   // Enable verbose tracking
   surfaceDebug.deps.verbose();
   // Look for ⚠️ FREQUENT warnings
   ```

2. **Performance Debugging**:

   ```typescript
   // Add circuit breaker protection
   useCircuitBreakerTracker("MyComponent", props);
   // Monitor with health snapshots
   captureHealthSnapshot();
   ```

3. **Custom Debug Points**:
   ```typescript
   // Create custom logging
   const { log } = useDebug('my-feature')
   log('Custom event', { data: complexObject })
   // Register custom formatter if needed
   registerFormatter('my-feature', { ... })
   ```

### **Best Practices**

✅ **Do**:

- Use descriptive names for `useWhyDidYouUpdate`
- Enable dependency tracking during development
- Use circuit breakers for experimental components
- Sanitize sensitive data before logging

❌ **Don't**:

- Leave debug code in production
- Log passwords or sensitive information
- Ignore circuit breaker warnings
- Use emergency stop unless necessary

---

## 🎉 **Getting Help**

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check inline JSDoc comments
- **Console Tests**: Use `surfaceDebug.testDependencyTracking()` for quick verification
- **Community**: Share solutions and tips

**Happy Debugging! 🐛➡️✨**
