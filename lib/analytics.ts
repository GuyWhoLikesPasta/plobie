// Google Analytics 4 Event Tracking

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GA4_EVENTS = {
  // Auth
  user_signup: (method: string) => ({
    event: 'user_signup',
    method, // 'email' | 'google' | 'apple'
  }),
  
  // Shop
  view_item: (product_id: string, product_name: string, price_cents: number) => ({
    event: 'view_item',
    currency: 'USD',
    value: price_cents / 100,
    items: [{ item_id: product_id, item_name: product_name, price: price_cents / 100 }],
  }),
  
  add_to_cart: (variant_id: string, sku: string, price_cents: number, quantity: number) => ({
    event: 'add_to_cart',
    currency: 'USD',
    value: (price_cents * quantity) / 100,
    items: [{ item_id: variant_id, item_name: sku, price: price_cents / 100, quantity }],
  }),
  
  begin_checkout: (order_id: string, total_cents: number) => ({
    event: 'begin_checkout',
    currency: 'USD',
    value: total_cents / 100,
    transaction_id: order_id,
  }),
  
  purchase: (order_id: string, total_cents: number, items: any[]) => ({
    event: 'purchase',
    currency: 'USD',
    value: total_cents / 100,
    transaction_id: order_id,
    items,
  }),
  
  // QR Claim
  pot_claim_started: (code: string) => ({
    event: 'pot_claim_started',
    pot_code: code,
  }),
  
  pot_claim_succeeded: (pot_id: string, xp_awarded: number) => ({
    event: 'pot_claim_succeeded',
    pot_id,
    xp_awarded,
  }),
  
  pot_claim_failed: (code: string, reason: string) => ({
    event: 'pot_claim_failed',
    pot_code: code,
    reason, // 'already_claimed' | 'invalid_code' | 'rate_limited'
  }),
  
  // XP
  xp_awarded: (action_type: string, amount: number, new_balance: number) => ({
    event: 'xp_awarded',
    action_type,
    amount,
    new_balance,
  }),
  
  // Games
  game_session_started: (game_slug: string) => ({
    event: 'game_session_started',
    game_slug,
  }),
  
  game_session_ended: (game_slug: string, duration_minutes: number, xp_awarded: number) => ({
    event: 'game_session_ended',
    game_slug,
    duration_minutes,
    xp_awarded,
  }),
  
  // Community
  post_created: (group_slug: string, has_image: boolean) => ({
    event: 'post_created',
    group_slug,
    has_image,
  }),
  
  comment_created: (post_id: string) => ({
    event: 'comment_created',
    post_id,
  }),
  
  report_submitted: (entity_type: string) => ({
    event: 'report_submitted',
    entity_type,
  }),
} as const;

export function trackEvent<K extends keyof typeof GA4_EVENTS>(
  eventName: K,
  ...args: Parameters<typeof GA4_EVENTS[K]>
) {
  if (typeof window === 'undefined' || !window.gtag) {
    // Server-side or gtag not loaded
    return;
  }
  
  const eventData = (GA4_EVENTS[eventName] as any)(...args);
  window.gtag('event', eventData.event, eventData);
}

// Initialize GA4 (call in layout or _app)
export function initGA4(measurementId: string) {
  if (typeof window === 'undefined') return;
  
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

