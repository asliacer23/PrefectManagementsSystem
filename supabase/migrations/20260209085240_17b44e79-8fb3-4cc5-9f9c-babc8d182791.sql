
-- Fix all RLS policies to be PERMISSIVE instead of RESTRICTIVE
-- Drop and recreate all policies as PERMISSIVE

-- PROFILES
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- USER ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DEPARTMENTS
DROP POLICY IF EXISTS "Anyone can view departments" ON public.departments;
DROP POLICY IF EXISTS "Admin can manage departments" ON public.departments;

CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert departments" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update departments" ON public.departments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete departments" ON public.departments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ACADEMIC YEARS
DROP POLICY IF EXISTS "Anyone can view academic years" ON public.academic_years;
DROP POLICY IF EXISTS "Admin can manage academic years" ON public.academic_years;

CREATE POLICY "Anyone can view academic years" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert academic years" ON public.academic_years FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update academic years" ON public.academic_years FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete academic years" ON public.academic_years FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TRAINING CATEGORIES
DROP POLICY IF EXISTS "Anyone can view training categories" ON public.training_categories;
DROP POLICY IF EXISTS "Admin can manage training categories" ON public.training_categories;

CREATE POLICY "Anyone can view training categories" ON public.training_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert training categories" ON public.training_categories FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update training categories" ON public.training_categories FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete training categories" ON public.training_categories FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TRAINING MATERIALS
DROP POLICY IF EXISTS "Anyone can view published training" ON public.training_materials;
DROP POLICY IF EXISTS "Admin can manage training" ON public.training_materials;

CREATE POLICY "Anyone can view published training" ON public.training_materials FOR SELECT TO authenticated USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert training" ON public.training_materials FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update training" ON public.training_materials FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete training" ON public.training_materials FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COMPLAINTS
DROP POLICY IF EXISTS "Users can view own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Users can create complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admin can manage complaints" ON public.complaints;

CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT TO authenticated USING (submitted_by = auth.uid() OR assigned_to = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Admin can update complaints" ON public.complaints FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete complaints" ON public.complaints FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- COMPLAINT MESSAGES
DROP POLICY IF EXISTS "Users can view messages for their complaints" ON public.complaint_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.complaint_messages;

CREATE POLICY "Users can view messages for their complaints" ON public.complaint_messages FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR
  EXISTS (SELECT 1 FROM public.complaints WHERE id = complaint_id AND (submitted_by = auth.uid() OR assigned_to = auth.uid()))
);
CREATE POLICY "Users can send messages" ON public.complaint_messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- INCIDENT REPORTS
DROP POLICY IF EXISTS "View incident reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Create incident reports" ON public.incident_reports;
DROP POLICY IF EXISTS "Admin manage incidents" ON public.incident_reports;

CREATE POLICY "View incident reports" ON public.incident_reports FOR SELECT TO authenticated USING (
  reported_by = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'prefect')
);
CREATE POLICY "Create incident reports" ON public.incident_reports FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());
CREATE POLICY "Admin update incidents" ON public.incident_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete incidents" ON public.incident_reports FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PREFECT APPLICATIONS
DROP POLICY IF EXISTS "View own applications" ON public.prefect_applications;
DROP POLICY IF EXISTS "Students can apply" ON public.prefect_applications;
DROP POLICY IF EXISTS "Admin manage applications" ON public.prefect_applications;

CREATE POLICY "View own applications" ON public.prefect_applications FOR SELECT TO authenticated USING (
  applicant_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Students can apply" ON public.prefect_applications FOR INSERT TO authenticated WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "Admin update applications" ON public.prefect_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete applications" ON public.prefect_applications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DUTY ASSIGNMENTS
DROP POLICY IF EXISTS "View duty assignments" ON public.duty_assignments;
DROP POLICY IF EXISTS "Admin manage duties" ON public.duty_assignments;

CREATE POLICY "View duty assignments" ON public.duty_assignments FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Admin insert duties" ON public.duty_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update duties" ON public.duty_assignments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete duties" ON public.duty_assignments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- DUTY REPORTS
DROP POLICY IF EXISTS "View duty reports" ON public.duty_reports;
DROP POLICY IF EXISTS "Prefects can create reports" ON public.duty_reports;

CREATE POLICY "View duty reports" ON public.duty_reports FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Prefects can create reports" ON public.duty_reports FOR INSERT TO authenticated WITH CHECK (prefect_id = auth.uid());

-- GATE ASSISTANCE LOGS
DROP POLICY IF EXISTS "View gate logs" ON public.gate_assistance_logs;
DROP POLICY IF EXISTS "Prefects log gate assistance" ON public.gate_assistance_logs;

CREATE POLICY "View gate logs" ON public.gate_assistance_logs FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Prefects log gate assistance" ON public.gate_assistance_logs FOR INSERT TO authenticated WITH CHECK (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- WEEKLY REPORTS
DROP POLICY IF EXISTS "View weekly reports" ON public.weekly_reports;
DROP POLICY IF EXISTS "Prefects create weekly reports" ON public.weekly_reports;

CREATE POLICY "View weekly reports" ON public.weekly_reports FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Prefects create weekly reports" ON public.weekly_reports FOR INSERT TO authenticated WITH CHECK (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);

-- PERFORMANCE EVALUATIONS
DROP POLICY IF EXISTS "View evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Admin/faculty create evaluations" ON public.performance_evaluations;

CREATE POLICY "View evaluations" ON public.performance_evaluations FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR evaluator_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admin/faculty create evaluations" ON public.performance_evaluations FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);

-- EVENTS
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Admin manage events" ON public.events;

CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin insert events" ON public.events FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update events" ON public.events FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete events" ON public.events FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- EVENT ASSIGNMENTS
DROP POLICY IF EXISTS "View event assignments" ON public.event_assignments;
DROP POLICY IF EXISTS "Admin manage event assignments" ON public.event_assignments;

CREATE POLICY "View event assignments" ON public.event_assignments FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Admin insert event assignments" ON public.event_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin update event assignments" ON public.event_assignments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete event assignments" ON public.event_assignments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ATTENDANCE
DROP POLICY IF EXISTS "View attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admin manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Prefects log own attendance" ON public.attendance;

CREATE POLICY "View attendance" ON public.attendance FOR SELECT TO authenticated USING (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'faculty')
);
CREATE POLICY "Prefects log own attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (
  prefect_id = auth.uid() OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admin update attendance" ON public.attendance FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete attendance" ON public.attendance FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
