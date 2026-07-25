/*
# CMS: board members, projects, storage buckets
*/

-- ── Board Members ──
CREATE TABLE IF NOT EXISTS board_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en         text NOT NULL DEFAULT '',
  name_tr         text NOT NULL DEFAULT '',
  description_en  text NOT NULL DEFAULT '',
  description_tr  text NOT NULL DEFAULT '',
  position_en     text NOT NULL,
  position_tr     text NOT NULL DEFAULT '',
  photo_url       text,
  is_featured     boolean NOT NULL DEFAULT false,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS board_members_sort_idx ON board_members (sort_order ASC);

-- ── Projects ──
CREATE TABLE IF NOT EXISTS projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en          text NOT NULL,
  title_tr          text NOT NULL DEFAULT '',
  description_en    text NOT NULL,
  description_tr    text NOT NULL DEFAULT '',
  cover_image_url   text,
  gallery_urls      text[] NOT NULL DEFAULT '{}',
  project_date      date NOT NULL,
  category_en       text NOT NULL DEFAULT '',
  category_tr       text NOT NULL DEFAULT '',
  is_featured       boolean NOT NULL DEFAULT false,
  is_published      boolean NOT NULL DEFAULT false,
  instagram_url     text,
  facebook_url      text,
  youtube_url       text,
  tiktok_url        text,
  website_url       text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS projects_published_date_idx ON projects (project_date DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS projects_featured_idx ON projects (is_featured, project_date DESC)
  WHERE is_published = true AND is_featured = true;

-- ── updated_at triggers ──
DROP TRIGGER IF EXISTS board_members_updated_at ON board_members;
CREATE TRIGGER board_members_updated_at
  BEFORE UPDATE ON board_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── RLS: board_members ──
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "board_members_select_public" ON board_members;
CREATE POLICY "board_members_select_public" ON board_members
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "board_members_admin_all" ON board_members;
CREATE POLICY "board_members_admin_all" ON board_members
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ── RLS: projects ──
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_published" ON projects;
CREATE POLICY "projects_select_published" ON projects
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "projects_admin_all" ON projects;
CREATE POLICY "projects_admin_all" ON projects
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ── Storage buckets ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('board-photos', 'board-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('project-images', 'project-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "cms_public_read_board" ON storage.objects;
CREATE POLICY "cms_public_read_board" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'board-photos');

DROP POLICY IF EXISTS "cms_public_read_projects" ON storage.objects;
CREATE POLICY "cms_public_read_projects" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'project-images');

DROP POLICY IF EXISTS "cms_admin_write_board" ON storage.objects;
CREATE POLICY "cms_admin_write_board" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'board-photos' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'board-photos' AND public.is_super_admin());

DROP POLICY IF EXISTS "cms_admin_write_projects" ON storage.objects;
CREATE POLICY "cms_admin_write_projects" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'project-images' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'project-images' AND public.is_super_admin());

-- ── Seed board members (only when table is empty) ──
INSERT INTO board_members (name_en, name_tr, position_en, position_tr, photo_url, is_featured, sort_order)
SELECT * FROM (VALUES
  ('Furkan Yasir Yalçin', 'Furkan Yasir Yalçin', 'Regional President', 'Bölge Başkanı', NULL::text, true, 0),
  ('Merve Guler', 'Merve Güler', 'Regional Secretary', 'Bölge Sekreteri', '/images/team/4.png', true, 1),
  ('Hasan Budak', 'Hasan Budak', 'Head of Organization', 'Bölge Teşkilatlanma Başkanı', '/images/team/6.png', false, 2),
  ('', '', 'Head of Public Relations', 'Bölge Halkla İlişkiler Başkanı', NULL::text, false, 3),
  ('Mehmet Ünsal', 'Mehmet Ünsal', 'Head of Political Affairs', 'Bölge Siyasi İşler Başkanı', '/images/team/2.png', false, 4),
  ('Zeynep Gümüştaş', 'Zeynep Gümüştaş', 'Head of Women''s Branch', 'Bölge Kadın Kolları Başkanı', NULL::text, false, 5),
  ('Recep Tayyip Kisak', 'Recep Tayyip Kisak', 'Head of Youth Branch', 'Bölge Gençlik Kolları Başkanı', '/images/team/5.png', false, 6),
  ('Abdulvasi Sis', 'Abdulvasi Sis', 'Head of Finance & Economics', 'Bölge Mali – İdari İşler ve Ekonomi Başkanı', NULL::text, false, 7),
  ('Mehmet Erilli', 'Mehmet Erilli', 'Head of R&D & Education', 'Bölge Ar-Ge ve Eğitim Başkanı', '/images/team/3.png', false, 8),
  ('Musa Arı', 'Musa Arı', 'Head of NGO Relations', 'Bölge STK''larla İlişkiler Başkanı', '/images/team/1.png', false, 9),
  ('Suheyb Hussein', 'Suheyb Hussein', 'Head of Media & IT', 'Bölge Tanıtım – Medya ve Bilgi Teknolojileri Başkanı', NULL::text, false, 10),
  ('Serpil Güney', 'Serpil Güney', 'Head of Family & Social Affairs', 'Bölge Aile ve Sosyal İşler Başkanı', NULL::text, false, 11),
  ('', '', 'Head of Legal Affairs', 'Bölge Hukuki İşler Başkanı', NULL::text, false, 12)
) AS v(name_en, name_tr, position_en, position_tr, photo_url, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM board_members LIMIT 1);

-- ── Seed projects (only when table is empty) ──
INSERT INTO projects (title_en, title_tr, description_en, description_tr, project_date, category_en, category_tr, is_featured, is_published)
SELECT * FROM (VALUES
  (
    'Presidential Reception at Külliye',
    'Cumhurbaşkanlığı Külliye Kabulü',
    'Participation in President Erdoğan''s reception of the Union of International Democrats at Külliye. The UID Toronto delegation represented the community at this distinguished official reception.',
    'Cumhurbaşkanı Recep Tayyip Erdoğan''ın Külliye kabul programına katılım. UID Toronto heyeti, Uluslararası Demokratlar Birliği''nin bu özel kabulünde temsil edildi.',
    '2024-06-01'::date, 'Events', 'Etkinlikler', true, true
  ),
  (
    'Regional President Appointment',
    'Bölge Başkanı Görev Takdimi',
    'Furkan Yasir Yalçın was officially appointed as UID Canada Toronto Regional President by UID Chairman Kenan Aslan in a formal ceremony.',
    'Furkan Yasir Yalçın, UID Kanada Toronto Bölge Başkanı olarak Genel Başkan Kenan Aslan tarafından resmi görev takdimi ile atandı.',
    '2024-05-01'::date, 'Leadership', 'Liderlik', false, true
  ),
  (
    'Capacity Development Workshop — HQ',
    'Kapasite Geliştirme Çalıştayı — Genel Merkez',
    'Furkan Yasir Yalçın, Merve Güler and Yunus Baran Şahin attended UID''s 8th Capacity Development & Training Workshop alongside Chairman Kenan Aslan.',
    'Toronto Bölge Başkanı Furkan Yasir Yalçın, Merve Güler ve Yunus Baran Şahin, Genel Başkan Kenan Aslan ile UID''nin 8. Kapasite Geliştirme ve Eğitim Çalıştayı''nda bir araya geldi.',
    '2024-04-01'::date, 'Programs', 'Programlar', false, true
  ),
  (
    'Overseas Turks Year-End Workshop',
    'Yurtdışı Türkler Yıl Sonu Çalıştayı',
    'The Toronto team attended the Overseas Turks Presidency (YTB) year-end capacity development workshop, strengthening ties with diaspora institutions.',
    'Furkan Yasir Yalçın, Merve Güler ve Yunus Baran Şahin, Yurtdışı Türkler ve Akraba Topluluklar Başkanlığı yıl sonu kapasite geliştirme çalıştayına katıldı.',
    '2024-03-01'::date, 'Programs', 'Programlar', false, true
  ),
  (
    'Turkish & Muslim Leaders Coordination Meeting',
    'Türk & Müslüman Liderler Koordinasyon Toplantısı',
    'Hosted Minister of Energy Alparslan Bayraktar at a coordination meeting with Turkish associations and Muslim community leaders, attended by Embassy and Consulate representatives.',
    'T.C. Enerji ve Tabii Kaynaklar Bakanı Alparslan Bayraktar ağırlandı; T.C. Büyükelçiliği ve Başkonsolosluk temsilcilerinin katıldığı koordinasyon toplantısı düzenlendi.',
    '2024-02-01'::date, 'Events', 'Etkinlikler', true, true
  ),
  (
    'Ramadan Iftar Distribution',
    'Ramazan İftarlık Dağıtımı',
    'UID Toronto Regional President and team distributed iftar bags to Toronto locals during Ramadan, raising community awareness and fostering goodwill.',
    'Toronto Bölge Başkanı ve yardımcıları, Ramazan ayında Toronto''da yerel halka iftarlık dağıtımı yaparak toplulukta Ramazan farkındalığı oluşturdu.',
    '2024-01-15'::date, 'Community', 'Topluluk', true, true
  ),
  (
    'TS2023 Promotional Video',
    'TS2023 Tanıtım Videosu',
    'Promotional video produced in collaboration with the Turkish Federation for the TS2023 project, reaching over 100,000 views across platforms.',
    'UID Toronto ile Türk Federasyonu iş birliğinde TS2023 projesi için tanıtım videosu çekildi. Video 100.000''den fazla görüntülenmeye ulaştı.',
    '2023-12-01'::date, 'Culture', 'Kültür', false, true
  )
) AS v(title_en, title_tr, description_en, description_tr, project_date, category_en, category_tr, is_featured, is_published)
WHERE NOT EXISTS (SELECT 1 FROM projects LIMIT 1);
