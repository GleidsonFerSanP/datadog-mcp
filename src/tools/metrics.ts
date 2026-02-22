import { DatadogClient } from '../client/datadog-client.js';
import { toUnixSeconds, formatTimestamp, getDefaultTimeRange } from '../utils/time-helpers.js';
import { formatMetricSeries, truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const metricsTools = [
  {
    name: 'query_metrics',
    description: "Query Datadog timeseries metric data. Use Datadog metric query syntax, e.g., 'avg:system.cpu.idle{*}', 'sum:trace.servlet.request.hits{service:web}.as_rate()'. Returns metric data points with timestamps.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Datadog metric query (e.g., "avg:system.cpu.idle{*}")' },
        from: { type: 'string', description: 'Start time as unix seconds or relative (e.g., "now-1h")' },
        to: { type: 'string', description: 'End time as unix seconds or relative (e.g., "now")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_metrics',
    description: "Search for Datadog metric names matching a query pattern. Examples: 'system.cpu', 'trace.servlet', 'aws.ec2'. Returns a list of matching metric names.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query for metric names (e.g., "system.cpu")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_metric_metadata',
    description: "Get metadata for a specific Datadog metric including type, unit, description, and integration. Useful for understanding what a metric measures and its data type.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        metric_name: { type: 'string', description: 'Full metric name (e.g., "system.cpu.idle")' },
      },
      required: ['metric_name'],
    },
  },
  {
    name: 'list_active_metrics',
    description: "List all actively reporting metrics from a given point in time. Optionally filter by host or tag. Useful for discovering available metrics.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        from: { type: 'number', description: 'Unix timestamp in seconds to list metrics from' },
        host: { type: 'string', description: 'Filter metrics by hostname' },
        tag_filter: { type: 'string', description: 'Filter metrics by tag (e.g., "env:production")' },
      },
      required: ['from'],
    },
  },
  {
    name: 'get_metric_tags',
    description: "Get all tags associated with a specific metric. Useful for understanding available dimensions for filtering and grouping.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        metric_name: { type: 'string', description: 'Full metric name (e.g., "system.cpu.idle")' },
      },
      required: ['metric_name'],
    },
  },
  {
    name: 'query_scalar_data',
    description: "Query scalar (single-value) metric data. Useful for getting current values, comparisons, or point-in-time measurements like current CPU usage or request rate.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        queries: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Metric query' },
              data_source: { type: 'string', description: 'Data source (e.g., "metrics")', default: 'metrics' },
              aggregator: { type: 'string', description: 'Aggregator (e.g., "avg", "sum", "max", "min")', default: 'avg' },
            },
            required: ['query'],
          },
          description: 'Array of scalar queries',
        },
        from: { type: 'number', description: 'Start time as unix timestamp in milliseconds' },
        to: { type: 'number', description: 'End time as unix timestamp in milliseconds' },
      },
      required: ['queries'],
    },
  },
];

export async function handleMetricsTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'query_metrics': {
        const timeRange = getDefaultTimeRange();
        const from = args.from ? String(toUnixSeconds(args.from)) : String(timeRange.from);
        const to = args.to ? String(toUnixSeconds(args.to)) : String(timeRange.to);

        const result = await client.get<any>('/api/v1/query', {
          from,
          to,
          query: args.query,
        });

        const series = result.series || [];
        if (series.length === 0) return `No metric data found for query: ${args.query}`;

        const formatted = series.map((s: any) => formatMetricSeries(s)).join('\n');
        return `Metric query results for "${args.query}":\n${formatted}`;
      }

      case 'search_metrics': {
        const result = await client.get<any>('/api/v1/search', {
          q: `metrics:${args.query}`,
        });

        const metrics = result.results?.metrics || [];
        if (metrics.length === 0) return `No metrics found matching: ${args.query}`;

        const { data, truncated, total } = truncateResults(metrics, 100);
        const formatted = data.map((m: unknown) => `  📊 ${String(m)}`).join('\n');
        return `Found ${total} metrics matching "${args.query}"${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_metric_metadata': {
        const result = await client.get<any>(`/api/v1/metrics/${args.metric_name}`);

        return [
          `Metric: ${args.metric_name}`,
          `  Type: ${result.type || 'N/A'}`,
          `  Unit: ${result.unit || 'N/A'}`,
          `  Per Unit: ${result.per_unit || 'N/A'}`,
          `  Description: ${result.description || 'N/A'}`,
          `  Integration: ${result.integration || 'N/A'}`,
          `  Short Name: ${result.short_name || 'N/A'}`,
        ].join('\n');
      }

      case 'list_active_metrics': {
        const params: Record<string, string> = {
          from: String(args.from),
        };
        if (args.host) params.host = args.host;
        if (args.tag_filter) params.tag_filter = args.tag_filter;

        const result = await client.get<any>('/api/v1/metrics', params);
        const metrics = result.metrics || [];

        if (metrics.length === 0) return 'No active metrics found for the specified criteria.';

        const { data, truncated, total } = truncateResults(metrics, 100);
        const formatted = data.map((m: unknown) => `  📊 ${String(m)}`).join('\n');
        return `Active metrics (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_metric_tags': {
        const result = await client.get<any>(`/api/v2/metrics/${args.metric_name}/all-tags`);
        const tags = result.data?.attributes?.tags || [];

        if (tags.length === 0) return `No tags found for metric: ${args.metric_name}`;

        const formatted = tags.map((t: string) => `  🏷️ ${t}`).join('\n');
        return `Tags for ${args.metric_name} (${tags.length}):\n${formatted}`;
      }

      case 'query_scalar_data': {
        const timeRange = getDefaultTimeRange();
        const from = args.from || timeRange.from * 1000;
        const to = args.to || timeRange.to * 1000;

        const formulas = args.queries.map((q: any, i: number) => ({
          formula: `query${i}`,
        }));

        const queries = args.queries.map((q: any, i: number) => ({
          query: q.query,
          data_source: q.data_source || 'metrics',
          name: `query${i}`,
          aggregator: q.aggregator || 'avg',
        }));

        const body = {
          data: {
            type: 'scalar_request',
            attributes: {
              formulas,
              queries,
              from: from,
              to: to,
            },
          },
        };

        const result = await client.post<any>('/api/v2/query/scalar', body);
        const data = result.data || {};
        const values = data.attributes?.columns || [];

        if (values.length === 0) return 'No scalar data returned.';

        const formatted = values.map((col: any) => {
          const name = col.name || 'query';
          const val = col.values?.[0] ?? 'N/A';
          return `  ${name}: ${val}`;
        }).join('\n');

        return `Scalar query results:\n${formatted}`;
      }

      default:
        return `Unknown metrics tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
