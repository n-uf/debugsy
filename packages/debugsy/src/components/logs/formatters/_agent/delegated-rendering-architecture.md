# Delegated Rendering Architecture

## Overview

All debug log formatters now use a **delegated rendering architecture** where they delegate base rendering to `DefaultLogFormatter` and provide rich, specialized content only when expanded. This creates a consistent, clean interface with progressive disclosure.

## 🎯 **Architecture Benefits**

### **Consistent Base Appearance**

- ✅ All logs look the same when collapsed - standard timestamp, point, message layout
- ✅ Severity indicators and styling are consistent across all log types
- ✅ Expand buttons and interactions work the same way everywhere

### **Progressive Disclosure**

- ✅ Simple view by default - reduces visual noise in long log lists
- ✅ Rich details available on demand - click to expand specialized content
- ✅ Better performance - complex formatting only rendered when needed

### **Unified Severity System**

- ✅ All logs support severity levels: `info`, `warn`, `error`, `critical`, `success`
- ✅ Color-coded severity with consistent visual language
- ✅ Automatic severity detection based on log content

## 🔄 **Rendering Flow**

### **1. Base Rendering (DefaultLogFormatter)**

```typescript
<DefaultLogFormatter
  log={log}
  index={0}
  severity={determineSeverity(log)}
  showExpandButton={true}
  isExpanded={isExpanded}
  onToggleExpand={() => setIsExpanded(!isExpanded)}
  expandedContent={<RichContent log={log} />}
/>
```

### **2. Specialized Content (Only When Expanded)**

```typescript
const RichContent = ({ log }) => (
  <div>
    {/* Specialized formatter logic here */}
    {/* Only renders when expand button is clicked */}
  </div>
);
```

## 📊 **Updated Formatter Patterns**

### **HealthLogFormatter**

```typescript
// Before: Complex standalone component
export const HealthLogFormatter = ({ log }) => {
  // 500+ lines of complex rendering logic
};

// After: Delegated rendering with expand
export const HealthLogFormatter = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const severity = getHealthSeverity(log.data);

  return (
    <DefaultLogFormatter
      log={log}
      severity={severity}
      showExpandButton={true}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      expandedContent={<HealthMetricsContent log={log} />}
    />
  );
};
```

### **DependencyLogFormatter**

```typescript
// Before: Custom styled component from scratch
export const DependencyLogFormatter = ({ log }) => {
  // Complex styling and layout logic
};

// After: Delegated rendering with smart severity
export const DependencyLogFormatter = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const logType = parseDependencyLogType(log.message);
  const severity = getDependencySeverity(logType, log.message);

  return (
    <DefaultLogFormatter
      log={log}
      severity={severity}
      showExpandButton={true}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      expandedContent={
        <DependencyDetailsContent
          log={log}
          logType={logType}
        />
      }
    />
  );
};
```

### **DefaultLogFormatter (Enhanced)**

```typescript
// Now supports severity and expand functionality
export const DefaultLogFormatter = ({
  log,
  index,
  severity = "info", // NEW: Severity support
  showExpandButton = false, // NEW: Expand functionality
  isExpanded = false,
  onToggleExpand,
  expandedContent, // NEW: Custom content when expanded
}) => {
  // Severity styling, expand button, content delegation
};
```

## 🎨 **Severity System**

### **Severity Levels**

```typescript
type LogSeverity = "info" | "warn" | "error" | "critical" | "success";
```

### **Visual Indicators**

- **Critical** (`🚨`): Red border, red glow, red text - Circuit breakers, emergency stops
- **Error** (`❌`): Red border, red background - Function recreation, infinite loops
- **Warn** (`⚠️`): Orange border, orange background - Performance warnings, frequent changes
- **Success** (`✅`): Green border, green background - Healthy systems, successful operations
- **Info** (no emoji): Standard appearance - Regular debug information

### **Automatic Severity Detection**

#### **Health Logs**

```typescript
const getHealthSeverity = (data): LogSeverity => {
  if (data.debugActivity?.emergencyMode === "active") return "critical";
  if (data.dependencyTracking?.circuitBreakers?.some((cb) => cb.isOpen))
    return "error";
  if (data.performance?.memoryUsage?.usage > 0.8) return "warn";
  if (data.debugActivity?.systemStatus === "healthy") return "success";
  return "info";
};
```

#### **Dependency Logs**

```typescript
const getDependencySeverity = (logType, message): LogSeverity => {
  switch (logType) {
    case "circuit-breaker":
    case "emergency-stop":
      return "critical";
    case "render-warning":
      return "warn";
    case "function-recreation":
    case "object-recreation":
      return message.includes("⚠️ FREQUENT") ? "warn" : "error";
    default:
      return "info";
  }
};
```

## 🔧 **Implementation Guide**

### **Step 1: Create Rich Content Component**

```typescript
const MyRichContent: React.FC<{ log: DebugLogEntry }> = ({ log }) => {
  return (
    <div style={{ fontFamily: "monospace" }}>
      {/* Your specialized formatting logic */}
    </div>
  );
};
```

### **Step 2: Implement Severity Detection**

```typescript
const getMyLogSeverity = (log: DebugLogEntry): LogSeverity => {
  // Analyze log content and return appropriate severity
  if (log.message.includes("ERROR")) return "error";
  if (log.message.includes("WARN")) return "warn";
  return "info";
};
```

### **Step 3: Create Delegating Formatter**

```typescript
export const MyLogFormatter: React.FC<{ log: DebugLogEntry }> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (log.point !== "my-point") return null;

  const severity = getMyLogSeverity(log);

  return (
    <DefaultLogFormatter
      log={log}
      index={0}
      severity={severity}
      showExpandButton={true}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      expandedContent={<MyRichContent log={log} />}
    />
  );
};
```

## 🚀 **Performance Benefits**

### **Lazy Content Rendering**

- Rich content only renders when expanded
- Improves performance with large log lists
- Reduces memory usage for complex visualizations

### **Consistent Layout**

- No layout shifts between different log types
- Predictable spacing and alignment
- Better user experience when scanning logs

### **Efficient State Management**

- Single expand/collapse state per formatter
- No complex nested state management
- Easier testing and debugging

## 📱 **User Experience**

### **Before (Inconsistent)**

```
🏥 [health] ━━━━━━━━━━━━ Complex Health Display ━━━━━━━━━━━━
     Performance: Memory 45MB/128MB, CPU 4 cores
     Debug Activity: 3 active points, 1,247 total logs
     [Always visible, takes up lots of space]

🔄 [dependencies] ╔══════ Function Recreation Warning ══════╗
                  ║ Component: MyComponent                   ║
                  ║ onCallback: function changed            ║
                  ║ [Complex styling, different appearance] ║
                  ╚═════════════════════════════════════════╝

🎯 [dispatcher] Mouse event routed to frame handler
```

### **After (Consistent with Progressive Disclosure)**

```
🚨 14:23:45 🏥 health    Health snapshot captured               ▶ details
⚠️ 14:23:46 🔄 deps     [MyComponent] onCallback: function... ▶ details
   14:23:47 🎯 disp     Mouse event routed to frame handler

// Click to expand:
🚨 14:23:45 🏥 health    Health snapshot captured               ▼ collapse
    ┃ 📊 Application health metrics
    ┃ ⚡ Performance: Detailed metrics with expandable categories
    ┃ 🎯 Debug Activity: System status and statistics
    ┃ [Rich content only when needed]
```

## 🎯 **Benefits Summary**

### **For Developers**

- ✅ **Consistent APIs** - All formatters follow the same pattern
- ✅ **Easier maintenance** - Shared base functionality
- ✅ **Better testing** - Isolated rich content components
- ✅ **Faster development** - Reuse DefaultLogFormatter capabilities

### **For Users**

- ✅ **Clean interface** - Less visual noise by default
- ✅ **Progressive disclosure** - Details available when needed
- ✅ **Consistent interactions** - Same expand/collapse behavior everywhere
- ✅ **Better performance** - Faster rendering of large log lists

### **For System**

- ✅ **Unified severity** - Consistent error/warning/info classification
- ✅ **Shared styling** - Common visual language across all log types
- ✅ **Extensible architecture** - Easy to add new specialized formatters

The delegated rendering architecture transforms the debug logs system from a collection of different-looking components into a unified, consistent, and performant logging interface! 🎯
