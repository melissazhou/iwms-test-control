import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific config
const env = process.env.TEST_ENV || 'int';
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // WMS tests often have sequential dependencies
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : parseInt(process.env.RETRY_COUNT || '1'),
  workers: 1, // Single worker for WMS to avoid data conflicts
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: process.env.SCREENSHOT_ON_FAILURE === 'true' ? 'only-on-failure' : 'off',
    video: process.env.VIDEO_ON_FAILURE === 'true' ? 'on-first-retry' : 'off',
    actionTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
    navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
    
    // Accept self-signed certs for internal servers
    ignoreHTTPSErrors: true,
    
    // Viewport for RF Mobile simulation
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    // ---- Smoke Tests (no auth setup dependency) ----
    {
      name: 'smoke',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 480, height: 800 },
      },
      testMatch: /tests\/smoke\/.*/,
    },

    // ---- Setup ----
    {
      name: 'auth-setup',
      testDir: './src/auth',
      testMatch: /global-setup\.ts/,
    },

    // ---- Web端 (EasyUI) Tests ----
    {
      name: 'web-chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './src/auth/.auth/admin-web.json',
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['auth-setup'],
      testMatch: /tests\/web\/.*/,
    },

    // ---- RF MobileApp Tests ----
    {
      name: 'rf-chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './src/auth/.auth/test-rf.json',
        // RF is designed for handheld devices
        viewport: { width: 480, height: 800 },
      },
      dependencies: ['auth-setup'],
      testMatch: /tests\/rf\/.*/,
    },

    // ---- API Tests (no browser needed) ----
    {
      name: 'api',
      use: {
        storageState: './src/auth/.auth/test-rf.json',
      },
      dependencies: ['auth-setup'],
      testMatch: /tests\/api\/.*/,
    },

    // ---- E2E Full Flow Tests ----
    {
      name: 'e2e',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['auth-setup'],
      testMatch: /tests\/e2e\/.*/,
    },
  ],
});
