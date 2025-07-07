export async function showErrorDialog(
  message: string,
  title = "Error",
  detail?: string,
): Promise<void> {
  alert(`${title}\n\n${message}${detail ? `\n\n${detail}` : ""}`);
}

export async function showInfoDialog(
  message: string,
  title = "Information",
  detail?: string,
): Promise<void> {
  alert(`${title}\n\n${message}${detail ? `\n\n${detail}` : ""}`);
}

export async function showWarningDialog(
  message: string,
  title = "Warning",
  detail?: string,
): Promise<void> {
  alert(`${title}\n\n${message}${detail ? `\n\n${detail}` : ""}`);
}

export async function showConfirmDialog(
  message: string,
  title = "Confirm",
  detail?: string,
): Promise<boolean> {
  return confirm(`${title}\n\n${message}${detail ? `\n\n${detail}` : ""}`);
}
