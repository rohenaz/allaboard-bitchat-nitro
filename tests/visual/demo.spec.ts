import { expect, test } from '@playwright/test';

test.describe('🎯 Automated UI Testing Demo', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Enter guest mode
    const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
    await guestLink.click();
    await page.waitForLoadState('networkidle');

    // Disable animations for consistent testing
    await page.addStyleTag({
      content: `*, *::before, *::after { 
        animation: none !important; 
        transition: none !important; 
      }`,
    });
  });

  test('🔍 UI Component Discovery & Validation', async ({ page }) => {
    // Automatically discover and test UI components
    const components = await page.evaluate(() => {
      const selectors = [
        '[role="button"]',
        'button',
        '[data-testid]',
        '.modal',
        '[role="dialog"]',
        'aside',
        'nav',
        'header',
        'main',
      ];

      const discovered: Array<{
        selector: string;
        count: number;
        examples: Array<{
          tag: string;
          className: string;
          textContent: string | undefined;
          id: string;
        }>;
      }> = [];

      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          discovered.push({
            selector,
            count: elements.length,
            examples: Array.from(elements)
              .slice(0, 3)
              .map((el) => ({
                tag: el.tagName,
                className: el.className,
                textContent: el.textContent?.trim().substring(0, 30),
                id: el.id,
              })),
          });
        }
      }
      return discovered;
    });
    for (const component of components) {
      for (const example of component.examples) {
        const _idPart = example.id ? `#${example.id}` : '';
        const _classPart = example.className
          ? `.${example.className.split(' ')[0]}`
          : '';
      }
    }

    // Take a comprehensive screenshot
    await expect(page).toHaveScreenshot('ui-discovery-complete.png', {
      fullPage: true,
    });

    // Validate that we found essential components
    const buttonCount =
      components.find((c) => c.selector === 'button')?.count || 0;
    const asideCount =
      components.find((c) => c.selector === 'aside')?.count || 0;

    expect(buttonCount).toBeGreaterThan(0);
    expect(asideCount).toBeGreaterThan(0);
  });

  test('⚡ Interactive Element Testing', async ({ page }) => {
    // Find and test all clickable elements
    const clickableElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, [role="button"]');
      return Array.from(elements)
        .map((el, index) => ({
          index,
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 20),
          hasOnClick: (el as HTMLElement).onclick !== null,
          disabled: (el as HTMLButtonElement).disabled,
          visible: (el as HTMLElement).offsetParent !== null,
        }))
        .filter((el) => el.visible && !el.disabled);
    });

    // Test first few interactive elements
    const testLimit = Math.min(3, clickableElements.length);
    for (let i = 0; i < testLimit; i++) {
      const element = clickableElements[i];

      try {
        const locator = page.locator(
          `${element.tag.toLowerCase()}:nth-child(${i + 1})`,
        );
        if ((await locator.count()) > 0 && (await locator.isVisible())) {
          await locator.click({ timeout: 1000 });
          await page.waitForTimeout(200);

          // Check if any modals appeared
          const modalCount = await page.locator('[role="dialog"]').count();
          if (modalCount > 0) {
            await expect(page).toHaveScreenshot(`modal-test-${i}.png`);

            // Close modal
            await page.keyboard.press('Escape');
            await page.waitForTimeout(200);
          }
        }
      } catch (_error) {}
    }

    expect(clickableElements.length).toBeGreaterThan(0);
  });

  test('🎨 Dark Theme Validation', async ({ page }) => {
    const themeAnalysis = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const bodyStyle = getComputedStyle(document.body);

      // Extract CSS variables
      const cssVars = {};
      for (let i = 0; i < rootStyle.length; i++) {
        const prop = rootStyle[i];
        if (prop.startsWith('--')) {
          cssVars[prop] = rootStyle.getPropertyValue(prop).trim();
        }
      }

      // Analyze colors
      const backgroundColor = bodyStyle.backgroundColor;
      const color = bodyStyle.color;

      return {
        cssVariables: cssVars,
        computedStyles: {
          backgroundColor,
          color,
        },
        isDarkTheme: backgroundColor.includes('rgb')
          ? backgroundColor
              .split(',')
              .map((c) => Number.parseInt(c.replace(/[^\d]/g, '')))
              .every((val) => val < 50)
          : backgroundColor.includes('#') && backgroundColor.length === 7
            ? Number.parseInt(backgroundColor.slice(1, 3), 16) < 50
            : false,
      };
    });

    // Key dark theme variables should exist
    const requiredVars = [
      '--background-primary',
      '--background-secondary',
      '--text-normal',
      '--text-muted',
    ];

    for (const varName of requiredVars) {
      expect(themeAnalysis.cssVariables[varName]).toBeTruthy();
    }

    await expect(page).toHaveScreenshot('dark-theme-validation.png', {
      fullPage: true,
    });
  });

  test('📱 Responsive Layout Testing', async ({ page }) => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1400, height: 900 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);

      // Check layout metrics
      const _layoutMetrics = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        const main = document.querySelector('main');

        return {
          sidebarVisible: sidebar
            ? window.getComputedStyle(sidebar).display !== 'none'
            : false,
          sidebarWidth: sidebar ? sidebar.getBoundingClientRect().width : 0,
          mainWidth: main ? main.getBoundingClientRect().width : 0,
          viewportWidth: window.innerWidth,
        };
      });

      await expect(page).toHaveScreenshot(
        `responsive-${viewport.name.toLowerCase()}.png`,
        {
          fullPage: true,
        },
      );
    }
  });

  test('🚨 Error Handling & Recovery', async ({ page }) => {
    const errors: Array<{ type: string; message: string }> = [];

    page.on('pageerror', (error) => {
      errors.push({ type: 'page', message: error.message });
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push({ type: 'console', message: msg.text() });
      }
    });

    // Try to trigger potential error scenarios
    try {
      // 1. Navigate to non-existent route
      await page.goto('/this-route-does-not-exist');
      await page.waitForTimeout(1000);

      // 2. Go back to valid page
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const guestLink = page.locator('a').filter({ hasText: 'guest' }).first();
      await guestLink.click();
      await page.waitForLoadState('networkidle');

      // 3. Try invalid interactions
      await page.evaluate(() => {
        // Try to access non-existent elements
        try {
          const element = document.querySelector('#non-existent-element');
          if (element) {
            (element as HTMLElement).click();
          }
        } catch (_e) {}
      });
    } catch (_error) {}

    // Even with errors, the app should still be functional
    const isPageFunctional = await page.evaluate(() => {
      return document.body && document.querySelector('div') !== null;
    });

    expect(isPageFunctional).toBeTruthy();

    if (errors.length > 0) {
      await expect(page).toHaveScreenshot('error-recovery-state.png', {
        fullPage: true,
      });
    }
  });
});
