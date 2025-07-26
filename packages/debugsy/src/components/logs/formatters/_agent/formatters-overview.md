# Debug Log Formatters Overview

## System Architecture

The Surface debug system uses a **modular formatter architecture** where different log types are handled by specialized formatter components. This provides rich, contextual formatting for complex debug information while maintaining performance and readability.

## 📊 **Available Formatters**

### **1. DefaultLogFormatter** (`default-log-formatter.tsx`)

- **Purpose**: Handles all standard debug log entries
- **Target Debug Points**: All except `health` and `dependencies`
- **Features**:
  - Standard timestamp + point + message + data layout
  - Alternating row colors for readability
  - Hover tooltips for truncated content
  - Emoji-based debug point identification

### **2. HealthLogFormatter** (`health-log-formatter.tsx`)

- **Purpose**: Rich formatting for health snapshot logs
- **Target Debug Point**: `health`
- **Features**:
  - Expandable metric categories (Performance, Debug Activity, Dependencies, etc.)
  - Color-coded values and progress indicators
  - Multi-level data visualization
  - Performance trend analysis

### **3. DependencyLogFormatter** (`dependency-log-formatter.tsx`)

- **Purpose**: Specialized formatting for infinite render debugging
- **Target Debug Point**: `dependencies`
- **Features**:
  - Function/object recreation detection
  - Circuit breaker protection visualization
  - Built-in fix suggestions
  - Render count warnings with severity levels

## 🔄 **Formatter Selection Logic**

```typescript
// In DebugLogsList.tsx - Automatic formatter selection
{log.point === "health" ? (
  <HealthLogFormatter log={log} />
) : log.point === "dependencies" ? (
  <DependencyLogFormatter log={log} />
) : (
  <DefaultLogFormatter log={log} index={index} />  // ← Fallback for all others
)}
```

### **Selection Priority**

1. **Specialized Formatters** - Health and Dependencies get custom formatting
2. **Default Formatter** - All other debug points use standard formatting
3. **Extensible** - Easy to add new specialized formatters

## 🎯 **Debug Point Coverage**

### **Health Logs** (`🏥 health`)

```javascript
🏥 [health] Health snapshot captured
📊 Summary: Application health metrics
⚡ Performance: Memory 45MB/128MB, CPU 4 cores
🎯 Debug Activity: 3 active points, 1,247 total logs
```

### **Dependency Logs** (`🔄 dependencies`)

```javascript
🔄 [ComponentName] Dependencies changed: { callback: {...}, data: {...} }
📝 [ComponentName] onCallback: function changed (function → function)
⚠️ [ComponentName] High render count detected: 15
🚨 [ComponentName] CIRCUIT BREAKER OPEN - Excessive renders detected
```

### **Standard Logs** (All Other Points)

```javascript
🎯 [dispatcher] Mouse event routed to frame handler
⚡ [performance] Frame render completed in 16ms
🌊 [surface-interactions] Pan gesture started
🔍 [custom] Custom debug message
```

## 🎨 **Visual Design System**

### **Color Coding**

- **Blue** - Information and standard logs
- **Green** - Success states and healthy metrics
- **Orange** - Warnings and performance alerts
- **Red** - Errors, critical issues, and circuit breakers
- **Purple** - Special states and emergency actions

### **Interactive Elements**

- **Expandable sections** for complex data
- **Hover tooltips** for additional context
- **Progress indicators** for metrics and copy operations
- **Severity badges** for critical events

### **Typography**

- **Monospace fonts** for timestamps and data
- **Consistent sizing** with 8px-12px range
- **Weight hierarchy** for visual scanning
- **Emoji integration** for quick identification

## 🔧 **Adding New Formatters**

### **1. Create Formatter Component**

```typescript
// my-custom-formatter.tsx
export const MyCustomFormatter: React.FC<{ log: DebugLogEntry }> = ({ log }) => {
  if (log.point !== "my-custom-point") return null;

  return (
    <div>
      {/* Custom formatting logic */}
    </div>
  );
};
```

### **2. Add to Exports**

```typescript
// formatters/index.ts
export { MyCustomFormatter } from "./my-custom-formatter";
```

### **3. Update Selection Logic**

```typescript
// debug-logs-list.tsx
{log.point === "health" ? (
  <HealthLogFormatter log={log} />
) : log.point === "dependencies" ? (
  <DependencyLogFormatter log={log} />
) : log.point === "my-custom-point" ? (
  <MyCustomFormatter log={log} />
) : (
  <DefaultLogFormatter log={log} index={index} />
)}
```

## 📈 **Performance Considerations**

### **Lazy Rendering**

- Formatters only render when log is visible
- Complex expansions are deferred until user interaction
- Memory-efficient with log rotation and truncation

### **Component Optimization**

- Pure components with stable props
- Minimal re-renders through React.memo where appropriate
- CSS-in-JS with object references for style stability

### **Data Handling**

- JSON serialization only when needed
- Truncation for large data objects
- Progressive disclosure for complex structures

## 🚀 **Best Practices**

### **Formatter Design**

1. **Point-specific rendering** - Check `log.point` early and return null if not applicable
2. **Fallback handling** - Graceful degradation if data is missing
3. **Consistent styling** - Use shared utilities from `log-utilities.ts`
4. **Performance awareness** - Avoid expensive operations in render

### **Data Structure**

1. **Structured logging** - Use consistent data shapes for similar log types
2. **Rich metadata** - Include context for better formatting
3. **Error boundaries** - Handle malformed data gracefully
4. **Type safety** - Use TypeScript interfaces for log data

### **User Experience**

1. **Progressive disclosure** - Show summary first, details on demand
2. **Visual hierarchy** - Use size, color, and spacing effectively
3. **Actionable feedback** - Include fix suggestions where possible
4. **Accessibility** - Maintain contrast and keyboard navigation

## 🔍 **Debug Workflow Integration**

### **Development Debugging**

```javascript
// Enable multiple points with specialized formatting
surfaceDebug.enable("dependencies"); // → DependencyLogFormatter
surfaceDebug.enable("health"); // → HealthLogFormatter
surfaceDebug.enable("performance"); // → DefaultLogFormatter
```

### **Production Monitoring**

```javascript
// Health snapshots with rich metrics display
surfaceDebug.captureHealthSnapshot(); // → Formatted health dashboard

// Performance analysis with dependency tracking
surfaceDebug.deps.normal(); // → Infinite render debugging
```

### **Team Collaboration**

- **Copy/export functionality** works across all formatters
- **Consistent timestamps** for log correlation
- **Rich formatting** makes issues easier to understand and share

## 🎯 **Extending the System**

### **Future Formatter Ideas**

- **NetworkLogFormatter** - For API call debugging with request/response visualization
- **StateLogFormatter** - For Redux/state management debugging with diff views
- **ErrorLogFormatter** - For enhanced error display with stack traces and context
- **MetricsLogFormatter** - For time-series data with mini-charts

### **Architecture Benefits**

- **Modular design** makes adding new formatters straightforward
- **Consistent interfaces** ensure predictable behavior
- **Shared utilities** reduce code duplication
- **Type safety** prevents runtime errors

The formatter system provides a scalable, maintainable foundation for rich debug log visualization while keeping the core logging system simple and performant! 🎯
