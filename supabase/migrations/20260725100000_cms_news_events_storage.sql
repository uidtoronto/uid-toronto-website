/*
# CMS: news, events, member profile photos, storage buckets
*/

-- ── News ──
CREATE TABLE IF NOT EXISTS news_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en      text NOT NULL,
  title_tr      text NOT NULL DEFAULT '',
  excerpt_en    text NOT NULL,
  excerpt_tr    text NOT NULL DEFAULT '',
  body_en       text,
  body_tr       text,
  image_url     text,
  is_published  boolean NOT NULL DEFAULT false,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_posts_published_idx ON news_posts (is_published, published_at DESC);

-- ── Events ──
CREATE TABLE IF NOT EXISTS events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en        text NOT NULL,
  title_tr        text NOT NULL DEFAULT '',
  description_en  text NOT NULL,
  description_tr  text NOT NULL DEFAULT '',
  event_date      date NOT NULL,
  event_time      time NOT NULL DEFAULT '18:00',
  location        text NOT NULL,
  image_url       text,
  is_published    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_upcoming_idx ON events (event_date ASC, event_time ASC)
  WHERE is_published = true;

-- ── Member profile photo ──
ALTER TABLE members ADD COLUMN IF NOT EXISTS profile_photo_url text;

-- ── updated_at trigger ──
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS news_posts_updated_at ON news_posts;
CREATE TRIGGER news_posts_updated_at
  BEFORE UPDATE ON news_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS: news_posts ──
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_select_published" ON news_posts;
CREATE POLICY "news_select_published" ON news_posts
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "news_admin_all" ON news_posts;
CREATE POLICY "news_admin_all" ON news_posts
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ── RLS: events ──
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_published" ON events;
CREATE POLICY "events_select_published" ON events
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "events_admin_all" ON events;
CREATE POLICY "events_admin_all" ON events
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ── Storage buckets ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('news-images', 'news-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('event-images', 'event-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('member-photos', 'member-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Public read for CMS buckets
DROP POLICY IF EXISTS "cms_public_read_news" ON storage.objects;
CREATE POLICY "cms_public_read_news" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'news-images');

DROP POLICY IF EXISTS "cms_public_read_events" ON storage.objects;
CREATE POLICY "cms_public_read_events" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "cms_public_read_members" ON storage.objects;
CREATE POLICY "cms_public_read_members" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'member-photos');

-- Super admin write
DROP POLICY IF EXISTS "cms_admin_write_news" ON storage.objects;
CREATE POLICY "cms_admin_write_news" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'news-images' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'news-images' AND public.is_super_admin());

DROP POLICY IF EXISTS "cms_admin_write_events" ON storage.objects;
CREATE POLICY "cms_admin_write_events" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'event-images' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'event-images' AND public.is_super_admin());

DROP POLICY IF EXISTS "cms_admin_write_members" ON storage.objects;
CREATE POLICY "cms_admin_write_members" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'member-photos' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'member-photos' AND public.is_super_admin());

-- ── Seed published content (only when tables are empty) ──
INSERT INTO news_posts (title_en, title_tr, excerpt_en, excerpt_tr, is_published, published_at)
SELECT * FROM (VALUES
  (
    'New Partnership with Toronto Arts Council',
    'Toronto Sanat Konseyi ile Yeni Ortaklık',
    'UID Toronto is proud to announce a new cultural partnership for 2026.',
    'UID Toronto, 2026 için yeni bir kültürel ortaklığı duyurmaktan gurur duyar.',
    true, '2026-07-01'::timestamptz
  ),
  (
    'Executive Board Election Results',
    'Yönetim Kurulu Seçim Sonuçları',
    'Meet your newly elected executive board members for the 2026–2028 term.',
    '2026–2028 dönemi için yeni seçilen yönetim kurulu üyelerinizle tanışın.',
    true, '2026-06-20'::timestamptz
  ),
  (
    'Scholarship Applications Now Open',
    'Burs Başvuruları Açıldı',
    'Applications for the 2026 UID Toronto Student Scholarship are now being accepted.',
    '2026 UID Toronto Öğrenci Bursu başvuruları kabul edilmektedir.',
    true, '2026-06-05'::timestamptz
  )
) AS v(title_en, title_tr, excerpt_en, excerpt_tr, is_published, published_at)
WHERE NOT EXISTS (SELECT 1 FROM news_posts LIMIT 1);

INSERT INTO events (title_en, title_tr, description_en, description_tr, event_date, event_time, location, is_published)
SELECT * FROM (VALUES
  (
    'Annual Cultural Gala',
    'Yıllık Kültür Gecesi',
    'Join us for an evening of celebration, music and community.',
    'Kutlama, müzik ve topluluk için bir akşama katılın.',
    '2026-09-15'::date, '18:00'::time, 'Toronto Reference Library', true
  ),
  (
    'Youth Leadership Workshop',
    'Gençlik Liderlik Atölyesi',
    'A hands-on workshop for young community leaders.',
    'Genç topluluk liderleri için uygulamalı bir atölye.',
    '2026-08-03'::date, '14:00'::time, 'Civic Centre, Hall B', true
  ),
  (
    'Community Iftar Dinner',
    'Topluluk İftar Yemeği',
    'Breaking fast together — all members and families welcome.',
    'Birlikte iftar — tüm üyeler ve aileler davetlidir.',
    '2026-03-12'::date, '19:00'::time, 'UID Toronto Headquarters', true
  )
) AS v(title_en, title_tr, description_en, description_tr, event_date, event_time, location, is_published)
WHERE NOT EXISTS (SELECT 1 FROM events LIMIT 1);
