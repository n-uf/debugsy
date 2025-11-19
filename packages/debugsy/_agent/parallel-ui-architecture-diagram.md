# Parallel UI Architecture Diagram

**Visual guide to the parallel implementation strategy**

---

## Current Architecture (Single Version)

```
┌─────────────────────────────────────────────────────────┐
│                      DebugsyLook                        │
│                    (main component)                     │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ├─→ DebugPanelHeader
                        ├─→ DebugPanelResizeHandle
                        ├─→ DebugResizePresets
                        ├─→ DebugLogsList
                        │   ├─→ VirtualizedLogContainer
                        │   ├─→ ActionsPanel
                        │   └─→ LogEntry (with formatters)
                        ├─→ DebugControlPanel
                        │   ├─→ DebugPointButtons
                        │   ├─→ DebugDisplayPanel
                        │   └─→ DebugDependencyControls
                        └─→ DebugStatsPanel
```

---

## Parallel Architecture (During Migration)

```
┌─────────────────────────────────────────────────────────┐
│                   DebugsyLook (Wrapper)                 │
│          [Feature Flag: v1 | v2 | auto]                │
│          [Toggle: Cmd+Shift+D | UI Button]             │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
        ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  DebugsyLookV1   │   │  DebugsyLookV2   │
│   (Current UI)   │   │  (Harbuz UI)     │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         │                      │
    ┌────┴────┐            ┌────┴────┐
    │         │            │         │
    ▼         ▼            ▼         ▼
┌─────────────────┐   ┌─────────────────┐
│ debugsy-look    │   │ @workspace/     │
│ UI Components   │   │ harbuz          │
│                 │   │                 │
│ • Header        │   │ • TerminalLayout│
│ • ResizeHandle  │   │ • ActionToolbar │
│ • LogsList      │   │ • VirtualizedList│
│ • ControlPanel  │   │ • ControlPanel  │
│ • StatsPanel    │   │ • StatsPanel    │
│ • Formatters    │   │ • LogEntry      │
└─────────────────┘   └─────────────────┘
         │                      │
         │                      │
         └──────────┬───────────┘
                    ▼
        ┌────────────────────────┐
        │   Shared Core Logic    │
        │                        │
        │ • useDebugsy()         │
        │ • useRenderTracker()   │
        │ • Debug space state    │
        │ • Log storage          │
        │ • Point management     │
        └────────────────────────┘
```

---

## Feature Flag Decision Tree

```
User opens DebugsyLook
        │
        ▼
┌───────────────────┐
│ Check uiVersion   │
│ prop override?    │
└────┬──────────────┘
     │
     ├─→ [v1] → Render DebugsyLookV1
     ├─→ [v2] → Render DebugsyLookV2
     │
     └─→ [auto] → Check runtime config
                       │
                       ├─→ [v1] → Render DebugsyLookV1
                       ├─→ [v2] → Render DebugsyLookV2
                       │
                       └─→ [auto] → Check env variable
                                      │
                                      ├─→ [v2] → Render DebugsyLookV2
                                      │
                                      └─→ [default] → Check localStorage
                                                        │
                                                        ├─→ [v2] → Render DebugsyLookV2
                                                        │
                                                        └─→ [default] → Render DebugsyLookV1
```

---

## File Structure During Migration

```
packages/debugsy/src/debugsy-look/
│
├── index.ts                              # Exports DebugsyLook (wrapper)
├── debugsy-look.tsx                      # ✅ Smart wrapper with feature flag
├── debugsy-look-v1.tsx                   # ✅ Current implementation (renamed)
├── debugsy-look-v2.tsx                   # ✅ NEW: Harbuz-based implementation
│
├── ui-control-center/                    # Used by V1
│   ├── control-buttons.tsx
│   ├── control-panel.tsx
│   ├── header.tsx
│   ├── resize-handle.tsx
│   └── resize-presets.tsx
│
├── ui-logs/                              # Used by V1
│   ├── logs-list.tsx
│   ├── components/
│   └── formatters/
│
├── ui-stats-center/                      # Used by V1
│   └── stats-panel.tsx
│
├── ui-dependency/                        # Used by V1
│   ├── dependency-controls.tsx
│   └── dependency-advanced-controls.tsx
│
└── v2/                                   # ✅ NEW: V2-specific code
    ├── formatters/                       # Harbuz formatter registrations
    │   ├── register-dependency-formatter.ts
    │   ├── register-health-formatter.ts
    │   └── register-sanitized-formatter.ts
    │
    ├── orchestration/                    # V2 orchestration hooks
    │   ├── use-smart-clear.ts
    │   ├── use-keyboard-shortcuts.ts
    │   └── use-following-behavior.ts
    │
    └── index.ts
```

---

## Component Mapping: V1 → V2

### Layout Structure

```
V1: Custom layout with flex                V2: TerminalLayout composition
┌────────────────────────────────┐         ┌────────────────────────────────┐
│ <div> (custom styles)          │   →     │ <TerminalLayout>               │
│   <DebugPanelHeader />         │   →     │   <TerminalLayoutHeader>       │
│   <DebugPanelResizeHandle />   │   →     │     <ResizeHandle />           │
│                                │         │   </TerminalLayoutHeader>      │
│   <div> (body container)       │   →     │   <TerminalLayoutBody>         │
│     <DebugLogsList />          │   →     │     <TerminalLayoutContent>    │
│                                │         │       <LogsContainer>          │
│                                │         │         <VirtualizedList>      │
│     <ActionsPanel />           │   →     │     <TerminalLayoutActions>    │
│                                │         │       <ActionToolbar>          │
│                                │         │                                │
│   <DebugControlPanel />        │   →     │   <TerminalLayoutControlPanel> │
│                                │         │     <ControlPanel>             │
│                                │         │                                │
│   <DebugStatsPanel />          │   →     │   <TerminalLayoutSidebar>      │
│                                │         │     <StatsPanel>               │
│ </div>                         │         │ </TerminalLayout>              │
└────────────────────────────────┘         └────────────────────────────────┘
```

### Individual Components

| V1 Component | V2 Component | Mapping Type |
|--------------|--------------|--------------|
| `DebugPanelHeader` | `TerminalLayoutHeader` | Direct replacement |
| `DebugPanelResizeHandle` | `TerminalLayoutResizeHandle` | Direct replacement |
| `DebugResizePresets` | `TerminalLayoutResizePresets` | Direct replacement |
| `DebugStatsPanel` | `TerminalLayoutStatsPanel` | Direct replacement |
| `DebugLogsList` | `TerminalLayoutContent` + `LogsContainer` | Composition |
| `ActionsPanel` | `TerminalLayoutActions` + `ActionToolbar` | Direct replacement |
| `DebugControlPanel` | `TerminalLayoutControlPanel` + `ControlPanel` | Composition |
| `DebugPointButtons` | `StatusButtonGroup` | Direct replacement |
| `DebugDisplayPanel` | `Display` component | Direct replacement |
| `VirtualizedLogContainer` | `VirtualizedList` | Direct replacement |
| `MemoizedLogEntry` | `LogEntry` | Direct replacement |
| Log formatters | Register with `formatter-registry` | Registration pattern |
| Pause/snapshot banners | `Banner` component | Direct replacement |
| Progress bars | `ProgressBar` | Direct replacement |
| Indicators | `Indicator` + `MultiIndicator` | Direct replacement |

---

## Rollout Timeline

```
Week 0: Preparation
├── Phase 0: Setup infrastructure (2-4h)
└── Create feature flag system

Week 1: Initial Implementation
├── Phase 1: Layout shell (4-6h)
├── Phase 2: State/orchestration (6-8h)
└── Phase 3: Formatters (3-4h)

Week 2: Testing & Refinement
├── Phase 4: Visual parity testing (4-6h)
├── Bug fixes
└── Internal team testing begins

Week 3: Beta Testing (Opt-in)
├── Default: V1
├── Easy toggle to V2
├── Collect feedback
└── Fix issues

Week 4: Beta Testing (Opt-out)
├── Default: V2
├── Easy toggle to V1
├── Monitor for regressions
└── Final validation

Week 5: Cleanup
├── Phase 6: Remove V1 (2-3h)
└── Documentation updates

─────────────────────────────────────────
        🎉 Migration Complete
```

---

## Bundle Size Impact

### During Migration (Parallel Implementation)

```
Before Migration:
├── debugsy-look UI components: ~60KB
└── harbuz (shared): ~40KB (already loaded)
    Total: ~100KB

During Migration:
├── debugsy-look-v1 UI: ~60KB
├── debugsy-look-v2 UI: ~15KB (adapters only, harbuz reused)
└── harbuz (shared): ~40KB (already loaded)
    Total: ~115KB (+15KB)

After Migration:
├── debugsy-look-v2 UI: ~15KB
└── harbuz (shared): ~40KB
    Total: ~55KB (-45KB from original!)
```

**Key Insight:** Temporary 15KB increase, permanent 45KB decrease!

---

## Risk Levels by Phase

```
Phase 0: Setup                  Risk: ▓░░░░ (Very Low)
Phase 1: Layout Shell           Risk: ▓▓░░░ (Low)
Phase 2: State/Orchestration    Risk: ▓▓▓░░ (Medium)
Phase 3: Formatters             Risk: ▓▓░░░ (Low)
Phase 4: Visual Parity          Risk: ▓░░░░ (Very Low)
Phase 5: Beta Rollout           Risk: ▓▓░░░ (Low)
Phase 6: Cleanup                Risk: ▓░░░░ (Very Low)

Overall Migration Risk: ▓▓░░░ (Low)
```

**Risk Mitigation:** Feature flag allows instant rollback at any phase

---

## Testing Strategy Visualization

```
┌─────────────────────────────────────────────────────────┐
│               Automated Testing                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐           ┌──────────────┐          │
│  │ Unit Tests   │           │ Unit Tests   │          │
│  │  V1 Logic    │           │  V2 Logic    │          │
│  └──────────────┘           └──────────────┘          │
│         │                          │                   │
│         └──────────┬───────────────┘                   │
│                    ▼                                    │
│         ┌──────────────────────┐                       │
│         │ Behavioral Tests     │                       │
│         │ (Same for V1 & V2)   │                       │
│         └──────────────────────┘                       │
│                    │                                    │
│                    ▼                                    │
│         ┌──────────────────────┐                       │
│         │ Visual Regression    │                       │
│         │ (Screenshot Compare) │                       │
│         └──────────────────────┘                       │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               Manual Testing                            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Developer opens both versions side-by-side:           │
│                                                         │
│  ┌──────────────┐           ┌──────────────┐          │
│  │   V1 Panel   │           │   V2 Panel   │          │
│  │              │           │              │          │
│  │  [Visual]    │    vs     │  [Visual]    │          │
│  │              │           │              │          │
│  └──────────────┘           └──────────────┘          │
│                                                         │
│  Validation:                                           │
│  ✓ Colors match                                        │
│  ✓ Spacing matches                                     │
│  ✓ Behavior matches (click, resize, scroll)           │
│  ✓ Animations feel the same                            │
│  ✓ Performance is similar                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Toggle Experience (Developer UX)

```
┌────────────────────────────────────────────────────────┐
│ DebugsyLook                          [UI: V1] [⇄]  [✕] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Keyboard Shortcut: Cmd+Shift+D                       │
│                                                        │
│  ┌──────────────────────────────────────────┐         │
│  │ Press Cmd+Shift+D to toggle UI version  │         │
│  │                                          │         │
│  │ [Notification appears]                   │         │
│  │ "✅ Switched to V2 (Harbuz UI)"         │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
└────────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│ DebugsyLook                          [UI: V2] [⇄]  [✕] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Now using Harbuz UI components!                      │
│                                                        │
│  Same functionality, new implementation.              │
│  Report issues: [Button]                              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

**Document Status:** Visual Guide  
**Purpose:** Illustrate parallel implementation architecture  
**See Also:** `parallel-ui-migration-strategy.md`

