
-- =============================================
-- PREFECT MANAGEMENT SYSTEM - NORMALIZED SCHEMA
-- =============================================

-- 1. ENUM TYPES
CREATE TYPE public.app_role AS ENUM ('admin', 'prefect', 'faculty', 'student');
CREATE TYPE public.complaint_status AS ENUM ('pending', 'in_progress', 'resolved', 'dismissed');
CREATE TYPE public.application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');
CREATE TYPE public.duty_status AS ENUM ('assigned', 'completed', 'missed');
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- 2. PROFILES TABLE (1:1 with auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  year_level INT,
  section TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. USER ROLES TABLE (separate for RBAC security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- 4. DEPARTMENTS TABLE (2NF - remove transitive dependency)
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. ACADEMIC YEARS TABLE
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year_start INT NOT NULL,
  year_end INT NOT NULL,
  semester TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(year_start, year_end, semester)
);

-- 6. TRAINING CATEGORIES TABLE (3NF)
CREATE TABLE public.training_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TRAINING MATERIALS TABLE
CREATE TABLE public.training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.training_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. COMPLAINTS TABLE
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status complaint_status NOT NULL DEFAULT 'pending',
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. COMPLAINT MESSAGES TABLE (4NF - multi-valued dependency)
CREATE TABLE public.complaint_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. INCIDENT REPORTS TABLE
CREATE TABLE public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'low',
  location TEXT,
  incident_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. PREFECT APPLICATIONS TABLE
CREATE TABLE public.prefect_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES auth.users(id),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  statement TEXT NOT NULL,
  gpa NUMERIC(3,2),
  status application_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. DUTY ASSIGNMENTS TABLE
CREATE TABLE public.duty_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefect_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  duty_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  status duty_status NOT NULL DEFAULT 'assigned',
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. DUTY REPORTS TABLE
CREATE TABLE public.duty_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.duty_assignments(id) ON DELETE CASCADE,
  prefect_id UUID NOT NULL REFERENCES auth.users(id),
  report TEXT NOT NULL,
  issues_encountered TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. GATE ASSISTANCE LOGS TABLE
CREATE TABLE public.gate_assistance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefect_id UUID NOT NULL REFERENCES auth.users(id),
  log_date DATE NOT NULL,
  time_in TIME NOT NULL,
  time_out TIME,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. WEEKLY REPORTS TABLE
CREATE TABLE public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefect_id UUID NOT NULL REFERENCES auth.users(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  summary TEXT NOT NULL,
  achievements TEXT,
  challenges TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. PERFORMANCE EVALUATIONS TABLE
CREATE TABLE public.performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefect_id UUID NOT NULL REFERENCES auth.users(id),
  evaluator_id UUID NOT NULL REFERENCES auth.users(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. EVENTS TABLE
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. EVENT ASSIGNMENTS TABLE (4NF - junction table)
CREATE TABLE public.event_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  prefect_id UUID NOT NULL REFERENCES auth.users(id),
  role_in_event TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, prefect_id)
);

-- 19. ATTENDANCE TABLE
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefect_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(prefect_id, date)
);

-- =============================================
-- SECURITY DEFINER FUNCTION FOR RBAC
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email
  );
  -- Default role: student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_training_materials_updated_at BEFORE UPDATE ON public.training_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incident_reports_updated_at BEFORE UPDATE ON public.incident_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prefect_applications_updated_at BEFORE UPDATE ON public.prefect_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_duty_assignments_updated_at BEFORE UPDATE ON public.duty_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DEPARTMENTS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage departments" ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ACADEMIC YEARS
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view academic years" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage academic years" ON public.academic_years FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TRAINING CATEGORIES
ALTER TABLE public.training_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view training categories" ON public.training_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage training categories" ON public.training_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TRAINING MATERIALS
ALTER TABLE public.training_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published training" ON public.training_materials FOR SELECT TO authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can manage training" ON public.training_materials FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COMPLAINTS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT TO authenticated USING (submitted_by = auth.uid() OR assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Admin can manage complaints" ON public.complaints FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COMPLAINT MESSAGES
ALTER TABLE public.complaint_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages for their complaints" ON public.complaint_messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.complaints WHERE id = complaint_id AND (submitted_by = auth.uid() OR assigned_to = auth.uid()))
);
CREATE POLICY "Users can send messages" ON public.complaint_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- INCIDENT REPORTS
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View incident reports" ON public.incident_reports FOR SELECT TO authenticated USING (
  reported_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'prefect')
);
CREATE POLICY "Create incident reports" ON public.incident_reports FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
CREATE POLICY "Admin manage incidents" ON public.incident_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PREFECT APPLICATIONS
ALTER TABLE public.prefect_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own applications" ON public.prefect_applications FOR SELECT TO authenticated USING (
  applicant_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Students can apply" ON public.prefect_applications FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "Admin manage applications" ON public.prefect_applications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DUTY ASSIGNMENTS
ALTER TABLE public.duty_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View duty assignments" ON public.duty_assignments FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Admin manage duties" ON public.duty_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DUTY REPORTS
ALTER TABLE public.duty_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View duty reports" ON public.duty_reports FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Prefects can create reports" ON public.duty_reports FOR INSERT TO authenticated WITH CHECK (prefect_id = auth.uid());

-- GATE ASSISTANCE LOGS
ALTER TABLE public.gate_assistance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View gate logs" ON public.gate_assistance_logs FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Prefects log gate assistance" ON public.gate_assistance_logs FOR INSERT TO authenticated WITH CHECK (prefect_id = auth.uid());

-- WEEKLY REPORTS
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View weekly reports" ON public.weekly_reports FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Prefects create weekly reports" ON public.weekly_reports FOR INSERT TO authenticated WITH CHECK (prefect_id = auth.uid());

-- PERFORMANCE EVALUATIONS
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View evaluations" ON public.performance_evaluations FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR evaluator_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admin/faculty create evaluations" ON public.performance_evaluations FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);

-- EVENTS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EVENT ASSIGNMENTS
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View event assignments" ON public.event_assignments FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Admin manage event assignments" ON public.event_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ATTENDANCE
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View attendance" ON public.attendance FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Admin manage attendance" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Prefects log own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (prefect_id = auth.uid());
