import { DatadogClient } from '../client/datadog-client.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const downtimesTools = [
  {
    name: 'list_downtimes',
    description: "List all scheduled downtimes in Datadog. Shows maintenance windows that suppress monitoring alerts. Use to check what's currently muted.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        current_only: { type: 'boolean', description: 'Return only currently active downtimes', default: false },
      },
    },
  },
  {
    name: 'get_downtime',
    description: "Get details of a specific scheduled downtime by ID. Returns scope, schedule, message, and affected monitors.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        downtime_id: { type: 'string', description: 'The ID of the downtime' },
      },
      required: ['downtime_id'],
    },
  },
  {
    name: 'create_downtime',
    description: "Schedule a new downtime (maintenance window) to suppress monitor alerts. Specify scope (e.g., 'host:web-1' or 'service:api'), duration, and optional message.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        scope: { type: 'string', description: 'Scope to apply downtime to (e.g., "host:web-1", "service:api", "env:staging")' },
        message: { type: 'string', description: 'Message to include with the downtime notification' },
        monitor_identifier: {
          type: 'object',
          properties: {
            monitor_id: { type: 'number', description: 'Specific monitor ID to mute' },
            monitor_tags: { type: 'array', items: { type: 'string' }, description: 'Monitor tags to match' },
          },
          description: 'Identifier for monitors to mute (by ID or tags)',
        },
        start: { type: 'string', description: 'ISO8601 start time (default: now)' },
        end: { type: 'string', description: 'ISO8601 end time' },
        notify_end_states: { type: 'array', items: { type: 'string', enum: ['alert', 'warn', 'no data'] }, description: 'States to notify on end' },
        notify_end_types: { type: 'array', items: { type: 'string', enum: ['canceled', 'expired'] }, description: 'End types to notify on' },
      },
      required: ['scope'],
    },
  },
  {
    name: 'cancel_downtime',
    description: "Cancel an active scheduled downtime by ID. This will re-enable alerts for the affected scope and monitors.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        downtime_id: { type: 'string', description: 'The ID of the downtime to cancel' },
      },
      required: ['downtime_id'],
    },
  },
];

export async function handleDowntimesTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_downtimes': {
        const params: Record<string, string> = {};
        if (args.current_only) params['current_only'] = 'true';

        const result = await client.get<any>('/api/v2/downtime', params);
        const downtimes = result.data || [];

        if (downtimes.length === 0) return 'No scheduled downtimes found.';

        const { data, truncated, total } = truncateResults(downtimes, 50);
        const formatted = data.map((d: any) => {
          const attrs = d.attributes || {};
          const scope = attrs.scope || 'N/A';
          const status = attrs.status || 'unknown';
          const message = attrs.message || '';
          const start = attrs.schedule?.start || 'N/A';
          const end = attrs.schedule?.end || 'indefinite';
          const statusEmoji = status === 'active' ? '🔇' : status === 'scheduled' ? '⏰' : '✅';
          return `  ${statusEmoji} ID: ${d.id} — Scope: ${scope} — Status: ${status}\n     Start: ${start} | End: ${end}${message ? ` | ${message}` : ''}`;
        }).join('\n');

        return `Downtimes (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_downtime': {
        const result = await client.get<any>(`/api/v2/downtime/${args.downtime_id}`);
        const d = result.data || result;
        const attrs = d.attributes || {};

        const lines = [
          `🔇 Downtime: ${d.id}`,
          `  Status: ${attrs.status || 'N/A'}`,
          `  Scope: ${attrs.scope || 'N/A'}`,
          `  Message: ${attrs.message || 'N/A'}`,
          `  Created: ${attrs.created || 'N/A'}`,
          `  Modified: ${attrs.modified || 'N/A'}`,
        ];

        if (attrs.schedule) {
          lines.push(`  Schedule Start: ${attrs.schedule.start || 'N/A'}`);
          lines.push(`  Schedule End: ${attrs.schedule.end || 'indefinite'}`);
          if (attrs.schedule.recurrences) {
            lines.push(`  Recurrence: ${JSON.stringify(attrs.schedule.recurrences)}`);
          }
        }

        if (attrs.monitor_identifier) {
          lines.push(`  Monitor Identifier: ${JSON.stringify(attrs.monitor_identifier)}`);
        }

        return lines.join('\n');
      }

      case 'create_downtime': {
        const scheduleData: any = {};
        if (args.start) scheduleData.start = args.start;
        if (args.end) scheduleData.end = args.end;

        const body: any = {
          data: {
            type: 'downtime',
            attributes: {
              scope: args.scope,
              schedule: Object.keys(scheduleData).length > 0 ? scheduleData : undefined,
              message: args.message,
            },
          },
        };

        if (args.monitor_identifier) {
          body.data.attributes.monitor_identifier = args.monitor_identifier;
        }
        if (args.notify_end_states) {
          body.data.attributes.notify_end_states = args.notify_end_states;
        }
        if (args.notify_end_types) {
          body.data.attributes.notify_end_types = args.notify_end_types;
        }

        const result = await client.post<any>('/api/v2/downtime', body);
        const dt = result.data || result;

        return `✅ Downtime created successfully!\n  ID: ${dt.id}\n  Scope: ${args.scope}\n  Message: ${args.message || 'N/A'}`;
      }

      case 'cancel_downtime': {
        await client.delete(`/api/v2/downtime/${args.downtime_id}`);
        return `✅ Downtime ${args.downtime_id} has been cancelled. Alerts will resume for the affected scope.`;
      }

      default:
        return `Unknown downtimes tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
