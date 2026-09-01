export type DeploymentProfile = 'SHARED' | 'BUSINESS_ISOLATED' | 'DEDICATED';
export type BrandingMode = 'DIGVATION_DEFAULT' | 'WHITE_LABEL';

export interface BrandingConfig {
  mode: BrandingMode;
  productName: string;
  businessName?: string | undefined;
  logoUrl?: string | undefined;
  accentColor?: string | undefined;
}

export interface CapabilityConfig {
  notifications: boolean;
  fulfillment: boolean;
  customers: boolean;
  loyalty: boolean;
}

export interface RuntimeConfig {
  apiBaseUrl: string;
  workspace: string;
  locale: string;
  currency: string;
  defaultCountry: string;
  deploymentProfile: DeploymentProfile;
  branding: BrandingConfig;
  capabilities: CapabilityConfig;
}

export interface RuntimeConfigPort {
  load(): Promise<RuntimeConfig>;
}
