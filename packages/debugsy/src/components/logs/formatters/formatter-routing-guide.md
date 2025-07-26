# Formatter Routing System - Developer Guide

## 🎯 **Overview**

The **Formatter Routing System** provides a centralized, configuration-driven approach to adding new log formatters. Instead of modifying the core `DefaultLogFormatter` or `DebugLogsList` components, you simply register your formatter in the routing configuration.

## 🚀 **Adding a New Formatter - Quick Start**

### **Step 1: Create Your Expansion Component**

Create a new file for your expansion content:

```typescript
// packages/debugsy/src/components/logs/formatters/my-new-expansion-formatter.tsx
"use client";

import React, { useMemo } from "react";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import type { LogSeverity } from "./default-log-formatter";
import { formatTime } from "./health-expansion-formatter";

/**
 * OPTIMIZED: My new expansion content with memoized computations
 */
export const MyNewExpansionContent: React.FC<{ log: DebugLogEntry }> = React.memo(({ log }) => {
  // Memoize your content processing
  const processedData = useMemo(() => {
    // Your custom processing logic here
    return {
      // ... your processed data
    };
  }, [log.data, log.message]);

  return (
    <div style={{ fontFamily: "monospace" }}>
      {/* Your custom expansion content */}
      <div style={{ color: "#60a5fa", fontSize: "9px", fontWeight: "bold" }}>
        🎯 My Custom Log Type: {log.point}
      </div>
      {/* Add your custom content here */}
    </div>
  );
});

MyNewExpansionContent.displayName = "MyNewExpansionContent";

/**
 * OPTIMIZED: Get log metadata for external use
 */
export const getMyNewLogMeta = (log: DebugLogEntry) => {
  if (log.point !== "myLogType") {
    return null;
  }

  // Your custom logic to determine severity
  const severity: LogSeverity = log.message.includes("ERROR") ? "error" : "info";

  return {
    severity,
    shouldExpand: true, // or your custom logic
    // Add any custom metadata here
    customField: "customValue"
  };
};

// Export both expansion content and metadata function
export default MyNewExpansionContent;
```

### **Step 2: Register Your Formatter**

Add your formatter to the registry in `formatter-routing.ts`:

```typescript
// In packages/debugsy/src/components/logs/formatters/formatter-routing.ts

const FORMATTER_REGISTRY: Record<string, FormatterConfig> = {
  dependencies: {
    /* ... existing ... */
  },
  health: {
    /* ... existing ... */
  },

  // ✅ ADD YOUR NEW FORMATTER HERE:
  myLogType: {
    expansionComponent: "./my-new-expansion-formatter",
    metaFunction: "getMyNewLogMeta",
    displayName: "My New Formatter",
    alwaysExpand: false,
    defaultSeverity: "info",
  },

  // That's it! Your formatter is now active 🎉
};
```

### **Step 3: Test Your Formatter**

```typescript
// Your logs with log.point = "myLogType" will now automatically use your formatter!
const testLog: DebugLogEntry = {
  timestamp: Date.now(),
  point: "myLogType", // This triggers your formatter
  message: "Test message",
  data: { custom: "data" },
};
```

## 🏗️ **Architecture Benefits**

### **Before (Manual Integration)**

```typescript
// ❌ Old way - Required manual editing of core files
// In DebugLogsList.tsx:
if (log.point === "health") return <HealthLogFormatter log={log} />;
if (log.point === "dependencies") return <DependencyLogFormatter log={log} />;
if (log.point === "myLogType") return <MyNewLogFormatter log={log} />; // Manual addition
return <DefaultLogFormatter log={log} index={index} />;
```

### **After (Configuration-Driven)**

```typescript
// ✅ New way - Zero code changes, just configuration
// In formatter-routing.ts:
myLogType: {
  expansionComponent: "./my-new-expansion-formatter",
  metaFunction: "getMyNewLogMeta",
  displayName: "My New Formatter"
}
// Done! Automatic routing ✨
```

## 📋 **FormatterConfig Interface**

```typescript
interface FormatterConfig {
  /** Module path for dynamic import (relative to formatters directory) */
  expansionComponent: string;

  /** Function name that returns metadata for this log type */
  metaFunction: string;

  /** Human-readable name for debugging */
  displayName: string;

  /** Whether this formatter should always show expand button */
  alwaysExpand?: boolean;

  /** Default severity when metadata function isn't available */
  defaultSeverity?: LogSeverity;
}
```

## 🔧 **Advanced Usage**

### **Dynamic Registration (Runtime)**

```typescript
import { registerFormatter } from "./formatters/formatter-routing";

// Register a formatter at runtime
registerFormatter("dynamicType", {
  expansionComponent: "./dynamic-expansion-formatter",
  metaFunction: "getDynamicLogMeta",
  displayName: "Dynamic Formatter",
  alwaysExpand: true,
  defaultSeverity: "warn",
});
```

### **Conditional Formatting**

```typescript
// In your meta function
export const getMyNewLogMeta = (log: DebugLogEntry) => {
  if (log.point !== "myLogType") return null;

  // Conditional severity based on content
  let severity: LogSeverity = "info";
  if (log.message.includes("CRITICAL")) severity = "critical";
  else if (log.message.includes("ERROR")) severity = "error";
  else if (log.message.includes("WARN")) severity = "warn";

  // Conditional expansion based on data
  const shouldExpand = !!(log.data && Object.keys(log.data).length > 0);

  return {
    severity,
    shouldExpand,
    priority: log.message.includes("CRITICAL") ? "high" : "normal",
  };
};
```

### **Custom Content Based on Data**

```typescript
export const MyAdvancedExpansionContent: React.FC<{ log: DebugLogEntry }> = React.memo(({ log }) => {
  const contentType = useMemo(() => {
    if (log.data?.type === "error") return "error";
    if (log.data?.type === "performance") return "performance";
    return "default";
  }, [log.data?.type]);

  return (
    <div style={{ fontFamily: "monospace" }}>
      {contentType === "error" && <ErrorSpecificContent log={log} />}
      {contentType === "performance" && <PerformanceSpecificContent log={log} />}
      {contentType === "default" && <DefaultSpecificContent log={log} />}
    </div>
  );
});
```

## 🛠️ **Debugging & Utilities**

### **Validate All Formatters**

```typescript
import { validateFormatters } from "./formatters/formatter-routing";

// Check if all registered formatters can be loaded
const validation = await validateFormatters();
console.log("Valid formatters:", validation.valid);
console.log("Invalid formatters:", validation.invalid);
console.log("Errors:", validation.errors);
```

### **List Registered Formatters**

```typescript
import { getRegisteredFormatterTypes } from "./formatters/formatter-routing";

const types = getRegisteredFormatterTypes();
console.log("Registered formatter types:", types);
// Output: ["dependencies", "health", "myLogType"]
```

### **Get Formatter Configuration**

```typescript
import { getFormatterConfig } from "./formatters/formatter-routing";

const config = getFormatterConfig("myLogType");
console.log("Config:", config);
// Output: { expansionComponent: "./my-new-expansion-formatter", ... }
```

### **Development Helper**

```typescript
import { _dev } from "./formatters/formatter-routing";

// Access internal registry for debugging
console.log("Registry:", _dev.registry);
console.log("Module cache:", _dev.cache);

// Validate all formatters
await _dev.validate();

// Clear cache during development
_dev.clear();
```

## 🎨 **Styling Guidelines**

### **Consistent Visual Design**

```typescript
// Use consistent color palette
const COLORS = {
  primary: "#60a5fa",     // Blue for headers
  success: "#10b981",     // Green for success states
  warning: "#f59e0b",     // Yellow for warnings
  error: "#ef4444",       // Red for errors
  muted: "#9ca3af",       // Gray for secondary text
  background: "#0f172a22" // Dark background for content areas
};

// Example usage in your expansion content
<div style={{
  color: COLORS.primary,
  fontSize: "9px",
  fontWeight: "bold"
}}>
  🎯 Your Header Text
</div>
```

### **Performance-Optimized Patterns**

```typescript
// ✅ Memoize expensive computations
const processedData = useMemo(() => {
  return expensiveProcessing(log.data);
}, [log.data]);

// ✅ Use React.memo for components
export const MyExpansionContent: React.FC<{ log: DebugLogEntry }> = React.memo(
  ({ log }) => {
    // component logic
  }
);

// ✅ Memoize object creation
const styleConfig = useMemo(
  () => ({
    container: { fontFamily: "monospace" },
    header: { color: "#60a5fa", fontSize: "9px" },
  }),
  []
);
```

## 📊 **Real-World Examples**

### **API Request Formatter**

```typescript
// api-request-expansion-formatter.tsx
export const ApiRequestExpansionContent: React.FC<{ log: DebugLogEntry }> = React.memo(({ log }) => {
  const requestData = useMemo(() => {
    const data = log.data;
    return {
      method: data?.method || "GET",
      url: data?.url || "unknown",
      status: data?.status || "pending",
      duration: data?.duration || null
    };
  }, [log.data]);

  return (
    <div style={{ fontFamily: "monospace" }}>
      <div style={{ color: "#60a5fa", fontSize: "9px", fontWeight: "bold" }}>
        🌐 API Request: {requestData.method} {requestData.url}
      </div>
      <div style={{ marginTop: "4px" }}>
        <span style={{ color: "#9ca3af" }}>Status:</span> {requestData.status}
        {requestData.duration && (
          <>
            <span style={{ color: "#9ca3af", marginLeft: "12px" }}>Duration:</span> {requestData.duration}ms
          </>
        )}
      </div>
    </div>
  );
});

export const getApiRequestLogMeta = (log: DebugLogEntry) => {
  if (log.point !== "apiRequest") return null;

  const status = log.data?.status;
  let severity: LogSeverity = "info";
  if (status >= 500) severity = "error";
  else if (status >= 400) severity = "warn";
  else if (status >= 200 && status < 300) severity = "success";

  return { severity, shouldExpand: true };
};

// Register in formatter-routing.ts:
apiRequest: {
  expansionComponent: "./api-request-expansion-formatter",
  metaFunction: "getApiRequestLogMeta",
  displayName: "API Request Formatter",
  alwaysExpand: true,
  defaultSeverity: "info"
}
```

### **Database Query Formatter**

```typescript
// database-expansion-formatter.tsx
export const DatabaseExpansionContent: React.FC<{ log: DebugLogEntry }> = React.memo(({ log }) => {
  const queryData = useMemo(() => ({
    query: log.data?.query || "SELECT * FROM table",
    executionTime: log.data?.executionTime || 0,
    rowsAffected: log.data?.rowsAffected || 0,
    error: log.data?.error || null
  }), [log.data]);

  return (
    <div style={{ fontFamily: "monospace" }}>
      <div style={{ color: "#60a5fa", fontSize: "9px", fontWeight: "bold" }}>
        🗄️ Database Query ({queryData.executionTime}ms)
      </div>
      <div style={{
        backgroundColor: "#0f172a22",
        padding: "4px",
        marginTop: "4px",
        borderRadius: "2px",
        fontSize: "8px"
      }}>
        {queryData.query}
      </div>
      {queryData.error && (
        <div style={{ color: "#ef4444", fontSize: "8px", marginTop: "4px" }}>
          ❌ Error: {queryData.error}
        </div>
      )}
    </div>
  );
});

// Register in formatter-routing.ts:
database: {
  expansionComponent: "./database-expansion-formatter",
  metaFunction: "getDatabaseLogMeta",
  displayName: "Database Formatter"
}
```

## ✅ **Best Practices**

1. **🎯 Single Responsibility**: Each formatter should handle one specific log type
2. **⚡ Performance**: Always use `React.memo` and `useMemo` for expensive operations
3. **🎨 Consistency**: Follow the established color palette and styling patterns
4. **🔍 Debugging**: Provide meaningful display names and error handling
5. **📝 Documentation**: Document your formatter's purpose and data structure expectations
6. **🧪 Testing**: Use the validation utilities to ensure your formatter loads correctly

## 🚀 **Future Enhancements**

The routing system is designed to be extensible. Planned features include:

- **Plugin System**: Load formatters from external packages
- **Theme Support**: Configurable color schemes
- **Template System**: Pre-built formatter templates
- **Validation Rules**: Schema validation for log data
- **Performance Monitoring**: Built-in performance metrics for formatters

---

**The new routing system makes adding formatters as simple as creating a component and adding a configuration entry. No more core file modifications required!** 🎉
