# Debugging "Maximum Update Depth Exceeded" with Debug-Deps

## 🎯 **Purpose of Debug-Deps Module**

The `debug-deps` module exists primarily to help you identify and fix this React error:

```
Error: Maximum update depth exceeded. This can happen when a component
repeatedly calls setState inside useEffect, useLayoutEffect, or render.
```

## 🚀 **Smart Severity System (NEW)**

The debug-deps module now intelligently differentiates between **normal app initialization** and **actual infinite render problems**:

### **Initialization Phase (🚀)**

- **First 5 seconds** after app start or after new components appear
- **Object changes are normal** - components mounting, setting initial state
- **Only warns if excessive** (3+ rapid changes indicating real problems)
- **Shows `📋 INIT` indicator** for normal initialization changes

### **Runtime Phase (⚠️)**

- **After initialization settles** (5 seconds of stability)
- **Object changes are suspicious** - likely indicates render loops
- **Shows `⚠️ FREQUENT` warnings** for problematic dependencies
- **Much stricter detection** to catch real issues

### **Recommended Severity Level**

```javascript
// 🌟 BEST FOR DEVELOPMENT: Shows problems without initialization noise
surfaceDebug.deps.initAware();
```

This mode:

- ✅ **Shows function changes** (always important)
- ✅ **Shows real runtime problems** with warnings
- ❌ **Hides normal initialization** object changes
- 🎯 **Focuses on actual issues** you need to fix

## 🔍 **How It Works: Causality Tracking**

Unlike React DevTools which shows you **what** is happening, `useWhyDidYouUpdate` shows you **why** it's happening by tracking the causality chain of dependency changes.

### **The Problem**

React throws this error when it detects an infinite loop:

1. Component renders → Creates unstable dependency
2. Dependency change triggers effect/re-render
3. Re-render creates new unstable dependency → **INFINITE LOOP**

### **The Solution**

`useWhyDidYouUpdate` breaks down this chain:

1. **Tracks every prop/dependency change**
2. **Identifies which changes are frequent** (`⚠️ FREQUENT`)
3. **Shows you the exact causality pattern**

## 🚨 **Emergency Response Protocol**

When React is crashing with infinite renders:

### **Step 1: Stop the Bleeding (Circuit Breaker)**

```typescript
import { useCircuitBreakerTracker } from '@your-org/debugsy';

const CrashingComponent = (props) => {
  // EMERGENCY: This will stop the component after 10 renders
  const { isDisabled, renderCount } = useCircuitBreakerTracker(
    'CrashingComponent',
    props,
    {
      maxRenders: 10,
      onBreak: () => console.error('🚨 CIRCUIT BREAKER: Component stopped!')
    }
  );

  if (isDisabled) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fee2e2', border: '2px solid #dc2626' }}>
        🛑 Component disabled after {renderCount} renders - check console for debug info
      </div>
    );
  }

  // Your normal component logic here...
};
```

### **Step 2: Start Tracking (Causality Detection)**

```typescript
import { useWhyDidYouUpdate } from "@your-org/debugsy";

const CrashingComponent = (props) => {
  // This will show you EXACTLY which props are causing re-renders
  useWhyDidYouUpdate("CrashingComponent", props);

  // ... rest of component
};
```

### **Step 3: Enable Smart Console Monitoring**

```javascript
// In browser console - RECOMMENDED for most cases
surfaceDebug.deps.initAware(); // 🌟 Smart filtering (recommended)

// OR for maximum detail when needed
surfaceDebug.deps.verbose(); // Show everything (may be noisy during init)
```

### **Step 4: Read the Smart Causality Pattern**

Now you'll see context-aware patterns like this:

**During App Initialization (Normal):**

```
🔄 [MyComponent] Dependencies changed: { config: [Object → Object] }
📦 [MyComponent] config: object changed (#1) 🚀 📋 INIT
📦 [AnotherComponent] props: object changed (#2) 🚀 📋 INIT
```

**During Runtime (Problematic):**

```
🔄 [CrashingComponent] Dependencies changed: { callback: [Function → Function] }
📝 [CrashingComponent] callback: function changed (#3) ⚠️ FREQUENT
🔄 [CrashingComponent] Dependencies changed: { callback: [Function → Function] }
📝 [CrashingComponent] callback: function changed (#4) ⚠️ FREQUENT
```

**Understanding the Indicators & Colors:**

**Color Coding:**

- **Gray Border** 🔘 = Normal dependency change (info level)
- **Orange Border** 🟠 = Potential performance issue (warn level)
- **Red Border** 🔴 = Critical problem requiring immediate attention (error level)

**Message Indicators:**

- `(#3)` = **Change counter** - shows how many times this dependency has changed
- `🚀` = Initialization phase (first 5 seconds)
- `📋 INIT` = Normal initialization change (Gray)
- `⚠️ FREQUENT` = **Real runtime problem** - infinite loop risk! (Orange)
- No indicator = Runtime phase, normal change (Gray)

## 🔄 **Common Causality Patterns**

### **Pattern 1: Parent-Child Callback Loop**

**What you'll see:**

```
📝 [Child] onUpdate: function changed ⚠️ FREQUENT
📝 [Parent] data: object changed ⚠️ FREQUENT
```

**The causality chain:**

```
Parent creates new onUpdate → Child re-renders → Child calls onUpdate →
Parent state changes → Parent re-renders → Parent creates new onUpdate → LOOP
```

**Fix:**

```typescript
// ❌ Problem: New function every render
const Parent = () => {
  const [data, setData] = useState({});
  const handleUpdate = (newData) => setData(newData); // New function!
  return <Child onUpdate={handleUpdate} />;
};

// ✅ Solution: Stable function
const Parent = () => {
  const [data, setData] = useState({});
  const handleUpdate = useCallback((newData) => setData(newData), []); // Stable!
  return <Child onUpdate={handleUpdate} />;
};
```

### **Pattern 2: Effect Updates Its Own Dependencies**

**What you'll see:**

```
🔄 [Component] Dependencies changed rapidly
📝 [Component] count: number → number ⚠️ FREQUENT
```

**The causality chain:**

```
useEffect runs → Updates count → Component re-renders →
useEffect runs again (count changed) → Updates count → LOOP
```

**Fix:**

```typescript
// ❌ Problem: Effect depends on what it changes
const Counter = ({ initialValue }) => {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    setCount(count + 1); // Updates count...
  }, [count]); // ...which triggers this effect again!

  return <div>{count}</div>;
};

// ✅ Solution: Functional update or different approach
const Counter = ({ initialValue }) => {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    setCount(c => c + 1); // Doesn't need count in dependencies
  }, []); // Runs once

  return <div>{count}</div>;
};
```

### **Pattern 3: Unstable Object in Dependencies**

**What you'll see:**

```
📦 [Component] config: object changed ⚠️ FREQUENT
📦 [Component] options: object changed ⚠️ FREQUENT
```

**The causality chain:**

```
New config object created → useEffect runs → Updates state →
Component re-renders → New config object created → LOOP
```

**Fix:**

```typescript
// ❌ Problem: New object every render
const Search = ({ term }) => {
  const [results, setResults] = useState([]);

  const config = {
    term,
    limit: 10,
    timestamp: Date.now() // Always different!
  };

  useEffect(() => {
    search(config).then(setResults);
  }, [config]); // config changes every render

  return <Results data={results} />;
};

// ✅ Solution: Memoized object
const Search = ({ term }) => {
  const [results, setResults] = useState([]);

  const config = useMemo(() => ({
    term,
    limit: 10
    // Remove timestamp or memoize it separately
  }), [term]); // Only changes when term changes

  useEffect(() => {
    search(config).then(setResults);
  }, [config]);

  return <Results data={results} />;
};
```

### **Pattern 4: Cascading Instability**

**What you'll see:**

```
📝 [GrandChild] callback: function changed ⚠️ FREQUENT
📝 [Child] callback: function changed ⚠️ FREQUENT
📝 [Parent] data: object changed ⚠️ FREQUENT
```

**The causality chain:**

```
GrandParent creates unstable callback → Parent re-renders →
Child re-renders → GrandChild re-renders → Triggers callback →
GrandParent updates → CASCADING LOOP
```

**Fix at the source:**

```typescript
// ❌ Problem: Instability at the top cascades down
const GrandParent = () => {
  const [data, setData] = useState({});
  const updateData = (newData) => setData(prev => ({ ...prev, ...newData })); // New function!
  return <Parent onUpdate={updateData} />;
};

// ✅ Solution: Fix at the source
const GrandParent = () => {
  const [data, setData] = useState({});
  const updateData = useCallback((newData) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []); // Stable at the source
  return <Parent onUpdate={updateData} />;
};
```

## 📊 **Using Change Counters for Analysis**

The counter `(#3)` shows how many times each dependency has changed, helping you identify problematic patterns:

### **Normal Counter Patterns:**

```
📦 [MyComponent] config: object changed (#1) 🚀 📋 INIT  // ✅ Once during init
📝 [MyComponent] onSubmit: function changed (#2)        // ✅ Low count, stable
📦 [MyComponent] data: object changed (#3)              // ✅ Occasional changes
```

### **Problematic Counter Patterns:**

```
📝 [BadComponent] callback: function changed (#15) ⚠️ FREQUENT  // 🚨 Very high count!
📦 [BadComponent] config: object changed (#22) ⚠️ FREQUENT     // 🚨 Recreated constantly
📦 [BadComponent] props: object changed (#8) ⚠️ FREQUENT       // 🚨 Still growing
```

### **Counter Analysis Tips:**

- **Low counts (1-3)** = Normal, healthy dependency usage
- **Medium counts (4-10)** = Monitor, could indicate instability
- **High counts (10+)** = Likely problem, especially with `⚠️ FREQUENT`
- **Rapidly increasing** = Active infinite loop in progress

## 🔧 **Advanced Debugging Techniques**

### **Binary Search Debugging**

When you can't identify which part of a large component is causing the issue:

```typescript
const LargeComponent = (props) => {
  useWhyDidYouUpdate('LargeComponent', props);

  // Comment out half to isolate the problem
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

### **Component Tree Analysis**

Track the entire component hierarchy to see causality flow:

```typescript
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

### **Frequency Analysis**

Filter to only the most problematic dependencies:

```javascript
// Show only frequently changing dependencies (likely culprits)
surfaceDebug.deps.unstableOnly();

// Focus on functions (common cause of infinite loops)
surfaceDebug.deps.functionsOnly();
```

## 🎯 **Success Indicators**

You've fixed the issue when:

1. **No more `⚠️ FREQUENT` warnings** in the console (after initialization)
2. **Circuit breaker no longer triggers** (component renders normally)
3. **Stable render counts** (not incrementing rapidly)
4. **React stops throwing** the "Maximum update depth exceeded" error
5. **Initialization shows `📋 INIT`** then settles to normal patterns

## 📊 **Common Success Patterns**

After applying fixes, you should see:

```
// ✅ Good: Normal initialization sequence (GRAY borders in UI)
📦 [Component] config: object changed (#1) 🚀 📋 INIT
📦 [Component] data: object changed (#2) 🚀 📋 INIT
🏁 App initialization phase completed - switching to runtime severity

// ✅ Good: Stable runtime dependencies (GRAY borders in UI)
📝 [Component] data: object changed (#3) (occasional, when props actually change)
📝 [Component] callback: function stable (no changes unless needed)

// ✅ Good: Render count stabilizes
🔍 [Component] Render count: 3 (stable)

// ✅ Good: No orange warnings after initialization, low change counts
🔄 [Component] Dependencies changed: { data: [Object → Object] } (only when needed)
```

## 🚀 **Prevention Best Practices**

1. **Always use `useCallback` for functions passed as props**
2. **Always use `useMemo` for objects passed as props or effect dependencies**
3. **Avoid creating objects/functions in render**
4. **Be careful with `useEffect` dependencies** - don't update what you depend on
5. **Use `useWhyDidYouUpdate` proactively** on complex components

## 📞 **Getting Help**

If you're still stuck:

1. **Create a minimal reproduction** with just the essential parts
2. **Share the console output** from `useWhyDidYouUpdate`
3. **Check the causality pattern** against the common patterns above
4. **Use emergency stop** if needed: `__DEBUGSY_EMERGENCY_STOP.activate()`

Remember: The `⚠️ FREQUENT` warning is your best friend - it points directly to the problematic dependency causing the infinite loop!

**Happy debugging! 🐛➡️✨**
