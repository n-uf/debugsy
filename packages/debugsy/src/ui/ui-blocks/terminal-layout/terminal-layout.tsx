"use client";

import React, { createContext, useContext } from "react";
import { colors } from "../../tokens/colors";
import { Z_INDEX } from "../../tokens/z-index";

export interface TerminalLayoutContextValue {
  bodyHeight: number;
  isResizing: boolean;
  backgroundColor: string;
  borderColor: string;
}

const TerminalLayoutContext = createContext<
  TerminalLayoutContextValue | undefined
>(undefined);

export const useTerminalLayoutContext = (): TerminalLayoutContextValue => {
  const context = useContext(TerminalLayoutContext);
  if (!context) {
    throw new Error(
      "TerminalLayout compound components must be used within TerminalLayout"
    );
  }
  return context;
};

export interface TerminalLayoutProps {
  /** Body height in pixels (applied to TerminalLayoutBody) */
  bodyHeight: number;
  /** Whether the panel is currently being resized */
  isResizing?: boolean;
  /** Child components (compound pattern) */
  children: React.ReactNode;
  /** Custom background color */
  backgroundColor?: string;
  /** Custom border color */
  borderColor?: string;
  /** Animation duration */
  animationDuration?: string;
  /** Compact mode - applies subtle top border instead of shadow */
  isCompact?: boolean;
}

/**
 * TerminalLayout - Root container for terminal/debug UI
 *
 * Compound component pattern following shadcn Card style.
 * The layout auto-sizes to its content (TerminalLayoutBody + TerminalLayoutControlPanel).
 * The bodyHeight prop controls the TerminalLayoutBody height.
 *
 * Usage:
 * ```tsx
 * <TerminalLayout bodyHeight={600} isResizing={isResizing}>
 *   <TerminalLayoutHeader>
 *     <TerminalLayoutResizeHandle onResizeStart={handleResize} />
 *   </TerminalLayoutHeader>
 *
 *   <TerminalLayoutBody>
 *     <TerminalLayoutContent>
 *       <LogsList />
 *       <TerminalLayoutActions>
 *         <ActionsPanel />
 *       </TerminalLayoutActions>
 *     </TerminalLayoutContent>
 *
 *     <TerminalLayoutSidebar>
 *       <TerminalLayoutStats>
 *         <TerminalLayoutStatItem label="Logs" value={2742} />
 *       </TerminalLayoutStats>
 *     </TerminalLayoutSidebar>
 *   </TerminalLayoutBody>
 *
 *   <TerminalLayoutControlPanel>
 *     <ControlPanel />
 *   </TerminalLayoutControlPanel>
 * </TerminalLayout>
 * ```
 */
export const TerminalLayout: React.FC<TerminalLayoutProps> = ({
  bodyHeight,
  isResizing = false,
  children,
  backgroundColor,
  borderColor,
  animationDuration: _animationDuration = "0.2s",
  isCompact = false,
}) => {
  void _animationDuration; // reserved for future animation
  const contextValue: TerminalLayoutContextValue = {
    bodyHeight,
    isResizing,
    backgroundColor: backgroundColor ?? colors.terminal.bgDark,
    borderColor: borderColor ?? colors.terminal.border,
  };

  return (
    <TerminalLayoutContext.Provider value={contextValue}>
      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          // No `maxHeight` here — the shell must be free to grow up to the
          // full positioned-parent. The previous `90vh` cap was the cause of
          // the "handle freezes ~10% from top" bug: the shell would refuse to
          // exceed 90vh while its body was sized to `${bodyHeight}px` with
          // `flexShrink: 0`, so the body would overflow the shell from the
          // bottom (panel "slides off") and the resize handle (in the header)
          // could never travel above the 10vh strip. Sizing is now the
          // responsibility of the consumer (DebugsyLook / harbuz-terminal),
          // both of which already wrap this in a positioned, sized container.
          height: "auto",
          backgroundColor: backgroundColor ?? "rgb(var(--color-bg-primary))",
          zIndex: Z_INDEX.DEBUG_PANEL,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          // Compact mode: subtle top border, no shadow
          // Extended mode: prominent shadow
          ...(isCompact
            ? {
                borderTop: "1px solid rgb(var(--color-border))",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
              }
            : {
          boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.5)",
              }),
        }}
      >
        {children}
      </div>

      {/* Global styles for animations */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </TerminalLayoutContext.Provider>
  );
};

TerminalLayout.displayName = "TerminalLayout";

