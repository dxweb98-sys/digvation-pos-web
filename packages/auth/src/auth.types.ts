export interface AuthIdentity {
  userId: string;
  displayName: string;
  email?: string;
  initials?: string;
  avatarUrl?: string;
  workspace: string;
  permissions: readonly string[];
}

export interface AuthSession {
  identity: AuthIdentity;
}

export interface AuthLoginInput {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthPasswordChangeRequestInput {
  email: string;
}

export interface AuthPort {
  me(): Promise<AuthSession | null>;
  login(input: AuthLoginInput): Promise<AuthSession>;
  logout(): Promise<void>;
  requestPasswordChange(input: AuthPasswordChangeRequestInput): Promise<void>;
  getAccessToken(): Promise<string | null>;
}
