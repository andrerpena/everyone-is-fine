import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { HorizontalResizeHandle } from "../resize-handle/HorizontalResizeHandle";
import { VerticalResizeHandle } from "../resize-handle/VerticalResizeHandle";
import { useResize } from "./useResize";

const DockContext = createContext<boolean>(false);

export interface DockProps {
  top?: React.ReactNode;
  bottom?: React.ReactNode;
  center: React.ReactNode;
  leftTop?: React.ReactNode;
  leftBottom?: React.ReactNode;
  rightTop?: React.ReactNode;
  rightBottom?: React.ReactNode;
  centerBottom?: React.ReactNode;
  defaultLeftWidth?: number;
  defaultRightWidth?: number;
  defaultCenterBottomHeight?: number;
  /** Ratio of bottom panel height (0.0-1.0), defaults to 0.5 for equal split */
  defaultLeftBottomRatio?: number;
  /** Ratio of bottom panel height (0.0-1.0), defaults to 0.5 for equal split */
  defaultRightBottomRatio?: number;
}

export const Dock: React.FC<DockProps> = ({
  top,
  bottom,
  center,
  leftTop,
  leftBottom,
  rightTop,
  rightBottom,
  centerBottom,
  defaultLeftWidth = 400,
  defaultRightWidth = 400,
  defaultCenterBottomHeight = 300,
  defaultLeftBottomRatio = 0.5,
  defaultRightBottomRatio = 0.5,
}) => {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [rightWidth, setRightWidth] = useState(defaultRightWidth);
  const [centerBottomHeight, setCenterBottomHeight] = useState(
    defaultCenterBottomHeight,
  );
  // Ratio-based heights for side panels (0.5 = equal split)
  const [leftBottomRatio, setLeftBottomRatio] = useState(
    defaultLeftBottomRatio,
  );
  const [rightBottomRatio, setRightBottomRatio] = useState(
    defaultRightBottomRatio,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const isNested = useContext(DockContext);

  const getLeftConstraints = useCallback(() => {
    if (containerRef.current) {
      const maxWidth =
        containerRef.current.offsetWidth -
        (rightTop || rightBottom ? rightWidth : 0) -
        100;
      return { min: 100, max: maxWidth };
    }
    return { min: 100, max: Number.POSITIVE_INFINITY };
  }, [rightWidth, rightTop, rightBottom]);

  const getRightConstraints = useCallback(() => {
    if (containerRef.current) {
      const maxWidth =
        containerRef.current.offsetWidth -
        (leftTop || leftBottom ? leftWidth : 0) -
        100;
      return { min: 100, max: maxWidth };
    }
    return { min: 100, max: Number.POSITIVE_INFINITY };
  }, [leftWidth, leftTop, leftBottom]);

  const getCenterBottomConstraints = useCallback(() => {
    if (containerRef.current) {
      const maxHeight = containerRef.current.offsetHeight - 100;
      return { min: 50, max: maxHeight };
    }
    return { min: 50, max: Number.POSITIVE_INFINITY };
  }, []);

  // Ratio-based resize for side panel splits
  // Convert ratio to pixel height, let useResize handle the drag, then convert back to ratio
  const getColumnHeight = useCallback(() => {
    return containerRef.current?.offsetHeight ?? 600;
  }, []);

  // Pixel constraints for side panel splits (10% to 90% of column height)
  const getSideRatioConstraints = useCallback(() => {
    const columnHeight = getColumnHeight();
    return { min: 0.1 * columnHeight, max: 0.9 * columnHeight };
  }, [getColumnHeight]);

  const leftResize = useResize(
    setLeftWidth,
    () => leftWidth,
    getLeftConstraints,
  );
  const rightResize = useResize(
    setRightWidth,
    () => rightWidth,
    getRightConstraints,
    true,
  );
  const centerBottomResize = useResize(
    setCenterBottomHeight,
    () => centerBottomHeight,
    getCenterBottomConstraints,
    true,
    true,
  );

  const leftBottomResize = useResize(
    (newHeight: number) => {
      const columnHeight = getColumnHeight();
      const newRatio = Math.max(0.1, Math.min(0.9, newHeight / columnHeight));
      setLeftBottomRatio(newRatio);
    },
    () => leftBottomRatio * getColumnHeight(),
    getSideRatioConstraints,
    true,
    true,
  );

  const rightBottomResize = useResize(
    (newHeight: number) => {
      const columnHeight = getColumnHeight();
      const newRatio = Math.max(0.1, Math.min(0.9, newHeight / columnHeight));
      setRightBottomRatio(newRatio);
    },
    () => rightBottomRatio * getColumnHeight(),
    getSideRatioConstraints,
    true,
    true,
  );

  const hasLeft = leftTop || leftBottom;
  const hasRight = rightTop || rightBottom;

  return (
    <DockContext.Provider value={true}>
      <div
        ref={containerRef}
        className={`flex flex-col h-full w-full min-h-0 min-w-0 ${isNested ? "h-auto w-auto" : "h-screen w-screen"}`}
      >
        {top && (
          <div
            className="w-full bg-background border-b border-border"
            style={{ pointerEvents: "auto" }}
          >
            {top}
          </div>
        )}
        <div className="flex flex-1 min-h-0">
          {hasLeft && (
            <div
              className="grid relative bg-background border-r border-border"
              style={{
                width: leftWidth,
                pointerEvents: "auto",
                gridTemplateRows:
                  leftTop && leftBottom
                    ? `${1 - leftBottomRatio}fr ${leftBottomRatio}fr`
                    : "1fr",
              }}
            >
              {leftTop && (
                <div className="relative overflow-hidden min-h-0">
                  {leftTop}
                </div>
              )}
              {leftBottom && (
                <div className="relative overflow-hidden min-h-0">
                  {leftTop && (
                    <VerticalResizeHandle
                      onResizeStart={leftBottomResize.onResizeStart}
                      isDragging={leftBottomResize.isDragging}
                      align="top"
                    />
                  )}
                  {leftBottom}
                </div>
              )}
              <HorizontalResizeHandle
                onResizeStart={leftResize.onResizeStart}
                isDragging={leftResize.isDragging}
                align="right"
              />
            </div>
          )}

          <div className="flex-1 flex flex-col relative min-w-0 min-h-0">
            <div
              className={`flex-1 relative min-h-0 overflow-hidden ${center ? "bg-background" : ""}`}
              style={{ pointerEvents: center ? "auto" : "none" }}
            >
              {center}
            </div>
            {centerBottom && (
              <div
                className="grid relative overflow-hidden border-t border-border"
                style={{
                  height: centerBottomHeight,
                  pointerEvents: "auto",
                }}
              >
                <VerticalResizeHandle
                  onResizeStart={centerBottomResize.onResizeStart}
                  isDragging={centerBottomResize.isDragging}
                  align="top"
                />
                <div className="overflow-hidden min-h-0">{centerBottom}</div>
              </div>
            )}
          </div>

          {hasRight && (
            <div
              className="grid relative bg-background border-l border-border"
              style={{
                width: rightWidth,
                pointerEvents: "auto",
                gridTemplateRows:
                  rightTop && rightBottom
                    ? `${1 - rightBottomRatio}fr ${rightBottomRatio}fr`
                    : "1fr",
              }}
            >
              {rightTop && (
                <div className="relative overflow-hidden min-h-0">
                  {rightTop}
                </div>
              )}
              {rightBottom && (
                <div className="relative overflow-hidden min-h-0">
                  {rightTop && (
                    <VerticalResizeHandle
                      onResizeStart={rightBottomResize.onResizeStart}
                      isDragging={rightBottomResize.isDragging}
                      align="top"
                    />
                  )}
                  {rightBottom}
                </div>
              )}
              <HorizontalResizeHandle
                onResizeStart={rightResize.onResizeStart}
                isDragging={rightResize.isDragging}
                align="left"
              />
            </div>
          )}
        </div>
        {bottom && (
          <div
            className="w-full bg-background border-t border-border"
            style={{ pointerEvents: "auto" }}
          >
            {bottom}
          </div>
        )}
      </div>
    </DockContext.Provider>
  );
};
