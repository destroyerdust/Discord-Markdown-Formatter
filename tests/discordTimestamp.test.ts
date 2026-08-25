import { describe, expect, it, vi } from 'vitest';
import {
  formatDiscordTimestamp,
  formatRelativeDiscordTime,
} from '../src/lib/discordTimestamp';

describe('discordTimestamp', () => {
  it('formats each absolute timestamp style', () => {
    const epoch = 1_735_693_200;
    const date = new Date(epoch * 1000);

    expect(formatDiscordTimestamp(epoch, 't')).toBe(
      date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    );
    expect(formatDiscordTimestamp(epoch, 'T')).toBe(
      date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      })
    );
    expect(formatDiscordTimestamp(epoch, 'd')).toBe(
      date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' })
    );
    expect(formatDiscordTimestamp(epoch, 'D')).toBe(
      date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    );
    expect(formatDiscordTimestamp(epoch, 'f')).toBe(
      date.toLocaleString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    );
    expect(formatDiscordTimestamp(epoch, 'F')).toBe(
      date.toLocaleString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    );
    expect(formatDiscordTimestamp(epoch, 'x')).toBe(date.toLocaleString());
  });

  it('delegates relative style formatting', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));

    expect(formatDiscordTimestamp(1_735_689_900, 'R')).toBe('in 5 minutes');
    expect(formatRelativeDiscordTime(1_735_689_600)).toBe('now');
    expect(formatRelativeDiscordTime(1_735_689_601)).toBe('in 1 second');
    expect(formatRelativeDiscordTime(1_735_689_605)).toBe('in 5 seconds');
    expect(formatRelativeDiscordTime(1_735_689_599)).toBe('1 second ago');
    expect(formatRelativeDiscordTime(1_735_689_595)).toBe('5 seconds ago');
    expect(formatRelativeDiscordTime(1_735_689_660)).toBe('in 1 minute');
    expect(formatRelativeDiscordTime(1_735_689_900)).toBe('in 5 minutes');
    expect(formatRelativeDiscordTime(1_735_689_540)).toBe('1 minute ago');
    expect(formatRelativeDiscordTime(1_735_689_300)).toBe('5 minutes ago');
    expect(formatRelativeDiscordTime(1_735_693_200)).toBe('in 1 hour');
    expect(formatRelativeDiscordTime(1_735_707_600)).toBe('in 5 hours');
    expect(formatRelativeDiscordTime(1_735_686_000)).toBe('1 hour ago');
    expect(formatRelativeDiscordTime(1_735_671_600)).toBe('5 hours ago');
    expect(formatRelativeDiscordTime(1_735_776_000)).toBe('in 1 day');
    expect(formatRelativeDiscordTime(1_736_121_600)).toBe('in 5 days');
    expect(formatRelativeDiscordTime(1_735_603_200)).toBe('1 day ago');
    expect(formatRelativeDiscordTime(1_735_257_600)).toBe('5 days ago');
    expect(formatRelativeDiscordTime(1_738_281_600)).toBe('in 1 month');
    expect(formatRelativeDiscordTime(1_748_649_600)).toBe('in 5 months');
    expect(formatRelativeDiscordTime(1_733_097_600)).toBe('1 month ago');
    expect(formatRelativeDiscordTime(1_722_729_600)).toBe('5 months ago');
    expect(formatRelativeDiscordTime(1_767_225_600)).toBe('in 1 year');
    expect(formatRelativeDiscordTime(1_861_833_600)).toBe('in 4 years');
    expect(formatRelativeDiscordTime(1_704_153_600)).toBe('1 year ago');
    expect(formatRelativeDiscordTime(1_609_545_600)).toBe('4 years ago');
  });
});
