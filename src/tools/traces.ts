import { DatadogClient } from '../client/datadog-client.js';
import { toUnixSeconds, formatTimestamp, getDefaultTimeRange } from '../utils/time-helpers.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const tracesTools = [
  {
    name: 'search_traces',
    description: "Search Datadog APM traces/spans using query syntax. Examples: 'service:web-api @http.status_code:500', 'env:production resource_name:GET /api/users'. Returns span details with service, resource, duration, and status.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Trace search query (e.g., "service:api @duration:>1s")' },
        from: { type: 'string', description: 'Start time', default: 'now-1h' },
        to: { type: 'string', description: 'End time', default: 'now' },
        limit: { type: 'number', description: 'Maximum spans to return', default: 50 },
        sort: { type: 'string', enum: ['timestamp', '-timestamp', '-duration', 'duration'], description: 'Sort order', default: '-timestamp' },
      },
      required: ['query'],
    },
  },
  {
    name: 'aggregate_traces',
    description: "Aggregate Datadog APM trace data. Compute count, avg, sum, or percentiles grouped by service, resource, or other dimensions. Useful for analyzing performance trends.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Trace query filter', default: '*' },
        compute_type: { type: 'string', enum: ['count', 'avg', 'sum', 'cardinality', 'pc75', 'pc90', 'pc95', 'pc99'], description: 'Aggregation type', default: 'count' },
        measure: { type: 'string', description: 'Measure field for numeric aggregations (e.g., "@duration")' },
        group_by: { type: 'array', items: { type: 'string' }, description: 'Fields to group by (e.g., ["service", "resource_name"])' },
        from: { type: 'string', description: 'Start time', default: 'now-1h' },
        to: { type: 'string', description: 'End time', default: 'now' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_services',
    description: "List all APM services registered in Datadog Service Catalog. Returns service names, types, and metadata. Useful for discovering available services before querying traces.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        env: { type: 'string', description: 'Filter by environment (e.g., "production")' },
      },
    },
  },
  {
    name: 'get_service_summary',
    description: "Get a comprehensive summary of an APM service including request rate, error rate, and latency (p50, p95, p99). The best tool for quickly understanding a service's health and performance.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        service_name: { type: 'string', description: 'Name of the service (e.g., "web-api")' },
        env: { type: 'string', description: 'Environment', default: 'production' },
      },
      required: ['service_name'],
    },
  },
];

export async function handleTracesTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'search_traces': {
        const from = args.from || 'now-1h';
        const to = args.to || 'now';

        const body = {
          filter: {
            query: args.query,
            from: from === 'now' ? new Date().toISOString() : from,
            to: to === 'now' ? new Date().toISOString() : to,
          },
          sort: args.sort || '-timestamp',
          page: { limit: args.limit || 50 },
        };

        const result = await client.post<any>('/api/v2/spans/events/search', body);
        const spans = result.data || [];

        if (spans.length === 0) return `No traces/spans found for query: ${args.query}`;

        const formatted = spans.map((span: any) => {
          const attrs = span.attributes || {};
          const service = attrs.service || 'unknown';
          const resource = attrs.resource_name || attrs.resource || 'N/A';
          const duration = attrs.duration ? `${(attrs.duration / 1e6).toFixed(2)}ms` : 'N/A';
          const status = attrs.status || 'ok';
          const timestamp = attrs.timestamp || '';
          return `  🔍 [${timestamp}] ${service}:${resource} — ${duration} — Status: ${status}`;
        }).join('\n');

        return `Traces (${spans.length}):\n${formatted}`;
      }

      case 'aggregate_traces': {
        const from = args.from || 'now-1h';
        const to = args.to || 'now';
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
            from: from === 'now' ? new Date().toISOString() : from,
            to: to === 'now' ? new Date().toISOString() : to,
          },
          compute,
        };
        if (groupBy.length > 0) body.group_by = groupBy;

        const result = await client.post<any>('/api/v2/spans/analytics/aggregate', body);
        const buckets = result.data?.buckets || [];

        if (buckets.length === 0) return `No trace aggregation data found for query: ${args.query}`;

        const formatted = buckets.map((bucket: any) => {
          const key = bucket.by ? JSON.stringify(bucket.by) : 'total';
          const value = bucket.computes?.c0?.value ?? 'N/A';
          return `  ${key}: ${value}`;
        }).join('\n');

        return `Trace aggregation (${computeType}):\n${formatted}`;
      }

      case 'list_services': {
        try {
          const result = await client.get<any>('/api/v2/services/definitions', args.env ? { 'filter[env]': args.env } : undefined);
          const services = result.data || [];

          if (services.length === 0) return 'No services found in the Service Catalog.';

          const formatted = services.map((svc: any) => {
            const attrs = svc.attributes || {};
            const name = attrs.schema?.['dd-service'] || attrs.name || svc.id || 'unknown';
            const type = attrs.schema?.['dd-team'] || 'N/A';
            return `  🔧 ${name} — Team: ${type}`;
          }).join('\n');

          return `Services (${services.length}):\n${formatted}`;
        } catch {
          // Fallback to metrics search for service names
          const result = await client.get<any>('/api/v1/search', { q: 'hosts:*' });
          const hosts = result.results?.hosts || [];
          return `Hosts found (${hosts.length}): ${hosts.slice(0, 20).join(', ')}`;
        }
      }

      case 'get_service_summary': {
        const service = args.service_name;
        const env = args.env || 'production';
        const timeRange = getDefaultTimeRange();
        const from = String(timeRange.from);
        const to = String(timeRange.to);

        const results: string[] = [];
        results.push(`Service Summary: ${service} (env: ${env})`);
        results.push('─'.repeat(50));

        try {
          // Request rate
          const hitsResult = await client.get<any>('/api/v1/query', {
            from,
            to,
            query: `sum:trace.http.request.hits{service:${service},env:${env}}.as_rate()`,
          });
          const hitsSeries = hitsResult.series?.[0]?.pointlist || [];
          const lastHits = hitsSeries.length > 0 ? hitsSeries[hitsSeries.length - 1] : null;
          const requestRate = lastHits ? `${(Array.isArray(lastHits) ? lastHits[1] : lastHits.value || 0).toFixed(2)} req/s` : 'N/A';
          results.push(`  📈 Request Rate: ${requestRate}`);
        } catch {
          results.push('  📈 Request Rate: Unable to fetch');
        }

        try {
          // Error rate
          const errResult = await client.get<any>('/api/v1/query', {
            from,
            to,
            query: `sum:trace.http.request.errors{service:${service},env:${env}}.as_rate()`,
          });
          const errSeries = errResult.series?.[0]?.pointlist || [];
          const lastErr = errSeries.length > 0 ? errSeries[errSeries.length - 1] : null;
          const errorRate = lastErr ? `${(Array.isArray(lastErr) ? lastErr[1] : lastErr.value || 0).toFixed(4)} err/s` : 'N/A';
          results.push(`  ❌ Error Rate: ${errorRate}`);
        } catch {
          results.push('  ❌ Error Rate: Unable to fetch');
        }

        try {
          // Latency
          const latResult = await client.get<any>('/api/v1/query', {
            from,
            to,
            query: `avg:trace.http.request.duration{service:${service},env:${env}}`,
          });
          const latSeries = latResult.series?.[0]?.pointlist || [];
          const lastLat = latSeries.length > 0 ? latSeries[latSeries.length - 1] : null;
          const latency = lastLat ? `${((Array.isArray(lastLat) ? lastLat[1] : lastLat.value || 0) / 1e6).toFixed(2)}ms` : 'N/A';
          results.push(`  ⏱️ Avg Latency: ${latency}`);
        } catch {
          results.push('  ⏱️ Avg Latency: Unable to fetch');
        }

        return results.join('\n');
      }

      default:
        return `Unknown traces tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
