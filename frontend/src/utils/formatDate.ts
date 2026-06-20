/**
 * Format an ISO date string into a human-readable format.
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time from ISO date string.
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format full date with time.
 */
export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} · ${formatTime(dateStr)} IST`;
}

/**
 * Format a date range.
 */
export function formatDateRange(start: string, end?: string): string {
  if (!end) return formatDateTime(start);
  return `${formatDate(start)} · ${formatTime(start)} – ${formatTime(end)} IST`;
}

/**
 * Format date for event card (uppercase mono style).
 */
export function formatCardDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
}
