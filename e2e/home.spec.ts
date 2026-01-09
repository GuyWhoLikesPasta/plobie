import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Plobie/);
  });

  test('should display logo', async ({ page }) => {
    await page.goto('/');
    // Look for the Plobie text in the nav
    await expect(page.locator('nav').getByText('Plobie')).toBeVisible();
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');

    // Wait for navigation to be visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Wait for navigation to fully hydrate
    await page.waitForLoadState('networkidle');

    // Check for key links in nav using href attributes
    const hobbiesLink = page.locator('nav').locator('a[href="/hobbies"]');
    const shopLink = page.locator('nav').locator('a[href="/shop"]');

    await expect(hobbiesLink.first()).toBeVisible();
    await expect(shopLink.first()).toBeVisible();
  });

  test('should show auth links when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Wait for nav to hydrate
    await page.waitForLoadState('networkidle');

    // Check for Login or Sign Up links in nav
    const nav = page.locator('nav');
    const loginLink = nav.locator('a[href="/login"]');
    const signupLink = nav.locator('a[href="/signup"]');

    const hasLogin = await loginLink.isVisible();
    const hasSignup = await signupLink.isVisible();

    expect(hasLogin || hasSignup).toBeTruthy();
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    // Check for main call-to-action
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should have accessible navigation links', async ({ page }) => {
    await page.goto('/');

    // All nav links should be accessible
    const navLinks = page.locator('nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
