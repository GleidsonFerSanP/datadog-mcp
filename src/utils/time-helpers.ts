const DURATION_REGEX = /^(\d+)(m|h|d)$/;
const NOW_RELATIVE_REGEX = /^now-(\d+)(m|h|d)$/;

function durationToMs(value: number, unit: string): number {
  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return value * 60 * 1000;
  }
}

export function parseTimeRange(input: string): { from: number; to: number } {
  const now = Date.now();

  // Handle "15m", "1h", "7d" etc.
  const durationMatch = input.match(DURATION_REGEX);
  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2];
    const ms = durationToMs(value, unit);
    return {
      from: Math.floor((now - ms) / 1000),
      to: Math.floor(now / 1000),
    };
  }

  // Handle "now-1h", "now-30m"
  const relativeMatch = input.match(NOW_RELATIVE_REGEX);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];
    const ms = durationToMs(value, unit);
    return {
      from: Math.floor((now - ms) / 1000),
      to: Math.floor(now / 1000),
    };
  }

  // Default: last 1 hour
  return getDefaultTimeRange();
}

export function toUnixSeconds(date: Date | string): number {
  if (typeof date === 'string') {
    if (date === 'now') return Math.floor(Date.now() / 1000);

    const relativeMatch = date.match(NOW_RELATIVE_REGEX);
    if (relativeMatch) {
      const value = parseInt(relativeMatch[1], 10);
      const unit = relativeMatch[2];
      const ms = durationToMs(value, unit);
      return Math.floor((Date.now() - ms) / 1000);
    }

    const durationMatch = date.match(DURATION_REGEX);
    if (durationMatch) {
      const value = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2];
      const ms = durationToMs(value, unit);
      return Math.floor((Date.now() - ms) / 1000);
    }

    // Try parsing as a date string or unix timestamp
    const num = Number(date);
    if (!isNaN(num)) return num;

    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return Math.floor(parsed.getTime() / 1000);

    // Fallback
    return Math.floor(Date.now() / 1000);
  }

  return Math.floor(date.getTime() / 1000);
}

export function toISO8601(date: Date | number): string {
  if (typeof date === 'number') {
    // Assume seconds if less than a reasonable ms timestamp
    const ms = date < 1e12 ? date * 1000 : date;
    return new Date(ms).toISOString();
  }
  return date.toISOString();
}

export function getDefaultTimeRange(): { from: number; to: number } {
  const now = Math.floor(Date.now() / 1000);
  return {
    from: now - 3600, // 1 hour ago
    to: now,
  };
}

export function formatTimestamp(ts: number): string {
  // Convert seconds to ms if needed
  const ms = ts < 1e12 ? ts * 1000 : ts;
  const d = new Date(ms);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}
