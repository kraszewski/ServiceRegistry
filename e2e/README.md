# E2E Tests

This directory contains end-to-end tests using Playwright.

## Running Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps

# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (watch the browser)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests in debug mode
npx playwright test --debug

# Show test report
npx playwright show-report
```

## Configuration

The Playwright configuration is located in `playwright.config.ts` in the root directory.

### Browsers

Tests run on three browsers by default:
- Chromium
- Firefox
- WebKit (Safari)

### Environment Variables

E2E tests use the following environment variables:
- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PUBLIC_BASE_URL` - Base URL for the application (defaults to http://localhost:4321)

## Writing Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-page');
    
    // Your test assertions
    await expect(page.locator('h1')).toHaveText('Expected Text');
  });
});
```

## CI/CD

E2E tests run automatically on pull requests via GitHub Actions. The workflow:
1. Sets up the integration environment
2. Installs Playwright browsers
3. Runs all E2E tests with coverage
4. Uploads test reports and coverage artifacts

See `.github/workflows/pull-request.yml` for details.
