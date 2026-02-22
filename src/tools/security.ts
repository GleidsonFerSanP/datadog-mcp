import { DatadogClient } from '../client/datadog-client.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const securityTools = [
  {
    name: 'list_security_signals',
    description: "List recent security signals from Datadog Cloud SIEM. Returns threat detections, anomalies, and compliance violations across your infrastructure.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Security signal filter query', default: '*' },
        from: { type: 'string', description: 'Start time', default: 'now-1h' },
        to: { type: 'string', description: 'End time', default: 'now' },
        limit: { type: 'number', description: 'Maximum signals to return', default: 50 },
        sort: { type: 'string', enum: ['timestamp', '-timestamp'], description: 'Sort order', default: '-timestamp' },
      },
    },
  },
  {
    name: 'search_security_signals',
    description: "Search and filter Datadog security signals with advanced queries. Examples: 'status:high source:cloudtrail', 'rule.name:*brute*force*'. Use to investigate security incidents.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Security signal search query' },
        from: { type: 'string', description: 'Start time', default: 'now-1h' },
        to: { type: 'string', description: 'End time', default: 'now' },
        limit: { type: 'number', description: 'Maximum signals to return', default: 50 },
        sort: { type: 'string', enum: ['timestamp', '-timestamp'], description: 'Sort order', default: '-timestamp' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_security_signal',
    description: "Get detailed information about a specific security signal by its ID. Returns full signal attributes, rule information, and triage data.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        signal_id: { type: 'string', description: 'The ID of the security signal' },
      },
      required: ['signal_id'],
    },
  },
];

export async function handleSecurityTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_security_signals': {
        const params: Record<string, string> = {};
        if (args.query && args.query !== '*') params['filter[query]'] = args.query;
        if (args.from) params['filter[from]'] = args.from;
        if (args.to) params['filter[to]'] = args.to;
        if (args.limit) params['page[limit]'] = String(args.limit);
        if (args.sort) params.sort = args.sort;

        const result = await client.get<any>('/api/v2/security_monitoring/signals', params);
        const signals = result.data || [];

        if (signals.length === 0) return 'No security signals found.';

        const { data, truncated, total } = truncateResults(signals, args.limit || 50);
        const formatted = data.map((s: any) => {
          const attrs = s.attributes || {};
          const severity = attrs.severity || 'unknown';
          const title = attrs.title || attrs.message || 'Untitled signal';
          const timestamp = attrs.timestamp || '';
          const status = attrs.status || 'unknown';
          const severityEmoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢';
          return `  ${severityEmoji} [${timestamp}] [${severity.toUpperCase()}] ${title} — Status: ${status}`;
        }).join('\n');

        return `Security Signals (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'search_security_signals': {
        const body = {
          filter: {
            query: args.query,
            from: args.from || 'now-1h',
            to: args.to || 'now',
          },
          sort: args.sort || '-timestamp',
          page: { limit: args.limit || 50 },
        };

        const result = await client.post<any>('/api/v2/security_monitoring/signals/search', body);
        const signals = result.data || [];

        if (signals.length === 0) return `No security signals found for query: ${args.query}`;

        const { data, truncated, total } = truncateResults(signals, args.limit || 50);
        const formatted = data.map((s: any) => {
          const attrs = s.attributes || {};
          const severity = attrs.severity || 'unknown';
          const title = attrs.title || attrs.message || 'Untitled signal';
          const timestamp = attrs.timestamp || '';
          const status = attrs.status || 'unknown';
          const severityEmoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢';
          return `  ${severityEmoji} [${timestamp}] [${severity.toUpperCase()}] ${title} — Status: ${status}`;
        }).join('\n');

        return `Security Signals (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_security_signal': {
        const result = await client.get<any>(`/api/v2/security_monitoring/signals/${args.signal_id}`);
        const signal = result.data || result;
        const attrs = signal.attributes || {};

        const lines = [
          `🔒 Security Signal: ${attrs.title || 'N/A'}`,
          `  ID: ${signal.id || args.signal_id}`,
          `  Severity: ${(attrs.severity || 'N/A').toUpperCase()}`,
          `  Status: ${attrs.status || 'N/A'}`,
          `  Timestamp: ${attrs.timestamp || 'N/A'}`,
          `  Message: ${attrs.message || 'N/A'}`,
        ];

        if (attrs.tags && attrs.tags.length > 0) {
          lines.push(`  Tags: ${attrs.tags.join(', ')}`);
        }
        if (attrs.attributes?.rule?.name) {
          lines.push(`  Rule: ${attrs.attributes.rule.name}`);
        }

        return lines.join('\n');
      }

      default:
        return `Unknown security tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
