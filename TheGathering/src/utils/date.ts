/**
 * Date and time formatting utilities
 */

/**
 * Format timestamp to time string (HH:MM)
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date to string (DD/MM/YYYY)
 */
export function formatDate(date: Date | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Format date with time (DD/MM/YYYY HH:MM)
 */
export function formatDateTime(date: Date | number): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date for calendar display
 */
export function formatDateForCalendar(date: Date): string {
  return date.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Format relative time (e.g., "2h", "3d", "now")
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return formatDate(date);
  } else if (days > 0) {
    return `${days}d`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return "now";
  }
}
