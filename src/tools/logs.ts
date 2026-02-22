import { DatadogClient } from '../client/datadog-client.js';
import { toUnixSeconds } from '../utils/time-helpers.js';
import { formatLogEntry, truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const logsTools = [
  {
    name: 'search_logs',
    description: "Search and filter Datadog logs using query syntax. Examples: 'service:api status:error', '@http.status_code:>=500', 'host:web-* @duration:>1s'. Returns log entries with timestamp, service, host, status, and message.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Datadog log query string (e.g., "service:web status:error")' },
        from: { type: 'string', description: 'Start time (e.g., "now-1h", "now-15m", or ISO 8601)', default: 'now-1h' },
        to: { type: 'string', description: 'End time (e.g., "now", or ISO 8601)', default: 'now' },
        limit: { type: 'number', description: 'Maximum number of log entries to return', default: 50 },
        sort: { type: 'string', enum: ['timestamp', '-timestamp'], description: 'Sort order by timestamp', default: '-timestamp' },
        indexes: { type: 'array', items: { type: 'string' }, description: 'Log indexes to search', default: ['*'] },
      },
      required: ['query'],
    },
  },
  {
    name: 'aggregate_logs',
    description: "Aggregate Datadog logs by computing count, avg, sum, or cardinality. Useful for understanding log patterns, error rates, and trends over time. Supports group_by for faceted analysis.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Datadog log query string' },
        compute_type: { type: 'string', enum: ['count', 'avg', 'sum', 'cardinality'], description: 'Aggregation type', default: 'count' },
        group_by: { type: 'array', items: { type: 'string' }, description: 'Fields to group by (e.g., ["service", "status"])' },
        measure: { type: 'string', description: 'Metric field for avg/sum computations (e.g., "@duration")' },
        interval: { type: 'string', description: 'Time interval for timeseries buckets (e.g., "5m", "1h")' },
        from: { type: 'string', description: 'Start time', default: 'now-1h' },
        to: { type: 'string', description: 'End time', default: 'now' },
      },
      required: ['query'],
    },
  },
  {
    name: 'tail_logs',
    description: "Get the most recent log entries, similar to 'tail -f'. Filter by service, host, or status. Best for quickly checking what's happening right now in a service or host.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Log query filter', default: '*' },
        service: { type: 'string', description: 'Filter by service name' },
        host: { type: 'string', description: 'Filter by hostname' },
        status: { type: 'string', enum: ['error', 'warn', 'info', 'debug'], description: 'Filter by log status/level' },
        limit: { type: 'number', description: 'Number of recent logs to return', default: 20 },
      },
    },
  },
  {
    name: 'get_log_patterns',
    description: "Identify top log patterns by aggregating logs by status and service. Useful for finding the most common error patterns and their frequency.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Log query filter', default: '*' },
        from: { type: 'string', description: 'Start time', default: 'now-1h' },
        to: { type: 'string', description: 'End time', default: 'now' },
        limit: { type: 'number', description: 'Maximum number of patterns', default: 10 },
      },
    },
  },
  {
    name: 'list_log_indexes',
    description: "List all configured Datadog log indexes. Shows index names, filters, retention, and daily limits. Useful for understanding log routing and storage configuration.",
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'list_log_pipelines',
    description: "List all Datadog log processing pipelines. Shows pipeline names, filters, processors, and enabled status. Useful for understanding how logs are parsed and enriched.",
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

export async function handleLogsTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'search_logs': {
        const from = args.from || 'now-1h';
        const to = args.to || 'now';
        const limit = args.limit || 50;
        const sort = args.sort || '-timestamp';
        const indexes = args.indexes || ['*'];

        const body = {
          filter: {
            query: args.query,
            from: from === 'now' ? new Date().toISOString() : (from.startsWith('now-') ? from : new Date(from).toISOString()),
            to: to === 'now' ? new Date().toISOString() : (to.startsWith('now-') ? to : new Date(to).toISOString()),
            indexes,
          },
          sort,
          page: { limit },
        };

        const result = await client.post<any>('/api/v2/logs/events/search', body);
        const logs = result.data || [];
        const { data, truncated, total } = truncateResults(logs, limit);
        const formatted = data.map((log: any) => formatLogEntry(log)).join('\n');
        const header = `Found ${total} log entries${truncated ? ` (showing first ${data.length})` : ''}:\n`;
        return header + formatted;
      }

      case 'aggregate_logs': {
        const from = args.from || 'now-1h';
        const to = args.to || 'now';
        const computeType = args.compute_type || 'count';

        const compute: any = [{ aggregation: computeType, type: computeType === 'count' ? 'total' : 'total' }];
        if (args.measure && computeType !== 'count') {
          compute[0].metric = args.measure;
        }
        if (args.interval) {
          compute[0].interval = args.interval;
        }

        const groupBy = (args.group_by || []).map((facet: string) => ({
          facet,
          limit: 10,
          sort: { aggregation: computeType, order: 'desc' as const },
        }));

        const body: any = {
          filter: {
            query: args.query || '*',
            from: from === 'now' ? new Date().toISOString() : from,
            to: to === 'now' ? new Date().toISOString() : to,
          },
          compute,
        };
        if (groupBy.length > 0) body.group_by = groupBy;

        const result = await client.post<any>('/api/v2/logs/analytics/aggregate', body);
        const buckets = result.data?.buckets || [];

        if (buckets.length === 0) {
          return `Aggregation result: No data found for query "${args.query}" in the specified time range.`;
        }

        const formatted = buckets.map((bucket: any) => {
          const key = bucket.by ? JSON.stringify(bucket.by) : 'total';
          const value = bucket.computes?.[computeType]?.value ?? bucket.computes?.c0?.value ?? 'N/A';
          return `  ${key}: ${value}`;
        }).join('\n');

        return `Log aggregation (${computeType}) results:\n${formatted}`;
      }

      case 'tail_logs': {
        const parts: string[] = [];
        if (args.query && args.query !== '*') parts.push(args.query);
        if (args.service) parts.push(`service:${args.service}`);
        if (args.host) parts.push(`host:${args.host}`);
        if (args.status) parts.push(`status:${args.status}`);
        const query = parts.length > 0 ? parts.join(' ') : '*';
        const limit = args.limit || 20;

        const body = {
          filter: {
            query,
            from: 'now-15m',
            to: 'now',
            indexes: ['*'],
          },
          sort: '-timestamp',
          page: { limit },
        };

        const result = await client.post<any>('/api/v2/logs/events/search', body);
        const logs = result.data || [];
        if (logs.length === 0) return `No recent logs found for query: ${query}`;

        const formatted = logs.map((log: any) => formatLogEntry(log)).join('\n');
        return `Latest ${logs.length} logs (tail):\n${formatted}`;
      }

      case 'get_log_patterns': {
        const from = args.from || 'now-1h';
        const to = args.to || 'now';

        const body = {
          filter: {
            query: args.query || '*',
            from: from === 'now' ? new Date().toISOString() : from,
            to: to === 'now' ? new Date().toISOString() : to,
          },
          compute: [{ aggregation: 'count', type: 'total' }],
          group_by: [
            { facet: 'status', limit: 10, sort: { aggregation: 'count', order: 'desc' as const } },
            { facet: 'service', limit: 10, sort: { aggregation: 'count', order: 'desc' as const } },
          ],
        };

        const result = await client.post<any>('/api/v2/logs/analytics/aggregate', body);
        const buckets = result.data?.buckets || [];

        if (buckets.length === 0) return 'No log patterns found in the specified time range.';

        const formatted = buckets.slice(0, args.limit || 10).map((bucket: any) => {
          const key = bucket.by ? JSON.stringify(bucket.by) : 'total';
          const count = bucket.computes?.c0?.value ?? 'N/A';
          return `  ${key}: ${count} logs`;
        }).join('\n');

        return `Top log patterns:\n${formatted}`;
      }

      case 'list_log_indexes': {
        const result = await client.get<any>('/api/v1/logs/config/indexes');
        const indexes = result.indexes || result || [];

        if (!Array.isArray(indexes) || indexes.length === 0) return 'No log indexes found.';

        const formatted = indexes.map((idx: any) => {
          const name = idx.name || 'unnamed';
          const retention = idx.num_retention_days || 'N/A';
          const dailyLimit = idx.daily_limit || 'unlimited';
          const filter = idx.filter?.query || '*';
          return `  📁 ${name} — Retention: ${retention}d — Daily Limit: ${dailyLimit} — Filter: ${filter}`;
        }).join('\n');

        return `Log Indexes (${indexes.length}):\n${formatted}`;
      }

      case 'list_log_pipelines': {
        const result = await client.get<any>('/api/v1/logs/config/pipelines');
        const pipelines = Array.isArray(result) ? result : result.pipelines || [];

        if (pipelines.length === 0) return 'No log pipelines found.';

        const formatted = pipelines.map((p: any) => {
          const name = p.name || 'unnamed';
          const enabled = p.is_enabled ? '✅' : '❌';
          const filter = p.filter?.query || '*';
          const processorCount = p.processors?.length || 0;
          return `  ${enabled} ${name} — Filter: ${filter} — Processors: ${processorCount}`;
        }).join('\n');

        return `Log Pipelines (${pipelines.length}):\n${formatted}`;
      }

      default:
        return `Unknown logs tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
