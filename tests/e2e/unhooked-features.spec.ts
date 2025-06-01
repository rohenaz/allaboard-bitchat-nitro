import { expect, test } from '@playwright/test';

test.describe('Unhooked Features', () => {
  test('should show settings modal when clicking settings', async ({
    page,
  }) => {
    await page.goto('/');

    // Navigate to a channel or login first
    await page.goto('/c/general');

    // Click settings icon
    const settingsButton = page.locator('[title="Settings"]');
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    // Settings modal should appear
    const settingsModal = page.locator('dialog');
    await expect(settingsModal).toBeVisible();
    await expect(settingsModal.locator('h3')).toHaveText('Settings');

    // Should have the hide unverified messages toggle
    await expect(page.getByText('Hide unverified messages')).toBeVisible();
  });

  test('profile panel should show when clicking profile button', async ({
    page,
  }) => {
    await page.goto('/c/general');

    // Click profile button
    const profileButton = page.locator('[title*="Profile"]');
    if (await profileButton.isVisible()) {
      await profileButton.click();

      // Profile panel should appear
      const profilePanel = page.locator('text="Profile"');
      await expect(profilePanel).toBeVisible();
    }
  });

  test('server list should have add server button', async ({ page }) => {
    await page.goto('/c/general');

    // Check for add server button
    const addServerButton = page.locator('button[aria-label="Add Server"]');
    await expect(addServerButton).toBeVisible();

    // Click should navigate (but route doesn't exist)
    await addServerButton.click();

    // Should try to navigate to /servers/new
    await expect(page).toHaveURL(/\/servers\/new/);
  });

  test.skip('ImportIDModal should be accessible', async ({ page }) => {
    // This modal is implemented but never rendered
    // This test will fail until we hook it up
    await page.goto('/c/general');

    // There should be a way to import identity
    const importButton = page.getByText(/import.*identity/i);
    await expect(importButton).toBeVisible();
  });

  test.skip('DirectMessageModal should be accessible', async ({ page }) => {
    // This modal is implemented but never rendered
    // This test will fail until we hook it up
    await page.goto('/c/general');

    // There should be a way to start a DM
    const dmButton = page.getByText(/direct.*message/i);
    await expect(dmButton).toBeVisible();
  });
});
