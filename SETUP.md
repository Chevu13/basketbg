# BasketBG — Setup Guide

## 1. Supabase

1. Idi na supabase.com → tvoj projekat → **SQL Editor** → New Query
2. Nalepi ceo sadržaj `supabase/schema.sql` → Run
   (kreira sve tabele, RLS policies, trigere, i seed-uje 5 pravih beogradskih terena)

## 2. Environment variables

Kopiraj `.env.local.example` u `.env.local` i popuni:

```
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key iz Settings → API>
SUPABASE_SERVICE_ROLE_KEY=<service role key iz Settings → API>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<opciono — vidi napomenu ispod>
```

**Google Maps je opcioni.** Ako izostaviš ključ, stranica pojedinačnog terena
prikazuje elegantan fallback (adresa + koordinate) umesto ugrađene mape —
aplikacija radi normalno bez njega. Home page mapa je uvek in-house SVG i
ne zavisi ni od kakvog API ključa.

## 3. Admin nalog

Nakon registracije, u Supabase SQL editoru:
```sql
UPDATE profiles SET is_admin = TRUE WHERE username = 'tvoj_username';
```

## 4. Lokalno pokretanje

```bash
npm install
npm run dev
```

## 5. Deploy na Vercel (preporučeno)

```bash
npm install -g vercel
vercel login
vercel
```
Zatim dodaj sve env varijable u Vercel dashboard → Settings → Environment Variables,
i uradi Redeploy.

## 6. Deploy na Netlify (alternativa)

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify env:set NEXT_PUBLIC_SUPABASE_URL "..."
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "..."
netlify env:set SUPABASE_SERVICE_ROLE_KEY "..."
netlify deploy --prod
```

## Struktura projekta

```
app/
  page.tsx                    → Home (feed igara večeras/sutra + mapa)
  auth/login, auth/register   → Auth (uklj. "zaboravljena lozinka")
  courts/page.tsx             → Lista svih terena
  courts/[id]/page.tsx        → Teren: zid + realtime chat + follow
  courts/suggest/page.tsx     → Predlog novog terena
  gatherings/new/page.tsx     → Zakaži igru (standalone forma)
  profile/page.tsx            → Profil, reputacija, no-show označavanje
  notifications/page.tsx      → Obaveštenja
  admin/page.tsx              → Admin panel
  api/                        → Sve REST API rute (server-side, RLS-safe)
  not-found.tsx, error.tsx    → Branded 404 / error fallback

components/
  gathering/GatheringCard.tsx → Jedinstvena kartica okupljanja (full + compact varijanta)
  court/CourtCard.tsx         → Jedinstvena kartica terena (rail + row layout)
  layout/                     → TopBar, BottomNav, AuthProvider
  chat/CourtChat.tsx          → Realtime chat po terenu
  map/                        → HomeMap (in-house SVG) + CourtMapEmbed (Google Maps opciono)

lib/
  supabase.ts                 → Klijentski Supabase klijent
  supabase-server.ts          → Server-side klijenti (koriste ga sve API rute)
  utils.ts                    → Formatiranje, distance, geo-projekcija za mapu

supabase/schema.sql           → Kompletna SQL šema + RLS + triggeri + seed podaci
```

## Poznata ograničenja

- Email potvrda: ako je "Confirm email" uključen u Supabase Auth podešavanjima,
  korisnik nakon registracije mora da klikne link u emailu pre nego što se
  zaista prijavi — aplikacija to sada ispravno prikazuje ("Proveri email"
  ekran) umesto lažnog "uspešno prijavljen" stanja.
