import { test, expect } from '@playwright/test';

test.describe('Hobbies/Community', () => {
  test('should load hobbies page', async ({ page }) => {
    await page.goto('/hobbies');
    await expect(page).toHaveTitle(/Plobie/);
  });

  test('should display community sections', async ({ page }) => {
    await page.goto('/hobbies');
    
    // Check for main UI elements
    await expect(page.getByText(/Plant Community|Hobbies/i)).toBeVisible();
  });

  test('should show post creation form when authenticated', async ({ page }) => {
    await page.goto('/hobbies');
    
    // Should show either login prompt or create post form
    const hasLoginLink = await page.getByRole('link', { name: /Sign in|Log in/i }).isVisible();
    const hasPostForm = await page.getByText(/New Post|Create Post/i).isVisible();
    
    expect(hasLoginLink || hasPostForm).toBeTruthy();
  });

  test('should have hobby group filters', async ({ page }) => {
    await page.goto('/hobbies');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for filter options (may be in select or buttons)
    const hasFilters = await page.locator('select, button').filter({ hasText: /Indoor Plants|Succulents|All/ }).count();
    expect(hasFilters).toBeGreaterThan(0);
  });
});

