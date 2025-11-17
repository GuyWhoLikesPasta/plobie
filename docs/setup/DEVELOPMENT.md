# Development Setup Guide

## Prerequisites

- Node.js 18+ (recommend using `nvm`)
- npm or pnpm
- Git
- Supabase CLI: `npm install -g supabase`
- Stripe CLI: `brew install stripe/stripe-cli/stripe` (Mac) or see [Stripe docs](https://stripe.com/docs/stripe-cli)
- GitHub CLI (optional): `brew install gh` (Mac)

## Initial Setup

### 1. Clone and Install

```bash
git clone [repo-url]
cd plobie
npm install
```

### 2. Environment Variables

```bash
# Copy the template
cp env.example.txt .env.example
cp .env.example .env.local

# Generate JWT secret
openssl rand -hex 32

# Fill in all values in .env.local
```

### 3. Supabase Setup

```bash
# Login to Supabase CLI
npx supabase login

# Link to project
npx supabase link --project-ref [your-project-ref]

# Pull remote schema (if already exists)
npx supabase db pull

# Or push local migrations
npx supabase db push

# Seed dev data
npm run seed
```

### 4. Stripe Setup

```bash
# Login to Stripe CLI
stripe login

# Start webhook forwarding (keep running in separate terminal)
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copy the webhook signing secret to .env.local
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Start Development

```bash
# Start Next.js dev server
npm run dev

# In separate terminals:
# - Stripe webhook listener
# - Supabase local (optional)
```

Visit `http://localhost:3000`

## Common Tasks

### Reset Database

```bash
npx supabase db reset
npm run seed
```

### Run Tests

```bash
npm test              # Run once
npm test -- --watch   # Watch mode
npm run typecheck     # TypeScript
npm run lint          # ESLint
```

### Create Migration

```bash
# Manual SQL migration
npx supabase migration new [name]

# Or use Claude command
# In Claude Code: /project:create-migration [description]
```

### Seed Products

```bash
# Run seed script
tsx scripts/seed-products.ts

# Or seed from Google Sheet (when available)
npm run seed:products
```

## Troubleshooting

### Supabase Connection Issues

- Check `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify anon key has proper permissions
- Check RLS policies if queries fail

### Stripe Webhook Not Receiving Events

- Ensure `stripe listen` is running
- Check webhook secret matches .env.local
- Verify endpoint is `/api/stripe/webhook`

### TypeScript Errors

- Run `npm run typecheck` to see all errors
- Delete `.next` folder and restart dev server
- Ensure `next-env.d.ts` exists

### Module Not Found

- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Clear Next.js cache: `rm -rf .next`

## IDE Setup

### VS Code Extensions (Recommended)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma (if we add Prisma later)
- GitLens

### Cursor Settings

- Ensure `.env.example` is not in global ignore
- Enable TypeScript validation
- Set up format on save

## Access Checklist

- [ ] GitHub repository access
- [ ] Vercel project access (staging + prod)
- [ ] Supabase project access
- [ ] Stripe dashboard access (test mode)
- [ ] GA4 property access
- [ ] Sentry project access
- [ ] Google Drive / Dropbox shared folders

## Team Workflow

1. Pull latest `main` branch
2. Create feature branch: `feature/description`
3. Make changes, commit frequently
4. Run tests and typecheck before pushing
5. Push and create PR
6. Request review
7. Address feedback
8. Squash and merge

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe API Docs](https://stripe.com/docs/api)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

