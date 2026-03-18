-- =====================================================
-- DAGSTATEN STRUKTON - INITIAL DATABASE SCHEMA
-- =====================================================

-- ==================== ENUMS ==========================

CREATE TYPE public.app_role AS ENUM (
  'beheerder',
  'sr_uitvoerder',
  'uitvoerder',
  'voorman'
);

CREATE TYPE public.dagstaat_status AS ENUM (
  'draft',
  'submitted',
  'approved'
);

CREATE TYPE public.unit_type AS ENUM (
  'uur',
  'dag',
  'halve_dag',
  'stuks',
  'km',
  'm3',
  'ton',
  'liter'
);

-- ==================== CORE TABLES ====================

-- PROFILES
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          public.app_role NOT NULL DEFAULT 'voorman',
  phone         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PROJECTS
CREATE TABLE public.projects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  client        TEXT,
  location      TEXT,
  start_date    DATE,
  end_date      DATE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SUBPROJECTS (Deelprojecten)
CREATE TABLE public.subprojects (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, code)
);

-- PROJECT MEMBERS
CREATE TABLE public.project_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          public.app_role NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, profile_id)
);

-- EMPLOYEES (Medewerkers)
CREATE TABLE public.employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  function      TEXT,
  employer      TEXT DEFAULT 'Strukton',
  is_subcontractor BOOLEAN NOT NULL DEFAULT false,
  hourly_rate   NUMERIC(10,2),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- EQUIPMENT (Materieel)
CREATE TABLE public.equipment (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  default_unit  public.unit_type NOT NULL DEFAULT 'dag',
  day_rate      NUMERIC(10,2),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MATERIAL CATEGORIES (parent-child)
CREATE TABLE public.material_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID REFERENCES public.material_categories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MATERIALS
CREATE TABLE public.materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES public.material_categories(id) ON DELETE RESTRICT,
  code          TEXT,
  name          TEXT NOT NULL,
  default_unit  public.unit_type NOT NULL DEFAULT 'stuks',
  unit_price    NUMERIC(10,2),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ACTIVITY CATEGORIES (parent-child)
CREATE TABLE public.activity_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID REFERENCES public.activity_categories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ACTIVITIES (Activiteiten)
CREATE TABLE public.activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   UUID NOT NULL REFERENCES public.activity_categories(id) ON DELETE RESTRICT,
  code          TEXT,
  name          TEXT NOT NULL,
  description   TEXT,
  default_unit  public.unit_type NOT NULL DEFAULT 'uur',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== DAGSTAAT TABLES ==================

-- DAGSTAAT header (one per project per day)
CREATE TABLE public.dagstaten (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  date          DATE NOT NULL,
  status        public.dagstaat_status NOT NULL DEFAULT 'draft',
  weather       TEXT,
  created_by    UUID NOT NULL REFERENCES public.profiles(id),
  submitted_at  TIMESTAMPTZ,
  submitted_by  UUID REFERENCES public.profiles(id),
  approved_at   TIMESTAMPTZ,
  approved_by   UUID REFERENCES public.profiles(id),
  copied_from   UUID REFERENCES public.dagstaten(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, date)
);

-- DAGSTAAT: PERSONEEL (staff hours)
CREATE TABLE public.dagstaat_personeel (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dagstaat_id   UUID NOT NULL REFERENCES public.dagstaten(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES public.employees(id),
  unit          public.unit_type NOT NULL DEFAULT 'uur',
  quantity      NUMERIC(6,2) NOT NULL DEFAULT 0,
  start_time    TIME,
  end_time      TIME,
  remarks       TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DAGSTAAT: MATERIEEL (equipment)
CREATE TABLE public.dagstaat_materieel (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dagstaat_id   UUID NOT NULL REFERENCES public.dagstaten(id) ON DELETE CASCADE,
  equipment_id  UUID NOT NULL REFERENCES public.equipment(id),
  unit          public.unit_type NOT NULL DEFAULT 'dag',
  quantity      NUMERIC(6,2) NOT NULL DEFAULT 0,
  remarks       TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DAGSTAAT: WERK (activities/work done)
CREATE TABLE public.dagstaat_werk (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dagstaat_id   UUID NOT NULL REFERENCES public.dagstaten(id) ON DELETE CASCADE,
  activity_id   UUID NOT NULL REFERENCES public.activities(id),
  subproject_id UUID REFERENCES public.subprojects(id),
  unit          public.unit_type NOT NULL DEFAULT 'uur',
  quantity      NUMERIC(10,2) NOT NULL DEFAULT 0,
  description   TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DAGSTAAT: MATERIAAL (materials used)
CREATE TABLE public.dagstaat_materiaal (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dagstaat_id   UUID NOT NULL REFERENCES public.dagstaten(id) ON DELETE CASCADE,
  material_id   UUID REFERENCES public.materials(id),
  subproject_id UUID REFERENCES public.subprojects(id),
  name_override TEXT,
  unit          public.unit_type NOT NULL DEFAULT 'stuks',
  quantity      NUMERIC(10,2) NOT NULL DEFAULT 0,
  remarks       TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT material_or_override CHECK (
    material_id IS NOT NULL OR name_override IS NOT NULL
  )
);

-- DAGSTAAT: PHOTOS
CREATE TABLE public.dagstaat_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dagstaat_id   UUID NOT NULL REFERENCES public.dagstaten(id) ON DELETE CASCADE,
  subproject_id UUID REFERENCES public.subprojects(id),
  storage_path  TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  file_size     INT,
  caption       TEXT,
  sort_order    INT NOT NULL DEFAULT 0,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DAGSTAAT: NOTES
CREATE TABLE public.dagstaat_notes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dagstaat_id   UUID NOT NULL REFERENCES public.dagstaten(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_private    BOOLEAN NOT NULL DEFAULT false,
  created_by    UUID NOT NULL REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==================== TEMPLATES =======================

CREATE TABLE public.project_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT 'Standaard',
  created_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.template_personeel (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES public.employees(id),
  unit          public.unit_type NOT NULL DEFAULT 'uur',
  default_qty   NUMERIC(6,2) NOT NULL DEFAULT 8,
  sort_order    INT NOT NULL DEFAULT 0
);

CREATE TABLE public.template_materieel (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  equipment_id  UUID NOT NULL REFERENCES public.equipment(id),
  unit          public.unit_type NOT NULL DEFAULT 'dag',
  default_qty   NUMERIC(6,2) NOT NULL DEFAULT 1,
  sort_order    INT NOT NULL DEFAULT 0
);

-- ==================== SYNC LOG ========================

CREATE TABLE public.sync_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID NOT NULL REFERENCES public.profiles(id),
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  action        TEXT NOT NULL,
  client_ts     TIMESTAMPTZ NOT NULL,
  server_ts     TIMESTAMPTZ NOT NULL DEFAULT now(),
  conflict      BOOLEAN NOT NULL DEFAULT false
);

-- ==================== INDEXES =========================

CREATE INDEX idx_dagstaten_project_date ON public.dagstaten (project_id, date);
CREATE INDEX idx_dagstaten_status ON public.dagstaten (status);
CREATE INDEX idx_dagstaten_created_by ON public.dagstaten (created_by);
CREATE INDEX idx_dagstaat_personeel_dagstaat ON public.dagstaat_personeel (dagstaat_id);
CREATE INDEX idx_dagstaat_materieel_dagstaat ON public.dagstaat_materieel (dagstaat_id);
CREATE INDEX idx_dagstaat_werk_dagstaat ON public.dagstaat_werk (dagstaat_id);
CREATE INDEX idx_dagstaat_materiaal_dagstaat ON public.dagstaat_materiaal (dagstaat_id);
CREATE INDEX idx_dagstaat_photos_dagstaat ON public.dagstaat_photos (dagstaat_id);
CREATE INDEX idx_dagstaat_notes_dagstaat ON public.dagstaat_notes (dagstaat_id);
CREATE INDEX idx_project_members_profile ON public.project_members (profile_id);
CREATE INDEX idx_subprojects_project ON public.subprojects (project_id);
CREATE INDEX idx_materials_category ON public.materials (category_id);
CREATE INDEX idx_activities_category ON public.activities (category_id);
CREATE INDEX idx_material_categories_parent ON public.material_categories (parent_id);
CREATE INDEX idx_activity_categories_parent ON public.activity_categories (parent_id);

-- ==================== UPDATED_AT TRIGGER ==============

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'profiles','projects','subprojects','employees','equipment',
      'materials','activities','dagstaten',
      'dagstaat_personeel','dagstaat_materieel','dagstaat_werk',
      'dagstaat_materiaal','dagstaat_notes'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_%s_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t
    );
  END LOOP;
END $$;

-- ==================== HELPER FUNCTIONS ================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id AND profile_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==================== ROW LEVEL SECURITY ==============

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all active profiles"
  ON public.profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.current_user_role() = 'beheerder');

-- PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their projects"
  ON public.projects FOR SELECT
  USING (
    public.current_user_role() IN ('beheerder', 'sr_uitvoerder')
    OR public.is_project_member(id)
  );

CREATE POLICY "Admins and sr_uitvoerder can manage projects"
  ON public.projects FOR ALL
  USING (public.current_user_role() IN ('beheerder', 'sr_uitvoerder'));

-- SUBPROJECTS
ALTER TABLE public.subprojects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view subprojects"
  ON public.subprojects FOR SELECT
  USING (
    public.current_user_role() IN ('beheerder', 'sr_uitvoerder')
    OR public.is_project_member(project_id)
  );

CREATE POLICY "Uitvoerder+ can manage subprojects"
  ON public.subprojects FOR ALL
  USING (
    public.current_user_role() IN ('beheerder', 'sr_uitvoerder', 'uitvoerder')
    AND public.is_project_member(project_id)
  );

-- Allow voorman to create subprojects inline from Werk tab
CREATE POLICY "Voorman can create subprojects on their projects"
  ON public.subprojects FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'voorman'
    AND public.is_project_member(project_id)
  );

-- PROJECT MEMBERS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view project membership"
  ON public.project_members FOR SELECT
  USING (
    public.current_user_role() IN ('beheerder', 'sr_uitvoerder')
    OR profile_id = auth.uid()
  );

CREATE POLICY "Admins manage project members"
  ON public.project_members FOR ALL
  USING (public.current_user_role() IN ('beheerder', 'sr_uitvoerder'));

-- MASTER DATA (employees, equipment, materials, activities, categories)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'employees','equipment','materials','activities',
      'material_categories','activity_categories'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    EXECUTE format(
      'CREATE POLICY "Authenticated users can view %s"
       ON public.%I FOR SELECT
       USING (auth.uid() IS NOT NULL);', t, t
    );

    EXECUTE format(
      'CREATE POLICY "Admins and managers can manage %s"
       ON public.%I FOR ALL
       USING (public.current_user_role() IN (''beheerder'', ''sr_uitvoerder'', ''uitvoerder''));', t, t
    );
  END LOOP;
END $$;

-- DAGSTATEN
ALTER TABLE public.dagstaten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view project dagstaten"
  ON public.dagstaten FOR SELECT
  USING (
    public.current_user_role() IN ('beheerder', 'sr_uitvoerder')
    OR public.is_project_member(project_id)
  );

CREATE POLICY "Members can create dagstaten for their projects"
  ON public.dagstaten FOR INSERT
  WITH CHECK (
    public.is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Creator can update draft dagstaten"
  ON public.dagstaten FOR UPDATE
  USING (
    (created_by = auth.uid() AND status = 'draft')
    OR public.current_user_role() IN ('beheerder', 'sr_uitvoerder', 'uitvoerder')
  );

-- DAGSTAAT LINE ITEMS (personeel, materieel, werk, materiaal, photos)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'dagstaat_personeel','dagstaat_materieel','dagstaat_werk',
      'dagstaat_materiaal','dagstaat_photos'
    ])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    EXECUTE format(
      'CREATE POLICY "View %s via dagstaat access"
       ON public.%I FOR SELECT
       USING (
         EXISTS (
           SELECT 1 FROM public.dagstaten d
           WHERE d.id = dagstaat_id
         )
       );', t, t
    );

    EXECUTE format(
      'CREATE POLICY "Edit %s on accessible dagstaten"
       ON public.%I FOR ALL
       USING (
         EXISTS (
           SELECT 1 FROM public.dagstaten d
           WHERE d.id = dagstaat_id
           AND (
             (d.created_by = auth.uid() AND d.status = ''draft'')
             OR public.current_user_role() IN (''beheerder'', ''sr_uitvoerder'', ''uitvoerder'')
           )
         )
       );', t, t
    );
  END LOOP;
END $$;

-- DAGSTAAT NOTES (special: private visibility)
ALTER TABLE public.dagstaat_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View public notes via dagstaat access"
  ON public.dagstaat_notes FOR SELECT
  USING (
    is_private = false
    AND EXISTS (SELECT 1 FROM public.dagstaten d WHERE d.id = dagstaat_id)
  );

CREATE POLICY "Managers can view private notes"
  ON public.dagstaat_notes FOR SELECT
  USING (
    is_private = true
    AND public.current_user_role() IN ('beheerder', 'sr_uitvoerder', 'uitvoerder')
    AND EXISTS (SELECT 1 FROM public.dagstaten d WHERE d.id = dagstaat_id)
  );

CREATE POLICY "Edit notes on accessible dagstaten"
  ON public.dagstaat_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.dagstaten d
      WHERE d.id = dagstaat_id
      AND (
        (d.created_by = auth.uid() AND d.status = 'draft')
        OR public.current_user_role() IN ('beheerder', 'sr_uitvoerder', 'uitvoerder')
      )
    )
  );

-- TEMPLATES
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_personeel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_materieel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view project templates"
  ON public.project_templates FOR SELECT
  USING (public.is_project_member(project_id));

CREATE POLICY "Managers can manage templates"
  ON public.project_templates FOR ALL
  USING (
    public.current_user_role() IN ('beheerder', 'sr_uitvoerder', 'uitvoerder')
    AND public.is_project_member(project_id)
  );

CREATE POLICY "View template personeel"
  ON public.template_personeel FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.project_templates t WHERE t.id = template_id));

CREATE POLICY "Manage template personeel"
  ON public.template_personeel FOR ALL
  USING (
    public.current_user_role() IN ('beheerder', 'sr_uitvoerder', 'uitvoerder')
    AND EXISTS (SELECT 1 FROM public.project_templates t WHERE t.id = template_id)
  );

CREATE POLICY "View template materieel"
  ON public.template_materieel FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.project_templates t WHERE t.id = template_id));

CREATE POLICY "Manage template materieel"
  ON public.template_materieel FOR ALL
  USING (
    public.current_user_role() IN ('beheerder', 'sr_uitvoerder', 'uitvoerder')
    AND EXISTS (SELECT 1 FROM public.project_templates t WHERE t.id = template_id)
  );

-- SYNC LOG
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs"
  ON public.sync_log FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can create sync logs"
  ON public.sync_log FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- ==================== STORAGE =========================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dagstaat-photos',
  'dagstaat-photos',
  false,
  1048576,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'dagstaat-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can view photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'dagstaat-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can delete photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'dagstaat-photos'
    AND public.current_user_role() IN ('beheerder', 'sr_uitvoerder')
  );
