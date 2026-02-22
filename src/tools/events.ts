import { DatadogClient } from '../client/datadog-client.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const eventsTools = [
  {
    name: 'list_events',
    description: "List recent Datadog events. Filter by query, time range, and limit. Events include deployments, alerts, configuration changes, and custom events.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Event query filter (e.g., "sources:nginx", "tags:env:production")' },
        from: { type: 'string', description: 'Start time (ISO 8601 or relative like "now-1h")' },
        to: { type: 'string', description: 'End time' },
        limit: { type: 'number', description: 'Maximum number of events', default: 50 },
      },
    },
  },
  {
    name: 'get_event',
    description: "Get detailed information about a specific Datadog event by its ID.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        event_id: { type: 'string', description: 'The event ID' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'search_events',
    description: "Search Datadog events with advanced query syntax. Supports filtering by source, tags, status, and priority. Returns events sorted by timestamp.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Event search query' },
        from: { type: 'string', description: 'Start time' },
        to: { type: 'string', description: 'End time' },
        sort: { type: 'string', enum: ['timestamp', '-timestamp'], description: 'Sort order', default: '-timestamp' },
        limit: { type: 'number', description: 'Maximum results', default: 50 },
      },
      required: ['query'],
    },
  },
  {
    name: 'post_event',
    description: "Post a custom event to Datadog. Useful for marking deployments, configuration changes, or other notable events for correlation with metrics and logs.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Event title' },
        message: { type: 'string', description: 'Event message body (supports markdown)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Event tags (e.g., ["env:production", "service:api"])' },
        alert_type: { type: 'string', enum: ['error', 'warning', 'info', 'success'], description: 'Event alert type', default: 'info' },
        priority: { type: 'string', enum: ['normal', 'low'], description: 'Event priority', default: 'normal' },
      },
      required: ['title', 'message'],
    },
  },
];

export async function handleEventsTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_events': {
        const params: Record<string, string> = {};
        if (args.query) params['filter[query]'] = args.query;
        if (args.from) params['filter[from]'] = args.from;
        if (args.to) params['filter[to]'] = args.to;
        if (args.limit) params['page[limit]'] = String(args.limit);

        const result = await client.get<any>('/api/v2/events', params);
        const events = result.data || [];

        if (events.length === 0) return 'No events found.';

        const { data, truncated, total } = truncateResults(events, args.limit || 50);
        const formatted = data.map((e: any) => {
          const attrs = e.attributes || {};
          const title = attrs.title || attrs.evt?.title || 'Untitled';
          const timestamp = attrs.timestamp || '';
          const tags = (attrs.tags || []).join(', ');
          return `  📅 [${timestamp}] ${title}${tags ? ` — Tags: ${tags}` : ''}`;
        }).join('\n');

        return `Events (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_event': {
        const result = await client.get<any>(`/api/v2/events/${args.event_id}`);
        const attrs = result.data?.attributes || {};

        return [
          `Event: ${attrs.title || 'Untitled'}`,
          `  ID: ${result.data?.id || args.event_id}`,
          `  Timestamp: ${attrs.timestamp || 'N/A'}`,
          `  Message: ${attrs.message || 'N/A'}`,
          `  Tags: ${(attrs.tags || []).join(', ') || 'none'}`,
          `  Status: ${attrs.status || 'N/A'}`,
        ].join('\n');
      }

      case 'search_events': {
        const body = {
          filter: {
            query: args.query,
            from: args.from || 'now-1h',
            to: args.to || 'now',
          },
          sort: args.sort || '-timestamp',
          page: { limit: args.limit || 50 },
        };

        const result = await client.post<any>('/api/v2/events/search', body);
        const events = result.data || [];

        if (events.length === 0) return `No events found for query: ${args.query}`;

        const formatted = events.map((e: any) => {
          const attrs = e.attributes || {};
          const title = attrs.title || 'Untitled';
          const timestamp = attrs.timestamp || '';
          return `  📅 [${timestamp}] ${title}`;
        }).join('\n');

        return `Event search results (${events.length}):\n${formatted}`;
      }

      case 'post_event': {
        const body = {
          data: {
            type: 'events',
            attributes: {
              title: args.title,
              message: args.message,
              tags: args.tags || [],
              category: args.alert_type || 'info',
              priority: args.priority || 'normal',
            },
          },
        };

        const result = await client.post<any>('/api/v2/events', body);
        return `✅ Event posted successfully!\n  Title: ${args.title}\n  ID: ${result.data?.id || 'N/A'}`;
      }

      default:
        return `Unknown events tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
