import { DatadogClient } from '../client/datadog-client.js';
import { formatIncident, truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

const UNSTABLE_HEADER = { 'DD-OPERATION-UNSTABLE': 'true' };

export const incidentsTools = [
  {
    name: 'list_incidents',
    description: "List all Datadog incidents. Shows active and resolved incidents with severity, status, title, and timestamps. Useful for understanding current and past production issues.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        include: { type: 'string', description: 'Comma-separated relationships to include' },
      },
    },
  },
  {
    name: 'get_incident',
    description: "Get detailed information about a specific Datadog incident by ID. Returns full incident details including timeline, severity, status, and impact.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        incident_id: { type: 'string', description: 'The incident ID' },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'create_incident',
    description: "Create a new Datadog incident. Specify title, severity (SEV-1 to SEV-5), and whether customers are impacted. Useful for declaring production issues.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Incident title' },
        severity: { type: 'string', enum: ['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4', 'SEV-5'], description: 'Incident severity' },
        customer_impacted: { type: 'boolean', description: 'Whether customers are affected', default: false },
      },
      required: ['title', 'severity'],
    },
  },
  {
    name: 'update_incident',
    description: "Update an existing Datadog incident. Change title, severity, status, or other fields.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        incident_id: { type: 'string', description: 'The incident ID to update' },
        title: { type: 'string', description: 'Updated title' },
        severity: { type: 'string', enum: ['SEV-1', 'SEV-2', 'SEV-3', 'SEV-4', 'SEV-5'], description: 'Updated severity' },
        status: { type: 'string', enum: ['active', 'stable', 'resolved'], description: 'Updated status' },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'search_incidents',
    description: "Search Datadog incidents by query. Examples: 'state:(active OR stable)', 'severity:SEV-1', 'title:database'. Returns matching incidents.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Incident search query (e.g., "state:active severity:SEV-1")' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_incident_todos',
    description: "List all to-do items for a specific Datadog incident. Shows action items, assignees, and completion status.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        incident_id: { type: 'string', description: 'The incident ID' },
      },
      required: ['incident_id'],
    },
  },
  {
    name: 'create_incident_todo',
    description: "Create a new to-do item for a Datadog incident. Add action items and optionally assign them to team members.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        incident_id: { type: 'string', description: 'The incident ID' },
        content: { type: 'string', description: 'To-do content/description' },
        assignees: { type: 'array', items: { type: 'string' }, description: 'Assignee handles/emails' },
      },
      required: ['incident_id', 'content'],
    },
  },
];

export async function handleIncidentsTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_incidents': {
        const params: Record<string, string> = {};
        if (args.include) params.include = args.include;

        const result = await client.get<any>('/api/v2/incidents', params, UNSTABLE_HEADER);
        const incidents = result.data || [];

        if (incidents.length === 0) return 'No incidents found.';

        const { data, truncated, total } = truncateResults(incidents, 50);
        const formatted = data.map((inc: any) => formatIncident(inc)).join('\n');
        return `Incidents (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_incident': {
        const result = await client.get<any>(`/api/v2/incidents/${args.incident_id}`, undefined, UNSTABLE_HEADER);
        const inc = result.data || {};
        const attrs = inc.attributes || {};

        return [
          formatIncident(inc),
          `  ID: ${inc.id}`,
          `  Commander: ${attrs.commander?.data?.attributes?.name || 'N/A'}`,
          `  Created: ${attrs.created || 'N/A'}`,
          `  Modified: ${attrs.modified || 'N/A'}`,
          `  Resolved: ${attrs.resolved || 'N/A'}`,
          `  Customer Impact: ${attrs.customer_impacted ? 'Yes' : 'No'}`,
          `  Timeline URL: ${attrs.notification_handles?.length ? 'Notifications sent' : 'N/A'}`,
        ].join('\n');
      }

      case 'create_incident': {
        const body = {
          data: {
            type: 'incidents',
            attributes: {
              title: args.title,
              customer_impacted: args.customer_impacted || false,
              fields: {
                severity: {
                  type: 'dropdown',
                  value: args.severity,
                },
              },
            },
          },
        };

        const result = await client.post<any>('/api/v2/incidents', body, UNSTABLE_HEADER);
        const inc = result.data || {};
        return `✅ Incident created!\n${formatIncident(inc)}\n  ID: ${inc.id}`;
      }

      case 'update_incident': {
        const fields: any = {};
        if (args.severity) fields.severity = { type: 'dropdown', value: args.severity };
        if (args.status) fields.state = { type: 'dropdown', value: args.status };

        const body: any = {
          data: {
            type: 'incidents',
            id: args.incident_id,
            attributes: {},
          },
        };
        if (args.title) body.data.attributes.title = args.title;
        if (Object.keys(fields).length > 0) body.data.attributes.fields = fields;

        const result = await client.patch<any>(`/api/v2/incidents/${args.incident_id}`, body, UNSTABLE_HEADER);
        return `✅ Incident ${args.incident_id} updated successfully.\n${formatIncident(result.data || {})}`;
      }

      case 'search_incidents': {
        const result = await client.get<any>('/api/v2/incidents/search', { query: args.query }, UNSTABLE_HEADER);
        const incidents = result.data?.attributes?.incidents || result.data || [];

        if (!Array.isArray(incidents) || incidents.length === 0) return `No incidents found for query: ${args.query}`;

        const formatted = incidents.map((inc: any) => formatIncident(inc)).join('\n');
        return `Incident search results (${incidents.length}):\n${formatted}`;
      }

      case 'list_incident_todos': {
        const result = await client.get<any>(`/api/v2/incidents/${args.incident_id}/relationships/todos`, undefined, UNSTABLE_HEADER);
        const todos = result.data || [];

        if (todos.length === 0) return `No to-dos found for incident ${args.incident_id}.`;

        const formatted = todos.map((todo: any) => {
          const attrs = todo.attributes || {};
          const content = attrs.content || 'No content';
          const completed = attrs.completed ? '✅' : '⬜';
          const assignees = (attrs.assignees || []).map((a: any) => a.handle || a).join(', ');
          return `  ${completed} ${content}${assignees ? ` — Assigned: ${assignees}` : ''}`;
        }).join('\n');

        return `Incident ${args.incident_id} To-Dos (${todos.length}):\n${formatted}`;
      }

      case 'create_incident_todo': {
        const body = {
          data: {
            type: 'incident_todos',
            attributes: {
              content: args.content,
              assignees: args.assignees || [],
            },
          },
        };

        await client.post<any>(`/api/v2/incidents/${args.incident_id}/relationships/todos`, body, UNSTABLE_HEADER);
        return `✅ To-do added to incident ${args.incident_id}: "${args.content}"`;
      }

      default:
        return `Unknown incidents tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
