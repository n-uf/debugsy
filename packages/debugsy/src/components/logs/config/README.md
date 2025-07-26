# Copy Configuration Module

This directory contains streamlined, centralized configuration for the copy logs functionality.

## Files

### `copy-config.ts`

Main configuration file containing:

- **Timing constants** (`COPY_TIMING_CONFIG`)
- **Default progression steps** (`DEFAULT_COPY_STEPS`)
- **Main configuration** (`DEFAULT_COPY_CONFIG`)
- **Alternative configurations** (`COPY_CONFIGS`)
- **Helper functions** for configuration management

### `index.ts`

Re-exports all configuration items for convenient importing.

## Usage

### Import Default Configuration

```typescript
import { DEFAULT_COPY_CONFIG } from "./config/copy-config";
// or
import { DEFAULT_COPY_CONFIG } from "./config";
```

### Import Timing Constants

```typescript
import {
  getDisplayDuration,
  getProgressBarDuration,
  getButtonTransitionDuration,
  getAutoResetAfterDelay,
} from "./config/copy-config";
```

### Create Custom Configuration

```typescript
import { createCustomCopyConfig } from "./config/copy-config";

const customConfig = createCustomCopyConfig([10, 50, "All"], {
  resetOnComplete: false,
  autoResetAfterDelay: true, // Auto-reset after display duration
});
```

## Configuration Options

### Timing Settings

- `PROGRESS_BAR_DURATION`: 300ms - Progress bar animation
- `BUTTON_TRANSITION`: 200ms - Button hover/click feedback
- `DISPLAY_DURATION`: 3000ms - How long progress state is visible
- `AUTO_RESET_AFTER_DELAY`: true - Auto-reset after display duration

### Behavior Settings

- `resetOnComplete`: Whether clicking when complete cycles back to beginning
- `autoResetAfterDelay`: Whether button auto-resets after display duration

### Progression Steps

Default: `[20, 200, "50%", "All"]`

- Numbers: Fixed log counts
- Percentages: Relative to total log count
- "All": Copy all available logs

## Benefits

✅ **Centralized Configuration**: All settings in one place  
✅ **Easy Customization**: Multiple configuration options  
✅ **Type Safety**: Full TypeScript support  
✅ **Consistent Timing**: Synchronized across all UI elements  
✅ **Flexible Progression**: Adaptive step system
