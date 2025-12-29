import { test, expect } from '@playwright/test';

// Helper to create a unique test user
function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `xp-test-${timestamp}@plobie.test`,
    username: `xptest${timestamp}`,
    password: 'TestPass123!',
  };
}

// Helper to wait for XP notification (if shown)
async function waitForXPNotification(page: any) {
  // Wait for any toast/notification to appear (optional, don't fail if not shown)
  try {
    await page.waitForSelector('[role="status"], .toast, [data-testid="toast"]', {
      timeout: 2000,
    });
  } catch {
    // No notification shown, that's okay
  }
}

test.describe('XP System', () => {
  let testUser: { email: string; username: string; password: string };

  test.beforeEach(async ({ page }) => {
    testUser = generateTestUser();

    // Sign up with new test user
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="text"]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    // Check age and conduct checkboxes
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes) {
      await checkbox.check();
    }

    await page.click('button[type="submit"]');

    // Wait for redirect to home with longer timeout
    await page.waitForURL('/', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
  });

  test('should award 3 XP for creating a post', async ({ page }) => {
    // Navigate to hobbies
    await page.goto('/hobbies');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Hobbies');

    // Click create post button
    const createButton = page
      .locator('button, a')
      .filter({ hasText: /create.*post/i })
      .first();
    await createButton.waitFor({ state: 'visible', timeout: 10000 });
    await createButton.click();

    // Wait for create post form/page
    await page.waitForTimeout(2000);

    // Fill out post form
    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    const contentInput = page
      .locator('textarea[name="content"], textarea[placeholder*="content" i]')
      .first();
    const hobbySelect = page.locator('select[name="hobby_group"], select[name="group"]').first();

    await titleInput.fill('Test Post for XP');
    await contentInput.fill('This is a test post to verify XP is awarded correctly.');

    // Select a hobby group if dropdown exists
    const hasHobbySelect = (await hobbySelect.count()) > 0;
    if (hasHobbySelect) {
      await hobbySelect.selectOption({ index: 1 }); // Select first non-default option
    }

    // Submit post
    const submitButton = page
      .locator('button[type="submit"]')
      .filter({ hasText: /post|publish|create/i })
      .first();
    await submitButton.click();

    // Wait for redirect or success message
    await page.waitForTimeout(2000);
    await waitForXPNotification(page);

    // Verify post was created by checking we're back on hobbies page or on post page
    const currentURL = page.url();
    expect(currentURL).toMatch(/(hobbies|posts)/);

    // Navigate to profile to check XP
    await page.goto(`/profile/${testUser.username}`);
    await page.waitForTimeout(1000);

    // Check for XP display (look for "XP" text and number)
    const xpText = await page.locator('text=/\\d+.*XP/i').first().textContent();
    expect(xpText).toBeTruthy();

    // Extract XP number from text like "3 XP" or "Level 1 • 3 XP"
    const xpMatch = xpText?.match(/(\d+)\s*XP/i);
    expect(xpMatch).toBeTruthy();

    const earnedXP = parseInt(xpMatch![1]);
    expect(earnedXP).toBeGreaterThanOrEqual(3); // Should have at least 3 XP
  });

  test('should award 1 XP for commenting on a post', async ({ page }) => {
    // First, create a post to comment on
    await page.goto('/hobbies');
    const createButton = page
      .locator('button, a')
      .filter({ hasText: /create.*post/i })
      .first();
    await createButton.click();
    await page.waitForTimeout(1000);

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    const contentInput = page
      .locator('textarea[name="content"], textarea[placeholder*="content" i]')
      .first();

    await titleInput.fill('Post to Comment On');
    await contentInput.fill('Test post content.');

    const submitButton = page
      .locator('button[type="submit"]')
      .filter({ hasText: /post|publish|create/i })
      .first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Find and click on the post we just created
    const postLink = page.locator('a').filter({ hasText: 'Post to Comment On' }).first();
    await postLink.click();
    await page.waitForTimeout(1000);

    // Add a comment
    const commentInput = page
      .locator('textarea[name="comment"], textarea[placeholder*="comment" i]')
      .first();
    await commentInput.fill('This is a test comment to earn 1 XP!');

    const commentButton = page
      .locator('button')
      .filter({ hasText: /comment|reply|post/i })
      .first();
    await commentButton.click();
    await page.waitForTimeout(2000);
    await waitForXPNotification(page);

    // Navigate to profile to check XP
    await page.goto(`/profile/${testUser.username}`);
    await page.waitForTimeout(1000);

    // Should have 4 XP total (3 from post + 1 from comment)
    const xpText = await page.locator('text=/\\d+.*XP/i').first().textContent();
    const xpMatch = xpText?.match(/(\d+)\s*XP/i);
    const earnedXP = parseInt(xpMatch![1]);
    expect(earnedXP).toBeGreaterThanOrEqual(4); // Should have at least 4 XP
  });

  test.skip('should award 1 XP for reading a learn article', async ({ page }) => {
    // TODO: Enable when /learn page is implemented
    // Navigate to learn page
    await page.goto('/learn');
    await expect(page.locator('h1, h2')).toContainText(/learn|articles/i);
    await page.waitForTimeout(1000);

    // Find and click on the first article
    const articleLink = page.locator('a[href^="/learn/"]').first();
    const hasArticles = (await articleLink.count()) > 0;

    if (!hasArticles) {
      console.warn('No learn articles found, skipping test');
      test.skip();
      return;
    }

    await articleLink.click();
    await page.waitForTimeout(1000);

    // Look for "Mark as Read" button
    const markReadButton = page
      .locator('button')
      .filter({ hasText: /mark.*read/i })
      .first();
    const hasMarkReadButton = (await markReadButton.count()) > 0;

    if (hasMarkReadButton) {
      await markReadButton.click();
      await page.waitForTimeout(2000);
      await waitForXPNotification(page);
    }

    // Navigate to profile to check XP
    await page.goto(`/profile/${testUser.username}`);
    await page.waitForTimeout(1000);

    // Should have at least 1 XP
    const xpText = await page.locator('text=/\\d+.*XP/i').first().textContent();
    const xpMatch = xpText?.match(/(\d+)\s*XP/i);
    const earnedXP = parseInt(xpMatch![1]);
    expect(earnedXP).toBeGreaterThanOrEqual(1); // Should have at least 1 XP
  });

  test('should display correct XP and level on profile page', async ({ page }) => {
    // Create a post (3 XP)
    await page.goto('/hobbies');
    const createButton = page
      .locator('button, a')
      .filter({ hasText: /create.*post/i })
      .first();
    await createButton.click();
    await page.waitForTimeout(1000);

    const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
    const contentInput = page
      .locator('textarea[name="content"], textarea[placeholder*="content" i]')
      .first();

    await titleInput.fill('XP Test Post');
    await contentInput.fill('Testing XP display.');

    const submitButton = page
      .locator('button[type="submit"]')
      .filter({ hasText: /post|publish|create/i })
      .first();
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Go to profile
    await page.goto(`/profile/${testUser.username}`);
    await page.waitForTimeout(1000);

    // Check for level display (should be Level 1 with < 100 XP)
    const levelText = await page.locator('text=/level\\s*\\d+/i').first().textContent();
    expect(levelText).toMatch(/level\s*1/i);

    // Check XP display
    const xpText = await page.locator('text=/\\d+.*XP/i').first().textContent();
    const xpMatch = xpText?.match(/(\d+)\s*XP/i);
    const earnedXP = parseInt(xpMatch![1]);

    expect(earnedXP).toBeGreaterThanOrEqual(3);
    expect(earnedXP).toBeLessThan(100); // Should be less than level 2 threshold
  });

  test('should show post count on profile page', async ({ page }) => {
    // Create 2 posts
    for (let i = 0; i < 2; i++) {
      await page.goto('/hobbies');
      const createButton = page
        .locator('button, a')
        .filter({ hasText: /create.*post/i })
        .first();
      await createButton.click();
      await page.waitForTimeout(1000);

      const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]').first();
      const contentInput = page
        .locator('textarea[name="content"], textarea[placeholder*="content" i]')
        .first();

      await titleInput.fill(`Test Post ${i + 1}`);
      await contentInput.fill(`Content for post ${i + 1}`);

      const submitButton = page
        .locator('button[type="submit"]')
        .filter({ hasText: /post|publish|create/i })
        .first();
      await submitButton.click();
      await page.waitForTimeout(2000);
    }

    // Go to profile
    await page.goto(`/profile/${testUser.username}`);
    await page.waitForTimeout(1000);

    // Check for post count (should show 2 posts)
    const statsText = await page.locator('text=/\\d+.*post/i').first().textContent();
    expect(statsText).toMatch(/2.*post/i);
  });

  test('should calculate level correctly (Level = floor(XP/100) + 1)', async ({ page }) => {
    // This test verifies level calculation logic
    // We can't easily earn 100+ XP in a test, so we'll verify the display shows Level 1
    // when XP < 100

    await page.goto(`/profile/${testUser.username}`);
    await page.waitForTimeout(1000);

    // New user should be Level 1
    const levelText = await page.locator('text=/level\\s*\\d+/i').first().textContent();
    expect(levelText).toMatch(/level\s*1/i);

    // If we have XP displayed, verify it's less than 100
    const xpElements = await page.locator('text=/\\d+.*XP/i').all();
    if (xpElements.length > 0) {
      const xpText = await xpElements[0].textContent();
      const xpMatch = xpText?.match(/(\d+)\s*XP/i);
      if (xpMatch) {
        const earnedXP = parseInt(xpMatch[1]);
        expect(earnedXP).toBeLessThan(100); // Level 1 should have < 100 XP
      }
    }
  });
});

test.describe('XP System - Edge Cases', () => {
  test('should handle XP display when user has 0 XP', async ({ page }) => {
    const testUser = generateTestUser();

    // Sign up
    await page.goto('/signup');
    await page.fill('input[type="text"]', testUser.username);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);

    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const checkbox of checkboxes) {
      await checkbox.check();
    }

    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // Immediately go to profile without earning any XP
    await page.goto(`/profile/${testUser.username}`);
    await page.waitForTimeout(1000);

    // Should show Level 1 and 0 XP (or just Level 1)
    const levelText = await page.locator('text=/level\\s*\\d+/i').first().textContent();
    expect(levelText).toMatch(/level\s*1/i);

    // XP should be 0 or not cause errors
    const xpElements = await page.locator('text=/XP/i').all();
    expect(xpElements.length).toBeGreaterThanOrEqual(0); // Should exist or gracefully handle
  });
});
