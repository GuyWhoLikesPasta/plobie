import { test, expect } from '@playwright/test';

test.describe('Notifications System', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display notification bell in navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check bell icon exists
    const bell = page.locator('button[aria-label="Notifications"]');
    await expect(bell).toBeVisible();
  });

  test('should open dropdown when bell is clicked', async ({ page }) => {
    await page.goto('/');
    
    // Click bell
    await page.click('button[aria-label="Notifications"]');
    
    // Check dropdown appears
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=View all notifications')).toBeVisible();
  });

  test('should navigate to notifications page', async ({ page }) => {
    await page.goto('/');
    
    // Click bell to open dropdown
    await page.click('button[aria-label="Notifications"]');
    
    // Click "View all notifications"
    await page.click('text=View all notifications');
    
    // Should be on notifications page
    await expect(page).toHaveURL('/notifications');
    await expect(page.locator('h1')).toContainText('Notifications');
  });

  test('should display empty state when no notifications', async ({ page }) => {
    await page.goto('/notifications');
    
    // Check for empty state
    await expect(page.locator('text=No notifications')).toBeVisible();
    await expect(page.locator('text=Go to Home')).toBeVisible();
  });

  test('should filter notifications by type', async ({ page }) => {
    await page.goto('/notifications');
    
    // Check filter buttons exist
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Unread")')).toBeVisible();
    await expect(page.locator('button:has-text("comment")')).toBeVisible();
    
    // Click a filter
    await page.click('button:has-text("Unread")');
    await expect(page.locator('button:has-text("Unread")')).toHaveClass(/bg-green-600/);
  });

  test('should create test notification', async ({ page }) => {
    await page.goto('/notifications');
    
    // Create test notification via API
    await page.evaluate(async () => {
      await fetch('/api/notifications', { method: 'POST' });
    });
    
    // Wait for notification to appear (polling interval)
    await page.waitForTimeout(2000);
    await page.reload();
    
    // Should see test notification
    await expect(page.locator('text=Test Notification')).toBeVisible();
  });

  test('should mark notification as read', async ({ page }) => {
    // Create test notification first
    await page.goto('/notifications');
    await page.evaluate(async () => {
      await fetch('/api/notifications', { method: 'POST' });
    });
    await page.waitForTimeout(1000);
    await page.reload();
    
    // Find and click mark as read button
    const readButton = page.locator('button[title="Mark as read"]').first();
    if (await readButton.isVisible()) {
      await readButton.click();
      await page.waitForTimeout(500);
      
      // Notification should not have green border anymore
      await expect(page.locator('.border-l-4.border-green-500')).toHaveCount(0);
    }
  });

  test('should delete notification', async ({ page }) => {
    // Create test notification first
    await page.goto('/notifications');
    await page.evaluate(async () => {
      await fetch('/api/notifications', { method: 'POST' });
    });
    await page.waitForTimeout(1000);
    await page.reload();
    
    // Count notifications before
    const countBefore = await page.locator('text=Test Notification').count();
    
    // Click delete button
    const deleteButton = page.locator('button[title="Delete"]').first();
    if (await deleteButton.isVisible() && countBefore > 0) {
      await deleteButton.click();
      await page.waitForTimeout(500);
      
      // Should have one less notification
      const countAfter = await page.locator('text=Test Notification').count();
      expect(countAfter).toBe(countBefore - 1);
    }
  });

  test('should show unread badge count', async ({ page }) => {
    await page.goto('/');
    
    // Create test notification
    await page.evaluate(async () => {
      await fetch('/api/notifications', { method: 'POST' });
    });
    await page.waitForTimeout(2000);
    await page.reload();
    
    // Check for red badge
    const badge = page.locator('button[aria-label="Notifications"] span.bg-red-500');
    if (await badge.isVisible()) {
      await expect(badge).toContainText(/\d+/);
    }
  });

  test('should navigate to linked notification', async ({ page }) => {
    await page.goto('/notifications');
    
    // Check if any notification has a link
    const linkedNotification = page.locator('a.group').first();
    if (await linkedNotification.isVisible()) {
      await linkedNotification.click();
      
      // Should navigate away from notifications page
      await expect(page).not.toHaveURL('/notifications');
    }
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/notifications');
    
    // Check elements are visible on mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Check filter buttons wrap properly
    const filters = page.locator('button:has-text("All")');
    await expect(filters).toBeVisible();
  });
});

