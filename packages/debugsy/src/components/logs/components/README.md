# Debug Logs List Components

This directory contains the extracted, granular components that make up the Debug Logs List system. Each component is focused on a specific responsibility and can be independently maintained and tested.

## Component Architecture

### Core Components

#### `memoized-log-entry.tsx`

**Purpose**: Individual log entry rendering with performance optimization

- Memoized to prevent unnecessary re-renders
- Routes through DefaultLogFormatter for consistent behavior
- Custom comparison function based on content, not array position

#### `virtualized-log-container.tsx`

**Purpose**: High-performance log rendering for large datasets

- Virtualization for lists > 50 items to prevent browser freezing
- 5x rendering area (2 up + 1 visible + 2 down) for smooth scrolling
- Smart boundary handling and scroll position tracking
- Scroll following detection for auto-follow behavior

#### `truncation-info-panel.tsx`

**Purpose**: Interactive warning panel when logs are truncated

- Shows performance limit information with counts
- **Clear All** button for clearing entire log history
- **Copy All** button for copying complete log set (not just visible)
- Transparent button styling harmonized with panel theme
- Positioned at tail after log content

#### `debug-status-panels.tsx`

**Purpose**: Sticky status panels for pause/following states

- **Pause Panel**: Shows when log rendering is paused
- **Following Panel**: Clickable panel when viewing snapshot
- Sticky positioning for always-visible status
- Smart stacking with calculated top positions

#### `actions-panel.tsx`

**Purpose**: Right sidebar with interactive action buttons

- **Copy Button**: Progressive copy with visual feedback and progress bar
- **Pause/Resume Button**: Toggle log rendering with visual state
- **Health Snapshot Button**: Capture application metrics
- Consistent styling and hover effects
- Integrated with display feedback system

## Usage

```tsx
import {
  MemoizedLogEntry,
  VirtualizedLogContainer,
  TruncationInfoPanel,
  DebugStatusPanels,
  ActionsPanel,
} from "./components";

// All components are fully extracted and can be used independently
// Main debug-logs-list.tsx orchestrates these components
```

## Benefits of This Structure

### 🏗️ **Maintainability**

- Each component has a single responsibility
- Easier to locate and fix issues
- Independent testing possible

### 🚀 **Performance**

- Components are properly memoized
- Reduced bundle size through tree-shaking
- Virtualization handled separately

### 🔄 **Reusability**

- Components can be reused in other contexts
- Clear interfaces and prop definitions
- No tight coupling to main component

### 🧪 **Testing**

- Each component can be unit tested in isolation
- Mocked dependencies are simpler
- Better test coverage possible

### 👥 **Team Development**

- Multiple developers can work on different components
- Clearer code ownership
- Reduced merge conflicts

## Dependencies

Each component has minimal external dependencies:

- React hooks (`useCallback`, `useMemo`, `useEffect`)
- Type definitions from main hooks
- Utility functions from `../utils/` and `../config/`
- Shared styling from `../utils/log-utilities`

## Component Props

All components use TypeScript interfaces for type safety:

- `TruncationInfoPanelProps`
- `DebugStatusPanelsProps`
- `ActionsPanelProps`
- Virtualized and memoized components use inline prop types

This structure provides a solid foundation for future enhancements and maintains excellent developer experience.
