-- ============================================================
-- CrossCourt: Migracija — dozvoli "3na3" kao tip igre
-- Pokreni ceo fajl u Supabase → SQL Editor → Run
--
-- Uzrok bug-a: CHECK constraint na gatherings.game_type je
-- dozvoljavao samo '3x3' / '5x5' / 'slobodan'. Kad je frontend
-- počeo da šalje '3na3', baza je odbijala insert.
-- ============================================================

-- Nađi i obriši POSTOJEĆI check constraint na koloni game_type,
-- bez obzira na tačan naziv (siguran pristup ako se naziv razlikuje).
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'gatherings'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%game_type%'
  LOOP
    EXECUTE format('ALTER TABLE gatherings DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

ALTER TABLE gatherings
  ADD CONSTRAINT gatherings_game_type_check
  CHECK (game_type IN ('3x3', '3na3', '5x5', 'slobodan'));

-- Provera — treba da vrati novi constraint bez greške
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'gatherings'::regclass AND conname = 'gatherings_game_type_check';
