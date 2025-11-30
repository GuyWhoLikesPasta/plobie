import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Plobie/);
    await expect(page.getByRole('heading', { name: /Sign In/i })).toBeVisible();
  });

  test('should load signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Plobie/);
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Sign In/i }).click();
    // Form should not submit without credentials
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /Sign up/i }).click();
    await expect(page).toHaveURL(/signup/);
    
    await page.getByRole('link', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/login/);
  });
});

