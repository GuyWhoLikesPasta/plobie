# 🌱 Plobie

A plant-centered social commerce platform connecting real-world pottery, digital gardens, and a vibrant community of plant enthusiasts.

## 🚀 Status

**Week 2 Complete** - Core infrastructure and auth system live!
- ✅ Database: 14 tables with RLS
- ✅ Auth: Email + OAuth (Google, Apple)
- ✅ Shop: Products, variants, Stripe checkout
- ✅ Test Suite: 37 tests passing
- ✅ Navigation & Pages: All 4 main sections

**See SETUP.md for detailed setup instructions.**

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
3. Run migrations in order:
   ```
   supabase/migrations/20241115_initial_schema.sql
   supabase/migrations/20241115_rls_policies.sql
   ```

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
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript compiler check
npm run seed         # Seed development data
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

- `GET /api/healthz` - Health check
- `GET /api/flags` - Get all feature flags
- `POST /api/flags` - Toggle flag (admin only)
- `POST /api/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle Stripe events

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
