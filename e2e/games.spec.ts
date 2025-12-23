import { test, expect } from '@playwright/test';

test.describe('Games Page', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/games');
    // Games page requires auth, should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test.describe('When Authenticated', () => {
    test.beforeEach(async ({ page }) => {
      // Note: These tests will fail without seeded data
      // Run: npm run seed to create test users
      // For now, we just verify the redirect behavior
      await page.goto('/games');
    });

    test('should show login page when no test data exists', async ({ page }) => {
      // Since we don't have seeded test data, verify we're at login
      await expect(page).toHaveURL('/login');
    });
  });

  // TODO: Add authenticated tests when test data seeding is implemented
  // These tests would verify:
  // - Display of upcoming games (Plant Puzzle, Garden Builder)
  // - Game info cards with XP details
  // - "Coming Soon" buttons are disabled
  // - XP mechanics explanation section
  // - Technical info for developers
  // - Responsive layout on mobile
});
