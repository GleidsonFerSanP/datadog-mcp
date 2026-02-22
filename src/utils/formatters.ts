import { formatTimestamp } from './time-helpers.js';

export function formatLogEntry(log: any): string {
  const attrs = log.attributes || log;
  const timestamp = attrs.timestamp || attrs['@timestamp'] || '';
  const status = attrs.status || attrs.level || 'INFO';
  const service = attrs.service || attrs['service'] || 'unknown';
  const host = attrs.host || '';
  const message = attrs.message || attrs.content || JSON.stringify(attrs);

  const ts = timestamp ? formatTimestamp(new Date(timestamp).getTime() / 1000) : '';
  const truncatedMsg = message.length > 500 ? message.substring(0, 497) + '...' : message;
  const hostStr = host ? ` [${host}]` : '';

  return `[${ts}] [${String(status).toUpperCase()}] [${service}]${hostStr} ${truncatedMsg}`;
}

export function formatMonitorStatus(monitor: any): string {
  const statusEmoji: Record<string, string> = {
    'OK': '✅',
    'Alert': '🔴',
    'Warn': '🟡',
    'No Data': '⚪',
    'Unknown': '❓',
    'Ignored': '🔇',
    'Skipped': '⏭️',
  };

  const status = monitor.overall_state || monitor.status || 'Unknown';
  const emoji = statusEmoji[status] || '❓';
  const name = monitor.name || 'Unnamed Monitor';
  const id = monitor.id || 'N/A';
  const type = monitor.type || 'unknown';
  const query = monitor.query || '';

  return `${emoji} ${name} (ID: ${id}) — Type: ${type} — Status: ${status} — Query: ${query}`;
}

export function formatIncident(incident: any): string {
  const attrs = incident.attributes || incident;
  const title = attrs.title || 'Untitled';
  const severity = attrs.fields?.severity?.value || attrs.severity || 'unknown';
  const status = attrs.fields?.state?.value || attrs.status || 'unknown';
  const created = attrs.created || '';
  const customerImpact = attrs.customer_impacted ? '⚠️ Customer Impacted' : '';

  return `🚨 [${String(severity).toUpperCase()}] ${title} — Status: ${status} ${customerImpact}${created ? ` — Created: ${created}` : ''}`;
}

export function formatMetricSeries(series: any): string {
  const metric = series.metric || series.query_name || 'unknown';
  const scope = series.scope || series.tag_set?.join(', ') || '*';
  const pointlist = series.pointlist || series.points || [];
  const length = pointlist.length;

  if (length === 0) return `📊 ${metric} {${scope}} — No data points`;

  const lastPoint = pointlist[length - 1];
  const lastValue = Array.isArray(lastPoint) ? lastPoint[1] : lastPoint?.value ?? 'N/A';
  const lastTs = Array.isArray(lastPoint)
    ? formatTimestamp(lastPoint[0] / 1000)
    : formatTimestamp(lastPoint?.timestamp || 0);

  return `📊 ${metric} {${scope}} — ${length} points — Latest: ${lastValue} at ${lastTs}`;
}

export function truncateResults<T>(items: T[], maxItems: number): { data: T[]; truncated: boolean; total: number } {
  const total = items.length;
  if (total <= maxItems) {
    return { data: items, truncated: false, total };
  }
  return { data: items.slice(0, maxItems), truncated: true, total };
}
