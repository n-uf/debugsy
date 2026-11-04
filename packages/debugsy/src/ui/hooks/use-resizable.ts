import { useEffect, useRef, useState } from "react";

export interface UseResizableOptions {
  initialHeight: number;
  minHeight: number;
  maxHeight: number;
}

export interface UseResizableReturn {
  height: number;
  setHeight: (height: number) => void;
  isResizing: boolean;
  handleResizeStart: (event: React.MouseEvent) => void;
}

/**
 * Hook for managing resizable panel behavior
 *
 * Usage:
 * ```tsx
 * const { height, setHeight, isResizing, handleResizeStart } = useResizable({
 *   initialHeight: 600,
 *   minHeight: 200,
 *   maxHeight: 800,
 * });
 *
 * <ResizeHandle onResizeStart={handleResizeStart} isResizing={isResizing} />
 * ```
 */
export const useResizable = ({
  initialHeight,
  minHeight,
  maxHeight,
}: UseResizableOptions): UseResizableReturn => {
  const [height, setHeight] = useState(initialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (event: MouseEvent) => {
      const deltaY = event.clientY - resizeStartY.current;
      const newHeight = Math.max(
        minHeight,
        Math.min(maxHeight, resizeStartHeight.current - deltaY)
      );
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    // ✅ Use capture phase to ensure these fire BEFORE Surface's container listeners
    // This is critical when the resizable element is inside a Surface Dock
    document.addEventListener("mousemove", handleMouseMove, { capture: true });
    document.addEventListener("mouseup", handleMouseUp, { capture: true });
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove, {
        capture: true,
      });
      document.removeEventListener("mouseup", handleMouseUp, { capture: true });
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, minHeight, maxHeight]);

  const handleResizeStart = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    resizeStartY.current = event.clientY;
    resizeStartHeight.current = height;
  };

  return {
    height,
    setHeight,
    isResizing,
    handleResizeStart,
  };
};
