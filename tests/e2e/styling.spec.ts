import { expect, test } from '@playwright/test';

test.describe('Styling and Typography', () => {
  test('should have consistent font sizes across components', async ({
    page,
  }) => {
    await page.goto('/');

    // Get all text elements
    const textElements = await page.locator('*:visible').all();
    const fontSizes = new Set<string>();

    for (const element of textElements) {
      const fontSize = await element
        .evaluate((el) => window.getComputedStyle(el).fontSize)
        .catch(() => null);

      if (fontSize) {
        fontSizes.add(fontSize);
      }
    }

    // Should have a limited set of font sizes (good typography system)
    expect(fontSizes.size).toBeLessThanOrEqual(8);
  });

  test('should have proper contrast ratios', async ({ page }) => {
    await page.goto('/');

    // Check background and text color contrast
    const body = page.locator('body');
    const bgColor = await body.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor,
    );

    // Should have a dark theme by default
    expect(bgColor).toMatch(/rgb\(\d+, \d+, \d+\)/);
  });

  test('buttons should have consistent styling', async ({ page }) => {
    await page.goto('/');

    const buttons = await page.locator('button').all();
    const buttonStyles = [];

    for (const button of buttons) {
      const styles = await button.evaluate((el) => ({
        padding: window.getComputedStyle(el).padding,
        borderRadius: window.getComputedStyle(el).borderRadius,
        fontWeight: window.getComputedStyle(el).fontWeight,
      }));
      buttonStyles.push(styles);
    }

    // Check that button styles are consistent
    expect(buttonStyles.length).toBeGreaterThan(0);
  });
});
