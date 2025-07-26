# Default Expand Behavior & Gray Edge Styling

## Overview

The `DefaultLogFormatter` now provides **automatic expand functionality** and **gray left edge indicators** for all debug logs, creating a consistent and interactive logging experience.

## 🎯 **Key Changes**

### **1. Gray Left Edge by Default**

- ✅ All logs now have a **gray left border** instead of transparent
- ✅ Provides visual consistency and entry separation
- ✅ Color changes based on severity (red for error, orange for warn, etc.)

### **2. Automatic Expand Buttons**

- ✅ **Expand button appears automatically** when log has data
- ✅ No need to explicitly set `showExpandButton={true}` in most cases
- ✅ Can be overridden with explicit `showExpandButton` prop

### **3. Default Pretty JSON Content**

- ✅ **Automatic pretty-printed JSON** display when expanded
- ✅ Syntax highlighting and proper formatting
- ✅ Scrollable content with max height limit

## 🎨 **Visual Changes**

### **Before**

```
   14:23:45 🎯 disp     Mouse event routed          {handler: "frame"}
   14:23:46 🔄 deps     Dependencies changed        {callback: {...}}
   14:23:47 🏥 health   Health snapshot captured    [no data preview]
```

### **After**

```
┃  14:23:45 🎯 disp     Mouse event routed          ▶ details
┃  14:23:46 🔄 deps     Dependencies changed        ▶ details
┃  14:23:47 🏥 health   Health snapshot captured    ▶ details
```

### **Expanded State**

```
┃  14:23:45 🎯 disp     Mouse event routed          ▼ collapse
    ┃ 📊 Log Data:
    ┃ {
    ┃   "handler": "frame",
    ┃   "target": "interaction",
    ┃   "timestamp": 1699234567890
    ┃ }
```

## 🔧 **New Behavior Logic**

### **Automatic Expand Detection**

```typescript
// DefaultLogFormatter automatically decides to show expand button
const shouldShowExpand =
  showExpandButton !== undefined ? showExpandButton : !!log.data;

// If log has data → show expand button
// If log has no data → no expand button
// If explicitly set → use explicit value
```

### **State Management**

```typescript
// Internal state for logs without external control
const [internalExpanded, setInternalExpanded] = useState(false);

// Use external state if provided, otherwise use internal
const isCurrentlyExpanded = onToggleExpand ? isExpanded : internalExpanded;
const handleToggle =
  onToggleExpand || (() => setInternalExpanded(!internalExpanded));
```

### **Content Rendering**

```typescript
// Use custom content if provided, otherwise pretty JSON
const contentToShow = expandedContent || <DefaultExpandedContent log={log} />;
```

## 📊 **Severity-Based Left Edge Colors**

### **Color Mapping**

- **Critical** (`🚨`): `#dc2626` (dark red) + glow effect
- **Error**: `#ef4444` (red)
- **Warning** (`⚠️`): `#f59e0b` (orange)
- **Success** (`✅`): `#10b981` (green)
- **Info** (default): `#6b7280` (gray) ← **NEW DEFAULT**

### **Visual Impact**

```
🚨┃ [CRITICAL] Circuit breaker activated      ▶ details
  ┃ [ERROR] Function recreation detected      ▶ details
⚠️┃ [WARN] High render count: 15             ▶ details
✅┃ [SUCCESS] System healthy                  ▶ details
  ┃ [INFO] Mouse event dispatched            ▶ details
```

## 🚀 **Usage Examples**

### **Basic Usage (Automatic)**

```typescript
// No props needed - automatic expand for logs with data
<DefaultLogFormatter log={logEntry} index={0} />

// Automatically shows:
// - Gray left border
// - Expand button if log.data exists
// - Pretty JSON when expanded
```

### **Custom Severity**

```typescript
// Override severity for custom styling
<DefaultLogFormatter
  log={logEntry}
  index={0}
  severity="error"  // Red left border + error styling
/>
```

### **Custom Expanded Content**

```typescript
// Override default JSON with custom content
<DefaultLogFormatter
  log={logEntry}
  index={0}
  expandedContent={<MyCustomContent log={logEntry} />}
/>
```

### **Disable Expand**

```typescript
// Explicitly disable expand even if data exists
<DefaultLogFormatter
  log={logEntry}
  index={0}
  showExpandButton={false}
/>
```

### **External State Control**

```typescript
// Control expand state externally (like specialized formatters)
const [expanded, setExpanded] = useState(false);

<DefaultLogFormatter
  log={logEntry}
  index={0}
  isExpanded={expanded}
  onToggleExpand={() => setExpanded(!expanded)}
  expandedContent={<RichCustomContent />}
/>
```

## 🎯 **Specialized Formatter Integration**

### **Health & Dependency Formatters**

```typescript
// Specialized formatters now explicitly control expand behavior
export const HealthLogFormatter = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <DefaultLogFormatter
      log={log}
      severity={getHealthSeverity(log.data)}
      showExpandButton={true} // Explicit control
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      expandedContent={<HealthMetricsContent log={log} />}
    />
  );
};
```

## 📈 **Performance Benefits**

### **Progressive Disclosure**

- ✅ **Lazy rendering** - Complex content only when expanded
- ✅ **Better scrolling** - Less DOM complexity by default
- ✅ **Memory efficient** - JSON parsing only when needed

### **Consistent Interactions**

- ✅ **Same click behavior** - All logs expand the same way
- ✅ **Visual feedback** - Consistent expand/collapse indicators
- ✅ **Keyboard navigation** - Standard interaction patterns

## 🎨 **Default JSON Formatting**

### **Features**

- **Syntax highlighting** with monospace font
- **Proper indentation** with 2-space formatting
- **Scrollable container** with 200px max height
- **Border styling** matching log severity
- **Copy-friendly** text selection

### **Example Output**

```json
📊 Log Data:
{
  "handler": "frameInteraction",
  "position": {
    "x": 150,
    "y": 200
  },
  "timestamp": 1699234567890,
  "metadata": {
    "source": "mouseDispatcher",
    "type": "click"
  }
}
```

## 🎯 **Migration Guide**

### **No Changes Needed For:**

- ✅ Regular logs using `DefaultLogFormatter` directly
- ✅ Specialized formatters (they override expand behavior)
- ✅ Existing log rendering logic

### **Benefits Gained:**

- ✅ **Automatic expand buttons** for all logs with data
- ✅ **Gray left borders** for better visual separation
- ✅ **Pretty JSON rendering** without custom formatting
- ✅ **Consistent interaction** across all log types

The enhanced DefaultLogFormatter now provides a rich, interactive logging experience out of the box while maintaining full compatibility with existing specialized formatters! 🎯
