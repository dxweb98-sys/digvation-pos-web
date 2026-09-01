import { expect, test } from '@playwright/test';

test('cashier foundation boots with mock auth and runtime config', async ({ page }) => {
  await page.goto('/sell');

  await expect(page.getByRole('heading', { name: /Foundation ready/i })).toBeVisible();
  await expect(page.getByText('Development User')).toBeVisible();
  await expect(page.getByText('Not selected yet')).toBeVisible();
});
