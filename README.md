# 🌱 Plobie

A plant-centered social commerce platform connecting real-world pottery, digital gardens, and a vibrant community of plant enthusiasts.

## 🚀 Features

**Core Systems:**
- ✅ Authentication - Email, OAuth (Google, Apple), Password Reset
- ✅ Shop - E-commerce with Stripe integration
- ✅ Gift Cards - Mother's Day promo ($20 → $45 value, 125% bonus)
- ✅ QR Claiming - Link physical pots (+500 XP per pot)
- ✅ XP System - Tiered leveling (250 levels), 25+ action types, 3000 XP daily cap

**Community:**
- ✅ Posts & Comments - Create content, earn XP
- ✅ Image Uploads - Share photos (5MB limit)
- ✅ Reactions - Like posts with ❤️
- ✅ Search & Filters - Find posts by keyword or hobby group
- ✅ User Profiles - View stats, posts, and achievements

**Content:**
- ✅ Learn Articles - 24 educational guides (+10 XP per article, cap 10/day)
- ✅ My Plants Dashboard - View collection and stats
- ✅ Achievements System - 15+ unlockable achievements with XP rewards

**Admin:**
- ✅ User Management - Promote admins, view user stats
- ✅ Content Moderation - Delete/hide posts and comments
- ✅ Feature Flags - Toggle features on/off
- ✅ Analytics Dashboard - View platform metrics

**Notifications:**
- ✅ Real-time Notifications - Bell icon with unread badge
- ✅ Notification Types - Comments, likes, level-ups, XP caps, achievements
- ✅ Achievement Notifications - Auto-notify when unlocking achievements
- ✅ Full Notifications Page - History, filters, management
- ✅ Auto-refresh - 30-second polling for updates

**Performance:**
- ✅ Lighthouse Scores - 94-98% perf, 100% a11y, 100% bp, 100% seo (production)
- ✅ WCAG AA Compliant - 4.5:1 contrast ratio on all buttons
- ✅ Image Optimization - next/image with AVIF/WebP
- ✅ Lazy Loading - Images load on scroll
- ✅ Database Indexes - 15+ optimized queries
- ✅ Bundle Optimization - Code splitting and tree-shaking
- ✅ Core Web Vitals - Optimized LCP, FID, CLS
- ✅ Font Optimization - Preloaded with display swap

**Quality:**
- ✅ 101 unit tests passing
- ✅ TypeScript strict mode
- ✅ 100% mobile responsive (16 pages)
- ✅ Toast notifications
- ✅ Skeleton loading states
- ✅ Error boundaries (loading, error, 404 pages)
- ✅ SEO optimized (metadata, Open Graph, Twitter Cards)
- ✅ WCAG 2.1 AA compliant (accessibility)
- ✅ Pre-commit hooks (ESLint, Prettier, TypeScript)

**Monitoring:**
- ✅ Sentry Error Tracking - Client, server, and edge
- ✅ Vercel Analytics - Page views and user metrics
- ✅ Speed Insights - Core Web Vitals (LCP, FID, CLS)
- ✅ Session Replay - Debug user issues (10% sampling)
- ✅ Performance Monitoring - Real user metrics

**Developer Tools:**
- ✅ Database Reset Script - Clean dev environment
- ✅ Test User Creation - test@plobie.com
- ✅ Admin Role Management - Grant/revoke admin
- ✅ Data Seeding - Products, pots, sample data

**Unity Integration:** ✅ **Ready for James**
- ✅ User Profile API - Get user data, XP, level, stats
- ✅ Game Session API - Track playtime, award XP (20 XP per 30 min block)
- ✅ Game Progress API - Save/load game state (up to 1MB)
- ✅ Action XP API - Reward in-game achievements (1-100 XP)
- ✅ JavaScript Bridge - `window.plobie.getAccessToken()` for auth
- ✅ Local Unity Hosting - `/public/unity/` with iframe embedding
- ✅ Test User - unity_test@plobie.com (password: UnityTest123!)
- ✅ Complete Documentation - See `.local-docs/unity/`

**Production:** https://plobie.vercel.app

**Status:** ✅ All systems operational | Unity integration ready | Gift cards live

**Security:**
- ✅ Rate limiting on checkout and gift card APIs
- ✅ RLS policies on all database tables
- ✅ Input validation with Zod schemas
- ✅ CSRF protection via Supabase auth
- ✅ No secrets in codebase (env vars only)
- ✅ .gitignore excludes all .env files and .local-docs

## Overview

Plobie combines four core experiences:
- **Hobbies** - Reddit-style community forum for plant lovers
- **My Plants** - Interactive Unity WebGL garden with QR-linked pottery
- **Games** - Plant-themed web games with XP rewards
- **Shop** - E-commerce for pottery, plants, and accessories

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Payments:** Stripe
- **Hosting:** Vercel
- **Analytics:** Vercel Analytics, Speed Insights, Google Analytics 4
- **Error Tracking:** Sentry (client, server, edge)
- **Code Quality:** Husky, lint-staged, Prettier, ESLint

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account
- Stripe account (test mode)

### Installation

```bash
# Clone the repository
git clone https://github.com/GuyWhoLikesPasta/plobie.git
cd plobie

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Setup

Fill in `.env.local` with your credentials:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret

# Analytics (optional)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-...
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_DSN=https://...
```

### Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run migrations in order from `supabase/migrations/`:
   ```
   20241115_initial_schema.sql
   20241115_rls_policies.sql
   20241126_xp_system.sql
   20241126_compatibility_fix.sql
   20241126_posts_compatibility.sql
   20241126_fix_posts_rls.sql
   20241202_admin_features.sql
   20241202_fix_order_items_rls.sql
   20241207_notifications_system.sql
   20241207_level_up_notifications.sql
   20241207_performance_indexes.sql
   20241217_unity_game_tables.sql
   ```

**See**: `.local-docs/week5/NOTIFICATIONS_SETUP.md`, `.local-docs/week5/PERFORMANCE_SETUP.md`, and `.local-docs/unity/` for detailed setup guides.

### Seed Development Data

```bash
# Seed products
npm run seed:products

# Seed pots
npm run seed:pots

# Seed sample data (posts, comments, users)
npm run seed

# Create test user
npm run user:create

# Make test user admin
npm run user:admin test@plobie.com
```

This creates:
- Feature flags
- Test pots (TEST001-003, DEMO123, DEMO456)
- Sample products with variants

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

```bash
npm run dev             # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript compiler check
npm test                # Run unit tests
npm test:ui             # Run tests with UI
npm test:coverage       # Run tests with coverage
npm run seed            # Seed development data
```

## Project Structure

```
plobie/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   ├── checkout/   # Stripe checkout
│   │   ├── flags/      # Feature flags
│   │   ├── healthz/    # Health check
│   │   └── stripe/     # Stripe webhooks
│   └── page.tsx        # Home page
├── components/         # React components
├── lib/                # Shared utilities
│   ├── analytics.ts    # GA4 events
│   ├── feature-flags.ts
│   ├── stripe.ts
│   ├── supabase.ts     # Database clients
│   ├── types.ts        # TypeScript types
│   └── xp-engine.ts    # Gamification
├── scripts/            # Utility scripts
│   └── seed-dev.ts     # Database seeding
├── supabase/
│   └── migrations/     # Database migrations
└── public/             # Static assets
```

## Key Features

### XP System
Tiered leveling system with 250 levels:
- **Tier 1 (1-49):** 150 + 17*(level-1) XP per level
- **Tier 2 (50-99):** 1000 + 30*(level-50) XP per level  
- **Tier 3 (100-249):** 2500 + 40*(level-100) XP per level

Key XP actions:
- Claiming pots: +500 XP (one-time per pot)
- Creating posts: +20 XP (cap 10/day)
- Playing games: +20 XP per 30 min (cap 6 blocks/day)
- Reading articles: +10 XP (cap 10/day)
- Garden care: +25 XP (cap 200/day)

Daily cap: 3000 XP across all activities

### Feature Flags
Control features dynamically:
- `shop_enabled`
- `games_enabled`
- `hobbies_enabled`
- `my_plants_enabled`
- `qr_claim_enabled`

### Stripe Integration
- Product variants (size, color)
- Secure checkout with idempotency
- Webhook event processing
- Order tracking

## API Endpoints

**System:**
- `GET /api/healthz` - Health check
- `GET /api/flags` - Get feature flags
- `PATCH /api/flags` - Toggle flag (admin only)

**Posts & Community:**
- `GET /api/posts` - List posts with filters
- `POST /api/posts` - Create post (+20 XP)
- `GET /api/posts/[id]` - Get post detail
- `POST /api/posts/[id]/comments` - Add comment (+2 XP)
- `POST /api/posts/[id]/like` - Like post
- `DELETE /api/posts/[id]/like` - Unlike post

**Notifications:**
- `GET /api/notifications` - Fetch notifications
- `PATCH /api/notifications` - Mark as read
- `DELETE /api/notifications` - Delete notifications
- `POST /api/notifications` - Create test notification

**User:**
- `GET /api/profiles/[username]` - Get user profile
- `POST /api/profiles/avatar` - Upload avatar

**Shop:**
- `POST /api/checkout` - Create Stripe checkout (rate limited: 10/hr)
- `POST /api/stripe/webhook` - Handle Stripe events
- `GET /api/gift-cards` - List user's gift cards
- `POST /api/gift-cards` - Purchase gift card (rate limited: 5/hr)
- `POST /api/gift-cards/redeem` - Redeem gift card code

**XP & Claims:**
- `POST /api/xp/award` - Award XP (admin)
- `POST /api/pots/claim` - Claim pot (+500 XP)
- `POST /api/learn/mark-read` - Mark article read (+10 XP)

**Unity/Games:**
- `POST /api/games/session` - Start/end game session
- `GET /api/games/session` - Get active session
- `GET /api/games/progress` - Load game state
- `POST /api/games/progress` - Save game state (1MB max)
- `POST /api/games/xp` - Award action-based XP
- `POST /api/dev/reset-xp` - Reset XP caps (dev only)
- `GET /api/dev/xp-status` - Inspect XP status (dev only)

**My Plants:**
- `GET /api/my-plants` - Get user's garden

## Development

### Testing Stripe Locally

```bash
# In separate terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Database Migrations

```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db push
```

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run typecheck` and `npm run lint`
4. Commit with descriptive messages
5. Push and create a pull request

## License

Proprietary - All rights reserved
