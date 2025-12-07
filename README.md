# 🌱 Plobie

A plant-centered social commerce platform connecting real-world pottery, digital gardens, and a vibrant community of plant enthusiasts.

## 🚀 Features

**Core Systems:**
- ✅ Authentication - Email and OAuth (Google, Apple)
- ✅ Shop - E-commerce with Stripe integration
- ✅ QR Claiming - Link physical pots (+50 XP per pot)
- ✅ XP System - Gamification with daily rewards and caps

**Community:**
- ✅ Posts & Comments - Create content, earn XP
- ✅ Image Uploads - Share photos (5MB limit)
- ✅ Reactions - Like posts with ❤️
- ✅ Search & Filters - Find posts by keyword or hobby group
- ✅ User Profiles - View stats, posts, and achievements

**Content:**
- ✅ Learn Articles - Educational guides (+1 XP per article)
- ✅ My Plants Dashboard - View collection and stats

**Admin:**
- ✅ User Management - Promote admins, view user stats
- ✅ Content Moderation - Delete/hide posts and comments
- ✅ Feature Flags - Toggle features on/off
- ✅ Analytics Dashboard - View platform metrics

**Notifications:**
- ✅ Real-time Notifications - Bell icon with unread badge
- ✅ Notification Types - Comments, likes, level-ups, XP caps
- ✅ Full Notifications Page - History, filters, management
- ✅ Auto-refresh - 30-second polling for updates

**Performance:**
- ✅ Image Optimization - next/image with AVIF/WebP
- ✅ Lazy Loading - Images load on scroll
- ✅ Database Indexes - 15+ optimized queries
- ✅ Bundle Optimization - Code splitting and tree-shaking
- ✅ Core Web Vitals - Optimized LCP, FID, CLS

**Quality:**
- ✅ 128 total tests (84 E2E + 44 unit) passing
- ✅ TypeScript strict mode
- ✅ 100% mobile responsive (16 pages)
- ✅ Toast notifications
- ✅ Skeleton loading states
- ✅ Error boundaries (loading, error, 404 pages)
- ✅ SEO optimized (metadata, Open Graph, Twitter Cards)

**Production:** https://plobie.vercel.app

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
- **Analytics:** Google Analytics 4
- **Error Tracking:** Sentry

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
   ```

**See**: `.local-docs/week5/NOTIFICATIONS_SETUP.md` and `.local-docs/week5/PERFORMANCE_SETUP.md` for detailed migration guides.

### Seed Development Data

```bash
npm run seed
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
Users earn experience points through:
- Creating posts (+3 XP, cap 5/day)
- Commenting (+1 XP, cap 10/day)
- Reading Learn articles (+1 XP, cap 5/day)
- Playing games (+2 XP per 30 min, cap 4/day)
- Linking pots (+50 XP, one-time)

Daily cap: 100 XP across all actions

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
- `POST /api/posts` - Create post (+3 XP)
- `GET /api/posts/[id]` - Get post detail
- `POST /api/posts/[id]/comments` - Add comment (+1 XP)
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
- `POST /api/checkout` - Create Stripe checkout
- `POST /api/stripe/webhook` - Handle Stripe events

**XP & Claims:**
- `POST /api/xp/award` - Award XP (admin)
- `POST /api/pots/claim` - Claim pot (+50 XP)
- `POST /api/learn/mark-read` - Mark article read (+1 XP)

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
