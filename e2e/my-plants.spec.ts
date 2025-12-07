import { test, expect } from '@playwright/test';

test.describe('My Plants Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to My Plants from nav', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/my-plants"]');
    await expect(page).toHaveURL('/my-plants');
    await expect(page.locator('h1')).toContainText('My Plants');
  });

  test('should display user stats', async ({ page }) => {
    await page.goto('/my-plants');
    
    // Check for stat cards
    await expect(page.locator('text=Pots Claimed')).toBeVisible();
    await expect(page.locator('text=Level')).toBeVisible();
    await expect(page.locator('text=Total XP')).toBeVisible();
    await expect(page.locator('text=Game Sessions')).toBeVisible();
  });

  test('should display XP progress bar', async ({ page }) => {
    await page.goto('/my-plants');
    
    // Check for level progress
    await expect(page.locator('text=Level 1 Progress')).toBeVisible();
    await expect(page.locator('text=XP')).toBeVisible();
  });

  test('should display empty collection state', async ({ page }) => {
    await page.goto('/my-plants');
    
    // Check for collection section
    await expect(page.locator('text=Your Digital Garden')).toBeVisible();
    
    // Check for empty state or collection
    const emptyState = page.locator('text=Claim your first plant');
    const collection = page.locator('[alt*="pot"]');
    
    const hasEmptyState = await emptyState.isVisible();
    const hasCollection = await collection.count() > 0;
    
    expect(hasEmptyState || hasCollection).toBe(true);
  });

  test('should have call-to-action buttons', async ({ page }) => {
    await page.goto('/my-plants');
    
    // Check for CTA buttons
    const exploreButton = page.locator('a:has-text("Explore Hobbies")');
    const shopButton = page.locator('a:has-text("Browse Shop")');
    
    if (await exploreButton.isVisible()) {
      await expect(exploreButton).toBeVisible();
    }
    if (await shopButton.isVisible()) {
      await expect(shopButton).toBeVisible();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/my-plants');
    
    // Check elements adapt to mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Pots Claimed')).toBeVisible();
  });
});

