export type DiscordTimestampStyle = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';

export function formatDiscordTimestamp(
  epoch: number,
  style: DiscordTimestampStyle | string = 'f'
): string {
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
      return formatRelativeDiscordTime(epoch);
    default:
      return date.toLocaleString();
  }
}

export function formatRelativeDiscordTime(epoch: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = epoch - now;
  const absDiff = Math.abs(diff);

  if (diff === 0) {
    return 'now';
  }

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
