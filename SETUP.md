# Plobie Setup Guide

**For Connor** - Complete environment setup and deployment configuration.

---

## 🚀 Quick Start (30 minutes total)

### 1. Clone and Install (2 mins)

```bash
git clone https://github.com/GuyWhoLikesPasta/plobie.git
cd plobie
npm install
```

### 2. Environment Variables (5 mins)

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials (see sections below):

```env
# Supabase (from step 3)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (from step 4)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
JWT_SECRET=your-random-secret-here

# Analytics (optional for now)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-...
SENTRY_DSN=https://...

# Rate Limiting (optional - for production)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## 🗄️ 3. Configure Supabase (15 mins)

### A. Get API Keys
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your `plobie` project
3. Go to **Settings → API**
4. Copy these to `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### B. Run Database Migrations
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy/paste contents of `supabase/migrations/20241115_initial_schema.sql`
4. Click **Run**
5. Repeat for `supabase/migrations/20241115_rls_policies.sql`

✅ You should now have 14 tables created with RLS enabled.

### C. Enable OAuth Providers
1. Go to **Authentication → Providers**
2. **Enable Google:**
   - Toggle on
   - Get Client ID & Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. **Enable Apple:**
   - Toggle on
   - Get Service ID & Key from [Apple Developer](https://developer.apple.com)
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

---

## 💳 4. Configure Stripe (10 mins)

### A. Get API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Make sure you're in Test Mode** (toggle in top right)
3. Go to **Developers → API Keys**
4. Copy these to `.env.local`:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY` (⚠️ Keep secret!)

### B. Set Up Webhook (for production/staging)
✅ **Already configured!** Webhook is live at:
- **Endpoint:** `https://plobie.vercel.app/api/stripe/webhook`
- **Status:** Active
- **Events:** `checkout.session.completed`, `checkout.session.expired`
- **Signing Secret:** See Stripe Dashboard (do NOT commit this!)

**To get the webhook secret:**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Reveal" on the Signing Secret
4. Add to Vercel Environment Variables as `STRIPE_WEBHOOK_SECRET`

### C. Test Locally (optional)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local dev
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 🌱 5. Seed Development Data (2 mins)

```bash
# Seed feature flags and test data
npm run seed

# Seed shop products (6 products with variants)
npm run seed:products
```

---

## 🏃 6. Start Development Server (1 min)

```bash
npm run dev
```

Visit: **http://localhost:3000**

### Test the App:
1. ✅ Navigate to `/signup` - create an account
2. ✅ Navigate to `/shop` - view products
3. ✅ Click a product - see variants
4. ✅ Try checkout (use test card: `4242 4242 4242 4242`)

---

## 🚀 7. Deploy to Vercel (5 mins)

### A. Connect GitHub Repo
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Import `GuyWhoLikesPasta/plobie`
4. Framework Preset: **Next.js**
5. Click **Deploy**

### B. Add Environment Variables
1. Go to **Project Settings → Environment Variables**
2. Add all variables from `.env.local` (except `NEXT_PUBLIC_BASE_URL`)
3. For `NEXT_PUBLIC_BASE_URL`, use: `https://plobie.vercel.app`

### C. Update Stripe Webhook
- Go back to Stripe webhooks
- Update endpoint URL to: `https://plobie.vercel.app/api/stripe/webhook`

### D. Update Supabase OAuth Redirects
- In Supabase Auth settings, add production redirect:
- `https://plobie.vercel.app/auth/callback`

---

## 🎯 8. Verify Everything Works

### Local Development Checklist:
- [ ] App loads at `localhost:3000`
- [ ] Sign up with email works
- [ ] Login works
- [ ] Shop products display
- [ ] Product detail page works
- [ ] Tests pass: `npm test`
- [ ] Typecheck passes: `npm run typecheck`
- [ ] Linter passes: `npm run lint`

### Production Checklist:
- [ ] App loads at `plobie.vercel.app`
- [ ] Sign up works
- [ ] Google OAuth works
- [ ] Shop checkout works (test mode)
- [ ] Stripe webhook receives events

---

## 🆘 Troubleshooting

### "Supabase URL not found"
- Check `.env.local` exists in root directory
- Restart dev server: `npm run dev`

### "Database table not found"
- Run migrations in Supabase SQL Editor
- Check all 14 tables exist in **Database → Tables**

### "Stripe checkout fails"
- Verify `STRIPE_SECRET_KEY` in `.env.local`
- Check Stripe Dashboard is in **Test Mode**

### "OAuth doesn't work"
- Verify redirect URLs match in provider settings
- Check Supabase Auth providers are enabled

### "Tests fail"
- Run: `rm -rf node_modules package-lock.json && npm install`
- Then: `npm test`

---

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Quality Checks
npm run typecheck        # TypeScript check
npm run lint             # ESLint check
npm test                 # Run all tests
npm run test:coverage    # Test coverage report

# Database
npm run seed             # Seed feature flags
npm run seed:products    # Seed shop products
```

---

## 🔐 Security Notes

⚠️ **Never commit these to Git:**
- `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`

✅ **Safe to commit:**
- `.env.example` (template only)
- `NEXT_PUBLIC_*` variables (these are public)

---

## 📞 Need Help?

If you run into issues:
1. Check this guide first
2. Check GitHub Issues
3. Review error logs in Sentry
4. Contact the development team

---

**Last Updated:** Nov 17, 2024  
**Setup Time:** ~30 minutes  
**Difficulty:** Easy 🟢

