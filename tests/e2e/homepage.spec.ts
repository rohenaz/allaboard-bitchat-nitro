import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display login button', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle('BitChat Nitro');

    // Check for login button
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Click login button
    await page.getByRole('button', { name: /login/i }).click();

    // Should be on login page
    await expect(page).toHaveURL('/login');

    // Check for wallet options
    await expect(page.getByText('Yours Wallet')).toBeVisible();
    await expect(page.getByText('HandCash')).toBeVisible();
  });
});
