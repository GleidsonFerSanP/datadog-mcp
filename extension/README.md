# Datadog Observability for GitHub Copilot

[![Version](https://img.shields.io/visual-studio-marketplace/v/GleidsonFerSanP.datadog-observability)](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.datadog-observability)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/GleidsonFerSanP.datadog-observability)](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.datadog-observability)

AI-powered Datadog observability tools — Logs, Metrics, Monitors, Dashboards, APM, Incidents and more directly from GitHub Copilot Chat.

## Features

**65+ Datadog tools** available directly in GitHub Copilot Chat via the Model Context Protocol (MCP).

### Logs (6 tools)
- Search and filter logs with Datadog query syntax
- Aggregate logs for analytics
- Tail recent logs
- Discover log patterns
- List indexes and pipelines

### Metrics (6 tools)
- Query time-series metrics
- Search for metric names
- Get metric metadata
- List active metrics
- Get metric tags
- Query scalar data

### Monitors (9 tools)
- List, create, update, delete monitors
- Search monitors
- Mute/unmute monitors
- **Get triggered monitors** — best starting point for troubleshooting!

### Dashboards (6 tools)
- List, create, update, delete dashboards
- **Auto-generate observability dashboards** for any service

### Events (4 tools)
- List, search, get, and post events

### Incidents (7 tools)
- List, create, update, search incidents
- Manage incident todos

### APM / Traces (4 tools)
- Search trace spans
- Aggregate trace data
- List services from Service Catalog
- **Get service health summary** (request rate, error rate, P50/P95/P99 latency)

### Hosts (5 tools)
- List and search hosts
- Get host totals
- Mute/unmute hosts

### SLOs (5 tools)
- List, get, create, delete SLOs
- Get SLO history and error budget

### Synthetics (5 tools)
- List, get synthetic tests
- Get test results
- Trigger test runs
- Create API tests

### RUM (2 tools)
- Search RUM events
- Aggregate RUM data

### Security (3 tools)
- List, search, get security signals from Cloud SIEM

### Downtimes (4 tools)
- List, get, create, cancel scheduled downtimes

## Quick Start

### 1. Install the Extension

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=GleidsonFerSanP.datadog-observability) or search for "Datadog Observability" in VS Code Extensions.

### 2. Configure Credentials

1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **"Datadog Observability: Configure Datadog Credentials"**
3. Enter your Datadog API Key and Application Key
4. Select your Datadog site

#### Getting API Keys

1. Go to your [Datadog Organization Settings > API Keys](https://app.datadoghq.com/organization-settings/api-keys)
2. Create a new API Key
3. Go to [Application Keys](https://app.datadoghq.com/organization-settings/application-keys)
4. Create a new Application Key

### 3. Use with Copilot Chat

Open GitHub Copilot Chat and ask questions like:

- *"Show me all triggered monitors"*
- *"Search error logs for the payments service in the last hour"*
- *"What's the CPU usage on prod hosts?"*
- *"Create an observability dashboard for the api-gateway service"*
- *"Get the P95 latency for the checkout service"*

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `datadogObservability.site` | `datadoghq.com` | Your Datadog site |
| `datadogObservability.defaultTimeRange` | `1h` | Default time range for queries |
| `datadogObservability.logLevel` | `info` | Log level (error, warn, info, debug) |
| `datadogObservability.autoStart` | `true` | Auto-start MCP server |
| `datadogObservability.maxResults` | `50` | Default maximum results |

## Commands

| Command | Description |
|---------|-------------|
| `Datadog Observability: Configure Datadog Credentials` | Set up API keys |
| `Datadog Observability: Test Datadog Connection` | Verify connectivity |
| `Datadog Observability: Restart Datadog MCP Server` | Restart the server |
| `Datadog Observability: Open Datadog MCP Documentation` | Open docs |

## Troubleshooting

### Credentials Not Working
- Verify your API Key and Application Key are correct
- Ensure you've selected the correct Datadog site
- Check that your keys have the required permissions

### Rate Limiting
The extension automatically retries on HTTP 429 (rate limit) with exponential backoff. If you're still hitting limits, reduce the frequency of queries.

### MCP Server Not Starting
1. Check the Output panel → "Datadog Observability" for errors
2. Run "Restart Datadog MCP Server" command
3. Verify Node.js 18+ is installed

### No Tools Showing in Copilot
- Ensure VS Code 1.85+ with MCP support is installed
- Check that the MCP server started successfully in Output panel
- Reload VS Code window

## Supported Datadog Sites

| Site | Region |
|------|--------|
| `datadoghq.com` | US1 (default) |
| `us3.datadoghq.com` | US3 |
| `us5.datadoghq.com` | US5 |
| `datadoghq.eu` | EU |
| `ap1.datadoghq.com` | AP1 (Japan) |
| `ddog-gov.com` | US Government |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT — [GleidsonFerSanP](https://github.com/GleidsonFerSanP)
