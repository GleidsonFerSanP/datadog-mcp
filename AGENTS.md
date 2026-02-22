# AGENTS.md — Orchestration Prompt for Multi-Agent Implementation

> **Objetivo**: Este arquivo é o prompt-mestre que um orquestrador multi-agent deve usar para delegar a implementação completa do projeto `datadog-mcp` a sub-agents paralelos e colaborativos.
>
> **Como usar**: Copie o conteúdo da seção "MASTER PROMPT" e forneça como instrução inicial ao seu sistema multi-agent (Copilot Workspace, Devin, OpenHands, Cursor Composer, ou qualquer orquestrador que suporte sub-agents).

---

## MASTER PROMPT

```
Você é o ORQUESTRADOR de um projeto de implementação completa. Seu trabalho é delegar TASKS
para sub-agents que trabalharão em paralelo. Você NÃO implementa código — você coordena.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJETO: datadog-mcp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VS Code Extension + MCP Server que integra o Datadog ao GitHub Copilot Chat via
Model Context Protocol. Provê ~68 ferramentas de observabilidade (logs, metrics,
monitors, dashboards, events, incidents, APM traces, hosts, SLOs, synthetics,
RUM, security, downtimes).

REPOSITÓRIO: /Users/gleidsonfersanp/workspace/AI/datadog-mcp
REFERÊNCIA: O projeto /Users/gleidsonfersanp/workspace/AI/pdf-utilities-mcp segue
a MESMA arquitetura e deve ser usado como referência de padrões, estrutura e estilo.
PLANO COMPLETO: Leia IMPLEMENTATION_PLAN.md neste repositório para TODOS os detalhes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS DO ORQUESTRADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Leia IMPLEMENTATION_PLAN.md INTEIRO antes de delegar qualquer task.
2. Respeite o grafo de dependências — não lance tasks que dependem de tasks incompletas.
3. Maximize paralelismo — lance todas as tasks independentes simultaneamente.
4. Cada sub-agent recebe UM prompt auto-contido com tudo que precisa para trabalhar.
5. Quando um sub-agent terminar, valide o resultado antes de marcar como concluído.
6. Se um sub-agent falhar, forneça contexto do erro e re-delegate.
7. Ao final, execute o build completo para garantir que tudo compila.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASES DE EXECUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

═══ FASE 1 — Scaffolding (1 agent, bloqueante) ═══
Delegate TASK_1 e aguarde conclusão antes de prosseguir.

═══ FASE 2 — Core Client (1 agent, bloqueante) ═══
Delegate TASK_2 e aguarde conclusão antes de prosseguir.

═══ FASE 3 — Features em Paralelo (até 8 agents simultâneos) ═══
Delegate TODAS as tasks abaixo SIMULTANEAMENTE:
  - TASK_3 (Logs)
  - TASK_4 (Metrics)
  - TASK_5 (Monitors)
  - TASK_6 (Dashboards + Events)
  - TASK_7 (Incidents + APM/Traces)
  - TASK_8 (Hosts, SLOs, Synthetics, RUM, Security, Downtimes)
  - TASK_11 (Ícone)
  - TASK_12 (Docs + Instructions)
Aguarde TODAS completarem antes de prosseguir.

═══ FASE 4 — Integração (1 agent, bloqueante) ═══
Delegate TASK_9 e aguarde. Este agent deve importar e registrar TODAS as tools.

═══ FASE 5 — Extension (1 agent, bloqueante) ═══
Delegate TASK_10 e aguarde.

═══ FASE 6 — Build & QA (1 agent, final) ═══
Delegate TASK_13 para validar build, corrigir erros, e preparar para publicação.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPTS DOS SUB-AGENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## TASK_1 — Scaffolding e Configuração Base

```
ROLE: Você é um engenheiro de setup de projetos TypeScript/Node.js.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp
REFERENCE: Use /Users/gleidsonfersanp/workspace/AI/pdf-utilities-mcp como referência de
estrutura e padrões.

MISSÃO: Criar toda a estrutura base do projeto. Nenhum outro agent pode trabalhar até
você terminar.

TAREFAS:

1. Crie TODAS as pastas necessárias:
   - src/client/
   - src/tools/
   - src/utils/
   - extension/src/
   - extension/resources/instructions/
   - extension/webview/
   - extension/dist/
   - extension/mcp-server/

2. Crie o arquivo `package.json` na RAIZ com:
   {
     "name": "datadog-observability-mcp",
     "version": "1.0.0",
     "description": "MCP Server for Datadog Observability - Provides 65+ monitoring and observability tools for AI assistants via Model Context Protocol",
     "type": "module",
     "main": "dist/index.js",
     "bin": { "datadog-observability-mcp": "./dist/index.js" },
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch",
       "start": "node dist/index.js",
       "copy-to-extension": "mkdir -p extension/mcp-server && cp -r dist/* extension/mcp-server/ && cp -r node_modules extension/mcp-server/"
     },
     "keywords": ["mcp", "model-context-protocol", "datadog", "observability", "monitoring",
       "logs", "metrics", "apm", "traces", "dashboards", "incidents", "ai-assistant",
       "github-copilot"],
     "author": "GleidsonFerSanP",
     "license": "MIT",
     "dependencies": {
       "@modelcontextprotocol/sdk": "^1.0.0"
     },
     "devDependencies": {
       "@types/node": "^20.0.0",
       "typescript": "^5.3.0"
     }
   }

3. Crie `tsconfig.json` na RAIZ:
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "declaration": true,
       "declarationMap": true,
       "sourceMap": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist", "extension"]
   }

4. Crie `extension/package.json` com:
   - name: "datadog-observability"
   - displayName: "Datadog Observability for GitHub Copilot"
   - description: "AI-powered Datadog observability tools — Logs, Metrics, Monitors, Dashboards, APM, Incidents and more directly from GitHub Copilot Chat"
   - version: "1.0.0"
   - publisher: "GleidsonFerSanP"
   - icon: "icon.png"
   - engines.vscode: "^1.85.0"
   - categories: ["AI", "Other", "Visualization"]
   - keywords: ["datadog", "observability", "monitoring", "logs", "metrics", "apm",
     "traces", "dashboards", "incidents", "mcp", "copilot", "model context protocol"]
   - activationEvents: ["onStartupFinished"]
   - main: "./dist/extension.js"
   - contributes:
     - mcpServerDefinitionProviders: [{ id: "datadog-observability", label: "Datadog Observability" }]
     - chatInstructions: [{ name: "DatadogObservabilityGuidelines", description: "...",
       path: "resources/instructions/datadog.instructions.md" }]
     - commands:
       - datadogObservability.configure — "Configure Datadog Credentials"
       - datadogObservability.testConnection — "Test Datadog Connection"
       - datadogObservability.restart — "Restart Datadog MCP Server"
       - datadogObservability.viewDocs — "Open Datadog MCP Documentation"
     - configuration com title "Datadog Observability" e properties:
       - datadogObservability.site (enum: datadoghq.com, us3.datadoghq.com,
         us5.datadoghq.com, datadoghq.eu, ap1.datadoghq.com, ddog-gov.com) default "datadoghq.com"
       - datadogObservability.defaultTimeRange (enum: 15m, 1h, 4h, 1d, 7d) default "1h"
       - datadogObservability.logLevel (enum: error, warn, info, debug) default "info"
       - datadogObservability.autoStart (boolean) default true
       - datadogObservability.maxResults (number) default 50
   - scripts:
     - vscode:prepublish: "npm run compile && npm run copy-server"
     - compile: "tsc -p ./"
     - watch: "tsc -watch -p ./"
     - copy-server: "cd .. && npm run build && npm run copy-to-extension"
     - package: "vsce package"
     - publish: "vsce publish"
   - devDependencies: @types/node, @types/vscode ^1.85.0, @vscode/vsce, typescript ^5.3.0
   - dependencies: @modelcontextprotocol/sdk ^1.0.0
   - repository: https://github.com/GleidsonFerSanP/datadog-mcp.git
   - license: MIT

5. Crie `extension/tsconfig.json` (veja referência em pdf-utilities-mcp/extension/tsconfig.json)

6. Crie `.gitignore`:
   node_modules/
   dist/
   *.vsix
   .env
   extension/mcp-server/
   extension/dist/
   extension/node_modules/
   .DS_Store

7. Crie `LICENSE` (MIT, copyright GleidsonFerSanP 2025-2026)

8. Execute: cd /Users/gleidsonfersanp/workspace/AI/datadog-mcp && npm install
9. Execute: cd extension && npm install

CRITÉRIO DE SUCESSO: Todos os arquivos existem, npm install roda sem erros em ambas as pastas.
```

---

## TASK_2 — Datadog HTTP Client + Auth + Utils

```
ROLE: Você é um engenheiro backend TypeScript especializado em API clients.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp
CONTEXT: TASK_1 já foi concluída. A estrutura base do projeto existe.

MISSÃO: Implementar o client HTTP base para a API do Datadog e os utilities compartilhados.
Todos os agents de TASKS 3-8 dependem do seu trabalho.

TAREFAS:

1. Crie `src/client/auth.ts`:
   - export interface DatadogCredentials { apiKey: string; appKey: string; site: string; }
   - export function getBaseUrl(site: string): string
     Mapeamento:
       "datadoghq.com" → "https://api.datadoghq.com"
       "datadoghq.eu"  → "https://api.datadoghq.eu"
       "us3.datadoghq.com" → "https://api.us3.datadoghq.com"
       "us5.datadoghq.com" → "https://api.us5.datadoghq.com"
       "ap1.datadoghq.com" → "https://api.ap1.datadoghq.com"
       "ddog-gov.com" → "https://api.ddog-gov.com"
       default → "https://api.datadoghq.com"
   - export async function validateCredentials(credentials: DatadogCredentials): Promise<boolean>
     Chama GET {baseUrl}/api/v1/validate com headers DD-API-KEY e DD-APPLICATION-KEY

2. Crie `src/client/datadog-client.ts`:
   - export class DatadogClient
   - Constructor: recebe DatadogCredentials, armazena, calcula baseUrl
   - Método privado: buildHeaders() → { 'DD-API-KEY', 'DD-APPLICATION-KEY', 'Content-Type': 'application/json' }
   - Método público: async get<T>(path: string, params?: Record<string, string>): Promise<T>
     - Usa fetch nativo (Node 18+)
     - Monta URL com query params
     - Implementa retry em 429 com exponential backoff (max 3 retries)
     - Throws DatadogAPIError em erros
   - Método público: async post<T>(path: string, body?: unknown): Promise<T>
   - Método público: async put<T>(path: string, body?: unknown): Promise<T>
   - Método público: async delete<T>(path: string, params?: Record<string, string>): Promise<T>
   - Timeout de 30s por request
   - Log de requests em stderr (para não poluir stdout/MCP)

3. Crie `src/utils/error-handler.ts`:
   - export class DatadogAPIError extends Error
     - statusCode: number
     - endpoint: string
     - constructor(message, statusCode, endpoint)
   - export function handleAPIError(error: unknown, endpoint: string): never
     - Trata status 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden),
       404 (Not Found), 429 (Rate Limited), 500/503 (Server Error)
     - Mensagens claras e acionáveis para o AI interpretar

4. Crie `src/utils/time-helpers.ts`:
   - export function parseTimeRange(input: string): { from: number; to: number }
     Suporta: "15m", "30m", "1h", "4h", "1d", "7d", "30d"
     Também suporta: "now-1h", "now-30m"
     Retorna Unix timestamps em segundos
   - export function toUnixSeconds(date: Date | string): number
   - export function toISO8601(date: Date | number): string
   - export function getDefaultTimeRange(): { from: number; to: number }
     Retorna últimos 60 minutos
   - export function formatTimestamp(ts: number): string
     Retorna formato legível "2024-01-15 14:30:00 UTC"

5. Crie `src/utils/formatters.ts`:
   - export function formatLogEntry(log: any): string
     Formato: "[TIMESTAMP] [STATUS] [SERVICE] MESSAGE" (truncado em 500 chars)
   - export function formatMonitorStatus(monitor: any): string
     Formato: "[STATUS_EMOJI] NAME (ID: X) — Type: Y — Query: Z"
   - export function formatIncident(incident: any): string
   - export function formatMetricSeries(series: any): string
   - export function truncateResults<T>(items: T[], maxItems: number): { data: T[]; truncated: boolean; total: number }

CRITÉRIO DE SUCESSO:
- Todos os arquivos compilam sem erros (npx tsc --noEmit)
- O DatadogClient pode ser instanciado e os métodos HTTP estão implementados
- O error handler cobre todos os status codes da API
- O time helper parseia corretamente "1h" → timestamps de 1 hora atrás até agora
```

---

## TASK_3 — Tools: Logs

```
ROLE: Você é um engenheiro TypeScript. Implemente MCP tools para a API de Logs do Datadog.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp
CONTEXT: TASK_2 já completou. Você tem acesso a:
  - src/client/datadog-client.ts (classe DatadogClient com get/post/put/delete)
  - src/utils/time-helpers.ts (parseTimeRange, getDefaultTimeRange)
  - src/utils/formatters.ts (formatLogEntry, truncateResults)
  - src/utils/error-handler.ts (DatadogAPIError, handleAPIError)

MISSÃO: Crie src/tools/logs.ts com todas as ferramentas de logs.

O ARQUIVO DEVE EXPORTAR:
- export const logsTools: Array de tool definitions (name, description, inputSchema)
- export async function handleLogsTool(name: string, args: any, client: DatadogClient): Promise<string>

TOOLS A IMPLEMENTAR:

1. search_logs
   - Params: query (string, required), from (string, default "now-1h"), to (string, default "now"),
     limit (number, default 50), sort (enum: "timestamp"/"-timestamp", default "-timestamp"),
     indexes (string[], default ["*"])
   - API: POST /api/v2/logs/events/search
   - Body: { filter: { query, from, to, indexes }, sort, page: { limit } }
   - Response: Formata cada log com formatLogEntry, retorna lista

2. aggregate_logs
   - Params: query (string), compute_type (enum: "count"/"avg"/"sum"/"cardinality"),
     group_by (string[]), measure (string, optional), interval (string, optional),
     from (string), to (string)
   - API: POST /api/v2/logs/analytics/aggregate
   - Body: { filter: { query, from, to }, compute: [{ aggregation, type, interval?, metric? }],
     group_by: [{ facet, limit, sort } ...] }
   - Response: Formata buckets de aggregation

3. tail_logs
   - Params: query (string, default "*"), service (string, optional), host (string, optional),
     status (enum: "error"/"warn"/"info"/"debug", optional), limit (number, default 20)
   - Implementação: Monta query combinando params, chama search_logs com sort="-timestamp"
   - Response: Últimos N logs formatados como tail

4. get_log_patterns
   - Params: query (string, default "*"), from (string), to (string), limit (number, default 10)
   - Implementação: Usa aggregate_logs com group_by ["@message"] ou ["status","service"]
     e compute count
   - Response: Top patterns de erro com contagens

5. list_log_indexes
   - API: GET /api/v1/logs/config/indexes
   - Response: Lista de indexes disponíveis

6. list_log_pipelines
   - API: GET /api/v1/logs/config/pipelines
   - Response: Lista de pipelines de processamento

FORMATO DAS DESCRIPTIONS (importante para o Copilot entender quando usar):
- search_logs: "Search and filter Datadog logs using query syntax. Examples: 'service:api status:error', '@http.status_code:>=500', 'host:web-* @duration:>1s'. Returns log entries with timestamp, service, host, status, and message."
- (Siga esse padrão rico para todas as tools)

PADRÃO DE CÓDIGO: Veja como pdf-utilities-mcp/src/index.ts registra tools e crie
exports compatíveis para serem consumidos pelo index.ts principal.

CRITÉRIO DE SUCESSO: O arquivo compila, exporta logsTools e handleLogsTool corretamente.
```

---

## TASK_4 — Tools: Metrics

```
ROLE: Você é um engenheiro TypeScript. Implemente MCP tools para a API de Metrics do Datadog.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp
CONTEXT: Mesmo contexto da TASK_3 (TASK_2 concluída, acesso ao DatadogClient e utils).

MISSÃO: Crie src/tools/metrics.ts

EXPORTAR:
- export const metricsTools: Array de tool definitions
- export async function handleMetricsTool(name: string, args: any, client: DatadogClient): Promise<string>

TOOLS (6):

1. query_metrics
   - Params: query (string, required, ex: "avg:system.cpu.idle{*}"), from (number|string),
     to (number|string)
   - API: GET /api/v1/query?from={from}&to={to}&query={query}
   - Response: Series de pontos formatados com timestamps legíveis

2. search_metrics
   - Params: query (string, ex: "system.cpu")
   - API: GET /api/v1/search?q=metrics:{query}
   - Response: Lista de nomes de métricas

3. get_metric_metadata
   - Params: metric_name (string, required)
   - API: GET /api/v1/metrics/{metric_name}
   - Response: type, unit, description, integration, per_unit

4. list_active_metrics
   - Params: from (number, required — unix seconds), host (string?), tag_filter (string?)
   - API: GET /api/v1/metrics
   - Response: Lista de nomes de métricas ativas

5. get_metric_assets
   - Params: metric_name (string)
   - API: GET /api/v2/metrics/{metric_name}/all-tags
   - Response: Tags e informações da métrica

6. query_scalar_data
   - Params: queries (array de { query: string, data_source: string, aggregator: string }),
     from (number), to (number)
   - API: POST /api/v2/query/scalar
   - Response: Valores escalares formatados

CRITÉRIO DE SUCESSO: Compila, exports corretos.
```

---

## TASK_5 — Tools: Monitors

```
ROLE: Engenheiro TypeScript. MCP tools para Monitors do Datadog.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp

MISSÃO: Crie src/tools/monitors.ts

EXPORTAR:
- export const monitorsTools: Array de tool definitions
- export async function handleMonitorsTool(name: string, args: any, client: DatadogClient): Promise<string>

TOOLS (9):

1. list_monitors — GET /api/v1/monitor (params: name?, tags?, monitor_tags?, group_states?)
2. get_monitor — GET /api/v1/monitor/{monitor_id}?group_states=all
3. search_monitors — GET /api/v1/monitor/search?query={query}
4. create_monitor — POST /api/v1/monitor (body: name, type, query, message, tags, options.thresholds)
   Types: "metric alert", "log alert", "query alert", "service check", "event-v2 alert",
   "process alert", "synthetics alert", "trace-analytics alert", "composite"
5. update_monitor — PUT /api/v1/monitor/{monitor_id}
6. delete_monitor — DELETE /api/v1/monitor/{monitor_id}
7. mute_monitor — POST /api/v1/monitor/{monitor_id}/mute (params: scope?, end?)
8. unmute_monitor — POST /api/v1/monitor/{monitor_id}/unmute
9. get_triggered_monitors — GET /api/v1/monitor?group_states=alert,warn,no%20data
   (Descrição: "Get all monitors currently in alert, warning, or no-data state.
   This is the BEST starting point for troubleshooting production issues.")

Use formatMonitorStatus dos formatters para todas as respostas.

CRITÉRIO DE SUCESSO: Compila, exports corretos, 9 tools definidas.
```

---

## TASK_6 — Tools: Dashboards + Events

```
ROLE: Engenheiro TypeScript. MCP tools para Dashboards e Events do Datadog.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp

MISSÃO: Crie src/tools/dashboards.ts e src/tools/events.ts

═══ dashboards.ts ═══
EXPORTAR: dashboardsTools, handleDashboardsTool

TOOLS (6):
1. list_dashboards — GET /api/v1/dashboard (filter_shared?, count?, start?)
2. get_dashboard — GET /api/v1/dashboard/{dashboard_id}
3. create_dashboard — POST /api/v1/dashboard (title, layout_type, widgets, description?, template_variables?)
4. update_dashboard — PUT /api/v1/dashboard/{dashboard_id}
5. delete_dashboard — DELETE /api/v1/dashboard/{dashboard_id}
6. create_observability_dashboard — HIGH LEVEL TOOL
   Params: service_name (string), environment (string, default "production"),
   include_logs (bool, true), include_metrics (bool, true), include_apm (bool, true)
   Implementação: Gera JSON de dashboard com widgets pré-configurados:
     - Timeseries de CPU, Memory, Disk IO para o service
     - Log stream filtrado por service
     - APM error rate e latency se include_apm=true
     - Query value widgets para request rate e error count
   Chama POST /api/v1/dashboard internamente
   Descrição: "Create a pre-configured observability dashboard for a service with
   metrics, logs, and APM widgets. Saves hours of manual dashboard setup."

═══ events.ts ═══
EXPORTAR: eventsTools, handleEventsTool

TOOLS (4):
1. list_events — GET /api/v2/events (filter[query]?, filter[from]?, filter[to]?, page[limit]?)
2. get_event — GET /api/v2/events/{event_id}
3. search_events — POST /api/v2/events/search (filter, sort, page)
4. post_event — POST /api/v2/events (data.attributes: title, message, tags, category)

CRITÉRIO DE SUCESSO: Compila, exports corretos, 10 tools total.
```

---

## TASK_7 — Tools: Incidents + APM/Traces

```
ROLE: Engenheiro TypeScript. MCP tools para Incidents e APM Traces do Datadog.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp

MISSÃO: Crie src/tools/incidents.ts e src/tools/traces.ts

═══ incidents.ts ═══
EXPORTAR: incidentsTools, handleIncidentsTool

TOOLS (7):
1. list_incidents — GET /api/v2/incidents
2. get_incident — GET /api/v2/incidents/{incident_id}
3. create_incident — POST /api/v2/incidents
   Body: { data: { type: "incidents", attributes: { title, customer_impacted, fields: {
     severity: { type: "dropdown", value: severity } } } } }
4. update_incident — PATCH /api/v2/incidents/{incident_id}
5. search_incidents — GET /api/v2/incidents/search?query={query}
6. list_incident_todos — GET /api/v2/incidents/{incident_id}/relationships/todos
7. create_incident_todo — POST /api/v2/incidents/{incident_id}/relationships/todos
   Body: { data: { type: "incident_todos", attributes: { content, assignees? } } }

NOTA: Todos os endpoints de Incidents são unstable. Adicione header no client:
"DD-OPERATION-UNSTABLE": "true" ou configure como operação unstable.
Na prática, passe o header no request ou documente que o user precisa ter acesso.

═══ traces.ts ═══
EXPORTAR: tracesTools, handleTracesTool

TOOLS (4):
1. search_traces — POST /api/v2/spans/events/search
   Params: query, from, to, limit, sort
   Body: { filter: { query, from, to }, sort, page: { limit } }
2. aggregate_traces — POST /api/v2/spans/analytics/aggregate
3. list_services — Usa query de métricas APM: GET /api/v1/search?q=hosts:*
   OU GET /api/v2/services/definitions (Service Catalog)
4. get_service_summary — HIGH LEVEL TOOL
   Params: service_name, env (default "production")
   Implementação: Faz 3 queries de métricas em paralelo:
     - trace.{service_name}.hits{env} → request rate
     - trace.{service_name}.errors{env} / trace.{service_name}.hits{env} → error rate
     - trace.{service_name}.duration{env} → latency p50/p95/p99
   Combina resultados em resumo:
     "Service: X | Requests: Y/s | Error Rate: Z% | P50: Ams | P95: Bms | P99: Cms"

CRITÉRIO DE SUCESSO: Compila, exports corretos, 11 tools total.
```

---

## TASK_8 — Tools: Hosts, SLOs, Synthetics, RUM, Security, Downtimes

```
ROLE: Engenheiro TypeScript. MCP tools para múltiplas APIs do Datadog.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp

MISSÃO: Crie 6 arquivos de tools com escopo menor mas cobrindo todas as APIs restantes.

═══ src/tools/hosts.ts ═══
EXPORTAR: hostsTools, handleHostsTool
TOOLS (5):
1. list_hosts — GET /api/v1/hosts (filter?, sort_field?, sort_dir?, count?, from?)
2. get_host_totals — GET /api/v1/hosts/totals
3. mute_host — POST /api/v1/host/{hostname}/mute (message?, end?, override?)
4. unmute_host — POST /api/v1/host/{hostname}/unmute
5. search_hosts — GET /api/v1/hosts?filter={query}

═══ src/tools/slo.ts ═══
EXPORTAR: sloTools, handleSloTool
TOOLS (5):
1. list_slos — GET /api/v1/slo (ids?, query?, tags_query?)
2. get_slo — GET /api/v1/slo/{slo_id}
3. get_slo_history — GET /api/v1/slo/{slo_id}/history?from_ts={from}&to_ts={to}
4. create_slo — POST /api/v1/slo (name, type, description, tags, thresholds, query/monitor_ids/groups)
5. delete_slo — DELETE /api/v1/slo/{slo_id}

═══ src/tools/synthetics.ts ═══
EXPORTAR: syntheticsTools, handleSyntheticsTool
TOOLS (5):
1. list_synthetics_tests — GET /api/v1/synthetics/tests
2. get_synthetics_test — GET /api/v1/synthetics/tests/{public_id}
3. get_synthetics_results — GET /api/v1/synthetics/tests/{public_id}/results
4. trigger_synthetics_test — POST /api/v1/synthetics/tests/trigger (body: tests: [{public_id}])
5. create_api_test — POST /api/v1/synthetics/tests/api
   Params: name, type ("api"), subtype ("http"), request (url, method, headers?),
   assertions, locations, options, message, tags

═══ src/tools/rum.ts ═══
EXPORTAR: rumTools, handleRumTool
TOOLS (2):
1. search_rum_events — POST /api/v2/rum/events/search (filter, sort, page)
2. aggregate_rum_events — POST /api/v2/rum/analytics/aggregate (compute, filter, group_by)

═══ src/tools/security.ts ═══
EXPORTAR: securityTools, handleSecurityTool
TOOLS (3):
1. list_security_signals — GET /api/v2/security_monitoring/signals
2. search_security_signals — POST /api/v2/security_monitoring/signals/search
3. get_security_signal — GET /api/v2/security_monitoring/signals/{signal_id}

═══ src/tools/downtimes.ts ═══
EXPORTAR: downtimesTools, handleDowntimesTool
TOOLS (4):
1. list_downtimes — GET /api/v2/downtime
2. get_downtime — GET /api/v2/downtime/{downtime_id}
3. create_downtime — POST /api/v2/downtime (scope, monitor_identifier, schedule, message)
4. cancel_downtime — DELETE /api/v2/downtime/{downtime_id}

CRITÉRIO DE SUCESSO: Todos os 6 arquivos compilam. Total: 24 tools.
```

---

## TASK_9 — MCP Server Entry Point

```
ROLE: Engenheiro de integração TypeScript. Crie o ponto de entrada do MCP Server.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp
CONTEXT: TASKS 3-8 estão concluídas. Todos os arquivos em src/tools/ existem com exports.

MISSÃO: Crie src/index.ts que registra TODAS as ~68 tools no MCP server.

REFERÊNCIA: Siga EXATAMENTE o padrão de /Users/gleidsonfersanp/workspace/AI/pdf-utilities-mcp/src/index.ts

IMPLEMENTAÇÃO:

1. Adicione shebang: #!/usr/bin/env node

2. Importe:
   - Server, StdioServerTransport do @modelcontextprotocol/sdk
   - CallToolRequestSchema, ListToolsRequestSchema do @modelcontextprotocol/sdk/types
   - DatadogClient de ./client/datadog-client
   - DatadogCredentials de ./client/auth
   - Todos os *Tools e handle*Tool de ./tools/*

3. Classe DatadogObservabilityServer:
   - private server: Server
   - private client: DatadogClient

   - constructor():
     - Lê env vars: DD_API_KEY, DD_APP_KEY, DD_SITE (default "datadoghq.com")
     - Se DD_API_KEY/DD_APP_KEY não existem, lança erro claro
     - Instancia DatadogClient com as credentials
     - Instancia Server com name "datadog-observability-mcp", version "1.0.0"
     - capabilities: { tools: {} }
     - Chama setupHandlers() e setupErrorHandling()

   - setupHandlers():
     - ListToolsRequestSchema handler: retorna array UNIFICADO de todas as tools
       [...logsTools, ...metricsTools, ...monitorsTools, ...dashboardsTools,
        ...eventsTools, ...incidentsTools, ...tracesTools, ...hostsTools,
        ...sloTools, ...syntheticsTools, ...rumTools, ...securityTools, ...downtimesTools]
     - CallToolRequestSchema handler: switch/if-else por nome da tool → dispatch
       para o handler correto. Use um Map<string, handler> para eficiência.
       Cada handler retorna { content: [{ type: "text", text: resultado }] }
       Wrap em try/catch para erros amigáveis.

   - setupErrorHandling(): process.on SIGINT, server.onerror

   - async run(): new StdioServerTransport, server.connect(transport)

4. const server = new DatadogObservabilityServer(); server.run().catch(...)

CRITÉRIO DE SUCESSO: npx tsc compila sem erros. node dist/index.js com DD_API_KEY
e DD_APP_KEY definidos inicia o servidor sem crash.
```

---

## TASK_10 — VS Code Extension

```
ROLE: Engenheiro VS Code Extension TypeScript.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp
CONTEXT: TASK_9 concluída. O MCP server funciona via stdio.
REFERÊNCIA: /Users/gleidsonfersanp/workspace/AI/pdf-utilities-mcp/extension/src/extension.ts

MISSÃO: Implemente a VS Code Extension completa com UI de configuração de credenciais.

1. Crie extension/src/extension.ts:

   - activate(context):
     a. Cria OutputChannel "Datadog Observability"
     b. Lê credenciais do SecretStorage:
        const apiKey = await context.secrets.get('datadogObservability.apiKey')
        const appKey = await context.secrets.get('datadogObservability.appKey')
     c. Lê settings: site, logLevel, autoStart, maxResults
     d. Registra MCP Server Definition Provider:
        vscode.lm.registerMcpServerDefinitionProvider('datadog-observability', {
          provideMcpServerDefinitions() {
            return [new vscode.McpStdioServerDefinition(
              'datadog-observability', 'node', [mcpServerPath],
              { env: { DD_API_KEY: apiKey, DD_APP_KEY: appKey, DD_SITE: site,
                DD_MAX_RESULTS: maxResults } }
            )];
          }
        })
     e. Registra comandos:
        - datadogObservability.configure: Abre webview de configuração
        - datadogObservability.testConnection: Testa GET /api/v1/validate
        - datadogObservability.restart: Reload window
        - datadogObservability.viewDocs: Abre URL GitHub
     f. Welcome message na primeira ativação
     g. Status bar item mostrando "DD: Connected" ou "DD: Not Configured"

   - deactivate(): cleanup

2. Crie extension/src/settings-webview.ts:
   - Classe SettingsWebviewProvider
   - Cria WebviewPanel com formulário HTML embutido (ou carrega de extension/webview/)
   - Campos:
     - API Key (password input)
     - Application Key (password input)
     - Site (dropdown com 6 opções)
     - Default Time Range (dropdown)
     - Max Results (number)
   - Botões: "Save & Test", "Clear Credentials"
   - Status: ícone verde/vermelho
   - Comunicação via postMessage
   - Salva keys no SecretStorage, resto no workspace configuration

3. Crie extension/webview/settings.html:
   - HTML5 standalone com CSS embutido que respeita VS Code CSS variables
   - (--vscode-editor-background, --vscode-input-background, etc.)
   - Formulário funcional com validação
   - Loading spinner no botão de teste

4. Crie extension/src/types.ts:
   - Interfaces para mensagens webview ↔ extension
   - interface WebviewMessage { command: string; data?: any }

CRITÉRIO DE SUCESSO: cd extension && npx tsc compila sem erros. A extension pode
ser carregada no VS Code.
```

---

## TASK_11 — Ícone da Extension

```
ROLE: Você é um designer/engenheiro. Crie o ícone da extension.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp

MISSÃO: Crie o ícone SVG e o script de conversão para PNG.

1. Crie extension/icon.svg:
   - Tamanho: 128x128 viewBox
   - Conceito: Observabilidade + Datadog
   - Design: Fundo circular roxo (#632CA6), ícone central branco/verde
   - Elementos visuais:
     - Gráfico de linha/métricas estilizado (representando timeseries)
     - Lupa ou olho (representando observabilidade/monitoramento)
     - Opcional: paw print estilizado sutil (referência ao Datadog)
   - Acentos em verde (#00C9A7) ou laranja (#FF6B35)
   - Estilo: Flat, moderno, clean — deve ser legível em 16x16 no marketplace

2. Crie extension/create-icon.js:
   - Script que instrui como converter SVG → PNG
   - Opções: ImageMagick, sharp, ou online

3. Use ImageMagick se disponível para gerar extension/icon.png:
   convert extension/icon.svg -resize 128x128 extension/icon.png
   Se não disponível, documente como fazer.

CRITÉRIO DE SUCESSO: icon.svg e icon.png (128x128) existem em extension/.
```

---

## TASK_12 — Documentation e Instructions

```
ROLE: Você é um tech writer. Crie toda a documentação do projeto.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp

MISSÃO: Crie TODOS os arquivos de documentação.

1. Crie extension/resources/instructions/datadog.instructions.md:
   - Instructions completas para o GitHub Copilot saber QUANDO e COMO usar cada tool
   - Inclua fluxos de troubleshooting:
     "When investigating production issues: 1) get_triggered_monitors
      2) search_logs for the affected service 3) query_metrics for resource usage
      4) search_traces for errors 5) check list_incidents"
   - Exemplos de queries do Datadog para cada domínio
   - Dicas de time ranges e sintaxe

2. Crie extension/README.md:
   - Badges: version, installs, rating
   - Hero image placeholder
   - Features list completa (todas as 68 tools organizadas por categoria)
   - Quick Start: Install → Configure (com screenshots placeholder) → Use
   - Exemplos de uso com Copilot Chat
   - Configuração detalhada
   - Troubleshooting (credenciais, rate limits, permissões)
   - Contributing, License

3. Crie README.md raiz:
   - Overview, Arquitetura, Build, Development, Publish

4. Crie extension/CHANGELOG.md:
   - v1.0.0: Initial release com todas as features

5. Crie extension/.vscodeignore:
   src/**
   node_modules/**
   .env
   *.ts
   !dist/**
   tsconfig.json
   create-icon.js
   icon.svg

6. Crie extension/.env:
   VSCE_PAT=your_personal_access_token_here

7. Crie BUILD_PUBLISH_GUIDE.md:
   - Passo a passo para build, package (.vsix), test local, e publish no marketplace

CRITÉRIO DE SUCESSO: Todos os .md são bem formatados e completos.
```

---

## TASK_13 — Build, QA & Git

```
ROLE: Você é um DevOps/QA engineer.
PROJECT: /Users/gleidsonfersanp/workspace/AI/datadog-mcp

MISSÃO: Validar que TODO o projeto compila, funciona, e está pronto para publicação.

TAREFAS:

1. Execute na raiz:
   npm install
   npm run build
   → Se houver erros de compilação, CORRIJA-OS.

2. Execute na extension:
   cd extension
   npm install
   npm run compile
   → Se houver erros, CORRIJA-OS.

3. Verifique que extension/mcp-server/ contém os arquivos compilados:
   npm run copy-server (na extension)

4. Teste que o MCP server inicia:
   DD_API_KEY=test DD_APP_KEY=test node dist/index.js
   (Deve iniciar sem crash, mesmo sem credenciais válidas)

5. Verifique todos os arquivos essenciais existem:
   - icon.png em extension/
   - package.json em raiz e extension/
   - Todos os .ts em src/tools/ e src/client/ e src/utils/
   - extension/src/extension.ts
   - extension/resources/instructions/datadog.instructions.md
   - README.md
   - LICENSE
   - .gitignore

6. Git commit e push de tudo:
   git add -A
   git commit -m "feat: complete Datadog Observability MCP implementation"
   git push origin main

CRITÉRIO DE SUCESSO: Build passa. Nenhum erro. Push feito.
```

---

## NOTAS PARA O ORQUESTRADOR

### Gestão de Conflitos
Se dois agents editarem o mesmo arquivo (ex: package.json), o ORQUESTRADOR deve:
1. Aceitar a primeira versão
2. Pedir ao segundo agent que faça merge manual

### Re-tentativa
Se um agent falhar, forneça o erro completo no prompt de retry e peça correção específica.

### Validação Intermediária
Após a FASE 3, execute `npx tsc --noEmit` na raiz para detectar erros de integração
ANTES de lançar TASK_9. Isso economiza tempo.

### Order de Prioridade (se não puder rodar todos em paralelo)
TASK_3 (Logs) > TASK_5 (Monitors) > TASK_4 (Metrics) > TASK_7 (Incidents+APM) >
TASK_6 (Dashboards) > TASK_8 (Extended) > TASK_12 (Docs) > TASK_11 (Ícone)
