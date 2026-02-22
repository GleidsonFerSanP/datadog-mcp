# Datadog Observability MCP

VS Code Extension + MCP Server that integrates Datadog with GitHub Copilot Chat via the Model Context Protocol. Provides 65+ monitoring and observability tools for AI assistants.

## Architecture

```
datadog-mcp/
├── src/                          # MCP Server (TypeScript, ESM)
│   ├── index.ts                  # Server entry point
│   ├── client/                   # Datadog HTTP client
│   │   ├── auth.ts               # Credentials & validation
│   │   └── datadog-client.ts     # HTTP client with retry
│   ├── tools/                    # Tool implementations (13 modules)
│   │   ├── logs.ts               # 6 log tools
│   │   ├── metrics.ts            # 6 metric tools
│   │   ├── monitors.ts           # 9 monitor tools
│   │   ├── dashboards.ts         # 6 dashboard tools
│   │   ├── events.ts             # 4 event tools
│   │   ├── incidents.ts          # 7 incident tools
│   │   ├── traces.ts             # 4 APM trace tools
│   │   ├── hosts.ts              # 5 host tools
│   │   ├── slo.ts                # 5 SLO tools
│   │   ├── synthetics.ts         # 5 synthetic test tools
│   │   ├── rum.ts                # 2 RUM tools
│   │   ├── security.ts           # 3 security tools
│   │   └── downtimes.ts          # 4 downtime tools
│   └── utils/                    # Shared utilities
│       ├── error-handler.ts
│       ├── formatters.ts
│       └── time-helpers.ts
├── extension/                    # VS Code Extension
│   ├── src/extension.ts          # Extension activation
│   ├── resources/instructions/   # Copilot Chat instructions
│   └── package.json              # Extension manifest
├── package.json                  # Server package
└── tsconfig.json                 # TypeScript config
```

## Development

### Prerequisites

* Node.js 18+
* npm

### Build

```bash
# Install dependencies
npm install
cd extension && npm install && cd ..

# Build MCP server
npm run build

# Build extension
cd extension && npm run compile

# Copy server to extension
npm run copy-to-extension
```

### Run MCP Server standalone

```bash
export DD_API_KEY=your_api_key
export DD_APP_KEY=your_app_key
export DD_SITE=datadoghq.com  # optional, default

npm start
```

### Package Extension

```bash
cd extension
npm run package
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DD_API_KEY` | Yes | — | Datadog API Key |
| `DD_APP_KEY` | Yes | — | Datadog Application Key |
| `DD_SITE` | No | `datadoghq.com` | Datadog site |
| `DD_MAX_RESULTS` | No | `50` | Default max results |
| `DD_LOG_LEVEL` | No | `info` | Log level |

## Publishing

See [BUILD_PUBLISH_GUIDE.md](BUILD_PUBLISH_GUIDE.md) for full instructions.

## License

MIT — GleidsonFerSanP
