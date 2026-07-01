
-- =============== ENUMS ===============
CREATE TYPE public.app_role AS ENUM ('student', 'psychologist', 'organisation', 'admin');
CREATE TYPE public.province AS ENUM ('Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','Northern Cape','North West','Western Cape');
CREATE TYPE public.opportunity_type AS ENUM ('in_person','hybrid','remote');
CREATE TYPE public.application_status AS ENUM ('pending','accepted','rejected','withdrawn','completed');
CREATE TYPE public.forum_category AS ENUM ('Honours Applications','Research','Volunteer Advice','Clinical','Counselling','Study Tips','Mental Health','General');
CREATE TYPE public.chat_role AS ENUM ('user','assistant','system');

-- =============== updated_at trigger fn ===============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =============== PROFILES ===============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  university TEXT,
  degree TEXT,
  province public.province,
  avatar_url TEXT,
  bio TEXT,
  grad_year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== USER_ROLES + has_role ===============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- =============== handle_new_user trigger ===============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role public.app_role;
  v_province public.province;
BEGIN
  BEGIN
    v_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'student');
  EXCEPTION WHEN others THEN v_role := 'student';
  END;
  BEGIN
    v_province := NULLIF(NEW.raw_user_meta_data ->> 'province','')::public.province;
  EXCEPTION WHEN others THEN v_province := NULL;
  END;

  INSERT INTO public.profiles (id, full_name, email, university, degree, province)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'university',''),
    NULLIF(NEW.raw_user_meta_data ->> 'degree',''),
    v_province
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role)
  ON CONFLICT DO NOTHING;

  IF v_role = 'psychologist' THEN
    INSERT INTO public.psychologist_details (user_id, hpcsa_number, category, organisation, verified_at)
    VALUES (
      NEW.id,
      NULLIF(NEW.raw_user_meta_data ->> 'hpcsa_number',''),
      NULLIF(NEW.raw_user_meta_data ->> 'psych_category',''),
      NULLIF(NEW.raw_user_meta_data ->> 'psych_org',''),
      now()  -- trust-based auto-verify (v1)
    );
  END IF;

  RETURN NEW;
END; $$;

-- =============== PSYCHOLOGIST_DETAILS ===============
CREATE TABLE public.psychologist_details (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hpcsa_number TEXT,
  category TEXT,
  organisation TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.psychologist_details TO anon, authenticated;
GRANT INSERT, UPDATE ON public.psychologist_details TO authenticated;
GRANT ALL ON public.psychologist_details TO service_role;
ALTER TABLE public.psychologist_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psych_public_read" ON public.psychologist_details FOR SELECT USING (true);
CREATE POLICY "psych_self_upsert" ON public.psychologist_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "psych_self_update" ON public.psychologist_details FOR UPDATE USING (auth.uid() = user_id);

-- attach trigger AFTER psychologist_details exists
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============== ORGANISATIONS ===============
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  contact_email TEXT,
  province public.province,
  city TEXT,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  categories TEXT[] NOT NULL DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.organisations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organisations TO authenticated;
GRANT ALL ON public.organisations TO service_role;
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orgs_public_read" ON public.organisations FOR SELECT USING (true);
CREATE POLICY "orgs_creator_insert" ON public.organisations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "orgs_creator_update" ON public.organisations FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orgs_creator_delete" ON public.organisations FOR DELETE USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_orgs_updated BEFORE UPDATE ON public.organisations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== OPPORTUNITIES ===============
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  commitment TEXT,
  hours_per_week INT,
  opp_type public.opportunity_type NOT NULL DEFAULT 'in_person',
  requirements TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opp_public_read" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "opp_creator_insert" ON public.opportunities FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "opp_creator_update" ON public.opportunities FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "opp_creator_delete" ON public.opportunities FOR DELETE USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_opp_updated BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_opp_org ON public.opportunities(org_id);
CREATE INDEX idx_opp_active ON public.opportunities(active);

-- =============== APPLICATIONS ===============
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'pending',
  cover_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (opportunity_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps_student_read" ON public.applications FOR SELECT USING (
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.created_by = auth.uid())
);
CREATE POLICY "apps_student_insert" ON public.applications FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "apps_owner_update" ON public.applications FOR UPDATE USING (
  auth.uid() = student_id OR
  EXISTS (SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.created_by = auth.uid())
);
CREATE POLICY "apps_student_delete" ON public.applications FOR DELETE USING (auth.uid() = student_id);
CREATE TRIGGER trg_apps_updated BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============== SAVED_OPPORTUNITIES ===============
CREATE TABLE public.saved_opportunities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, opportunity_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_opportunities TO authenticated;
GRANT ALL ON public.saved_opportunities TO service_role;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_self" ON public.saved_opportunities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============== EXPERIENCES ===============
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  categories TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.experiences TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.experiences TO authenticated;
GRANT ALL ON public.experiences TO service_role;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exp_public_read" ON public.experiences FOR SELECT USING (true);
CREATE POLICY "exp_author_insert" ON public.experiences FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "exp_author_update" ON public.experiences FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "exp_author_delete" ON public.experiences FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_exp_updated BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.experience_reactions (
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('like','helpful','save')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (experience_id, user_id, kind)
);
GRANT SELECT ON public.experience_reactions TO anon, authenticated;
GRANT INSERT, DELETE ON public.experience_reactions TO authenticated;
GRANT ALL ON public.experience_reactions TO service_role;
ALTER TABLE public.experience_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions_public_read" ON public.experience_reactions FOR SELECT USING (true);
CREATE POLICY "reactions_self_write" ON public.experience_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_self_delete" ON public.experience_reactions FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.experience_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.experience_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.experience_comments TO authenticated;
GRANT ALL ON public.experience_comments TO service_role;
ALTER TABLE public.experience_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read" ON public.experience_comments FOR SELECT USING (true);
CREATE POLICY "comments_author_insert" ON public.experience_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_author_update" ON public.experience_comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "comments_author_delete" ON public.experience_comments FOR DELETE USING (auth.uid() = author_id);

-- =============== VOLUNTEER_HOURS ===============
CREATE TABLE public.volunteer_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  org_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  hours NUMERIC(6,2) NOT NULL CHECK (hours > 0),
  description TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_hours TO authenticated;
GRANT ALL ON public.volunteer_hours TO service_role;
ALTER TABLE public.volunteer_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours_owner_read" ON public.volunteer_hours FOR SELECT USING (
  auth.uid() = user_id OR
  (org_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = org_id AND o.created_by = auth.uid()))
);
CREATE POLICY "hours_owner_insert" ON public.volunteer_hours FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "hours_owner_update" ON public.volunteer_hours FOR UPDATE USING (
  auth.uid() = user_id OR
  (org_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = org_id AND o.created_by = auth.uid()))
);
CREATE POLICY "hours_owner_delete" ON public.volunteer_hours FOR DELETE USING (auth.uid() = user_id);

-- =============== CERTIFICATES ===============
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  hours NUMERIC(6,2),
  issued_at DATE NOT NULL DEFAULT CURRENT_DATE,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certs_owner_read" ON public.certificates FOR SELECT USING (
  auth.uid() = user_id OR
  (org_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = org_id AND o.created_by = auth.uid()))
);
CREATE POLICY "certs_org_insert" ON public.certificates FOR INSERT WITH CHECK (
  org_id IS NULL OR EXISTS (SELECT 1 FROM public.organisations o WHERE o.id = org_id AND o.created_by = auth.uid())
);

-- =============== FORUM ===============
CREATE TABLE public.forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.forum_category NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_threads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_threads TO authenticated;
GRANT ALL ON public.forum_threads TO service_role;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads_public_read" ON public.forum_threads FOR SELECT USING (true);
CREATE POLICY "threads_author_insert" ON public.forum_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "threads_author_update" ON public.forum_threads FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "threads_author_delete" ON public.forum_threads FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_threads_updated BEFORE UPDATE ON public.forum_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.forum_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.forum_posts TO authenticated;
GRANT ALL ON public.forum_posts TO service_role;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_public_read" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "posts_author_insert" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_author_update" ON public.forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_author_delete" ON public.forum_posts FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin'));

-- =============== EVENTS ===============
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  host TEXT,
  location TEXT,
  province public.province,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_creator_insert" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "events_creator_update" ON public.events FOR UPDATE USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "events_creator_delete" ON public.events FOR DELETE USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.event_rsvps (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.event_rsvps TO authenticated;
GRANT ALL ON public.event_rsvps TO service_role;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvp_self" ON public.event_rsvps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============== NOTIFICATIONS ===============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  href TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_self" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============== CHAT (PsychBot) ===============
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New chat',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_self" ON public.chat_conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_conv_updated BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "msg_self" ON public.chat_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_msg_conv ON public.chat_messages(conversation_id);
