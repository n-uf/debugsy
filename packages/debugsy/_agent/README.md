# Debugsy Documentation

**Comprehensive React debugging toolkit with real-time logging, dependency tracking, and performance monitoring**

---

## 📖 Documentation Index

### For End Users

1. **[User Manual](./user-manual.md)** - Complete guide: installation, setup, API reference, troubleshooting
2. **[Quick Reference](./quick-reference.md)** - Fast lookup for common commands and patterns

### For Developers

1. **[Debugsy Architecture](./debugsy-architecture.md)** - Complete technical architecture and design
2. **[Debug Log Management](./debug-log-management.md)** - Operational guide for log management

---

## Quick Start

### Installation

```bash
pnpm add @workspace/debugsy
```

### Basic Setup

```typescript
// App.tsx
import { DebugsyLook } from '@workspace/debugsy';

function App() {
  return (
    <div>
      <YourApp />
      {process.env.NODE_ENV === 'development' && <DebugsyLook />}
    </div>
  );
}
```

### Component Usage

```typescript
import { useDebugsy, useWhyDidYouUpdate } from '@workspace/debugsy';

const MyComponent = ({ data, onSave }) => {
  const { log } = useDebugsy('surface-interaction');
  useWhyDidYouUpdate('MyComponent', { data, onSave });
  
  const handleClick = () => {
    log('User action', { id: data.id });
    onSave(data);
  };
  
  return <button onClick={handleClick}>Save</button>;
};
```

---

## Emergency Commands

### Infinite Loop Rescue

```javascript
// In browser console
__DEBUGSY_EMERGENCY_STOP.activate();  // Stop everything immediately
__DEBUGSY_EMERGENCY_STOP.status();    // Check status
__DEBUGSY_EMERGENCY_STOP.deactivate(); // Resume when ready
```

### Track Re-render Issues

```javascript
// Test dependency tracking
debugsy.test.dependency();

// Add to components to track changes
// Use useWhyDidYouUpdate hook
// Look for ⚠️ FREQUENT warnings in console
```

---

## Key Features

✅ **Real-time Logging** - Structured debug logs with filtering  
✅ **Dependency Tracking** - Identify re-render causes  
✅ **Circuit Breakers** - Prevent infinite loops  
✅ **Health Snapshots** - System diagnostics  
✅ **Interactive UI** - Resizable panels with virtualized rendering  
✅ **Console Commands** - Runtime configuration  
✅ **Zero Production Impact** - Auto-disabled in production

## Console Commands

### Enable/Disable Debug Points

```javascript
debugsy.enable("surface-interaction");
debugsy.disable("dispatcher");
debugsy.enableAll();
debugsy.disableAll();
debugsy.toggle("surface-interaction");
```

### Dependency Tracking

```javascript
// Use hooks in components
import { useWhyDidYouUpdate, useRenderTracker } from '@workspace/debugsy';

useWhyDidYouUpdate('Component', props);
useRenderTracker('Component', props);
// Look for ⚠️ FREQUENT warnings
```

### Health & Diagnostics

```javascript
debugsy.captureHealthSnapshot();  // System health report
debugsy.status.show();            // Current state
debugsy.test.dependency();        // Test dependency tracking
```

---

## Architecture Overview

### Core System (3 layers)

1. **Debug State** - Global state, log storage, point management
2. **UI System** - V2 (Harbuz-based) and V1 (legacy) panels
3. **Integration** - Hooks, components, utilities

### Key Components

- **useDebugsy** - Main debug hook for logging
- **useWhyDidYouUpdate** - Dependency change tracking
- **useRenderTracker** - Render frequency monitoring
- **DebugsyLook V2** - Modern UI with Harbuz components
- **DebugsyLook V1** - Legacy UI (stable)
- **Health Snapshots** - System diagnostics

**See:** [debugsy-architecture.md](./debugsy-architecture.md) for complete technical details

---

## Common Issues

| Problem | Solution |
|---------|----------|
| **Maximum update depth** | `__DEBUGSY_EMERGENCY_STOP.activate()` |
| **Dependency tracking not working** | Use `useWhyDidYouUpdate` hook |
| **Too much console noise** | Disable debug points: `debugsy.disable("point")` |
| **Infinite re-renders** | Add `useWhyDidYouUpdate` + `useRenderTracker` |
| **Function changing every render** | Wrap in `useCallback` |
| **Object changing every render** | Wrap in `useMemo` |

**See:** [user-manual.md](./user-manual.md) for comprehensive troubleshooting

---

## Related Documentation

### In This Module
- **[User Manual](./user-manual.md)** - Complete usage guide
- **[Quick Reference](./quick-reference.md)** - Command cheat sheet
- **[Architecture](./debugsy-architecture.md)** - Technical design
- **[Log Management](./debug-log-management.md)** - Operational guide

### External
- **[Harbuz Showcase](../../harbuz/src/showcase/_agent/README.md)** - UI component patterns
- **[Harbuz Architecture](../../harbuz/_agent/harbuz-architecture.md)** - UI library design

---

**Last Updated:** 2025-11-19  
**Version:** 2.0 (Harbuz Integration Complete)  
**Status:** Production-ready
