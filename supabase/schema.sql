-- ============================================================
-- CrossCourt – Kompletna Supabase SQL Šema v2
-- Pokreni u: supabase.com → SQL Editor → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  full_name     TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- COURTS
-- ============================================================
CREATE TABLE IF NOT EXISTS courts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  description   TEXT,
  address       TEXT NOT NULL,
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  image_url     TEXT,
  is_approved   BOOLEAN DEFAULT TRUE,
  is_outdoor    BOOLEAN DEFAULT TRUE,
  surface       TEXT DEFAULT 'asfalt',
  hoops_count   INTEGER DEFAULT 2,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courts_select" ON courts;
DROP POLICY IF EXISTS "courts_insert_admin" ON courts;
DROP POLICY IF EXISTS "courts_update_admin" ON courts;
DROP POLICY IF EXISTS "courts_delete_admin" ON courts;
CREATE POLICY "courts_select"       ON courts FOR SELECT USING (is_approved = TRUE);
CREATE POLICY "courts_insert_admin" ON courts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "courts_update_admin" ON courts FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));
CREATE POLICY "courts_delete_admin" ON courts FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ============================================================
-- COURT FOLLOWERS
-- ============================================================
CREATE TABLE IF NOT EXISTS court_followers (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id   UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(court_id, user_id)
);

ALTER TABLE court_followers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "followers_select" ON court_followers;
DROP POLICY IF EXISTS "followers_all"    ON court_followers;
CREATE POLICY "followers_select" ON court_followers FOR SELECT USING (true);
CREATE POLICY "followers_all"    ON court_followers FOR ALL   USING (auth.uid() = user_id);

-- ============================================================
-- GATHERINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS gatherings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id        UUID REFERENCES courts(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  gathering_time  TIMESTAMPTZ NOT NULL,
  max_players     INTEGER,
  game_type       TEXT DEFAULT '5x5' CHECK (game_type IN ('3x3','5x5','slobodan')),
  level           TEXT DEFAULT 'rekreativno' CHECK (level IN ('rekreativno','srednji','jak')),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gatherings_select" ON gatherings;
DROP POLICY IF EXISTS "gatherings_insert" ON gatherings;
DROP POLICY IF EXISTS "gatherings_update" ON gatherings;
DROP POLICY IF EXISTS "gatherings_delete" ON gatherings;
CREATE POLICY "gatherings_select" ON gatherings FOR SELECT USING (true);
CREATE POLICY "gatherings_insert" ON gatherings FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "gatherings_update" ON gatherings FOR UPDATE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));
CREATE POLICY "gatherings_delete" ON gatherings FOR DELETE USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));

-- ============================================================
-- GATHERING ATTENDEES
-- ============================================================
CREATE TABLE IF NOT EXISTS gathering_attendees (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gathering_id UUID REFERENCES gatherings(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'dolazim' CHECK (status IN ('dolazim','ne_dolazim','mozda','no_show')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(gathering_id, user_id)
);

ALTER TABLE gathering_attendees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attendees_select" ON gathering_attendees;
DROP POLICY IF EXISTS "attendees_all"    ON gathering_attendees;
CREATE POLICY "attendees_select" ON gathering_attendees FOR SELECT USING (true);
CREATE POLICY "attendees_all"    ON gathering_attendees FOR ALL   USING (auth.uid() = user_id);

-- ============================================================
-- GATHERING COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS gathering_comments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gathering_id UUID REFERENCES gatherings(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gathering_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON gathering_comments;
DROP POLICY IF EXISTS "comments_insert" ON gathering_comments;
DROP POLICY IF EXISTS "comments_delete" ON gathering_comments;
CREATE POLICY "comments_select" ON gathering_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON gathering_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON gathering_comments FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));

-- ============================================================
-- COURT CHAT MESSAGES (realtime)
-- ============================================================
CREATE TABLE IF NOT EXISTS court_chat_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id   UUID REFERENCES courts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE court_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_select" ON court_chat_messages;
DROP POLICY IF EXISTS "chat_insert" ON court_chat_messages;
DROP POLICY IF EXISTS "chat_delete" ON court_chat_messages;
CREATE POLICY "chat_select" ON court_chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_insert" ON court_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_delete" ON court_chat_messages FOR DELETE USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type                 TEXT NOT NULL CHECK (type IN ('new_gathering','new_comment','new_attendee','no_show','court_approved')),
  title                TEXT NOT NULL,
  body                 TEXT,
  is_read              BOOLEAN DEFAULT FALSE,
  related_court_id     UUID REFERENCES courts(id) ON DELETE SET NULL,
  related_gathering_id UUID REFERENCES gatherings(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notif_select" ON notifications;
DROP POLICY IF EXISTS "notif_update" ON notifications;
DROP POLICY IF EXISTS "notif_insert" ON notifications;
DROP POLICY IF EXISTS "notif_delete" ON notifications;
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notif_delete" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- COURT SUGGESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS court_suggestions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  address      TEXT NOT NULL,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  description  TEXT,
  is_outdoor   BOOLEAN DEFAULT TRUE,
  surface      TEXT DEFAULT 'asfalt',
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Migration for existing databases created before is_outdoor/surface existed:
ALTER TABLE court_suggestions ADD COLUMN IF NOT EXISTS is_outdoor BOOLEAN DEFAULT TRUE;
ALTER TABLE court_suggestions ADD COLUMN IF NOT EXISTS surface TEXT DEFAULT 'asfalt';

ALTER TABLE court_suggestions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suggestions_insert" ON court_suggestions;
DROP POLICY IF EXISTS "suggestions_select" ON court_suggestions;
DROP POLICY IF EXISTS "suggestions_update" ON court_suggestions;
CREATE POLICY "suggestions_insert" ON court_suggestions FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "suggestions_select" ON court_suggestions FOR SELECT USING (auth.uid() = submitted_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));
CREATE POLICY "suggestions_update" ON court_suggestions FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin));

-- ============================================================
-- USER REPUTATION
-- ============================================================
CREATE TABLE IF NOT EXISTS user_reputation (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  arrivals_count      INTEGER DEFAULT 0,
  no_show_count       INTEGER DEFAULT 0,
  gatherings_created  INTEGER DEFAULT 0,
  reputation_score    INTEGER DEFAULT 100,
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rep_select" ON user_reputation;
DROP POLICY IF EXISTS "rep_all"    ON user_reputation;
CREATE POLICY "rep_select" ON user_reputation FOR SELECT USING (true);
CREATE POLICY "rep_all"    ON user_reputation FOR ALL   USING (true);

-- ============================================================
-- REALTIME — enable za potrebne tabele
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE court_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE gatherings;
ALTER PUBLICATION supabase_realtime ADD TABLE gathering_attendees;
ALTER PUBLICATION supabase_realtime ADD TABLE gathering_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- TRIGGER: Auto-create profile + reputation on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
BEGIN
  base_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    split_part(NEW.email, '@', 1)
  );

  BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      NEW.id,
      base_username,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN unique_violation THEN
    -- username zauzet → dodaj sufiks iz UUID-a
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
      NEW.id,
      base_username || '_' || substr(NEW.id::text, 1, 4),
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  END;

  INSERT INTO public.user_reputation (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: Notify followers when new gathering is created
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_new_gathering()
RETURNS TRIGGER AS $$
DECLARE
  court_name TEXT;
BEGIN
  SELECT name INTO court_name FROM courts WHERE id = NEW.court_id;

  INSERT INTO notifications (user_id, type, title, body, related_court_id, related_gathering_id)
  SELECT
    cf.user_id,
    'new_gathering',
    'Nova igra na ' || COALESCE(court_name, 'terenu') || '!',
    NEW.title,
    NEW.court_id,
    NEW.id
  FROM court_followers cf
  WHERE cf.court_id = NEW.court_id
    AND cf.user_id != NEW.created_by;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_gathering_created ON gatherings;
CREATE TRIGGER on_gathering_created
  AFTER INSERT ON gatherings
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_gathering();

-- ============================================================
-- TRIGGER: Notify gathering creator when someone joins
-- ============================================================
CREATE OR REPLACE FUNCTION notify_on_new_attendee()
RETURNS TRIGGER AS $$
DECLARE
  joiner_name  TEXT;
  creator_id   UUID;
  gather_title TEXT;
  court_id_val UUID;
BEGIN
  IF NEW.status != 'dolazim' THEN RETURN NEW; END IF;

  SELECT p.username, g.created_by, g.title, g.court_id
  INTO joiner_name, creator_id, gather_title, court_id_val
  FROM profiles p, gatherings g
  WHERE p.id = NEW.user_id AND g.id = NEW.gathering_id;

  IF creator_id IS NOT NULL AND creator_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, body, related_court_id, related_gathering_id)
    VALUES (
      creator_id, 'new_attendee',
      '@' || joiner_name || ' dolazi!',
      'Pridružio se igri: ' || COALESCE(gather_title, ''),
      court_id_val, NEW.gathering_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_attendee_joined ON gathering_attendees;
CREATE TRIGGER on_attendee_joined
  AFTER INSERT ON gathering_attendees
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_attendee();

-- ============================================================
-- STORED PROCEDURES — reputacija
-- ============================================================
CREATE OR REPLACE FUNCTION increment_arrivals(uid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_reputation (user_id, arrivals_count, reputation_score)
  VALUES (uid, 1, 100)
  ON CONFLICT (user_id) DO UPDATE SET
    arrivals_count   = user_reputation.arrivals_count + 1,
    reputation_score = LEAST(100, user_reputation.reputation_score + 2),
    updated_at       = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION penalize_no_show(uid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_reputation (user_id, no_show_count, reputation_score)
  VALUES (uid, 1, 85)
  ON CONFLICT (user_id) DO UPDATE SET
    no_show_count    = user_reputation.no_show_count + 1,
    reputation_score = GREATEST(0, user_reputation.reputation_score - 15),
    updated_at       = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_gatherings_created(uid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_reputation (user_id, gatherings_created)
  VALUES (uid, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    gatherings_created = user_reputation.gatherings_created + 1,
    updated_at         = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED DATA — 5 beogradskih terena
-- ============================================================
INSERT INTO courts (name, description, address, lat, lng, is_outdoor, surface, hoops_count, image_url) VALUES
('Košarkaški teren Medak',            'Teren u Medak parku, plava podloga, okružen zelenilom. Savršen za letnje igre.', 'Medak park, Beograd', 44.7901, 20.4782, TRUE,  'guma',   2, '/courts/medak.jpg'),
('Teren Stepa Stepanović — Naselje',  'Teren između zgrada, plava guma, uvek ima ekipa uveče.', 'Stepa Stepanović naselje, Beograd', 44.7823, 20.5021, TRUE,  'guma',   2, '/courts/stepa_naselje.jpg'),
('Teren JNA Bulevar — Stepa',         'Teren pored JNA bulevara, dobra podloga, ima tribine.', 'JNA bulevar, Stepa Stepanović, Beograd', 44.7756, 20.5134, TRUE,  'guma',   2, '/courts/stepa_jna_bulevar.jpg'),
('Teren Kod Crvenog Solitera',        'Klasični beogradski teren u Jerkoviću, zemlja, prava ulična atmosfera.', 'Jerković, Beograd', 44.7612, 20.4891, TRUE,  'zemlja', 2, '/courts/kod_crvenog_solitera.jpg'),
('Košarkaški teren Blok 37',          'Teren u Bloku 37 na Novom Beogradu, plava guma, ograđen, tribine.', 'Blok 37, Novi Beograd', 44.8067, 20.3978, TRUE,  'guma',   2, '/courts/blok_37.jpg')
ON CONFLICT DO NOTHING;

-- ============================================================
-- UPDATE seed courts with real photo URLs
-- Run this after the initial seed
-- ============================================================
UPDATE courts SET image_url = '/courts/medak.jpg'
  WHERE name LIKE '%Medak%' OR address LIKE '%Medak%';

UPDATE courts SET image_url = '/courts/stepa_naselje.jpg'
  WHERE name LIKE '%Stepa%' AND name NOT LIKE '%JNA%' AND name NOT LIKE '%Bulevar%';

UPDATE courts SET image_url = '/courts/stepa_jna_bulevar.jpg'
  WHERE name LIKE '%JNA%' OR name LIKE '%Bulevar%';

UPDATE courts SET image_url = '/courts/kod_crvenog_solitera.jpg'
  WHERE name LIKE '%Jerkovic%' OR name LIKE '%Crvenog%' OR name LIKE '%Soliter%';

UPDATE courts SET image_url = '/courts/blok_37.jpg'
  WHERE name LIKE '%Blok 37%' OR name LIKE '%37%';

-- Also update the 5 seeded Belgrade courts to use real photos
-- (matching by address since names may differ)
