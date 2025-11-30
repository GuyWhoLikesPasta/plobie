import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Plobie/);
  });

  test('should display logo', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/🌱|Plobie/i)).toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check navigation exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Check for key links
    await expect(page.getByRole('link', { name: /Hobbies/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Shop/i })).toBeVisible();
  });

  test('should show login/signup links when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    const hasLogin = await page.getByRole('link', { name: /Log in|Sign in/i }).isVisible();
    const hasSignup = await page.getByRole('link', { name: /Sign up|Register/i }).isVisible();
    
    expect(hasLogin || hasSignup).toBeTruthy();
  });
});

