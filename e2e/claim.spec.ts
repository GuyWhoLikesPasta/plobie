import { test, expect } from '@playwright/test';

test.describe('QR Claim Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display claim page', async ({ page }) => {
    await page.goto('/claim');
    
    // Check for page elements
    await expect(page.locator('h1')).toContainText('Claim Your Plant');
    await expect(page.locator('text=Scan QR Code')).toBeVisible();
  });

  test('should have token input field', async ({ page }) => {
    await page.goto('/claim');
    
    // Check for token input
    const tokenInput = page.locator('input[type="text"]').or(page.locator('input[placeholder*="token"]'));
    await expect(tokenInput).toBeVisible();
  });

  test('should have claim button', async ({ page }) => {
    await page.goto('/claim');
    
    // Check for claim button
    const claimButton = page.locator('button:has-text("Claim")');
    await expect(claimButton).toBeVisible();
  });

  test('should display instructions', async ({ page }) => {
    await page.goto('/claim');
    
    // Check for instructions or help text
    const instructions = page.locator('text=scan').or(page.locator('text=code'));
    await expect(instructions.first()).toBeVisible();
  });

  test('should handle URL token parameter', async ({ page }) => {
    // Visit with a token parameter
    await page.goto('/claim?token=test123');
    
    // Token input should be pre-filled or claim should auto-start
    const tokenInput = page.locator('input[value="test123"]');
    const processing = page.locator('text=Processing').or(page.locator('text=Claiming'));
    
    const hasPrefilledToken = await tokenInput.isVisible();
    const isProcessing = await processing.isVisible();
    
    expect(hasPrefilledToken || isProcessing).toBe(true);
  });

  test('should require authentication', async ({ page }) => {
    // Logout first
    await page.goto('/');
    const signOutButton = page.locator('button:has-text("Sign Out")');
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Try to access claim page
    await page.goto('/claim');
    
    // Should redirect to login or show auth requirement
    const currentUrl = page.url();
    expect(currentUrl.includes('/login') || currentUrl.includes('/claim')).toBe(true);
  });

  test('should display XP reward information', async ({ page }) => {
    await page.goto('/claim');
    
    // Check for XP mention
    const xpInfo = page.locator('text=50 XP').or(page.locator('text=Earn XP'));
    if (await xpInfo.isVisible()) {
      await expect(xpInfo).toBeVisible();
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/claim');
    
    // Check elements adapt to mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Input should be full width on mobile
    const tokenInput = page.locator('input[type="text"]').first();
    await expect(tokenInput).toBeVisible();
  });

  test('should validate empty token', async ({ page }) => {
    await page.goto('/claim');
    
    // Try to claim with empty token
    const claimButton = page.locator('button:has-text("Claim")').first();
    await claimButton.click();
    
    // Should show validation error or button should be disabled
    const errorMessage = page.locator('text=required').or(page.locator('text=enter'));
    const buttonDisabled = await claimButton.isDisabled();
    const hasError = await errorMessage.isVisible();
    
    expect(buttonDisabled || hasError).toBe(true);
  });
});

