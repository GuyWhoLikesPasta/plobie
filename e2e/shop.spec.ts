import { test, expect } from '@playwright/test';

test.describe('Shop', () => {
  test('should load shop page', async ({ page }) => {
    await page.goto('/shop');
    await expect(page).toHaveTitle(/Plobie/);
    await expect(page.getByText(/Featured Products|Shop/i)).toBeVisible();
  });

  test('should display products', async ({ page }) => {
    await page.goto('/shop');
    
    // Wait for products to load
    await page.waitForSelector('text=/Add to Cart|View Product/i', { timeout: 10000 });
    
    // Check that product cards are visible
    const productCards = page.locator('[class*="shadow"]').filter({ hasText: /Add to Cart|View/ });
    await expect(productCards.first()).toBeVisible();
  });

  test('should navigate to product detail page', async ({ page }) => {
    await page.goto('/shop');
    
    // Wait for products to load
    await page.waitForSelector('text=/View Product|Add to Cart/i', { timeout: 10000 });
    
    // Click first product link
    const firstProduct = page.locator('a[href^="/shop/"]').first();
    await firstProduct.click();
    
    // Should be on product detail page
    await expect(page).toHaveURL(/\/shop\/.+/);
  });
});

