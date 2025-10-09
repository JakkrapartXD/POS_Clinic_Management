import { defineConfig, devices } from '@playwright/test';

/**
 * Desktop-only test configuration
 * This configuration is optimized for desktop testing only
 */
export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/desktop-results.json' }],
    ['junit', { outputFile: 'test-results/desktop-results.xml' }]
  ],
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    // Desktop-specific viewport
    viewport: { width: 1920, height: 1080 },
    // Disable mobile-specific features
    hasTouch: false,
    isMobile: false,
  },

  /* Desktop browsers only - optimized for PC testing */
  projects: [
    {
      name: 'chrome-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Desktop-specific settings
        hasTouch: false,
        isMobile: false,
        deviceScaleFactor: 1,
      },
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        hasTouch: false,
        isMobile: false,
        deviceScaleFactor: 1,
      },
    },

    {
      name: 'safari-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        hasTouch: false,
        isMobile: false,
        deviceScaleFactor: 1,
      },
    },

    {
      name: 'edge-desktop',
      use: { 
        ...devices['Desktop Edge'],
        channel: 'msedge',
        viewport: { width: 1920, height: 1080 },
        hasTouch: false,
        isMobile: false,
        deviceScaleFactor: 1,
      },
    },

    // Additional desktop resolutions for comprehensive testing
    {
      name: 'chrome-1366x768',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 },
        hasTouch: false,
        isMobile: false,
      },
    },

    {
      name: 'chrome-1440x900',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        hasTouch: false,
        isMobile: false,
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'cd ../../backend && npm run dev',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'cd ../../frontend && npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],

  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  outputDir: 'test-results/desktop/',
});
