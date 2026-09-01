import { describe, expect, it } from 'vitest';

import { runtimeConfigSchema } from './runtime-config.schema';

describe('runtime config schema', () => {
  it('keeps deployment topology and branding mode independent', () => {
    const parsed = runtimeConfigSchema.parse({
      apiBaseUrl: 'http://127.0.0.1:4003',
      workspace: 'digvation-demo',
      locale: 'id-ID',
      currency: 'IDR',
      defaultCountry: 'ID',
      deploymentProfile: 'DEDICATED',
      branding: {
        mode: 'WHITE_LABEL',
        productName: 'Point of Sale',
        businessName: 'Example Business',
      },
      capabilities: {
        notifications: false,
        fulfillment: false,
        customers: false,
        loyalty: false,
      },
    });

    expect(parsed.deploymentProfile).toBe('DEDICATED');
    expect(parsed.branding.mode).toBe('WHITE_LABEL');
  });
});
