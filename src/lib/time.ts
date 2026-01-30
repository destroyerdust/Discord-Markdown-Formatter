/**
 * Timestamp utilities using Luxon
 * Handles Discord timestamp generation and formatting
 */

import { DateTime } from 'luxon';
import { getTimeZones } from '@vvo/tzdb';

// Discord timestamp styles
export type TimestampStyle = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export interface TimestampStyleInfo {
  style: TimestampStyle;
  name: string;
  description: string;
  example: string;
}

export const TIMESTAMP_STYLES: TimestampStyleInfo[] = [
  { style: 't', name: 'Short Time', description: '9:41 PM', example: '9:41 PM' },
  { style: 'T', name: 'Long Time', description: '9:41:30 PM', example: '9:41:30 PM' },
  { style: 'd', name: 'Short Date', description: '11/28/2018', example: '11/28/2018' },
  { style: 'D', name: 'Long Date', description: 'November 28, 2018', example: 'November 28, 2018' },
  {
    style: 'f',
    name: 'Short Date/Time',
    description: 'November 28, 2018 9:41 PM',
    example: 'November 28, 2018 9:41 PM',
  },
  {
    style: 'F',
    name: 'Long Date/Time',
    description: 'Wednesday, November 28, 2018 9:41 PM',
    example: 'Wednesday, November 28, 2018 9:41 PM',
  },
  { style: 'R', name: 'Relative', description: '3 years ago', example: 'in 5 minutes' },
];

export interface TimezoneInfo {
  name: string;
  label: string;
  offset: string;
  group: string;
}

/**
 * Get list of all timezones with labels
 */
export function getTimezones(): TimezoneInfo[] {
  const tzData = getTimeZones();

  return tzData.map((tz) => ({
    name: tz.name,
    label: tz.name.replace(/_/g, ' '),
    offset: formatOffset(tz.rawOffsetInMinutes),
    group: tz.group[0] || tz.continentName,
  }));
}

/**
 * Get popular/common timezones
 */
export function getPopularTimezones(): TimezoneInfo[] {
  const popularNames = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Moscow',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Singapore',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Pacific/Auckland',
    'UTC',
  ];

  const all = getTimezones();
  return popularNames
    .map((name) => all.find((tz) => tz.name === name))
    .filter((tz): tz is TimezoneInfo => tz !== undefined);
}

/**
 * Format timezone offset as string (e.g., "+05:30", "-08:00")
 */
function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Convert date/time to Unix epoch seconds
 */
export function toEpochSeconds(date: string, time: string, timezone: string): number {
  const isoString = `${date}T${time}`;
  const dt = DateTime.fromISO(isoString, { zone: timezone });

  if (!dt.isValid) {
    console.warn('Invalid date/time:', dt.invalidReason);
    return Math.floor(Date.now() / 1000);
  }

  return Math.floor(dt.toSeconds());
}

/**
 * Convert DateTime to epoch seconds
 */
export function dateTimeToEpoch(dt: DateTime): number {
  return Math.floor(dt.toSeconds());
}

/**
 * Generate Discord timestamp token
 */
export function generateTimestampToken(epoch: number, style?: TimestampStyle): string {
  if (style && style !== 'f') {
    return `<t:${epoch}:${style}>`;
  }
  return `<t:${epoch}>`;
}

/**
 * Format epoch as human-readable preview based on style
 */
export function formatTimestampPreview(epoch: number, style: TimestampStyle): string {
  const date = new Date(epoch * 1000);

  switch (style) {
    case 't':
      return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    case 'T':
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    case 'd':
      return date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      });
    case 'D':
      return date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    case 'f':
      return date.toLocaleString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    case 'F':
      return date.toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    case 'R':
      return formatRelativeTime(epoch);
    default:
      return date.toLocaleString();
  }
}

/**
 * Format relative time (e.g., "in 5 minutes", "3 hours ago")
 */
export function formatRelativeTime(epoch: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = epoch - now;
  const absDiff = Math.abs(diff);

  if (absDiff < 60) {
    const secs = Math.floor(absDiff);
    const unit = secs === 1 ? 'second' : 'seconds';
    return diff < 0 ? `${secs} ${unit} ago` : `in ${secs} ${unit}`;
  }

  if (absDiff < 3600) {
    const mins = Math.floor(absDiff / 60);
    const unit = mins === 1 ? 'minute' : 'minutes';
    return diff < 0 ? `${mins} ${unit} ago` : `in ${mins} ${unit}`;
  }

  if (absDiff < 86400) {
    const hours = Math.floor(absDiff / 3600);
    const unit = hours === 1 ? 'hour' : 'hours';
    return diff < 0 ? `${hours} ${unit} ago` : `in ${hours} ${unit}`;
  }

  if (absDiff < 2592000) {
    const days = Math.floor(absDiff / 86400);
    const unit = days === 1 ? 'day' : 'days';
    return diff < 0 ? `${days} ${unit} ago` : `in ${days} ${unit}`;
  }

  if (absDiff < 31536000) {
    const months = Math.floor(absDiff / 2592000);
    const unit = months === 1 ? 'month' : 'months';
    return diff < 0 ? `${months} ${unit} ago` : `in ${months} ${unit}`;
  }

  const years = Math.floor(absDiff / 31536000);
  const unit = years === 1 ? 'year' : 'years';
  return diff < 0 ? `${years} ${unit} ago` : `in ${years} ${unit}`;
}

export interface TimestampPreset {
  id: string;
  label: string;
  getDateTime: (tz: string) => DateTime;
}

/**
 * Common timestamp presets
 */
export const TIMESTAMP_PRESETS: TimestampPreset[] = [
  {
    id: 'now',
    label: 'Now',
    getDateTime: (tz) => DateTime.now().setZone(tz),
  },
  {
    id: 'in5min',
    label: 'In 5 minutes',
    getDateTime: (tz) => DateTime.now().setZone(tz).plus({ minutes: 5 }),
  },
  {
    id: 'in15min',
    label: 'In 15 minutes',
    getDateTime: (tz) => DateTime.now().setZone(tz).plus({ minutes: 15 }),
  },
  {
    id: 'in30min',
    label: 'In 30 minutes',
    getDateTime: (tz) => DateTime.now().setZone(tz).plus({ minutes: 30 }),
  },
  {
    id: 'in1hour',
    label: 'In 1 hour',
    getDateTime: (tz) => DateTime.now().setZone(tz).plus({ hours: 1 }),
  },
  {
    id: 'in24hours',
    label: 'In 24 hours',
    getDateTime: (tz) => DateTime.now().setZone(tz).plus({ hours: 24 }),
  },
  {
    id: 'tonight7pm',
    label: 'Tonight 7 PM',
    getDateTime: (tz) => {
      const now = DateTime.now().setZone(tz);
      let target = now.set({ hour: 19, minute: 0, second: 0, millisecond: 0 });
      if (target <= now) {
        target = target.plus({ days: 1 });
      }
      return target;
    },
  },
  {
    id: 'tomorrow',
    label: 'Tomorrow (same time)',
    getDateTime: (tz) => DateTime.now().setZone(tz).plus({ days: 1 }),
  },
  {
    id: 'tomorrowNoon',
    label: 'Tomorrow noon',
    getDateTime: (tz) =>
      DateTime.now()
        .setZone(tz)
        .plus({ days: 1 })
        .set({ hour: 12, minute: 0, second: 0, millisecond: 0 }),
  },
  {
    id: 'nextFriday6pm',
    label: 'Next Friday 6 PM',
    getDateTime: (tz) => {
      const now = DateTime.now().setZone(tz);
      let target = now.set({ hour: 18, minute: 0, second: 0, millisecond: 0 });
      // Find next Friday (weekday 5)
      const daysUntilFriday = (5 - now.weekday + 7) % 7 || 7;
      target = target.plus({ days: daysUntilFriday });
      return target;
    },
  },
  {
    id: 'nextWeek',
    label: 'Next week (same time)',
    getDateTime: (tz) => DateTime.now().setZone(tz).plus({ weeks: 1 }),
  },
];

/**
 * Get current date in YYYY-MM-DD format for a timezone
 */
export function getCurrentDate(tz: string): string {
  return DateTime.now().setZone(tz).toFormat('yyyy-MM-dd');
}

/**
 * Get current time in HH:mm format for a timezone
 */
export function getCurrentTime(tz: string): string {
  return DateTime.now().setZone(tz).toFormat('HH:mm');
}

/**
 * Validate if a timezone is valid
 */
export function isValidTimezone(tz: string): boolean {
  try {
    const dt = DateTime.now().setZone(tz);
    return dt.isValid;
  } catch {
    return false;
  }
}
