import { useMemo, useState } from "react";
import { AlertCircle, ArrowUpRight, Building2, CheckCircle2, Database, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Mode = "fetch" | "post";

type IntegrationActionInput = {
  studentNo: string;
  referenceNo: string;
  title: string;
  notes: string;
  status: string;
};

type IntegrationAction = {
  key: string;
  title: string;
  description: string;
  badge: string;
  mode: Mode;
  endpointLabel: string;
  run?: (input: IntegrationActionInput) => Promise<unknown>;
  buildRequest?: (studentNo: string, referenceNo: string, title: string, notes: string, status: string) => {
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
}: {
  title: string;
  description: string;
  baseUrl: string;
  apiKey: string;
  actions: IntegrationAction[];
  onActionComplete?: (action: IntegrationAction, payload: unknown) => void | Promise<void>;
}) {
  const [studentNo, setStudentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Pending");
  const [summary, setSummary] = useState<SummaryState>({
    status: "idle",
    title: "No activity yet",
    message: "Choose a connected department action to fetch or send data.",
    items: [],
    records: [],
    technicalDetails: "",
  });
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [busyKey, setBusyKey] = useState("");

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
        studentNo,
        referenceNo,
        title: entryTitle,
        notes,
        status,
      };

      if (action.run) {
        const payload = await action.run(input);
        const nextSummary = summarizePayload(action, payload);
        setSummary(nextSummary);
        setShowTechnicalDetails(false);
        await onActionComplete?.(action, payload);
        toast.success(nextSummary.title);
        return;
      }

      const request = action.buildRequest?.(studentNo, referenceNo, entryTitle, notes, status);

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
        await onActionComplete?.(action, payload);
        toast.success(nextSummary.title);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`grid gap-4 md:grid-cols-2 ${baseUrl ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}>
          <label className="grid gap-2 text-sm">
            Student Number
            <Input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="2025-0001" />
          </label>
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
              <option>Completed</option>
              <option>Has Record</option>
              <option>Cleared</option>
            </select>
          </label>
          {baseUrl ? (
            <label className="grid gap-2 text-sm">
              API Base URL
              <Input value={baseUrl} readOnly />
            </label>
          ) : null}
        </div>

        <label className="grid gap-2 text-sm">
          Notes
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Integration note or summary" />
        </label>

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
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button onClick={() => runAction(action)} disabled={busyKey !== ""} size="sm">
                    {action.mode === "fetch" ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {busyKey === action.key ? "Running..." : action.mode === "fetch" ? "Fetch" : "Send"}
                  </Button>
                  {action.buildRequest ? (
                    <a
                      href={action.buildRequest(studentNo, referenceNo, entryTitle, notes, status).url}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
