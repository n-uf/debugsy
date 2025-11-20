# Missing Features Implementation Plan

**Date:** 2025-11-19  
**Status:** Ready for implementation  
**Priority:** High (if dependency tracking is used in production)

---

## Implementation Strategy

Given the scope of missing features, I recommend a **phased approach**:

### Phase 1: Critical Features (High Priority) ✅
**Estimated Time:** 1-2 days  
**Impact:** High - Enables basic dependency debugging

1. ✅ **Documentation moved** to correct location
2. **Port Delta Calculation System**
   - Copy `calculateDelta` function to Harbuz utils
   - Copy `DeltaInfo` interface
   - Copy helper functions (`formatDelta`, `getImpactColor`)
   
3. **Port Enhanced Object Display**
   - Copy `getEnhancedObjectDisplay` to Harbuz utils
   - Add type badges and enhanced formatting

4. **Add Frequency Tracking Display**
   - Modify change formatter to show `(#N)` count
   - Add `⚠️ FREQUENT` warning for high-frequency changes

### Phase 2: Advanced Features (Medium Priority)
**Estimated Time:** 2-3 days  
**Impact:** Medium - Improves debugging experience

5. **Port Delta Display Components**
   - Create `DeltaDisplay` component in Harbuz
   - Create `DeltaSummary` component
   - Integrate with change formatter

6. **Port Value Renderers**
   - Create `CompactValueRenderer` component
   - Add type badges and enhanced value display
   - Integrate with diff display

7. **Add Performance Impact Indicators**
   - Add `⚡HIGH` / `⚠️MOD` badges
   - Calculate performance impact from delta metrics
   - Display in delta summary

### Phase 3: Specialized Formatters (Low Priority)
**Estimated Time:** 2-3 days  
**Impact:** Low - Only needed for specific log types

8. **Port Dependency Formatter**
   - Create full dependency expansion content
   - Add log type detection
   - Add component name extraction
   - Add help messages

9. **Port Health Formatter**
   - Create health expansion content
   - Add structured metrics display
   - Only if health snapshots are used

10. **Port Sanitized Data Formatter**
    - Create sanitized data expansion content
    - Add sanitization detection
    - Only if data sanitization is used

---

## Decision Point

**Question:** Is dependency tracking actively used in production?

**If YES:**
- Proceed with Phase 1 immediately
- Evaluate Phase 2 based on user feedback
- Phase 3 only if specific formatters are needed

**If NO:**
- Current state is sufficient
- Revisit if dependency tracking becomes important

---

## Recommendation

Based on the analysis, I recommend **implementing Phase 1 only** at this time:

**Reasons:**
1. **Low Risk:** Adds utilities without breaking existing code
2. **High Value:** Enables frequency tracking and enhanced display
3. **Quick Win:** Can be done in 1-2 days
4. **Incremental:** Can add Phase 2/3 later if needed

**What Phase 1 Gives You:**
- ✅ Frequency tracking: See which dependencies change often
- ✅ Enhanced display: Better type information
- ✅ Delta calculation: Understand impact of changes
- ✅ Foundation: Ready for Phase 2 if needed

**What's Still Missing (Acceptable):**
- ❌ Delta display components (can show in text)
- ❌ Performance badges (can infer from frequency)
- ❌ Specialized formatters (can use default)

---

## Implementation Details

### 1. Delta Calculation System

**File:** `packages/harbuz/src/utils/delta-utils.ts` (NEW)

```typescript
export interface DeltaInfo {
  type: "numeric" | "size" | "type" | "content" | "reference";
  delta: number | string;
  impact: "low" | "medium" | "high";
  description: string;
  fromValue?: any;
  toValue?: any;
  metrics?: {
    sizeChange?: number;
    complexityChange?: number;
    performanceImpact?: "minimal" | "moderate" | "significant";
  };
}

export const calculateDelta = (
  from: any,
  to: any,
  propertyName: string,
  trackingInfo?: any
): DeltaInfo | null => {
  // Port from V1
};

export const formatDelta = (delta: DeltaInfo): string => {
  // Port from V1
};

export const getImpactColor = (impact: "low" | "medium" | "high"): string => {
  // Port from V1
};
```

**Usage in change formatter:**
```typescript
import { calculateDelta, formatDelta } from "../../utils/delta-utils";

// In ChangeExpansionContent:
const delta = calculateDelta(change.from, change.to, change.key, change.tracking);
if (delta) {
  return <span style={{ color: getImpactColor(delta.impact) }}>
    {formatDelta(delta)}
  </span>;
}
```

### 2. Enhanced Object Display

**File:** `packages/harbuz/src/utils/object-display-utils.ts` (NEW)

```typescript
export const getEnhancedObjectDisplay = (
  value: any
): { display: string; type: string; badge?: string } => {
  // Port from V1
};
```

**Usage in diff display:**
```typescript
import { getEnhancedObjectDisplay } from "../../utils/object-display-utils";

// In CompactDiffEntry:
const enhanced = getEnhancedObjectDisplay(diff.from);
return <span>{enhanced.badge} {enhanced.display}</span>;
```

### 3. Frequency Tracking Display

**File:** `packages/harbuz/src/ui-blocks/log-entry/formatters/change-formatter.tsx` (MODIFY)

```typescript
// Add to extractChanges function:
const extractChanges = (data: any): Array<{
  key: string;
  from: any;
  to: any;
  tracking?: {
    count: number;
    isFrequent: boolean;
    isStable: boolean;
  };
}> => {
  // ... existing code ...
  
  // Check for tracking info
  if (prop && typeof prop === "object" && "tracking" in prop) {
    changes.push({
      key,
      from: prop.from,
      to: prop.to,
      tracking: prop.tracking,
    });
  }
  // ... rest of code ...
};

// In ChangeExpansionContent render:
{change.tracking && (
  <span style={{
    fontSize: "8px",
    color: change.tracking.isFrequent ? "#ef4444" : "#6b7280",
    fontWeight: "600",
  }}>
    (#{change.tracking.count})
    {change.tracking.isFrequent && " ⚠️ FREQUENT"}
  </span>
)}
```

---

## Testing Plan

### Unit Tests
1. Test `calculateDelta` with various input types
2. Test `getEnhancedObjectDisplay` with edge cases
3. Test frequency tracking display logic

### Integration Tests
1. Verify change formatter shows frequency
2. Verify delta calculation is correct
3. Verify enhanced display works in diffs

### Manual Testing
1. Create logs with dependency changes
2. Verify frequency tracking appears
3. Verify enhanced object display works
4. Verify no regressions in existing formatters

---

## Rollback Plan

If issues arise:
1. **Delta utils:** Remove import, revert to basic display
2. **Enhanced display:** Remove import, use `String(value)`
3. **Frequency tracking:** Remove conditional render

All changes are additive and can be safely removed without breaking existing functionality.

---

## Next Steps

**Immediate:**
1. ✅ Move documentation to correct location
2. Create `delta-utils.ts` in Harbuz
3. Create `object-display-utils.ts` in Harbuz
4. Modify `change-formatter.tsx` to use new utils
5. Test and verify

**Future (if needed):**
1. Implement Phase 2 (Delta display components)
2. Implement Phase 3 (Specialized formatters)
3. Add comprehensive test coverage

---

## Conclusion

**Status:** Ready to implement Phase 1  
**Risk:** Low  
**Value:** High  
**Time:** 1-2 days  

**Recommendation:** Proceed with Phase 1 implementation now. Evaluate Phase 2/3 based on production usage and user feedback.

