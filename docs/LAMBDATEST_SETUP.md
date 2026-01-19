# LambdaTest Environment Variables Setup

This guide explains how to configure LambdaTest credentials using environment variables for both the application and Playwright tests.

## Quick Setup

### Option 1: Automated Setup Script (Recommended)

Run the setup script to interactively configure your environment:

```bash
./scripts/setup-env.sh
```

This script will:
- Create a `.env` file from `.env.example`
- Prompt you for your LambdaTest credentials
- Configure all necessary environment variables

### Option 2: Manual Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Get your LambdaTest credentials:**
   - Visit: https://automation.lambdatest.com/user-settings/api-token
   - Copy your Username and Access Key

3. **Edit `.env` file:**
   ```bash
   # Open .env in your editor
   nano .env  # or use your preferred editor
   ```

4. **Update the following variables:**
   ```env
   VITE_LAMBDATEST_USERNAME=your-actual-username
   VITE_LAMBDATEST_ACCESS_KEY=your-actual-access-key
   LT_USERNAME=your-actual-username
   LT_ACCESS_KEY=your-actual-access-key
   ```

## Environment Variables Explained

### Application Variables (Vite)

These variables are used by the React application and must be prefixed with `VITE_`:

- `VITE_LAMBDATEST_USERNAME` - Your LambdaTest username
- `VITE_LAMBDATEST_ACCESS_KEY` - Your LambdaTest access token
- `VITE_BASE_URL` - Application base URL (default: `http://localhost:3000`)

### Playwright Test Variables

These variables are used by Playwright tests (Node.js environment):

- `LT_USERNAME` - Your LambdaTest username
- `LT_ACCESS_KEY` - Your LambdaTest access token
- `BASE_URL` - Application URL for testing (default: `http://localhost:3000`)
- `BUILD_NAME` - Optional build name (defaults to timestamp)
- `PROJECT_NAME` - Optional project name (default: "Adiology Campaign Dashboard")
- `LT_TUNNEL` - Enable LambdaTest tunnel (default: `false`)
- `LT_TUNNEL_NAME` - Optional tunnel name
- `LT_WORKERS` - Number of parallel workers (default: `50%` of CPU cores, set to number like `4` or `8` for faster execution)

## Usage

### Running the Application

After setting up `.env`, restart your development server:

```bash
npm run dev
```

The application will automatically load environment variables prefixed with `VITE_`.

### Running Playwright Tests

Run Playwright tests with the LambdaTest configuration:

```bash
# Basic test run (uses default parallel workers: 50% of CPU cores)
npm run test:lambdatest

# Run with custom number of parallel workers (faster, uses more LambdaTest minutes)
LT_WORKERS=8 npm run test:lambdatest

# Run specific test file
npm run test:lambdatest -- tests/paid-signup.spec.ts

# Run with custom build name
BUILD_NAME="Production Build $(date +%Y%m%d)" npm run test:lambdatest
```

### Parallel Testing Configuration

The configuration is optimized for parallel testing to speed up execution and save money:

- **Default**: Uses 50% of available CPU cores for parallel execution
- **Custom Workers**: Set `LT_WORKERS` environment variable to control parallelism
  - `LT_WORKERS=4` - Run 4 tests in parallel
  - `LT_WORKERS=8` - Run 8 tests in parallel
  - `LT_WORKERS=1` - Run tests sequentially (slower but uses fewer minutes)

**Benefits of Parallel Testing:**
- ⚡ **Faster execution** - Tests run simultaneously across multiple browsers
- 💰 **Cost efficient** - Completes tests faster, reducing total execution time
- 🔄 **Better resource utilization** - Multiple LambdaTest sessions run concurrently

**Example:**
```bash
# Run with 8 parallel workers for faster execution
LT_WORKERS=8 npm run test:lambdatest
```

## Security Best Practices

1. **Never commit `.env` files** - The `.gitignore` file already excludes `.env` files
2. **Use `.env.example`** - Commit the example file as a template
3. **Rotate credentials** - If credentials are exposed, rotate them immediately
4. **Use different credentials** - Use separate credentials for development and production

## Troubleshooting

### "LambdaTest credentials are not configured" Error

This means the environment variables are not set. Check:

1. `.env` file exists in the project root
2. Variables are prefixed correctly (`VITE_` for app, no prefix for Playwright)
3. Development server was restarted after creating `.env`
4. No typos in variable names

### Playwright Tests Can't Connect

1. Verify `LT_USERNAME` and `LT_ACCESS_KEY` are set
2. Check credentials are valid at https://automation.lambdatest.com/
3. Ensure you have sufficient test minutes in your LambdaTest account
4. Check network connectivity

### Environment Variables Not Loading in Browser

Vite only exposes variables prefixed with `VITE_` to the browser. Make sure:
- Variables used in React code have `VITE_` prefix
- Development server was restarted after adding variables
- Variables are in `.env` file (not `.env.local` unless configured)

### Stripe Payment Forms Not Loading in Tests

The configuration includes capabilities to handle Stripe's cross-origin iframes:

**Capabilities Added:**
- `allowCrossOriginIframes: true` - Allows Stripe's iframe-based payment forms
- `disableWebSecurity: true` - Disables web security for testing (allows cross-origin iframes)
- `thirdPartyCookiesEnabled: true` - Enables third-party cookies (required for Stripe)
- `acceptInsecureCerts: true` - Accepts insecure certificates for testing

**If Stripe iframes still don't load:**
1. Verify the test waits for Stripe Elements to initialize (2-3 seconds)
2. Check that Stripe publishable key is correctly configured
3. Ensure the test uses Stripe test card numbers (4242 4242 4242 4242)
4. Check LambdaTest session logs for iframe loading errors
5. Verify the application URL is accessible from LambdaTest's cloud infrastructure

**Test File Enhancements:**
- The test file includes multiple Stripe iframe selectors for better detection
- Enhanced iframe interaction with fallback strategies
- Proper waiting for Stripe Elements to load before interaction

## Getting Help

- LambdaTest Documentation: https://www.lambdatest.com/support/docs/
- LambdaTest API Token: https://automation.lambdatest.com/user-settings/api-token
- Playwright Documentation: https://playwright.dev/

