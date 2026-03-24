import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
const PREFECT_DEPARTMENT_KEY = "prefect";
const PMED_REPORT_BRIDGE_URL =
  process.env.PMED_REPORT_BRIDGE_URL ||
  "http://localhost/bpm%20commision/PMED/backend/integrations/departments/prefect.php";

/** POST target for Clinic to store Prefect incident handoffs (must match clinicsystem route + DEPARTMENT_INTEGRATION_SHARED_TOKEN). */
const CLINIC_PREFECT_BRIDGE_URL =
  process.env.CLINIC_PREFECT_BRIDGE_URL || "http://localhost:5173/api/integrations/prefect/incident-reports";

const CLINIC_DEPARTMENT_INTEGRATION_TOKEN =
  process.env.CLINIC_DEPARTMENT_INTEGRATION_TOKEN || process.env.DEPARTMENT_INTEGRATION_SHARED_TOKEN || "";

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

function parseBody(body) {
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function normalizeLimit(value, fallback, max = 25) {
  const parsed = Number.parseInt(String(value ?? fallback), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, 1), max);
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === "string") {
      const normalized = value.trim();
      if (normalized) {
        return normalized;
      }
      continue;
    }

    if (value !== null && value !== undefined) {
      return value;
    }
  }

  return null;
}

function toSlug(value) {
  return String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

function normalizeRecordStatus(value, fallback = "pending") {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
}

function inferPatientType(payload) {
  const hintedType = firstNonEmpty(payload?.patient_type, payload?.employee_type, payload?.person_type);

  if (hintedType) {
    const normalizedHint = String(hintedType).trim().toLowerCase();

    if (normalizedHint === "student") {
      return "student";
    }

    if (normalizedHint === "teacher") {
      return "teacher";
    }

    if (normalizedHint === "unknown") {
      return "unknown";
    }

    if (["employee", "staff", "admin", "registrar", "faculty"].includes(normalizedHint)) {
      return normalizedHint === "faculty" ? "teacher" : "unknown";
    }
  }

  if (firstNonEmpty(payload?.employee_id, payload?.employee_number)) {
    return payload?.employee_type === "teacher" ? "teacher" : "unknown";
  }

  if (firstNonEmpty(payload?.student_id, payload?.student_no)) {
    return "student";
  }

  return "unknown";
}

function buildPmedReportSections(payload) {
  return [
    {
      title: "Discipline Overview",
      description: "Summary of Prefect complaints, incidents, and duty operations prepared for PMED reporting.",
      metrics: [
        { label: "Total Complaints", value: Number(payload?.total_complaints ?? 0) },
        { label: "Total Incidents", value: Number(payload?.total_incidents ?? 0) },
        { label: "Total Duties", value: Number(payload?.total_duties ?? 0) },
      ],
    },
    {
      title: "Critical Follow-ups",
      description: "Unresolved or pending conduct items that PMED should track in the consolidated report.",
      metrics: [
        { label: "Unresolved Incidents", value: Number(payload?.unresolved_incidents ?? 0) },
        { label: "Pending Complaints", value: Number(payload?.pending_complaints ?? 0) },
      ],
    },
  ];
}

async function forwardReportToPmed(event, record) {
  const payload = event?.request_payload ?? {};
  const reportReference =
    firstNonEmpty(payload.reference_no, payload.referenceNo, event?.source_record_id, event?.correlation_id) ||
    `RPT-PREFECT-${Date.now()}`;
  const reportName =
    firstNonEmpty(payload.report_name, payload.title, record?.patient_name) ||
    "Prefect Discipline and Incident Report";
  const reportType =
    firstNonEmpty(payload.report_type, payload.event_code, event?.event_code) ||
    "Prefect Report";
  const notes =
    firstNonEmpty(payload.notes, payload.remarks, record?.remarks) ||
    "Prefect discipline statistics forwarded to PMED.";
  const ownerName =
    firstNonEmpty(payload.owner_name, payload.requested_by, record?.requested_by) ||
    "Prefect Management";
  const sections = buildPmedReportSections(payload);
  const summary = {
    section_count: sections.length,
    metric_count: sections.reduce((count, section) => count + (Array.isArray(section.metrics) ? section.metrics.length : 0), 0),
    sources: ["Prefect"],
    totals: {
      complaints: Number(payload?.total_complaints ?? 0),
      incidents: Number(payload?.total_incidents ?? 0),
      duties: Number(payload?.total_duties ?? 0),
    },
    open_items: {
      unresolved_incidents: Number(payload?.unresolved_incidents ?? 0),
      pending_complaints: Number(payload?.pending_complaints ?? 0),
    },
  };

  const response = await fetch(PMED_REPORT_BRIDGE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "submit_report",
      report_reference: reportReference,
      report_name: reportName,
      report_type: reportType,
      plan_reference: firstNonEmpty(payload.plan_reference, payload.planReference),
      approver_name: ownerName,
      approver_role: "Prefect Management",
      external_reference: firstNonEmpty(event?.correlation_id, reportReference),
      requested_by: ownerName,
      remarks: notes,
      file_url: firstNonEmpty(payload.file_url, payload.fileUrl),
      metadata: {
        ...payload,
        target_department: "pmed",
        stage: "reporting",
        source_entity: "report",
        source_department: "prefect",
        source_department_name: "Prefect",
        report_reference: reportReference,
        report_name: reportName,
        report_type: reportType,
        owner_name: ownerName,
        delivery_status: "Received",
        archive_status: "Active",
        summary,
        pmed_sections: sections,
      },
    }),
  });

  const rawText = await response.text();
  let parsed = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok || parsed?.ok === false) {
    throw new Error(parsed?.message || `PMED bridge request failed with HTTP ${response.status}.`);
  }

  return parsed ?? { ok: true };
}

function mergeRecordIntoPayload(record, requestPayload) {
  const base =
    requestPayload && typeof requestPayload === "object" && !Array.isArray(requestPayload)
      ? { ...requestPayload }
      : {};
  if (!record || typeof record !== "object") {
    return base;
  }
  const meta = record.metadata;
  const nestedPayload =
    meta && typeof meta === "object" && meta.payload && typeof meta.payload === "object" && !Array.isArray(meta.payload)
      ? meta.payload
      : {};
  return {
    ...nestedPayload,
    ...base,
    clearance_reference: firstNonEmpty(base.clearance_reference, record.clearance_reference, base.reference_no),
    patient_name: firstNonEmpty(base.patient_name, record.patient_name, base.student_name),
    patient_code: firstNonEmpty(base.patient_code, record.patient_code, base.student_no),
    student_name: firstNonEmpty(base.student_name, record.patient_name, base.patient_name),
    student_no: firstNonEmpty(base.student_no, record.patient_code, base.patient_code),
    record_remarks: firstNonEmpty(base.record_remarks, record.remarks),
    department_flow: firstNonEmpty(base.department_flow, record.department_name),
  };
}

function assertClinicBridgeTokenConfigured() {
  const token = String(CLINIC_DEPARTMENT_INTEGRATION_TOKEN || "").trim();
  if (!token) {
    throw new Error(
      "Prefect: set CLINIC_DEPARTMENT_INTEGRATION_TOKEN or DEPARTMENT_INTEGRATION_SHARED_TOKEN to the same value as clinic .env DEPARTMENT_INTEGRATION_SHARED_TOKEN. Without it the clinic POST returns 401 and module_activity_logs stays empty.",
    );
  }
}

async function forwardIncidentReportToClinic(event, record) {
  assertClinicBridgeTokenConfigured();
  const rawPayload = event?.request_payload ?? {};
  const payload = mergeRecordIntoPayload(record, rawPayload);
  const correlationId = firstNonEmpty(event?.correlation_id, payload?.correlation_id);
  const body = {
    action: "receive_prefect_incident",
    correlation_id: correlationId,
    event_id: event?.id,
    event_code: event?.event_code,
    source_department: "prefect",
    clearance_reference: record?.clearance_reference,
    patient_name: record?.patient_name,
    patient_code: record?.patient_code,
    patient_type: record?.patient_type,
    payload,
    record_metadata: record?.metadata,
    materialized_at: new Date().toISOString(),
  };

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(CLINIC_DEPARTMENT_INTEGRATION_TOKEN ? { "X-Integration-Token": CLINIC_DEPARTMENT_INTEGRATION_TOKEN } : {}),
  };

  const response = await fetch(CLINIC_PREFECT_BRIDGE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let parsed = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok || parsed?.ok === false) {
    throw new Error(parsed?.message || `Clinic bridge request failed with HTTP ${response.status}.`);
  }

  return parsed ?? { ok: true };
}

function buildClearanceReference(event, payload) {
  const preferredReference = firstNonEmpty(
    payload?.reference_no,
    payload?.referenceNo,
    payload?.case_reference,
    payload?.caseReference,
    payload?.clearance_reference,
    payload?.clearanceReference,
    event.source_record_id,
  );

  // One row per integration_flow_events row: include event id/correlation so repeated sends
  // with the same reference_no / default sourceRecordId do not overwrite prior reports.
  const uniqueEventKey = firstNonEmpty(event.id, event.correlation_id) || `ADHOC-${Date.now()}`;

  return [
    "FLOW",
    toSlug(event.source_department_key),
    toSlug(event.target_department_key),
    toSlug(event.event_code),
    toSlug(preferredReference || "DISPATCH"),
    toSlug(uniqueEventKey),
  ]
    .filter((segment) => segment && String(segment).length > 0)
    .join("-");
}

function serializeSharedRecord(record) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    clearance_reference: record.clearance_reference,
    department_key: record.department_key,
    department_name: record.department_name,
    patient_name: record.patient_name,
    patient_code: record.patient_code,
    patient_type: record.patient_type,
    stage_order: record.stage_order,
    status: record.status,
    remarks: record.remarks,
    external_reference: record.external_reference,
    requested_by: record.requested_by,
    metadata: record.metadata,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

async function queryFlowProfile(db) {
  const { rows } = await db.query(
    `
      select
        department_key,
        department_name,
        flow_order,
        clearance_stage_order,
        receives,
        sends,
        notes,
        created_at,
        updated_at
      from prefect.department_flow_profiles
      where department_key = $1
      limit 1
    `,
    [PREFECT_DEPARTMENT_KEY],
  );

  return rows[0] ?? null;
}

async function queryFlowProfiles(db) {
  const { rows } = await db.query(
    `
      select
        department_key,
        department_name,
        flow_order,
        clearance_stage_order
      from prefect.department_flow_profiles
    `,
  );

  return new Map(rows.map((row) => [row.department_key, row]));
}

async function queryClearanceRecords(db, limit) {
  const safeLimit = normalizeLimit(limit, 5, 20);
  const { rows } = await db.query(
    `
      select
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
        decided_at,
        metadata,
        created_at,
        updated_at
      from prefect.department_clearance_records
      where department_key = $1
      order by created_at desc
      limit $2
    `,
    [PREFECT_DEPARTMENT_KEY, safeLimit],
  );

  return rows;
}

async function queryDepartmentProfile(db) {
  const { rows } = await db.query(
    `
      select
        department_key,
        department_name,
        system_code,
        module_directory,
        owning_schema,
        dispatch_rpc_name,
        status_rpc_name,
        ack_rpc_name,
        purpose,
        default_action_label,
        is_active,
        metadata,
        created_at,
        updated_at
      from public.integration_departments
      where department_key = $1
      limit 1
    `,
    [PREFECT_DEPARTMENT_KEY],
  );

  return rows[0] ?? null;
}

async function queryRouteByKey(db, routeKey) {
  const { rows } = await db.query(
    `
      select
        route_key,
        flow_name,
        source_department_key,
        target_department_key,
        event_code,
        request_method,
        endpoint_path,
        priority,
        is_required,
        is_active,
        notes,
        metadata
      from public.integration_flow_routes
      where route_key = $1
      limit 1
    `,
    [routeKey],
  );

  return rows[0] ?? null;
}

async function queryConnectedRoutes(db) {
  const { rows } = await db.query(
    `
      select
        route.route_key,
        route.flow_name,
        route.source_department_key,
        route.target_department_key,
        route.event_code,
        route.request_method,
        route.endpoint_path,
        route.priority,
        route.is_required,
        route.is_active,
        route.notes,
        route.metadata,
        case
          when route.source_department_key = $1 then 'sends'
          else 'receives'
        end as direction,
        counterpart.department_key as counterpart_key,
        counterpart.department_name as counterpart_name,
        counterpart.system_code as counterpart_system_code,
        counterpart.module_directory as counterpart_module_directory,
        counterpart.owning_schema as counterpart_owning_schema,
        counterpart.dispatch_rpc_name as counterpart_dispatch_rpc_name,
        counterpart.status_rpc_name as counterpart_status_rpc_name,
        counterpart.ack_rpc_name as counterpart_ack_rpc_name,
        counterpart.purpose as counterpart_purpose,
        counterpart.default_action_label as counterpart_default_action_label,
        counterpart.metadata as counterpart_metadata
      from public.integration_flow_routes route
      join public.integration_departments counterpart
        on counterpart.department_key = case
          when route.source_department_key = $1 then route.target_department_key
          else route.source_department_key
        end
      where route.is_active = true
        and (route.source_department_key = $1 or route.target_department_key = $1)
      order by counterpart.department_name, route.priority, route.flow_name
    `,
    [PREFECT_DEPARTMENT_KEY],
  );

  return rows;
}

async function queryEventSummaries(db) {
  const [countResult, latestResult] = await Promise.all([
    db.query(
      `
        select
          case
            when source_department_key = $1 then target_department_key
            else source_department_key
          end as counterpart_key,
          count(*) filter (where status in ('queued', 'pending'))::int as pending_count,
          count(*) filter (where status in ('dispatched', 'in_progress', 'awaiting_acknowledgement'))::int as in_progress_count,
          count(*) filter (where status in ('failed', 'blocked'))::int as failed_count,
          count(*) filter (where status in ('acknowledged', 'completed'))::int as completed_count
        from public.integration_flow_events
        where source_department_key = $1 or target_department_key = $1
        group by 1
      `,
      [PREFECT_DEPARTMENT_KEY],
    ),
    db.query(
      `
        select distinct on (
          case
            when event.source_department_key = $1 then event.target_department_key
            else event.source_department_key
          end
        )
          case
            when event.source_department_key = $1 then event.target_department_key
            else event.source_department_key
          end as counterpart_key,
          event.id,
          event.route_key,
          event.source_department_key,
          event.target_department_key,
          event.event_code,
          event.status,
          event.correlation_id,
          event.source_record_id,
          event.created_at,
          event.updated_at,
          event.dispatched_at,
          event.acknowledged_at,
          event.last_error
        from public.integration_flow_events event
        where event.source_department_key = $1 or event.target_department_key = $1
        order by counterpart_key, event.created_at desc
      `,
      [PREFECT_DEPARTMENT_KEY],
    ),
  ]);

  const countMap = new Map(
    countResult.rows.map((row) => [
      row.counterpart_key,
      {
        pending_count: row.pending_count ?? 0,
        in_progress_count: row.in_progress_count ?? 0,
        failed_count: row.failed_count ?? 0,
        completed_count: row.completed_count ?? 0,
      },
    ]),
  );

  const latestMap = new Map(
    latestResult.rows.map((row) => [
      row.counterpart_key,
      {
        latest_event_id: row.id,
        latest_route_key: row.route_key,
        latest_status: row.status,
        latest_event_code: row.event_code,
        latest_correlation_id: row.correlation_id,
        latest_source_record_id: row.source_record_id,
        latest_created_at: row.created_at,
        latest_updated_at: row.updated_at,
        latest_dispatched_at: row.dispatched_at,
        latest_acknowledged_at: row.acknowledged_at,
        latest_error: row.last_error,
      },
    ]),
  );

  return { countMap, latestMap };
}

async function queryRecentEvents(db, limit) {
  const safeLimit = normalizeLimit(limit, 10, 50);
  const { rows } = await db.query(
    `
      select
        event.id,
        event.route_key,
        route.flow_name,
        route.request_method,
        event.source_department_key,
        event.target_department_key,
        case
          when event.source_department_key = $1 then 'sends'
          else 'receives'
        end as direction,
        case
          when event.source_department_key = $1 then event.target_department_key
          else event.source_department_key
        end as counterpart_key,
        event.event_code,
        event.status,
        event.correlation_id,
        event.source_record_id,
        event.request_payload,
        event.response_payload,
        event.dispatch_endpoint,
        event.initiated_by,
        event.dispatched_at,
        event.acknowledged_at,
        event.last_error,
        event.metadata,
        event.created_at,
        event.updated_at
      from public.integration_flow_events event
      join public.integration_flow_routes route
        on route.route_key = event.route_key
      where event.source_department_key = $1 or event.target_department_key = $1
      order by event.created_at desc
      limit $2
    `,
    [PREFECT_DEPARTMENT_KEY, safeLimit],
  );

  return rows;
}

function buildConnections(routeRows, eventSummary) {
  const grouped = new Map();

  routeRows.forEach((route) => {
    if (!grouped.has(route.counterpart_key)) {
      grouped.set(route.counterpart_key, {
        department_key: route.counterpart_key,
        department_name: route.counterpart_name,
        system_code: route.counterpart_system_code,
        module_directory: route.counterpart_module_directory,
        owning_schema: route.counterpart_owning_schema,
        dispatch_rpc_name: route.counterpart_dispatch_rpc_name,
        status_rpc_name: route.counterpart_status_rpc_name,
        ack_rpc_name: route.counterpart_ack_rpc_name,
        purpose: route.counterpart_purpose,
        default_action_label: route.counterpart_default_action_label,
        metadata: route.counterpart_metadata,
        route_count: 0,
        sends_route_count: 0,
        receives_route_count: 0,
        routes: [],
      });
    }

    const group = grouped.get(route.counterpart_key);

    group.route_count += 1;
    group.sends_route_count += route.direction === "sends" ? 1 : 0;
    group.receives_route_count += route.direction === "receives" ? 1 : 0;
    group.routes.push({
      route_key: route.route_key,
      flow_name: route.flow_name,
      source_department_key: route.source_department_key,
      target_department_key: route.target_department_key,
      event_code: route.event_code,
      request_method: route.request_method,
      endpoint_path: route.endpoint_path,
      priority: route.priority,
      is_required: route.is_required,
      is_active: route.is_active,
      direction: route.direction,
      notes: route.notes,
      metadata: route.metadata,
    });
  });

  return Array.from(grouped.values())
    .map((connection) => ({
      ...connection,
      ...(eventSummary.countMap.get(connection.department_key) ?? {
        pending_count: 0,
        in_progress_count: 0,
        failed_count: 0,
        completed_count: 0,
      }),
      ...(eventSummary.latestMap.get(connection.department_key) ?? {
        latest_event_id: null,
        latest_route_key: null,
        latest_status: null,
        latest_event_code: null,
        latest_correlation_id: null,
        latest_source_record_id: null,
        latest_created_at: null,
        latest_updated_at: null,
        latest_dispatched_at: null,
        latest_acknowledged_at: null,
        latest_error: null,
      }),
      routes: connection.routes.sort((left, right) => left.priority - right.priority),
    }))
    .sort((left, right) => left.department_name.localeCompare(right.department_name));
}

async function queryRegistrarStudents(db, search, limit) {
  const safeLimit = normalizeLimit(limit, 5, 20);
  const normalizedSearch = String(search ?? "").trim();
  const likeValue = `%${normalizedSearch}%`;
  const { rows } = await db.query(
    `
      select
        student_id,
        student_no,
        student_name,
        program,
        year_level,
        section_name,
        enrollment_status,
        course_year_section,
        email,
        phone,
        subject_count,
        subject_codes,
        subject_load,
        created_at
      from registrar.student_directory
      where $1 = ''
        or student_no ilike $2
        or student_name ilike $2
        or program ilike $2
      order by
        case when student_no = $1 then 0 else 1 end,
        student_name asc
      limit $3
    `,
    [normalizedSearch, likeValue, safeLimit],
  );

  return rows;
}

async function queryRegistrarStudent(db, { studentNo, studentId, sourceRecordId }) {
  const normalizedStudentNo = String(studentNo ?? "").trim();
  const normalizedStudentId = String(studentId ?? sourceRecordId ?? "").trim();

  const { rows } = await db.query(
    `
      select
        student_id,
        student_no,
        student_name,
        program,
        year_level,
        section_name,
        enrollment_status,
        course_year_section,
        email,
        phone,
        subject_count,
        subject_codes,
        subject_load,
        created_at
      from registrar.student_directory
      where ($1 <> '' and student_no = $1)
         or ($2 <> '' and student_id::text = $2)
      order by created_at desc
      limit 1
    `,
    [normalizedStudentNo, normalizedStudentId],
  );

  return rows[0] ?? null;
}

async function queryGuidanceDisciplineFeed(db, limit) {
  const safeLimit = normalizeLimit(limit, 5, 20);
  const { rows } = await db.query(
    `
      select
        id,
        student_id,
        student_name,
        concern,
        action_taken,
        date_recorded,
        status,
        case_reference,
        category,
        priority_level,
        referral_status,
        shared_with,
        synced_at,
        created_at,
        updated_at
      from guidance.guidance
      where coalesce(shared_with, '[]'::jsonb) ? $1
      order by coalesce(date_recorded, created_at) desc, id desc
      limit $2
    `,
    [PREFECT_DEPARTMENT_KEY, safeLimit],
  );

  return rows;
}

async function queryGuidanceDisciplineRecord(db, { id, caseReference, sourceRecordId }) {
  const normalizedId = String(id ?? sourceRecordId ?? "").trim();
  const normalizedCaseReference = String(caseReference ?? "").trim();

  const { rows } = await db.query(
    `
      select
        id,
        student_id,
        student_name,
        concern,
        action_taken,
        date_recorded,
        status,
        case_reference,
        category,
        priority_level,
        referral_status,
        shared_with,
        synced_at,
        created_at,
        updated_at
      from guidance.guidance
      where ($1 <> '' and id::text = $1)
         or ($2 <> '' and case_reference = $2)
      order by updated_at desc
      limit 1
    `,
    [normalizedId, normalizedCaseReference],
  );

  return rows[0] ?? null;
}

async function queryHrConductFeed(db, limit) {
  const safeLimit = normalizeLimit(limit, 5, 20);
  const { rows } = await db.query(
    `
      select
        employee.id as employee_id,
        employee.employee_number,
        employee.employee_type,
        employee.employment_status,
        employee.hire_date,
        profile.first_name,
        profile.last_name,
        coalesce(department.name, 'Unassigned Department') as department_name,
        coalesce(position.title, 'Unassigned Position') as position_title,
        employee.created_at,
        employee.updated_at
      from hr.employees employee
      join hr.profiles profile
        on profile.user_id = employee.user_id
      left join hr.departments department
        on department.id = employee.department_id
      left join hr.positions position
        on position.id = employee.position_id
      order by employee.updated_at desc, employee.created_at desc
      limit $1
    `,
    [safeLimit],
  );

  return rows.map((row) => ({
    ...row,
    employee_name: `${row.first_name} ${row.last_name}`.trim(),
    clearance_status: row.employment_status === "active" ? "cleared" : "review_required",
  }));
}

async function queryHrConductRecord(db, { employeeId, employeeNumber, sourceRecordId }) {
  const normalizedEmployeeId = String(employeeId ?? sourceRecordId ?? "").trim();
  const normalizedEmployeeNumber = String(employeeNumber ?? "").trim();

  const { rows } = await db.query(
    `
      select
        employee.id as employee_id,
        employee.employee_number,
        employee.employee_type,
        employee.employment_status,
        employee.hire_date,
        profile.first_name,
        profile.last_name,
        coalesce(department.name, 'Unassigned Department') as department_name,
        coalesce(position.title, 'Unassigned Position') as position_title,
        employee.created_at,
        employee.updated_at
      from hr.employees employee
      join hr.profiles profile
        on profile.user_id = employee.user_id
      left join hr.departments department
        on department.id = employee.department_id
      left join hr.positions position
        on position.id = employee.position_id
      where ($1 <> '' and employee.id::text = $1)
         or ($2 <> '' and employee.employee_number = $2)
      order by employee.updated_at desc
      limit 1
    `,
    [normalizedEmployeeId, normalizedEmployeeNumber],
  );

  const record = rows[0] ?? null;

  if (!record) {
    return null;
  }

  return {
    ...record,
    employee_name: `${record.first_name} ${record.last_name}`.trim(),
    clearance_status: record.employment_status === "active" ? "cleared" : "review_required",
  };
}

async function queryEventByIdentifiers(db, { eventId, correlationId }) {
  const normalizedEventId = String(eventId ?? "").trim() || null;
  const normalizedCorrelationId = String(correlationId ?? "").trim() || null;

  const { rows } = await db.query(
    `
      select
        event.id,
        event.route_key,
        route.flow_name,
        route.notes as route_notes,
        route.request_method,
        route.endpoint_path,
        event.source_department_key,
        event.target_department_key,
        event.event_code,
        event.status,
        event.correlation_id,
        event.source_record_id,
        event.request_payload,
        event.response_payload,
        event.dispatch_endpoint,
        event.initiated_by,
        event.dispatched_at,
        event.acknowledged_at,
        event.last_error,
        event.metadata,
        event.created_at,
        event.updated_at
      from public.integration_flow_events event
      join public.integration_flow_routes route
        on route.route_key = event.route_key
      where ($1::uuid is not null and event.id = $1::uuid)
         or ($2::text is not null and event.correlation_id = $2::text)
      order by event.created_at desc
      limit 1
    `,
    [normalizedEventId, normalizedCorrelationId],
  );

  return rows[0] ?? null;
}

async function queryInboundEvents(db, limit) {
  const safeLimit = normalizeLimit(limit, 8, 25);
  const { rows } = await db.query(
    `
      select
        event.id,
        event.route_key,
        route.flow_name,
        route.request_method,
        event.source_department_key,
        event.target_department_key,
        'receives' as direction,
        event.source_department_key as counterpart_key,
        event.event_code,
        event.status,
        event.correlation_id,
        event.source_record_id,
        event.request_payload,
        event.response_payload,
        event.dispatch_endpoint,
        event.initiated_by,
        event.dispatched_at,
        event.acknowledged_at,
        event.last_error,
        event.metadata,
        event.created_at,
        event.updated_at
      from public.integration_flow_events event
      join public.integration_flow_routes route
        on route.route_key = event.route_key
      where event.target_department_key = $1
        and event.status not in ('acknowledged', 'completed')
      order by event.created_at desc
      limit $2
    `,
    [PREFECT_DEPARTMENT_KEY, safeLimit],
  );

  return rows;
}

async function querySharedRecords(db, limit) {
  const safeLimit = normalizeLimit(limit, 10, 30);
  const { rows } = await db.query(
    `
      select
        record.id,
        record.clearance_reference,
        record.patient_id,
        record.patient_code,
        record.patient_name,
        record.patient_type,
        record.department_key,
        record.department_name,
        record.stage_order,
        record.status,
        record.remarks,
        record.approver_name,
        record.approver_role,
        record.external_reference,
        record.requested_by,
        record.decided_at,
        record.metadata,
        record.created_at,
        record.updated_at,
        case
          when record.metadata ->> 'source_department' = $1 then 'outbound'
          when record.metadata ->> 'target_department' = $1 then 'inbound'
          when record.department_key = $1 then 'inbound'
          else 'shared'
        end as direction,
        nullif(record.metadata ->> 'source_department', '') as source_department_key,
        nullif(record.metadata ->> 'target_department', '') as target_department_key,
        nullif(record.metadata ->> 'event_code', '') as event_code,
        nullif(record.metadata ->> 'route_key', '') as route_key,
        nullif(record.metadata ->> 'correlation_id', '') as correlation_id
      from prefect.department_clearance_records record
      where record.department_key = $1
         or record.metadata ->> 'source_department' = $1
         or record.metadata ->> 'target_department' = $1
      order by record.updated_at desc, record.created_at desc
      limit $2
    `,
    [PREFECT_DEPARTMENT_KEY, safeLimit],
  );

  return rows;
}

async function updateEventStatus(db, eventId, { status, responsePayload = {}, error = null, acknowledge = false }) {
  const { rows } = await db.query(
    `
      update public.integration_flow_events
      set
        status = $2,
        response_payload = coalesce(response_payload, '{}'::jsonb) || $3::jsonb,
        last_error = $4,
        acknowledged_at = case
          when $5::boolean then coalesce(acknowledged_at, now())
          else acknowledged_at
        end,
        updated_at = now()
      where id = $1::uuid
      returning *
    `,
    [eventId, status, JSON.stringify(responsePayload), error, acknowledge],
  );

  return rows[0] ?? null;
}

async function upsertSharedRecord(db, event, direction, sourceRecord) {
  const payload = event.request_payload ?? {};
  const profileMap = await queryFlowProfiles(db);
  const targetProfile = profileMap.get(event.target_department_key) ?? null;
  const route = await queryRouteByKey(db, event.route_key);

  const patientName =
    firstNonEmpty(
      payload.student_name,
      payload.employee_name,
      payload.patient_name,
      payload.name,
      payload.title,
      sourceRecord?.student_name,
      sourceRecord?.employee_name,
      route?.flow_name,
    ) || "Department Record";

  const remarks =
    firstNonEmpty(
      payload.notes,
      payload.remarks,
      payload.case_summary,
      payload.incident_summary,
      payload.description,
      payload.action_taken,
      payload.concern,
      event.route_notes,
    ) || `${route?.flow_name ?? "Department flow"} synchronized through the shared registry.`;

  const requestedBy =
    firstNonEmpty(
      payload.requested_by,
      payload.requestedBy,
      sourceRecord?.department_name,
      event.source_department_key === PREFECT_DEPARTMENT_KEY ? "Prefect Management" : event.source_department_key,
    ) || "Shared Department Registry";

  const metadata = {
    ...(event.response_payload ?? {}),
    direction,
    source_department: event.source_department_key,
    target_department: event.target_department_key,
    flow_name: event.flow_name,
    route_key: event.route_key,
    event_code: event.event_code,
    correlation_id: event.correlation_id,
    event_id: event.id,
    source_record_id: event.source_record_id,
    source_module: firstNonEmpty(payload.source_module, payload.module, payload.group),
    payload,
    materialized_at: new Date().toISOString(),
  };

  const clearanceReference = buildClearanceReference(event, payload);
  const { rows } = await db.query(
    `
      insert into clinic.department_clearance_records (
        clearance_reference,
        patient_id,
        patient_code,
        patient_name,
        patient_type,
        department_key,
        department_name,
        stage_order,
        status,
        remarks,
        approver_name,
        approver_role,
        external_reference,
        requested_by,
        decided_at,
        metadata
      )
      values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16::jsonb
      )
      on conflict (clearance_reference) do update
      set
        patient_id = excluded.patient_id,
        patient_code = excluded.patient_code,
        patient_name = excluded.patient_name,
        patient_type = excluded.patient_type,
        department_key = excluded.department_key,
        department_name = excluded.department_name,
        stage_order = excluded.stage_order,
        status = excluded.status,
        remarks = excluded.remarks,
        approver_name = excluded.approver_name,
        approver_role = excluded.approver_role,
        external_reference = excluded.external_reference,
        requested_by = excluded.requested_by,
        decided_at = excluded.decided_at,
        metadata = excluded.metadata,
        updated_at = now()
      returning *
    `,
    [
      clearanceReference,
      firstNonEmpty(payload.student_id, payload.employee_id, payload.patient_id, sourceRecord?.student_id, sourceRecord?.employee_id),
      firstNonEmpty(
        payload.student_no,
        payload.employee_number,
        payload.patient_code,
        payload.reference_no,
        payload.referenceNo,
        sourceRecord?.student_no,
        sourceRecord?.employee_number,
        event.source_record_id,
      ),
      patientName,
      inferPatientType({ ...sourceRecord, ...payload }),
      event.target_department_key,
      targetProfile?.department_name ?? event.target_department_key,
      targetProfile?.clearance_stage_order ?? targetProfile?.flow_order ?? 99,
      normalizeRecordStatus(
        firstNonEmpty(payload.status, payload.clearance_status, payload.employment_status, sourceRecord?.status),
        direction === "inbound" ? "acknowledged" : "pending",
      ),
      remarks,
      firstNonEmpty(payload.approver_name, payload.counselor_name, sourceRecord?.employee_name),
      firstNonEmpty(payload.approver_role, payload.position_title, `${event.source_department_key} integration`),
      firstNonEmpty(payload.reference_no, payload.referenceNo, payload.case_reference, event.source_record_id, event.correlation_id),
      requestedBy,
      null,
      JSON.stringify(metadata),
    ],
  );

  return rows[0] ?? null;
}

async function materializeEvent(db, event, { status, acknowledge = false, sourceRecord = null }) {
  const direction = event.source_department_key === PREFECT_DEPARTMENT_KEY ? "outbound" : "inbound";
  const record = await upsertSharedRecord(db, event, direction, sourceRecord);

  await updateEventStatus(db, event.id, {
    status,
    acknowledge,
    responsePayload: {
      materialized_record: serializeSharedRecord(record),
      applied_by: PREFECT_DEPARTMENT_KEY,
      applied_at: new Date().toISOString(),
    },
  });

  return {
    event,
    record,
  };
}

async function createInboundEvent(db, sourceDepartmentKey, eventCode, sourceRecordId, payload) {
  const { rows } = await db.query(
    `
      select public.dispatch_department_flow($1, $2, $3, $4, $5::jsonb, $6::uuid) as result
    `,
    [
      sourceDepartmentKey,
      PREFECT_DEPARTMENT_KEY,
      eventCode,
      sourceRecordId,
      JSON.stringify(payload ?? {}),
      null,
    ],
  );

  const result = rows[0]?.result ?? { ok: false, error: "Inbound dispatch failed." };

  if (!result.ok || !result.event_id) {
    return { result, event: null };
  }

  const event = await queryEventByIdentifiers(db, {
    eventId: result.event_id,
    correlationId: result.correlation_id,
  });

  return { result, event };
}

async function receiveExistingInboundEvent(db, body) {
  const eventId = String(body?.eventId ?? "").trim();
  const correlationId = String(body?.correlationId ?? "").trim();

  if (!eventId && !correlationId) {
    return {
      ok: false,
      error: "eventId or correlationId is required.",
    };
  }

  const event = await queryEventByIdentifiers(db, {
    eventId,
    correlationId,
  });

  if (!event) {
    return {
      ok: false,
      error: "Inbound event was not found.",
    };
  }

  if (event.target_department_key !== PREFECT_DEPARTMENT_KEY) {
    return {
      ok: false,
      error: "Only events targeted to Prefect can be received here.",
    };
  }

  const sourceRecord = event.source_department_key === "guidance"
    ? await queryGuidanceDisciplineRecord(db, {
        sourceRecordId: event.source_record_id,
        caseReference: event.request_payload?.case_reference,
      })
    : event.source_department_key === "registrar"
      ? await queryRegistrarStudent(db, {
          studentNo: event.request_payload?.student_no,
          studentId: event.request_payload?.student_id,
          sourceRecordId: event.source_record_id,
        })
      : event.source_department_key === "hr"
        ? await queryHrConductRecord(db, {
            employeeId: event.request_payload?.employee_id,
            employeeNumber: event.request_payload?.employee_number,
            sourceRecordId: event.source_record_id,
          })
        : null;

  const materialized = await materializeEvent(db, event, {
    status: "acknowledged",
    acknowledge: true,
    sourceRecord,
  });

  return {
    ok: true,
    event_id: event.id,
    correlation_id: event.correlation_id,
    route_key: event.route_key,
    source_department_key: event.source_department_key,
    target_department_key: event.target_department_key,
    event_code: event.event_code,
    status: "acknowledged",
    materialized_record: serializeSharedRecord(materialized.record),
    source_record: sourceRecord,
    message: "Inbound department data was received into Prefect successfully.",
  };
}

async function receiveRegistrarStudentProfile(db, body) {
  const student = await queryRegistrarStudent(db, {
    studentNo: body?.studentNo,
    studentId: body?.studentId,
    sourceRecordId: body?.sourceRecordId,
  });

  if (!student) {
    return {
      ok: false,
      error: "Registrar student record was not found.",
    };
  }

  const payload = {
    student_id: student.student_id,
    student_no: student.student_no,
    student_name: student.student_name,
    program: student.program,
    year_level: student.year_level,
    section_name: student.section_name,
    enrollment_status: student.enrollment_status,
    course_year_section: student.course_year_section,
    subject_count: student.subject_count,
    subject_codes: student.subject_codes,
    subject_load: student.subject_load,
    email: student.email,
    phone: student.phone,
    source_module: "registrar.student_directory",
  };

  const created = await createInboundEvent(
    db,
    "registrar",
    "student_profile_sync",
    `registrar-student-${student.student_id}`,
    payload,
  );

  if (!created.result.ok || !created.event) {
    return created.result;
  }

  const materialized = await materializeEvent(db, created.event, {
    status: "acknowledged",
    acknowledge: true,
    sourceRecord: student,
  });

  return {
    ...created.result,
    status: "acknowledged",
    source_record: student,
    materialized_record: serializeSharedRecord(materialized.record),
    message: "Registrar student profile was received into Prefect successfully.",
  };
}

async function receiveGuidanceDisciplineReport(db, body) {
  const guidanceRecord = await queryGuidanceDisciplineRecord(db, {
    id: body?.id,
    caseReference: body?.caseReference,
    sourceRecordId: body?.sourceRecordId,
  });

  if (!guidanceRecord) {
    return {
      ok: false,
      error: "Guidance discipline report was not found.",
    };
  }

  const payload = {
    student_id: guidanceRecord.student_id,
    student_name: guidanceRecord.student_name,
    title: `Guidance Discipline Follow-up - ${guidanceRecord.student_name}`,
    status: guidanceRecord.status,
    reference_no: guidanceRecord.case_reference,
    notes: guidanceRecord.action_taken,
    case_summary: guidanceRecord.concern,
    counselor_name: "Guidance Office",
    category: guidanceRecord.category,
    priority_level: guidanceRecord.priority_level,
    source_module: "guidance.guidance",
  };

  const created = await createInboundEvent(
    db,
    "guidance",
    "discipline_reports",
    guidanceRecord.case_reference || `guidance-case-${guidanceRecord.id}`,
    payload,
  );

  if (!created.result.ok || !created.event) {
    return created.result;
  }

  const materialized = await materializeEvent(db, created.event, {
    status: "acknowledged",
    acknowledge: true,
    sourceRecord: guidanceRecord,
  });

  // Keep Prefect UI unchanged: after Prefect receives a Guidance report,
  // automatically forward it to PMED using Prefect's existing outbound flow.
  let forwardedToPmed = null;
  try {
    forwardedToPmed = await dispatchDepartmentFlow(db, {
      targetDepartmentKey: "pmed",
      eventCode: "discipline_report",
      sourceRecordId: guidanceRecord.case_reference || `guidance-case-${guidanceRecord.id}`,
      requestedBy: body?.requestedBy ?? null,
      payload: {
        student_id: guidanceRecord.student_id,
        student_name: guidanceRecord.student_name,
        concern: guidanceRecord.concern,
        action_taken: guidanceRecord.action_taken,
        status: guidanceRecord.status,
        complaints_behavior_records: firstNonEmpty(
          body?.complaintsBehaviorRecords,
          body?.complaints_behavior_records,
          guidanceRecord.concern,
        ),
        reference_no: guidanceRecord.case_reference,
        case_reference: guidanceRecord.case_reference,
        title: `Prefect Endorsement - ${guidanceRecord.student_name}`,
        notes: guidanceRecord.action_taken,
        case_summary: guidanceRecord.concern,
        source_module: "prefect.receive_guidance_report",
        source_department: "prefect",
        target_department: "pmed",
      },
    });
  } catch (error) {
    forwardedToPmed = {
      ok: false,
      error: error instanceof Error ? error.message : "Automatic PMED forwarding failed.",
    };
  }

  return {
    ...created.result,
    status: "acknowledged",
    source_record: guidanceRecord,
    materialized_record: serializeSharedRecord(materialized.record),
    forwarded_to_pmed: forwardedToPmed?.ok === true,
    pmed_dispatch_result: forwardedToPmed,
    message:
      forwardedToPmed?.ok === true
        ? "Guidance discipline data was received into Prefect and automatically sent to PMED."
        : "Guidance discipline data was received into Prefect. PMED forwarding needs review.",
  };
}

async function receiveHrConductClearance(db, body) {
  const employee = await queryHrConductRecord(db, {
    employeeId: body?.employeeId,
    employeeNumber: body?.employeeNumber,
    sourceRecordId: body?.sourceRecordId,
  });

  if (!employee) {
    return {
      ok: false,
      error: "HR employee record was not found.",
    };
  }

  const payload = {
    employee_id: employee.employee_id,
    employee_number: employee.employee_number,
    employee_name: employee.employee_name,
    employee_type: employee.employee_type,
    clearance_status: employee.clearance_status,
    reference_no: `HR-${employee.employee_number}`,
    remarks: `HR conduct clearance forwarded for ${employee.employee_name}.`,
    department_name: employee.department_name,
    position_title: employee.position_title,
    source_module: "hr.employees",
  };

  const created = await createInboundEvent(
    db,
    "hr",
    "conduct_clearance",
    employee.employee_number,
    payload,
  );

  if (!created.result.ok || !created.event) {
    return created.result;
  }

  const materialized = await materializeEvent(db, created.event, {
    status: "acknowledged",
    acknowledge: true,
    sourceRecord: employee,
  });

  return {
    ...created.result,
    status: "acknowledged",
    source_record: employee,
    materialized_record: serializeSharedRecord(materialized.record),
    message: "HR conduct clearance was received into Prefect successfully.",
  };
}

async function buildManifest(db) {
  const [department, flowProfile, clearancePreview, routeRows, eventSummary, recentEvents] = await Promise.all([
    queryDepartmentProfile(db),
    queryFlowProfile(db),
    queryClearanceRecords(db, 3),
    queryConnectedRoutes(db),
    queryEventSummaries(db),
    queryRecentEvents(db, 8),
  ]);

  return {
    backend: "postgres",
    schema: "prefect",
    capabilities: [
      "prefect-flow-profile",
      "prefect-clearance-records",
      "prefect-connections",
      "prefect-recent-events",
      "prefect-inbound-events",
      "prefect-shared-records",
      "registrar-student-lookup",
      "guidance-discipline-feed",
      "hr-conduct-feed",
      "dispatch",
      "receive-existing-event",
      "receive-registrar-student",
      "receive-guidance-report",
      "receive-hr-clearance",
      "flow-status",
      "acknowledge",
    ],
    department,
    flowProfile,
    clearancePreview,
    connections: buildConnections(routeRows, eventSummary),
    recentEvents,
  };
}

async function dispatchDepartmentFlow(db, body) {
  const targetDepartmentKey = String(body?.targetDepartmentKey ?? "").trim();
  const eventCode = String(body?.eventCode ?? "").trim() || null;
  const sourceRecordId = String(body?.sourceRecordId ?? "").trim() || null;
  const requestedBy = String(body?.requestedBy ?? "").trim() || null;
  const payload = body?.payload ?? {};

  if (!targetDepartmentKey) {
    return {
      ok: false,
      error: "targetDepartmentKey is required.",
    };
  }

  const { rows } = await db.query(
    `
      select public.dispatch_department_flow($1, $2, $3, $4, $5::jsonb, $6::uuid) as result
    `,
    [
      PREFECT_DEPARTMENT_KEY,
      targetDepartmentKey,
      eventCode,
      sourceRecordId,
      JSON.stringify(payload),
      requestedBy,
    ],
  );

  const result = rows[0]?.result ?? { ok: false, error: "Dispatch failed." };

  if (!result.ok || !result.event_id) {
    return result;
  }

  const event = await queryEventByIdentifiers(db, {
    eventId: result.event_id,
    correlationId: result.correlation_id,
  });

  if (!event) {
    return result;
  }

  const materialized = await materializeEvent(db, event, {
    // For most targets we can consider the handoff complete after we materialize
    // the shared registry record for the target system.
    status: targetDepartmentKey === "pmed" ? "dispatched" : "completed",
    acknowledge: false,
  });

  let pmedForwardResult = null;
  if (targetDepartmentKey === "pmed") {
    try {
      pmedForwardResult = await forwardReportToPmed(event, materialized.record);
      await updateEventStatus(db, event.id, {
        status: "completed",
        responsePayload: {
          pmed_forwarded: true,
          pmed_forwarded_at: new Date().toISOString(),
          pmed_bridge_url: PMED_REPORT_BRIDGE_URL,
          pmed_bridge_response: pmedForwardResult,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "PMED forwarding failed.";
      await updateEventStatus(db, event.id, {
        // Do not fail Prefect dispatch when bridge forwarding is unavailable.
        // The shared record is already materialized and usable by PMED integrations.
        status: "completed",
        responsePayload: {
          pmed_forwarded: false,
          pmed_forward_failed: true,
          pmed_forward_failed_at: new Date().toISOString(),
          pmed_bridge_url: PMED_REPORT_BRIDGE_URL,
          pmed_bridge_error: message,
        },
        error: null,
      });
      pmedForwardResult = {
        ok: false,
        message,
      };
    }
  }

  let clinicForwardResult = null;
  if (targetDepartmentKey === "clinic") {
    try {
      clinicForwardResult = await forwardIncidentReportToClinic(event, materialized.record);
      await updateEventStatus(db, event.id, {
        status: "completed",
        responsePayload: {
          clinic_forwarded: true,
          clinic_forwarded_at: new Date().toISOString(),
          clinic_bridge_url: CLINIC_PREFECT_BRIDGE_URL,
          clinic_bridge_response: clinicForwardResult,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Clinic forwarding failed.";
      await updateEventStatus(db, event.id, {
        status: "completed",
        responsePayload: {
          clinic_forwarded: false,
          clinic_forward_failed: true,
          clinic_forward_failed_at: new Date().toISOString(),
          clinic_bridge_url: CLINIC_PREFECT_BRIDGE_URL,
          clinic_bridge_error: message,
        },
        error: null,
      });
      clinicForwardResult = {
        ok: false,
        message,
      };
    }
  }

  return {
    ...result,
    status: "completed",
    materialized_record: serializeSharedRecord(materialized.record),
    pmed_forwarded: targetDepartmentKey === "pmed" ? pmedForwardResult?.ok === true : false,
    pmed_bridge_response: pmedForwardResult,
    clinic_forwarded: targetDepartmentKey === "clinic" ? clinicForwardResult?.ok === true : false,
    clinic_bridge_response: clinicForwardResult,
    message:
      targetDepartmentKey === "pmed" && pmedForwardResult?.ok === true
        ? "Department flow dispatched, materialized, and forwarded into PMED."
        : targetDepartmentKey === "pmed"
          ? "Department flow dispatched and materialized. PMED bridge forwarding failed, but the report remains recorded."
          : targetDepartmentKey === "clinic" && clinicForwardResult?.ok === true
            ? "Department flow dispatched, materialized, and delivered to Clinic."
            : targetDepartmentKey === "clinic"
              ? "Department flow dispatched and materialized. Clinic HTTP delivery failed; the shared registry record is still available."
        : "Department flow dispatched and materialized into the shared record registry.",
  };
}

async function getFlowStatus(db, eventId, correlationId) {
  const normalizedEventId = String(eventId ?? "").trim() || null;
  const normalizedCorrelationId = String(correlationId ?? "").trim() || null;

  const { rows } = await db.query(
    `
      select public.get_department_flow_status($1::uuid, $2) as result
    `,
    [normalizedEventId, normalizedCorrelationId],
  );

  return rows[0]?.result ?? { ok: false, error: "Status lookup failed." };
}

async function acknowledgeFlow(db, body) {
  const eventId = String(body?.eventId ?? "").trim();
  const status = String(body?.status ?? "acknowledged").trim() || "acknowledged";
  const responsePayload = body?.response ?? {};
  const errorText = String(body?.error ?? "").trim() || null;

  if (!eventId) {
    return {
      ok: false,
      error: "eventId is required.",
    };
  }

  const { rows } = await db.query(
    `
      select public.acknowledge_department_flow($1::uuid, $2, $3::jsonb, $4) as result
    `,
    [eventId, status, JSON.stringify(responsePayload), errorText],
  );

  return rows[0]?.result ?? { ok: false, error: "Acknowledge failed." };
}

export async function handler(event) {
  if (!pool) {
    return json(500, {
      ok: false,
      error: "DATABASE_URL is not configured on the backend.",
    });
  }

  const method = event.httpMethod ?? "GET";
  const requestBody = parseBody(event.body);

  if (event.body && requestBody === null) {
    return json(400, {
      ok: false,
      error: "Request body must be valid JSON.",
    });
  }

  const resource =
    event.queryStringParameters?.resource ??
    requestBody?.resource ??
    "manifest";

  try {
    if (resource === "manifest") {
      const data = await buildManifest(pool);
      return json(200, { ok: true, resource, ...data });
    }

    if (resource === "prefect-flow-profile") {
      const data = await queryFlowProfile(pool);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "prefect-clearance-records") {
      const data = await queryClearanceRecords(pool, event.queryStringParameters?.limit ?? 5);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "prefect-connections") {
      const [routeRows, eventSummary] = await Promise.all([
        queryConnectedRoutes(pool),
        queryEventSummaries(pool),
      ]);

      return json(200, {
        ok: true,
        resource,
        data: buildConnections(routeRows, eventSummary),
      });
    }

    if (resource === "prefect-recent-events") {
      const data = await queryRecentEvents(pool, event.queryStringParameters?.limit ?? 10);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "prefect-inbound-events") {
      const data = await queryInboundEvents(pool, event.queryStringParameters?.limit ?? 10);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "prefect-shared-records") {
      const data = await querySharedRecords(pool, event.queryStringParameters?.limit ?? 12);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "registrar-student-lookup") {
      const data = await queryRegistrarStudents(
        pool,
        event.queryStringParameters?.search ?? "",
        event.queryStringParameters?.limit ?? 5,
      );

      return json(200, { ok: true, resource, data });
    }

    if (resource === "guidance-discipline-feed") {
      const data = await queryGuidanceDisciplineFeed(pool, event.queryStringParameters?.limit ?? 5);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "hr-conduct-feed") {
      const data = await queryHrConductFeed(pool, event.queryStringParameters?.limit ?? 5);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "dispatch") {
      if (method !== "POST") {
        return json(405, { ok: false, error: "dispatch only supports POST." });
      }

      const data = await dispatchDepartmentFlow(pool, requestBody);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "receive-existing-event") {
      if (method !== "POST") {
        return json(405, { ok: false, error: "receive-existing-event only supports POST." });
      }

      const data = await receiveExistingInboundEvent(pool, requestBody);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "receive-registrar-student") {
      if (method !== "POST") {
        return json(405, { ok: false, error: "receive-registrar-student only supports POST." });
      }

      const data = await receiveRegistrarStudentProfile(pool, requestBody);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "receive-guidance-report") {
      if (method !== "POST") {
        return json(405, { ok: false, error: "receive-guidance-report only supports POST." });
      }

      const data = await receiveGuidanceDisciplineReport(pool, requestBody);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "receive-hr-clearance") {
      if (method !== "POST") {
        return json(405, { ok: false, error: "receive-hr-clearance only supports POST." });
      }

      const data = await receiveHrConductClearance(pool, requestBody);
      return json(200, { ok: true, resource, data });
    }

    if (resource === "flow-status") {
      const data = await getFlowStatus(
        pool,
        event.queryStringParameters?.eventId ?? requestBody?.eventId,
        event.queryStringParameters?.correlationId ?? requestBody?.correlationId,
      );
      return json(200, { ok: true, resource, data });
    }

    if (resource === "acknowledge") {
      if (method !== "POST") {
        return json(405, { ok: false, error: "acknowledge only supports POST." });
      }

      const data = await acknowledgeFlow(pool, requestBody);
      return json(200, { ok: true, resource, data });
    }

    return json(400, {
      ok: false,
      error: `Unsupported resource "${resource}".`,
    });
  } catch (error) {
    return json(500, {
      ok: false,
      error: error instanceof Error ? error.message : "Database request failed.",
    });
  }
}
