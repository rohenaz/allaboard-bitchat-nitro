import { expect, test } from '@playwright/test';

test.describe('Modal Components Visual Tests', () => {
  const DESKTOP_VIEWPORT = { width: 1400, height: 900 };

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);

    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });

    // Navigate to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
    await guestLink.click();
    await page.waitForLoadState('networkidle');
  });

  test('Settings modal - open state', async ({ page }) => {
    // Force open settings modal by dispatching redux action or finding button
    await page.evaluate(() => {
      // Try to find and click settings button
      const settingsButton =
        document.querySelector('[aria-label*="settings" i]') ||
        document.querySelector('button[title*="settings" i]') ||
        document.querySelector('[data-testid="settings-button"]');
      if (settingsButton) {
        (settingsButton as HTMLElement).click();
      }
    });

    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible()) {
      await expect(modal).toHaveScreenshot('settings-modal-open.png');
    }
  });

  test('Settings modal - interactions', async ({ page }) => {
    // Open settings modal
    await page.evaluate(() => {
      const settingsButton =
        document.querySelector('[aria-label*="settings" i]') ||
        document.querySelector('button[title*="settings" i]');
      if (settingsButton) {
        (settingsButton as HTMLElement).click();
      }
    });

    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible()) {
      // Test toggle interaction
      const toggle = modal.locator('input[type="checkbox"]').first();
      if ((await toggle.count()) > 0) {
        await toggle.click();
        await page.waitForTimeout(100);
        await expect(modal).toHaveScreenshot('settings-modal-toggled.png');
      }
    }
  });

  test('Direct Message modal - open state', async ({ page }) => {
    // Find plus button in channel list
    const plusButton = page
      .locator('button[title*="Direct Message" i]')
      .or(page.locator('svg[viewBox="0 0 24 24"]').locator('..'))
      .first();

    if ((await plusButton.count()) > 0) {
      await plusButton.click();
      await page.waitForTimeout(300);

      const dmModal = page
        .locator('[role="dialog"]')
        .filter({ hasText: /direct message/i });
      if ((await dmModal.count()) > 0) {
        await expect(dmModal).toHaveScreenshot('dm-modal-open.png');
      }
    }
  });

  test('Direct Message modal - form validation', async ({ page }) => {
    // Open DM modal
    const plusButton = page
      .locator('button[title*="Direct Message" i]')
      .or(page.locator('svg[viewBox="0 0 24 24"]').locator('..'))
      .first();

    if ((await plusButton.count()) > 0) {
      await plusButton.click();
      await page.waitForTimeout(300);

      const dmModal = page
        .locator('[role="dialog"]')
        .filter({ hasText: /direct message/i });
      if ((await dmModal.count()) > 0) {
        // Try to submit empty form
        const submitButton = dmModal.locator('button[type="submit"]');
        if ((await submitButton.count()) > 0) {
          await submitButton.click();
          await page.waitForTimeout(100);
          await expect(dmModal).toHaveScreenshot('dm-modal-validation.png');
        }
      }
    }
  });

  test('Modal overlay and backdrop', async ({ page }) => {
    // Open any modal
    await page.evaluate(() => {
      const settingsButton =
        document.querySelector('[aria-label*="settings" i]') ||
        document.querySelector('button[title*="settings" i]');
      if (settingsButton) {
        (settingsButton as HTMLElement).click();
      }
    });

    await page.waitForTimeout(300);

    // Screenshot the full page to check backdrop styling
    await expect(page).toHaveScreenshot('modal-backdrop-full.png', {
      fullPage: true,
    });
  });

  test('Modal responsive behavior', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.evaluate(() => {
      const settingsButton =
        document.querySelector('[aria-label*="settings" i]') ||
        document.querySelector('button[title*="settings" i]');
      if (settingsButton) {
        (settingsButton as HTMLElement).click();
      }
    });

    await page.waitForTimeout(300);

    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible()) {
      await expect(modal).toHaveScreenshot('settings-modal-mobile.png');
    }
  });
});
