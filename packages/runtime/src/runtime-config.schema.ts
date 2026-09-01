import { z } from 'zod';

export const runtimeConfigSchema = z.object({
  apiBaseUrl: z.string().min(1),
  workspace: z.string().min(1),
  locale: z.string().min(2),
  currency: z.string().regex(/^[A-Z]{3}$/),
  defaultCountry: z.string().regex(/^[A-Z]{2}$/),
  deploymentProfile: z.enum(['SHARED', 'BUSINESS_ISOLATED', 'DEDICATED']),
  branding: z.object({
    mode: z.enum(['DIGVATION_DEFAULT', 'WHITE_LABEL']),
    productName: z.string().min(1),
    businessName: z.string().min(1).optional(),
    logoUrl: z.string().min(1).optional(),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }),
  capabilities: z.object({
    notifications: z.boolean(),
    fulfillment: z.boolean(),
    customers: z.boolean(),
    loyalty: z.boolean(),
  }),
});
