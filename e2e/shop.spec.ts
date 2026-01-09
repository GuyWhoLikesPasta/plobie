import { test, expect } from '@playwright/test';

test.describe('Shop', () => {
  test('should load shop page', async ({ page }) => {
    await page.goto('/shop');
    await expect(page).toHaveTitle(/Plobie/);
    // Check for the Shop heading in the hero (h1)
    await expect(page.locator('h1', { hasText: /Shop/i })).toBeVisible();
  });

  test('should display shop hero section', async ({ page }) => {
    await page.goto('/shop');
    // Check for hero content - "pottery and plant accessories"
    await expect(page.getByText(/pottery.*plant|plant.*accessories/i)).toBeVisible();
  });

  test('should display products or empty state', async ({ page }) => {
    await page.goto('/shop');

    // Either show products or empty state
    const productLinks = page.locator('a[href^="/shop/"]').filter({ hasNot: page.locator('nav') });
    const hasProducts = (await productLinks.count()) > 0;
    const hasEmptyState = await page.getByText(/No products available/i).isVisible();

    expect(hasProducts || hasEmptyState).toBeTruthy();
  });

  test('should navigate to product detail page when products exist', async ({ page }) => {
    await page.goto('/shop');

    // Get product links (exclude nav links)
    const productLinks = page.locator('main a[href^="/shop/"]');
    const count = await productLinks.count();

    if (count > 0) {
      await productLinks.first().click();
      // Should be on product detail page
      await expect(page).toHaveURL(/\/shop\/.+/);
    } else {
      // Skip if no products - test passes
      test.skip();
    }
  });

  test('should display trust badges', async ({ page }) => {
    await page.goto('/shop');
    // Check for trust badge section - use more specific selectors
    await expect(page.locator('section').getByText('Free Shipping')).toBeVisible();
    await expect(page.locator('section').getByText('Secure Payment')).toBeVisible();
  });

  test('should display all products section', async ({ page }) => {
    await page.goto('/shop');
    // Check for "All Products" section heading (h2)
    await expect(page.locator('h2', { hasText: 'All Products' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/shop');
    await expect(page.locator('h1', { hasText: /Shop/i })).toBeVisible();
  });
});
