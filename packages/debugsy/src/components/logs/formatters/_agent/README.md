# Debugsy Formatter System - Simple & Fast 🚀

## 🎯 **Quick Overview**

The formatter system is **simple and performant**:

- **Direct imports** - No complex loading
- **Easy configuration** - Add to registry
- **Great performance** - Static references only

## ⚡ **Adding a New Formatter (3 Steps)**

### **1. Create Component**

```typescript
// my-formatter.tsx
export const MyExpansionContent: React.FC<{ log: DebugLogEntry }> = ({ log }) => (
  <div style={{ padding: "8px", backgroundColor: "#f3f4f6" }}>
    <h4>Custom: {log.message}</h4>
    <pre>{JSON.stringify(log.data, null, 2)}</pre>
  </div>
);

export const getMyLogMeta = (log: DebugLogEntry) => ({
  severity: "info" as LogSeverity,
  shouldExpand: true,
});
```

### **2. Add to Registry**

```typescript
// formatter-routing.ts
import { MyExpansionContent, getMyLogMeta } from "./my-formatter";

export const FORMATTER_REGISTRY = {
  // ... existing formatters
  myType: {
    expansionComponent: MyExpansionContent,
    metaFunction: getMyLogMeta,
    displayName: "My Formatter",
    alwaysExpand: true,
    defaultSeverity: "info",
  },
};
```

### **3. Use It**

```typescript
debug.log("myType", { message: "Hello World" });
// ✅ Automatically uses your custom formatter!
```

## 📊 **Current Formatters**

| Type           | Component                       | Purpose                                       |
| -------------- | ------------------------------- | --------------------------------------------- |
| `dependencies` | `DependencyExpansionContent`    | Dependency tracking/infinite render debugging |
| `health`       | `HealthExpansionContent`        | System health snapshots                       |
| `__sanitized`  | `SanitizedDataExpansionContent` | Sanitized problematic data                    |
| _default_      | `DefaultExpandedContent`        | JSON display for other types                  |

## 🔧 **Advanced Examples**

### **Conditional Formatting**

```typescript
export const StatusExpansionContent: React.FC<{ log: DebugLogEntry }> = ({ log }) => {
  const isError = log.data?.status === "error";
  return (
    <div style={{ borderLeft: `4px solid ${isError ? "red" : "green"}` }}>
      <strong>Status:</strong> {log.data?.status || "unknown"}
      {isError && <div style={{ color: "red" }}>❌ {log.data?.error}</div>}
    </div>
  );
};
```

### **API Call Formatter**

```typescript
export const ApiExpansionContent: React.FC<{ log: DebugLogEntry }> = ({ log }) => {
  const { method, url, status, duration } = log.data || {};
  return (
    <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
      <div>
        <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{method}</span>
        <span> {url}</span>
        <span style={{ color: status >= 400 ? "red" : "green" }}> ({status})</span>
        <span style={{ color: "#6b7280" }}> {duration}ms</span>
      </div>
    </div>
  );
};
```

## 🏗️ **System Architecture**

```
DebugLogsList
└── DefaultLogFormatter (all logs)
    ├── Base formatting (timestamp, point, message)
    ├── getLogTypeMeta() → severity & expand behavior
    └── getExpansionContent() → custom content
        ├── dependencies → DependencyExpansionContent
        ├── health → HealthExpansionContent
        ├── __sanitized → SanitizedDataExpansionContent
        └── default → DefaultExpandedContent
```

## ✅ **Benefits**

- **🚀 Easy**: Just create component + add to registry
- **⚡ Fast**: Direct imports, O(1) lookups
- **🧹 Simple**: No caching, optimization, or complexity
- **🔧 Flexible**: Any React component works
- **📦 Efficient**: Tree-shakable, unused formatters excluded
- **🔍 Type Safe**: Full TypeScript support

---

**Need help?** Check existing formatters in this directory for examples! 💡
