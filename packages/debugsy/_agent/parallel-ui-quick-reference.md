# Parallel UI Implementation - Quick Reference

**For Developers**  
**Phase 0 Complete** - Infrastructure Ready

---

## How to Toggle Between V1 and V2

### Method 1: Keyboard Shortcut (Fastest)
```
Cmd+Shift+D (or Ctrl+Shift+D on Windows)
```
Notification will show which version is active.

### Method 2: Click Toggle Button
Look for `[UI: V1 ⇄]` badge in the header → Click the ⇄ button

### Method 3: Props
```typescript
<DebugsyLook uiVersion="v2" />  // Force V2
<DebugsyLook uiVersion="v1" />  // Force V1
<DebugsyLook uiVersion="auto" /> // Use config/env/localStorage
```

### Method 4: Runtime Config
```typescript
import { getDebugsy } from '@workspace/debugsy';

const dsy = getDebugsy();
dsy.setUIVersion('v2');  // Switch to V2

// Check current version
console.log(dsy.getUIVersion());  // "v1" | "v2" | undefined
```

### Method 5: Environment Variable
```bash
# .env.local
NEXT_PUBLIC_DEBUGSY_UI_VERSION=v2
```

---

## Version Resolution Priority

1. **Props** (`uiVersion="v2"`) - Highest priority
2. **Runtime config** (`dsy.setUIVersion('v2')`)
3. **Environment variable** (`NEXT_PUBLIC_DEBUGSY_UI_VERSION=v2`)
4. **LocalStorage** (auto-saved on toggle)
5. **Default** (`v1`) - Safe default

---

## What's Different?

### V1 (Original)
- ✅ Fully functional (current implementation)
- ✅ All features working
- ✅ Custom debugsy-look UI components
- Badge color: **Blue**

### V2 (Harbuz)
- 🚧 Placeholder (Phase 1 coming soon)
- ⏳ Will use `@workspace/harbuz` components
- ⏳ Will use `TerminalLayout` structure
- Badge color: **Green**

---

## Current Status

**Phase 0:** ✅ Complete - Infrastructure ready  
**Phase 1:** 🔄 Next - Full V2 implementation

**Phase 0 includes:**
- Smart wrapper with feature flag
- Toggle mechanism (keyboard + button)
- Visual indicator in header
- Config system integration
- LocalStorage persistence
- Zero breaking changes

---

## Testing the Toggle

1. Open DebugsyLook (Cmd+D)
2. Look for `[UI: V1 ⇄]` badge in header (blue)
3. Press `Cmd+Shift+D` or click ⇄
4. See notification: "Switched to V2 (Harbuz UI)"
5. Badge changes to `[UI: V2 ⇄]` (green)
6. V2 placeholder appears
7. Press `Cmd+Shift+D` again to go back to V1

**Expected behavior:** Smooth toggle, notification shown, preference persisted

---

## For Component Users

**No changes needed!** Existing code continues to work:

```typescript
// This still works exactly as before
<DebugsyLook />
```

To opt into V2 (when ready):

```typescript
// Option A: Props
<DebugsyLook uiVersion="v2" />

// Option B: Runtime
import { getDebugsy } from '@workspace/debugsy';
getDebugsy().setUIVersion('v2');
```

---

## API Reference

### Types

```typescript
type UIVersion = "v1" | "v2" | "auto";

interface DebugsyLookProps {
  closeOnClickOutside?: boolean;
  uiVersion?: UIVersion;  // New in Phase 0
}
```

### Methods

```typescript
// Get debugsy instance
const dsy = getDebugsy();

// Set UI version
dsy.setUIVersion('v2');

// Get current UI version
const version = dsy.getUIVersion();  // "v1" | "v2" | "auto" | undefined
```

---

## Troubleshooting

### Toggle not working?
- Check console for errors
- Try clicking the ⇄ button instead of keyboard
- Verify `Cmd+Shift+D` isn't captured by another app

### Preference not persisting?
- Check browser localStorage: `localStorage.getItem('debugsy-ui-version')`
- Clear and try again: `localStorage.removeItem('debugsy-ui-version')`

### Notification not appearing?
- Check `debug-display-state` is functioning
- Try manual toggle: `dsy.setUIVersion('v2')`

### V2 looks wrong?
- **Expected!** V2 is currently a placeholder (Phase 0)
- Full implementation coming in Phase 1
- Use V1 for actual work

---

## File Structure

```
packages/debugsy/src/debugsy-look/
├── debugsy-look.tsx       # Smart wrapper (NEW)
├── debugsy-look-v1.tsx    # Original implementation (RENAMED)
├── debugsy-look-v2.tsx    # Harbuz implementation (NEW - placeholder)
├── ui-control-center/
│   └── header.tsx         # Updated with version indicator
├── ui-logs/               # V1 components (unchanged)
└── v2/                    # V2-specific code (Phase 1)
    ├── orchestration/     # Coming in Phase 2
    └── formatters/        # Coming in Phase 3
```

---

## Next Steps (For Contributors)

**Phase 1:** Create V2 with TerminalLayout shell  
**Phase 2:** Port state orchestration  
**Phase 3:** Register specialized formatters  
**Phase 4:** Visual parity testing  
**Phase 5:** Beta rollout  
**Phase 6:** Cleanup V1

---

## Documentation

- `parallel-ui-migration-strategy.md` - Full strategy
- `parallel-ui-architecture-diagram.md` - Visual guide
- `phase-0-complete-summary.md` - Phase 0 completion report
- `debugsy-harbuz-migration-analysis.md` - Migration analysis

---

## Questions?

See full documentation in `_agent/` folder or ask the team.

**Happy debugging!** 🐛✨

