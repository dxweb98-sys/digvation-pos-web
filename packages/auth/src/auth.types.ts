export interface AuthIdentity {
  userId: string;
  displayName: string;
  workspace: string;
  permissions: readonly string[];
}

export interface AuthSession {
  identity: AuthIdentity;
}

export interface AuthPort {
  me(): Promise<AuthSession>;
  logout(): Promise<void>;
}
