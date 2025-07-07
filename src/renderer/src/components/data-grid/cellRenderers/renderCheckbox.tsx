import type { RenderCheckboxProps } from "../types";

export function renderCheckbox({
  onChange,
  indeterminate,
  checked,
  disabled,
  tabIndex,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
}: RenderCheckboxProps) {
  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    onChange(event.target.checked, (event.nativeEvent as MouseEvent).shiftKey);
  }

  return (
    <div className="flex items-center justify-center">
      <input
        type="checkbox"
        ref={(el) => {
          if (el) {
            el.indeterminate = indeterminate ?? false;
          }
        }}
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        tabIndex={tabIndex}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className="h-4 w-4 cursor-pointer accent-primary"
      />
    </div>
  );
}
