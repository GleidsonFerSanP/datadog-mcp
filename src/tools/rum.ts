import { DatadogClient } from '../client/datadog-client.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const rumTools = [
  {
    name: 'search_rum_events',
    description: "Search Datadog Real User Monitoring (RUM) events. Find user sessions, page views, errors, and actions. Examples: 'type:error service:web-app', '@usr.email:user@example.com'.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'RUM event search query' },
        from: { type: 'string', description: 'Start time', default: 'now-1h' },
        to: { type: 'string', description: 'End time', default: 'now' },
        limit: { type: 'number', description: 'Maximum events to return', default: 50 },
        sort: { type: 'string', enum: ['timestamp', '-timestamp'], description: 'Sort order', default: '-timestamp' },
      },
      required: ['query'],
    },
  },
  {
    name: 'aggregate_rum_events',
    description: "Aggregate RUM events for analytics. Compute count, avg, sum, or percentiles grouped by dimensions like page, browser, country. Useful for understanding user experience trends.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'RUM event filter query', default: '*' },
        compute_type: { type: 'string', enum: ['count', 'avg', 'sum', 'cardinality', 'pc75', 'pc90', 'pc95', 'pc99'], description: 'Aggregation type', default: 'count' },
        measure: { type: 'string', description: 'Measure field for numeric aggregations' },
        group_by: { type: 'array', items: { type: 'string' }, description: 'Fields to group by (e.g., ["@view.url", "@browser.name"])' },
        from: { type: 'string', description: 'Start time', default: 'now-1h' },
        to: { type: 'string', description: 'End time', default: 'now' },
      },
      required: ['query'],
    },
  },
];

export async function handleRumTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'search_rum_events': {
        const body = {
          filter: {
            query: args.query,
            from: args.from || 'now-1h',
            to: args.to || 'now',
          },
          sort: args.sort || '-timestamp',
          page: { limit: args.limit || 50 },
        };

        const result = await client.post<any>('/api/v2/rum/events/search', body);
        const events = result.data || [];

        if (events.length === 0) return `No RUM events found for query: ${args.query}`;

        const { data, truncated, total } = truncateResults(events, args.limit || 50);
        const formatted = data.map((e: any) => {
          const attrs = e.attributes || {};
          const type = attrs.type || 'unknown';
          const service = attrs.service || 'N/A';
          const timestamp = attrs.timestamp || '';
          const info = attrs.view?.url || attrs.error?.message || attrs.action?.target?.name || '';
          return `  🌐 [${timestamp}] ${type} — ${service} — ${info}`;
        }).join('\n');

        return `RUM Events (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'aggregate_rum_events': {
        const computeType = args.compute_type || 'count';

        const compute: any = [{ aggregation: computeType, type: 'total' }];
        if (args.measure && computeType !== 'count') {
          compute[0].metric = args.measure;
        }

        const groupBy = (args.group_by || []).map((facet: string) => ({
          facet,
          limit: 10,
          sort: { aggregation: computeType, order: 'desc' as const },
        }));

        const body: any = {
          filter: {
            query: args.query || '*',
            from: args.from || 'now-1h',
            to: args.to || 'now',
          },
          compute,
        };
        if (groupBy.length > 0) body.group_by = groupBy;

        const result = await client.post<any>('/api/v2/rum/analytics/aggregate', body);
        const buckets = result.data?.buckets || [];

        if (buckets.length === 0) return `No RUM aggregation data found for query: ${args.query}`;

        const formatted = buckets.map((bucket: any) => {
          const key = bucket.by ? JSON.stringify(bucket.by) : 'total';
          const value = bucket.computes?.c0?.value ?? 'N/A';
          return `  ${key}: ${value}`;
        }).join('\n');

        return `RUM aggregation (${computeType}):\n${formatted}`;
      }

      default:
        return `Unknown RUM tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
