# Debugsy Architecture

**Comprehensive React debugging toolkit with real-time logging, dependency tracking, and performance monitoring**

---

## System Overview

Debugsy is a production-grade debugging system providing:

- **Real-time debug logging** with structured display and filtering
- **Dependency tracking** to identify re-render causes
- **Performance monitoring** with circuit breakers and emergency stops
- **Interactive UI panels** with virtualized rendering
- **Console commands** for runtime configuration
- **React 19 compatibility** with modern hooks and patterns

**Design Principle:** Zero-impact in production, comprehensive in development

---

## Architecture Layers

### Layer 1: Core Debug System

```
packages/debugsy/src/
├── debugsy-space/               # Global state & configuration
│   ├── debugsy-constants.ts     # Types, constants, emojis
│   ├── debugsy-space.ts        # Global state management
│   ├── debugsy-space-settings.ts # Settings & controls
│   ├── debugsy-point.ts        # Debug point management
│   └── debugsy-point-types.ts  # Type definitions
├── debugsy-logs/               # Logging system
│   ├── use-debugsy.ts         # Main debug hook
│   ├── hooks/
│   │   └── debugsy-notifications.ts # Subscription system
│   └── logic/
│       ├── health-snapshot.ts  # Health metrics
│       └── log-data-sanitization.ts # Data safety
└── debugsy-deps/              # Dependency tracking
    ├── use-deps.ts           # useWhyDidYouUpdate & useRenderTracker
    ├── logic/
    │   ├── change-tracking.ts # Frequency detection
    │   └── change-utils.ts   # Change analysis
    └── deps-logger.ts        # Logging utilities
```

**Responsibilities:**
- Global debug state management
- Log storage and retrieval
- Debug point enable/disable
- Health metrics collection
- Dependency change tracking
- Render frequency monitoring

---

### Layer 2: UI System (Two Versions)

#### V1 - Legacy UI (Debugsy-specific)
```
packages/debugsy/src/debugsy-look-v1/
└── debugsy-look.tsx              # Complete V1 implementation
```

#### V2 - Modern UI (Harbuz-based) ✨ CURRENT
```
packages/debugsy/src/debugsy-look/
├── debugsy-look.tsx              # Main V2 implementation
├── debugsy-actions.tsx           # Action toolbar wrapper
├── dependency-controls.tsx       # Dependency tracking controls
└── debugsy-look-switcher.tsx    # V1/V2 version switcher
```

**V2 Uses Harbuz Components:**
- `TerminalLayout` - Container system
- `ActionToolbar` - Action buttons with controls
- `Banner` - Alert/info banners
- `TruncationPanel` - Log truncation UI
- `VirtualizedList` - Performance optimization
- `ControlPanel` - Control sections
- `LogEntry` - Individual log display

**V2 Uses Harbuz Hooks:**
- `usePauseState` - Pause/resume logs
- `useScrollFollowing` - Auto-scroll with snapshots
- `useLogFiltering` - Filter by debug points
- `useCopyState` - Copy progress indicator
- `useKeyboardSelection` - Cmd+A selection
- `useHoverMessage` - Hover feedback

---

### Layer 3: Integration Layer

```
packages/debugsy/index.ts         # Main package exports
packages/debugsy/src/
├── components/
│   ├── index.ts                  # Component exports
│   └── logs/
│       ├── formatters/           # Custom log formatters
│       └── utils/                # Log utilities
└── hooks/
    └── index.ts                  # Hook exports
```

---

## Core Components

### 1. Debug State Management

**Location:** `debug-state.ts`

**Global State Structure:**
```typescript
interface DebugState {
  // Debug point states
  points: Map<DebugPoint, boolean>;
  
  // Log storage
  logs: DebugLogEntry[];
  maxStoredLogs: number;
  
  // Dependency tracking
  deps: {
    enabled: boolean;
    logLevel: "quiet" | "normal" | "verbose";
    filters: DependencyFilter[];
  };
  
  // Display state
  displayContent: {
    message: string;
    type: "info" | "success" | "error" | "warning";
    duration: number;
  } | null;
  
  // Performance
  circuitBreakers: Map<string, CircuitBreakerState>;
  emergencyStop: boolean;
}
```

**Initialization:**
- Reads from localStorage (`surface-debug-state`)
- Checks URL parameters (`?debug=all`)
- Checks environment variables (`NEXT_PUBLIC_SURFACE_DEBUG`)
- Provides global `window.surfaceDebug` object

---

### 2. Debug Hooks

#### useDebugsy(point: DebugPoint)

**Main debugging interface:**
```typescript
const debug = useDebugsy("surface-interaction");

// Log messages
debug.log("User clicked", { target: "button", id: "123" });

// Check if enabled
if (debug.isEnabled("my-point")) {
  // Expensive debug operation
}

// Use global API for health snapshots
debugsy.captureHealthSnapshot();
```

**Features:**
- Automatic point-based filtering
- Severity levels (info, warn, error, critical)
- Structured data logging
- Memoized for performance

---

#### useWhyDidYouUpdate(name, props)

**Tracks dependency changes:**
```typescript
useWhyDidYouUpdate("MyComponent", { 
  onCallback, 
  data, 
  config 
});

// Console output:
// 📝 [MyComponent] onCallback: function changed ⚠️ FREQUENT
// 📦 [MyComponent] data: object changed
```

**Features:**
- Tracks all prop/dependency changes
- Identifies frequent changes (⚠️ FREQUENT indicator)
- Deep comparison for objects
- Function identity tracking
- Console logging integration

---

#### useRenderTracker(name, props, options?)

**Monitors render patterns:**
```typescript
useRenderTracker("Component", props, {
  enableTracking: true,
  enableFrequencyWarnings: true,
});

// Tracks render count and frequency
// Warns about high-frequency renders
// Integrates with dependency tracking
```

**Features:**
- Render count tracking
- Frequency analysis
- Mount/unmount detection
- Performance warnings

---

### 3. Health Metrics

**Location:** `health-snapshot.ts`

**Collects:**
- Total debug logs count
- Logs per debug point
- Enabled/disabled points
- Memory usage estimates
- Performance metrics
- Browser/environment info

**Usage:**
```typescript
const metrics = captureHealthSnapshot(state, logFn, {
  includeSystemHealth: true,
  logToConsole: true,
});
```

**Console Output:**
```
🏥 HEALTH SNAPSHOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Logs: 245 total
  • surface-interaction: 120 logs (enabled ✅)
  • dispatcher: 45 logs (enabled ✅)
  • dependencies: 30 logs (disabled ⏸️)
  • performance: 50 logs (enabled ✅)

🎛️ Debug Points: 6 enabled, 2 disabled
🧠 Estimated Memory: ~1.2 MB
⏱️ Performance: No circuit breakers active
```

---

### 4. UI Components (V2)

#### DebugsyLook - Main Panel

**Features:**
- Resizable panel (200px - 600px)
- Virtualized log rendering (performance)
- Pause/resume functionality
- Auto-scroll with snapshot detection
- Filter by debug points
- Search and copy logs
- Theme support (6 Harbuz themes)

**State Management:**
```typescript
// Active logs determination
const activeLogs = 
  pauseState.isPaused 
    ? pauseState.pausedItems           // Paused state
    : scrollFollowing.isFollowing
      ? filteredLogs                    // Following live
      : scrollFollowing.snapshotItems;  // Viewing snapshot
```

---

#### ActionToolbar - Actions & Controls

**Actions:**
- **Copy** - Copy all logs with depth control
- **Pause/Resume** - Freeze/unfreeze log rendering
- **Clear** - Clear stored logs
- **Health** - Capture health snapshot

**Controls:**
- **Depth Control** - Object serialization depth (str, 1, 3, 5, 10, all)
- **Progress Control** - Visual copy progress indicator

---

#### ControlPanel - Debug Points & Settings

**Sections:**
- **Debug Points** - Enable/disable individual points
- **Display Controls** - Theme, pause, truncation
- **Dependency Controls** - Track, verbose, filters

**Features:**
- Toggle indicators (on/off state)
- Executing indicators (in-progress actions)
- Theme integration (6 themes available)

---

## Dependency Tracking System

### Architecture

```
Component Re-renders
      ↓
useWhyDidYouUpdate / useRenderTracker
      ↓
Compare previous/current props
      ↓
Identify changed dependencies
      ↓
Analyze change frequency
      ↓
Log to console with indicators
      ↓
Mark ⚠️ FREQUENT if unstable
```

### Tracking Features

**Automatic Change Detection:**
- Compares previous vs current props
- Identifies primitive, object, and function changes
- Deep comparison for objects
- Function identity tracking

**Frequency Analysis:**
- Tracks change rates per component
- Detects rapid changes (⚠️ FREQUENT indicator)
- App phase awareness (ignores startup phase)
- Configurable thresholds

**Console Integration:**
- Automatic logging to console
- Structured output with emojis
- Change type indicators
- Performance-conscious throttling

---

## Performance Protection

### Emergency Stop System

**Global kill switch accessible via browser console:**
```javascript
// Activate emergency stop
__DEBUGSY_EMERGENCY_STOP.activate();

// Check status
__DEBUGSY_EMERGENCY_STOP.status();
// Output: Emergency stop status information

// Deactivate
__DEBUGSY_EMERGENCY_STOP.deactivate();
```

**Features:**
- Immediately disables all debug logging
- Accessible via browser console
- Prevents browser crashes during infinite loops
- Preserves UI functionality

**Use Cases:**
- React "Maximum update depth exceeded" errors
- Infinite render loops
- Browser becoming unresponsive
- Too much debug output

**Note:** Use `useRenderTracker` with frequency warnings to detect problematic components before they cause issues.

---

## UI Versioning System

### Version Switcher

**Parallel UI Implementation:**
- V1 - Legacy implementation (stable)
- V2 - Harbuz-based (modern, recommended)
- Switcher - Allows runtime toggle

**Configuration:**
```typescript
// Force V1
<DebugsyLook uiVersion="v1" />

// Force V2
<DebugsyLook uiVersion="v2" />

// Auto (respects localStorage/env)
<DebugsyLook uiVersion="auto" />
```

**Keyboard Shortcut:**
- `Cmd+Shift+D` - Toggle V1 ↔ V2 (when in auto mode)

**Feature Parity:**
- ✅ 100% feature parity between V1 and V2
- ✅ V2 uses reusable Harbuz components
- ✅ V1 remains for backward compatibility
- ✅ Default: V2 (modern implementation)

---

## Console API

### Global Commands

**Enable/Disable Debug Points:**
```javascript
debugsy.enable("surface-interaction");
debugsy.disable("dispatcher");
debugsy.enableAll();
debugsy.disableAll();
debugsy.toggle("surface-interaction");
```

**Dependency Tracking:**
```javascript
// Note: Dependency tracking is always active
// Use useWhyDidYouUpdate hook in components
// Control via simplified deps interface
debugsy.deps.reset(); // Reset dependency tracking state
```

**Health & Diagnostics:**
```javascript
debugsy.captureHealthSnapshot();
debugsy.status.show(); // Display current debug state
```

**Testing:**
```javascript
debugsy.test.dependency(); // Test dependency tracking
debugsy.test.emergency(); // Test emergency stop
```

**Emergency:**
```javascript
__DEBUGSY_EMERGENCY_STOP.activate();
__DEBUGSY_EMERGENCY_STOP.status();
__DEBUGSY_EMERGENCY_STOP.deactivate();

// Or via debugsy API
debugsy.emergency.activate();
debugsy.emergency.status();
debugsy.emergency.deactivate();
```

**UI Control:**
```javascript
debugsy.setUIVersion("v1"); // Switch to V1 UI
debugsy.setUIVersion("v2"); // Switch to V2 UI
debugsy.setUIVersion("auto"); // Auto-detect
debugsy.getUIVersion(); // Get current version
```

---

## Data Flow

### Log Creation Flow

```
1. Component calls useDebug("point")
   ↓
2. useDebug checks if point is enabled
   ↓
3. If enabled: Create DebugLogEntry
   ↓
4. Store in global state.logs
   ↓
5. Notify subscribers (UI components)
   ↓
6. UI re-renders with new logs
   ↓
7. Apply filtering (enabled points only)
   ↓
8. Apply pause/snapshot state
   ↓
9. Render with virtualization
```

### State Update Flow

```
1. User action (toggle point, pause, clear)
   ↓
2. Update global DebugState
   ↓
3. Persist to localStorage
   ↓
4. Notify all subscribers
   ↓
5. Subscribers re-render
   ↓
6. UI reflects new state
```

---

## Integration Patterns

### Basic Setup

```typescript
// App.tsx
import { DebugControlPanel } from '@workspace/debugsy';

function App() {
  return (
    <div>
      <YourApp />
      
      {/* Debug panel (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <DebugControlPanel />
      )}
    </div>
  );
}
```

### Component Integration

```typescript
import { useDebugsy, useWhyDidYouUpdate } from '@workspace/debugsy';

const MyComponent = ({ data, onSave, config }) => {
  // Debug logging
  const { log } = useDebugsy('surface-interaction');
  
  // Track re-renders
  useWhyDidYouUpdate('MyComponent', { data, onSave, config });
  
  const handleAction = () => {
    log('Action performed', { userId: data.id });
    onSave(data);
  };
  
  return <button onClick={handleAction}>Action</button>;
};
```

### Render Monitoring

```typescript
import { useRenderTracker, useWhyDidYouUpdate } from '@workspace/debugsy';

const MonitoredComponent = (props) => {
  // Track render patterns
  useRenderTracker('MonitoredComponent', props, {
    enableTracking: true,
    enableFrequencyWarnings: true,
  });
  
  // Also track why renders happen
  useWhyDidYouUpdate('MonitoredComponent', props);
  
  return <YourComponent {...props} />;
};
```

---

## File Organization

### Current Structure

```
packages/debugsy/
├── _agent/                              # Documentation
│   ├── README.md                        # Module overview
│   ├── debugsy-architecture.md          # This file
│   ├── user-manual.md                   # User guide
│   ├── quick-reference.md               # Quick commands
│   └── debug-log-management.md          # Operational guide
├── index.ts                             # Main exports
└── src/
    ├── debugsy-space/                   # Global state & configuration
    │   ├── debugsy-constants.ts         # Types, constants, emojis
    │   ├── debugsy-space.ts            # Core debug manager
    │   ├── debugsy-space-settings.ts   # Settings management
    │   ├── debugsy-point.ts            # Debug point logic
    │   └── debugsy-point-types.ts      # Type definitions
    ├── debugsy-logs/                    # Logging system
    │   ├── use-debugsy.ts              # Main debug hook
    │   ├── hooks/
    │   │   └── debugsy-notifications.ts # Subscription system
    │   └── logic/
    │       ├── health-snapshot.ts       # Health metrics
    │       └── log-data-sanitization.ts # Data safety
    ├── debugsy-deps/                    # Dependency tracking
    │   ├── use-deps.ts                 # useWhyDidYouUpdate & useRenderTracker
    │   ├── logic/
    │   │   ├── change-tracking.ts      # Frequency detection
    │   │   └── change-utils.ts         # Change analysis
    │   ├── deps-logger.ts              # Logging utilities
    │   └── deps-settings.ts            # Dependency settings
    ├── debugsy-cli/                     # Console commands
    │   ├── cli-interface.ts            # CLI builder
    │   └── commands/                   # Command implementations
    ├── debugsy-look/                    # V2 UI (current)
    │   ├── debugsy-look.tsx
    │   ├── debugsy-actions.tsx
    │   ├── dependency-controls.tsx
    │   └── debugsy-look-switcher.tsx
    ├── debugsy-look-v1/                 # V1 UI (legacy)
    │   ├── debugsy-look.tsx
    │   └── ui-*/                       # V1 UI components
    └── shared/                          # Shared utilities
        ├── object-depth-utils.ts       # Object processing
        └── superjson-config.ts         # Serialization
```

---

## Performance Characteristics

### Log Storage

- **Max stored logs:** 10,000 (configurable)
- **Automatic pruning:** FIFO when limit reached
- **Memory estimate:** ~1-2 MB for 10k logs
- **Persistence:** localStorage (optional)

### UI Rendering

- **Virtualization threshold:** 50 items
- **Item height:** 24px
- **Overscan:** 5 items
- **Max rendered:** 1,000 items

### State Updates

- **Notification throttling:** 60fps (16.67ms)
- **Batch updates:** Automatic
- **Subscriber optimization:** Memoization
- **Re-render prevention:** Smart equality checks

---

## Known Limitations

### Production Behavior

- **Auto-disabled in production** - All debug calls become no-ops
- **localStorage cleared** - Debug state not persisted
- **UI components hidden** - Debug panels not rendered
- **Performance impact:** Zero (dead code elimination)

### Development Constraints

- **Maximum logs:** 10,000 (configurable, affects memory)
- **Virtualization:** Required for 50+ logs (performance)
- **Deep object inspection:** Limited by depth setting
- **Function comparison:** Identity only (not implementation)

### Browser Compatibility

- **Modern browsers only** - ES2020+ features
- **React 19+** - Uses latest React APIs
- **localStorage required** - For state persistence
- **Console API required** - For dependency tracking

---

## Troubleshooting Guide

### "Maximum update depth exceeded"

**Immediate fix:**
```javascript
__DEBUGSY_EMERGENCY_STOP.activate();
```

**Diagnose:**
```typescript
// Add to problematic component
useWhyDidYouUpdate("ComponentName", props);
useRenderTracker("ComponentName", props);

// Look for ⚠️ FREQUENT warnings in console
```

**Common causes:**
- Unstable callbacks - Fix: `useCallback`
- Unstable objects - Fix: `useMemo`
- useEffect updating its own deps

---

### Dependencies not tracking

**Test:**
```javascript
debugsy.test.dependency();
```

**Check:**
```javascript
debugsy.status.show(); // Check current state
```

**Verify:**
- Import `@workspace/debugsy` in app root
- Run in development mode
- Check console for dependency logs
- Use `useWhyDidYouUpdate` in components

---

### Performance issues

**Emergency:**
```javascript
__DEBUGSY_EMERGENCY_STOP.activate();
// Or via API
debugsy.emergency.activate();
```

**Reduce output:**
```javascript
// Disable specific debug points
debugsy.disable("surface-interaction");
debugsy.disable("dependencies");

// Or disable all except specific ones
debugsy.disableAll();
debugsy.enable("health");
```

**Add monitoring:**
```typescript
useRenderTracker("Component", props, {
  enableFrequencyWarnings: true,
});
```

---

## Future Enhancements

### Planned Features

- **Remote debugging** - Send logs to external service
- **Time-travel debugging** - Replay log history
- **Advanced filters** - Regex, severity, time range
- **Log export** - Download logs as JSON/CSV
- **Performance profiling** - Built-in React Profiler integration
- **Network inspection** - Request/response logging

### Architectural Improvements

- **Plugin system** - Extensible formatter/filter architecture
- **Web Workers** - Offload heavy processing
- **IndexedDB** - Better log storage
- **Streaming** - Real-time log streaming

---

## Migration Guide

### From V1 to V2 UI

**No code changes required** - V2 is default

**To stay on V1:**
```typescript
<DebugsyLook uiVersion="v1" />
```

**To force V2:**
```typescript
<DebugsyLook uiVersion="v2" />
```

**Toggle at runtime:**
- Press `Cmd+Shift+D`
- Or use UI toggle button (when in auto mode)

---

## Related Documentation

- **[User Manual](./user-manual.md)** - Complete usage guide
- **[Quick Reference](./quick-reference.md)** - Common commands
- **[Debug Log Management](./debug-log-management.md)** - Operational guide
- **[Harbuz Showcase](../../harbuz/src/showcase/_agent/README.md)** - UI component patterns

---

**Last Updated:** 2025-11-19  
**Version:** 2.0 (Harbuz Integration Complete)  
**Status:** Production-ready

