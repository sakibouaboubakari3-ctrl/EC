export function statusMessageKey(status: string): string {
  const pascal = status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return `dashboard.status${pascal}`;
}
