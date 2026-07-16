-- ============================================================
-- CrossCourt: Migracija — predlozi terena sa slikom
-- Pokreni ceo fajl u Supabase → SQL Editor → Run
-- ============================================================

-- 1) Kolone koje možda nedostaju na court_suggestions
--    (dodate kasnije tokom razvoja — ovo je najverovatniji uzrok
--    zašto slanje predloga puca sa greškom)
ALTER TABLE court_suggestions ADD COLUMN IF NOT EXISTS is_outdoor BOOLEAN DEFAULT TRUE;
ALTER TABLE court_suggestions ADD COLUMN IF NOT EXISTS surface TEXT DEFAULT 'asfalt';
ALTER TABLE court_suggestions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2) Bucket za slike terena (javno čitljiv, upload za prijavljene korisnike)
insert into storage.buckets (id, name, public)
values ('court-images', 'court-images', true)
on conflict (id) do nothing;

drop policy if exists "court_images_public_read" on storage.objects;
drop policy if exists "court_images_auth_insert" on storage.objects;
drop policy if exists "court_images_own_delete"  on storage.objects;

create policy "court_images_public_read"
on storage.objects for select
using ( bucket_id = 'court-images' );

-- Upload: prijavljen korisnik, fajl ide u folder sa njegovim UID-om
create policy "court_images_auth_insert"
on storage.objects for insert
with check (
  bucket_id = 'court-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "court_images_own_delete"
on storage.objects for delete
using (
  bucket_id = 'court-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
