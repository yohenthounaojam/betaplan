# BetaPlan — Feature Backlog

All planned and requested features, in priority order.

---

## 🔴 In progress / next up

- [ ] **Delete trip** — soft delete with 7-day recovery. Requires SQL migration (deleted_at column) to be run first
- [ ] **Undo delete** — toast appears for 7 seconds after deletion with undo button
- [ ] **Calendar starts on Monday** — weekend stays together in one row *(code done, pending push)*

---

## 🟡 Short term

- [ ] **Share link below title on mobile** — if trip title is long, share button wraps below instead of squishing
- [ ] **1-year disclaimer** — small note on trip page: "This outing will be active for 1 year"
- [ ] **Feature request button** — floating button or footer link that opens a simple form (name + idea). Could use a free tool like Tally.so or a custom Supabase form
- [ ] **Admin dashboard stats** — fix empty state when deleted_at column is missing (run SQL migration first)

---

## 🟢 Medium term

- [ ] **Email notifications** — nudge non-responders, notify organiser when someone fills in availability (Resend)
- [ ] **Contextual sport ads** — shown only after best dates confirmed, sport-matched affiliate links
- [ ] **More sports** — hiking, hockey, basketball, volleyball, camping
- [ ] **Pro plan** — Stripe, $6/mo, unlimited trips, no ads, email nudges

---

## 🔵 Longer term

- [ ] **iOS + Android app** — React Native, shared Supabase backend
- [ ] **Shareable results image** — "Our crew is free May 17–19" card to share on group chats
- [ ] **Google Calendar export** — once dates are confirmed, one-tap add to calendar
- [ ] **Minimum headcount** — organiser sets "need at least 6 people" and app flags when threshold is met

---

## ✅ Done

- [x] Split panel calendar UI (Option C)
- [x] Sport selector with theming (climbing, golf, skiing, surfing, cycling, general)
- [x] Drag-select availability (replaced with tap-to-cycle)
- [x] Tap to cycle: free → maybe → busy
- [x] Heatmap overview with best days
- [x] Shareable invite links (no login for guests)
- [x] Share link button with "✓ Copied!" confirmation
- [x] Supabase persistence (1-year TTL)
- [x] Mobile-friendly layout (stacked on mobile, side-by-side on desktop)
- [x] Vercel Analytics
- [x] Admin dashboard at /admin (password protected)
- [x] Logo — calendar with availability dots
- [x] New BetaPlan / Create button naming
- [x] General sport category
- [x] betaplan.ca domain live

