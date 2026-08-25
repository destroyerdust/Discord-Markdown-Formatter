import { DateTime } from 'luxon';
import { describe, expect, it, vi } from 'vitest';
import {
  TIMESTAMP_PRESETS,
  TIMESTAMP_STYLES,
  dateTimeToEpoch,
  formatRelativeTime,
  formatTimestampPreview,
  generateTimestampToken,
  getCurrentDate,
  getCurrentTime,
  getPopularTimezones,
  getTimezones,
  isValidTimezone,
  toEpochSeconds,
} from '../src/lib/time';
import { formatDiscordTimestamp, formatRelativeDiscordTime } from '../src/lib/discordTimestamp';

describe('time utilities', () => {
  it('returns timezone metadata and popular subsets', () => {
    const all = getTimezones();
    const popular = getPopularTimezones();

    expect(all.length).toBeGreaterThan(100);
    expect(all[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        label: expect.any(String),
        offset: expect.stringMatching(/^[+-]\d{2}:\d{2}$/),
        group: expect.any(String),
      })
    );
    expect(popular.some((tz) => tz.name.includes('UTC') || tz.label.includes('UTC'))).toBe(false);
  });

  it('converts valid and invalid dates to epoch seconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(toEpochSeconds('2025-01-01', '12:34', 'UTC')).toBe(
      Math.floor(DateTime.fromISO('2025-01-01T12:34', { zone: 'UTC' }).toSeconds())
    );
    expect(toEpochSeconds('2025-01-01', '12:34', 'Invalid/Zone')).toBe(1_735_689_600);
    expect(warnSpy).toHaveBeenCalledWith('Invalid date/time:', expect.any(String));
  });

  it('formats timestamps and relative time through the shared helpers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    expect(TIMESTAMP_STYLES).toHaveLength(7);
    expect(dateTimeToEpoch(DateTime.fromISO('2025-01-01T12:00:00Z'))).toBe(
      Math.floor(DateTime.fromISO('2025-01-01T12:00:00Z').toSeconds())
    );
    expect(generateTimestampToken(123)).toBe('<t:123>');
    expect(generateTimestampToken(123, 'R')).toBe('<t:123:R>');
    expect(formatTimestampPreview(1_735_693_200, 'f')).toBe(formatDiscordTimestamp(1_735_693_200, 'f'));
    expect(formatRelativeTime(1_735_689_900)).toBe(formatRelativeDiscordTime(1_735_689_900));
  });

  it('computes all presets deterministically', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-03T20:15:00Z'));

    const presetResults = Object.fromEntries(
      TIMESTAMP_PRESETS.map((preset) => [preset.id, preset.getDateTime('UTC').toISO()])
    );

    expect(presetResults.now).toBe('2025-01-03T20:15:00.000Z');
    expect(presetResults.in5min).toBe('2025-01-03T20:20:00.000Z');
    expect(presetResults.in15min).toBe('2025-01-03T20:30:00.000Z');
    expect(presetResults.in30min).toBe('2025-01-03T20:45:00.000Z');
    expect(presetResults.in1hour).toBe('2025-01-03T21:15:00.000Z');
    expect(presetResults.in24hours).toBe('2025-01-04T20:15:00.000Z');
    expect(presetResults.tonight7pm).toBe('2025-01-04T19:00:00.000Z');
    expect(presetResults.tomorrow).toBe('2025-01-04T20:15:00.000Z');
    expect(presetResults.tomorrowNoon).toBe('2025-01-04T12:00:00.000Z');
    expect(presetResults.nextFriday6pm).toBe('2025-01-10T18:00:00.000Z');
    expect(presetResults.nextWeek).toBe('2025-01-10T20:15:00.000Z');
  });

  it('covers the remaining preset branches and timezone validation helpers', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-03T18:15:00Z'));

    expect(TIMESTAMP_PRESETS.find((preset) => preset.id === 'tonight7pm')?.getDateTime('UTC').toISO()).toBe(
      '2025-01-03T19:00:00.000Z'
    );
    expect(TIMESTAMP_PRESETS.find((preset) => preset.id === 'nextFriday6pm')?.getDateTime('UTC').toISO()).toBe(
      '2025-01-10T18:00:00.000Z'
    );
    expect(getCurrentDate('UTC')).toBe('2025-01-03');
    expect(getCurrentTime('UTC')).toBe('18:15');
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Nope/Zone')).toBe(false);
  });

  it('falls back to continent name when timezone group metadata is empty', async () => {
    vi.resetModules();
    vi.doMock('@vvo/tzdb', () => ({
      getTimeZones: () => [
        {
          name: 'Example/Zone',
          rawOffsetInMinutes: 90,
          group: [],
          continentName: 'Example',
        },
      ],
    }));

    const { getTimezones: getMockedTimezones } = await import('../src/lib/time');

    expect(getMockedTimezones()).toEqual([
      {
        name: 'Example/Zone',
        label: 'Example/Zone',
        offset: '+01:30',
        group: 'Example',
      },
    ]);
  });
});
