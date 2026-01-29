import { test, expect } from '@playwright/test';

test.describe('Learn Articles', () => {
  test('should navigate to learn page', async ({ page }) => {
    await page.goto('/hobbies/learn');
    await expect(page).toHaveURL('/hobbies/learn');
  });

  test('should display learn page header', async ({ page }) => {
    await page.goto('/hobbies/learn');

    // Check for page elements
    await expect(page.locator('h1')).toContainText('Learn');
  });

  test('should display XP earning info', async ({ page }) => {
    await page.goto('/hobbies/learn');

    // Check for XP info banner
    await expect(page.locator('text=Earn +10 XP for each article')).toBeVisible();
  });

  test('should display category filters', async ({ page }) => {
    await page.goto('/hobbies/learn');

    // Check for filter buttons
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Indoor Plants")')).toBeVisible();
    await expect(page.locator('button:has-text("Succulents")')).toBeVisible();
  });

  test('should show coming soon message when no articles', async ({ page }) => {
    await page.goto('/hobbies/learn');

    // Check for empty state
    const comingSoon = page.locator('text=More Articles Coming Soon');
    const hasArticles = await page
      .locator('article, [class*="article"], a[href*="/hobbies/learn/"]')
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasArticles) {
      await expect(comingSoon).toBeVisible();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/hobbies/learn');

    // Check elements adapt to mobile
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate from hobbies page', async ({ page }) => {
    await page.goto('/hobbies');

    // Click Learn button
    const learnButton = page.locator('button:has-text("Learn")');
    await learnButton.click();

    await expect(page).toHaveURL('/hobbies/learn');
  });
});
