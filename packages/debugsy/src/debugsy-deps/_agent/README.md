# Debug-Deps Module Documentation

## 🎯 **Primary Purpose**

The **debug-deps** module exists to solve one critical React development problem:

> **"Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside useEffect, useLayoutEffect, or render."**

This module provides **causality tracking** tools that help you identify and fix infinite render loops in React applications.

## 📚 **Documentation Files**

### **[maximum-update-depth-debugging.md](./maximum-update-depth-debugging.md)**

**Main Guide** - Comprehensive guide for debugging the "Maximum update depth exceeded" error

- Emergency response protocol
- Step-by-step debugging workflow
- Common causality patterns and fixes
- Advanced debugging techniques
- Success indicators and prevention practices

## 🚀 **Quick Start**

When React crashes with infinite renders:

```typescript
// 1. EMERGENCY: Stop the component from crashing
const { isDisabled } = useCircuitBreakerTracker('ComponentName', props, { maxRenders: 10 });
if (isDisabled) return <div>🛑 Component disabled</div>;

// 2. TRACK: Find what's causing the infinite loop
useWhyDidYouUpdate('ComponentName', props);
```

```javascript
// 3. ENABLE: Turn on console monitoring
debugsy.deps.on();
debugsy.deps.verbose();

// 4. LOOK FOR: ⚠️ FREQUENT warnings - these are your culprits!
```

## 🔍 **Key Concepts**

### **Causality Tracking**

Unlike React DevTools which shows **what** is happening, `useWhyDidYouUpdate` shows **why** it's happening by tracking dependency change patterns.

### **Frequent Change Detection**

The `⚠️ FREQUENT` warning identifies dependencies that change rapidly - these are almost always the root cause of infinite loops.

### **Circuit Breaker Protection**

`useCircuitBreakerTracker` provides emergency protection by automatically disabling components that render excessively.

## 🔧 **Core Tools**

| Tool                       | Purpose                       | Usage                                                              |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| `useWhyDidYouUpdate`       | Track prop/dependency changes | `useWhyDidYouUpdate('Component', props)`                           |
| `useCircuitBreakerTracker` | Emergency render protection   | `useCircuitBreakerTracker('Component', props, { maxRenders: 10 })` |
| `useRenderTracker`         | Monitor render frequency      | `useRenderTracker('Component', props)`                             |
| `debugsy.deps.*`           | Console debugging commands    | `debugsy.deps.verbose()`                                           |

## 🎯 **Success Metrics**

You've fixed the infinite loop when:

- ✅ No more `⚠️ FREQUENT` warnings
- ✅ Circuit breaker stops triggering
- ✅ React stops throwing the error
- ✅ Render counts stabilize

## 📞 **Need Help?**

1. **Start with**: [maximum-update-depth-debugging.md](./maximum-update-depth-debugging.md)
2. **Emergency mode**: Use circuit breaker + causality tracking
3. **Look for patterns**: `⚠️ FREQUENT` warnings point to the culprit
4. **Common fixes**: Wrap functions in `useCallback`, objects in `useMemo`

**Remember**: The `⚠️ FREQUENT` warning is your best friend - it points directly to the problematic dependency causing the infinite loop!
