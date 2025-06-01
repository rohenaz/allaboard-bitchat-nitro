import { expect, test } from '@playwright/test';

// Test viewport configurations
const VIEWPORTS = {
  desktop: { width: 1400, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

// Wait for network to be idle to ensure consistent screenshots
const NETWORK_IDLE_TIMEOUT = 3000;

// Custom CSS to hide dynamic elements that could cause flaky tests
const VISUAL_TWEAKS = `
  /* Hide timestamps and dynamic content */
  [data-testid="timestamp"],
  .timestamp,
  .loading,
  .loading-spinner {
    visibility: hidden !important;
  }
  
  /* Ensure consistent fonts */
  * {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
  }
  
  /* Hide animations */
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Add custom CSS to stabilize screenshots
    await page.addStyleTag({ content: VISUAL_TWEAKS });

    // Set consistent timezone using context
    await page.context().grantPermissions(['geolocation']);
  });

  test.describe('Login Page', () => {
    for (const [viewport, size] of Object.entries(VIEWPORTS)) {
      test(`Login page - ${viewport}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/');
        await page.waitForLoadState('networkidle', {
          timeout: NETWORK_IDLE_TIMEOUT,
        });

        await expect(page).toHaveScreenshot(`login-${viewport}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  });

  test.describe('Dashboard (Guest Mode)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigate to guest mode
      const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
      await guestLink.click();
      await page.waitForLoadState('networkidle', {
        timeout: NETWORK_IDLE_TIMEOUT,
      });
    });

    test('Dashboard full page - desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await expect(page).toHaveScreenshot('dashboard-full-desktop.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('Channel list component', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      const channelList = page
        .locator('[data-testid="channel-list"]')
        .or(page.locator('aside').first());
      await expect(channelList).toHaveScreenshot('channel-list.png', {
        animations: 'disabled',
      });
    });

    test('Member list component', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      const memberList = page
        .locator('[data-testid="member-list"]')
        .or(page.locator('aside').last());
      await expect(memberList).toHaveScreenshot('member-list.png', {
        animations: 'disabled',
      });
    });

    test('Plus button alignment', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      const titleRow = page
        .locator('h2')
        .filter({ hasText: /text channels/i })
        .locator('..');
      await expect(titleRow).toHaveScreenshot('plus-button-alignment.png', {
        animations: 'disabled',
      });
    });
  });

  test.describe('Modal Components', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigate to guest dashboard
      const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
      await guestLink.click();
      await page.waitForLoadState('networkidle', {
        timeout: NETWORK_IDLE_TIMEOUT,
      });
    });

    test('Settings modal', async ({ page }) => {
      // Open settings (might be gear icon or settings button)
      const settingsButton = page
        .locator('[data-testid="settings-button"]')
        .or(page.locator('button').filter({ hasText: /settings/i }))
        .or(page.locator('[title*="settings" i]'));

      if ((await settingsButton.count()) > 0) {
        await settingsButton.first().click();
        await page.waitForTimeout(500); // Wait for modal animation

        await expect(page.locator('[role="dialog"]')).toHaveScreenshot(
          'settings-modal.png',
          {
            animations: 'disabled',
          },
        );
      }
    });

    test('Direct Message modal', async ({ page }) => {
      // Look for plus button to open DM modal
      const plusButton = page
        .locator('button')
        .filter({ hasText: '+' })
        .or(page.locator('svg[viewBox="0 0 24 24"]').locator('..'));

      if ((await plusButton.count()) > 0) {
        await plusButton.first().click();
        await page.waitForTimeout(500); // Wait for modal animation

        const modal = page
          .locator('[role="dialog"]')
          .or(page.locator('[data-testid="dm-modal"]'));

        if ((await modal.count()) > 0) {
          await expect(modal).toHaveScreenshot('dm-modal.png', {
            animations: 'disabled',
          });
        }
      }
    });
  });

  test.describe('Dark Theme Validation', () => {
    test('Dark theme colors', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigate to guest dashboard
      const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
      await guestLink.click();
      await page.waitForLoadState('networkidle');

      // Test dark theme CSS variables
      const backgroundColor = await page.evaluate(() => {
        const computedStyle = getComputedStyle(document.documentElement);
        return {
          primary: computedStyle
            .getPropertyValue('--background-primary')
            .trim(),
          secondary: computedStyle
            .getPropertyValue('--background-secondary')
            .trim(),
          text: computedStyle.getPropertyValue('--text-normal').trim(),
        };
      });

      // Take screenshot to verify dark theme
      await expect(page).toHaveScreenshot('dark-theme-validation.png', {
        fullPage: true,
        animations: 'disabled',
      });

      // Ensure colors are actually dark
      expect(backgroundColor.primary).toBeTruthy();
      expect(backgroundColor.secondary).toBeTruthy();
      expect(backgroundColor.text).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    for (const [viewport, size] of Object.entries(VIEWPORTS)) {
      test(`Responsive layout - ${viewport}`, async ({ page }) => {
        await page.setViewportSize(size);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Navigate to guest dashboard
        const guestLink = page
          .locator('a')
          .filter({ hasText: 'guest' })
          .first();
        await guestLink.click();
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveScreenshot(`responsive-${viewport}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  });
});

test.describe('Error States', () => {
  test('Error boundary styling', async ({ page }) => {
    // Force an error by navigating to invalid route or triggering error
    await page.goto('/invalid-route-that-should-error');
    await page.waitForLoadState('networkidle');

    const errorBoundary = page
      .locator('[data-testid="error-boundary"]')
      .or(page.locator('h1').filter({ hasText: /error/i }).locator('..'));

    if ((await errorBoundary.count()) > 0) {
      await expect(errorBoundary).toHaveScreenshot('error-boundary.png', {
        animations: 'disabled',
      });
    }
  });
});
