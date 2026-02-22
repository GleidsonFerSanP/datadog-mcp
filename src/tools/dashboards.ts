import { DatadogClient } from '../client/datadog-client.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const dashboardsTools = [
  {
    name: 'list_dashboards',
    description: "List all Datadog dashboards. Returns dashboard ID, title, description, author, and layout type. Use get_dashboard to see widgets and details.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        filter_shared: { type: 'boolean', description: 'Filter to only shared dashboards' },
        count: { type: 'number', description: 'Maximum number of dashboards to return' },
        start: { type: 'number', description: 'Start index for pagination' },
      },
    },
  },
  {
    name: 'get_dashboard',
    description: "Get a specific Datadog dashboard by ID. Returns full dashboard configuration including all widgets, template variables, and layout.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        dashboard_id: { type: 'string', description: 'The dashboard ID (e.g., "abc-def-ghi")' },
      },
      required: ['dashboard_id'],
    },
  },
  {
    name: 'create_dashboard',
    description: "Create a new Datadog dashboard. Specify title, layout_type (ordered or free), and widgets. For quick observability dashboards, use create_observability_dashboard instead.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Dashboard title' },
        layout_type: { type: 'string', enum: ['ordered', 'free'], description: 'Dashboard layout type', default: 'ordered' },
        widgets: { type: 'array', description: 'Array of widget definitions (JSON)' },
        description: { type: 'string', description: 'Dashboard description' },
        template_variables: { type: 'array', description: 'Template variables for the dashboard' },
      },
      required: ['title', 'layout_type', 'widgets'],
    },
  },
  {
    name: 'update_dashboard',
    description: "Update an existing Datadog dashboard. Provide the dashboard ID and the full updated configuration.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        dashboard_id: { type: 'string', description: 'The dashboard ID to update' },
        title: { type: 'string', description: 'Updated title' },
        layout_type: { type: 'string', enum: ['ordered', 'free'], description: 'Layout type' },
        widgets: { type: 'array', description: 'Updated widget definitions' },
        description: { type: 'string', description: 'Updated description' },
      },
      required: ['dashboard_id', 'title', 'layout_type', 'widgets'],
    },
  },
  {
    name: 'delete_dashboard',
    description: "Delete a Datadog dashboard by ID. This action is irreversible.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        dashboard_id: { type: 'string', description: 'The dashboard ID to delete' },
      },
      required: ['dashboard_id'],
    },
  },
  {
    name: 'create_observability_dashboard',
    description: "Create a pre-configured observability dashboard for a service with metrics, logs, and APM widgets. Saves hours of manual dashboard setup. Automatically includes CPU, memory, error rate, latency, and log stream widgets.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        service_name: { type: 'string', description: 'Name of the service to create dashboard for' },
        environment: { type: 'string', description: 'Environment (e.g., "production", "staging")', default: 'production' },
        include_logs: { type: 'boolean', description: 'Include log stream widget', default: true },
        include_metrics: { type: 'boolean', description: 'Include infrastructure metrics widgets', default: true },
        include_apm: { type: 'boolean', description: 'Include APM/trace widgets', default: true },
      },
      required: ['service_name'],
    },
  },
];

export async function handleDashboardsTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_dashboards': {
        const params: Record<string, string> = {};
        if (args.filter_shared !== undefined) params.filter_shared = String(args.filter_shared);
        if (args.count) params.count = String(args.count);
        if (args.start) params.start = String(args.start);

        const result = await client.get<any>('/api/v1/dashboard', params);
        const dashboards = result.dashboards || [];

        if (dashboards.length === 0) return 'No dashboards found.';

        const { data, truncated, total } = truncateResults(dashboards, 50);
        const formatted = data.map((d: any) => {
          const title = d.title || 'Untitled';
          const id = d.id || 'N/A';
          const author = d.author_handle || 'N/A';
          const layout = d.layout_type || 'N/A';
          return `  📊 ${title} (ID: ${id}) — Layout: ${layout} — Author: ${author}`;
        }).join('\n');

        return `Dashboards (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_dashboard': {
        const result = await client.get<any>(`/api/v1/dashboard/${args.dashboard_id}`);
        const widgets = result.widgets || [];

        return [
          `Dashboard: ${result.title || 'Untitled'}`,
          `  ID: ${result.id}`,
          `  Layout: ${result.layout_type}`,
          `  Description: ${result.description || 'N/A'}`,
          `  Author: ${result.author_handle || 'N/A'}`,
          `  Created: ${result.created_at || 'N/A'}`,
          `  Modified: ${result.modified_at || 'N/A'}`,
          `  Widgets: ${widgets.length}`,
          `  Template Variables: ${(result.template_variables || []).map((tv: any) => tv.name).join(', ') || 'none'}`,
          '',
          `Widget Summary:`,
          ...widgets.slice(0, 20).map((w: any, i: number) => {
            const def = w.definition || {};
            return `    ${i + 1}. ${def.type || 'unknown'}: ${def.title || 'No title'}`;
          }),
        ].join('\n');
      }

      case 'create_dashboard': {
        const body: any = {
          title: args.title,
          layout_type: args.layout_type,
          widgets: args.widgets,
        };
        if (args.description) body.description = args.description;
        if (args.template_variables) body.template_variables = args.template_variables;

        const result = await client.post<any>('/api/v1/dashboard', body);
        return `✅ Dashboard created successfully!\n  Title: ${result.title}\n  ID: ${result.id}\n  URL: ${result.url || 'N/A'}`;
      }

      case 'update_dashboard': {
        const body: any = {
          title: args.title,
          layout_type: args.layout_type,
          widgets: args.widgets,
        };
        if (args.description) body.description = args.description;

        const result = await client.put<any>(`/api/v1/dashboard/${args.dashboard_id}`, body);
        return `✅ Dashboard updated successfully!\n  Title: ${result.title}\n  ID: ${result.id}`;
      }

      case 'delete_dashboard': {
        await client.delete<any>(`/api/v1/dashboard/${args.dashboard_id}`);
        return `✅ Dashboard ${args.dashboard_id} deleted successfully.`;
      }

      case 'create_observability_dashboard': {
        const service = args.service_name;
        const env = args.environment || 'production';
        const widgets: any[] = [];

        // Header widget
        widgets.push({
          definition: {
            type: 'note',
            content: `# ${service} Observability Dashboard\nEnvironment: ${env}`,
            background_color: 'purple',
            font_size: '16',
            text_align: 'center',
            show_tick: false,
            tick_pos: '50%',
            tick_edge: 'bottom',
          },
        });

        if (args.include_metrics !== false) {
          // CPU Timeseries
          widgets.push({
            definition: {
              type: 'timeseries',
              title: `CPU Usage - ${service}`,
              requests: [{
                q: `avg:system.cpu.user{service:${service},env:${env}}`,
                display_type: 'line',
                style: { palette: 'dog_classic' },
              }],
            },
          });

          // Memory Timeseries
          widgets.push({
            definition: {
              type: 'timeseries',
              title: `Memory Usage - ${service}`,
              requests: [{
                q: `avg:system.mem.used{service:${service},env:${env}}`,
                display_type: 'line',
                style: { palette: 'cool' },
              }],
            },
          });
        }

        if (args.include_apm !== false) {
          // Request Rate
          widgets.push({
            definition: {
              type: 'query_value',
              title: `Request Rate - ${service}`,
              requests: [{
                q: `sum:trace.http.request.hits{service:${service},env:${env}}.as_rate()`,
                aggregator: 'avg',
              }],
              autoscale: true,
              precision: 2,
            },
          });

          // Error Rate Timeseries
          widgets.push({
            definition: {
              type: 'timeseries',
              title: `Error Rate - ${service}`,
              requests: [{
                q: `sum:trace.http.request.errors{service:${service},env:${env}}.as_rate() / sum:trace.http.request.hits{service:${service},env:${env}}.as_rate() * 100`,
                display_type: 'bars',
                style: { palette: 'warm' },
              }],
              yaxis: { label: 'Error %' },
            },
          });

          // Latency
          widgets.push({
            definition: {
              type: 'timeseries',
              title: `Latency - ${service}`,
              requests: [
                {
                  q: `avg:trace.http.request.duration{service:${service},env:${env}}`,
                  display_type: 'line',
                  style: { palette: 'dog_classic' },
                },
                {
                  q: `p95:trace.http.request.duration{service:${service},env:${env}}`,
                  display_type: 'line',
                  style: { palette: 'warm' },
                },
              ],
            },
          });
        }

        if (args.include_logs !== false) {
          // Log Stream
          widgets.push({
            definition: {
              type: 'log_stream',
              title: `Logs - ${service}`,
              query: `service:${service}`,
              columns: ['core_host', 'core_service', 'status'],
              show_date_column: true,
              show_message_column: true,
              message_display: 'expanded-md',
              sort: { column: 'time', order: 'desc' },
            },
          });
        }

        const body = {
          title: `${service} Observability - ${env}`,
          description: `Auto-generated observability dashboard for ${service} in ${env}. Includes ${args.include_metrics !== false ? 'infrastructure metrics, ' : ''}${args.include_apm !== false ? 'APM traces, ' : ''}${args.include_logs !== false ? 'log stream' : ''}.`,
          layout_type: 'ordered',
          widgets,
          template_variables: [
            { name: 'env', default: env, prefix: 'env' },
            { name: 'service', default: service, prefix: 'service' },
          ],
        };

        const result = await client.post<any>('/api/v1/dashboard', body);
        return `✅ Observability dashboard created for ${service}!\n  Title: ${result.title}\n  ID: ${result.id}\n  URL: ${result.url || 'N/A'}\n  Widgets: ${widgets.length}`;
      }

      default:
        return `Unknown dashboards tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
