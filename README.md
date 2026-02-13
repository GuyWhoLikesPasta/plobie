# Plobie

A plant-centered social commerce platform connecting real-world pottery, digital gardens, and a vibrant community of plant enthusiasts.

**Production:** https://plobie.vercel.app

---

## Features

**Core Systems:**
- Authentication -- Email, OAuth (Google, Apple), Password Reset
- Shop -- E-commerce with Stripe integration
- Gift Cards -- Special offers ($20 to $45 value, 125% bonus)
- QR Claiming -- Link physical pots (+500 XP per pot)
- XP System -- Tiered leveling (250 levels), 25+ action types, 3000 XP daily cap

**Community:**
- Posts and Comments -- Create content, earn XP
- Image Uploads -- Share photos (5MB limit)
- Reactions -- Like posts with hearts
- Search and Filters -- Find posts by keyword or hobby group
- User Profiles -- View stats, posts, and achievements

**Content:**
- Learn Articles -- 24 educational guides (+10 XP per article, cap 10/day)
- My Plants Dashboard -- View collection and stats
- Achievements System -- 15+ unlockable achievements with XP rewards
- Plantdex -- 50 plant species encyclopedia with collection tracking

**Unity Integration:**
- 3D WebGL Garden -- Live at `/games` page
- Auth Bridge -- `window.plobie.getAccessToken()` for seamless auth
- Game Actions -- register_plant (160 XP), daily_reward (5 XP), fetch_throw (5 XP)
- Session tracking, progress save/load, action-based XP

**Admin:**
- User Management -- Promote admins, view user stats
- Content Moderation -- Delete/hide posts and comments
- Feature Flags -- Toggle features on/off
- Analytics Dashboard -- View platform metrics

**Notifications:**
- Real-time bell icon with unread badge
- Types: comments, likes, level-ups, XP caps, achievements
- Full notifications page with history, filters, management
- 30-second auto-refresh polling

**Security:**
- Centralized middleware for route protection (auth + admin)
- Rate limiting (Upstash Redis in production, in-memory for dev)
- RLS policies on all database tables
- Input validation with Zod schemas
- CSRF protection via Supabase auth
- No secrets in codebase (env vars only, `.env.example` template provided)

**Performance:**
- Lighthouse Scores: 94-98% perf, 100% a11y, 100% bp, 100% seo
- Image optimization with AVIF/WebP via next/image
- Skeleton loading states on all pages
- Database indexes on 15+ queries
- Core Web Vitals optimized (LCP, FID, CLS)
- Font preloading with display swap

**Monitoring:**
- Sentry error tracking (client, server, edge)
- Vercel Analytics and Speed Insights
- Session replay (10% sampling)

---

## Design System

The app uses a luxury-tier design language with these principles:

**Color Palette:** Stone neutrals (`stone-50` through `stone-950`) as the primary neutral system. Green (`green-600`, `green-500`, `green-400`) as the accent color, used sparingly.

**No Emoji UI:** Emojis are never used as UI decoration (icons, headers, buttons, badges). SVG icons from Heroicons are used instead. Emojis are acceptable only as data content (e.g., plant species icons stored in the database).

**Typography:** Geist Sans font, `tracking-tight` on headings, `leading-relaxed` on body text. `-webkit-font-smoothing: antialiased` for crisp rendering.

**Components:**
- Cards: `bg-white dark:bg-stone-900`, `border-stone-200 dark:border-stone-800`, `rounded-2xl`
- Buttons: Primary `bg-green-600 hover:bg-green-500`, secondary with stone borders
- Inputs: `rounded-xl`, `border-stone-300 dark:border-stone-700`
- Navigation: Sticky glass-morphism header with `backdrop-blur`
- Footer: Clean four-column layout with brand, nav links, copyright

**Effects:** Glass morphism (`.glass` class), subtle card hover borders, green shadow accents on primary CTAs, custom scrollbar styling.

**Dark Mode:** Full dark mode support with class-based toggle (light/dark/system). All components have explicit dark variants.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Payments:** Stripe
- **Hosting:** Vercel
- **Analytics:** Vercel Analytics, Speed Insights, Google Analytics 4
- **Error Tracking:** Sentry (client, server, edge)
- **Rate Limiting:** Upstash Redis (production), in-memory (dev)
- **Code Quality:** Husky, lint-staged, Prettier, ESLint, TypeScript strict mode

## Getting Started

### Prerequisites
- Node.js 22+ (see `.nvmrc`)
- npm
- Supabase account
- Stripe account (test mode)

### Installation

```bash
git clone https://github.com/GuyWhoLikesPasta/plobie.git
cd plobie
npm install
cp .env.example .env.local
```

### Environment Setup

Fill in `.env.local` with your credentials. See `.env.example` for all required and optional variables.

### Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run migrations in order from `supabase/migrations/`
4. Or use `supabase/CANONICAL_RESTORE.sql` for a full clean setup

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Available Scripts

```bash
npm run dev             # Start development server with Turbopack
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript compiler check
npm test                # Run unit tests
npm run seed            # Seed development data
```

## Project Structure

```
plobie/
├── app/                 # Next.js app directory (23 pages)
│   ├── api/            # API routes
│   ├── (auth)/         # Login, signup, password reset
│   ├── hobbies/        # Community feed + learn articles
│   ├── shop/           # E-commerce + gift cards
│   └── games/          # Unity WebGL garden
├── components/
│   ├── layout/         # Navigation, Footer
│   ├── notifications/  # NotificationBell
│   ├── onboarding/     # WelcomeModal
│   ├── posts/          # LikeButton
│   ├── shop/           # AddToCartButton
│   ├── skeletons/      # Loading skeletons
│   └── theme/          # ThemeToggle, ThemeProvider
├── lib/                # Shared utilities
│   ├── supabase.ts     # Database clients
│   ├── rate-limit.ts   # Upstash Redis rate limiting
│   ├── xp-engine.ts    # Gamification engine
│   └── claim-tokens.ts # JWT for pot claims
├── middleware.ts        # Centralized auth protection
├── supabase/
│   ├── migrations/     # Database migrations
│   └── CANONICAL_RESTORE.sql  # Full schema + seed
└── public/             # Static assets + Unity build
```

## API Endpoints

**System:** healthz, flags

**Community:** posts (CRUD), comments, likes, profiles, avatar upload

**Notifications:** fetch, mark read, delete, create

**Shop:** checkout (Stripe), webhooks, gift cards (purchase, redeem)

**Learn:** articles (list, detail), mark-read (+10 XP)

**XP and Claims:** award XP, claim pots (+500 XP)

**Unity/Games:** sessions, progress save/load, action XP

**Plantdex:** species list, details, user collection (plant, water, care, grow)

**My Plants:** garden overview

## Contributing

1. Create a feature branch from `main`
2. Follow the design system (stone palette, no emoji UI, rounded-xl/2xl)
3. Run `npm run typecheck` and `npm run lint`
4. Commit with descriptive messages
5. Push and create a pull request

## License

Proprietary -- All rights reserved
