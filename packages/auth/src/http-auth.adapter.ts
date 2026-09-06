import { ApiClient, ApiError } from '@digvation/pos-api';

import type {
  AuthIdentity,
  AuthLoginInput,
  AuthPasswordChangeRequestInput,
  AuthPort,
  AuthSession,
} from './auth.types';

interface BackendSession {
  accessToken: string;
  refreshToken: string;
}

interface BackendAuthRole {
  permissions: string[];
}

interface BackendAuthUser {
  id: string;
  username: string | null;
  phoneE164: string;
  displayName: string;
  roles: BackendAuthRole[];
}

type RefreshStorage = 'local' | 'session';

/** POS AUTH-01 transport adapter. Access tokens remain in memory; only the opaque refresh token is persisted for session restoration. */
export class HttpAuthAdapter implements AuthPort {
  private readonly client: ApiClient;
  private readonly refreshStorageKey: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshStorage: RefreshStorage | null = null;

  public constructor(
    apiBaseUrl: string,
    private readonly workspace: string,
  ) {
    this.refreshStorageKey = `digvation-pos-auth:${workspace}:refresh-token`;
    this.restoreRefreshToken();
    this.client = new ApiClient({
      baseUrl: apiBaseUrl,
      getAccessToken: () => this.getAccessToken(),
    });
  }

  public async me(): Promise<AuthSession | null> {
    if (!this.accessToken && !(await this.refreshAccessToken())) return null;

    try {
      return this.toSession(await this.client.get<BackendAuthUser>('/api/v1/auth/me'));
    } catch (error) {
      if (!this.isUnauthorized(error)) throw error;
      if (!(await this.refreshAccessToken())) return null;
      try {
        return this.toSession(await this.client.get<BackendAuthUser>('/api/v1/auth/me'));
      } catch (retryError) {
        if (!this.isUnauthorized(retryError)) throw retryError;
        this.clearSession();
        return null;
      }
    }
  }

  public async login(input: AuthLoginInput): Promise<AuthSession> {
    const tokens = await this.client.post<BackendSession>('/api/v1/auth/login', {
      workspace: this.workspace,
      identifier: input.identifier,
      password: input.password,
    });
    this.setTokens(tokens, input.rememberMe ? 'local' : 'session');
    try {
      return this.toSession(await this.client.get<BackendAuthUser>('/api/v1/auth/me'));
    } catch (error) {
      if (this.isUnauthorized(error)) this.clearSession();
      throw error;
    }
  }

  public async logout(): Promise<void> {
    const refreshToken = this.refreshToken;
    this.clearSession();
    if (refreshToken) await this.client.post('/api/v1/auth/logout', { refreshToken });
  }

  public async requestPasswordChange(input: AuthPasswordChangeRequestInput): Promise<void> {
    await this.client.post('/api/v1/auth/password-reset/request', {
      workspace: this.workspace,
      identifier: input.email,
    });
  }

  public async getAccessToken(): Promise<string | null> {
    return this.accessToken;
  }

  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) return false;
    try {
      const tokens = await this.client.post<BackendSession>('/api/v1/auth/refresh', {
        refreshToken,
      });
      this.setTokens(tokens, this.refreshStorage ?? 'session');
      return true;
    } catch (error) {
      if (!this.isUnauthorized(error)) throw error;
      this.clearSession();
      return false;
    }
  }

  private setTokens(tokens: BackendSession, storage: RefreshStorage): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.refreshStorage = storage;
    this.persistRefreshToken(tokens.refreshToken, storage);
  }

  private clearSession(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshStorage = null;
    this.removeStoredRefreshTokens();
  }

  private restoreRefreshToken(): void {
    if (typeof window === 'undefined') return;
    try {
      const local = window.localStorage.getItem(this.refreshStorageKey);
      if (local) {
        this.refreshToken = local;
        this.refreshStorage = 'local';
        return;
      }
      const session = window.sessionStorage.getItem(this.refreshStorageKey);
      if (session) {
        this.refreshToken = session;
        this.refreshStorage = 'session';
      }
    } catch {
      this.refreshToken = null;
      this.refreshStorage = null;
    }
  }

  private persistRefreshToken(refreshToken: string, storage: RefreshStorage): void {
    if (typeof window === 'undefined') return;
    try {
      this.removeStoredRefreshTokens();
      const target = storage === 'local' ? window.localStorage : window.sessionStorage;
      target.setItem(this.refreshStorageKey, refreshToken);
    } catch {
      // Storage can be unavailable in hardened browser contexts. The in-memory session remains valid.
    }
  }

  private removeStoredRefreshTokens(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(this.refreshStorageKey);
      window.sessionStorage.removeItem(this.refreshStorageKey);
    } catch {
      // Best-effort cleanup when browser storage is unavailable.
    }
  }

  private isUnauthorized(error: unknown): boolean {
    return error instanceof ApiError && error.status === 401;
  }

  private toSession(user: BackendAuthUser): AuthSession {
    const permissions = [...new Set(user.roles.flatMap((role) => role.permissions))];
    const identity: AuthIdentity = {
      userId: user.id,
      displayName: user.displayName,
      email: user.username ?? user.phoneE164,
      workspace: this.workspace,
      permissions,
    };
    return { identity };
  }
}
