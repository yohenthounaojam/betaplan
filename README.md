# BetaPlan

> Find dates your whole crew can do. Built for outdoor sports outings.

**Live at:** https://betaplan.ca

---

## Stack

- **Frontend + API:** Next.js 14 (App Router)
- **Database:** Supabase (Postgres)
- **Hosting:** Vercel
- **Domain:** Cloudflare (betaplan.ca)

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Add these environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click Deploy

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Database

Run `schema.sql` in the Supabase SQL Editor to set up all tables.

---

## Features (MVP)

- [x] Create outings with sport type and date range
- [x] Shareable invite links — no login required for guests
- [x] Split-panel calendar with drag-select availability
- [x] Heatmap overview showing best days
- [x] Sport-themed UI (climbing, golf, skiing, surfing, cycling)
- [x] 1-year data retention with auto-expiry
- [x] Mobile friendly

## Coming soon

- [ ] Email notifications (Resend)
- [ ] Contextual sport ads
- [ ] Pro plan (Stripe)
- [ ] iOS + Android app (React Native)
