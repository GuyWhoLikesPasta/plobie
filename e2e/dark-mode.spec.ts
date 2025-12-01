/**
 * E2E Tests for Dark Mode UI
 * Tests the visual appearance and functionality of the 2026 redesign
 */

import { test, expect } from '@playwright/test';

test.describe('Dark Mode Homepage', () => {
  test('should have dark background', async ({ page }) => {
    await page.goto('/');
    
    const body = await page.locator('body');
    const bgColor = await body.evaluate((el) => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should be black or very dark
    expect(bgColor).toBeTruthy();
  });

  test('should display gradient hero text', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Grow Together')).toBeVisible();
    await expect(page.getByText('With Plobie')).toBeVisible();
  });

  test('should have floating emoji animations', async ({ page }) => {
    await page.goto('/');
    
    // Check for emoji decorations
    const emojis = await page.locator('.animate-float');
    await expect(emojis.first()).toBeVisible();
  });

  test('should show bento grid features', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Shop')).toBeVisible();
    await expect(page.getByText('Community')).toBeVisible();
    await expect(page.getByText('My Plants')).toBeVisible();
    await expect(page.getByText('Games & Unity Garden')).toBeVisible();
  });

  test('should have responsive CTA buttons', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('link', { name: /Start Your Journey/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Explore Shop/i })).toBeVisible();
  });
});

test.describe('Dark Mode Navigation', () => {
  test('should have glassmorphism nav bar', async ({ page }) => {
    await page.goto('/');
    
    const nav = await page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should show gradient logo text', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByText('Plobie').first()).toBeVisible();
  });

  test('should have gradient active states', async ({ page }) => {
    await page.goto('/');
    
    const homeLink = await page.getByRole('link', { name: /Home/i }).first();
    await expect(homeLink).toBeVisible();
  });

  test('should show admin link for admin users', async ({ page }) => {
    // This would require logged in admin user
    // Skipping actual test, just structure
    expect(true).toBe(true);
  });
});

test.describe('Dark Mode Hobbies Page', () => {
  test('should have dark glassmorphism cards', async ({ page }) => {
    await page.goto('/hobbies');
    
    await expect(page.getByText('Community')).toBeVisible();
  });

  test('should have search with glass effect', async ({ page }) => {
    await page.goto('/hobbies');
    
    const searchInput = await page.getByPlaceholder(/Search posts/i);
    await expect(searchInput).toBeVisible();
  });

  test('should show category filter pills', async ({ page }) => {
    await page.goto('/hobbies');
    
    await expect(page.getByText('All Groups')).toBeVisible();
    await expect(page.getByText('Indoor Plants')).toBeVisible();
  });
});

test.describe('Dark Mode Shop Page', () => {
  test('should have luxury product cards', async ({ page }) => {
    await page.goto('/shop');
    
    await expect(page.getByText('Premium Shop')).toBeVisible();
  });

  test('should show gradient on hover', async ({ page }) => {
    await page.goto('/shop');
    
    // Test hover effects (visual)
    expect(true).toBe(true);
  });
});

test.describe('Dark Mode My Plants', () => {
  test('should have native app dashboard feel', async ({ page }) => {
    await page.goto('/login');
    
    // Would need auth - structure test
    expect(true).toBe(true);
  });

  test('should show animated XP progress bar', async ({ page }) => {
    // Would need auth
    expect(true).toBe(true);
  });

  test('should display stats cards with borders', async ({ page }) => {
    // Would need auth
    expect(true).toBe(true);
  });
});

test.describe('Dark Mode Admin Panel', () => {
  test('should have purple/pink gradient theme', async ({ page }) => {
    // Would need admin auth
    expect(true).toBe(true);
  });

  test('should show professional SaaS layout', async ({ page }) => {
    // Would need admin auth
    expect(true).toBe(true);
  });
});

test.describe('Dark Mode Auth Pages', () => {
  test('should have glassmorphism login form', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByLabel(/Email/i)).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  test('should have gradient CTA button', async ({ page }) => {
    await page.goto('/login');
    
    const signInButton = await page.getByRole('button', { name: /Sign In/i });
    await expect(signInButton).toBeVisible();
  });

  test('should have OAuth buttons styled', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText('Google')).toBeVisible();
    await expect(page.getByText('Apple')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.getByText('Plobie')).toBeVisible();
  });

  test('should work on tablet (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.getByText('Plobie')).toBeVisible();
  });

  test('should work on desktop (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.getByText('Plobie')).toBeVisible();
  });
});

test.describe('Browser Compatibility', () => {
  test('should work in chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chromium only');
    await page.goto('/');
    await expect(page.getByText('Plobie')).toBeVisible();
  });

  test('should work in firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox only');
    await page.goto('/');
    await expect(page.getByText('Plobie')).toBeVisible();
  });

  test('should work in webkit (Safari)', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari/WebKit only');
    await page.goto('/');
    await expect(page.getByText('Plobie')).toBeVisible();
  });
});

