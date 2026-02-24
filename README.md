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
- XP System -- Tiered leveling (250 levels, 3-tier formula), 25+ action types, 3000 XP daily cap, level-up notifications

**Plant Hobbies (Community):**
- Posts and Comments -- Create content, earn XP
- 10 Communities -- indoor-plants, succulents, herbs, orchids, bonsai, propagation, fruit-trees, outdoor-garden, hydroponics, terrariums
- Community Follow/Unfollow -- Personalized feed based on followed communities
- Infinite Scroll Feed -- Hot posts block, suggested banner, sub-community highlights
- Image Uploads -- Share photos (5MB limit)
- Reactions -- Like posts with hearts
- Search and Filters -- Find posts by keyword or community
- User Profiles -- View stats, posts, and achievements
- Learn Articles -- 24 educational guides (+10 XP per article, cap 10/day)

**My Plants:**
- Unity 3D WebGL Garden -- Embedded on My Plants tab
- My Garden / Plantdex Sub-tabs -- Switch between garden view and plant encyclopedia
- Plantdex -- 50 plant species encyclopedia with collection tracking
- Dashboard -- Stats, XP progress, pots collection, plant cards
- Achievements System -- 15+ unlockable achievements with XP rewards

**Game Play (Arcade):**
- 8 HTML5 Games -- Soccer Bubbles, Curve Ball 3D, Goalkeeper Champ, Table Tennis World Tour, Color Tunnel, Soccer Heads, Square Stacker, Crazy Hill Driver
- Iframe Player -- Games playable inline with other games visible below
- Timed XP -- +20 XP per 30 minutes of play, page-visibility based tracking

**Unity Integration:**
- 3D WebGL Garden -- Embedded on My Plants tab (extracted `UnityEmbed` component)
- Auth Bridge v2 -- `window.plobie` with `ready` flag, `getAccessToken()`, `refreshAccessToken()`, `getUserId()`, `getApiUrl()`
- Bearer Token Auth -- All API routes accept `Authorization: Bearer <token>` headers (Unity WebGL) alongside cookie-based auth (browser)
- CORS Support -- Preflight (OPTIONS) handling for cross-origin Unity testing (Firebase, Vercel preview URLs)
- Game Actions -- register_plant (160 XP), daily_reward (5 XP), fetch_throw (5 XP), plant_water (5 XP)
- Session tracking, progress save/load, action-based XP
- Garden Summary API -- Lightweight endpoint for Home tab Unity scene (plants, pots, reminders)
- Placement Spots -- Predefined garden positions (6 default slots) for 3D scene layout
- Asset Bundle Storage -- Supabase Storage bucket for Unity streaming assets

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

**Newsletter:**
- Resend email integration for weekly digests
- Top posts + Learn articles condensed into email
- Vercel Cron (Mondays 2 PM UTC)
- Subscribe/unsubscribe toggle on profile

**Security:**
- Centralized middleware for route protection (auth + admin)
- Dual auth: Bearer token (Unity) + cookie-based (browser)
- CORS with allowlisted origins (plobie.vercel.app, Firebase test builds)
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
- **Email:** Resend (newsletter digests)
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
├── app/                 # Next.js app directory
│   ├── api/            # API routes (25+ endpoints)
│   ├── (auth)/         # Login, signup, password reset
│   ├── hobbies/        # Plant Hobbies feed + learn articles
│   ├── gameplay/       # Game Play arcade (Famobi iframes)
│   ├── my-plants/      # My Plants (Unity + Plantdex sub-tabs)
│   ├── shop/           # E-commerce + gift cards
│   └── games/          # Redirect to /gameplay
├── components/
│   ├── games/          # UnityEmbed
│   ├── layout/         # Navigation, Footer
│   ├── notifications/  # NotificationBell
│   ├── onboarding/     # WelcomeModal
│   ├── plantdex/       # PlantdexView
│   ├── posts/          # LikeButton
│   ├── shared/         # TopPostsBanner, PromoRotator, LoginPromptBanner, NewsletterSection, CommunityFollowButton
│   ├── shop/           # AddToCartButton
│   ├── skeletons/      # Loading skeletons
│   └── theme/          # ThemeToggle, ThemeProvider
├── lib/                # Shared utilities
│   ├── supabase.ts     # Database clients (cookie + Bearer token)
│   ├── resend.ts       # Resend email client
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

**Community:** posts (CRUD), comments, likes, profiles, avatar upload, top posts (hot-score ranked)

**Communities:** follow, unfollow, list followed communities

**Notifications:** fetch, mark read, delete, create

**Shop:** checkout (Stripe), webhooks, gift cards (purchase, redeem)

**Learn:** articles (list, detail), mark-read (+10 XP)

**XP and Claims:** award XP, claim pots (+500 XP via apply_xp RPC)

**Unity/Games:** sessions, progress save/load, action XP (all accept Bearer tokens)

**Plantdex:** species list, details (public, no auth)

**My Plants:** garden overview, garden-summary (lightweight for Unity scene), placement-spots (CRUD)

**Newsletter:** subscribe/unsubscribe, send-digest (cron/admin)

**Admin:** users, unity-assets (list/upload streaming bundles)

**Reports:** submit content reports (post, comment, profile)

## Contributing

1. Create a feature branch from `main`
2. Follow the design system (stone palette, no emoji UI, rounded-xl/2xl)
3. Run `npm run typecheck` and `npm run lint`
4. Commit with descriptive messages
5. Push and create a pull request

## License

Proprietary -- All rights reserved
