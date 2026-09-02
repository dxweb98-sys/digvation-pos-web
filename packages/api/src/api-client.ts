import { ApiError } from './api-error';
import type { ApiEnvelope, ApiFailureEnvelope } from './api.types';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null>;
  handleUnauthorized?: (retryExhausted: boolean) => Promise<boolean>;
}

export interface ApiRequestOptions {
  signal?: AbortSignal | undefined;
  headers?: HeadersInit | undefined;
}

export class ApiClient {
  public constructor(private readonly options: ApiClientOptions) {}

  public get<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    return this.request<T>(path, {
      method: 'GET',
      signal: options.signal ?? null,
      headers: new Headers(options.headers),
    });
  }

  public post<T>(path: string, body: unknown, options: ApiRequestOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('content-type', 'application/json');

    return this.request<T>(path, {
      method: 'POST',
      signal: options.signal ?? null,
      headers,
      body: JSON.stringify(body),
    });
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    retryAfterUnauthorized = true,
  ): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const headers = new Headers(init.headers);

    if (token) headers.set('authorization', `Bearer ${token}`);

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      credentials: 'omit',
      headers,
    });

    const payload = (await response.json()) as ApiEnvelope<T> | ApiFailureEnvelope;

    if (response.status === 401 && this.options.handleUnauthorized) {
      const retryExhausted = !retryAfterUnauthorized;
      if ((await this.options.handleUnauthorized(retryExhausted)) && !retryExhausted) {
        return this.request<T>(path, init, false);
      }
    }

    if (!response.ok || !payload.success) {
      if (!payload.success) {
        throw new ApiError(
          response.status,
          payload.error.code,
          payload.error.message,
          payload.request_id,
        );
      }

      throw new ApiError(response.status, 'UNKNOWN_API_ERROR', 'Unexpected API failure.');
    }

    return payload.data;
  }
}
