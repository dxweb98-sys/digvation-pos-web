import { ApiError } from './api-error';
import type { ApiEnvelope, ApiFailureEnvelope } from './api.types';

export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => Promise<string | null>;
}

export class ApiClient {
  public constructor(private readonly options: ApiClientOptions) {}

  public get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(path, { method: 'GET', signal: signal ?? null });
  }

  public post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      signal: signal ?? null,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const token = await this.options.getAccessToken?.();
    const headers = new Headers(init.headers);

    if (token) headers.set('authorization', `Bearer ${token}`);

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      credentials: 'omit',
      headers,
    });

    const payload = (await response.json()) as ApiEnvelope<T> | ApiFailureEnvelope;

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
