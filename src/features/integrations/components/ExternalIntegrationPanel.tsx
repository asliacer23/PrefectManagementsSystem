import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowUpRight, Building2, CheckCircle2, Database, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Mode = "fetch" | "post";

type IntegrationActionInput = {
  studentNo: string;
  studentName: string;
  referenceNo: string;
  title: string;
  notes: string;
  status: string;
  reasonCategory?: string;
  requestNote?: string;
  selectedEmployee?: {
    employeeId: string;
    employeeNumber: string;
    employeeName: string;
    departmentName: string;
    positionTitle: string;
  } | null;
};

type IntegrationAction = {
  key: string;
  title: string;
  description: string;
  badge: string;
  mode: Mode;
  endpointLabel: string;
  run?: (input: IntegrationActionInput) => Promise<unknown>;
  buildRequest?: (studentNo: string, studentName: string, referenceNo: string, title: string, notes: string, status: string) => {
    url?: string;
    init?: RequestInit;
    body?: Record<string, unknown>;
  };
};

type SummaryRecord = {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
};

type SummaryState = {
  status: "idle" | "success" | "error";
  title: string;
  message: string;
  items: Array<{ label: string; value: string }>;
  records: SummaryRecord[];
  technicalDetails: string;
};

type SentLogRecord = {
  key: string;
  department: string;
  studentNo: string;
  studentName: string;
  title: string;
  status: string;
  reference: string;
  correlationId: string;
  sentAt: string;
};

function getRecordTitle(record: Record<string, unknown>) {
  return String(
    record.student_name ??
      record.patient_name ??
      record.employee_name ??
      record.title ??
      record.flow_name ??
      record.clearance_reference ??
      record.reference_no ??
      "Record",
  );
}

function getRecordSubtitle(record: Record<string, unknown>) {
  return String(
    record.student_no ??
      record.patient_code ??
      record.employee_number ??
      record.case_reference ??
      record.correlation_id ??
      "",
  );
}

function getRecordMeta(record: Record<string, unknown>) {
  return String(
    record.program ??
      record.department_name ??
      record.status ??
      record.enrollment_status ??
      record.position_title ??
      "",
  );
}

function summarizePayload(action: IntegrationAction, payload: unknown): SummaryState {
  const technicalDetails = JSON.stringify(payload, null, 2);
  const normalized = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const records = Array.isArray(normalized.records) ? normalized.records : [];
  const materializedRecord =
    normalized.materialized_record && typeof normalized.materialized_record === "object"
      ? (normalized.materialized_record as Record<string, unknown>)
      : null;

  if (normalized.ok === false || normalized.error) {
    return {
      status: "error",
      title: `${action.badge} request failed`,
      message: String(normalized.message ?? normalized.error ?? "The department action could not be completed."),
      items: [],
      records: [],
      technicalDetails,
    };
  }

  if (records.length > 0) {
    return {
      status: "success",
      title: `${records.length} record${records.length === 1 ? "" : "s"} ready from ${action.badge}`,
      message:
        action.mode === "fetch"
          ? `The connected ${action.badge} feed returned live records for this request.`
          : `The connected ${action.badge} route returned record data successfully.`,
      items: [
        { label: "Department", value: action.badge },
        { label: "Source", value: String(normalized.source ?? "Shared database route") },
      ],
      records: records.slice(0, 5).map((entry) => {
        const record = (entry ?? {}) as Record<string, unknown>;
        return {
          title: getRecordTitle(record),
          subtitle: getRecordSubtitle(record),
          meta: getRecordMeta(record),
        };
      }),
      technicalDetails,
    };
  }

  if (materializedRecord) {
    return {
      status: "success",
      title: `Sent to ${action.badge}`,
      message: String(
        normalized.message ??
          `${action.title} was sent through the connected ${action.badge} department route.`,
      ),
      items: [
        { label: "Department", value: action.badge },
        { label: "Flow Status", value: String(normalized.status ?? "sent") },
        {
          label: "Reference",
          value: String(materializedRecord.clearance_reference ?? normalized.correlation_id ?? "Generated"),
        },
        {
          label: "Record",
          value: String(materializedRecord.patient_name ?? materializedRecord.department_name ?? action.title),
        },
      ],
      records: [],
      technicalDetails,
    };
  }

  if (normalized.ok) {
    return {
      status: "success",
      title: action.mode === "fetch" ? `Fetched from ${action.badge}` : `Sent to ${action.badge}`,
      message: String(
        normalized.message ??
          (action.mode === "fetch"
            ? `The connected ${action.badge} department returned a response.`
            : `The data was sent to the connected ${action.badge} department.`),
      ),
      items: [
        { label: "Department", value: action.badge },
        { label: "Flow Status", value: String(normalized.status ?? "completed") },
        { label: "Correlation", value: String(normalized.correlation_id ?? "Available in technical details") },
      ],
      records: [],
      technicalDetails,
    };
  }

  return {
    status: "idle",
    title: "No activity yet",
    message: "Choose a connected department action to fetch or send data.",
    items: [],
    records: [],
    technicalDetails,
  };
}

export function ExternalIntegrationPanel({
  title,
  description,
  baseUrl,
  apiKey,
  actions,
  onActionComplete,
  resolveStudentName,
  fetchHrEmployees,
}: {
  title: string;
  description: string;
  baseUrl: string;
  apiKey: string;
  actions: IntegrationAction[];
  onActionComplete?: (action: IntegrationAction, payload: unknown) => void | Promise<void>;
  resolveStudentName?: (studentId: string) => Promise<string | null>;
  fetchHrEmployees?: () => Promise<
    Array<{
      employeeId: string;
      employeeNumber: string;
      employeeName: string;
      departmentName: string;
      positionTitle: string;
    }>
  >;
}) {
  const [studentNo, setStudentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Pending");
  const [selectedAction, setSelectedAction] = useState<IntegrationAction | null>(null);
  const [isResolvingStudentName, setIsResolvingStudentName] = useState(false);
  const [summary, setSummary] = useState<SummaryState>({
    status: "idle",
    title: "No activity yet",
    message: "Choose a connected department action to fetch or send data.",
    items: [],
    records: [],
    technicalDetails: "",
  });
  const [sentLogs, setSentLogs] = useState<SentLogRecord[]>([]);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const isEmployeeRequestAction = selectedAction?.key === "employee-request-hr";
  const [reasonCategory, setReasonCategory] = useState("Lack of Manpower");
  const [requestNote, setRequestNote] = useState("");
  const [hrEmployees, setHrEmployees] = useState<
    Array<{
      employeeId: string;
      employeeNumber: string;
      employeeName: string;
      departmentName: string;
      positionTitle: string;
    }>
  >([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [isLoadingHrEmployees, setIsLoadingHrEmployees] = useState(false);

  const selectedEmployee = useMemo(
    () => hrEmployees.find((employee) => employee.employeeId === selectedEmployeeId) ?? null,
    [hrEmployees, selectedEmployeeId]
  );

  const authHeaders = useMemo(
    () => ({
      ...(apiKey ? { "x-integration-key": apiKey } : {}),
    }),
    [apiKey]
  );

  async function runAction(action: IntegrationAction) {
    setBusyKey(action.key);
    try {
      const input = {
        studentNo: selectedEmployee?.employeeNumber || studentNo,
        studentName: selectedEmployee?.employeeName || studentName,
        referenceNo,
        title: entryTitle,
        notes: isEmployeeRequestAction ? requestNote : notes,
        status,
        reasonCategory: isEmployeeRequestAction ? reasonCategory : undefined,
        requestNote: isEmployeeRequestAction ? requestNote : undefined,
        selectedEmployee,
      };

      if (action.run) {
        const payload = await action.run(input);
        const nextSummary = summarizePayload(action, payload);
        setSummary(nextSummary);
        setShowTechnicalDetails(false);
        const normalized = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
        if (action.mode === "post" && normalized.ok !== false) {
          setSentLogs((current) => [
            {
              key: `${action.key}-${Date.now()}`,
              department: action.badge,
              studentNo: studentNo || "Not set",
              studentName: studentName || "Not set",
              title: entryTitle || action.title,
              status: String(normalized.status ?? status),
              reference: referenceNo || String(normalized.event_id ?? "Generated"),
              correlationId: String(normalized.correlation_id ?? "N/A"),
              sentAt: new Date().toISOString(),
            },
            ...current,
          ].slice(0, 10));
        }
        await onActionComplete?.(action, payload);
        toast.success(nextSummary.title);
        setActionModalOpen(false);
        return;
      }

      const request = action.buildRequest?.(studentNo, studentName, referenceNo, entryTitle, notes, status);

      if (!request) {
        throw new Error("No integration action is configured for this entry.");
      }

      if (request.url) {
        const response = await fetch(request.url, {
          credentials: "same-origin",
          ...(request.init ?? {}),
          headers: {
            ...authHeaders,
            ...((request.init?.headers as HeadersInit | undefined) ?? {}),
          },
        });
        const payload = await response.json();
        const nextSummary = summarizePayload(action, payload);
        setSummary(nextSummary);
        setShowTechnicalDetails(false);
        const normalized = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
        if (action.mode === "post" && normalized.ok !== false) {
          setSentLogs((current) => [
            {
              key: `${action.key}-${Date.now()}`,
              department: action.badge,
              studentNo: studentNo || "Not set",
              studentName: studentName || "Not set",
              title: entryTitle || action.title,
              status: String(normalized.status ?? status),
              reference: referenceNo || String(normalized.event_id ?? "Generated"),
              correlationId: String(normalized.correlation_id ?? "N/A"),
              sentAt: new Date().toISOString(),
            },
            ...current,
          ].slice(0, 10));
        }
        await onActionComplete?.(action, payload);
        toast.success(nextSummary.title);
        setActionModalOpen(false);
      }
    } catch (error) {
      const errorSummary = summarizePayload(action, {
        ok: false,
        error: error instanceof Error ? error.message : "Request failed.",
      });
      setSummary(errorSummary);
      setShowTechnicalDetails(false);
      toast.error(errorSummary.message);
    } finally {
      setBusyKey("");
    }
  }

  useEffect(() => {
    const trimmedStudentNo = studentNo.trim();
    if (!resolveStudentName || trimmedStudentNo.length < 4) return;

    const timer = window.setTimeout(async () => {
      try {
        setIsResolvingStudentName(true);
        const resolvedName = await resolveStudentName(trimmedStudentNo);
        if (resolvedName && !studentName.trim()) {
          setStudentName(resolvedName);
        }
      } catch {
        // Silent fail to avoid blocking manual entry.
      } finally {
        setIsResolvingStudentName(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [studentNo, studentName, resolveStudentName]);

  const hasEmployeeRequestAction = useMemo(
    () => actions.some((action) => action.key === "employee-request-hr"),
    [actions]
  );

  useEffect(() => {
    if (!hasEmployeeRequestAction || !fetchHrEmployees) {
      return;
    }

    let active = true;
    void (async () => {
      try {
        setIsLoadingHrEmployees(true);
        const employees = await fetchHrEmployees();
        if (!active) return;
        setHrEmployees(employees);
      } catch {
        if (!active) return;
        setHrEmployees([]);
        toast.error("Unable to load HR employee list.");
      } finally {
        if (active) setIsLoadingHrEmployees(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [hasEmployeeRequestAction, fetchHrEmployees]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {actions.map((action) => (
              <div key={action.key} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{action.badge}</Badge>
                  <span className="text-sm font-medium">{action.title}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">Connected route: {action.endpointLabel}</p>
                {action.key === "employee-request-hr" ? (
                  <div className="mt-3 grid gap-2 text-sm">
                    <label className="grid gap-2">
                      Prefect Staff
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedEmployeeId}
                        onChange={(event) => setSelectedEmployeeId(event.target.value)}
                        disabled={isLoadingHrEmployees}
                      >
                        <option value="">
                          {isLoadingHrEmployees ? "Loading Prefect staff..." : "Select Prefect staff"}
                        </option>
                        {hrEmployees.map((employee) => (
                          <option key={employee.employeeId} value={employee.employeeId}>
                            {employee.employeeName} ({employee.employeeNumber}) - {employee.positionTitle}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button
                    onClick={() => {
                      setSelectedAction(action);
                      setActionModalOpen(true);
                    }}
                    disabled={busyKey !== "" || (action.key === "employee-request-hr" && !selectedEmployeeId)}
                    size="sm"
                  >
                    {action.mode === "fetch" ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {busyKey === action.key ? "Running..." : action.mode === "fetch" ? "Open Fetch Modal" : "Open Send Modal"}
                  </Button>
                  {action.buildRequest ? (
                    <a
                      href={action.buildRequest(studentNo, studentName, referenceNo, entryTitle, notes, status).url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                    >
                      Open Endpoint
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div
              className={`rounded-xl border p-4 ${
                summary.status === "error"
                  ? "border-destructive/30 bg-destructive/5"
                  : summary.status === "success"
                    ? "border-success/30 bg-success/5"
                    : "border-border bg-muted/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {summary.status === "error" ? (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  ) : summary.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Database className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{summary.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{summary.message}</p>
                </div>
              </div>
            </div>

            {summary.items.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {summary.items.map((item) => (
                  <div key={`${item.label}-${item.value}`} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                    <p className="mt-2 text-sm font-medium break-words">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {summary.records.length > 0 ? (
              <div className="mt-4 space-y-3">
                {summary.records.map((record, index) => (
                  <div key={`${record.title}-${index}`} className="rounded-lg border border-border p-3">
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{record.title}</p>
                        {record.subtitle ? <p className="mt-1 text-xs text-muted-foreground">{record.subtitle}</p> : null}
                        {record.meta ? <p className="mt-1 text-xs text-muted-foreground">{record.meta}</p> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {summary.technicalDetails ? (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTechnicalDetails((current) => !current)}
                >
                  {showTechnicalDetails ? "Hide Technical Details" : "Show Technical Details"}
                </Button>
                {showTechnicalDetails ? (
                  <pre className="mt-3 min-h-[220px] overflow-auto rounded-lg bg-muted p-4 text-xs leading-6">
                    {summary.technicalDetails}
                  </pre>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 rounded-lg border border-border">
              <div className="border-b border-border px-3 py-2 text-sm font-medium">Successful Send Records</div>
              <div className="max-h-56 overflow-auto p-3">
                {sentLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No successful send records yet.</p>
                ) : (
                  <div className="space-y-2">
                    {sentLogs.map((record) => (
                      <div key={record.key} className="rounded-md border border-border p-2 text-xs">
                        <p className="font-medium">{record.title}</p>
                        <p className="text-muted-foreground">
                          {record.department} | {record.studentNo} - {record.studentName}
                        </p>
                        <p className="text-muted-foreground">
                          Ref: {record.reference} | Status: {record.status} | {new Date(record.sentAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>{selectedAction?.title ?? "Department Action"}</DialogTitle>
              <DialogDescription>
                {isEmployeeRequestAction
                  ? `Fill in employee request details before dispatching to ${selectedAction?.badge ?? "department"}.`
                  : `Fill in report details before dispatching to ${selectedAction?.badge ?? "department"}.`}
              </DialogDescription>
            </DialogHeader>
            <div className={`grid gap-4 md:grid-cols-2 ${baseUrl ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
              {!isEmployeeRequestAction ? (
                <>
                  <label className="grid gap-2 text-sm">
                    Student ID
                    <Input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="2025-0001" />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Student Name
                    <Input value={studentName} onChange={(event) => setStudentName(event.target.value)} placeholder="Juan Dela Cruz" />
                    {isResolvingStudentName ? <span className="text-xs text-muted-foreground">Looking up student name...</span> : null}
                  </label>
                </>
              ) : null}
              {!isEmployeeRequestAction ? (
                <>
                  <label className="grid gap-2 text-sm">
                    Reference No
                    <Input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} placeholder="PREF-2026-001" />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Title
                    <Input value={entryTitle} onChange={(event) => setEntryTitle(event.target.value)} placeholder="Discipline Hold" />
                  </label>
                  <label className="grid gap-2 text-sm">
                    Status
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
                      <option>Pending</option>
                      <option>Has Record</option>
                      <option>Cleared</option>
                    </select>
                  </label>
                </>
              ) : null}
              {baseUrl ? (
                <label className="grid gap-2 text-sm">
                  API Base URL
                  <Input value={baseUrl} readOnly />
                </label>
              ) : null}
            </div>
            {isEmployeeRequestAction ? (
              <label className="grid gap-2 text-sm">
                Reason Category
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={reasonCategory}
                  onChange={(event) => setReasonCategory(event.target.value)}
                >
                  <option>Lack of Manpower</option>
                  <option>Employee Absence</option>
                  <option>Workload Increase</option>
                  <option>Peak Season / High Demand</option>
                  <option>Replacement Request</option>
                  <option>New Position Requirement</option>
                  <option>Temporary Assignment</option>
                  <option>Overtime Support Needed</option>
                  <option>Special Project Assignment</option>
                  <option>Other</option>
                </select>
              </label>
            ) : null}
            <label className="grid gap-2 text-sm">
              {isEmployeeRequestAction ? "Note (Why needed)" : "Notes"}
              <Textarea
                value={isEmployeeRequestAction ? requestNote : notes}
                onChange={(event) =>
                  isEmployeeRequestAction ? setRequestNote(event.target.value) : setNotes(event.target.value)
                }
                placeholder={
                  isEmployeeRequestAction
                    ? "Explain why this employee request is needed"
                    : "Integration note or summary"
                }
              />
            </label>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionModalOpen(false)} disabled={busyKey !== ""}>
                Cancel
              </Button>
              <Button
                onClick={() => selectedAction && void runAction(selectedAction)}
                disabled={
                  !selectedAction ||
                  busyKey !== "" ||
                  (isEmployeeRequestAction &&
                    (!selectedEmployeeId || !reasonCategory.trim() || !requestNote.trim()))
                }
              >
                {busyKey && selectedAction && busyKey === selectedAction.key ? "Running..." : "Confirm Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
