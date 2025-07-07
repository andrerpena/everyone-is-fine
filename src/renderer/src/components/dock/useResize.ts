import { useCallback, useState } from "react";

type GetConstraints = () => { min: number; max: number };

export const useResize = (
  onResize: (newSize: number) => void,
  getStartSize: () => number,
  getConstraints: GetConstraints,
  isReverse = false,
  isHorizontal = false,
) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const startCoordinate = isHorizontal ? e.clientY : e.clientX;
      const startSize = getStartSize();

      const handleMove = (moveEvent: MouseEvent) => {
        const currentCoordinate = isHorizontal
          ? moveEvent.clientY
          : moveEvent.clientX;
        const delta = currentCoordinate - startCoordinate;
        const newSize = startSize + (isReverse ? -delta : delta);
        const { min, max } = getConstraints();
        onResize(Math.max(min, Math.min(newSize, max)));
      };

      const handleEnd = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleEnd);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
    },
    [onResize, getStartSize, getConstraints, isReverse, isHorizontal],
  );

  return { onResizeStart: handleResizeStart, isDragging };
};
