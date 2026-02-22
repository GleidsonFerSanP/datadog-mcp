import { DatadogClient } from '../client/datadog-client.js';
import { formatMonitorStatus, truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const monitorsTools = [
  {
    name: 'list_monitors',
    description: "List all Datadog monitors. Optionally filter by name, tags, or monitor_tags. Returns monitor name, ID, type, status, and query. Use get_triggered_monitors for active alerts.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Filter monitors by name (substring match)' },
        tags: { type: 'string', description: 'Comma-separated list of tags to filter by (e.g., "env:production,team:backend")' },
        monitor_tags: { type: 'string', description: 'Comma-separated monitor tags' },
        group_states: { type: 'string', description: 'Filter by group states (e.g., "alert,warn,no data")' },
      },
    },
  },
  {
    name: 'get_monitor',
    description: "Get detailed information about a specific Datadog monitor by its ID. Returns full configuration, current status, group states, creator, and notification settings.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        monitor_id: { type: 'number', description: 'The monitor ID' },
      },
      required: ['monitor_id'],
    },
  },
  {
    name: 'search_monitors',
    description: "Search Datadog monitors by query string. Supports search by name, tag, type, status. Examples: 'status:alert', 'type:metric', 'env:production'. Returns matching monitors list.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Monitor search query (e.g., "type:metric status:alert")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'create_monitor',
    description: "Create a new Datadog monitor. Supports types: metric alert, log alert, query alert, service check, event-v2 alert, process alert, synthetics alert, trace-analytics alert, composite. Requires name, type, and query.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Monitor name' },
        type: {
          type: 'string',
          enum: ['metric alert', 'log alert', 'query alert', 'service check', 'event-v2 alert', 'process alert', 'synthetics alert', 'trace-analytics alert', 'composite'],
          description: 'Monitor type',
        },
        query: { type: 'string', description: 'Monitor query (e.g., "avg(last_5m):avg:system.cpu.idle{*} < 10")' },
        message: { type: 'string', description: 'Notification message (supports @mentions and markdown)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the monitor' },
        thresholds: {
          type: 'object',
          properties: {
            critical: { type: 'number', description: 'Critical threshold' },
            warning: { type: 'number', description: 'Warning threshold' },
            ok: { type: 'number', description: 'OK threshold' },
          },
          description: 'Monitor thresholds',
        },
      },
      required: ['name', 'type', 'query'],
    },
  },
  {
    name: 'update_monitor',
    description: "Update an existing Datadog monitor. Provide the monitor ID and fields to update (name, query, message, tags, thresholds).",
    inputSchema: {
      type: 'object' as const,
      properties: {
        monitor_id: { type: 'number', description: 'The monitor ID to update' },
        name: { type: 'string', description: 'Updated monitor name' },
        query: { type: 'string', description: 'Updated monitor query' },
        message: { type: 'string', description: 'Updated notification message' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Updated tags' },
        thresholds: {
          type: 'object',
          properties: {
            critical: { type: 'number' },
            warning: { type: 'number' },
            ok: { type: 'number' },
          },
        },
      },
      required: ['monitor_id'],
    },
  },
  {
    name: 'delete_monitor',
    description: "Delete a Datadog monitor by its ID. This action is irreversible. Use with caution.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        monitor_id: { type: 'number', description: 'The monitor ID to delete' },
      },
      required: ['monitor_id'],
    },
  },
  {
    name: 'mute_monitor',
    description: "Mute (silence) a Datadog monitor. Optionally specify a scope and end time. Useful during maintenance windows or known issues.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        monitor_id: { type: 'number', description: 'The monitor ID to mute' },
        scope: { type: 'string', description: 'Scope to mute (e.g., "host:web-01")' },
        end: { type: 'number', description: 'POSIX timestamp for when the mute should end' },
      },
      required: ['monitor_id'],
    },
  },
  {
    name: 'unmute_monitor',
    description: "Unmute a previously muted Datadog monitor. Restores normal alerting behavior.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        monitor_id: { type: 'number', description: 'The monitor ID to unmute' },
      },
      required: ['monitor_id'],
    },
  },
  {
    name: 'get_triggered_monitors',
    description: "Get all monitors currently in alert, warning, or no-data state. This is the BEST starting point for troubleshooting production issues. Returns all active problem monitors.",
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

export async function handleMonitorsTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_monitors': {
        const params: Record<string, string> = {};
        if (args.name) params.name = args.name;
        if (args.tags) params.tags = args.tags;
        if (args.monitor_tags) params.monitor_tags = args.monitor_tags;
        if (args.group_states) params.group_states = args.group_states;

        const result = await client.get<any[]>('/api/v1/monitor', params);
        const monitors = Array.isArray(result) ? result : [];

        if (monitors.length === 0) return 'No monitors found matching the criteria.';

        const { data, truncated, total } = truncateResults(monitors, 50);
        const formatted = data.map((m: any) => formatMonitorStatus(m)).join('\n');
        return `Monitors (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_monitor': {
        const result = await client.get<any>(`/api/v1/monitor/${args.monitor_id}`, { group_states: 'all' });
        return [
          formatMonitorStatus(result),
          `  Message: ${result.message || 'N/A'}`,
          `  Created: ${result.created || 'N/A'}`,
          `  Modified: ${result.modified || 'N/A'}`,
          `  Creator: ${result.creator?.email || result.creator?.handle || 'N/A'}`,
          `  Tags: ${(result.tags || []).join(', ') || 'none'}`,
          `  Options: ${JSON.stringify(result.options?.thresholds || {}, null, 2)}`,
        ].join('\n');
      }

      case 'search_monitors': {
        const result = await client.get<any>('/api/v1/monitor/search', { query: args.query });
        const monitors = result.monitors || [];

        if (monitors.length === 0) return `No monitors found for query: ${args.query}`;

        const formatted = monitors.map((m: any) => formatMonitorStatus(m)).join('\n');
        return `Search results for "${args.query}" (${monitors.length} monitors):\n${formatted}`;
      }

      case 'create_monitor': {
        const body: any = {
          name: args.name,
          type: args.type,
          query: args.query,
        };
        if (args.message) body.message = args.message;
        if (args.tags) body.tags = args.tags;
        if (args.thresholds) body.options = { thresholds: args.thresholds };

        const result = await client.post<any>('/api/v1/monitor', body);
        return `✅ Monitor created successfully!\n${formatMonitorStatus(result)}`;
      }

      case 'update_monitor': {
        const body: any = {};
        if (args.name) body.name = args.name;
        if (args.query) body.query = args.query;
        if (args.message) body.message = args.message;
        if (args.tags) body.tags = args.tags;
        if (args.thresholds) body.options = { thresholds: args.thresholds };

        const result = await client.put<any>(`/api/v1/monitor/${args.monitor_id}`, body);
        return `✅ Monitor updated successfully!\n${formatMonitorStatus(result)}`;
      }

      case 'delete_monitor': {
        await client.delete<any>(`/api/v1/monitor/${args.monitor_id}`);
        return `✅ Monitor ${args.monitor_id} deleted successfully.`;
      }

      case 'mute_monitor': {
        const body: any = {};
        if (args.scope) body.scope = args.scope;
        if (args.end) body.end = args.end;

        await client.post<any>(`/api/v1/monitor/${args.monitor_id}/mute`, body);
        return `🔇 Monitor ${args.monitor_id} muted successfully.${args.end ? ` Will unmute at ${new Date(args.end * 1000).toISOString()}.` : ''}`;
      }

      case 'unmute_monitor': {
        await client.post<any>(`/api/v1/monitor/${args.monitor_id}/unmute`);
        return `🔔 Monitor ${args.monitor_id} unmuted successfully.`;
      }

      case 'get_triggered_monitors': {
        const result = await client.get<any[]>('/api/v1/monitor', {
          group_states: 'alert,warn,no data',
        });
        const monitors = Array.isArray(result) ? result : [];
        const triggered = monitors.filter((m: any) =>
          ['Alert', 'Warn', 'No Data'].includes(m.overall_state),
        );

        if (triggered.length === 0) return '✅ No monitors currently in alert, warning, or no-data state. All systems appear healthy.';

        const formatted = triggered.map((m: any) => formatMonitorStatus(m)).join('\n');
        return `⚠️ Triggered Monitors (${triggered.length}):\n${formatted}`;
      }

      default:
        return `Unknown monitors tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
