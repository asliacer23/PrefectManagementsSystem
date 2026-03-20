const INTEGRATIONS_DB_API_BASE_URL =
  import.meta.env.VITE_INTEGRATIONS_DB_API_BASE_URL || "/api/integrations-hub";

export type IntegrationDirection = "sends" | "receives";

export type PrefectIntegrationRoute = {
  route_key: string;
  flow_name: string;
  source_department_key: string;
  target_department_key: string;
  event_code: string;
  request_method: string;
  endpoint_path: string;
  priority: number;
  is_required: boolean;
  is_active: boolean;
  direction: IntegrationDirection;
  notes: string | null;
  metadata: Record<string, unknown> | null;
};

export type PrefectIntegrationConnection = {
  department_key: string;
  department_name: string;
  system_code: string;
  module_directory: string;
  owning_schema: string;
  dispatch_rpc_name: string;
  status_rpc_name: string;
  ack_rpc_name: string;
  purpose: string;
  default_action_label: string;
  metadata: Record<string, unknown> | null;
  route_count: number;
  sends_route_count: number;
  receives_route_count: number;
  pending_count: number;
  in_progress_count: number;
  failed_count: number;
  completed_count: number;
  latest_event_id: string | null;
  latest_route_key: string | null;
  latest_status: string | null;
  latest_event_code: string | null;
  latest_correlation_id: string | null;
  latest_source_record_id: string | null;
  latest_created_at: string | null;
  latest_updated_at: string | null;
  latest_dispatched_at: string | null;
  latest_acknowledged_at: string | null;
  latest_error: string | null;
  routes: PrefectIntegrationRoute[];
};

export type PrefectIntegrationEvent = {
  id: string;
  route_key: string;
  flow_name: string;
  request_method: string;
  source_department_key: string;
  target_department_key: string;
  direction: IntegrationDirection;
  counterpart_key: string;
  event_code: string;
  status: string;
  correlation_id: string;
  source_record_id: string | null;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  dispatch_endpoint: string;
  initiated_by: string | null;
  dispatched_at: string | null;
  acknowledged_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PrefectFlowProfile = {
  department_key: string;
  department_name: string;
  flow_order: number | null;
  clearance_stage_order: number | null;
  receives: unknown;
  sends: unknown;
  notes: string | null;
  created_at: string;
  updated_at: string;
} | null;

export type PrefectClearanceRecord = {
  id: string;
  department_key: string;
  department_name: string;
  patient_name: string;
  patient_type: string;
  clearance_reference: string;
  external_reference: string | null;
  stage_order: number | null;
  status: string;
  approver_name: string | null;
  approver_role: string | null;
  remarks: string | null;
  requested_by: string | null;
  decided_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type PrefectSharedRecord = {
  id: string | number;
  clearance_reference: string;
  patient_id: string | null;
  patient_code: string | null;
  patient_name: string;
  patient_type: string;
  department_key: string;
  department_name: string;
  stage_order: number | null;
  status: string;
  remarks: string | null;
  approver_name: string | null;
  approver_role: string | null;
  external_reference: string | null;
  requested_by: string | null;
  decided_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  direction: "inbound" | "outbound" | "shared";
  source_department_key: string | null;
  target_department_key: string | null;
  event_code: string | null;
  route_key: string | null;
  correlation_id: string | null;
};

export type RegistrarStudentLookupRecord = {
  student_id: string | number;
  student_no: string;
  student_name: string;
  program: string | null;
  year_level: string | null;
  section_name: string | null;
  enrollment_status: string | null;
  course_year_section: string | null;
  email: string | null;
  phone: string | null;
  subject_count: number;
  subject_codes: string | null;
  subject_load: Array<Record<string, unknown>>;
  created_at: string;
};

export type GuidanceDisciplineFeedRecord = {
  id: string | number;
  student_id: string | null;
  student_name: string;
  concern: string | null;
  action_taken: string | null;
  date_recorded: string | null;
  status: string;
  case_reference: string | null;
  category: string | null;
  priority_level: string | null;
  referral_status: string | null;
  shared_with: unknown;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HrConductFeedRecord = {
  employee_id: string;
  employee_number: string;
  employee_type: string | null;
  employment_status: string | null;
  hire_date: string | null;
  first_name: string;
  last_name: string;
  department_name: string;
  position_title: string;
  created_at: string;
  updated_at: string;
  employee_name: string;
  clearance_status: string;
};

export type PrefectIntegrationManifest = {
  backend: string;
  schema: string;
  capabilities: string[];
  department: Record<string, unknown> | null;
  flowProfile: PrefectFlowProfile;
  clearancePreview: PrefectClearanceRecord[];
  connections: PrefectIntegrationConnection[];
  recentEvents: PrefectIntegrationEvent[];
};

export type DispatchDepartmentFlowInput = {
  targetDepartmentKey: string;
  eventCode?: string;
  sourceRecordId?: string;
  payload?: Record<string, unknown>;
  requestedBy?: string;
};

export type DispatchDepartmentFlowResult = {
  ok: boolean;
  event_id?: string;
  correlation_id?: string;
  route_key?: string;
  source_department_key?: string;
  target_department_key?: string;
  event_code?: string;
  status?: string;
  dispatch_endpoint?: string;
  materialized_record?: PrefectSharedRecord | null;
  source_record?: Record<string, unknown> | null;
  message?: string;
};

export type DepartmentFlowStatusResult = {
  ok: boolean;
  event_id?: string;
  correlation_id?: string;
  route_key?: string;
  flow_name?: string;
  source_department_key?: string;
  target_department_key?: string;
  event_code?: string;
  status?: string;
  dispatch_endpoint?: string;
  source_record_id?: string | null;
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
  initiated_by?: string | null;
  dispatched_at?: string | null;
  acknowledged_at?: string | null;
  last_error?: string | null;
  created_at?: string;
  updated_at?: string;
  message?: string;
};

async function request<T>(
  resource: string,
  options?: {
    method?: "GET" | "POST";
    params?: Record<string, string>;
    body?: Record<string, unknown>;
  },
) {
  const url = new URL(INTEGRATIONS_DB_API_BASE_URL, window.location.origin);
  url.searchParams.set("resource", resource);

  Object.entries(options?.params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: options?.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options?.body ? JSON.stringify({ resource, ...options.body }) : undefined,
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Database integration request failed.");
  }

  return payload as T;
}

export async function getPrefectFlowProfileFromDatabase() {
  const payload = await request<{ data: PrefectFlowProfile }>("prefect-flow-profile");
  return payload.data;
}

export async function getPrefectRecentClearanceRecordsFromDatabase(limit = 5) {
  const payload = await request<{ data: PrefectClearanceRecord[] }>("prefect-clearance-records", {
    params: { limit: String(limit) },
  });
  return payload.data;
}

export async function getPrefectConnectedDepartmentsFromDatabase() {
  const payload = await request<{ data: PrefectIntegrationConnection[] }>("prefect-connections");
  return payload.data;
}

export async function getPrefectRecentIntegrationEventsFromDatabase(limit = 10) {
  const payload = await request<{ data: PrefectIntegrationEvent[] }>("prefect-recent-events", {
    params: { limit: String(limit) },
  });
  return payload.data;
}

export async function lookupRegistrarStudentsFromDatabase(search = "", limit = 5) {
  const payload = await request<{ data: RegistrarStudentLookupRecord[] }>("registrar-student-lookup", {
    params: {
      search,
      limit: String(limit),
    },
  });

  return payload.data;
}

export async function getGuidanceDisciplineFeedFromDatabase(limit = 5) {
  const payload = await request<{ data: GuidanceDisciplineFeedRecord[] }>("guidance-discipline-feed", {
    params: { limit: String(limit) },
  });

  return payload.data;
}

export async function getHrConductFeedFromDatabase(limit = 5) {
  const payload = await request<{ data: HrConductFeedRecord[] }>("hr-conduct-feed", {
    params: { limit: String(limit) },
  });

  return payload.data;
}

export async function getPrefectInboundEventsFromDatabase(limit = 8) {
  const payload = await request<{ data: PrefectIntegrationEvent[] }>("prefect-inbound-events", {
    params: { limit: String(limit) },
  });

  return payload.data;
}

export async function getPrefectSharedRecordsFromDatabase(limit = 10) {
  const payload = await request<{ data: PrefectSharedRecord[] }>("prefect-shared-records", {
    params: { limit: String(limit) },
  });

  return payload.data;
}

export async function dispatchPrefectDepartmentFlowFromDatabase(input: DispatchDepartmentFlowInput) {
  const payload = await request<{ data: DispatchDepartmentFlowResult }>("dispatch", {
    method: "POST",
    body: input,
  });

  return payload.data;
}

export async function getDepartmentFlowStatusFromDatabase(eventId?: string, correlationId?: string) {
  const params: Record<string, string> = {};

  if (eventId) params.eventId = eventId;
  if (correlationId) params.correlationId = correlationId;

  const payload = await request<{ data: DepartmentFlowStatusResult }>("flow-status", {
    params,
  });

  return payload.data;
}

export async function acknowledgeDepartmentFlowFromDatabase(input: {
  eventId: string;
  status?: string;
  response?: Record<string, unknown>;
  error?: string;
}) {
  const payload = await request<{ data: DepartmentFlowStatusResult }>("acknowledge", {
    method: "POST",
    body: input,
  });

  return payload.data;
}

export async function getIntegrationDatabaseManifest() {
  return request<PrefectIntegrationManifest>("manifest");
}

export async function receiveRegistrarStudentProfileFromDatabase(input: {
  studentNo?: string;
  studentId?: string | number;
  sourceRecordId?: string;
}) {
  const payload = await request<{ data: DispatchDepartmentFlowResult }>("receive-registrar-student", {
    method: "POST",
    body: input as Record<string, unknown>,
  });

  return payload.data;
}

export async function receiveGuidanceDisciplineReportFromDatabase(input: {
  id?: string | number;
  caseReference?: string;
  sourceRecordId?: string;
}) {
  const payload = await request<{ data: DispatchDepartmentFlowResult }>("receive-guidance-report", {
    method: "POST",
    body: input as Record<string, unknown>,
  });

  return payload.data;
}

export async function receiveHrConductClearanceFromDatabase(input: {
  employeeId?: string;
  employeeNumber?: string;
  sourceRecordId?: string;
}) {
  const payload = await request<{ data: DispatchDepartmentFlowResult }>("receive-hr-clearance", {
    method: "POST",
    body: input as Record<string, unknown>,
  });

  return payload.data;
}

export async function receiveExistingInboundEventFromDatabase(input: {
  eventId?: string;
  correlationId?: string;
}) {
  const payload = await request<{ data: DispatchDepartmentFlowResult }>("receive-existing-event", {
    method: "POST",
    body: input as Record<string, unknown>,
  });

  return payload.data;
}
