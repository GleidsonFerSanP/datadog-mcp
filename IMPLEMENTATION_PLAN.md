# Datadog Observability MCP - Plano de Implementação

## Visão Geral do Projeto

VS Code Extension que provê ferramentas completas de observabilidade do Datadog para GitHub Copilot Chat via Model Context Protocol (MCP). Permite que AI agents analisem problemas de produção, consultem logs, métricas, monitors, dashboards, traces, incidents e muito mais — tudo diretamente do editor.

## Arquitetura

```
datadog-mcp/
├── src/                              # MCP Server source
│   ├── index.ts                      # Main MCP server entry point
│   ├── client/
│   │   ├── datadog-client.ts         # HTTP client base para Datadog API
│   │   └── auth.ts                   # Autenticação (API Key + App Key)
│   ├── tools/
│   │   ├── logs.ts                   # Ferramentas de Logs
│   │   ├── metrics.ts                # Ferramentas de Métricas
│   │   ├── monitors.ts               # Ferramentas de Monitors
│   │   ├── dashboards.ts             # Ferramentas de Dashboards
│   │   ├── events.ts                 # Ferramentas de Events
│   │   ├── incidents.ts              # Ferramentas de Incidents
│   │   ├── traces.ts                 # Ferramentas de APM/Traces
│   │   ├── hosts.ts                  # Ferramentas de Infrastructure/Hosts
│   │   ├── synthetics.ts             # Ferramentas de Synthetic Tests
│   │   ├── slo.ts                    # Ferramentas de SLOs
│   │   ├── rum.ts                    # Ferramentas de RUM
│   │   ├── security.ts               # Ferramentas de Security Monitoring
│   │   └── downtimes.ts              # Ferramentas de Downtimes
│   └── utils/
│       ├── formatters.ts             # Formatação de respostas para AI
│       ├── time-helpers.ts           # Helpers de time ranges
│       └── error-handler.ts          # Tratamento de erros padronizado
├── extension/                         # VS Code Extension
│   ├── src/
│   │   ├── extension.ts              # Extension activation & MCP registration
│   │   ├── settings-webview.ts       # Webview para configuração de credenciais
│   │   └── types.ts                  # TypeScript definitions
│   ├── resources/
│   │   └── instructions/
│   │       └── datadog.instructions.md
│   ├── webview/
│   │   ├── settings.html             # UI de configuração de credenciais
│   │   ├── settings.css              # Estilos da UI
│   │   └── settings.js               # Lógica da UI
│   ├── dist/
│   ├── mcp-server/
│   ├── package.json                   # Extension manifest
│   ├── tsconfig.json
│   ├── icon.svg                       # Ícone SVG fonte
│   ├── icon.png                       # Ícone 128x128 para marketplace
│   ├── create-icon.js                 # Script de geração de ícone
│   ├── .env
│   ├── .vscodeignore
│   ├── CHANGELOG.md
│   ├── LICENSE
│   └── README.md
├── dist/
├── package.json                       # MCP server package
├── tsconfig.json
├── .gitignore
├── LICENSE
├── AGENTS.md
└── README.md
```

---

## Domínios de API do Datadog Cobertos

### 1. **Logs** (Prioridade: CRÍTICA)

* `search_logs` — Buscar logs com query syntax do Datadog
* `aggregate_logs` — Agregar logs em buckets, timeseries, compute
* `get_log` — Obter detalhes de um log específico
* `tail_logs` — Últimos N logs em tempo real (via polling)

### 2. **Metrics** (Prioridade: CRÍTICA)

* `query_metrics` — Query timeseries points (ex: `system.cpu.idle{*}`)
* `search_metrics` — Buscar métricas por nome/tag
* `get_metric_metadata` — Metadados de uma métrica
* `list_active_metrics` — Listar métricas ativas
* `query_scalar_data` — Query scalar values (para widgets Query Value/Table)
* `query_timeseries_data` — Query timeseries cross-product
* `list_metric_tags` — Tags de uma métrica
* `get_metric_volumes` — Volume de uma métrica
* `get_metric_assets` — Dashboards/monitors/SLOs que usam uma métrica

### 3. **Monitors** (Prioridade: CRÍTICA)

* `list_monitors` — Listar todos os monitors
* `get_monitor` — Detalhes de um monitor
* `search_monitors` — Buscar monitors por nome/tag
* `create_monitor` — Criar um monitor (metric, log, APM, etc.)
* `update_monitor` — Atualizar um monitor existente
* `delete_monitor` — Deletar um monitor
* `mute_monitor` — Silenciar um monitor
* `unmute_monitor` — Reativar um monitor
* `validate_monitor` — Validar configuração de monitor
* `get_monitor_groups` — Buscar grupos de um monitor

### 4. **Dashboards** (Prioridade: ALTA)

* `list_dashboards` — Listar todos os dashboards
* `get_dashboard` — Obter dashboard completo com widgets
* `create_dashboard` — Criar dashboard com widgets customizados
* `update_dashboard` — Atualizar dashboard
* `delete_dashboard` — Deletar dashboard
* `share_dashboard` — Compartilhar dashboard (gerar URL pública)
* `get_shared_dashboard` — Obter dashboard compartilhado

### 5. **Events** (Prioridade: ALTA)

* `list_events` — Listar eventos recentes
* `get_event` — Detalhes de um evento
* `search_events` — Buscar eventos com filtros avançados
* `post_event` — Publicar um evento

### 6. **Incidents** (Prioridade: ALTA)

* `list_incidents` — Listar incidents ativos
* `get_incident` — Detalhes de um incident
* `create_incident` — Criar um incident
* `update_incident` — Atualizar incident
* `search_incidents` — Buscar incidents
* `list_incident_impacts` — Listar impactos de um incident
* `list_incident_todos` — Listar todos do incident
* `create_incident_todo` — Criar todo para um incident
* `list_incident_timeline` — Timeline do incident

### 7. **APM / Traces** (Prioridade: ALTA)

* `list_trace_services` — Listar serviços APM
* `get_service_summary` — Resumo de um serviço (latência, error rate, throughput)
* `search_traces` — Buscar traces/spans
* `get_trace` — Detalhes de um trace
* `list_service_dependencies` — Dependências entre serviços

### 8. **Hosts / Infrastructure** (Prioridade: MÉDIA)

* `list_hosts` — Listar hosts ativos
* `get_host_totals` — Total de hosts
* `mute_host` — Silenciar um host
* `unmute_host` — Reativar um host
* `list_host_tags` — Tags de um host
* `add_host_tags` — Adicionar tags a um host

### 9. **SLOs** (Prioridade: MÉDIA)

* `list_slos` — Listar Service Level Objectives
* `get_slo` — Detalhes de um SLO
* `get_slo_history` — Histórico de cumprimento do SLO
* `create_slo` — Criar um SLO
* `update_slo` — Atualizar um SLO
* `delete_slo` — Deletar um SLO

### 10. **Synthetics** (Prioridade: MÉDIA)

* `list_synthetics_tests` — Listar testes sintéticos
* `get_synthetics_test` — Detalhes de um teste
* `get_synthetics_results` — Resultados de execuções
* `trigger_synthetics_test` — Disparar teste manualmente
* `create_synthetics_test` — Criar teste (API ou Browser)

### 11. **RUM (Real User Monitoring)** (Prioridade: MÉDIA)

* `search_rum_events` — Buscar eventos RUM
* `aggregate_rum_events` — Agregar eventos RUM

### 12. **Security Monitoring** (Prioridade: BAIXA)

* `list_security_signals` — Listar sinais de segurança
* `search_security_signals` — Buscar sinais de segurança
* `get_security_signal` — Detalhes de um sinal

### 13. **Downtimes** (Prioridade: BAIXA)

* `list_downtimes` — Listar downtimes ativos
* `create_downtime` — Criar downtime
* `cancel_downtime` — Cancelar downtime

### 14. **Log Pipelines & Indexes** (Prioridade: BAIXA)

* `list_log_pipelines` — Listar pipelines de processamento
* `list_log_indexes` — Listar indexes de logs
* `get_log_pipeline` — Detalhes de um pipeline

### 15. **Notebooks** (Prioridade: BAIXA)

* `list_notebooks` — Listar notebooks
* `get_notebook` — Obter notebook completo
* `create_notebook` — Criar notebook

---

## Configurações da Extension (VS Code Settings UI)

```jsonc
{
  "datadogObservability.apiKey": "",           // DD_API_KEY (Secret Storage)
  "datadogObservability.appKey": "",           // DD_APP_KEY (Secret Storage)
  "datadogObservability.site": "datadoghq.com", // Site: US1, US3, US5, EU, AP1, US1-FED
  "datadogObservability.defaultTimeRange": "1h", // Range padrão: 15m, 1h, 4h, 1d, 7d
  "datadogObservability.logLevel": "info",
  "datadogObservability.autoStart": true,
  "datadogObservability.maxResults": 50        // Max results para queries
}
```

### Webview de Configuração de Credenciais

* Interface gráfica com formulário para API Key e App Key
* Dropdown para selecionar o Datadog Site
* Botão "Test Connection" que valida as credenciais contra `/api/v1/validate`
* Indicador visual de status (conectado/desconectado)
* Armazenamento seguro via VS Code `SecretStorage` API
* Acessível via command palette: "Datadog: Configure Credentials"

---

## Plano de Steps para Multi-Agents

### STEP 1 — Scaffolding e Configuração Base

**Agent: Infra/Setup**
**Paralelismo: Pode executar sozinho. Bloqueia STEPS 2-10.**

1. Criar toda a estrutura de diretórios conforme o diagrama de arquitetura
2. Criar `package.json` raiz (MCP Server):
   - name: `datadog-observability-mcp`

   - type: `module`

   - main: `dist/index.js`

   - bin: `./dist/index.js`

   - dependencies: `@modelcontextprotocol/sdk`  `^1.0.0` , `node-fetch` (se necessário)
   - devDependencies: `@types/node` , `typescript`

3. Criar `tsconfig.json` raiz (target ES2022, module NodeNext, etc.)
4. Criar `extension/package.json`:
   - name: `datadog-observability`

   - displayName: `Datadog Observability for GitHub Copilot`

   - publisher: `GleidsonFerSanP`

   - icon: `icon.png`

   - engines.vscode: `^1.85.0`

   - categories: `["AI", "Other", "Visualization"]`

   - keywords: `["datadog", "observability", "monitoring", "logs", "metrics", "apm", "mcp", "copilot"]`

   - activationEvents: `["onStartupFinished"]`

   - main: `./dist/extension.js`

   - contributes:

     - `mcpServerDefinitionProviders`

     - `chatInstructions`

     - `commands` (configure, restart, viewDocs, testConnection)
     - `configuration` (todas as settings listadas acima)

5. Criar `extension/tsconfig.json`
6. Criar `.gitignore`
7. Criar `LICENSE` (MIT)
8. Criar `AGENTS.md` com instruções para AI agents

---

### STEP 2 — Datadog HTTP Client + Auth

**Agent: Core/Client**
**Paralelismo: Depende do STEP 1. Bloqueia STEPS 3-8.**

1. Criar `src/client/auth.ts`:
   - Interface `DatadogCredentials` { apiKey, appKey, site }
   - Função `getBaseUrl(site)` que retorna URL correta por site:

     - `datadoghq.com` → `https://api.datadoghq.com`

     - `datadoghq.eu` → `https://api.datadoghq.eu`

     - `us3.datadoghq.com` → `https://api.us3.datadoghq.com`

     - `us5.datadoghq.com` → `https://api.us5.datadoghq.com`

     - `ap1.datadoghq.com` → `https://api.ap1.datadoghq.com`

     - `ddog-gov.com` → `https://api.ddog-gov.com`

   - Função `validateCredentials()` → chama `GET /api/v1/validate`

2. Criar `src/client/datadog-client.ts`:
   - Classe `DatadogClient` :

     - Constructor recebe `DatadogCredentials`

     - Método `get<T>(path, params?)` → HTTP GET com auth headers
     - Método `post<T>(path, body?)` → HTTP POST com auth headers
     - Método `put<T>(path, body?)` → HTTP PUT com auth headers
     - Método `delete<T>(path, params?)` → HTTP DELETE com auth headers
     - Headers: `DD-API-KEY` , `DD-APPLICATION-KEY` , `Content-Type: application/json`

     - Rate limiting handling (retry com backoff)
     - Error handling padronizado
     - Timeout configurável

3. Criar `src/utils/error-handler.ts`:
   - Classe customizada `DatadogAPIError`

   - Handler para status codes: 400, 401, 403, 404, 429, 500, 503
   - Mensagens amigáveis para o AI

4. Criar `src/utils/time-helpers.ts`:
   - `parseTimeRange(input)` — converte "1h", "30m", "7d", "now-1h" para timestamps
   - `toUnixSeconds(date)`

   - `toISO8601(date)`

   - `getDefaultTimeRange()` — retorna últimos 60 minutos

5. Criar `src/utils/formatters.ts`:
   - `formatLogEntry(log)` — formata log para exibição concisa
   - `formatMetricPoint(point)` — formata ponto de métrica
   - `formatMonitorStatus(monitor)` — formata status do monitor
   - `formatIncident(incident)` — formata incident
   - `truncateResponse(data, maxItems)` — limita resultados para o AI

---

### STEP 3 — Tools: Logs

**Agent: Feature/Logs**
**Paralelismo: Depende do STEP 2. Pode executar em paralelo com STEPS 4-8.**

Criar `src/tools/logs.ts` com as seguintes MCP tools:

1. **`search_logs`**
   - Params: `query` (string, required), `from` (string, "now-1h"), `to` (string, "now"), `limit` (number, 50), `sort` ("timestamp"/"-timestamp"), `indexes` (string[])
   - API: `POST /api/v2/logs/events/search`

   - Retorno: Lista de logs formatados com timestamp, host, service, message, status

2. **`aggregate_logs`**
   - Params: `query` (string), `compute_type` ("count"/"avg"/"sum"/"cardinality"), `group_by` (string[]), `interval` (string), `from` , `to`

   - API: `POST /api/v2/logs/analytics/aggregate`

   - Retorno: Buckets com valores agregados

3. **`tail_logs`**
   - Params: `query` (string), `source` (string), `service` (string), `host` (string), `limit` (number, 20)
   - API: `POST /api/v2/logs/events/search` (sorted by -timestamp, limit)
   - Retorno: Últimos N logs em formato conciso (simula tail)

4. **`get_log_patterns`**
   - Params: `query` (string), `from` , `to`

   - API: Combina aggregate com group_by por pattern/message
   - Retorno: Top patterns de logs com contagens

---

### STEP 4 — Tools: Metrics

**Agent: Feature/Metrics**
**Paralelismo: Depende do STEP 2. Pode executar em paralelo com STEPS 3, 5-8.**

Criar `src/tools/metrics.ts` com:

1. **`query_metrics`**
   - Params: `query` (string, ex: "avg:system.cpu.idle{*}"), `from` (timestamp), `to` (timestamp)
   - API: `GET /api/v1/query`

   - Retorno: Timeseries data pontos formatados

2. **`search_metrics`**
   - Params: `query` (string), `filter_tags` (string)
   - API: `GET /api/v2/metrics` ou `GET /api/v1/search?q=metrics:query`

   - Retorno: Lista de métricas matching

3. **`get_metric_metadata`**
   - Params: `metric_name` (string)
   - API: `GET /api/v1/metrics/{metric_name}`

   - Retorno: Tipo, unidade, descrição, integração

4. **`list_active_metrics`**
   - Params: `from` (timestamp), `host` (string?), `tag_filter` (string?)
   - API: `GET /api/v1/metrics`

   - Retorno: Lista de nomes de métricas ativas

5. **`get_metric_assets`**
   - Params: `metric_name` (string)
   - API: `GET /api/v2/metrics/{metric_name}/all-tags` + `GET /api/v2/metrics/{metric_name}/volumes`

   - Retorno: Dashboards, monitors, SLOs que usam a métrica

6. **`query_scalar_data`**
   - Params: `queries` (array de {query, data_source, aggregator}), `from` , `to`

   - API: `POST /api/v2/query/scalar`

   - Retorno: Valores escalares (para comparações pontuais)

---

### STEP 5 — Tools: Monitors

**Agent: Feature/Monitors**
**Paralelismo: Depende do STEP 2. Pode executar em paralelo com STEPS 3-4, 6-8.**

Criar `src/tools/monitors.ts` com:

1. **`list_monitors`**
   - Params: `name` (string?), `tags` (string?), `monitor_tags` (string?), `group_states` (string?)
   - API: `GET /api/v1/monitor`

   - Retorno: Lista de monitors com id, name, type, status, query

2. **`get_monitor`**
   - Params: `monitor_id` (number)
   - API: `GET /api/v1/monitor/{monitor_id}?group_states=all`

   - Retorno: Detalhes completos do monitor

3. **`search_monitors`**
   - Params: `query` (string)
   - API: `GET /api/v1/monitor/search?query={query}`

   - Retorno: Monitors matching

4. **`create_monitor`**
   - Params: `name` , `type` (enum), `query` , `message` , `tags` , `thresholds`

   - API: `POST /api/v1/monitor`

   - Retorno: Monitor criado com ID

5. **`update_monitor`**
   - Params: `monitor_id` , `name?` , `query?` , `message?` , `tags?` , `thresholds?`

   - API: `PUT /api/v1/monitor/{monitor_id}`

   - Retorno: Monitor atualizado

6. **`delete_monitor`**
   - Params: `monitor_id` (number)
   - API: `DELETE /api/v1/monitor/{monitor_id}`

   - Retorno: Confirmação

7. **`mute_monitor`**
   - Params: `monitor_id` , `scope?` , `end?`

   - API: `POST /api/v1/monitor/{monitor_id}/mute`

   - Retorno: Monitor mutado

8. **`unmute_monitor`**
   - Params: `monitor_id` , `scope?`

   - API: `POST /api/v1/monitor/{monitor_id}/unmute`

   - Retorno: Monitor unmuted

9. **`get_triggered_monitors`**
   - Params: nenhum obrigatório
   - API: `GET /api/v1/monitor?group_states=alert,warn`

   - Retorno: Lista de monitors em alert/warn (para troubleshooting rápido)

---

### STEP 6 — Tools: Dashboards + Events

**Agent: Feature/Dashboards**
**Paralelismo: Depende do STEP 2. Pode executar em paralelo com STEPS 3-5, 7-8.**

#### Dashboards ( `src/tools/dashboards.ts` ):

1. **`list_dashboards`**
   - Params: `filter_shared?` , `count?` , `start?`

   - API: `GET /api/v1/dashboard`

   - Retorno: Lista de dashboards com id, title, author, created_at, modified_at

2. **`get_dashboard`**
   - Params: `dashboard_id` (string)
   - API: `GET /api/v1/dashboard/{dashboard_id}`

   - Retorno: Dashboard completo com widgets, template variables

3. **`create_dashboard`**
   - Params: `title` , `description?` , `layout_type` ("ordered"/"free"), `widgets` (JSON array), `template_variables?`

   - API: `POST /api/v1/dashboard`

   - Retorno: Dashboard criado com ID e URL

4. **`update_dashboard`**
   - Params: `dashboard_id` , `title?` , `description?` , `widgets?`

   - API: `PUT /api/v1/dashboard/{dashboard_id}`

   - Retorno: Dashboard atualizado

5. **`delete_dashboard`**
   - Params: `dashboard_id` (string)
   - API: `DELETE /api/v1/dashboard/{dashboard_id}`

   - Retorno: Confirmação

6. **`create_observability_dashboard`**
   - Params: `service_name` , `environment?` , `include_metrics` (bool), `include_logs` (bool), `include_apm` (bool)
   - Implementação: Cria dashboard pré-configurado com widgets de métricas (CPU, Memory, Disk), logs, e APM para um serviço
   - É uma tool de alto nível que gera o JSON de widgets internamente

#### Events ( `src/tools/events.ts` ):

1. **`list_events`**
   - Params: `from?` , `to?` , `priority?` , `tags?`

   - API: `GET /api/v2/events`

   - Retorno: Lista de eventos

2. **`get_event`**
   - Params: `event_id` (string)
   - API: `GET /api/v2/events/{event_id}`

   - Retorno: Detalhes do evento

3. **`search_events`**
   - Params: `query` , `from?` , `to?` , `sort?` , `limit?`

   - API: `POST /api/v2/events/search`

   - Retorno: Eventos matching

4. **`post_event`**
   - Params: `title` , `message` , `tags?` , `alert_type?` , `priority?`

   - API: `POST /api/v2/events`

   - Retorno: Evento publicado

---

### STEP 7 — Tools: Incidents + APM/Traces

**Agent: Feature/Incidents**
**Paralelismo: Depende do STEP 2. Pode executar em paralelo com STEPS 3-6, 8.**

#### Incidents ( `src/tools/incidents.ts` ):

1. **`list_incidents`**
   - Params: `include?` (string[])
   - API: `GET /api/v2/incidents`

   - Retorno: Lista de incidents com severity, status, title, created_at

2. **`get_incident`**
   - Params: `incident_id` (string)
   - API: `GET /api/v2/incidents/{incident_id}`

   - Retorno: Detalhes completos do incident

3. **`create_incident`**
   - Params: `title` , `severity` , `customer_impacted` (bool), `fields?`

   - API: `POST /api/v2/incidents`

   - Retorno: Incident criado

4. **`search_incidents`**
   - Params: `query` (string, ex: "state:(active OR stable)")
   - API: `GET /api/v2/incidents/search?query={query}`

   - Retorno: Incidents matching

5. **`list_incident_todos`**
   - Params: `incident_id` (string)
   - API: `GET /api/v2/incidents/{incident_id}/relationships/todos`

   - Retorno: Todos do incident

6. **`create_incident_todo`**
   - Params: `incident_id` , `content` , `assignees?`

   - API: `POST /api/v2/incidents/{incident_id}/relationships/todos`

   - Retorno: Todo criado

7. **`update_incident`**
   - Params: `incident_id` , `title?` , `severity?` , `status?` , `fields?`

   - API: `PATCH /api/v2/incidents/{incident_id}`

   - Retorno: Incident atualizado

#### APM/Traces ( `src/tools/traces.ts` ):

1. **`list_services`**
   - Params: `env?`

   - API: `GET /api/v1/service_dependencies` ou `GET /api/v2/services`

   - Retorno: Lista de serviços APM

2. **`search_traces`**
   - Params: `query` (string), `from` , `to` , `limit` , `sort`

   - API: `POST /api/v2/spans/events/search`

   - Retorno: Lista de spans/traces

3. **`aggregate_traces`**
   - Params: `query` , `compute_type` , `group_by` , `from` , `to`

   - API: `POST /api/v2/spans/analytics/aggregate`

   - Retorno: Dados agregados de traces

4. **`get_service_summary`**
   - Params: `service_name` , `env` , `from?` , `to?`

   - Implementação: Combina queries de métricas APM ( `trace.{service}.hits` , `trace.{service}.errors` , `trace.{service}.duration` )
   - Retorno: Resumo com request rate, error rate, latency (p50, p95, p99)

---

### STEP 8 — Tools: Hosts, SLOs, Synthetics, RUM, Security, Downtimes

**Agent: Feature/Extended**
**Paralelismo: Depende do STEP 2. Pode executar em paralelo com STEPS 3-7.**

#### Hosts ( `src/tools/hosts.ts` ):

1. **`list_hosts`** — `GET /api/v1/hosts` — Listar hosts com filtros
2. **`get_host_totals`** — `GET /api/v1/hosts/totals` — Total de hosts up/down
3. **`mute_host`** — `POST /api/v1/host/{hostname}/mute` — Silenciar host
4. **`unmute_host`** — `POST /api/v1/host/{hostname}/unmute` — Reativar host
5. **`search_hosts`** — `GET /api/v1/hosts?filter={query}` — Buscar hosts

#### SLOs ( `src/tools/slo.ts` ):

1. **`list_slos`** — `GET /api/v1/slo` — Listar SLOs
2. **`get_slo`** — `GET /api/v1/slo/{slo_id}` — Detalhes
3. **`get_slo_history`** — `GET /api/v1/slo/{slo_id}/history` — Histórico de SLI/SLO
4. **`create_slo`** — `POST /api/v1/slo` — Criar SLO
5. **`delete_slo`** — `DELETE /api/v1/slo/{slo_id}` — Deletar

#### Synthetics ( `src/tools/synthetics.ts` ):

1. **`list_synthetics_tests`** — `GET /api/v1/synthetics/tests` — Listar testes
2. **`get_synthetics_test`** — `GET /api/v1/synthetics/tests/{public_id}` — Detalhes
3. **`get_synthetics_results`** — `GET /api/v1/synthetics/tests/{public_id}/results` — Resultados
4. **`trigger_synthetics_test`** — `POST /api/v1/synthetics/tests/trigger` — Disparar
5. **`create_api_test`** — `POST /api/v1/synthetics/tests/api` — Criar teste API

#### RUM ( `src/tools/rum.ts` ):

1. **`search_rum_events`** — `POST /api/v2/rum/events/search` — Buscar
2. **`aggregate_rum_events`** — `POST /api/v2/rum/analytics/aggregate` — Agregar

#### Security ( `src/tools/security.ts` ):

1. **`list_security_signals`** — `GET /api/v2/security_monitoring/signals` — Listar
2. **`search_security_signals`** — `POST /api/v2/security_monitoring/signals/search` — Buscar
3. **`get_security_signal`** — `GET /api/v2/security_monitoring/signals/{signal_id}` — Detalhes

#### Downtimes ( `src/tools/downtimes.ts` ):

1. **`list_downtimes`** — `GET /api/v2/downtime` — Listar
2. **`create_downtime`** — `POST /api/v2/downtime` — Criar
3. **`cancel_downtime`** — `DELETE /api/v2/downtime/{downtime_id}` — Cancelar
4. **`get_downtime`** — `GET /api/v2/downtime/{downtime_id}` — Detalhes

#### Log Pipelines ( `src/tools/logs.ts` — adição):

5. **`list_log_pipelines`** — `GET /api/v1/logs/config/pipelines` — Listar pipelines
6. **`list_log_indexes`** — `GET /api/v1/logs/config/indexes` — Listar indexes

---

### STEP 9 — MCP Server Entry Point (index.ts)

**Agent: Core/Integration**
**Paralelismo: Depende dos STEPS 3-8.**

Criar `src/index.ts` :

1. Importar todas as tools de `src/tools/*.ts`
2. Criar `DatadogMCPServer` class:
   - Inicializar `Server` do `@modelcontextprotocol/sdk`

   - Registrar TODOS os handlers de `ListToolsRequestSchema`

   - Registrar TODOS os handlers de `CallToolRequestSchema`

   - Ler credenciais de env vars: `DD_API_KEY` , `DD_APP_KEY` , `DD_SITE`

   - Setup error handling
   - Setup `StdioServerTransport`

3. Cada tool deve ter:
   - `name` — identificador único
   - `description` — descrição clara para o AI entender quando usar
   - `inputSchema` — JSON Schema com params
4. No `CallToolRequestSchema`, fazer dispatch para a tool correta
5. Tratar erros e retornar mensagens úteis

---

### STEP 10 — VS Code Extension

**Agent: Extension/VSCode**
**Paralelismo: Depende do STEP 1 e STEP 9.**

1. Criar `extension/src/extension.ts`:
   - `activate(context)` :

     - Criar OutputChannel "Datadog Observability"
     - Registrar `vscode.lm.registerMcpServerDefinitionProvider`

     - Configurar `McpStdioServerDefinition` com env vars das settings
     - Ler credenciais do `SecretStorage` e injetar como env vars no MCP server
     - Registrar comandos:
       - `datadogObservability.configure` — Abre webview de configuração
       - `datadogObservability.testConnection` — Testa conexão com api `/validate`

       - `datadogObservability.restart` — Reinicia MCP server
       - `datadogObservability.viewDocs` — Abre docs
       - `datadogObservability.showStatus` — Mostra status no status bar
     - Welcome message na primeira ativação

   - `deactivate()` : cleanup

2. Criar `extension/src/settings-webview.ts`:
   - Classe `SettingsWebviewProvider` :

     - Renderiza HTML com formulário para:
       - API Key (input password)
       - App Key (input password)
       - Site (dropdown: US1, US3, US5, EU, AP1, US1-FED)
       - Default Time Range (dropdown: 15m, 1h, 4h, 1d, 7d)
       - Max Results (number input)
     - Botão "Save & Test Connection"
     - Botão "Clear Credentials"
     - Status indicator (verde/vermelho/amarelo)
     - Comunicação via `postMessage` / `onDidReceiveMessage`

     - Salva API Key e App Key no `SecretStorage`

     - Salva outras settings no `workspace.getConfiguration`

3. Criar `extension/webview/settings.html`, `settings.css`, `settings.js`:
   - UI moderna com VS Code design tokens
   - Responsivo, dark/light theme aware
   - Validação inline dos campos
   - Loading state no botão de teste

4. Criar `extension/src/types.ts`:
   - Interfaces TypeScript para todas as respostas

---

### STEP 11 — Ícone da Extension

**Agent: Design/Assets**
**Paralelismo: Pode executar em paralelo com todos os STEPS exceto o 1.**

1. Criar `extension/icon.svg`:
   - Design: Símbolo de observabilidade/monitoramento com referência ao Datadog
   - Conceito: Lupa + gráfico de métricas + dog paw print estilizado
   - Cores: Roxo Datadog (#632CA6) como cor principal, com acentos em verde (#00C9A7)
   - Estilo: Flat, moderno, 128x128 viewBox
   - Background: Círculo roxo com ícone branco/verde

2. Criar `extension/create-icon.js`:
   - Script para converter SVG → PNG 128x128
   - Suporte a sharp ou instruções para ImageMagick

3. Gerar `extension/icon.png` (128x128)

---

### STEP 12 — Instructions para Copilot + Documentação

**Agent: Docs/Instructions**
**Paralelismo: Pode executar em paralelo com STEPS 3-10.**

1. Criar `extension/resources/instructions/datadog.instructions.md`:
   

```markdown
   # Datadog Observability - GitHub Copilot Instructions

   You have access to Datadog observability tools via MCP. Use these tools to help
   users investigate production issues, analyze logs, metrics, monitors, and more.

   ## When to use each tool:

   ### Investigating Issues:
   - Start with `get_triggered_monitors` to see what's alerting
   - Use `search_logs` to find error logs related to the issue
   - Use `query_metrics` to check resource utilization
   - Use `search_traces` to find slow or erroring traces
   - Check `list_incidents` for ongoing incidents

   ### Log Analysis:
   - `search_logs` — Find specific log entries by query
   - `aggregate_logs` — Count errors by service, status, etc.
   - `tail_logs` — See latest logs (like `tail -f`)
   - `get_log_patterns` — Find common error patterns

   ### Metrics Analysis:
   - `query_metrics` for time-series data
   - `get_metric_metadata` to understand what a metric measures
   - `query_scalar_data` for point-in-time values

   ### Monitor Management:
   - `list_monitors` / `search_monitors` to find monitors
   - `create_monitor` to set up alerting
   - `mute_monitor` during maintenance

   ### Dashboard Operations:
   - `create_observability_dashboard` for quick service dashboards
   - `list_dashboards` / `get_dashboard` to explore existing ones

   ### Incident Response:
   - `list_incidents` / `search_incidents` for active incidents
   - `create_incident` to declare a new incident
   - `create_incident_todo` to track action items

   ## Query Syntax Examples:
   - Logs: `service:payment-api status:error @http.status_code:500`
   - Metrics: `avg:system.cpu.idle{env:production,service:api}`
   - Monitors: `tag:"env:production" status:Alert`

   ## Time Ranges:
   - Use natural language: "last 1 hour", "last 30 minutes", "last 7 days"
   - Or ISO 8601: "2024-01-01T00:00:00Z"
   - Or relative: "now-1h", "now-30m", "now-7d"
   ```

2. Criar `extension/README.md`:
   - Overview com badges (version, installs, rating)
   - Features list com screenshots placeholders
   - Quick Start guide
   - Configuration instructions
   - All available tools reference
   - Troubleshooting section
   - Contributing
   - License

3. Criar `README.md` raiz:
   - Visão geral do projeto
   - Arquitetura
   - Build instructions
   - Development guide
   - Publishing guide

4. Criar `extension/CHANGELOG.md`

---

### STEP 13 — Build, Publish & QA

**Agent: DevOps/QA**
**Paralelismo: Depende de TODOS os STEPS anteriores.**

1. Criar scripts no root `package.json`:
   - `build` — `tsc`

   - `dev` — `tsc --watch`

   - `start` — `node dist/index.js`

   - `copy-to-extension` — copia dist + node_modules para extension/mcp-server

2. Criar scripts no `extension/package.json`:
   - `vscode:prepublish` — compile + copy-server
   - `compile` — `tsc -p ./`

   - `watch` — `tsc -watch -p ./`

   - `copy-server` — `cd .. && npm run build && npm run copy-to-extension`

   - `package` — `vsce package`

   - `publish` — `vsce publish`

3. Criar `extension/.vscodeignore`:
   

```
   src/**
   node_modules/**
   .env
   *.ts
   tsconfig.json
   ```

4. Criar `extension/.env`:
   

```
   VSCE_PAT=your_personal_access_token_here
   ```

5. Criar `BUILD_PUBLISH_GUIDE.md` com passo a passo

---

## Grafo de Dependências para Paralelismo

```
STEP 1 (Scaffolding)
  │
  ▼
STEP 2 (HTTP Client + Auth)
  │
  ├──────────┬──────────┬──────────┬──────────┬──────────┐
  ▼          ▼          ▼          ▼          ▼          ▼
STEP 3    STEP 4    STEP 5    STEP 6    STEP 7    STEP 8
(Logs)    (Metrics) (Monitors)(Dash+Evt)(Inc+APM) (Extended)
  │          │          │          │          │          │
  └──────────┴──────────┴──────────┴──────────┴──────────┘
                        │
                        ▼
                    STEP 9 (MCP Server index.ts)
                        │
                        ▼
                    STEP 10 (VS Code Extension)
                        │
                        ▼
                    STEP 13 (Build & Publish)

STEP 11 (Ícone) ──────── Paralelo com STEPS 2-10
STEP 12 (Docs) ─────────── Paralelo com STEPS 3-10
```

### Máximo Paralelismo Possível:

* **Fase 1** (1 agent): STEP 1
* **Fase 2** (1 agent): STEP 2
* **Fase 3** (8 agents em paralelo): STEPS 3, 4, 5, 6, 7, 8, 11, 12
* **Fase 4** (1 agent): STEP 9
* **Fase 5** (1 agent): STEP 10
* **Fase 6** (1 agent): STEP 13

---

## Insights de Features Essenciais para Observabilidade com AI

### 1. **Smart Troubleshooting Flow**

A tool `get_triggered_monitors` é o ponto de entrada ideal. O AI pode seguir um fluxo:
1. Ver monitors em alerta → 2. Buscar logs do serviço afetado → 3. Verificar métricas → 4. Checar traces → 5. Sugerir ação

### 2. **Dashboard Generator**

`create_observability_dashboard` gera dashboards prontos para um serviço, economizando tempo massivo de configuração manual.

### 3. **Log Pattern Detection**

`get_log_patterns` + `aggregate_logs` permite ao AI identificar padrões de erro automaticamente e sugerir investigação.

### 4. **Incident Automation**

O AI pode criar incidents, adicionar todos, e vincular logs/métricas relevantes — automatizando o processo de incident response.

### 5. **SLO Health Check**

Verificar SLOs em risco permite ações proativas antes de violar targets.

### 6. **Cross-Signal Correlation**

O AI pode correlacionar logs + métricas + traces do mesmo serviço/time range para dar diagnósticos completos.

### 7. **Muting During Maintenance**

`mute_monitor` + `create_downtime` permite gerenciar janelas de manutenção sem sair do editor.

### 8. **Security Signal Triage**

Buscar e analisar sinais de segurança com o AI para priorização rápida.

---

## Autenticação — Detalhes Técnicos

### Headers Obrigatórios

```
DD-API-KEY: <api_key>
DD-APPLICATION-KEY: <app_key>
Content-Type: application/json
```

### Sites Suportados

| Site | URL Base |
|------|----------|
| US1 (default) | `https://api.datadoghq.com` |
| US3 | `https://api.us3.datadoghq.com` |
| US5 | `https://api.us5.datadoghq.com` |
| EU1 | `https://api.datadoghq.eu` |
| AP1 | `https://api.ap1.datadoghq.com` |
| US1-FED | `https://api.ddog-gov.com` |

### Rate Limits

* A API do Datadog aplica rate limiting por endpoint
* O client deve implementar retry com exponential backoff em 429
* Response header `X-RateLimit-Remaining` deve ser observado

### Validação

* Endpoint: `GET /api/v1/validate`
* Retorna 200 se as credenciais são válidas
* Usar no botão "Test Connection" da extension

---

## Resumo de MCP Tools (Total: ~65 tools)

| Domínio | Quantidade | Prioridade |
|---------|-----------|------------|
| Logs | 6 | CRÍTICA |
| Metrics | 6 | CRÍTICA |
| Monitors | 9 | CRÍTICA |
| Dashboards | 6 | ALTA |
| Events | 4 | ALTA |
| Incidents | 7 | ALTA |
| APM/Traces | 4 | ALTA |
| Hosts | 5 | MÉDIA |
| SLOs | 5 | MÉDIA |
| Synthetics | 5 | MÉDIA |
| RUM | 2 | MÉDIA |
| Security | 3 | BAIXA |
| Downtimes | 4 | BAIXA |
| Log Config | 2 | BAIXA |
| **TOTAL** | **~68** | |
