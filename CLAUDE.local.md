# Plobie Development Guide

## Project Overview
Plant-centered social commerce MVP with 4 main tabs: Hobbies, My Plants, Games, Shop.
Target: 90-102 hrs build time, demo first week of January.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage, RLS)
- **Payments:** Stripe (test mode first)
- **Hosting:** Vercel (staging + prod)
- **Analytics:** Google Analytics 4
- **Error Tracking:** Sentry
- **Unity:** WebGL embedded at /my-plants

## Common Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run typecheck        # Run TypeScript checks
npm run lint             # Run ESLint

# Database
npx supabase db reset    # Reset local DB
npx supabase db push     # Push migrations
tsx scripts/seed-dev.ts  # Seed dev data

# Stripe
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Testing
npm test                 # Run all tests
npm test -- --watch      # Watch mode
```

## Code Style
- Use TypeScript strict mode
- Prefer function components with hooks
- Use Zod for validation
- Destructure imports: `import { foo } from 'bar'`
- Use ES modules (import/export), not CommonJS
- All API routes return `ApiResponse<T>` type
- Use `createClient` from lib/supabase.ts (never expose service key to client)

## Key Files
- `lib/types.ts` - All TypeScript types and Zod schemas
- `lib/supabase.ts` - Supabase client factory
- `lib/xp-engine.ts` - XP rules and application logic
- `lib/analytics.ts` - GA4 event catalog
- `lib/unity-bridge.ts` - Unity WebGL message protocol

## Database
- All tables use UUID primary keys
- RLS (Row Level Security) enabled on all tables
- Service role only for webhooks and XP application
- Migrations in `supabase/migrations/`

## XP System Rules
- `post_create`: +3 XP (cap 5/day)
- `comment_create`: +1 XP (cap 10/day)
- `learn_read`: +1 XP (cap 5/day, 1 per article)
- `game_play_30m`: +2 XP (cap 4/day)
- `pot_link`: +50 XP (one-time per pot)
- Daily total cap: 100 XP across all actions

## Testing Checklist
- [ ] Typecheck passes (`npm run typecheck`)
- [ ] Linter passes (`npm run lint`)
- [ ] All tests pass (`npm test`)
- [ ] Manual smoke test of changed features
- [ ] Check Sentry for new errors

## Git Workflow
- Branch from `main` for each feature
- Branch naming: `feature/description` or `fix/description`
- Commit messages: conventional commits format
- Always pull before pushing
- Squash commits before merging to main

## Security Notes
- Never commit `.env` or `.env.local`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- Never expose `STRIPE_SECRET_KEY` to client
- All webhooks verify signatures
- All user inputs validated with Zod

## Tax & Business Requirements
**Launch Structure:** Sole Proprietorship (Tennessee)
- Withhold 25% of all revenue for taxes
- Use basic tax settings (no S-Corp logic yet)
- Florida tax NOT required (not registered in FL)
- Build with flexible tax configuration for future S-Corp transition
- Documentation in Dropbox: `Plobie_Technical and Organization/`

**Launch Weekend:**
- Initial "give-away weekend" planned
- 300-500 pots will be distributed to public
- Expect update needed during this launch period

## Feature Flags
Use feature flags for new features:
```typescript
const flags = await getFeatureFlags();
if (flags.shop_enabled) { /* ... */ }
```

## Unity Integration
- Unity communicates via postMessage
- Parent → Unity: `SPAWN_POT`, `SET_PROFILE`, `SET_FLAGS`, `REMOVE_POT`
- Unity → Parent: `UNITY_READY`, `POT_SELECTED`, `POT_SPAWNED`, `HUD_EVENT`

## QR Claim Flow
1. Scan QR → `/claim?code=ABC123`
2. GET `/api/pots/claim-token` → returns JWT (10 min TTL)
3. POST `/api/pots/claim` with JWT → binds pot to user, awards +50 XP
4. Rate limits: 5 token requests/min (IP), 3 claims/hr (user)

## Stripe Integration
- All checkout sessions use order.id as idempotency key
- Webhooks dedupe via `stripe_events.id` unique constraint
- Test locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Analytics Events
Fire GA4 events for: user_signup, purchase, pot_claim_started, pot_claim_succeeded, xp_awarded, game_session_started, post_created, comment_created

## Important Notes
- ALWAYS use RLS policies; never bypass with service role on client
- ALWAYS validate user input with Zod before processing
- ALWAYS use idempotency keys for Stripe operations
- ALWAYS check rate limits on sensitive endpoints
- PM/budget docs stay LOCAL ONLY (never commit)
- NO AI fingerprints in code or comments (write like a human engineer)

## MVP Scope
**In Scope:**
- Auth (email, Google, Apple)
- Shop (40-50 SKUs, Stripe checkout)
- My Plants (Unity WebGL, QR claim, 5 pots max)
- Games (1-2 embedded games)
- Hobbies (minimal: feed, post, comment, report)
- XP system with caps/cooldowns

**Deferred:**
- Multiplayer gardens
- Advanced Hobbies features (voting, badges)
- Memberships/subscriptions
- Heavy content packs
- Mobile app

