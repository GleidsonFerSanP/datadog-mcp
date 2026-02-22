import { DatadogCredentials, getBaseUrl } from './auth.js';
import { DatadogAPIError, createAPIErrorFromStatus, handleAPIError } from '../utils/error-handler.js';

export class DatadogClient {
  private readonly baseUrl: string;
  private readonly credentials: DatadogCredentials;

  constructor(credentials: DatadogCredentials) {
    this.credentials = credentials;
    this.baseUrl = getBaseUrl(credentials.site);
  }

  private buildHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
    return {
      'DD-API-KEY': this.credentials.apiKey,
      'DD-APPLICATION-KEY': this.credentials.appKey,
      'Content-Type': 'application/json',
      ...extraHeaders,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      params?: Record<string, string>;
      body?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (options?.params) {
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== '') {
          url.searchParams.set(key, value);
        }
      }
    }

    const endpoint = `${method} ${path}`;
    let lastError: unknown;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        console.error(`[Datadog MCP] ${endpoint}${attempt > 0 ? ` (retry ${attempt})` : ''}`);

        const response = await fetch(url.toString(), {
          method,
          headers: this.buildHeaders(options?.headers),
          body: options?.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const text = await response.text();
          if (!text) return {} as T;
          return JSON.parse(text) as T;
        }

        const errorBody = await response.text();

        if (response.status === 429 && attempt < 2) {
          const retryAfter = response.headers.get('X-RateLimit-Reset') ?? String(Math.pow(2, attempt + 1));
          const waitMs = (parseInt(retryAfter, 10) || Math.pow(2, attempt + 1)) * 1000;
          console.error(`[Datadog MCP] Rate limited. Waiting ${waitMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          lastError = createAPIErrorFromStatus(response.status, endpoint, errorBody);
          continue;
        }

        throw createAPIErrorFromStatus(response.status, endpoint, errorBody);
      } catch (error) {
        if (error instanceof DatadogAPIError) {
          if (error.statusCode !== 429) throw error;
          lastError = error;
        } else {
          handleAPIError(error, endpoint);
        }
      }
    }

    if (lastError instanceof DatadogAPIError) throw lastError;
    throw new DatadogAPIError(`Failed after 3 retries for ${endpoint}`, 429, endpoint);
  }

  async get<T>(path: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, { params, headers });
  }

  async post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', path, { body, headers });
  }

  async put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', path, { body, headers });
  }

  async patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', path, { body, headers });
  }

  async delete<T>(path: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', path, { params, headers });
  }
}
