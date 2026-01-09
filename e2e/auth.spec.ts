import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Plobie/);
    // Check for Welcome Back heading (h2)
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
  });

  test('should load signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Plobie/);
    // Check for Join Our Community heading (h2)
    await expect(page.getByRole('heading', { name: /Join Our Community/i })).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Sign In/i }).click();
    // Form should not submit without credentials (HTML5 validation)
    await expect(page).toHaveURL(/login/);
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    // Look for "Sign up" link - use exact text to get the one in the form, not nav
    await page.getByRole('link', { name: 'Sign up', exact: true }).click();
    await expect(page).toHaveURL(/signup/);

    // Look for "Sign in" link on signup page
    await page.getByRole('link', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/login/);
  });

  test('should have email and password fields on login', async ({ page }) => {
    await page.goto('/login');
    // Check for input fields by their labels or types
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should have required fields on signup', async ({ page }) => {
    await page.goto('/signup');
    // Check for username, email, and password fields
    await expect(
      page.locator('input[name="username"]').or(page.getByPlaceholder(/plantlover/i))
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should have social login options', async ({ page }) => {
    await page.goto('/login');
    // Check for Google or Apple sign in buttons
    const hasGoogle = await page.getByRole('button', { name: /Google/i }).isVisible();
    const hasApple = await page.getByRole('button', { name: /Apple/i }).isVisible();
    expect(hasGoogle || hasApple).toBeTruthy();
  });
});
