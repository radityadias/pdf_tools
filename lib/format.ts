export function formatBytes(n: number): string {
  return n > 1_048_576 ? `${(n / 1_048_576).toFixed(2)} MB` : `${(n / 1024).toFixed(0)} KB`;
}