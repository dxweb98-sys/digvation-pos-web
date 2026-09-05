import { ApiClient } from '@digvation/pos-api';

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

/** POS AUTH-01 transport adapter. Tokens remain adapter-private and in memory. */
export class HttpAuthAdapter implements AuthPort {
  private readonly client: ApiClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  public constructor(
    apiBaseUrl: string,
    private readonly workspace: string,
  ) {
    this.client = new ApiClient({
      baseUrl: apiBaseUrl,
      getAccessToken: () => this.getAccessToken(),
    });
  }

  public async me(): Promise<AuthSession | null> {
    if (!this.accessToken) return null;
    try {
      return this.toSession(await this.client.get<BackendAuthUser>('/api/v1/auth/me'));
    } catch {
      this.accessToken = null;
      this.refreshToken = null;
      return null;
    }
  }

  public async login(input: AuthLoginInput): Promise<AuthSession> {
    const tokens = await this.client.post<BackendSession>('/api/v1/auth/login', {
      workspace: this.workspace,
      identifier: input.identifier,
      password: input.password,
    });
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    return this.toSession(await this.client.get<BackendAuthUser>('/api/v1/auth/me'));
  }

  public async logout(): Promise<void> {
    const refreshToken = this.refreshToken;
    this.accessToken = null;
    this.refreshToken = null;
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
