# Production Deployment Notes (LOCAL ONLY)

## 🚀 When Ready to Deploy to Vercel

### Stripe Webhook Secret (Already Configured)
**Webhook Details:**
- Endpoint: `https://plobie.vercel.app/api/stripe/webhook`
- Status: ✅ Active (configured Nov 17, 2024)
- Events: `checkout.session.completed`, `checkout.session.expired`

**⚠️ SECURITY:** Get the webhook secret from Stripe Dashboard → Webhooks
- Click "Reveal" to see the signing secret
- Add to Vercel as `STRIPE_WEBHOOK_SECRET`
- **NEVER commit this secret to the repo!**

### Vercel Deploy Steps
1. Connect GitHub repo to Vercel
2. Add all environment variables from `.env.local`
3. Update `NEXT_PUBLIC_BASE_URL` to production URL
4. Deploy!

### Post-Deploy Checklist
- [ ] Test checkout flow end-to-end
- [ ] Verify webhook receives events (check Stripe dashboard)
- [ ] Test OAuth redirects (update Supabase with prod URL)
- [ ] Verify database connections work
- [ ] Check error logging in Sentry

---

**Last Updated:** Nov 17, 2024  
**Week:** 2

