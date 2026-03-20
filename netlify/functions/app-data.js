import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
  : null;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const FACULTY_ID = "22222222-2222-4222-8222-222222222222";
const PREFECT_ID = "33333333-3333-4333-8333-333333333333";
const STUDENT_ID = "44444444-4444-4444-8444-444444444444";
const ACADEMIC_YEAR_ID = "60000000-0000-4000-8000-000000000001";

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

async function fetchDashboardData(client, role, userId) {
  const today = dateOffset(0);

  if (role === "admin") {
    const [totalUsers, activePrefects, pendingComplaints, openIncidents, pendingApplications, todayDuties, recentComplaints, recentIncidents, upcomingEvents] = await Promise.all([
      client.query(`select count(*)::int as count from prefect.profiles`),
      client.query(`select count(*)::int as count from prefect.user_roles where role = 'prefect'`),
      client.query(`select count(*)::int as count from prefect.complaints where status = 'pending'`),
      client.query(`select count(*)::int as count from prefect.incident_reports where is_resolved = false`),
      client.query(`select count(*)::int as count from prefect.prefect_applications where status = 'pending'`),
      client.query(`select count(*)::int as count from prefect.duty_assignments where duty_date = $1`, [today]),
      client.query(`select id, subject, status, created_at from prefect.complaints order by created_at desc limit 5`),
      client.query(`select id, title, severity, location, created_at from prefect.incident_reports order by created_at desc limit 5`),
      client.query(`select id, title, event_date, start_time, location from prefect.events where event_date >= $1 order by event_date asc limit 5`, [today]),
    ]);

    return {
      stats: {
        totalUsers: totalUsers.rows[0]?.count ?? 0,
        activePrefects: activePrefects.rows[0]?.count ?? 0,
        pendingComplaints: pendingComplaints.rows[0]?.count ?? 0,
        openIncidents: openIncidents.rows[0]?.count ?? 0,
        pendingApplications: pendingApplications.rows[0]?.count ?? 0,
        todayDuties: todayDuties.rows[0]?.count ?? 0,
      },
      recentComplaints: recentComplaints.rows,
      recentIncidents: recentIncidents.rows,
      upcomingEvents: upcomingEvents.rows,
    };
  }

  if (role === "faculty") {
    const [complaints, incidents, applications, events, prefects, evaluations, recentComplaints, pendingApps] = await Promise.all([
      client.query(`select count(*)::int as count from prefect.complaints where status = 'pending'`),
      client.query(`select count(*)::int as count from prefect.incident_reports where is_resolved = false`),
      client.query(`select count(*)::int as count from prefect.prefect_applications where status in ('pending', 'under_review')`),
      client.query(`select count(*)::int as count from prefect.events where event_date >= $1`, [today]),
      client.query(`select count(*)::int as count from prefect.user_roles where role = 'prefect'`),
      client.query(`select count(*)::int as count from prefect.performance_evaluations`),
      client.query(`select id, subject, status, created_at from prefect.complaints order by created_at desc limit 5`),
      client.query(`select id, statement, gpa, status, created_at from prefect.prefect_applications where status in ('pending', 'under_review') order by created_at desc limit 5`),
    ]);

    return {
      stats: {
        complaints: complaints.rows[0]?.count ?? 0,
        incidents: incidents.rows[0]?.count ?? 0,
        applications: applications.rows[0]?.count ?? 0,
        events: events.rows[0]?.count ?? 0,
        prefects: prefects.rows[0]?.count ?? 0,
        evaluations: evaluations.rows[0]?.count ?? 0,
      },
      recentComplaints: recentComplaints.rows,
      pendingApps: pendingApps.rows,
    };
  }

  if (role === "prefect") {
    const effectiveUserId = userId || PREFECT_ID;
    const [myDuties, myGateLogs, myAttendance, upcomingEvents, myReports, myIncidents, todayDuties, recentIncidents] = await Promise.all([
      client.query(`select count(*)::int as count from prefect.duty_assignments where prefect_id = $1`, [effectiveUserId]),
      client.query(`select count(*)::int as count from prefect.gate_assistance_logs where prefect_id = $1`, [effectiveUserId]),
      client.query(`select count(*)::int as count from prefect.attendance where prefect_id = $1`, [effectiveUserId]),
      client.query(`select count(*)::int as count from prefect.events where event_date >= $1`, [today]),
      client.query(`select count(*)::int as count from prefect.weekly_reports where prefect_id = $1`, [effectiveUserId]),
      client.query(`select count(*)::int as count from prefect.incident_reports where reported_by = $1`, [effectiveUserId]),
      client.query(`select id, title, duty_date, start_time, location, status from prefect.duty_assignments where prefect_id = $1 and duty_date >= $2 order by duty_date asc limit 5`, [effectiveUserId, today]),
      client.query(`select id, title, location, created_at from prefect.incident_reports where reported_by = $1 order by created_at desc limit 5`, [effectiveUserId]),
    ]);

    return {
      stats: {
        myDuties: myDuties.rows[0]?.count ?? 0,
        myGateLogs: myGateLogs.rows[0]?.count ?? 0,
        myAttendance: myAttendance.rows[0]?.count ?? 0,
        upcomingEvents: upcomingEvents.rows[0]?.count ?? 0,
        myReports: myReports.rows[0]?.count ?? 0,
        myIncidents: myIncidents.rows[0]?.count ?? 0,
      },
      todayDuties: todayDuties.rows,
      recentIncidents: recentIncidents.rows,
    };
  }

  const effectiveUserId = userId || STUDENT_ID;
  const [myComplaints, myApplications, trainingMaterials, upcomingEvents, recentComplaints, events] = await Promise.all([
    client.query(`select count(*)::int as count from prefect.complaints where submitted_by = $1`, [effectiveUserId]),
    client.query(`select count(*)::int as count from prefect.prefect_applications where applicant_id = $1`, [effectiveUserId]),
    client.query(`select count(*)::int as count from prefect.training_materials where is_published = true`),
    client.query(`select count(*)::int as count from prefect.events where event_date >= $1`, [today]),
    client.query(`select id, subject, status, created_at from prefect.complaints where submitted_by = $1 order by created_at desc limit 5`, [effectiveUserId]),
    client.query(`select id, title, event_date, location from prefect.events where event_date >= $1 order by event_date asc limit 5`, [today]),
  ]);

  return {
    stats: {
      myComplaints: myComplaints.rows[0]?.count ?? 0,
      myApplications: myApplications.rows[0]?.count ?? 0,
      trainingMaterials: trainingMaterials.rows[0]?.count ?? 0,
      upcomingEvents: upcomingEvents.rows[0]?.count ?? 0,
    },
    recentComplaints: recentComplaints.rows,
    events: events.rows,
  };
}

async function ensureCoreSeedData(client) {
  await client.query(`
    insert into prefect.profiles (id, student_id, first_name, last_name, email, phone, department, year_level, section)
    values
      ('${ADMIN_ID}', 'A-2026-0001', 'Admin', 'User', 'admin@gmail.com', '09170000001', 'Administration', null, null),
      ('${FACULTY_ID}', 'F-2026-0001', 'Staff', 'User', 'staff@gmail.com', '09170000002', 'Guidance Office', null, null),
      ('${PREFECT_ID}', 'P-2026-0001', 'Paula', 'Prefect', 'prefect@gmail.com', '09170000003', 'Student Affairs', 2, 'BSCPE-2A'),
      ('${STUDENT_ID}', 'S-2026-0001', 'Sam', 'Student', 'student@gmail.com', '09170000004', 'BSIT', 1, 'BSIT-1A')
    on conflict (id) do update set
      student_id = excluded.student_id,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      phone = excluded.phone,
      department = excluded.department,
      year_level = excluded.year_level,
      section = excluded.section
  `);

  await client.query(`
    insert into prefect.user_roles (user_id, role, assigned_by)
    values
      ('${ADMIN_ID}', 'admin', '${ADMIN_ID}'),
      ('${FACULTY_ID}', 'faculty', '${ADMIN_ID}'),
      ('${PREFECT_ID}', 'prefect', '${ADMIN_ID}'),
      ('${STUDENT_ID}', 'student', '${ADMIN_ID}')
    on conflict (user_id, role) do nothing
  `);

  await client.query(`
    insert into prefect.academic_years (id, year_start, year_end, semester, is_current)
    values ('${ACADEMIC_YEAR_ID}', 2025, 2026, '2nd Semester', true)
    on conflict (id) do update set
      year_start = excluded.year_start,
      year_end = excluded.year_end,
      semester = excluded.semester,
      is_current = excluded.is_current
  `);
}

async function seedTraining(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.training_categories (id, name, description)
    values
      ('70000000-0000-4000-8000-000000000001', 'Policies', 'School rules, discipline code, and prefect procedures'),
      ('70000000-0000-4000-8000-000000000002', 'Operations', 'Duty workflow and reporting operations'),
      ('70000000-0000-4000-8000-000000000003', 'Leadership', 'Communication, coordination, and decision-making guides for prefects')
    on conflict (id) do update set
      name = excluded.name,
      description = excluded.description
  `);
  await client.query(`
    insert into prefect.training_materials (id, category_id, title, content, created_by, is_published)
    values
      ('71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Prefect Code of Conduct', 'Maintain professionalism, accurate reporting, and respectful intervention in all student-facing duties.', '${ADMIN_ID}', true),
      ('71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', 'Daily Duty Handover Guide', 'Review the assigned post, confirm attendance, log notable activity, and submit reports before end of shift.', '${ADMIN_ID}', true),
      ('71000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000003', 'Conflict De-escalation Basics', 'Use calm verbal redirection, keep a safe distance, document witnesses, and escalate to faculty when necessary.', '${ADMIN_ID}', true),
      ('71000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000002', 'Incident Report Writing Template', 'Record time, location, involved parties, sequence of events, intervention taken, and follow-up recommendations.', '${ADMIN_ID}', false)
    on conflict (id) do update set
      category_id = excluded.category_id,
      title = excluded.title,
      content = excluded.content,
      created_by = excluded.created_by,
      is_published = excluded.is_published
  `);
}

async function seedComplaints(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.complaints (id, submitted_by, subject, description, status, assigned_to)
    values
      ('9a000000-0000-4000-8000-000000000001', '${STUDENT_ID}', 'Noise disturbance near Room 204', 'Several students were making excessive noise during the afternoon study period.', 'pending', '${ADMIN_ID}'),
      ('9a000000-0000-4000-8000-000000000002', '${STUDENT_ID}', 'Queue management concern', 'The registrar waiting line became crowded during lunch break and needed clearer control.', 'in_progress', '${FACULTY_ID}')
    on conflict (id) do update set
      subject = excluded.subject,
      description = excluded.description,
      status = excluded.status,
      assigned_to = excluded.assigned_to
  `);
}

async function seedIncidents(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.incident_reports (id, reported_by, title, description, severity, location, incident_date, is_resolved, resolved_by, resolved_at)
    values
      ('9b000000-0000-4000-8000-000000000001', '${PREFECT_ID}', 'Hallway altercation', 'A brief verbal altercation occurred near the east hallway and required intervention.', 'high', 'East Hallway', now(), false, null, null),
      ('9b000000-0000-4000-8000-000000000002', '${PREFECT_ID}', 'Clinic referral follow-up', 'A student felt dizzy during assembly and was escorted to the clinic.', 'low', 'Quadrangle', now() - interval '1 day', true, '${FACULTY_ID}', now() - interval '23 hour')
    on conflict (id) do update set
      title = excluded.title,
      description = excluded.description,
      severity = excluded.severity,
      location = excluded.location,
      incident_date = excluded.incident_date,
      is_resolved = excluded.is_resolved,
      resolved_by = excluded.resolved_by,
      resolved_at = excluded.resolved_at
  `);
}

async function seedDuties(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.duty_assignments (id, prefect_id, title, description, duty_date, start_time, end_time, location, status, assigned_by)
    values
      ('9c000000-0000-4000-8000-000000000001', '${PREFECT_ID}', 'Morning Gate Monitoring', 'Monitor student flow and uniform compliance at the main gate.', '${dateOffset(0)}', '07:00', '09:00', 'Main Gate', 'assigned', '${ADMIN_ID}'),
      ('9c000000-0000-4000-8000-000000000002', '${PREFECT_ID}', 'Lunch Break Hallway Watch', 'Oversee hallway movement during lunch break.', '${dateOffset(1)}', '11:30', '13:00', 'Main Hallway', 'assigned', '${FACULTY_ID}')
    on conflict (id) do update set
      title = excluded.title,
      description = excluded.description,
      duty_date = excluded.duty_date,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      location = excluded.location,
      status = excluded.status,
      assigned_by = excluded.assigned_by
  `);
}

async function seedEvents(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.events (id, title, description, event_date, start_time, end_time, location, created_by)
    values
      ('9d000000-0000-4000-8000-000000000001', 'Campus Leadership Assembly', 'Leadership briefing for student officers and prefect members.', '${dateOffset(2)}', '10:00', '12:00', 'Auditorium', '${ADMIN_ID}'),
      ('9d000000-0000-4000-8000-000000000002', 'Safety Awareness Seminar', 'Coordination event with clinic and student affairs on campus safety.', '${dateOffset(5)}', '14:00', '16:00', 'Multi-Purpose Hall', '${FACULTY_ID}')
    on conflict (id) do update set
      title = excluded.title,
      description = excluded.description,
      event_date = excluded.event_date,
      start_time = excluded.start_time,
      end_time = excluded.end_time,
      location = excluded.location,
      created_by = excluded.created_by
  `);
}

async function seedGateLogs(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.gate_assistance_logs (id, prefect_id, log_date, time_in, time_out, notes)
    values
      ('95000000-0000-4000-8000-000000000001', '${PREFECT_ID}', '${dateOffset(-1)}', '07:05', '09:00', 'Assisted with ID checks and student queue control at the front gate.'),
      ('95000000-0000-4000-8000-000000000002', '${PREFECT_ID}', '${dateOffset(-3)}', '06:58', '08:45', 'Handled visitor redirection and coordinated with security.')
    on conflict (id) do update set
      log_date = excluded.log_date,
      time_in = excluded.time_in,
      time_out = excluded.time_out,
      notes = excluded.notes
  `);
}

async function seedAttendance(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.attendance (id, prefect_id, date, time_in, time_out, status, notes)
    values
      ('96000000-0000-4000-8000-000000000001', '${PREFECT_ID}', '${dateOffset(-1)}', '${dateOffset(-1)}T07:00:00', '${dateOffset(-1)}T15:00:00', 'present', 'Completed full duty coverage and submitted reports on time.'),
      ('96000000-0000-4000-8000-000000000002', '${PREFECT_ID}', '${dateOffset(-2)}', '${dateOffset(-2)}T07:18:00', '${dateOffset(-2)}T15:02:00', 'late', 'Arrived after weather delay and completed shift.'),
      ('96000000-0000-4000-8000-000000000003', '${PREFECT_ID}', '${dateOffset(-3)}', null, null, 'absent', 'Excused for academic activity.')
    on conflict (id) do update set
      date = excluded.date,
      time_in = excluded.time_in,
      time_out = excluded.time_out,
      status = excluded.status,
      notes = excluded.notes
  `);
}

async function seedEvaluations(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.performance_evaluations (id, prefect_id, evaluator_id, academic_year_id, rating, comments)
    values
      ('97000000-0000-4000-8000-000000000001', '${PREFECT_ID}', '${ADMIN_ID}', '${ACADEMIC_YEAR_ID}', 5, 'Consistently strong field reporting and dependable event support.'),
      ('97000000-0000-4000-8000-000000000002', '${PREFECT_ID}', '${FACULTY_ID}', '${ACADEMIC_YEAR_ID}', 4, 'Shows initiative during gate deployment and coordinates well with staff.')
    on conflict (id) do update set
      evaluator_id = excluded.evaluator_id,
      academic_year_id = excluded.academic_year_id,
      rating = excluded.rating,
      comments = excluded.comments
  `);
}

async function seedRecruitment(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.prefect_applications (id, applicant_id, academic_year_id, statement, gpa, status, reviewed_by, review_notes)
    values
      ('98000000-0000-4000-8000-000000000001', '${STUDENT_ID}', '${ACADEMIC_YEAR_ID}', 'I want to help maintain order, support school events, and grow as a student leader.', 1.75, 'under_review', '${FACULTY_ID}', 'Candidate shows good standing and positive conduct record.')
    on conflict (id) do update set
      academic_year_id = excluded.academic_year_id,
      statement = excluded.statement,
      gpa = excluded.gpa,
      status = excluded.status,
      reviewed_by = excluded.reviewed_by,
      review_notes = excluded.review_notes
  `);
}

async function seedWeeklyReports(client) {
  await ensureCoreSeedData(client);
  await client.query(`
    insert into prefect.weekly_reports (id, prefect_id, week_start, week_end, summary, achievements, challenges)
    values
      ('99000000-0000-4000-8000-000000000001', '${PREFECT_ID}', '${dateOffset(-7)}', '${dateOffset(-1)}', 'Managed gate operations, monitored hallway flow, and followed up on one incident referral.', 'Improved queue handling during peak morning entry.', 'Needed faster coordination during rain-related congestion.'),
      ('99000000-0000-4000-8000-000000000002', '${PREFECT_ID}', '${dateOffset(-14)}', '${dateOffset(-8)}', 'Supported event marshaling and completed incident documentation review.', 'Maintained clean handover notes across shifts.', 'Repeat noise complaints required closer faculty coordination.')
    on conflict (id) do update set
      week_start = excluded.week_start,
      week_end = excluded.week_end,
      summary = excluded.summary,
      achievements = excluded.achievements,
      challenges = excluded.challenges
  `);
}

const fetchers = {
  async complaints(client) {
    const { rows } = await client.query(`select id, subject, description, status, submitted_by, created_at, updated_at from prefect.complaints order by created_at desc`);
    return { complaints: rows };
  },
  async incidents(client) {
    const { rows } = await client.query(`select id, title, description, severity, location, is_resolved, reported_by, created_at, updated_at from prefect.incident_reports order by created_at desc`);
    return { incidents: rows };
  },
  async duties(client) {
    const [duties, profiles] = await Promise.all([
      client.query(`select id, prefect_id, title, description, duty_date, start_time, end_time, location, status, assigned_by, created_at, updated_at from prefect.duty_assignments order by duty_date desc, created_at desc`),
      client.query(`select p.id, p.first_name, p.last_name, p.email from prefect.profiles p join prefect.user_roles ur on ur.user_id = p.id where ur.role = 'prefect' order by p.first_name asc`),
    ]);
    return { duties: duties.rows, profiles: profiles.rows };
  },
  async events(client) {
    const [events, profiles] = await Promise.all([
      client.query(`select id, title, description, event_date, start_time, end_time, location, created_by, created_at, updated_at from prefect.events order by event_date asc, created_at desc`),
      client.query(`select id, first_name, last_name from prefect.profiles order by first_name asc`),
    ]);
    return { events: events.rows, profiles: profiles.rows };
  },
  async training(client) {
    const [categories, materials] = await Promise.all([
      client.query(`select id, name, description from prefect.training_categories order by name asc`),
      client.query(`select id, title, content, is_published, category_id, created_at from prefect.training_materials order by created_at desc`),
    ]);
    return { categories: categories.rows, materials: materials.rows };
  },
  async "gate-logs"(client) {
    const [logs, profiles] = await Promise.all([
      client.query(`select id, prefect_id, log_date, time_in, time_out, notes, created_at from prefect.gate_assistance_logs order by log_date desc, created_at desc`),
      client.query(`select p.id, p.first_name, p.last_name from prefect.profiles p join prefect.user_roles ur on ur.user_id = p.id where ur.role = 'prefect' order by p.first_name asc`),
    ]);
    return { logs: logs.rows, profiles: profiles.rows };
  },
  async attendance(client) {
    const [attendance, profiles] = await Promise.all([
      client.query(`select id, prefect_id, date, time_in, time_out, status, notes, created_at from prefect.attendance order by date desc, created_at desc`),
      client.query(`select p.id, p.first_name, p.last_name, p.email from prefect.profiles p join prefect.user_roles ur on ur.user_id = p.id where ur.role = 'prefect' order by p.first_name asc`),
    ]);
    return { attendance: attendance.rows, profiles: profiles.rows };
  },
  async evaluations(client) {
    const [evaluations, prefectProfiles, adminProfiles, academicYears] = await Promise.all([
      client.query(`select id, prefect_id, evaluator_id, academic_year_id, rating, comments, created_at from prefect.performance_evaluations order by created_at desc`),
      client.query(`select p.id, p.first_name, p.last_name, p.email from prefect.profiles p join prefect.user_roles ur on ur.user_id = p.id where ur.role = 'prefect' order by p.first_name asc`),
      client.query(`select p.id, p.first_name, p.last_name, p.email from prefect.profiles p join prefect.user_roles ur on ur.user_id = p.id where ur.role in ('admin', 'faculty') order by p.first_name asc`),
      client.query(`select id, year_start, year_end, semester, is_current from prefect.academic_years order by year_start desc, year_end desc`),
    ]);
    return {
      evaluations: evaluations.rows,
      prefectProfiles: prefectProfiles.rows,
      adminProfiles: adminProfiles.rows,
      academicYears: academicYears.rows,
    };
  },
  async recruitment(client) {
    const [applications, profiles, currentAcademicYear] = await Promise.all([
      client.query(`select id, applicant_id, statement, gpa, status, review_notes, reviewed_by, created_at, updated_at from prefect.prefect_applications order by created_at desc`),
      client.query(`select id, first_name, last_name, student_id from prefect.profiles order by first_name asc`),
      client.query(`select id from prefect.academic_years where is_current = true limit 1`),
    ]);
    return {
      applications: applications.rows,
      profiles: profiles.rows,
      currentAcademicYearId: currentAcademicYear.rows[0]?.id ?? null,
    };
  },
  async "weekly-reports"(client) {
    const { rows } = await client.query(`select id, prefect_id, week_start, week_end, summary, achievements, challenges, created_at from prefect.weekly_reports order by week_start desc, created_at desc`);
    return { reports: rows };
  },
  async dashboard(client, event) {
    const role = event.queryStringParameters?.role ?? "student";
    const userId = event.queryStringParameters?.userId;
    return fetchDashboardData(client, role, userId);
  },
};

const seeders = {
  complaints: seedComplaints,
  incidents: seedIncidents,
  duties: seedDuties,
  events: seedEvents,
  training: seedTraining,
  "gate-logs": seedGateLogs,
  attendance: seedAttendance,
  evaluations: seedEvaluations,
  recruitment: seedRecruitment,
  "weekly-reports": seedWeeklyReports,
};

export async function handler(event) {
  if (!pool) {
    return json(500, { ok: false, error: "DATABASE_URL is not configured on the backend." });
  }

  const resource = event.queryStringParameters?.resource;
  const mode = event.queryStringParameters?.mode ?? "fetch";
  const method = (event.httpMethod ?? "GET").toUpperCase();

  if (!resource || !(resource in fetchers)) {
    return json(400, { ok: false, error: `Unsupported resource "${resource ?? ""}".` });
  }

  try {
    const db = pool;

    if (resource === "training" && method === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      const action = body?.action;
      const payload = body?.payload ?? {};

      if (action === "create-category") {
        const { rows } = await db.query(
          `
            insert into prefect.training_categories (name, description)
            values ($1, $2)
            returning id, name, description
          `,
          [payload.name?.trim(), payload.description?.trim() || null],
        );
        return json(200, { ok: true, resource, action, data: rows[0] ?? null });
      }

      if (action === "update-category") {
        const { rows } = await db.query(
          `
            update prefect.training_categories
            set name = $2, description = $3
            where id = $1
            returning id, name, description
          `,
          [payload.id, payload.name?.trim(), payload.description?.trim() || null],
        );
        return json(200, { ok: true, resource, action, data: rows[0] ?? null });
      }

      if (action === "delete-category") {
        await db.query(`delete from prefect.training_categories where id = $1`, [payload.id]);
        return json(200, { ok: true, resource, action, data: true });
      }

      if (action === "create-material") {
        const { rows } = await db.query(
          `
            insert into prefect.training_materials (title, content, category_id, is_published, created_by)
            values ($1, $2, $3, $4, $5)
            returning id, title, content, is_published, category_id, created_at
          `,
          [
            payload.title?.trim(),
            payload.content?.trim() || null,
            payload.category_id,
            !!payload.is_published,
            ADMIN_ID,
          ],
        );
        return json(200, { ok: true, resource, action, data: rows[0] ?? null });
      }

      if (action === "update-material") {
        const { rows } = await db.query(
          `
            update prefect.training_materials
            set title = $2, content = $3, category_id = $4, is_published = $5
            where id = $1
            returning id, title, content, is_published, category_id, created_at
          `,
          [
            payload.id,
            payload.title?.trim(),
            payload.content?.trim() || null,
            payload.category_id,
            !!payload.is_published,
          ],
        );
        return json(200, { ok: true, resource, action, data: rows[0] ?? null });
      }

      if (action === "delete-material") {
        await db.query(`delete from prefect.training_materials where id = $1`, [payload.id]);
        return json(200, { ok: true, resource, action, data: true });
      }

      return json(400, { ok: false, error: `Unsupported training action "${action ?? ""}".` });
    }

    if (mode === "seed") {
      await seeders[resource](db);
    }

    const data = await fetchers[resource](db, event);
    return json(200, { ok: true, resource, mode, data });
  } catch (error) {
    return json(500, { ok: false, error: error instanceof Error ? error.message : "Database request failed." });
  }
}

