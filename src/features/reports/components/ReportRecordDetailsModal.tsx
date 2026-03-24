import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { PrefectIntegrationEvent, PrefectSharedRecord } from "@/features/integrations/services/databaseIntegrationService";

function normalizeMetadata(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

type ReportRecordDetailsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: PrefectSharedRecord | null;
  matchedEvent: PrefectIntegrationEvent | null;
  variant?: "sent" | "received";
};

export function ReportRecordDetailsModal({
  open,
  onOpenChange,
  record,
  matchedEvent,
  variant = "sent",
}: ReportRecordDetailsModalProps) {
  const meta = useMemo(() => normalizeMetadata(record?.metadata), [record?.metadata]);
  const innerPayload = meta.payload;
  const payloadObj =
    innerPayload && typeof innerPayload === "object" && !Array.isArray(innerPayload)
      ? (innerPayload as Record<string, unknown>)
      : null;

  const summaryRows: Array<{ label: string; value: string }> = useMemo(() => {
    if (!record) return [];
    const target = record.target_department_key || record.department_name || "—";
    const source = record.source_department_key || "—";
    return [
      { label: "Clearance reference", value: record.clearance_reference || "—" },
      { label: "External reference", value: record.external_reference || "—" },
      { label: "Correlation ID", value: record.correlation_id || "—" },
      { label: "Event code", value: record.event_code || String(meta.event_code ?? "—") },
      { label: "Route key", value: record.route_key || String(meta.route_key ?? "—") },
      { label: "Flow name", value: String(meta.flow_name ?? "—") },
      { label: variant === "sent" ? "Target department" : "Source department", value: variant === "sent" ? target : source },
      { label: variant === "sent" ? "Source department" : "Target department", value: variant === "sent" ? source : target },
      { label: "Patient / subject name", value: record.patient_name || "—" },
      { label: "Patient code", value: record.patient_code || "—" },
      { label: "Patient type", value: record.patient_type || "—" },
      { label: "Registry status", value: record.status || "—" },
      { label: "Remarks", value: record.remarks || "—" },
      { label: "Requested by", value: record.requested_by || "—" },
      { label: "Approver", value: record.approver_name || "—" },
      { label: "Created", value: formatDate(record.created_at) },
      { label: "Updated", value: formatDate(record.updated_at) },
      { label: "Decided at", value: formatDate(record.decided_at) },
    ];
  }, [record, meta, variant]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(100vw-2rem,720px)] max-w-none gap-0 p-0 sm:max-w-none">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="pr-8">
            {variant === "sent" ? "Sent report details" : "Received report details"}
          </DialogTitle>
          <DialogDescription className="text-left">
            Full registry record, original dispatch payload, and linked flow event (when available).
          </DialogDescription>
        </DialogHeader>

        {!record ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">No record selected.</p>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-8rem)]">
            <div className="space-y-4 px-6 py-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{record.direction || "shared"}</Badge>
                {record.event_code ? (
                  <Badge variant="outline" className="font-mono text-xs">
                    {record.event_code}
                  </Badge>
                ) : null}
              </div>

              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="payload">Payload</TabsTrigger>
                  <TabsTrigger value="event">Flow event</TabsTrigger>
                  <TabsTrigger value="raw">All JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="mt-4 space-y-2">
                  <div className="space-y-3 text-sm">
                    {summaryRows.map((row) => (
                      <div
                        key={row.label}
                        className="grid gap-0.5 border-b border-border/60 pb-2 last:border-0 sm:grid-cols-[minmax(140px,36%)_1fr] sm:gap-4"
                      >
                        <div className="text-muted-foreground">{row.label}</div>
                        <div className="break-words font-medium">{row.value}</div>
                      </div>
                    ))}
                  </div>
                  {payloadObj && Object.keys(payloadObj).length > 0 ? (
                    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Key fields from payload
                      </p>
                      <div className="space-y-2 text-sm">
                        {[
                          "title",
                          "notes",
                          "status",
                          "student_no",
                          "student_name",
                          "reference_no",
                          "report_name",
                          "report_type",
                          "generated_at",
                          "total_complaints",
                          "total_incidents",
                          "total_duties",
                          "unresolved_incidents",
                          "pending_complaints",
                          "health_related",
                          "handoff_type",
                        ].map(
                          (key) => {
                            const v = payloadObj[key];
                            if (v === undefined || v === null || v === "") return null;
                            return (
                              <div
                                key={key}
                                className="grid gap-0.5 sm:grid-cols-[minmax(120px,30%)_1fr] sm:gap-3"
                              >
                                <div className="text-muted-foreground">{key.replace(/_/g, " ")}</div>
                                <div className="break-words">{typeof v === "object" ? formatJson(v) : String(v)}</div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="payload" className="mt-4">
                  <pre className="max-h-[320px] overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed">
                    {payloadObj ? formatJson(payloadObj) : "No nested payload on this record (see All JSON)."}
                  </pre>
                </TabsContent>

                <TabsContent value="event" className="mt-4 space-y-3">
                  {matchedEvent ? (
                    <>
                      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">Event status</span>
                          <p className="font-medium">{matchedEvent.status}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Correlation</span>
                          <p className="break-all font-mono text-xs">{matchedEvent.correlation_id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dispatched</span>
                          <p className="font-medium">{formatDate(matchedEvent.dispatched_at)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Acknowledged</span>
                          <p className="font-medium">{formatDate(matchedEvent.acknowledged_at)}</p>
                        </div>
                      </div>
                      {matchedEvent.last_error ? (
                        <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
                          {matchedEvent.last_error}
                        </p>
                      ) : null}
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Request payload</p>
                        <pre className="max-h-[200px] overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
                          {formatJson(matchedEvent.request_payload)}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Response payload</p>
                        <pre className="max-h-[200px] overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs">
                          {formatJson(matchedEvent.response_payload)}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No matching integration flow event in the recent events list. Open &quot;All JSON&quot; for the full
                      stored metadata (includes dispatch payload when materialized).
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="raw" className="mt-4">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Complete <code className="rounded bg-muted px-1">metadata</code> object from the shared registry record.
                  </p>
                  <pre className="max-h-[380px] overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed">
                    {formatJson(meta)}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function findEventForSharedRecord(
  record: PrefectSharedRecord,
  events: PrefectIntegrationEvent[],
): PrefectIntegrationEvent | null {
  const corr = String(record.correlation_id ?? "").trim();
  if (corr) {
    const byCorr = events.find((e) => String(e.correlation_id ?? "").trim() === corr);
    if (byCorr) return byCorr;
  }
  const ref = String(record.clearance_reference ?? "").trim();
  const ext = String(record.external_reference ?? "").trim();
  const src = String(record.patient_code ?? "").trim();

  return (
    events.find((e) => {
      const epayload = (e.request_payload ?? {}) as Record<string, unknown>;
      const pref = String(epayload.reference_no ?? epayload.referenceNo ?? "").trim();
      const pstud = String(epayload.student_no ?? epayload.studentNo ?? "").trim();
      if (ref && (e.source_record_id === ref || pref && ref.includes(pref) || pref === ref)) return true;
      if (ext && (e.source_record_id === ext || pref === ext)) return true;
      if (src && (e.source_record_id === src || pstud === src)) return true;
      return false;
    }) ?? null
  );
}
