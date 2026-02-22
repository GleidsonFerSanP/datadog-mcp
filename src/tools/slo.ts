import { DatadogClient } from '../client/datadog-client.js';
import { toUnixSeconds, getDefaultTimeRange } from '../utils/time-helpers.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const sloTools = [
  {
    name: 'list_slos',
    description: "List all Datadog Service Level Objectives (SLOs). Returns SLO name, type, target, and current status. Useful for understanding reliability commitments.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        ids: { type: 'string', description: 'Comma-separated SLO IDs to filter' },
        query: { type: 'string', description: 'Search query to filter SLOs' },
        tags_query: { type: 'string', description: 'Filter by tags (e.g., "env:production")' },
      },
    },
  },
  {
    name: 'get_slo',
    description: "Get detailed information about a specific SLO by ID. Returns configuration, target, current status, error budget, and groups.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        slo_id: { type: 'string', description: 'The SLO ID' },
      },
      required: ['slo_id'],
    },
  },
  {
    name: 'get_slo_history',
    description: "Get the historical SLI (Service Level Indicator) data for an SLO. Shows uptime/compliance over a time period and error budget consumption.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        slo_id: { type: 'string', description: 'The SLO ID' },
        from: { type: 'number', description: 'Start time as unix timestamp in seconds' },
        to: { type: 'number', description: 'End time as unix timestamp in seconds' },
      },
      required: ['slo_id', 'from', 'to'],
    },
  },
  {
    name: 'create_slo',
    description: "Create a new Datadog SLO. Supports metric-based and monitor-based SLOs. Specify thresholds, time windows, and target percentages.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'SLO name' },
        type: { type: 'string', enum: ['metric', 'monitor'], description: 'SLO type' },
        description: { type: 'string', description: 'SLO description' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the SLO' },
        thresholds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              timeframe: { type: 'string', enum: ['7d', '30d', '90d'], description: 'Time window' },
              target: { type: 'number', description: 'Target percentage (e.g., 99.9)' },
              warning: { type: 'number', description: 'Warning threshold (e.g., 99.95)' },
            },
            required: ['timeframe', 'target'],
          },
          description: 'SLO thresholds for different time windows',
        },
        query: {
          type: 'object',
          properties: {
            numerator: { type: 'string', description: 'Good events query (for metric SLO)' },
            denominator: { type: 'string', description: 'Total events query (for metric SLO)' },
          },
          description: 'Query for metric-based SLO',
        },
        monitor_ids: { type: 'array', items: { type: 'number' }, description: 'Monitor IDs (for monitor-based SLO)' },
      },
      required: ['name', 'type', 'thresholds'],
    },
  },
  {
    name: 'delete_slo',
    description: "Delete a Datadog SLO by ID. This action is irreversible.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        slo_id: { type: 'string', description: 'The SLO ID to delete' },
      },
      required: ['slo_id'],
    },
  },
];

export async function handleSloTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_slos': {
        const params: Record<string, string> = {};
        if (args.ids) params.ids = args.ids;
        if (args.query) params.query = args.query;
        if (args.tags_query) params.tags_query = args.tags_query;

        const result = await client.get<any>('/api/v1/slo', params);
        const slos = result.data || [];

        if (slos.length === 0) return 'No SLOs found.';

        const { data, truncated, total } = truncateResults(slos, 50);
        const formatted = data.map((slo: any) => {
          const name = slo.name || 'Unnamed';
          const type = slo.type || 'N/A';
          const target = slo.thresholds?.[0]?.target || 'N/A';
          const status = slo.overall_status?.[0]?.status ?? 'N/A';
          return `  🎯 ${name} (ID: ${slo.id}) — Type: ${type} — Target: ${target}% — Status: ${status}`;
        }).join('\n');

        return `SLOs (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_slo': {
        const result = await client.get<any>(`/api/v1/slo/${args.slo_id}`);
        const slo = result.data || {};

        const thresholds = (slo.thresholds || []).map((t: any) =>
          `    ${t.timeframe}: ${t.target}% (warning: ${t.warning || 'N/A'}%)`
        ).join('\n');

        return [
          `SLO: ${slo.name || 'Unnamed'}`,
          `  ID: ${slo.id}`,
          `  Type: ${slo.type}`,
          `  Description: ${slo.description || 'N/A'}`,
          `  Tags: ${(slo.tags || []).join(', ') || 'none'}`,
          `  Creator: ${slo.creator?.email || 'N/A'}`,
          `  Thresholds:`,
          thresholds,
        ].join('\n');
      }

      case 'get_slo_history': {
        const result = await client.get<any>(`/api/v1/slo/${args.slo_id}/history`, {
          from_ts: String(args.from),
          to_ts: String(args.to),
        });

        const data = result.data || {};
        const overall = data.overall || {};
        const sliValue = overall.sli_value !== undefined ? `${overall.sli_value.toFixed(4)}%` : 'N/A';
        const errorBudgetRemaining = data.error_budget_remaining !== undefined
          ? `${JSON.stringify(data.error_budget_remaining)}`
          : 'N/A';

        return [
          `SLO History (${args.slo_id}):`,
          `  SLI Value: ${sliValue}`,
          `  Span Precision: ${overall.span_precision || 'N/A'}`,
          `  Error Budget Remaining: ${errorBudgetRemaining}`,
        ].join('\n');
      }

      case 'create_slo': {
        const body: any = {
          name: args.name,
          type: args.type,
          thresholds: args.thresholds,
        };
        if (args.description) body.description = args.description;
        if (args.tags) body.tags = args.tags;
        if (args.query) body.query = args.query;
        if (args.monitor_ids) body.monitor_ids = args.monitor_ids;

        const result = await client.post<any>('/api/v1/slo', body);
        const slo = result.data?.[0] || result.data || {};
        return `✅ SLO created!\n  Name: ${slo.name}\n  ID: ${slo.id}\n  Type: ${slo.type}`;
      }

      case 'delete_slo': {
        await client.delete<any>(`/api/v1/slo/${args.slo_id}`);
        return `✅ SLO ${args.slo_id} deleted successfully.`;
      }

      default:
        return `Unknown SLO tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
