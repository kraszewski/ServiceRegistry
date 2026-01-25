import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Basic check that the page loads
    await expect(page).toHaveTitle(/ServiceRegistry/i);
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check if navigation elements exist
    // Update selectors based on your actual app structure
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });
});
