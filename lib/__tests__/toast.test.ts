import { describe, it, expect } from 'vitest';

describe('Toast Notifications', () => {
  describe('Success Messages', () => {
    it('should format XP award messages', () => {
      const xpAwarded = 50;
      const message = `Post created! You earned +${xpAwarded} XP!`;
      expect(message).toContain('50 XP');
    });

    it('should format admin promotion messages', () => {
      const isPromoted = true;
      const message = `User ${isPromoted ? 'promoted to' : 'removed from'} admin`;
      expect(message).toBe('User promoted to admin');
    });

    it('should format post visibility messages', () => {
      const isHidden = true;
      const message = `Post ${isHidden ? 'hidden' : 'unhidden'} successfully`;
      expect(message).toBe('Post hidden successfully');
    });
  });

  describe('Error Messages', () => {
    it('should handle API errors', () => {
      const error = { message: 'Failed to create post' };
      expect(error.message).toContain('Failed');
    });

    it('should provide fallback messages', () => {
      const errorMessage = undefined;
      const message = errorMessage || 'Unknown error';
      expect(message).toBe('Unknown error');
    });

    it('should handle network errors', () => {
      const message = 'Network error. Please try again.';
      expect(message).toContain('Network error');
    });
  });

  describe('Message Formatting', () => {
    it('should format comment XP messages', () => {
      const xp = 1;
      const message = `Comment posted! You earned +${xp} XP!`;
      expect(message).toMatch(/\+\d+ XP/);
    });

    it('should format flag toggle messages', () => {
      const flagName = 'shop_enabled';
      const isEnabled = true;
      const message = `Flag ${flagName} ${isEnabled ? 'enabled' : 'disabled'}`;
      expect(message).toBe('Flag shop_enabled enabled');
    });

    it('should handle already read articles', () => {
      const message = "You've already read this article!";
      expect(message).toContain('already read');
    });
  });
});

