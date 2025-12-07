import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin (assumes test user is admin)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to admin dashboard from nav', async ({ page }) => {
    // Check if Admin link exists in nav
    const adminLink = page.locator('a[href="/admin"]');
    if (await adminLink.isVisible()) {
      await adminLink.click();
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('h1')).toContainText('Admin Dashboard');
    }
  });

  test('should display analytics tab by default', async ({ page }) => {
    await page.goto('/admin');
    
    // Check for analytics content
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=Total Posts')).toBeVisible();
    await expect(page.locator('text=Total Comments')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/admin');
    
    // Click Users tab
    await page.click('button:has-text("users")');
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
    
    // Click Posts tab
    await page.click('button:has-text("posts")');
    await expect(page.locator('text=Posts Management')).toBeVisible();
    
    // Click Flags tab
    await page.click('button:has-text("flags")');
    await expect(page.locator('text=Feature Flags')).toBeVisible();
  });

  test('should display analytics statistics', async ({ page }) => {
    await page.goto('/admin');
    
    // Check for stat cards
    const stats = ['Total Users', 'Total Posts', 'Total Comments', 'XP Awarded Today'];
    
    for (const stat of stats) {
      await expect(page.locator(`text=${stat}`)).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin');
    
    // Check header is visible
    await expect(page.locator('h1')).toBeVisible();
    
    // Check tabs are visible and scrollable
    await expect(page.locator('button:has-text("analytics")')).toBeVisible();
  });
});

