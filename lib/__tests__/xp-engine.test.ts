import { describe, it, expect } from 'vitest';
import {
  XP_RULES,
  DAILY_TOTAL_CAP,
  MAX_LEVEL,
  xpForNextLevel,
  totalXpForLevel,
  levelFromTotalXp,
  xpProgressInLevel,
} from '../xp-engine';
import type { XPActionType } from '../types';

describe('XP Rules Configuration', () => {
  it('should have correct base XP values per Connor spec', () => {
    // My Plants actions
    expect(XP_RULES.pot_claim.base).toBe(500);
    expect(XP_RULES.pot_scan.base).toBe(200);
    expect(XP_RULES.garden_care.base).toBe(25);
    expect(XP_RULES.neighbor_visit.base).toBe(50);
    expect(XP_RULES.plant_register.base).toBe(150);

    // Hobbies actions
    expect(XP_RULES.post_create.base).toBe(20);
    expect(XP_RULES.comment_create.base).toBe(2);
    expect(XP_RULES.learn_read.base).toBe(10);
    expect(XP_RULES.post_like_received.base).toBe(1);

    // Games actions
    expect(XP_RULES.game_play_30m.base).toBe(20);
    expect(XP_RULES.game_new.base).toBe(10);

    // Legacy
    expect(XP_RULES.pot_link.base).toBe(500);
  });

  it('should have correct daily caps per Connor spec', () => {
    expect(XP_RULES.post_create.dailyCap).toBe(10);
    expect(XP_RULES.comment_create.dailyCap).toBe(20);
    expect(XP_RULES.learn_read.dailyCap).toBe(10);
    expect(XP_RULES.game_play_30m.dailyCap).toBe(6);
    expect(XP_RULES.garden_care.dailyCap).toBe(8);
    expect(XP_RULES.pot_claim.dailyCap).toBeNull();
  });

  it('should have daily total cap set to 3000 per Connor spec', () => {
    expect(DAILY_TOTAL_CAP).toBe(3000);
  });

  it('should have max level set to 250', () => {
    expect(MAX_LEVEL).toBe(250);
  });

  it('should have all core action types defined', () => {
    const actionTypes: XPActionType[] = [
      'pot_claim',
      'pot_scan',
      'garden_care',
      'neighbor_visit',
      'plant_register',
      'post_create',
      'comment_create',
      'learn_read',
      'game_play_30m',
      'game_new',
      'admin_adjust',
    ];

    actionTypes.forEach(action => {
      expect(XP_RULES[action]).toBeDefined();
    });
  });
});

describe('XP Calculation Logic', () => {
  it('should calculate correct XP for multiple actions', () => {
    // 3 posts = 60 XP
    const postsXP = XP_RULES.post_create.base! * 3;
    expect(postsXP).toBe(60);

    // 5 comments = 10 XP
    const commentsXP = XP_RULES.comment_create.base! * 5;
    expect(commentsXP).toBe(10);

    // 1 pot claim = 500 XP
    const potXP = XP_RULES.pot_claim.base!;
    expect(potXP).toBe(500);

    // Total should be 570 XP
    const total = postsXP + commentsXP + potXP;
    expect(total).toBe(570);
  });

  it('should respect daily caps per action', () => {
    // Max posts per day: 10 * 20 = 200 XP
    const maxPostsXP = XP_RULES.post_create.dailyCap! * XP_RULES.post_create.base!;
    expect(maxPostsXP).toBe(200);

    // Max comments per day: 20 * 2 = 40 XP
    const maxCommentsXP = XP_RULES.comment_create.dailyCap! * XP_RULES.comment_create.base!;
    expect(maxCommentsXP).toBe(40);

    // Max game sessions per day: 6 * 20 = 120 XP
    const maxGamesXP = XP_RULES.game_play_30m.dailyCap! * XP_RULES.game_play_30m.base!;
    expect(maxGamesXP).toBe(120);

    // Max learn per day: 10 * 10 = 100 XP
    const maxLearnXP = XP_RULES.learn_read.dailyCap! * XP_RULES.learn_read.base!;
    expect(maxLearnXP).toBe(100);
  });

  it('should have daily cap that allows significant engagement', () => {
    // Calculate max daily XP from capped actions
    const maxCappedXP =
      XP_RULES.post_create.dailyCap! * XP_RULES.post_create.base! + // 200
      XP_RULES.comment_create.dailyCap! * XP_RULES.comment_create.base! + // 40
      XP_RULES.learn_read.dailyCap! * XP_RULES.learn_read.base! + // 100
      XP_RULES.game_play_30m.dailyCap! * XP_RULES.game_play_30m.base! + // 120
      XP_RULES.garden_care.dailyCap! * XP_RULES.garden_care.base!; // 200
    // Total = 660 XP from capped activities

    expect(maxCappedXP).toBe(660);
    expect(maxCappedXP).toBeLessThan(DAILY_TOTAL_CAP);
  });

  it('should allow pot claims to add significant XP', () => {
    // A user claiming a pot should get substantial XP
    const potClaimXP = XP_RULES.pot_claim.base!;
    expect(potClaimXP).toBe(500);

    // Daily activity + pot claim should be under cap
    const dailyActivity = 660; // from capped actions
    const withPotClaim = dailyActivity + potClaimXP;
    expect(withPotClaim).toBe(1160);
    expect(withPotClaim).toBeLessThan(DAILY_TOTAL_CAP);
  });
});

describe('Leveling System', () => {
  it('should calculate Tier 1 XP requirements correctly', () => {
    // Tier 1: 150 + 17*(L-1)
    expect(xpForNextLevel(1)).toBe(150); // Level 1 -> 2
    expect(xpForNextLevel(2)).toBe(167); // Level 2 -> 3
    expect(xpForNextLevel(10)).toBe(303); // Level 10 -> 11
    expect(xpForNextLevel(49)).toBe(966); // Level 49 -> 50 (last Tier 1)
  });

  it('should calculate Tier 2 XP requirements correctly', () => {
    // Tier 2: 1000 + 30*(L-50)
    expect(xpForNextLevel(50)).toBe(1000); // Level 50 -> 51
    expect(xpForNextLevel(51)).toBe(1030); // Level 51 -> 52
    expect(xpForNextLevel(75)).toBe(1750); // Level 75 -> 76
    expect(xpForNextLevel(99)).toBe(2470); // Level 99 -> 100 (last Tier 2)
  });

  it('should calculate Tier 3 XP requirements correctly', () => {
    // Tier 3: 2500 + 40*(L-100)
    expect(xpForNextLevel(100)).toBe(2500); // Level 100 -> 101
    expect(xpForNextLevel(101)).toBe(2540); // Level 101 -> 102
    expect(xpForNextLevel(150)).toBe(4500); // Level 150 -> 151
    expect(xpForNextLevel(249)).toBe(8460); // Level 249 -> 250 (last)
  });

  it('should return Infinity for max level', () => {
    expect(xpForNextLevel(250)).toBe(Infinity);
    expect(xpForNextLevel(251)).toBe(Infinity);
  });

  it('should calculate total XP for levels correctly', () => {
    expect(totalXpForLevel(1)).toBe(0); // Start at level 1
    expect(totalXpForLevel(2)).toBe(150); // 150 to reach level 2
    expect(totalXpForLevel(3)).toBe(317); // 150 + 167
  });

  it('should calculate level from total XP correctly', () => {
    expect(levelFromTotalXp(0)).toBe(1);
    expect(levelFromTotalXp(100)).toBe(1); // Not enough for level 2
    expect(levelFromTotalXp(150)).toBe(2); // Exactly level 2
    expect(levelFromTotalXp(151)).toBe(2); // Just into level 2
    expect(levelFromTotalXp(317)).toBe(3); // Exactly level 3
  });

  it('should calculate XP progress within level', () => {
    // At exactly level 2 (150 XP)
    let progress = xpProgressInLevel(150);
    expect(progress.current).toBe(0);
    expect(progress.required).toBe(167);
    expect(progress.percentage).toBe(0);

    // Halfway through level 2
    progress = xpProgressInLevel(233); // 150 + 83
    expect(progress.current).toBe(83);
    expect(progress.required).toBe(167);
    expect(progress.percentage).toBe(50);

    // Almost level 3
    progress = xpProgressInLevel(316);
    expect(progress.current).toBe(166);
    expect(progress.required).toBe(167);
    expect(progress.percentage).toBe(99);
  });
});

describe('XP Action Type Guards', () => {
  it('should accept valid action types', () => {
    const validActions: XPActionType[] = [
      'pot_claim',
      'pot_scan',
      'garden_care',
      'neighbor_visit',
      'plant_register',
      'post_create',
      'comment_create',
      'learn_read',
      'game_play_30m',
      'game_new',
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

  it('should have milestone actions with no daily cap', () => {
    expect(XP_RULES.milestone_plants.dailyCap).toBeNull();
    expect(XP_RULES.milestone_stickers.dailyCap).toBeNull();
    expect(XP_RULES.taxonomy_collector.dailyCap).toBeNull();
  });
});
