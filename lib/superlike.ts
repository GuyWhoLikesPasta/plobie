export const SUPERLIKE_CONFIG = {
  PACK_SIZE: 5,
  PACK_PRICE_CENTS: 725,
  CREATOR_EARNING_CENTS: 85,
  PACK_LABEL: '5 Superlikes for $7.25',
  MARGIN_PERCENT: 35,
} as const;

export interface SuperlikeBalance {
  balance: number;
  total_purchased: number;
  total_used: number;
}

export interface CreatorEarnings {
  balance_cents: number;
  lifetime_earned_cents: number;
  lifetime_paid_cents: number;
}
