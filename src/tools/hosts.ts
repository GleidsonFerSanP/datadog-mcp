import { DatadogClient } from '../client/datadog-client.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const hostsTools = [
  {
    name: 'list_hosts',
    description: "List all hosts reporting to Datadog. Returns hostname, up/down status, apps, tags, and metrics. Filter by name or sort by specific fields.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        filter: { type: 'string', description: 'Filter hosts by name (substring match)' },
        sort_field: { type: 'string', description: 'Sort field (e.g., "apps", "cpu", "iowait", "load")' },
        sort_dir: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        count: { type: 'number', description: 'Max hosts to return', default: 100 },
        from: { type: 'number', description: 'Number of seconds since UNIX epoch to filter hosts' },
      },
    },
  },
  {
    name: 'get_host_totals',
    description: "Get the total number of active and up hosts in your Datadog account. Quick overview of infrastructure size.",
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'mute_host',
    description: "Mute a host in Datadog to suppress all monitor notifications for that host. Useful during maintenance.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        hostname: { type: 'string', description: 'Hostname to mute' },
        message: { type: 'string', description: 'Reason for muting' },
        end: { type: 'number', description: 'POSIX timestamp when mute should end' },
        override: { type: 'boolean', description: 'Override existing mute', default: false },
      },
      required: ['hostname'],
    },
  },
  {
    name: 'unmute_host',
    description: "Unmute a host in Datadog to restore monitor notifications for that host.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        hostname: { type: 'string', description: 'Hostname to unmute' },
      },
      required: ['hostname'],
    },
  },
  {
    name: 'search_hosts',
    description: "Search for hosts by name or tag filter. Returns matching hosts with their metadata, apps, and status.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Host search query (name or tag filter)' },
      },
      required: ['query'],
    },
  },
];

export async function handleHostsTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_hosts': {
        const params: Record<string, string> = {};
        if (args.filter) params.filter = args.filter;
        if (args.sort_field) params.sort_field = args.sort_field;
        if (args.sort_dir) params.sort_dir = args.sort_dir;
        if (args.count) params.count = String(args.count);
        if (args.from) params.from = String(args.from);

        const result = await client.get<any>('/api/v1/hosts', params);
        const hosts = result.host_list || [];

        if (hosts.length === 0) return 'No hosts found.';

        const { data, truncated, total } = truncateResults(hosts, args.count || 100);
        const formatted = data.map((h: any) => {
          const name = h.name || 'unknown';
          const up = h.up ? '🟢' : '🔴';
          const apps = (h.apps || []).join(', ') || 'none';
          const cpu = h.metrics?.cpu !== undefined ? `${h.metrics.cpu.toFixed(1)}%` : 'N/A';
          return `  ${up} ${name} — CPU: ${cpu} — Apps: ${apps}`;
        }).join('\n');

        return `Hosts (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_host_totals': {
        const result = await client.get<any>('/api/v1/hosts/totals');
        return `Host Totals:\n  Total Active: ${result.total_active || 0}\n  Total Up: ${result.total_up || 0}`;
      }

      case 'mute_host': {
        const body: any = {};
        if (args.message) body.message = args.message;
        if (args.end) body.end = args.end;
        if (args.override) body.override = args.override;

        await client.post<any>(`/api/v1/host/${args.hostname}/mute`, body);
        return `🔇 Host ${args.hostname} muted.${args.end ? ` Will unmute at ${new Date(args.end * 1000).toISOString()}.` : ''}`;
      }

      case 'unmute_host': {
        await client.post<any>(`/api/v1/host/${args.hostname}/unmute`);
        return `🔔 Host ${args.hostname} unmuted.`;
      }

      case 'search_hosts': {
        const result = await client.get<any>('/api/v1/hosts', { filter: args.query });
        const hosts = result.host_list || [];

        if (hosts.length === 0) return `No hosts found matching: ${args.query}`;

        const formatted = hosts.map((h: any) => {
          const name = h.name || 'unknown';
          const up = h.up ? '🟢' : '🔴';
          const tags = (h.tags_by_source || []).flat().slice(0, 5).join(', ') || 'none';
          return `  ${up} ${name} — Tags: ${tags}`;
        }).join('\n');

        return `Hosts matching "${args.query}" (${hosts.length}):\n${formatted}`;
      }

      default:
        return `Unknown hosts tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
