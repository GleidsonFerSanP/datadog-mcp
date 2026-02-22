#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { DatadogClient } from './client/datadog-client.js';
import { DatadogCredentials } from './client/auth.js';

import { logsTools, handleLogsTool } from './tools/logs.js';
import { metricsTools, handleMetricsTool } from './tools/metrics.js';
import { monitorsTools, handleMonitorsTool } from './tools/monitors.js';
import { dashboardsTools, handleDashboardsTool } from './tools/dashboards.js';
import { eventsTools, handleEventsTool } from './tools/events.js';
import { incidentsTools, handleIncidentsTool } from './tools/incidents.js';
import { tracesTools, handleTracesTool } from './tools/traces.js';
import { hostsTools, handleHostsTool } from './tools/hosts.js';
import { sloTools, handleSloTool } from './tools/slo.js';
import { syntheticsTools, handleSyntheticsTool } from './tools/synthetics.js';
import { rumTools, handleRumTool } from './tools/rum.js';
import { securityTools, handleSecurityTool } from './tools/security.js';
import { downtimesTools, handleDowntimesTool } from './tools/downtimes.js';

type ToolHandler = (name: string, args: any, client: DatadogClient) => Promise<string>;

class DatadogObservabilityServer {
  private server: Server;
  private client: DatadogClient;
  private toolHandlers: Map<string, ToolHandler>;

  constructor() {
    const apiKey = process.env.DD_API_KEY;
    const appKey = process.env.DD_APP_KEY;
    const site = process.env.DD_SITE || 'datadoghq.com';

    if (!apiKey || !appKey) {
      console.error('ERROR: DD_API_KEY and DD_APP_KEY environment variables are required.');
      console.error('Set them before starting the server:');
      console.error('  export DD_API_KEY=your_api_key');
      console.error('  export DD_APP_KEY=your_application_key');
      process.exit(1);
    }

    const credentials: DatadogCredentials = { apiKey, appKey, site };
    this.client = new DatadogClient(credentials);

    this.server = new Server(
      {
        name: 'datadog-observability-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.toolHandlers = this.buildToolHandlerMap();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private buildToolHandlerMap(): Map<string, ToolHandler> {
    const map = new Map<string, ToolHandler>();

    const register = (tools: Array<{ name: string }>, handler: ToolHandler) => {
      for (const tool of tools) {
        map.set(tool.name, handler);
      }
    };

    register(logsTools, handleLogsTool);
    register(metricsTools, handleMetricsTool);
    register(monitorsTools, handleMonitorsTool);
    register(dashboardsTools, handleDashboardsTool);
    register(eventsTools, handleEventsTool);
    register(incidentsTools, handleIncidentsTool);
    register(tracesTools, handleTracesTool);
    register(hostsTools, handleHostsTool);
    register(sloTools, handleSloTool);
    register(syntheticsTools, handleSyntheticsTool);
    register(rumTools, handleRumTool);
    register(securityTools, handleSecurityTool);
    register(downtimesTools, handleDowntimesTool);

    return map;
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    const allTools = [
      ...logsTools,
      ...metricsTools,
      ...monitorsTools,
      ...dashboardsTools,
      ...eventsTools,
      ...incidentsTools,
      ...tracesTools,
      ...hostsTools,
      ...sloTools,
      ...syntheticsTools,
      ...rumTools,
      ...securityTools,
      ...downtimesTools,
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: allTools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        if (!args) {
          throw new Error('Missing arguments for tool call');
        }

        const handler = this.toolHandlers.get(name);
        if (!handler) {
          throw new Error(`Unknown tool: ${name}. Available tools: ${Array.from(this.toolHandlers.keys()).join(', ')}`);
        }

        const result = await handler(name, args, this.client);

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: errorMessage,
                success: false,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Datadog Observability MCP Server running on stdio');
    console.error(`Tools registered: ${this.toolHandlers.size}`);
  }
}

const server = new DatadogObservabilityServer();
server.run().catch(console.error);
