import { supabase } from '@/integrations/supabase/client';

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const FACULTY_ID = '22222222-2222-4222-8222-222222222222';
const PREFECT_ID = '33333333-3333-4333-8333-333333333333';
const STUDENT_ID = '44444444-4444-4444-8444-444444444444';
const ACADEMIC_YEAR_ID = '60000000-0000-4000-8000-000000000001';

function toDate(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  return date.toISOString().split('T')[0];
}

async function ensureCoreSeedData() {
  const { error: profilesError } = await supabase.from('profiles').upsert(
    [
      {
        id: ADMIN_ID,
        student_id: 'A-2026-0001',
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@gmail.com',
        phone: '09170000001',
        department: 'Administration',
      },
      {
        id: FACULTY_ID,
        student_id: 'F-2026-0001',
        first_name: 'Staff',
        last_name: 'User',
        email: 'staff@gmail.com',
        phone: '09170000002',
        department: 'Guidance Office',
      },
      {
        id: PREFECT_ID,
        student_id: 'P-2026-0001',
        first_name: 'Paula',
        last_name: 'Prefect',
        email: 'prefect@gmail.com',
        phone: '09170000003',
        department: 'Student Affairs',
        year_level: 2,
        section: 'BSCPE-2A',
      },
      {
        id: STUDENT_ID,
        student_id: 'S-2026-0001',
        first_name: 'Sam',
        last_name: 'Student',
        email: 'student@gmail.com',
        phone: '09170000004',
        department: 'BSIT',
        year_level: 1,
        section: 'BSIT-1A',
      },
    ],
    { onConflict: 'id' },
  );

  if (profilesError) throw new Error(profilesError.message || 'Failed to seed profiles');

  const { error: rolesError } = await supabase.from('user_roles').upsert(
    [
      { user_id: ADMIN_ID, role: 'admin', assigned_by: ADMIN_ID },
      { user_id: FACULTY_ID, role: 'faculty', assigned_by: ADMIN_ID },
      { user_id: PREFECT_ID, role: 'prefect', assigned_by: ADMIN_ID },
      { user_id: STUDENT_ID, role: 'student', assigned_by: ADMIN_ID },
    ],
    { onConflict: 'user_id,role' },
  );

  if (rolesError) throw new Error(rolesError.message || 'Failed to seed roles');

  const { error: academicYearError } = await supabase.from('academic_years').upsert(
    {
      id: ACADEMIC_YEAR_ID,
      year_start: 2025,
      year_end: 2026,
      semester: '2nd Semester',
      is_current: true,
    },
    { onConflict: 'id' },
  );

  if (academicYearError) throw new Error(academicYearError.message || 'Failed to seed academic year');
}

export async function seedGateLogsData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('gate_assistance_logs').upsert(
    [
      {
        id: '95000000-0000-4000-8000-000000000001',
        prefect_id: PREFECT_ID,
        log_date: toDate(-1),
        time_in: '07:05',
        time_out: '09:00',
        notes: 'Assisted with ID checks and student queue control at the front gate.',
      },
      {
        id: '95000000-0000-4000-8000-000000000002',
        prefect_id: PREFECT_ID,
        log_date: toDate(-3),
        time_in: '06:58',
        time_out: '08:45',
        notes: 'Handled visitor redirection and coordinated with security.',
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed gate logs');
}

export async function seedAttendanceData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('attendance').upsert(
    [
      {
        id: '96000000-0000-4000-8000-000000000001',
        prefect_id: PREFECT_ID,
        date: toDate(-1),
        time_in: `${toDate(-1)}T07:00:00`,
        time_out: `${toDate(-1)}T15:00:00`,
        status: 'present',
        notes: 'Completed full duty coverage and submitted reports on time.',
      },
      {
        id: '96000000-0000-4000-8000-000000000002',
        prefect_id: PREFECT_ID,
        date: toDate(-2),
        time_in: `${toDate(-2)}T07:18:00`,
        time_out: `${toDate(-2)}T15:02:00`,
        status: 'late',
        notes: 'Arrived after weather delay and completed shift.',
      },
      {
        id: '96000000-0000-4000-8000-000000000003',
        prefect_id: PREFECT_ID,
        date: toDate(-3),
        time_in: null,
        time_out: null,
        status: 'absent',
        notes: 'Excused for academic activity.',
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed attendance');
}

export async function seedEvaluationsData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('performance_evaluations').upsert(
    [
      {
        id: '97000000-0000-4000-8000-000000000001',
        prefect_id: PREFECT_ID,
        evaluator_id: ADMIN_ID,
        academic_year_id: ACADEMIC_YEAR_ID,
        rating: 5,
        comments: 'Consistently strong field reporting and dependable event support.',
      },
      {
        id: '97000000-0000-4000-8000-000000000002',
        prefect_id: PREFECT_ID,
        evaluator_id: FACULTY_ID,
        academic_year_id: ACADEMIC_YEAR_ID,
        rating: 4,
        comments: 'Shows initiative during gate deployment and coordinates well with staff.',
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed evaluations');
}

export async function seedRecruitmentData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('prefect_applications').upsert(
    [
      {
        id: '98000000-0000-4000-8000-000000000001',
        applicant_id: STUDENT_ID,
        academic_year_id: ACADEMIC_YEAR_ID,
        statement:
          'I want to help maintain order, support school events, and grow as a student leader.',
        gpa: 1.75,
        status: 'under_review',
        reviewed_by: FACULTY_ID,
        review_notes: 'Candidate shows good standing and positive conduct record.',
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed recruitment applications');
}

export async function seedWeeklyReportsData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('weekly_reports').upsert(
    [
      {
        id: '99000000-0000-4000-8000-000000000001',
        prefect_id: PREFECT_ID,
        week_start: toDate(-7),
        week_end: toDate(-1),
        summary: 'Managed gate operations, monitored hallway flow, and followed up on one incident referral.',
        achievements: 'Improved queue handling during peak morning entry.',
        challenges: 'Needed faster coordination during rain-related congestion.',
      },
      {
        id: '99000000-0000-4000-8000-000000000002',
        prefect_id: PREFECT_ID,
        week_start: toDate(-14),
        week_end: toDate(-8),
        summary: 'Supported event marshaling and completed incident documentation review.',
        achievements: 'Maintained clean handover notes across shifts.',
        challenges: 'Repeat noise complaints required closer faculty coordination.',
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed weekly reports');
}

export async function seedComplaintsData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('complaints').upsert(
    [
      {
        id: '9a000000-0000-4000-8000-000000000001',
        submitted_by: STUDENT_ID,
        subject: 'Noise disturbance near Room 204',
        description: 'Several students were making excessive noise during the afternoon study period.',
        status: 'pending',
        assigned_to: ADMIN_ID,
      },
      {
        id: '9a000000-0000-4000-8000-000000000002',
        submitted_by: STUDENT_ID,
        subject: 'Queue management concern',
        description: 'The registrar waiting line became crowded during lunch break and needed clearer control.',
        status: 'in_progress',
        assigned_to: FACULTY_ID,
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed complaints');
}

export async function seedIncidentsData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('incident_reports').upsert(
    [
      {
        id: '9b000000-0000-4000-8000-000000000001',
        reported_by: PREFECT_ID,
        title: 'Hallway altercation',
        description: 'A brief verbal altercation occurred near the east hallway and required intervention.',
        severity: 'high',
        location: 'East Hallway',
        incident_date: new Date().toISOString(),
        is_resolved: false,
      },
      {
        id: '9b000000-0000-4000-8000-000000000002',
        reported_by: PREFECT_ID,
        title: 'Clinic referral follow-up',
        description: 'A student felt dizzy during assembly and was escorted to the clinic.',
        severity: 'low',
        location: 'Quadrangle',
        incident_date: new Date(Date.now() - 86400000).toISOString(),
        is_resolved: true,
        resolved_by: FACULTY_ID,
        resolved_at: new Date(Date.now() - 82800000).toISOString(),
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed incidents');
}

export async function seedDutiesData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('duty_assignments').upsert(
    [
      {
        id: '9c000000-0000-4000-8000-000000000001',
        prefect_id: PREFECT_ID,
        title: 'Morning Gate Monitoring',
        description: 'Monitor student flow and uniform compliance at the main gate.',
        duty_date: toDate(0),
        start_time: '07:00',
        end_time: '09:00',
        location: 'Main Gate',
        status: 'assigned',
        assigned_by: ADMIN_ID,
      },
      {
        id: '9c000000-0000-4000-8000-000000000002',
        prefect_id: PREFECT_ID,
        title: 'Lunch Break Hallway Watch',
        description: 'Oversee hallway movement during lunch break.',
        duty_date: toDate(1),
        start_time: '11:30',
        end_time: '13:00',
        location: 'Main Hallway',
        status: 'assigned',
        assigned_by: FACULTY_ID,
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed duties');
}

export async function seedEventsData() {
  await ensureCoreSeedData();

  const { error } = await supabase.from('events').upsert(
    [
      {
        id: '9d000000-0000-4000-8000-000000000001',
        title: 'Campus Leadership Assembly',
        description: 'Leadership briefing for student officers and prefect members.',
        event_date: toDate(2),
        start_time: '10:00',
        end_time: '12:00',
        location: 'Auditorium',
        created_by: ADMIN_ID,
      },
      {
        id: '9d000000-0000-4000-8000-000000000002',
        title: 'Safety Awareness Seminar',
        description: 'Coordination event with clinic and student affairs on campus safety.',
        event_date: toDate(5),
        start_time: '14:00',
        end_time: '16:00',
        location: 'Multi-Purpose Hall',
        created_by: FACULTY_ID,
      },
    ],
    { onConflict: 'id' },
  );

  if (error) throw new Error(error.message || 'Failed to seed events');
}
