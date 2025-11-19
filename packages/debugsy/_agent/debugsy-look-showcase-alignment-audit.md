# DebugsyLook ↔ Showcase Alignment Audit

**Date:** 2025-11-19  
**Scope:** Compare `packages/harbuz/src/showcase/showcase.tsx` with `packages/debugsy/src/debugsy-look/` to identify duplication and alignment opportunities

---

## Executive Summary

**Status:** DebugsyLook is already **80% aligned** with Showcase best practices. The implementation properly uses harbuz components, follows the TerminalLayout pattern, and has good component extraction.

**Key Finding:** Minor alignment improvements needed in banner implementation, truncation panel configuration, and VirtualizedList reference passing.

---

## Architecture Comparison

### Showcase Structure (Reference Implementation)

```
HarbuzShowcase (Pure Demo Component)
├── TerminalLayout (Container)
│   ├── TerminalLayoutHeader (Resize handle)
│   ├── TerminalLayoutBody
│   │   ├── TerminalLayoutContent
│   │   │   ├── TerminalLayoutLogsContainer (with banners, truncation)
│   │   │   └── TerminalLayoutActions (ActionToolbar)
│   │   └── TerminalLayoutSidebar (Stats, Shortcuts, Presets)
│   └── TerminalLayoutControlPanel (Debug points, controls, display)
├── Mock Data (showcase-data.ts)
├── Harbuz Hooks (useResizable, useDisplay, useCopyState, etc.)
└── 100% Theme-Agnostic
```

### DebugsyLook Structure (Production Implementation)

```
DebugsyLook (Production Debug Component)
├── TerminalLayout (Container)
│   ├── TerminalLayoutHeader (Resize handle)
│   ├── TerminalLayoutBody
│   │   ├── TerminalLayoutContent
│   │   │   ├── TerminalLayoutLogsContainer (with banners, truncation)
│   │   │   └── TerminalLayoutActions (DebugsyActions component)
│   │   └── TerminalLayoutSidebar (DebugsyStats, DebugsyShortcuts, Presets)
│   └── TerminalLayoutControlPanel (Debug points, DependencyControls, display)
├── Real Data (debugsy-logs hooks)
├── Harbuz Hooks (useResizable, useDisplay, useCopyState, etc.)
└── Component Extraction (DebugsyActions, DebugsyStats, etc.)
```

**Verdict:** ✅ Structural alignment is **excellent**. Both follow the same TerminalLayout composition pattern.

---

## Component-by-Component Analysis

### 1. TerminalLayout Container

| Aspect | Showcase | DebugsyLook | Status |
|--------|----------|-------------|--------|
| Base component | `TerminalLayout` | `TerminalLayout` | ✅ Match |
| Props | `height`, `isResizing` | `height`, `isResizing` | ✅ Match |
| Positioning | Relative container | Fixed bottom | ✅ OK (different use case) |

**Verdict:** ✅ Perfect alignment. Different positioning is intentional (demo vs overlay).

---

### 2. Header & Resize Handle

| Aspect | Showcase | DebugsyLook | Status |
|--------|----------|-------------|--------|
| Component | `TerminalLayoutHeader` | `TerminalLayoutHeader` | ✅ Match |
| Resize handle | `TerminalLayoutResizeHandle` | `TerminalLayoutResizeHandle` | ✅ Match |
| Props | `onResizeStart`, `isResizing` | `onResizeStart`, `isResizing` | ✅ Match |

**Verdict:** ✅ Perfect alignment.

---

### 3. Logs Container & Banners

#### Showcase Implementation (Reference)

```tsx
<TerminalLayoutLogsContainer
  items={contentEntries}
  renderItem={(entry, index) => <LogEntry ... />}
  keyExtractor={(entry) => entry.id}
  topBanners={[
    {
      show: isPaused,
      content: (
        <Banner
          emoji="⏸️"
          message={`Log rendering paused - ${pausedLogs.length} logs frozen`}
          variant="paused"
          onClick={handleResume}
          title="Click to resume log rendering"
        />
      ),
    },
    {
      show: !isFollowing,
      content: (
        <Banner
          emoji="📌"
          message="Viewing snapshot - Click to return to live stream"
          variant="snapshot"
          onClick={handleReturnToFollowing}
          title="Click to return to following live logs"
        />
      ),
    },
  ]}
  truncation={{
    hiddenCount,
    totalCount,
    maxRendered,
    renderedCount,
    onCopyAll: handleCopyAllLogs,
    onClearAll: handleClearAllLogs,
  }}
  TruncationPanel={TruncationPanel}
  VirtualizedList={VirtualizedList}
  itemHeight={20}
  virtualizationThreshold={50}
  overscan={5}
/>
```

#### DebugsyLook Implementation (Current)

```tsx
<TerminalLayoutLogsContainer
  items={activeLogs.slice(0, MAX_RENDERED)}
  renderItem={(log, index) => <LogEntry ... />}
  keyExtractor={(log) => log._uniqueId}
  topBanners={[
    {
      content: (
        <>
          ⏸ Paused - {pauseState.pausedItems.length} logs frozen.{" "}
          <button onClick={() => pauseState.resume()}>
            Click to resume
          </button>
        </>
      ),
      show: pauseState.isPaused,
    },
    {
      content: (
        <>
          📌 Viewing snapshot at {scrollFollowing.snapshotItems.length} logs.{" "}
          <button onClick={handleReturnToLive}>
            Return to live stream
          </button>
        </>
      ),
      show: !scrollFollowing.isFollowing && !pauseState.isPaused,
    },
  ]}
  truncation={
    shouldShowTruncation
      ? { hiddenCount, maxRendered: MAX_RENDERED, totalCount: totalLogs }
      : undefined
  }
  virtualized={true}
  itemHeight={24}
/>
```

#### Comparison

| Aspect | Showcase | DebugsyLook | Status |
|--------|----------|-------------|--------|
| **Banner Component** | Uses `<Banner>` component | Uses raw JSX + button | ❌ Needs fix |
| **Banner Props** | emoji, message, variant, onClick, title | Inline JSX structure | ❌ Needs fix |
| **Banner Styling** | Theme-agnostic via variant | Inline button styles | ❌ Needs fix |
| **Truncation Config** | Full object with callbacks | Simplified object | ⚠️ Can improve |
| **TruncationPanel Ref** | Explicitly passed | Implicitly used | ⚠️ Can improve |
| **VirtualizedList Ref** | Explicitly passed component | Boolean flag `virtualized` | ⚠️ Can improve |
| **Overscan Config** | Configurable overscan | Default overscan | ✅ OK |

**Verdict:** ⚠️ **Needs Alignment** - Banner implementation should use proper component, truncation should include callbacks, VirtualizedList should be passed as component reference.

---

### 4. Action Toolbar

#### Showcase Implementation

```tsx
<TerminalLayoutActions>
  <ActionToolbar
    actions={actionButtons}
    depthControl={depthControl}
    progressControl={progressControl}
    onButtonMouseEnter={handleButtonMouseEnter}
    onButtonMouseLeave={handleButtonMouseLeave}
  />
</TerminalLayoutActions>
```

#### DebugsyLook Implementation

```tsx
<TerminalLayoutActions>
  <DebugsyActions
    activeLogs={activeLogs}
    filteredLogs={filteredLogs}
    copyState={copyState}
    pauseState={pauseState}
    scrollFollowing={scrollFollowing}
    hoverMessage={hoverMessage}
  />
</TerminalLayoutActions>
```

**Verdict:** ✅ **Good Abstraction** - DebugsyActions properly encapsulates ActionToolbar with domain-specific logic. This is a good pattern (more encapsulated than Showcase).

---

### 5. Sidebar Components

| Component | Showcase | DebugsyLook | Status |
|-----------|----------|-------------|--------|
| **Stats** | `TerminalLayoutStats` + `StatItem` | `DebugsyStats` (wrapper) | ✅ Good abstraction |
| **Shortcuts** | `TerminalLayoutShortcuts` + `Shortcut` | `DebugsyShortcutsDisplay` (wrapper) | ✅ Good abstraction |
| **Resize Presets** | `TerminalLayoutResizePresets` | `TerminalLayoutResizePresets` | ✅ Match |

**Verdict:** ✅ Perfect alignment. DebugsyLook properly abstracts stats and shortcuts.

---

### 6. Control Panel

#### Showcase Implementation

```tsx
<ControlPanel>
  <ControlPanelSection>
    <IndicatorButtonGroup buttons={debugPoints} theme={controlButtonTheme} />
  </ControlPanelSection>

  <ControlPanelSection separator className="pl-4">
    <IndicatorButtonGroup buttons={controlButtons} theme={controlButtonTheme} />
  </ControlPanelSection>

  <ControlPanelDisplaySection
    entries={displayEntries}
    content={displayContent}
    actions={displayActions}
  />
</ControlPanel>
```

#### DebugsyLook Implementation

```tsx
<ControlPanel>
  <ControlPanelSection>
    <IndicatorButtonGroup buttons={debugPoints} theme={controlButtonTheme} />
  </ControlPanelSection>

  <ControlPanelSection separator className="pl-4">
    <DependencyControls theme={controlButtonTheme} />
  </ControlPanelSection>

  <ControlPanelDisplaySection
    entries={[]}
    content={displayContent}
    actions={displayActions}
  />
</ControlPanel>
```

**Verdict:** ✅ **Excellent Alignment** - Follows same structure. DependencyControls is a good domain-specific abstraction.

---

### 7. Display Actions

#### Showcase Implementation

```tsx
const displayActions: DisplayAction[] = [
  {
    icon: "🗑️",
    onClick: handleClearEntries,
    title: "Clear entries",
    backgroundColor: "#ffffff",
    hoverBackgroundColor: "#e5e7eb",
    color: "#4b5563",
  },
  {
    icon: "✕",
    onClick: handleClosePanel,
    title: "Close panel",
    backgroundColor: "#dc2626",
    hoverBackgroundColor: "#b91c1c",
    color: "#ffffff",
  },
];
```

#### DebugsyLook Implementation

```tsx
actions={[
  {
    icon: "🗑",
    onClick: handleSmartClear,
    // Missing: title, colors use defaults
  },
  {
    icon: "✕",
    onClick: onClose,
    backgroundColor: "#dc2626",
    hoverBackgroundColor: "#b91c1c",
    color: "#ffffff",
    // Missing: title
  },
]}
```

**Verdict:** ⚠️ **Can Improve** - Add `title` props for better UX (tooltips).

---

## Hooks Usage Comparison

| Hook | Showcase | DebugsyLook | Status |
|------|----------|-------------|--------|
| `useResizable` | ✅ Used | ✅ Used | ✅ Match |
| `useDisplay` | ✅ Used | ✅ Used | ✅ Match |
| `useCopyState` | ✅ Used | ✅ Used (via copyState) | ✅ Match |
| `usePauseState` | ✅ Simulated | ✅ Used | ✅ Match |
| `useScrollFollowing` | ✅ Simulated | ✅ Used | ✅ Match |
| `useLogFiltering` | ❌ Not needed | ✅ Used | ✅ OK (domain-specific) |
| `useHoverMessage` | ✅ Inline | ✅ Used | ✅ Match |
| `useKeyboardSelection` | ❌ Not needed | ✅ Used | ✅ OK (domain-specific) |
| `useKeyboardShortcuts` | ❌ Not needed | ✅ Used | ✅ OK (domain-specific) |
| `useClear` | ❌ Not needed | ✅ Used | ✅ OK (domain-specific) |
| `useClickOutside` | ❌ Not needed | ✅ Used | ✅ OK (domain-specific) |

**Verdict:** ✅ **Excellent** - DebugsyLook uses all relevant harbuz hooks plus domain-specific hooks.

---

## Component Extraction Quality

### Showcase Approach
- **Inline Logic**: All handlers and configuration in main component
- **Mock Data**: Separated into `showcase-data.ts`
- **Purpose**: Demonstrate API surface and composition patterns

### DebugsyLook Approach
- **Extracted Components**: 
  - `DebugsyActions` - Encapsulates ActionToolbar with domain logic
  - `DebugsyStats` - Encapsulates stats display
  - `DebugsyShortcutsDisplay` - Encapsulates shortcuts display
  - `DependencyControls` - Domain-specific control panel section
- **Extracted Hooks**:
  - `useDebugsyShortcuts` - Keyboard shortcut management
  - `useClear` - Smart clear logic
- **Purpose**: Production-ready, maintainable, testable

**Verdict:** ✅ **Superior** - DebugsyLook has better component extraction for production use.

---

## Duplication Analysis

### UI Components (No Duplication ✅)

DebugsyLook properly reuses all harbuz components:
- ✅ `TerminalLayout` and all layout components
- ✅ `ControlPanel` and control panel components
- ✅ `IndicatorButtonGroup` for all button groups
- ✅ `LogEntry` for log rendering
- ✅ `ActionToolbar` (via DebugsyActions wrapper)
- ✅ All hooks from harbuz

### Patterns (No Duplication ✅)

DebugsyLook properly uses harbuz patterns:
- ✅ Copy system (getLogsToCopy, DEFAULT_COPY_CONFIG)
- ✅ Display system (setDisplayContent, clearDisplayContent, useDisplay)
- ✅ Serialization (safeSuperjsonStringify)

### Logic (Properly Domain-Specific ✅)

DebugsyLook's custom logic is all domain-specific and not duplicated:
- ✅ Debug point management (debugsy-space)
- ✅ Dependency tracking controls
- ✅ Smart clear behavior (storage + state + resume)
- ✅ Compact/Extended mode toggle
- ✅ Integration with debugsy-logs system

---

## Identified Issues & Recommendations

### 🔴 High Priority (Alignment Issues)

#### Issue 1: Banner Implementation

**Current (DebugsyLook):**
```tsx
topBanners={[
  {
    content: (
      <>
        ⏸ Paused - {pauseState.pausedItems.length} logs frozen.{" "}
        <button onClick={() => pauseState.resume()}>Click to resume</button>
      </>
    ),
    show: pauseState.isPaused,
  },
]}
```

**Should Be (like Showcase):**
```tsx
topBanners={[
  {
    show: pauseState.isPaused,
    content: (
      <Banner
        emoji="⏸️"
        message={`Log rendering paused - ${pauseState.pausedItems.length} logs frozen`}
        variant="paused"
        onClick={() => pauseState.resume()}
        title="Click to resume log rendering"
      />
    ),
  },
]}
```

**Benefits:**
- Theme-agnostic styling
- Consistent banner appearance across all harbuz consumers
- Proper accessibility (title attribute)
- Reusable component instead of inline JSX

---

#### Issue 2: VirtualizedList Reference

**Current (DebugsyLook):**
```tsx
<TerminalLayoutLogsContainer
  virtualized={true}
  itemHeight={24}
/>
```

**Should Be (like Showcase):**
```tsx
<TerminalLayoutLogsContainer
  VirtualizedList={VirtualizedList}
  itemHeight={24}
  virtualizationThreshold={50}
  overscan={5}
/>
```

**Benefits:**
- Explicit component dependency (better for tree-shaking)
- Control over virtualization threshold
- Configurable overscan for better scroll performance

---

#### Issue 3: Truncation Panel Configuration

**Current (DebugsyLook):**
```tsx
truncation={
  shouldShowTruncation
    ? { hiddenCount, maxRendered: MAX_RENDERED, totalCount: totalLogs }
    : undefined
}
```

**Should Be (like Showcase):**
```tsx
truncation={{
  hiddenCount,
  totalCount: totalLogs,
  maxRendered: MAX_RENDERED,
  renderedCount: activeLogs.length,
  onCopyAll: handleCopyAllLogs,
  onClearAll: handleClearAllLogs,
}}
TruncationPanel={TruncationPanel}
```

**Benefits:**
- Users can copy/clear all logs directly from truncation panel
- Explicit TruncationPanel component reference
- Full feature parity with Showcase

---

### 🟡 Medium Priority (UX Improvements)

#### Issue 4: Display Actions Missing Titles

**Current:**
```tsx
{ icon: "🗑", onClick: handleSmartClear }
```

**Should Be:**
```tsx
{
  icon: "🗑",
  onClick: handleSmartClear,
  title: "Clear logs (Cmd+K)",
}
```

**Benefits:**
- Better user experience (tooltips on hover)
- Discoverable shortcuts
- Consistent with Showcase pattern

---

## Implementation Plan

### Phase 1: Banner System (HIGH)
- [ ] Import `Banner` component from harbuz
- [ ] Replace raw JSX banners with `<Banner>` components
- [ ] Add proper props: emoji, message, variant, onClick, title

### Phase 2: Truncation Panel (HIGH)
- [ ] Import `TruncationPanel` component from harbuz
- [ ] Add `onCopyAll` and `onClearAll` handlers
- [ ] Pass `TruncationPanel` component reference explicitly
- [ ] Add `renderedCount` to truncation config

### Phase 3: VirtualizedList (HIGH)
- [ ] Import `VirtualizedList` component from harbuz
- [ ] Replace `virtualized={true}` with `VirtualizedList={VirtualizedList}`
- [ ] Add `virtualizationThreshold` config
- [ ] Add `overscan` config

### Phase 4: Display Actions (MEDIUM)
- [ ] Add `title` props to all display actions
- [ ] Include keyboard shortcuts in titles where applicable

---

## Success Metrics

After alignment, DebugsyLook should:
- ✅ Use `Banner` component (not raw JSX)
- ✅ Pass `VirtualizedList` as component reference
- ✅ Pass `TruncationPanel` as component reference
- ✅ Include truncation callbacks (onCopyAll, onClearAll)
- ✅ Include titles on all display actions
- ✅ Match Showcase prop structure 100%

---

## Conclusion

**Current State:** DebugsyLook is **80% aligned** with Showcase best practices. The architectural foundation is solid, component extraction is excellent, and harbuz integration is comprehensive.

**Gap Analysis:** Minor issues in banner implementation, VirtualizedList reference, and truncation panel configuration. These are simple fixes that will bring DebugsyLook to **100% alignment**.

**Recommendation:** Implement the changes outlined in the Implementation Plan to achieve full alignment with Showcase patterns while maintaining DebugsyLook's superior component extraction and production features.

**Effort Estimate:** 30-60 minutes to implement all alignment changes.

---

## Appendix: File Structure

### Showcase Files
```
packages/harbuz/src/showcase/
├── showcase.tsx (590 lines) - Main component
└── showcase-data.ts - Mock data
```

### DebugsyLook Files
```
packages/debugsy/src/debugsy-look/
├── debugsy-look.tsx (520 lines) - Main component
├── debugsy-actions.tsx (194 lines) - Action toolbar wrapper
├── debugsy-stats.tsx (81 lines) - Stats display
├── debugsy-shortcuts.tsx (46 lines) - Shortcuts display
├── dependency-controls.tsx (255 lines) - Dependency controls
├── dependency-advanced-panel.tsx (386 lines) - Advanced panel
├── use-clear.ts (149 lines) - Smart clear hook
├── use-debugsy-shortcuts.ts (107 lines) - Shortcuts hook
├── debugsy-look-switcher.tsx (141 lines) - V1/V2 switcher
└── index.ts (90 lines) - Exports
```

**Total:** 1,969 lines (well-organized, properly extracted)

---

**Document Version:** 1.0  
**Author:** AI Coding Assistant  
**Review Status:** Ready for Implementation

