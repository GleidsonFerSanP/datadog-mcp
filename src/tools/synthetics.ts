import { DatadogClient } from '../client/datadog-client.js';
import { truncateResults } from '../utils/formatters.js';
import { handleAPIError } from '../utils/error-handler.js';

export const syntheticsTools = [
  {
    name: 'list_synthetics_tests',
    description: "List all Datadog Synthetic tests. Returns test name, type (API/browser), status, and last result. Useful for monitoring external endpoints and user flows.",
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'get_synthetics_test',
    description: "Get detailed configuration and status of a specific Synthetic test by its public ID.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        public_id: { type: 'string', description: 'The public ID of the Synthetic test' },
      },
      required: ['public_id'],
    },
  },
  {
    name: 'get_synthetics_results',
    description: "Get recent results/executions of a specific Synthetic test. Shows pass/fail status, response times, and errors.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        public_id: { type: 'string', description: 'The public ID of the Synthetic test' },
      },
      required: ['public_id'],
    },
  },
  {
    name: 'trigger_synthetics_test',
    description: "Manually trigger a Datadog Synthetic test execution. Useful for on-demand testing of endpoints or user flows.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        public_id: { type: 'string', description: 'The public ID of the Synthetic test to trigger' },
      },
      required: ['public_id'],
    },
  },
  {
    name: 'create_api_test',
    description: "Create a new Datadog Synthetic API test. Configure HTTP endpoint monitoring with assertions for status code, response time, and body content.",
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Test name' },
        subtype: { type: 'string', enum: ['http', 'ssl', 'dns', 'tcp', 'icmp'], description: 'API test subtype', default: 'http' },
        url: { type: 'string', description: 'URL to test' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH'], description: 'HTTP method', default: 'GET' },
        headers: { type: 'object', description: 'Request headers as key-value pairs' },
        assertions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Assertion type (e.g., "statusCode", "responseTime", "body")' },
              operator: { type: 'string', description: 'Comparison operator (e.g., "is", "lessThan", "contains")' },
              target: { description: 'Expected value' },
            },
          },
          description: 'Test assertions',
        },
        locations: { type: 'array', items: { type: 'string' }, description: 'Locations to run from (e.g., ["aws:us-east-1"])' },
        message: { type: 'string', description: 'Notification message on failure' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the test' },
      },
      required: ['name', 'url'],
    },
  },
];

export async function handleSyntheticsTool(name: string, args: any, client: DatadogClient): Promise<string> {
  try {
    switch (name) {
      case 'list_synthetics_tests': {
        const result = await client.get<any>('/api/v1/synthetics/tests');
        const tests = result.tests || [];

        if (tests.length === 0) return 'No Synthetic tests found.';

        const { data, truncated, total } = truncateResults(tests, 50);
        const formatted = data.map((t: any) => {
          const name = t.name || 'Unnamed';
          const type = t.type || 'N/A';
          const status = t.status || 'N/A';
          const publicId = t.public_id || 'N/A';
          const statusEmoji = status === 'live' ? '🟢' : status === 'paused' ? '⏸️' : '❓';
          return `  ${statusEmoji} ${name} (${publicId}) — Type: ${type} — Status: ${status}`;
        }).join('\n');

        return `Synthetic Tests (${total})${truncated ? ` (showing first ${data.length})` : ''}:\n${formatted}`;
      }

      case 'get_synthetics_test': {
        const result = await client.get<any>(`/api/v1/synthetics/tests/${args.public_id}`);

        return [
          `Synthetic Test: ${result.name || 'Unnamed'}`,
          `  Public ID: ${result.public_id}`,
          `  Type: ${result.type}`,
          `  Subtype: ${result.subtype || 'N/A'}`,
          `  Status: ${result.status}`,
          `  URL: ${result.config?.request?.url || 'N/A'}`,
          `  Method: ${result.config?.request?.method || 'N/A'}`,
          `  Locations: ${(result.locations || []).join(', ') || 'N/A'}`,
          `  Tags: ${(result.tags || []).join(', ') || 'none'}`,
          `  Message: ${result.message || 'N/A'}`,
          `  Assertions: ${(result.config?.assertions || []).length}`,
        ].join('\n');
      }

      case 'get_synthetics_results': {
        const result = await client.get<any>(`/api/v1/synthetics/tests/${args.public_id}/results`);
        const results = result.results || [];

        if (results.length === 0) return `No results found for test ${args.public_id}.`;

        const formatted = results.slice(0, 10).map((r: any) => {
          const status = r.status === 0 ? '✅ Pass' : '❌ Fail';
          const checkTime = r.check_time ? new Date(r.check_time * 1000).toISOString() : 'N/A';
          const responseTime = r.result?.timings?.total ? `${r.result.timings.total}ms` : 'N/A';
          return `  ${status} — ${checkTime} — Response: ${responseTime}`;
        }).join('\n');

        return `Recent Results for ${args.public_id} (${Math.min(results.length, 10)} shown):\n${formatted}`;
      }

      case 'trigger_synthetics_test': {
        const body = {
          tests: [{ public_id: args.public_id }],
        };

        const result = await client.post<any>('/api/v1/synthetics/tests/trigger', body);
        const triggered = result.triggered_check_ids || [];
        return `✅ Synthetic test triggered!\n  Public ID: ${args.public_id}\n  Triggered IDs: ${triggered.join(', ') || 'pending'}`;
      }

      case 'create_api_test': {
        const assertions = args.assertions || [
          { type: 'statusCode', operator: 'is', target: 200 },
          { type: 'responseTime', operator: 'lessThan', target: 5000 },
        ];

        const body = {
          name: args.name,
          type: 'api',
          subtype: args.subtype || 'http',
          config: {
            request: {
              url: args.url,
              method: args.method || 'GET',
              headers: args.headers || {},
            },
            assertions,
          },
          locations: args.locations || ['aws:us-east-1'],
          options: {
            tick_every: 300,
            min_failure_duration: 0,
            min_location_failed: 1,
          },
          message: args.message || '',
          tags: args.tags || [],
          status: 'live',
        };

        const result = await client.post<any>('/api/v1/synthetics/tests/api', body);
        return `✅ Synthetic API test created!\n  Name: ${result.name}\n  Public ID: ${result.public_id}\n  URL: ${args.url}`;
      }

      default:
        return `Unknown synthetics tool: ${name}`;
    }
  } catch (error) {
    handleAPIError(error, name);
  }
}
