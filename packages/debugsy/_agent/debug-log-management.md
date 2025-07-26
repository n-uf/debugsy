# Debug Log Management System

## Overview

The debug system implements a two-tier log management strategy to balance comprehensive logging with optimal performance:

1. **Storage Limit**: Maximum 10,000 logs kept in memory
2. **Rendering Limit**: Maximum 1,000 logs displayed in UI

## Architecture

### Storage Layer (`use-debug.ts`)

- **Constant**: `MAX_STORED_LOGS = 10000`
- **Behavior**: When adding a new log entry, if the total count would exceed 10,000, the oldest logs are automatically removed
- **Implementation**: `logs.slice(-(MAX_STORED_LOGS - 1))` keeps the most recent 9,999 logs before adding the new one

```typescript
// Add to logs array (keep last MAX_STORED_LOGS)
globalDebugState.logs = [
  ...globalDebugState.logs.slice(-(MAX_STORED_LOGS - 1)),
  logEntry,
];
```

### Rendering Layer (`debug-logs-list.tsx`)

- **Constant**: `MAX_RENDERED_LOGS = 1000`
- **Behavior**: Only renders the most recent 1,000 logs to maintain UI performance
- **Implementation**: `logs.slice(-MAX_RENDERED_LOGS)` before reversing for display

```typescript
// Limit to most recent MAX_RENDERED_LOGS for rendering
const reversedLogs = [...logs].slice(-MAX_RENDERED_LOGS).reverse();
```

## User Experience Features

### Truncation Indicators

When more than 1,000 logs exist, the system provides two visual indicators:

**1. Warning Banner (Top)**

```
⚠️ Showing latest 1,000 of 15,342 logs (performance limit)
```

**2. Hidden Logs Record (Bottom)**

```
📁 ... and 14,342 more logs hidden for performance
```

The hidden logs record appears as the last entry in the logs list, clearly indicating how many additional logs exist but aren't displayed.

### Stats Tooltip

Hover over the "Logs" statistic to see the configured limits:

```
Storage limit: 10,000 | Rendering limit: 1,000
```

## Performance Benefits

1. **Memory Management**: Prevents unlimited memory growth by capping stored logs
2. **DOM Performance**: Limits rendered elements to maintain smooth scrolling
3. **Rendering Speed**: Reduces initial render time for the debug panel
4. **React Performance**: Fewer DOM nodes mean faster reconciliation

## Configuration

To adjust the limits, modify the constants:

```typescript
// In use-debug.ts
const MAX_STORED_LOGS = 10000; // Increase for more storage

// In debug-logs-list.tsx
const MAX_RENDERED_LOGS = 1000; // Increase for more visible logs
```

## Best Practices

1. **Monitor Memory**: Check browser DevTools memory usage with high log volumes
2. **Adjust Limits**: Increase limits on powerful devices if needed
3. **Log Strategically**: Use specific debug points rather than "all" for better performance
4. **Clear Regularly**: Use the "Clear" button to reset logs when debugging specific issues

## Technical Notes

- Logs are stored in reverse chronological order (newest first in UI)
- The storage limit is enforced at write time (when logs are added)
- The rendering limit is enforced at read time (when displaying logs)
- Both limits work together to provide optimal performance at scale
