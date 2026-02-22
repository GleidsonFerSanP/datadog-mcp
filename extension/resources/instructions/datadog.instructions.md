# Datadog Observability — Copilot Instructions

You have access to 65+ Datadog observability tools via MCP. Use them to help the user monitor, troubleshoot, and manage their infrastructure.

## Production Issue Troubleshooting Flow

When investigating production issues, follow this systematic approach:

1. **Check triggered monitors**: Use `get_triggered_monitors` to see what's currently alerting
2. **Search logs**: Use `search_logs` with `status:error service:<service_name>` to find error logs
3. **Check metrics**: Use `query_metrics` for resource usage (CPU, memory, disk)
4. **Search traces**: Use `search_traces` to find error traces and latency issues
5. **Check incidents**: Use `list_incidents` to see if there's a related incident already open
6. **Check hosts**: Use `list_hosts` to verify host health

## Tool Categories

### Logs (6 tools)

- `search_logs` — Search and filter logs. Query syntax: `service:api status:error`, `@http.status_code:>=500`, `host:web-* @duration:>1s`
- `aggregate_logs` — Aggregate logs for analytics (count, avg, sum by fields)
- `tail_logs` — Get the most recent logs (like `tail -f`)
- `get_log_patterns` — Find top log patterns and error distributions
- `list_log_indexes` — List available log indexes
- `list_log_pipelines` — List log processing pipelines

### Metrics (6 tools)

- `query_metrics` — Query time-series metrics. Examples: `avg:system.cpu.idle{*}`, `sum:trace.servlet.request.hits{service:api}.as_rate()`
- `search_metrics` — Find metric names matching a query
- `get_metric_metadata` — Get metadata (type, unit, description) for a metric
- `list_active_metrics` — List active metrics for a time period
- `get_metric_tags` — Get tags for a specific metric
- `query_scalar_data` — Query scalar (single-value) metric data

### Monitors (9 tools)

- `list_monitors` — List all monitors
- `get_monitor` — Get details of a specific monitor
- `search_monitors` — Search monitors by name, tag, or query
- `create_monitor` — Create a new monitor (metric, log, query, service check, etc.)
- `update_monitor` — Update an existing monitor
- `delete_monitor` — Delete a monitor
- `mute_monitor` — Mute a monitor (with optional scope and end time)
- `unmute_monitor` — Unmute a muted monitor
- `get_triggered_monitors` — **Best starting point for troubleshooting!** Get all currently alerting monitors

### Dashboards (6 tools)

- `list_dashboards` — List all dashboards
- `get_dashboard` — Get a specific dashboard with all widgets
- `create_dashboard` — Create a custom dashboard
- `update_dashboard` — Update a dashboard
- `delete_dashboard` — Delete a dashboard
- `create_observability_dashboard` — **Automatically creates a full observability dashboard** for a service with CPU, memory, disk I/O, log stream, APM error rate, and latency widgets

### Events (4 tools)

- `list_events` — List recent events
- `get_event` — Get details of a specific event
- `search_events` — Search events by query
- `post_event` — Post a new event

### Incidents (7 tools)

- `list_incidents` — List all incidents
- `get_incident` — Get incident details
- `create_incident` — Create a new incident
- `update_incident` — Update an incident
- `search_incidents` — Search incidents
- `list_incident_todos` — List todos for an incident
- `create_incident_todo` — Create a todo for an incident

### APM / Traces (4 tools)

- `search_traces` — Search APM trace spans. Query: `service:api @http.status_code:500`
- `aggregate_traces` — Aggregate trace data for analytics
- `list_services` — List APM services from the Service Catalog
- `get_service_summary` — **Get a full service health summary** with request rate, error rate, and latency P50/P95/P99

### Hosts (5 tools)

- `list_hosts` — List infrastructure hosts
- `get_host_totals` — Get total host counts
- `mute_host` — Mute a host
- `unmute_host` — Unmute a host
- `search_hosts` — Search hosts by filter

### SLOs (5 tools)

- `list_slos` — List Service Level Objectives
- `get_slo` — Get SLO details
- `get_slo_history` — Get SLO history and error budget
- `create_slo` — Create a new SLO
- `delete_slo` — Delete an SLO

### Synthetics (5 tools)

- `list_synthetics_tests` — List synthetic monitoring tests
- `get_synthetics_test` — Get test details
- `get_synthetics_results` — Get test results
- `trigger_synthetics_test` — Manually trigger a test run
- `create_api_test` — Create a new API synthetic test

### RUM (2 tools)

- `search_rum_events` — Search Real User Monitoring events (sessions, views, errors, actions)
- `aggregate_rum_events` — Aggregate RUM data for analytics

### Security (3 tools)

- `list_security_signals` — List Cloud SIEM security signals
- `search_security_signals` — Search security signals
- `get_security_signal` — Get details of a security signal

### Downtimes (4 tools)

- `list_downtimes` — List scheduled downtimes
- `get_downtime` — Get downtime details
- `create_downtime` — Schedule a new downtime/maintenance window
- `cancel_downtime` — Cancel a scheduled downtime

## Datadog Query Syntax Guide

### Log Queries

- `service:web-app status:error` — Error logs from a service
- `@http.status_code:>=500` — Server errors
- `host:prod-* @duration:>1s` — Slow requests on prod hosts
- `source:nginx @http.url_details.path:/api/*` — API requests from nginx

### Metric Queries

- `avg:system.cpu.user{host:web-1}` — Average CPU for a host
- `sum:trace.servlet.request.hits{service:api}.as_rate()` — Request rate
- `max:system.mem.used{env:production} by {host}` — Memory usage by host
- `avg:trace.servlet.request.duration{service:api}` — Average latency

### Time Ranges

- `15m`, `30m`, `1h`, `4h`, `1d`, `7d`, `30d` — Relative time ranges
- `now-1h` — 1 hour ago to now

## Common Troubleshooting Scenarios

### High Error Rate

1. `get_triggered_monitors` — Check alerting monitors
2. `search_logs` with `status:error` — Find error messages
3. `query_metrics` with error rate metric — Quantify the problem
4. `search_traces` — Find error traces with stack traces
5. `create_incident` — Open an incident if needed

### Performance Degradation

1. `get_service_summary` — Check request rate, error rate, latency
2. `query_metrics` for CPU/memory — Check resource exhaustion
3. `search_traces` sorted by duration — Find slowest requests
4. `aggregate_logs` grouped by endpoint — Find slow endpoints

### Infrastructure Issues

1. `list_hosts` — Check host status
2. `query_metrics` for `system.cpu.*`, `system.mem.*`, `system.disk.*` — Resource metrics
3. `search_logs` for host-specific errors
4. `get_triggered_monitors` — Check infrastructure alerts
