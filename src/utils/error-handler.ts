export class DatadogAPIError extends Error {
  public readonly statusCode: number;
  public readonly endpoint: string;

  constructor(message: string, statusCode: number, endpoint: string) {
    super(message);
    this.name = 'DatadogAPIError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

export function handleAPIError(error: unknown, endpoint: string): never {
  if (error instanceof DatadogAPIError) {
    throw error;
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch')) {
      throw new DatadogAPIError(
        `Network error connecting to Datadog API at ${endpoint}. Check your internet connection and Datadog site configuration.`,
        0,
        endpoint,
      );
    }
    throw new DatadogAPIError(error.message, 0, endpoint);
  }

  throw new DatadogAPIError(String(error), 0, endpoint);
}

export function createAPIErrorFromStatus(statusCode: number, endpoint: string, body: string): DatadogAPIError {
  let message: string;

  switch (statusCode) {
    case 400:
      message = `Bad Request — The query or parameters sent to ${endpoint} are invalid. Check your query syntax and parameter values. Details: ${body}`;
      break;
    case 401:
      message = `Unauthorized — Invalid API Key. Verify your DD_API_KEY is correct and active.`;
      break;
    case 403:
      message = `Forbidden — Your API/Application key lacks permissions for ${endpoint}. Check your Datadog role and permissions.`;
      break;
    case 404:
      message = `Not Found — The resource at ${endpoint} does not exist. Verify the ID or path is correct.`;
      break;
    case 429:
      message = `Rate Limited — Too many requests to ${endpoint}. The request will be retried automatically.`;
      break;
    case 500:
      message = `Datadog Internal Server Error at ${endpoint}. This is a Datadog-side issue. Try again later.`;
      break;
    case 503:
      message = `Datadog Service Unavailable at ${endpoint}. The service may be under maintenance. Try again later.`;
      break;
    default:
      message = `Datadog API error (HTTP ${statusCode}) at ${endpoint}: ${body}`;
  }

  return new DatadogAPIError(message, statusCode, endpoint);
}
