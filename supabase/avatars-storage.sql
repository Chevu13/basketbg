-- ============================================================
-- BasketBG: Avatar storage bucket
-- Pokreni ceo fajl u Supabase → SQL Editor → Run
-- ============================================================

-- 1) Napravi javni bucket za avatare (ako ne postoji)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2) RLS politike na storage.objects za bucket 'avatars'
--    Svako može da VIDI avatare (bucket je javni),
--    ali korisnik može da otpremi/izmeni/obriše samo svoje.

drop policy if exists "avatars_public_read"   on storage.objects;
drop policy if exists "avatars_user_insert"   on storage.objects;
drop policy if exists "avatars_user_update"   on storage.objects;
drop policy if exists "avatars_user_delete"   on storage.objects;

-- Javno čitanje
create policy "avatars_public_read"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Upload: fajl mora biti u folderu čije ime = korisnikov UID
-- (putanja tipa "<uid>/avatar.jpg")
create policy "avatars_user_insert"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_user_update"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "avatars_user_delete"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
