import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should display main navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for nav items
    await expect(page.getByRole('link', { name: /Home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Hobbies/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /My Plants/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Games/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Shop/i })).toBeVisible();
  });

  test('should navigate to hobbies page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Hobbies/i }).click();
    await expect(page).toHaveURL(/hobbies/);
  });

  test('should navigate to shop page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Shop/i }).click();
    await expect(page).toHaveURL(/shop/);
  });

  test('should navigate to my plants page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /My Plants/i }).click();
    await expect(page).toHaveURL(/my-plants/);
  });
});

