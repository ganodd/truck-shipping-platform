/**
 * Timezone-aware date utilities for the TruckShip platform.
 * All dates stored in UTC, displayed in local timezone.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Format a date for display, e.g. "Apr 15, 2026 at 3:30 PM"
 */
export function formatDateTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(date);
}

/**
 * Format a date only, e.g. "Apr 15, 2026"
 */
export function formatDate(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone,
  }).format(date);
}

/**
 * Format a time only, e.g. "3:30 PM"
 */
export function formatTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
  }).format(date);
}

/**
 * Format a pickup/delivery window, e.g. "Apr 15 9:00 AM – 2:00 PM"
 */
export function formatWindow(start: Date, end: Date, timeZone?: string): string {
  const startStr = formatDateTime(start, timeZone);
  const endStr = formatTime(end, timeZone);
  return `${startStr} – ${endStr}`;
}

/**
 * Returns a human-readable relative time string, e.g. "2 hours ago", "in 3 days"
 */
export function relativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime();
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs < 0;

  let result: string;

  if (absDiff < MINUTE) {
    result = 'just now';
    return result;
  } else if (absDiff < HOUR) {
    const minutes = Math.round(absDiff / MINUTE);
    result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (absDiff < DAY) {
    const hours = Math.round(absDiff / HOUR);
    result = `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else if (absDiff < WEEK) {
    const days = Math.round(absDiff / DAY);
    result = `${days} day${days !== 1 ? 's' : ''}`;
  } else {
    const weeks = Math.round(absDiff / WEEK);
    result = `${weeks} week${weeks !== 1 ? 's' : ''}`;
  }

  return isPast ? `${result} ago` : `in ${result}`;
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date, now: Date = new Date()): boolean {
  return date.getTime() < now.getTime();
}

/**
 * Check if two date ranges overlap
 */
export function doWindowsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
