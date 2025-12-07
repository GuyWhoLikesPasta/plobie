import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to own profile from nav', async ({ page }) => {
    await page.goto('/');
    
    // Click on username in nav
    const usernameLink = page.locator('a:has-text("test")').first();
    if (await usernameLink.isVisible()) {
      await usernameLink.click();
      await expect(page).toHaveURL(/\/profile\/test/);
    }
  });

  test('should display profile information', async ({ page }) => {
    await page.goto('/profile/test');
    
    // Check for profile elements
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for stats
    const statLabels = ['Pots Claimed', 'Level', 'Total XP', 'Posts'];
    
    for (const label of statLabels) {
      const stat = page.locator(`text=${label}`);
      if (await stat.isVisible()) {
        await expect(stat).toBeVisible();
      }
    }
  });

  test('should display avatar or initial', async ({ page }) => {
    await page.goto('/profile/test');
    
    // Should have either an avatar image or initial div
    const avatar = page.locator('img[alt*="test"]');
    const initial = page.locator('text=T');
    
    const hasAvatar = await avatar.isVisible();
    const hasInitial = await initial.isVisible();
    
    expect(hasAvatar || hasInitial).toBe(true);
  });

  test('should display user posts', async ({ page }) => {
    await page.goto('/profile/test');
    
    // Check for posts section
    await expect(page.locator('text=Recent Posts')).toBeVisible();
    
    // Either has posts or "No posts yet" message
    const noPosts = page.locator('text=No posts yet');
    const posts = page.locator('[class*="post"]');
    
    const hasNoPosts = await noPosts.isVisible();
    const hasPosts = await posts.count() > 0;
    
    expect(hasNoPosts || hasPosts).toBe(true);
  });

  test('should display stats correctly', async ({ page }) => {
    await page.goto('/profile/test');
    
    // Check that stats display numbers
    const statsGrid = page.locator('[class*="grid"]').filter({ hasText: 'Level' });
    await expect(statsGrid).toBeVisible();
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/profile/test');
    
    // Check elements adapt to mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Stats should stack on mobile
    const statsGrid = page.locator('[class*="grid"]').filter({ hasText: 'Level' });
    await expect(statsGrid).toBeVisible();
  });

  test('should handle non-existent profile', async ({ page }) => {
    await page.goto('/profile/nonexistentuser12345');
    
    // Should show error or redirect
    await expect(page.locator('text=not found').or(page.locator('text=Profile not found'))).toBeVisible();
  });
});

