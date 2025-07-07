/**
 * Utility functions for reading CSS variables defined in the theme
 */

/**
 * Gets the value of a CSS variable from the computed styles
 * @param variableName - The CSS variable name (with or without the -- prefix)
 * @param element - The element to get computed styles from (defaults to document.documentElement)
 * @returns The CSS variable value as a string
 */
export function getCSSVariable(
  variableName: string,
  element: Element = document.documentElement,
): string {
  const normalizedName = variableName.startsWith("--")
    ? variableName
    : `--${variableName}`;
  const computedStyle = getComputedStyle(element);
  return computedStyle.getPropertyValue(normalizedName).trim();
}
