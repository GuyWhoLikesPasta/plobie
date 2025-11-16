import { describe, it, expect, vi, beforeEach } from 'vitest';
import { XP_RULES, DAILY_TOTAL_CAP } from '../xp-engine';
import type { XPActionType } from '../types';

describe('XP Rules Configuration', () => {
  it('should have correct base XP values', () => {
    expect(XP_RULES.post_create.base).toBe(3);
    expect(XP_RULES.comment_create.base).toBe(1);
    expect(XP_RULES.learn_read.base).toBe(1);
    expect(XP_RULES.game_play_30m.base).toBe(2);
    expect(XP_RULES.pot_link.base).toBe(50);
  });

  it('should have correct daily caps', () => {
    expect(XP_RULES.post_create.dailyCap).toBe(5);
    expect(XP_RULES.comment_create.dailyCap).toBe(10);
    expect(XP_RULES.learn_read.dailyCap).toBe(5);
    expect(XP_RULES.game_play_30m.dailyCap).toBe(4);
    expect(XP_RULES.pot_link.dailyCap).toBeNull();
  });

  it('should have daily total cap set to 100', () => {
    expect(DAILY_TOTAL_CAP).toBe(100);
  });

  it('should have all action types defined', () => {
    const actionTypes: XPActionType[] = [
      'post_create',
      'comment_create',
      'learn_read',
      'game_play_30m',
      'pot_link',
      'admin_adjust',
    ];

    actionTypes.forEach(action => {
      expect(XP_RULES[action]).toBeDefined();
    });
  });
});

describe('XP Calculation Logic', () => {
  it('should calculate correct XP for multiple actions', () => {
    // 3 posts = 9 XP
    const postsXP = XP_RULES.post_create.base! * 3;
    expect(postsXP).toBe(9);

    // 5 comments = 5 XP
    const commentsXP = XP_RULES.comment_create.base! * 5;
    expect(commentsXP).toBe(5);

    // 1 pot link = 50 XP
    const potXP = XP_RULES.pot_link.base!;
    expect(potXP).toBe(50);

    // Total should be 64 XP
    const total = postsXP + commentsXP + potXP;
    expect(total).toBe(64);
  });

  it('should respect daily caps per action', () => {
    // Max posts per day: 5 * 3 = 15 XP
    const maxPostsXP = XP_RULES.post_create.dailyCap! * XP_RULES.post_create.base!;
    expect(maxPostsXP).toBe(15);

    // Max comments per day: 10 * 1 = 10 XP
    const maxCommentsXP = XP_RULES.comment_create.dailyCap! * XP_RULES.comment_create.base!;
    expect(maxCommentsXP).toBe(10);

    // Max game sessions per day: 4 * 2 = 8 XP
    const maxGamesXP = XP_RULES.game_play_30m.dailyCap! * XP_RULES.game_play_30m.base!;
    expect(maxGamesXP).toBe(8);
  });

  it('should not exceed daily total cap', () => {
    // If user maxes out all actions
    const maxPossibleXP = 
      (XP_RULES.post_create.dailyCap! * XP_RULES.post_create.base!) + // 15
      (XP_RULES.comment_create.dailyCap! * XP_RULES.comment_create.base!) + // 10
      (XP_RULES.learn_read.dailyCap! * XP_RULES.learn_read.base!) + // 5
      (XP_RULES.game_play_30m.dailyCap! * XP_RULES.game_play_30m.base!); // 8
    // Total = 38 XP

    expect(maxPossibleXP).toBeLessThan(DAILY_TOTAL_CAP);
  });

  it('should allow pot linking to exceed daily cap', () => {
    // Pot linking is 50 XP one-time
    // User could potentially earn 38 XP from other actions + 50 from pot = 88 XP in one day
    const withPot = 38 + XP_RULES.pot_link.base!;
    expect(withPot).toBe(88);
    expect(withPot).toBeLessThan(DAILY_TOTAL_CAP);
  });
});

describe('XP Action Type Guards', () => {
  it('should accept valid action types', () => {
    const validActions: XPActionType[] = [
      'post_create',
      'comment_create',
      'learn_read',
      'game_play_30m',
      'pot_link',
      'admin_adjust',
    ];

    validActions.forEach(action => {
      expect(XP_RULES[action]).toBeDefined();
    });
  });

  it('should have special handling for admin_adjust', () => {
    expect(XP_RULES.admin_adjust.base).toBeNull();
    expect(XP_RULES.admin_adjust.dailyCap).toBeNull();
    expect(XP_RULES.admin_adjust.cooldown).toBeNull();
  });
});

