-- =============================================
-- PREFECT MANAGEMENT SYSTEM - DEVELOPMENT SEEDS
-- Run after the base schema migrations and after 08-prefect.sql
-- =============================================

create extension if not exists pgcrypto;

-- Fixed IDs used by temporary bypass accounts and sample relational data
-- admin@gmail.com / admin123
-- staff@gmail.com / staff123

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'admin@gmail.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Admin","last_name":"User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'staff@gmail.com',
    crypt('staff123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Staff","last_name":"User"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'prefect@gmail.com',
    crypt('prefect123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Paula","last_name":"Prefect"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'student@gmail.com',
    crypt('student123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"first_name":"Sam","last_name":"Student"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'aaaaaaa1-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111111',
    format('{"sub":"%s","email":"%s"}', '11111111-1111-4111-8111-111111111111', 'admin@gmail.com')::jsonb,
    'email',
    'admin@gmail.com',
    now(),
    now(),
    now()
  ),
  (
    'bbbbbbb2-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222222',
    format('{"sub":"%s","email":"%s"}', '22222222-2222-4222-8222-222222222222', 'staff@gmail.com')::jsonb,
    'email',
    'staff@gmail.com',
    now(),
    now(),
    now()
  ),
  (
    'ccccccc3-3333-4333-8333-333333333333',
    '33333333-3333-4333-8333-333333333333',
    format('{"sub":"%s","email":"%s"}', '33333333-3333-4333-8333-333333333333', 'prefect@gmail.com')::jsonb,
    'email',
    'prefect@gmail.com',
    now(),
    now(),
    now()
  ),
  (
    'ddddddd4-4444-4444-8444-444444444444',
    '44444444-4444-4444-8444-444444444444',
    format('{"sub":"%s","email":"%s"}', '44444444-4444-4444-8444-444444444444', 'student@gmail.com')::jsonb,
    'email',
    'student@gmail.com',
    now(),
    now(),
    now()
  )
on conflict (provider, provider_id) do update
set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, student_id, first_name, last_name, email, phone, department, year_level, section, avatar_url)
values
  ('11111111-1111-4111-8111-111111111111', 'A-2026-0001', 'Admin', 'User', 'admin@gmail.com', '09170000001', 'Administration', null, null, null),
  ('22222222-2222-4222-8222-222222222222', 'F-2026-0001', 'Staff', 'User', 'staff@gmail.com', '09170000002', 'Guidance Office', null, null, null),
  ('33333333-3333-4333-8333-333333333333', 'P-2026-0001', 'Paula', 'Prefect', 'prefect@gmail.com', '09170000003', 'Student Affairs', 2, 'BSCPE-2A', null),
  ('44444444-4444-4444-8444-444444444444', 'S-2026-0001', 'Sam', 'Student', 'student@gmail.com', '09170000004', 'BSIT', 1, 'BSIT-1A', null)
on conflict (id) do update
set
  student_id = excluded.student_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  phone = excluded.phone,
  department = excluded.department,
  year_level = excluded.year_level,
  section = excluded.section,
  updated_at = now();

insert into public.user_roles (user_id, role, assigned_by)
values
  ('11111111-1111-4111-8111-111111111111', 'admin', '11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222', 'faculty', '11111111-1111-4111-8111-111111111111'),
  ('33333333-3333-4333-8333-333333333333', 'prefect', '11111111-1111-4111-8111-111111111111'),
  ('44444444-4444-4444-8444-444444444444', 'student', '11111111-1111-4111-8111-111111111111')
on conflict (user_id, role) do nothing;

insert into public.departments (id, name, code, description)
values
  ('50000000-0000-4000-8000-000000000001', 'Administration', 'ADMIN', 'System administration and operations'),
  ('50000000-0000-4000-8000-000000000002', 'Guidance Office', 'GUIDE', 'Guidance and student support'),
  ('50000000-0000-4000-8000-000000000003', 'Student Affairs', 'PREF', 'Prefect and discipline operations'),
  ('50000000-0000-4000-8000-000000000004', 'BSIT', 'BSIT', 'Bachelor of Science in Information Technology')
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description;

insert into public.academic_years (id, year_start, year_end, semester, is_current)
values
  ('60000000-0000-4000-8000-000000000001', 2025, 2026, '2nd Semester', true)
on conflict (year_start, year_end, semester) do update
set
  is_current = excluded.is_current;

insert into public.training_categories (id, name, description)
values
  ('70000000-0000-4000-8000-000000000001', 'Policies', 'School rules, discipline code, and prefect procedures'),
  ('70000000-0000-4000-8000-000000000002', 'Operations', 'Duty workflow and reporting operations')
on conflict (name) do update
set
  description = excluded.description;

insert into public.training_materials (id, category_id, title, content, created_by, is_published)
values
  (
    '71000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000001',
    'Prefect Code of Conduct',
    'Maintain professionalism, accurate reporting, and respectful intervention in all student-facing duties.',
    '11111111-1111-4111-8111-111111111111',
    true
  ),
  (
    '71000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000002',
    'Daily Duty Handover Guide',
    'Review the assigned post, confirm attendance, log notable activity, and submit reports before end of shift.',
    '11111111-1111-4111-8111-111111111111',
    true
  )
on conflict (id) do update
set
  category_id = excluded.category_id,
  title = excluded.title,
  content = excluded.content,
  is_published = excluded.is_published,
  updated_at = now();

insert into public.complaints (id, submitted_by, subject, description, status, assigned_to, resolved_at)
values
  (
    '80000000-0000-4000-8000-000000000001',
    '44444444-4444-4444-8444-444444444444',
    'Noise disturbance during study period',
    'Several students were making excessive noise near Room 204 during the afternoon study period.',
    'pending',
    '11111111-1111-4111-8111-111111111111',
    null
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '44444444-4444-4444-8444-444444444444',
    'Queue management concern',
    'Crowding near the registrar window needs better queue control during lunch break.',
    'in_progress',
    '22222222-2222-4222-8222-222222222222',
    null
  )
on conflict (id) do update
set
  subject = excluded.subject,
  description = excluded.description,
  status = excluded.status,
  assigned_to = excluded.assigned_to,
  updated_at = now();

insert into public.complaint_messages (id, complaint_id, sender_id, message)
values
  (
    '81000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'We have acknowledged this report and assigned it for review.'
  )
on conflict (id) do update
set
  message = excluded.message;

insert into public.complaint_messages (id, complaint_id, sender_id, message)
values
  (
    '81000000-0000-4000-8000-000000000002',
    '80000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'Queue marshals have been advised to maintain a single-line flow during peak hours.'
  ),
  (
    '81000000-0000-4000-8000-000000000003',
    '80000000-0000-4000-8000-000000000002',
    '44444444-4444-4444-8444-444444444444',
    'Thank you. The area looked much better after 1 PM.'
  )
on conflict (id) do update
set
  message = excluded.message;

insert into public.complaints (id, submitted_by, subject, description, status, assigned_to, resolved_at)
values
  (
    '80000000-0000-4000-8000-000000000003',
    '33333333-3333-4333-8333-333333333333',
    'Lost-and-found process issue',
    'Items recovered after class hours were not turned over to the front desk promptly.',
    'resolved',
    '22222222-2222-4222-8222-222222222222',
    now() - interval '6 hour'
  )
on conflict (id) do update
set
  subject = excluded.subject,
  description = excluded.description,
  status = excluded.status,
  assigned_to = excluded.assigned_to,
  resolved_at = excluded.resolved_at,
  updated_at = now();

insert into public.incident_reports (id, reported_by, title, description, severity, location, incident_date, is_resolved, resolved_by, resolved_at)
values
  (
    '82000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    'Hallway altercation',
    'A brief verbal altercation occurred between two students near the east hallway and required intervention.',
    'high',
    'East Hallway',
    now() - interval '2 day',
    false,
    null,
    null
  ),
  (
    '82000000-0000-4000-8000-000000000002',
    '33333333-3333-4333-8333-333333333333',
    'Unattended bag at lobby',
    'An unattended bag was reported at the main lobby and security was informed immediately.',
    'medium',
    'Main Lobby',
    now() - interval '1 day',
    true,
    '11111111-1111-4111-8111-111111111111',
    now() - interval '1 day'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  severity = excluded.severity,
  location = excluded.location,
  is_resolved = excluded.is_resolved,
  resolved_by = excluded.resolved_by,
  resolved_at = excluded.resolved_at,
  updated_at = now();

insert into public.incident_reports (id, reported_by, title, description, severity, location, incident_date, is_resolved, resolved_by, resolved_at)
values
  (
    '82000000-0000-4000-8000-000000000003',
    '33333333-3333-4333-8333-333333333333',
    'Clinic referral follow-up',
    'A student felt dizzy during the morning flag ceremony and was escorted to the clinic.',
    'low',
    'Quadrangle',
    now() - interval '4 day',
    true,
    '22222222-2222-4222-8222-222222222222',
    now() - interval '4 day'
  ),
  (
    '82000000-0000-4000-8000-000000000004',
    '33333333-3333-4333-8333-333333333333',
    'Repeated corridor pushing',
    'Several students were running and pushing each other near the second floor corridor.',
    'critical',
    'Second Floor Corridor',
    now() - interval '3 hour',
    false,
    null,
    null
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  severity = excluded.severity,
  location = excluded.location,
  is_resolved = excluded.is_resolved,
  resolved_by = excluded.resolved_by,
  resolved_at = excluded.resolved_at,
  updated_at = now();

insert into public.prefect_applications (id, applicant_id, academic_year_id, statement, gpa, status, reviewed_by, review_notes)
values
  (
    '83000000-0000-4000-8000-000000000001',
    '44444444-4444-4444-8444-444444444444',
    '60000000-0000-4000-8000-000000000001',
    'I want to contribute to campus discipline, support student order, and build leadership experience.',
    1.75,
    'under_review',
    '22222222-2222-4222-8222-222222222222',
    'Applicant shows strong interest and good standing.'
  )
on conflict (id) do update
set
  statement = excluded.statement,
  gpa = excluded.gpa,
  status = excluded.status,
  reviewed_by = excluded.reviewed_by,
  review_notes = excluded.review_notes,
  updated_at = now();

insert into public.prefect_applications (id, applicant_id, academic_year_id, statement, gpa, status, reviewed_by, review_notes)
values
  (
    '83000000-0000-4000-8000-000000000002',
    '33333333-3333-4333-8333-333333333333',
    '60000000-0000-4000-8000-000000000001',
    'I want to mentor new applicants and help maintain order during school events.',
    1.50,
    'approved',
    '11111111-1111-4111-8111-111111111111',
    'Approved for leadership potential and strong prior participation.'
  )
on conflict (id) do update
set
  statement = excluded.statement,
  gpa = excluded.gpa,
  status = excluded.status,
  reviewed_by = excluded.reviewed_by,
  review_notes = excluded.review_notes,
  updated_at = now();

insert into public.duty_assignments (id, prefect_id, title, description, duty_date, start_time, end_time, location, status, assigned_by)
values
  (
    '84000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    'Morning Gate Monitoring',
    'Monitor student flow and uniform compliance at the main gate.',
    current_date,
    '07:00',
    '09:00',
    'Main Gate',
    'assigned',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '84000000-0000-4000-8000-000000000002',
    '33333333-3333-4333-8333-333333333333',
    'Library Floor Patrol',
    'Support quiet-study enforcement at the library corridor.',
    current_date + 1,
    '13:00',
    '15:00',
    'Library Corridor',
    'assigned',
    '11111111-1111-4111-8111-111111111111'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  duty_date = excluded.duty_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  location = excluded.location,
  status = excluded.status,
  updated_at = now();

insert into public.duty_assignments (id, prefect_id, title, description, duty_date, start_time, end_time, location, status, assigned_by)
values
  (
    '84000000-0000-4000-8000-000000000003',
    '33333333-3333-4333-8333-333333333333',
    'Lunch Break Hallway Watch',
    'Oversee line discipline and hallway movement during lunch break.',
    current_date - 1,
    '11:30',
    '13:00',
    'Main Hallway',
    'completed',
    '22222222-2222-4222-8222-222222222222'
  ),
  (
    '84000000-0000-4000-8000-000000000004',
    '33333333-3333-4333-8333-333333333333',
    'Seminar Support Team',
    'Provide floor support for the campus safety seminar.',
    current_date + 5,
    '13:30',
    '16:30',
    'Multi-Purpose Hall',
    'assigned',
    '11111111-1111-4111-8111-111111111111'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  duty_date = excluded.duty_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  location = excluded.location,
  status = excluded.status,
  updated_at = now();

insert into public.gate_assistance_logs (id, prefect_id, log_date, time_in, time_out, notes)
values
  (
    '85000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    current_date - 1,
    '07:05',
    '09:02',
    'Assisted in directing student queues and checked IDs.'
  )
on conflict (id) do update
set
  log_date = excluded.log_date,
  time_in = excluded.time_in,
  time_out = excluded.time_out,
  notes = excluded.notes;

insert into public.gate_assistance_logs (id, prefect_id, log_date, time_in, time_out, notes)
values
  (
    '85000000-0000-4000-8000-000000000002',
    '33333333-3333-4333-8333-333333333333',
    current_date - 2,
    '06:58',
    '09:10',
    'Handled late-pass verification and redirected visitors to the proper lane.'
  ),
  (
    '85000000-0000-4000-8000-000000000003',
    '33333333-3333-4333-8333-333333333333',
    current_date - 5,
    '07:01',
    '08:55',
    'Monitored entry volume and coordinated with security during rain.'
  )
on conflict (id) do update
set
  log_date = excluded.log_date,
  time_in = excluded.time_in,
  time_out = excluded.time_out,
  notes = excluded.notes;

insert into public.weekly_reports (id, prefect_id, week_start, week_end, summary, achievements, challenges)
values
  (
    '86000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    current_date - 7,
    current_date - 1,
    'Handled gate coverage, supported hallway discipline checks, and coordinated with faculty on two reports.',
    'Improved gate line flow during peak hours.',
    'Need faster escalation path for repeat disturbance cases.'
  )
on conflict (id) do update
set
  week_start = excluded.week_start,
  week_end = excluded.week_end,
  summary = excluded.summary,
  achievements = excluded.achievements,
  challenges = excluded.challenges;

insert into public.weekly_reports (id, prefect_id, week_start, week_end, summary, achievements, challenges)
values
  (
    '86000000-0000-4000-8000-000000000002',
    '33333333-3333-4333-8333-333333333333',
    current_date - 14,
    current_date - 8,
    'Supported event deployment, monitored hallway movement, and helped document one clinic referral case.',
    'Improved incident handoff time with the guidance desk.',
    'Need better weather contingency instructions for gate coverage.'
  )
on conflict (id) do update
set
  week_start = excluded.week_start,
  week_end = excluded.week_end,
  summary = excluded.summary,
  achievements = excluded.achievements,
  challenges = excluded.challenges;

insert into public.performance_evaluations (id, prefect_id, evaluator_id, academic_year_id, rating, comments)
values
  (
    '87000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    '22222222-2222-4222-8222-222222222222',
    '60000000-0000-4000-8000-000000000001',
    4,
    'Shows initiative during gate duty and keeps reports clear and timely.'
  )
on conflict (id) do update
set
  evaluator_id = excluded.evaluator_id,
  academic_year_id = excluded.academic_year_id,
  rating = excluded.rating,
  comments = excluded.comments;

insert into public.performance_evaluations (id, prefect_id, evaluator_id, academic_year_id, rating, comments)
values
  (
    '87000000-0000-4000-8000-000000000002',
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    '60000000-0000-4000-8000-000000000001',
    5,
    'Excellent incident documentation and dependable event support.'
  )
on conflict (id) do update
set
  evaluator_id = excluded.evaluator_id,
  academic_year_id = excluded.academic_year_id,
  rating = excluded.rating,
  comments = excluded.comments;

insert into public.events (id, title, description, event_date, start_time, end_time, location, created_by)
values
  (
    '88000000-0000-4000-8000-000000000001',
    'Campus Leadership Assembly',
    'Leadership briefing for student officers and prefect members.',
    current_date + 2,
    '10:00',
    '12:00',
    'Auditorium',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '88000000-0000-4000-8000-000000000002',
    'Safety Awareness Seminar',
    'Coordination event with clinic and student affairs on campus safety.',
    current_date + 5,
    '14:00',
    '16:00',
    'Multi-Purpose Hall',
    '11111111-1111-4111-8111-111111111111'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  event_date = excluded.event_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  location = excluded.location,
  updated_at = now();

insert into public.events (id, title, description, event_date, start_time, end_time, location, created_by)
values
  (
    '88000000-0000-4000-8000-000000000003',
    'Orientation Marshal Briefing',
    'Briefing session for prefect deployment before student orientation.',
    current_date - 2,
    '09:00',
    '10:30',
    'Conference Room',
    '22222222-2222-4222-8222-222222222222'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  event_date = excluded.event_date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  location = excluded.location,
  updated_at = now();

insert into public.event_assignments (id, event_id, prefect_id, role_in_event)
values
  (
    '89000000-0000-4000-8000-000000000001',
    '88000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    'Floor Coordinator'
  )
on conflict (event_id, prefect_id) do update
set
  role_in_event = excluded.role_in_event;

insert into public.event_assignments (id, event_id, prefect_id, role_in_event)
values
  (
    '89000000-0000-4000-8000-000000000002',
    '88000000-0000-4000-8000-000000000002',
    '33333333-3333-4333-8333-333333333333',
    'Audience Flow Lead'
  )
on conflict (event_id, prefect_id) do update
set
  role_in_event = excluded.role_in_event;

insert into public.attendance (id, prefect_id, date, time_in, time_out, status, notes)
values
  (
    '8a000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    current_date - 1,
    now() - interval '1 day' + interval '7 hour',
    now() - interval '1 day' + interval '15 hour',
    'present',
    'Completed full shift and briefing.'
  )
on conflict (prefect_id, date) do update
set
  time_in = excluded.time_in,
  time_out = excluded.time_out,
  status = excluded.status,
  notes = excluded.notes;

insert into public.attendance (id, prefect_id, date, time_in, time_out, status, notes)
values
  (
    '8a000000-0000-4000-8000-000000000002',
    '33333333-3333-4333-8333-333333333333',
    current_date - 2,
    now() - interval '2 day' + interval '7 hour 20 minutes',
    now() - interval '2 day' + interval '15 hour',
    'late',
    'Reported after rain-related delay at the gate.'
  ),
  (
    '8a000000-0000-4000-8000-000000000003',
    '33333333-3333-4333-8333-333333333333',
    current_date - 3,
    null,
    null,
    'absent',
    'Excused for academic competition participation.'
  )
on conflict (prefect_id, date) do update
set
  time_in = excluded.time_in,
  time_out = excluded.time_out,
  status = excluded.status,
  notes = excluded.notes;

insert into public.conversations (id, created_by, title, description, type, is_active)
values
  (
    '8b000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'Student Support Channel',
    'Coordination thread for complaint and discipline follow-up.',
    'group',
    true
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  type = excluded.type,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.conversations (id, created_by, title, description, type, is_active)
values
  (
    '8b000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Event Operations Desk',
    'Coordination for prefect assignments during events and assemblies.',
    'group',
    true
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  type = excluded.type,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.conversation_participants (id, conversation_id, participant_id)
values
  ('8c000000-0000-4000-8000-000000000001', '8b000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222'),
  ('8c000000-0000-4000-8000-000000000002', '8b000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333'),
  ('8c000000-0000-4000-8000-000000000003', '8b000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444'),
  ('8c000000-0000-4000-8000-000000000004', '8b000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111'),
  ('8c000000-0000-4000-8000-000000000005', '8b000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222'),
  ('8c000000-0000-4000-8000-000000000006', '8b000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333')
on conflict (id) do nothing;

insert into public.conversation_messages (id, conversation_id, sender_id, message)
values
  (
    '8d000000-0000-4000-8000-000000000001',
    '8b000000-0000-4000-8000-000000000001',
    '22222222-2222-4222-8222-222222222222',
    'Please submit any incident observations here before 5 PM.'
  ),
  (
    '8d000000-0000-4000-8000-000000000002',
    '8b000000-0000-4000-8000-000000000001',
    '33333333-3333-4333-8333-333333333333',
    'Morning gate activity has been logged. One disturbance report is under review.'
  ),
  (
    '8d000000-0000-4000-8000-000000000003',
    '8b000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Please confirm prefect deployment for the safety awareness seminar.'
  ),
  (
    '8d000000-0000-4000-8000-000000000004',
    '8b000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'Guidance desk is ready to receive the final duty roster by noon.'
  )
on conflict (id) do update
set
  message = excluded.message,
  updated_at = now();

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'prefect' and table_name = 'department_flow_profiles'
  ) then
    begin
      insert into prefect.department_flow_profiles (
        department_key,
        department_name,
        flow_order,
        clearance_stage_order,
        receives,
        sends,
        notes
      )
      values (
        'prefect',
        'Prefect',
        5,
        5,
        '["registrar"]'::jsonb,
        '["registrar","guidance","clinic","pmed"]'::jsonb,
        'Prefect discipline and clearance routing profile for registrar integration.'
      )
      on conflict (department_key) do update
      set
        department_name = excluded.department_name,
        flow_order = excluded.flow_order,
        clearance_stage_order = excluded.clearance_stage_order,
        receives = excluded.receives,
        sends = excluded.sends,
        notes = excluded.notes,
        updated_at = now();
    exception
      when others then
        null;
    end;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'prefect' and table_name = 'department_clearance_records'
  ) then
    begin
      insert into prefect.department_clearance_records (
        id,
        department_key,
        department_name,
        patient_name,
        patient_type,
        clearance_reference,
        external_reference,
        stage_order,
        status,
        approver_name,
        approver_role,
        remarks,
        requested_by,
        metadata
      )
      values
        (
          1001,
          'prefect',
          'Prefect',
          'Sam Student',
          'student',
          'CLR-2026-0001',
          'REG-2026-0101',
          5,
          'pending',
          null,
          null,
          'Awaiting prefect discipline review.',
          'Registrar Office',
          '{"source":"seed","destination":"registrar","disciplineStatus":"for-review"}'::jsonb
        ),
        (
          1002,
          'prefect',
          'Prefect',
          'Paula Prefect',
          'prefect',
          'CLR-2026-0002',
          'GUIDE-2026-0033',
          5,
          'approved',
          'Admin User',
          'Administrator',
          'No pending discipline record.',
          'Guidance Office',
          '{"source":"seed","destination":"guidance","disciplineStatus":"cleared"}'::jsonb
        ),
        (
          1003,
          'prefect',
          'Prefect',
          'Sam Student',
          'student',
          'CLR-2026-0003',
          'CLINIC-2026-0014',
          5,
          'flagged',
          'Staff User',
          'Guidance Staff',
          'Linked to an unresolved incident requiring follow-up.',
          'Clinic Office',
          '{"source":"seed","destination":"clinic","disciplineStatus":"needs-follow-up"}'::jsonb
        )
      on conflict (id) do update
      set
        department_key = excluded.department_key,
        department_name = excluded.department_name,
        patient_name = excluded.patient_name,
        patient_type = excluded.patient_type,
        clearance_reference = excluded.clearance_reference,
        external_reference = excluded.external_reference,
        stage_order = excluded.stage_order,
        status = excluded.status,
        approver_name = excluded.approver_name,
        approver_role = excluded.approver_role,
        remarks = excluded.remarks,
        requested_by = excluded.requested_by,
        metadata = excluded.metadata,
        updated_at = now();
    exception
      when others then
        null;
    end;
  end if;

  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'clinic' and table_name = 'department_flow_profiles'
  ) then
    begin
      insert into clinic.department_flow_profiles (
        department_key,
        department_name,
        flow_order,
        clearance_stage_order,
        receives,
        sends,
        notes
      )
      values (
        'prefect',
        'Prefect',
        5,
        5,
        '["guidance"]'::jsonb,
        '["comlab"]'::jsonb,
        'Discipline clearance.'
      )
      on conflict (department_key) do update
      set
        department_name = excluded.department_name,
        flow_order = excluded.flow_order,
        clearance_stage_order = excluded.clearance_stage_order,
        receives = excluded.receives,
        sends = excluded.sends,
        notes = excluded.notes,
        updated_at = now();
    exception
      when others then
        null;
    end;
  end if;
end $$;
