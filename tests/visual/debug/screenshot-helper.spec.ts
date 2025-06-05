import { expect, test } from '@playwright/test';

test.describe('Debug Screenshot Helpers', () => {
  const VIEWPORTS = [
    { name: 'desktop', width: 1400, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ];

  test.describe('Component State Screenshots', () => {
    test('Capture all modal states', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });

      // Navigate to dashboard
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
      await guestLink.click();
      await page.waitForLoadState('networkidle');

      // Disable animations
      await page.addStyleTag({
        content: `*, *::before, *::after { 
          animation-duration: 0s !important; 
          transition-duration: 0s !important; 
        }`,
      });

      // Screenshot 1: Default state
      await expect(page).toHaveScreenshot('debug-default-state.png', {
        fullPage: true,
      });

      // Screenshot 2: Try to open settings modal
      try {
        await page.evaluate(() => {
          const settingsBtn =
            document.querySelector('button[aria-label*="settings" i]') ||
            document.querySelector('[data-testid="settings-button"]') ||
            Array.from(document.querySelectorAll('button')).find((btn) =>
              btn.textContent?.toLowerCase().includes('settings'),
            );
          if (settingsBtn) (settingsBtn as HTMLElement).click();
        });
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot('debug-settings-modal.png', {
          fullPage: true,
        });
      } catch (_e) {}

      // Screenshot 3: Try to open DM modal
      try {
        // Close any open modal first
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);

        const plusButton = page
          .locator('svg[viewBox="0 0 24 24"]')
          .locator('..')
          .first();
        if ((await plusButton.count()) > 0) {
          await plusButton.click();
          await page.waitForTimeout(500);
          await expect(page).toHaveScreenshot('debug-dm-modal.png', {
            fullPage: true,
          });
        }
      } catch (_e) {}
    });

    test('Component debugging - element inspection', async ({ page }) => {
      await page.setViewportSize({ width: 1400, height: 900 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
      await guestLink.click();
      await page.waitForLoadState('networkidle');

      // Debug: Log all interactive elements
      const _interactiveElements = await page.evaluate(() => {
        const elements = document.querySelectorAll(
          'button, a, input, [role="button"]',
        );
        return Array.from(elements)
          .map((el) => ({
            tag: el.tagName,
            className: el.className,
            textContent: el.textContent?.trim().substring(0, 50),
            ariaLabel: el.getAttribute('aria-label'),
            title: el.getAttribute('title'),
            dataTestId: el.getAttribute('data-testid'),
          }))
          .filter((el) => el.textContent || el.ariaLabel || el.title);
      });

      // Screenshot with element highlighting
      await page.addStyleTag({
        content: `
          button, a, input, [role="button"] {
            outline: 2px solid red !important;
            outline-offset: 2px !important;
          }
        `,
      });

      await expect(page).toHaveScreenshot('debug-elements-highlighted.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Performance and State Debug', () => {
    test('CSS variables inspection', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
      await guestLink.click();
      await page.waitForLoadState('networkidle');

      // Extract and log CSS variables
      const _cssVariables = await page.evaluate(() => {
        const computedStyle = getComputedStyle(document.documentElement);
        const variables: Record<string, string> = {};

        // Get all CSS custom properties
        for (let i = 0; i < computedStyle.length; i++) {
          const name = computedStyle[i];
          if (name.startsWith('--')) {
            variables[name] = computedStyle.getPropertyValue(name).trim();
          }
        }
        return variables;
      });

      // Test dark theme application
      const darkThemeTest = await page.evaluate(() => {
        const bg = getComputedStyle(document.documentElement)
          .getPropertyValue('--background-primary')
          .trim();
        const text = getComputedStyle(document.documentElement)
          .getPropertyValue('--text-normal')
          .trim();
        return {
          background: bg,
          text,
          isDark: bg.includes('1e1f22') || bg.includes('#1e1f22'),
        };
      });

      expect(darkThemeTest.isDark).toBeTruthy();
    });

    test('Error state capture', async ({ page }) => {
      // Test error boundaries by triggering errors
      const errors: string[] = [];

      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Try various interactions that might trigger errors
      try {
        const guestLink = page
          .locator('a')
          .filter({ hasText: 'guest' })
          .first();
        await guestLink.click();
        await page.waitForLoadState('networkidle');

        // Try clicking various buttons
        await page.click('button', { timeout: 1000 }).catch(() => {});
        await page.click('svg', { timeout: 1000 }).catch(() => {});

        // Navigate to invalid route
        await page.goto('/invalid-route', { timeout: 5000 }).catch(() => {});
      } catch (_e) {}

      if (errors.length > 0) {
        await expect(page).toHaveScreenshot('debug-error-state.png', {
          fullPage: true,
        });
      }
    });
  });

  test.describe('Multi-Viewport Debug', () => {
    for (const viewport of VIEWPORTS) {
      test(`Debug ${viewport.name} layout`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const guestLink = page
          .locator('a')
          .filter({ hasText: 'guest' })
          .first();
        await guestLink.click();
        await page.waitForLoadState('networkidle');

        // Highlight responsive breakpoints
        await page.addStyleTag({
          content: `
            body::before {
              content: "${viewport.name.toUpperCase()}: ${viewport.width}x${viewport.height}";
              position: fixed;
              top: 10px;
              right: 10px;
              background: red;
              color: white;
              padding: 5px 10px;
              z-index: 10000;
              font-family: monospace;
              font-size: 12px;
            }
          `,
        });

        await expect(page).toHaveScreenshot(
          `debug-${viewport.name}-layout.png`,
          {
            fullPage: true,
          },
        );
      });
    }
  });
});
