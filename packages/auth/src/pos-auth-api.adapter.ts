import type {
  AuthIdentity,
  AuthPort,
  AuthRequestAuthorizer,
  AuthSession,
  LoginCredentials,
} from './auth.types';

const STORAGE_KEY = 'digvation.pos.auth.session.v1';

interface AuthApiEnvelope<T> {
  success: true;
  data: T;
}

interface AuthApiFailureEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
  };
  request_id: string;
}

interface SessionResponse {
  tokenType: 'Bearer';
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: string;
  refreshExpiresAt: string;
}

interface CurrentUserResponse {
  id: string;
  displayName: string;
  roles: Array<{
    permissions: string[];
  }>;
}

type StoredSession = SessionResponse;

export interface PosAuthApiAdapterOptions {
  baseUrl: string;
  workspace: string;
  storage?: Storage;
}

export class PosAuthApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'PosAuthApiError';
  }
}

export class PosAuthApiAdapter implements AuthPort {
  private readonly baseUrl: string;
  private readonly workspace: string;
  private readonly storage: Storage;
  private readonly listeners = new Set<(session: AuthSession | null) => void>();
  private session: AuthSession | null = null;
  private refreshTask: Promise<boolean> | null = null;

  public readonly requestAuthorizer: AuthRequestAuthorizer = {
    getAccessToken: () => this.getAccessToken(),
    handleUnauthorized: (retryExhausted) =>
      retryExhausted ? this.expireSession() : this.refreshSession(),
  };

  public constructor({
    baseUrl,
    workspace,
    storage = globalThis.sessionStorage,
  }: PosAuthApiAdapterOptions) {
    this.baseUrl = baseUrl;
    this.workspace = workspace;
    this.storage = storage;
  }

  public async login(credentials: LoginCredentials): Promise<AuthSession> {
    const issued = await this.request<SessionResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: credentials,
    });

    this.writeStoredSession(issued);

    try {
      return await this.me();
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  public async restoreSession(): Promise<AuthSession | null> {
    if (!this.readStoredSession()) return null;

    try {
      return await this.me();
    } catch (error) {
      if (isAuthenticationFailure(error)) {
        this.clearSession();
        return null;
      }

      throw error;
    }
  }

  public async me(): Promise<AuthSession> {
    const stored = this.readStoredSession();
    const accessExpired = stored ? hasExpired(stored.accessExpiresAt) : false;
    const token = await this.getAccessToken();
    if (!token) throw new PosAuthApiError(401, 'AUTH_SESSION_MISSING', 'Sign in is required.');
    if (accessExpired && this.session) return this.session;

    try {
      return await this.loadCurrentUser(token);
    } catch (error) {
      if (!isAuthenticationFailure(error) || !(await this.refreshSession())) throw error;

      const refreshedSession = this.session;
      if (!refreshedSession)
        throw new PosAuthApiError(401, 'AUTH_SESSION_EXPIRED', 'Your session has expired.');

      return refreshedSession;
    }
  }

  public async logout(): Promise<void> {
    const stored = this.readStoredSession();

    try {
      if (stored)
        await this.request('/api/v1/auth/logout', {
          method: 'POST',
          body: { refreshToken: stored.refreshToken },
        });
    } finally {
      this.clearSession();
    }
  }

  public subscribeSession(listener: (session: AuthSession | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async getAccessToken(): Promise<string | null> {
    const stored = this.readStoredSession();
    if (!stored) return null;

    if (!hasExpired(stored.accessExpiresAt)) return stored.accessToken;
    if (!(await this.refreshSession())) return null;

    return this.readStoredSession()?.accessToken ?? null;
  }

  private async refreshSession(): Promise<boolean> {
    if (!this.refreshTask) {
      this.refreshTask = this.rotateSession().finally(() => {
        this.refreshTask = null;
      });
    }

    return this.refreshTask;
  }

  private async expireSession(): Promise<boolean> {
    this.clearSession();
    return false;
  }

  private async rotateSession(): Promise<boolean> {
    const stored = this.readStoredSession();
    if (!stored || hasExpired(stored.refreshExpiresAt)) {
      this.clearSession();
      return false;
    }

    try {
      const rotated = await this.request<SessionResponse>('/api/v1/auth/refresh', {
        method: 'POST',
        body: { refreshToken: stored.refreshToken },
      });
      this.writeStoredSession(rotated);
      await this.loadCurrentUser(rotated.accessToken);
      return true;
    } catch (error) {
      if (isAuthenticationFailure(error)) {
        this.clearSession();
        return false;
      }

      throw error;
    }
  }

  private async loadCurrentUser(accessToken: string): Promise<AuthSession> {
    const user = await this.request<CurrentUserResponse>('/api/v1/auth/me', {
      method: 'GET',
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const session = {
      identity: toAuthIdentity(user, this.workspace),
    };

    this.session = session;
    this.notifySession();
    return session;
  }

  private async request<T>(
    path: string,
    init: { method: 'GET' | 'POST'; body?: unknown; headers?: HeadersInit },
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body !== undefined) headers.set('content-type', 'application/json');

    const requestInit: RequestInit = {
      method: init.method,
      headers,
      credentials: 'omit',
    };
    if (init.body !== undefined) requestInit.body = JSON.stringify(init.body);

    const response = await fetch(`${this.baseUrl}${path}`, requestInit);
    const payload = (await response.json()) as AuthApiEnvelope<T> | AuthApiFailureEnvelope;

    if (!response.ok || !payload.success) {
      if (!payload.success)
        throw new PosAuthApiError(
          response.status,
          payload.error.code,
          payload.error.message,
          payload.request_id,
        );

      throw new PosAuthApiError(response.status, 'UNKNOWN_API_ERROR', 'Unexpected API failure.');
    }

    return payload.data;
  }

  private readStoredSession(): StoredSession | null {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      const value: unknown = JSON.parse(raw);
      if (!isStoredSession(value)) {
        this.clearSession();
        return null;
      }

      return value;
    } catch {
      this.clearSession();
      return null;
    }
  }

  private writeStoredSession(session: SessionResponse): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private clearSession(): void {
    this.storage.removeItem(STORAGE_KEY);
    if (this.session !== null) {
      this.session = null;
      this.notifySession();
    }
  }

  private notifySession(): void {
    for (const listener of this.listeners) listener(this.session);
  }
}

function toAuthIdentity(user: CurrentUserResponse, workspace: string): AuthIdentity {
  return {
    userId: user.id,
    displayName: user.displayName,
    workspace,
    permissions: [...new Set(user.roles.flatMap((role) => role.permissions))].sort(),
  };
}

function hasExpired(value: string): boolean {
  const expiry = Date.parse(value);
  return !Number.isFinite(expiry) || expiry <= Date.now();
}

function isAuthenticationFailure(error: unknown): error is PosAuthApiError {
  return error instanceof PosAuthApiError && (error.status === 401 || error.status === 403);
}

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Record<string, unknown>;
  return (
    candidate.tokenType === 'Bearer' &&
    typeof candidate.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.accessExpiresAt === 'string' &&
    typeof candidate.refreshExpiresAt === 'string'
  );
}
