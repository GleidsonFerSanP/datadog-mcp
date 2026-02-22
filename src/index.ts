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
  private client: DatadogClient | null;
  private toolHandlers: Map<string, ToolHandler>;

  constructor() {
    const apiKey = process.env.DD_API_KEY;
    const appKey = process.env.DD_APP_KEY;
    const site = process.env.DD_SITE || 'datadoghq.com';

    if (!apiKey || !appKey) {
      console.error('WARNING: DD_API_KEY and/or DD_APP_KEY environment variables are not set.');
      console.error('The server will start, but tools will not work until credentials are configured.');
      console.error('Use the "Configure Datadog Credentials" command in VS Code to set them.');
      this.client = null;
    } else {
      const credentials: DatadogCredentials = { apiKey, appKey, site };
      this.client = new DatadogClient(credentials);
    }

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

        if (!this.client) {
          return {
            content: [
              {
                type: 'text',
                text: '⚠️ Datadog credentials are not configured. Please set your API Key and Application Key using the "Configure Datadog Credentials" command in VS Code (Cmd+Shift+P / Ctrl+Shift+P → "Configure Datadog Credentials"), then reload the window.',
              },
            ],
            isError: true,
          };
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
