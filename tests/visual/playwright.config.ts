import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'visual-report' }],
    ['json', { outputFile: 'visual-results.json' }],
  ],

  // Global test options
  use: {
    baseURL: 'http://localhost:5176',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium-visual',
      use: {
        ...devices['Desktop Chrome'],
        // Ensure consistent rendering
        viewport: { width: 1400, height: 900 },
        deviceScaleFactor: 1,
        hasTouch: false,
        colorScheme: 'dark',
      },
    },

    // Uncomment for cross-browser testing
    // {
    //   name: 'firefox-visual',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1400, height: 900 },
    //   },
    // },

    // {
    //   name: 'webkit-visual',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1400, height: 900 },
    //   },
    // },
  ],

  // Configure visual comparison
  expect: {
    // More lenient for visual tests due to font rendering differences
    toHaveScreenshot: {
      maxDiffPixels: 100,
      animations: 'disabled' as const,
      scale: 'css' as const,
    },
    toMatchSnapshot: {
      maxDiffPixels: 100,
    },
  },

  // Web server for local development
  webServer: {
    command: 'cd ../../ && bun run dev',
    url: 'http://localhost:5176',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
