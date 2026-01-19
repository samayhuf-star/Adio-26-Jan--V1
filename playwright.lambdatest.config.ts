import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * LambdaTest Playwright Configuration
 * 
 * This configuration file is specifically for running Playwright tests on LambdaTest's cloud infrastructure.
 * 
 * PARALLEL TESTING CONFIGURATION:
 * - fullyParallel: true - Enables parallel execution of tests
 * - workers: '50%' - Uses 50% of CPU cores for parallel execution
 *   - Set LT_WORKERS env var to override (e.g., LT_WORKERS=4 for 4 parallel workers)
 *   - Higher workers = faster tests but more LambdaTest minutes consumed
 *   - Recommended: Start with 50%, increase if you have sufficient test minutes
 * 
 * BENEFITS OF PARALLEL TESTING:
 * - Faster test execution (tests run simultaneously across multiple browsers)
 * - Cost efficient (completes tests faster, reducing total execution time)
 * - Better resource utilization (multiple LambdaTest sessions run concurrently)
 * 
 * STRIPE PAYMENT HANDLING:
 * - Cross-origin iframe support enabled for Stripe payment forms
 * - Web security disabled for testing (allows Stripe iframes to load)
 * - Third-party cookies enabled (required for Stripe)
 * - HTTPS certificate errors ignored (for testing environments)
 * - Test file includes enhanced Stripe iframe detection and interaction
 * 
 * Setup:
 * 1. Create a .env file with your LambdaTest credentials:
 *    - LT_USERNAME: Your LambdaTest username
 *    - LT_ACCESS_KEY: Your LambdaTest access token
 *    - BASE_URL: Your application URL (use production URL for cloud testing)
 *    - BUILD_NAME: Optional build name (defaults to timestamp)
 *    - PROJECT_NAME: Optional project name (defaults to 'Adiology Campaign Dashboard')
 *    - LT_WORKERS: Optional worker count (defaults to '50%' of CPU cores)
 * 
 *    Or run: ./scripts/setup-env.sh
 * 
 * 2. Run tests:
 *    - npm run test:lambdatest
 *    - Or: npx playwright test --config=playwright.lambdatest.config.ts
 *    - For more parallel workers: LT_WORKERS=8 npm run test:lambdatest
 * 
 * 3. View results:
 *    - Check LambdaTest dashboard: https://automation.lambdatest.com/
 * 
 * Alternative: Use LambdaTest SDK CLI:
 *    - npx playwright-node-sdk playwright test
 *    (This uses lambdatest.yml configuration file)
 */

// Helper function to build LambdaTest CDP endpoint
function getLambdaTestEndpoint(capabilities: Record<string, any>): string {
  const username = process.env.LT_USERNAME || process.env.LAMBDATEST_USERNAME || '';
  const accessKey = process.env.LT_ACCESS_KEY || process.env.LAMBDATEST_ACCESS_KEY || '';
  
  if (!username || !accessKey) {
    throw new Error('LT_USERNAME and LT_ACCESS_KEY environment variables are required');
  }

  // LambdaTest Playwright requires browserName in format: pw-chromium, pw-firefox, pw-webkit
  // Map our browser names to LambdaTest format
  const browserNameMap: Record<string, string> = {
    'Chrome': 'pw-chromium',
    'Firefox': 'pw-firefox',
    'Safari': 'pw-webkit',
    'chromium': 'pw-chromium',
    'firefox': 'pw-firefox',
    'webkit': 'pw-webkit',
  };

  const mappedBrowserName = browserNameMap[capabilities.browserName] || capabilities.browserName || 'pw-chromium';

  // LambdaTest requires capabilities in specific format with LT:Options
  const caps = {
    browserName: mappedBrowserName,
    browserVersion: capabilities.browserVersion || 'latest',
    'LT:Options': {
      platform: capabilities.platform || 'Windows 10',
      build: capabilities.build || process.env.BUILD_NAME || `Build ${new Date().toISOString()}`,
      name: capabilities.name || 'Playwright Test',
      user: username,
      accessKey: accessKey,
      network: true,
      video: true,
      console: true,
      // Enable parallel execution
      tunnel: process.env.LT_TUNNEL === 'true',
      tunnelName: process.env.LT_TUNNEL_NAME || undefined,
      // Stripe Payment Handling - Allow cross-origin iframes
      // These capabilities enable Stripe's iframe-based payment forms to work in cloud browsers
      'allowCrossOriginIframes': true,
      'allowCrossOriginSubframes': true,
      // Disable web security for testing (allows Stripe iframes to load)
      'disableWebSecurity': true,
      // Enable third-party cookies (required for Stripe)
      'thirdPartyCookiesEnabled': true,
      // Additional Stripe-specific settings
      'acceptInsecureCerts': true,
      // Performance and reliability settings
      'idleTimeout': 90,
      'maxDuration': 300,
      ...capabilities['LT:Options'],
    },
  };

  return `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(JSON.stringify(caps))}`;
}

const config = defineConfig({
  testDir: './tests',
  
  // Test timeout settings
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  
  // Run tests in parallel - enables parallel execution across all projects
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Parallel testing configuration
  // Set workers to '50%' for optimal parallel execution (uses 50% of available CPU cores)
  // For LambdaTest cloud testing, you can increase this to run more tests in parallel
  // Higher parallelization = faster tests but more LambdaTest minutes consumed
  workers: process.env.CI ? 2 : process.env.LT_WORKERS ? parseInt(process.env.LT_WORKERS) : '50%',
  
  // Maximum number of test failures before stopping
  maxFailures: process.env.CI ? 10 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for your application
    // Use production URL for LambdaTest, or localhost if running locally
    baseURL: process.env.BASE_URL || process.env.VITE_BASE_URL || 'https://adiology-dashboard-lhuclwfgb-samayhuf-stars-projects.vercel.app',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure (disabled for cloud - LambdaTest handles video recording)
    video: 'off',
    
    // Stripe Payment Handling - Context options for iframe support
    // These options allow Stripe's cross-origin iframes to work properly
    ignoreHTTPSErrors: true,
    // Allow third-party cookies (required for Stripe)
    // Note: This is handled via LambdaTest capabilities, but we set it here for completeness
  },

  // Configure projects for major browsers on LambdaTest
  // Each project runs in parallel, and tests within each project also run in parallel
  projects: [
    {
      name: 'chromium-lt',
      use: {
        // Don't use devices when connecting to cloud - use connectOptions directly
        connectOptions: {
          wsEndpoint: getLambdaTestEndpoint({
            browserName: 'Chrome',
            browserVersion: 'latest',
            platform: 'Windows 10',
            name: 'Chrome Test - Paid Signup',
            build: process.env.BUILD_NAME || `Build ${new Date().toISOString()}`,
            'LT:Options': {
              project: process.env.PROJECT_NAME || 'Adiology Campaign Dashboard',
            },
          }),
        },
      },
    },

    {
      name: 'firefox-lt',
      use: {
        connectOptions: {
          wsEndpoint: getLambdaTestEndpoint({
            browserName: 'Firefox',
            browserVersion: 'latest',
            platform: 'Windows 10',
            name: 'Firefox Test - Paid Signup',
            build: process.env.BUILD_NAME || `Build ${new Date().toISOString()}`,
            'LT:Options': {
              project: process.env.PROJECT_NAME || 'Adiology Campaign Dashboard',
            },
          }),
        },
      },
    },

    {
      name: 'webkit-lt',
      use: {
        connectOptions: {
          wsEndpoint: getLambdaTestEndpoint({
            browserName: 'Safari',
            browserVersion: 'latest',
            platform: 'macOS Big Sur',
            name: 'Safari Test - Paid Signup',
            build: process.env.BUILD_NAME || `Build ${new Date().toISOString()}`,
            'LT:Options': {
              project: process.env.PROJECT_NAME || 'Adiology Campaign Dashboard',
            },
          }),
        },
      },
    },
  ],

  // Web server configuration
  // Only start local server if BASE_URL is localhost
  // For cloud testing, disable webServer and use production URL
  webServer: process.env.BASE_URL?.includes('localhost') || process.env.BASE_URL?.includes('127.0.0.1')
    ? {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      }
    : undefined,
});

export default config;

