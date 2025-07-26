# DefaultLogFormatter Usage Guide

## Overview

The `DefaultLogFormatter` is the standard formatter for regular debug log entries in the Surface debug system. It provides consistent, clean formatting for all debug points except those with specialized formatters (health and dependencies).

## 🎯 **Purpose**

### **Extracted from DebugLogsList**

The `DefaultLogFormatter` was extracted from the inline formatting logic in `DebugLogsList` to:

- ✅ **Improve maintainability** - Centralized formatting logic
- ✅ **Enable reusability** - Can be used in other debug panels
- ✅ **Consistent architecture** - Follows the same pattern as other formatters
- ✅ **Easier testing** - Isolated component for unit testing

### **Universal Log Handler**

Handles all debug points except:

- `"health"` → Uses `HealthLogFormatter`
- `"dependencies"` → Uses `DependencyLogFormatter`

## 🎨 **Visual Layout**

### **Standard Log Format**

```
[timestamp] [emoji][point] [message] [data]
```

### **Component Breakdown**

1. **Timestamp** - Last 8 characters of formatted time (e.g., `14:23:56`)
2. **Debug Point** - Emoji + truncated point name (e.g., `🎯 disp`)
3. **Message** - Full log message with hover tooltip
4. **Data** - Formatted data object (if present) with hover tooltip

## 🔧 **Props Interface**

```typescript
interface DefaultLogFormatterProps {
  log: DebugLogEntry; // The log entry to format
  index: number; // Position in log list (for alternating colors)
}
```

## 📊 **Supported Debug Points**

### **Dispatcher Logs** (`🎯`)

```javascript
🎯 [dispatcher] Mouse event routed to frame handler
🎯 [dispatcher] Handler registration: frameInteraction
```

### **Performance Logs** (`⚡`)

```javascript
⚡ [performance] Frame render completed in 16ms
⚡ [performance] Memory usage: 45MB / 128MB
```

### **Surface Interactions** (`🌊`)

```javascript
🌊 [surface-interactions] Pan gesture started
🌊 [surface-interactions] Zoom level changed: 1.0 → 1.5
```

### **Custom Debug Points**

Any debug point not handled by specialized formatters:

```javascript
🔍 [custom] Custom debug message
📈 [analytics] User action tracked
🛠️ [tools] Tool state changed
```

## 🎨 **Visual Features**

### **Alternating Row Colors**

Uses `getLogEntryBackgroundColor(index)` for alternating backgrounds:

- Even rows: Slightly darker background
- Odd rows: Slightly lighter background
- Improves readability in long log lists

### **Truncated Debug Points**

Debug point names are truncated to 40px width with ellipsis:

- Full name shown on hover
- Maintains consistent layout
- Prevents wide point names from breaking layout

### **Data Formatting**

Log data is intelligently formatted:

- Objects/arrays shown as `{...}` or `[...]`
- Primitive values shown directly
- Full JSON available on hover
- Uses `formatDataForDisplay()` utility

### **Responsive Design**

- Flexbox layout adapts to container width
- Text overflow handling with ellipsis
- Hover tooltips for truncated content

## 🔄 **Integration Flow**

### **Automatic Selection**

```typescript
// In DebugLogsList.tsx
{log.point === "health" ? (
  <HealthLogFormatter log={log} />
) : log.point === "dependencies" ? (
  <DependencyLogFormatter log={log} />
) : (
  <DefaultLogFormatter log={log} index={index} />  // ← Default handler
)}
```

### **Manual Usage**

```typescript
import { DefaultLogFormatter } from "@workspace/surface/logs/formatters";

// Use in custom debug panels
<DefaultLogFormatter
  log={logEntry}
  index={0}
/>
```

## 🧪 **Testing Example**

```typescript
import { DefaultLogFormatter } from "./default-log-formatter";

const mockLog: DebugLogEntry = {
  timestamp: Date.now(),
  level: "info",
  point: "custom",
  message: "Test debug message",
  data: { key: "value" },
  sessionId: "test",
};

// Renders standard log format
<DefaultLogFormatter log={mockLog} index={0} />
```

## 💡 **Design Benefits**

### **Modular Architecture**

- **Separation of concerns** - Formatting logic isolated from list logic
- **Testable components** - Each formatter can be tested independently
- **Consistent patterns** - All formatters follow the same component pattern

### **Performance Optimized**

- **Minimal re-renders** - Pure component with stable props
- **Efficient styling** - CSS-in-JS with object references
- **Memory efficient** - No complex state management

### **Developer Experience**

- **Type safety** - Full TypeScript support with props interface
- **IntelliSense** - Auto-completion for all props and utilities
- **Documentation** - Clear usage examples and integration guides

## 🚀 **Usage in Production**

### **Real-time Logging**

```javascript
// Enable any debug point and see formatted logs
surfaceDebug.enable("performance");
surfaceDebug.enable("custom");

// Logs automatically use DefaultLogFormatter for display
debug.log("performance", "Frame rendered", { duration: "16ms" });
debug.log("custom", "User interaction", { type: "click" });
```

### **Custom Debug Points**

```javascript
// Create custom debug points with automatic formatting
surfaceDebug.enable("analytics");
debug.log("analytics", "User action tracked", {
  action: "button_click",
  target: "save",
});

// Appears as: 📈 [analytics] User action tracked {action: "button_click", target: "save"}
```

The `DefaultLogFormatter` provides a clean, consistent foundation for all regular debug logs while maintaining the specialized formatting capabilities for complex log types! 🎯
