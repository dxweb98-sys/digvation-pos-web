export interface AuthIdentity {
  userId: string;
  displayName: string;
  workspace: string;
  permissions: readonly string[];
}

export interface AuthSession {
  identity: AuthIdentity;
}

export interface LoginCredentials {
  workspace: string;
  identifier: string;
  password: string;
}

export interface AuthRequestAuthorizer {
  getAccessToken(): Promise<string | null>;
  handleUnauthorized(retryExhausted: boolean): Promise<boolean>;
}

export interface AuthPort {
  readonly requestAuthorizer: AuthRequestAuthorizer;
  login(credentials: LoginCredentials): Promise<AuthSession>;
  restoreSession(): Promise<AuthSession | null>;
  me(): Promise<AuthSession>;
  logout(): Promise<void>;
  subscribeSession(listener: (session: AuthSession | null) => void): () => void;
}
