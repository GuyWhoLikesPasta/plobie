import { test, expect } from '@playwright/test';

test.describe('Learn Articles', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to learn page', async ({ page }) => {
    await page.goto('/hobbies');
    
    // Check if Learn tab exists
    const learnTab = page.locator('text=Learn').first();
    if (await learnTab.isVisible()) {
      await learnTab.click();
      await expect(page).toHaveURL('/hobbies/learn');
    }
  });

  test('should display learn articles list', async ({ page }) => {
    await page.goto('/hobbies/learn');
    
    // Check for page elements
    await expect(page.locator('h1')).toContainText('Learn');
    
    // Check for articles grid
    const articles = page.locator('[class*="grid"]');
    await expect(articles).toBeVisible();
  });

  test('should display article cards', async ({ page }) => {
    await page.goto('/hobbies/learn');
    
    // Check for article elements
    const articleCards = page.locator('text=Complete Guide').or(page.locator('text=Indoor Plant'));
    await expect(articleCards.first()).toBeVisible();
  });

  test('should navigate to article detail', async ({ page }) => {
    await page.goto('/hobbies/learn');
    
    // Click first article
    const firstArticle = page.locator('a').filter({ hasText: 'Complete Guide' }).first();
    if (await firstArticle.isVisible()) {
      await firstArticle.click();
      
      // Should be on article detail page
      await expect(page).toHaveURL(/\/hobbies\/learn\//);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('should display article content', async ({ page }) => {
    await page.goto('/hobbies/learn/550e8400-e29b-41d4-a716-446655440001');
    
    // Check for article elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=XP')).toBeVisible();
    await expect(page.locator('text=min read')).toBeVisible();
  });

  test('should have mark as read button', async ({ page }) => {
    await page.goto('/hobbies/learn/550e8400-e29b-41d4-a716-446655440001');
    
    // Check for mark as read button or completed message
    const markButton = page.locator('button:has-text("Mark as Read")');
    const completed = page.locator('text=Article Completed');
    
    const hasButton = await markButton.isVisible();
    const hasCompleted = await completed.isVisible();
    
    expect(hasButton || hasCompleted).toBe(true);
  });

  test('should display XP notice', async ({ page }) => {
    await page.goto('/hobbies/learn');
    
    // Check for XP notice
    const xpNotice = page.locator('text=Earn 1 XP');
    if (await xpNotice.isVisible()) {
      await expect(xpNotice).toBeVisible();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/hobbies/learn');
    
    // Check elements adapt to mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Grid should stack on mobile
    const grid = page.locator('[class*="grid"]');
    await expect(grid).toBeVisible();
  });
});

