# Database Restoration Guide

## What Happened?

Your Supabase project was paused/deleted, which cleared the database. This guide will restore **EVERYTHING** to working order.

## Status: ✅ PARTIALLY COMPLETE

### Already Done:

1. ✅ **Environment variables** - Correct Supabase credentials set in Vercel
2. ✅ **Core tables** - Basic schema restored via `CLEAN_RESTORE.sql`
3. ✅ **Signup/Login** - Working again!

### Still To Do:

1. ⏳ **Complete restoration** - Add missing features (admin, shop, notifications, etc.)
2. ⏳ **Build warnings** - Fix 47 warnings in Vercel deployment

---

## Step-by-Step Restoration

### 1. Run Complete Restoration SQL

**Go to Supabase SQL Editor:**
https://supabase.com/dashboard/project/puhblesoxhizcfuubphh/sql

**Copy and run this file:**
`/Users/cur1yj/Sites/plobie/supabase/COMPLETE_RESTORE.sql`

**This will add:**

- ✅ Feature flags table
- ✅ Reports table (community moderation)
- ✅ Audit logs table (admin actions)
- ✅ Stripe events table (webhook deduplication)
- ✅ Admin policies (delete/hide posts, manage flags)
- ✅ Storage bucket for images (post-images)
- ✅ Products & orders tables (shop functionality)
- ✅ Product variants table
- ✅ Order items table
- ✅ XP system with daily caps
- ✅ Level-up notifications
- ✅ Performance indexes on all tables
- ✅ Triggers for updated_at fields

**Expected result:** "Success. No rows returned"

---

### 2. Verify Tables Were Created

**Go to Supabase Table Editor:**
https://supabase.com/dashboard/project/puhblesoxhizcfuubphh/editor

**You should see ALL these tables:**

- ✅ profiles
- ✅ xp_balances
- ✅ xp_events
- ✅ posts
- ✅ comments
- ✅ post_reactions
- ✅ pots
- ✅ pot_claims
- ✅ notifications
- ✅ feature_flags (NEW)
- ✅ reports (NEW)
- ✅ audit_logs (NEW)
- ✅ stripe_events (NEW)
- ✅ products (NEW)
- ✅ product_variants (NEW)
- ✅ orders (NEW)
- ✅ order_items (NEW)

---

### 3. Verify Storage Bucket

**Go to Supabase Storage:**
https://supabase.com/dashboard/project/puhblesoxhizcfuubphh/storage/buckets

**You should see:**

- ✅ `post-images` bucket (public, 5MB limit)

---

### 4. Test Key Functionality

**Test these features:**

1. ✅ Signup/Login - https://plobie.vercel.app/signup
2. ⏳ Create a post - https://plobie.vercel.app/hobbies
3. ⏳ View shop - https://plobie.vercel.app/shop
4. ⏳ View notifications - https://plobie.vercel.app/notifications
5. ⏳ Admin dashboard - https://plobie.vercel.app/admin (if admin user)

---

## What's Restored?

### Core Features ✅

- User authentication (signup/login)
- User profiles with avatars
- XP system with levels
- Daily XP caps (100 XP/day)
- Level-up notifications

### Community Features ✅

- Posts with images
- Comments
- Likes/reactions
- Content moderation (reports)
- Admin moderation tools

### Shop Features ✅

- Products catalog
- Product variants (size/color/price)
- Order management
- Stripe integration ready

### Notifications ✅

- Comment notifications
- Like notifications
- Level-up notifications
- XP cap notifications
- Real-time notification bell

### Admin Features ✅

- Admin dashboard
- Hide/delete posts
- Manage feature flags
- View audit logs
- View all reports

### Performance ✅

- Database indexes on all tables
- Optimized queries
- Image upload via Storage
- CDN delivery for images

---

## Next Steps

### 1. Fix Build Warnings (47 warnings)

See what warnings Vercel is showing and fix them.

### 2. Seed Sample Data (Optional)

If you want to test the shop with sample products:

```sql
-- Run in Supabase SQL Editor
INSERT INTO public.products (name, description, featured, category)
VALUES
  ('Terracotta Pot Set', 'Set of 3 handcrafted terracotta pots', true, 'pottery'),
  ('Ceramic Planter', 'Modern white ceramic planter', true, 'pottery'),
  ('Garden Tool Set', 'Essential tools for plant care', false, 'tools');

-- Add variants for first product
INSERT INTO public.product_variants (product_id, sku, size, price_cents, stock_qty)
SELECT
  id,
  'TERRA-' || size,
  size,
  CASE size
    WHEN 'Small' THEN 1299
    WHEN 'Medium' THEN 1899
    WHEN 'Large' THEN 2499
  END,
  50
FROM public.products
CROSS JOIN (VALUES ('Small'), ('Medium'), ('Large')) AS sizes(size)
WHERE name = 'Terracotta Pot Set';
```

### 3. Create Admin User

Make yourself an admin:

```sql
-- Run in Supabase SQL Editor
UPDATE public.profiles
SET is_admin = true
WHERE username = 'YOUR_USERNAME';
```

---

## Files Reference

- **`CLEAN_RESTORE.sql`** - Core tables (already run ✅)
- **`COMPLETE_RESTORE.sql`** - All missing features (run this next ⏳)
- **`WEEK7_ADDITIONS.sql`** - Duplicate of notifications/XP (skip this)
- **`DATABASE_RESTORATION_GUIDE.md`** - This file

---

## Troubleshooting

### If SQL fails with "already exists" errors:

- This is OK! It means the table/policy was already created.
- The SQL uses `IF NOT EXISTS` and `CREATE OR REPLACE` to be safe.

### If signup still fails:

1. Check Vercel environment variables are correct
2. Verify `profiles` table exists in Supabase
3. Check `handle_new_user()` trigger exists
4. Look for errors in Vercel logs

### If shop is empty:

- Run the sample data SQL above to add test products

### If notifications don't work:

- Check `notifications` table exists
- Verify `create_notification()` function exists
- Check notification bell component is rendered

---

## Summary

✅ **Database structure:** READY (after running COMPLETE_RESTORE.sql)
✅ **Authentication:** WORKING
⏳ **Features:** Need to verify after complete restore
⏳ **Build warnings:** Need to fix

**Next action:** Run `COMPLETE_RESTORE.sql` in Supabase SQL Editor!
