# BasketBG — Setup Guide

## 1. Supabase

1. Idi na supabase.com → tvoj projekat (aofwaygfobhultukobzz)
2. SQL Editor → New Query → nalepi sadržaj iz `supabase/schema.sql` → Run
3. Settings → API → kopiraj novi Anon Key i Service Role Key

## 2. Environment variables

Kopiraj `.env.local.example` u `.env.local` i popuni:

```
NEXT_PUBLIC_SUPABASE_URL=https://aofwaygfobhultukobzz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tvoj novi anon key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google maps key>
SUPABASE_SERVICE_ROLE_KEY=<tvoj novi service role key>
```

## 3. Google Maps API

1. console.cloud.google.com → New Project
2. Enable: Maps JavaScript API + Maps Embed API
3. Create API Key → kopiraj u .env.local

## 4. Admin nalog

Nakon registracije, u Supabase SQL editoru:
```sql
UPDATE profiles SET is_admin = TRUE WHERE username = 'tvoj_username';
```

## 5. Lokalno pokretanje

```bash
npm install
npm run dev
```

## 6. Deploy na Netlify

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set NEXT_PUBLIC_SUPABASE_URL "..."
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "..."
netlify env:set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY "..."
netlify env:set SUPABASE_SERVICE_ROLE_KEY "..."
netlify deploy --prod
```

## 7. Deploy na Vercel (preporučeno za Next.js)

```bash
npm install -g vercel
vercel login
vercel
# Dodaj env vars u Vercel dashboard
```

## Struktura projekta

```
app/
  page.tsx              → Home (lista igara)
  auth/
    login/page.tsx      → Login
    register/page.tsx   → Registracija
  courts/
    page.tsx            → Lista terena
    [id]/page.tsx       → Stranica terena (wall + chat)
    suggest/page.tsx    → Predlog terena
  gatherings/
    new/page.tsx        → Nova igra
  profile/page.tsx      → Profil korisnika
  notifications/page.tsx→ Obaveštenja
  admin/page.tsx        → Admin panel
  api/                  → API routes (bekend)

components/
  layout/               → TopBar, BottomNav, AuthProvider
  gathering/            → GatheringCard, CreateGatheringInline
  chat/                 → CourtChat (realtime)
  map/                  → HomeMap, CourtMapEmbed

supabase/
  schema.sql            → Kompletna SQL šema + seed data
```
