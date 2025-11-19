# Parallel UI Migration Strategy

**Created:** 2025-11-18  
**Context:** Debugsy-to-Harbuz migration with parallel implementation approach  
**Status:** Proposed strategy

---

## Executive Summary

**Recommendation: YES** - Parallel UI implementation is the optimal approach for this migration.

**Strategy:** Create `DebugsyLookV2` (Harbuz-based) alongside existing `DebugsyLook` with feature flag toggle.

**Benefits:**
- ✅ Zero risk to existing functionality
- ✅ Side-by-side visual comparison
- ✅ Instant rollback capability
- ✅ Progressive testing in production
- ✅ Confidence building before full cutover
- ✅ Easier regression testing

**Cost:** ~2-4 hours additional setup + temporary bundle increase (~50-100KB)

---

## Why Parallel Implementation Makes Sense

### 1. Migration Complexity Assessment ⚠️

While Harbuz has 90-95% completeness, there are **subtle orchestration differences**:

| Area | Risk Level | Reason |
|------|------------|--------|
| Layout structure | Low | Clean 1:1 mapping |
| Visual primitives | Low | Exact color/spacing match |
| Resize behavior | Medium | Custom drag logic |
| Smart clear logic | Medium | Double-action state machine |
| Following/snapshot | Medium | Scroll-based state synchronization |
| Keyboard shortcuts | Medium | Multiple key bindings with context |
| Log formatters | Low | Registry system available |

**Key Insight:** The **orchestration logic** (resize, clear, following, shortcuts) is where bugs are most likely to surface. These are stateful, event-driven, and timing-sensitive.

### 2. Visual Regression Risk 🎨

Debugsy is a **developer-facing tool** where pixel-perfect consistency matters:
- Developers have muscle memory for the current UI
- Small layout shifts can be jarring
- Color/spacing differences are immediately noticeable
- Performance differences (scroll, resize) are obvious

**Parallel implementation allows:**
- Toggle between old/new to compare side-by-side
- Screenshot comparison testing
- Validation that behavior is identical

### 3. Progressive Rollout Strategy 🚀

With feature flag, you can:
1. **Week 1:** Dev-only testing with toggle
2. **Week 2:** A/B test with team (50/50 split)
3. **Week 3:** Opt-in beta (default old, easy toggle)
4. **Week 4:** Opt-out rollout (default new, easy toggle)
5. **Week 5:** Remove old implementation

**No big-bang deployment risk.**

### 4. Bundle Size Impact 📦

**Temporary increase:** ~50-100KB (gzipped)
- Old debugsy-look UI: ~60 files
- New Harbuz UI: Already imported by other packages
- Shared logic: No duplication (both use same core)

**After cleanup:** Actually **smaller** bundle (Harbuz is more tree-shakeable)

---

## Implementation Strategy

### Architecture: Side-by-Side Components

```typescript
// Current structure
DebugsyLook (v1 - current implementation)
  ├── Uses debugsy-look/ui-* components
  └── Orchestrates resize, clear, following, shortcuts

// New structure (parallel)
DebugsyLook (smart wrapper with feature flag)
  ├── DebugsyLookV1 (renamed from DebugsyLook)
  │   ├── Uses debugsy-look/ui-* components
  │   └── Orchestrates resize, clear, following, shortcuts
  └── DebugsyLookV2 (new Harbuz-based implementation)
      ├── Uses @workspace/harbuz components
      └── Orchestrates resize, clear, following, shortcuts
```

### Feature Flag System

**Option 1: Environment Variable (Build-time)**
```typescript
// .env or build config
DEBUGSY_UI_VERSION=v2

// Usage
const UI_VERSION = process.env.DEBUGSY_UI_VERSION ?? 'v1';
```

**Option 2: Runtime Toggle (Recommended)**
```typescript
// In debugsy-space or new config
interface DebugsyConfig {
  uiVersion: 'v1' | 'v2' | 'auto';
}

// Usage - allows dynamic switching without rebuild
dsy.config({ uiVersion: 'v2' });
```

**Option 3: Both (Most Flexible)**
- Environment variable sets default
- Runtime toggle overrides for testing
- LocalStorage persistence for dev preference

### File Structure

```
packages/debugsy/src/debugsy-look/
├── debugsy-look.tsx                    # Smart wrapper with feature flag
├── debugsy-look-v1.tsx                 # Renamed current implementation
├── debugsy-look-v2.tsx                 # New Harbuz-based implementation
├── ui-control-center/                  # Keep for v1
├── ui-logs/                            # Keep for v1
├── ui-stats-center/                    # Keep for v1
└── v2/                                 # New folder for v2-specific adapters
    ├── formatters/                     # Harbuz formatter registrations
    │   ├── dependency-formatter.ts     # Register dependency formatter
    │   ├── health-formatter.ts         # Register health formatter
    │   └── sanitized-formatter.ts      # Register sanitized formatter
    ├── orchestration/                  # V2-specific orchestration logic
    │   ├── use-smart-clear.ts          # Hook for smart clear logic
    │   ├── use-keyboard-shortcuts.ts   # Hook for keyboard shortcuts
    │   └── use-following-behavior.ts   # Hook for following/snapshot logic
    └── index.ts
```

### Smart Wrapper Implementation

```typescript
// packages/debugsy/src/debugsy-look/debugsy-look.tsx
"use client";

import React from "react";
import { DebugsyLookV1 } from "./debugsy-look-v1";
import { DebugsyLookV2 } from "./debugsy-look-v2";

export interface DebugsyLookProps {
  closeOnClickOutside?: boolean;
  uiVersion?: 'v1' | 'v2' | 'auto'; // Override config
}

/**
 * DebugsyLook - Smart wrapper with version switching
 * 
 * Supports parallel UI implementations for safe migration.
 * Toggle between v1 (current) and v2 (Harbuz-based).
 */
export const DebugsyLook: React.FC<DebugsyLookProps> = (props) => {
  const { uiVersion = 'auto', ...restProps } = props;
  
  // Determine version from props > runtime config > env > default
  const version = getUIVersion(uiVersion);
  
  // Feature flag: Render appropriate version
  if (version === 'v2') {
    return <DebugsyLookV2 {...restProps} />;
  }
  
  return <DebugsyLookV1 {...restProps} />;
};

function getUIVersion(override: DebugsyLookProps['uiVersion']): 'v1' | 'v2' {
  // 1. Explicit override
  if (override && override !== 'auto') {
    return override;
  }
  
  // 2. Runtime config
  const runtimeConfig = getDebugsyConfig()?.uiVersion;
  if (runtimeConfig && runtimeConfig !== 'auto') {
    return runtimeConfig;
  }
  
  // 3. Environment variable
  if (process.env.NEXT_PUBLIC_DEBUGSY_UI_VERSION === 'v2') {
    return 'v2';
  }
  
  // 4. LocalStorage (for dev preference persistence)
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('debugsy-ui-version');
    if (stored === 'v2') return 'v2';
  }
  
  // 5. Default to v1 (safe default during migration)
  return 'v1';
}
```

---

## Migration Phases

### Phase 0: Setup Parallel Infrastructure (2-4 hours)

**Goal:** Enable side-by-side implementations without breaking existing functionality

**Tasks:**
1. Rename `debugsy-look.tsx` → `debugsy-look-v1.tsx`
2. Create smart wrapper `debugsy-look.tsx` with feature flag
3. Add UI version config to debugsy-space
4. Add keyboard shortcut for toggling (Cmd+Shift+D)
5. Add visual indicator showing active version

**Validation:**
- V1 still works identically
- Toggle between v1/v2 (even if v2 is placeholder)
- No bundle size increase yet (v2 not implemented)

### Phase 1: V2 Layout Shell (4-6 hours)

**Goal:** Get Harbuz layout rendering with basic functionality

**Tasks:**
1. Create `debugsy-look-v2.tsx` using `TerminalLayout`
2. Port resize logic to `useResizable` hook
3. Port stats panel to `TerminalLayoutStatsPanel`
4. Port shortcuts panel to `TerminalLayoutShortcutsPanel`
5. Wire up basic log rendering with `VirtualizedList`

**Validation:**
- V2 renders without crashing
- Resize works (compare to v1)
- Stats display correctly
- Toggle between v1/v2 works smoothly

### Phase 2: V2 State & Orchestration (6-8 hours)

**Goal:** Match v1 behavior for state management

**Tasks:**
1. Port smart clear logic → `use-smart-clear.ts` hook
2. Port keyboard shortcuts → `use-keyboard-shortcuts.ts` hook
3. Port following/snapshot → `use-following-behavior.ts` hook
4. Port pause/resume logic
5. Wire up control panel with all buttons

**Validation:**
- Clear button works identically (double-action)
- Keyboard shortcuts work (Cmd+D, Cmd+K, Esc)
- Following behavior matches v1
- Pause/resume works

### Phase 3: V2 Log Formatters (3-4 hours)

**Goal:** Register all debugsy-specific formatters with Harbuz registry

**Tasks:**
1. Create `v2/formatters/dependency-formatter.ts`
2. Create `v2/formatters/health-formatter.ts`
3. Create `v2/formatters/sanitized-formatter.ts`
4. Register all formatters on component mount
5. Test expansion/collapse behavior

**Validation:**
- Dependency logs format correctly
- Health logs format correctly
- Sanitized logs format correctly
- Expansion/collapse matches v1

### Phase 4: Visual Parity Testing (4-6 hours)

**Goal:** Ensure pixel-perfect match between v1 and v2

**Tasks:**
1. Screenshot comparison testing
2. Color/spacing verification
3. Animation/transition testing
4. Responsive behavior testing
5. Edge case testing (1000+ logs, very tall, very short)

**Validation:**
- Side-by-side screenshots match
- Colors are identical (use color picker)
- Spacing is identical (measure with dev tools)
- Animations feel the same
- Performance is similar or better

### Phase 5: Beta Rollout (1-2 weeks)

**Goal:** Get real-world testing feedback

**Timeline:**
- **Week 1:** Internal team testing (opt-in)
- **Week 2:** Default to v2, but easy toggle back

**Tasks:**
1. Document toggle instructions
2. Add "Report Issue" button that includes version info
3. Monitor for bug reports
4. Fix any issues found
5. Collect feedback on UX differences

**Validation:**
- No critical bugs reported
- Positive feedback on v2
- Performance metrics look good

### Phase 6: Cleanup (2-3 hours)

**Goal:** Remove v1 implementation and feature flag

**Tasks:**
1. Remove feature flag system
2. Delete `debugsy-look-v1.tsx`
3. Delete old `ui-*` folders (if not used elsewhere)
4. Update docs to remove v1 references
5. Bundle size reduction verification

**Validation:**
- Bundle size decreased
- All tests pass
- No references to v1 remain

---

## Testing Strategy

### Automated Testing

**Visual Regression Tests:**
```typescript
describe('DebugsyLook V1 vs V2', () => {
  it('should render identically', () => {
    const v1Screenshot = renderV1();
    const v2Screenshot = renderV2();
    expect(v1Screenshot).toMatchImageSnapshot(v2Screenshot);
  });
});
```

**Behavioral Tests:**
```typescript
describe('Smart Clear', () => {
  it('should require double-click in both versions', () => {
    // Test v1
    const v1 = render(<DebugsyLookV1 />);
    clickClear(v1);
    expect(getLogs(v1)).toHaveLength(10); // Not cleared
    clickClear(v1);
    expect(getLogs(v1)).toHaveLength(0); // Cleared
    
    // Test v2
    const v2 = render(<DebugsyLookV2 />);
    clickClear(v2);
    expect(getLogs(v2)).toHaveLength(10); // Not cleared
    clickClear(v2);
    expect(getLogs(v2)).toHaveLength(0); // Cleared
  });
});
```

### Manual Testing Checklist

**Core Functionality:**
- [ ] Panel opens/closes
- [ ] Resize drag works smoothly
- [ ] Resize presets work (compact/extend)
- [ ] Clear button (single click → confirm, double click → clear)
- [ ] Keyboard shortcuts (Cmd+D, Cmd+K, Esc)
- [ ] Pause/Resume
- [ ] Following behavior (auto-scroll)
- [ ] Snapshot mode

**Visual Appearance:**
- [ ] Colors match exactly
- [ ] Spacing matches exactly
- [ ] Fonts match exactly
- [ ] Borders/shadows match exactly
- [ ] Animations feel the same
- [ ] Icons/indicators look the same

**Edge Cases:**
- [ ] Empty state (no logs)
- [ ] 1000+ logs (performance)
- [ ] Very long log messages (truncation)
- [ ] Deeply nested objects (expansion)
- [ ] Rapid logging (stress test)
- [ ] Very small height (100px)
- [ ] Very large height (1000px)

**Formatters:**
- [ ] Default logs
- [ ] Dependency logs (from/to diff)
- [ ] Health logs (metrics table)
- [ ] Sanitized logs (sanitized data)

---

## Risk Mitigation

### Risk 1: Performance Regression in V2

**Mitigation:**
- Benchmark both versions with 1000+ logs
- Use Chrome DevTools Performance profiler
- Compare frame rates during scroll/resize
- If v2 is slower, optimize before rollout

### Risk 2: Subtle Behavioral Differences

**Mitigation:**
- Create comprehensive behavioral test suite
- Side-by-side manual testing for all interactions
- Beta period with easy toggle back to v1
- Monitor bug reports closely

### Risk 3: Bundle Size Increase During Transition

**Mitigation:**
- Both versions only add ~50-100KB temporarily
- Code-split v1/v2 so only active version loads
- Clean up quickly after validation (2-3 weeks max)

### Risk 4: Developer Confusion

**Mitigation:**
- Clear visual indicator of active version
- Easy toggle (keyboard shortcut + UI button)
- Documentation explaining both versions
- Beta period announcement

---

## Developer Experience

### Toggle UI

Add visual indicator and toggle button:

```tsx
// In DebugsyLook header
<div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
  <Badge variant={version === 'v1' ? 'info' : 'success'}>
    UI: {version.toUpperCase()}
  </Badge>
  <Button
    size="xs"
    variant="ghost"
    onClick={toggleVersion}
    title="Toggle UI version (Cmd+Shift+D)"
  >
    ⇄
  </Button>
</div>
```

### Keyboard Shortcut

```typescript
// Cmd+Shift+D toggles between v1 and v2
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey && e.shiftKey && e.key === 'd') {
      e.preventDefault();
      toggleUIVersion();
      showNotification(`Switched to ${newVersion}`);
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## Timeline & Effort

| Phase | Duration | Effort | Risk |
|-------|----------|--------|------|
| Phase 0: Setup | 2-4 hours | Low | Very Low |
| Phase 1: Layout Shell | 4-6 hours | Medium | Low |
| Phase 2: State/Orchestration | 6-8 hours | High | Medium |
| Phase 3: Formatters | 3-4 hours | Low | Low |
| Phase 4: Visual Parity | 4-6 hours | Medium | Low |
| Phase 5: Beta Rollout | 1-2 weeks | Low | Low |
| Phase 6: Cleanup | 2-3 hours | Low | Very Low |
| **Total** | **19-27 hours + 1-2 weeks beta** | - | **Low** |

**Comparison to Direct Migration:**
- Direct migration: 12-18 hours (from analysis doc)
- Parallel migration: 19-27 hours
- **Additional cost: 7-9 hours**

**Value of additional cost:**
- Zero risk to production
- Instant rollback capability
- Confidence through validation
- Better testing coverage
- Smoother rollout

---

## Recommendation

### ✅ YES - Parallel Implementation is Worth It

**Reasons:**
1. **Low additional cost** (7-9 hours vs 12-18 hours baseline)
2. **Significantly reduced risk** (instant rollback)
3. **Better testing** (side-by-side comparison)
4. **Progressive rollout** (opt-in → default → cleanup)
5. **Confidence building** (validate before committing)
6. **Debugsy is critical** (developer tool, must be reliable)

### When to Skip Parallel Implementation

Only skip if:
- ❌ Time-critical migration (need it done in <1 week)
- ❌ Bundle size is critical constraint (mobile app)
- ❌ Team is very small (solo dev, no review capacity)

### When Parallel Implementation is Essential

Always use parallel implementation if:
- ✅ Migrating critical UI (like debug tools)
- ✅ Complex state orchestration (resize, following, shortcuts)
- ✅ Team needs to validate behavior (multiple reviewers)
- ✅ Progressive rollout is important (low-risk deployment)

---

## Next Steps

1. **Review this strategy** with team
2. **Get approval** for parallel approach
3. **Start Phase 0** (setup infrastructure)
4. **Create detailed task breakdown** for each phase
5. **Schedule beta testing period** (1-2 weeks)

---

**Document Status:** Proposed  
**Decision Required:** Approve parallel implementation approach  
**Timeline:** 3-4 weeks total (including beta period)

