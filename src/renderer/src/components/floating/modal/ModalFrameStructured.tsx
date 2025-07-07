import type { FC, ReactNode } from "react";

export type ModalFrameStructuredProps = {
  onClose?: () => void;
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  className?: string;
  "data-testid"?: string;
};

/**
 * A structured modal frame with distinct header, body, and footer sections.
 * The body section scrolls when content exceeds the available height,
 * while header and footer remain fixed.
 */
export const ModalFrameStructured: FC<ModalFrameStructuredProps> = ({
  header,
  body,
  footer,
  className = "",
  "data-testid": testId,
}) => {
  return (
    <div
      className={`rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm flex flex-col overflow-hidden ${className}`}
      style={{ maxHeight: "calc(100vh - 2rem)" }}
      data-testid={testId}
    >
      {header && <div className="flex-shrink-0 p-4 pb-3">{header}</div>}

      {body && (
        <div
          className={`flex-1 overflow-y-auto min-h-0 pb-4 ${!header ? "p-4" : "px-4"}`}
        >
          {body}
        </div>
      )}

      {footer && (
        <div className="flex-shrink-0 border-t border-[var(--border)]">
          {footer}
        </div>
      )}
    </div>
  );
};
