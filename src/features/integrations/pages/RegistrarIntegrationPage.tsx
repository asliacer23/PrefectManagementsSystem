import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Link2, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPrefectFlowProfile, getPrefectRecentClearanceRecords } from "@/features/integrations/services/registrarIntegrationService";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";

type FlowProfile = Awaited<ReturnType<typeof getPrefectFlowProfile>>;
type ClearanceRecord = Awaited<ReturnType<typeof getPrefectRecentClearanceRecords>>[number];

const STORAGE_KEYS = {
  baseUrl: "prefect.registrar.baseUrl",
  apiKey: "prefect.registrar.apiKey"
};

export default function RegistrarIntegrationPage() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000/api/integrations");
  const [apiKey, setApiKey] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [title, setTitle] = useState("Prefect Discipline Hold");
  const [status, setStatus] = useState("Has Record");
  const [notes, setNotes] = useState("");
  const [responseText, setResponseText] = useState("Registrar responses will appear here.");
  const [busyAction, setBusyAction] = useState("");
  const [flowProfile, setFlowProfile] = useState<FlowProfile | null>(null);
  const [clearanceRecords, setClearanceRecords] = useState<ClearanceRecord[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(true);
  const [schemaError, setSchemaError] = useState("");

  useEffect(() => {
    const storedBaseUrl = window.localStorage.getItem(STORAGE_KEYS.baseUrl);
    const storedApiKey = window.localStorage.getItem(STORAGE_KEYS.apiKey);
    if (storedBaseUrl) setBaseUrl(storedBaseUrl);
    if (storedApiKey) setApiKey(storedApiKey);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.baseUrl, baseUrl);
  }, [baseUrl]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.apiKey, apiKey);
  }, [apiKey]);

  const loadSchemaData = useCallback(async () => {
    setSchemaLoading(true);
    setSchemaError("");
    try {
      const [profile, records] = await Promise.all([
        getPrefectFlowProfile(),
        getPrefectRecentClearanceRecords(),
      ]);
      setFlowProfile(profile);
      setClearanceRecords(records);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Schema lookup failed.";
      setSchemaError(message);
      setFlowProfile(null);
      setClearanceRecords([]);
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSchemaData();
  }, [loadSchemaData]);

  function authHeaders(extra?: HeadersInit) {
    return {
      ...(apiKey ? { "x-integration-key": apiKey } : {}),
      ...extra
    };
  }

  async function runRequest(label: string, input: RequestInfo | URL, init?: RequestInit) {
    setBusyAction(label);
    try {
      const response = await fetch(input, init);
      const payload = await response.json();
      setResponseText(JSON.stringify(payload, null, 2));
    } catch (error) {
      setResponseText(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }, null, 2));
    } finally {
      setBusyAction("");
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Registrar Integration"
        description="Use the Prefect schema views as your live backend source and connect registrar endpoints from one place."
        actions={
          <Button variant="outline" onClick={() => void loadSchemaData()} disabled={schemaLoading}>
            <RefreshCw className={`h-4 w-4 ${schemaLoading ? "animate-spin" : ""}`} />
            Refresh DB
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prefect Schema Flow Profile</CardTitle>
            <CardDescription>Read from `prefect.department_flow_profiles` in Postgres.</CardDescription>
          </CardHeader>
          <CardContent>
            {schemaLoading ? (
              <p className="text-sm text-muted-foreground">Loading prefect.department_flow_profiles...</p>
            ) : schemaError ? (
              <p className="text-sm text-destructive">Unable to read schema data: {schemaError}</p>
            ) : flowProfile ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{flowProfile.department_name}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="text-muted-foreground">Flow Order</span>
                  <span className="font-medium">{flowProfile.flow_order}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <span className="text-muted-foreground">Stage Order</span>
                  <span className="font-medium">{flowProfile.clearance_stage_order}</span>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Receives</p>
                  <p className="mt-1 font-mono text-xs">{JSON.stringify(flowProfile.receives)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Sends</p>
                  <p className="mt-1 font-mono text-xs">{JSON.stringify(flowProfile.sends)}</p>
                </div>
                {flowProfile.notes && (
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="mt-1">{flowProfile.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No Prefect flow profile row was found in the database.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prefect Clearance View</CardTitle>
            <CardDescription>Read from `prefect.department_clearance_records` in Postgres.</CardDescription>
          </CardHeader>
          <CardContent>
            {schemaLoading ? (
              <p className="text-sm text-muted-foreground">Loading prefect.department_clearance_records...</p>
            ) : schemaError ? (
              <p className="text-sm text-destructive">Unable to read schema data: {schemaError}</p>
            ) : clearanceRecords.length ? (
              <div className="space-y-3">
                {clearanceRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{record.patient_name}</p>
                        <p className="text-xs text-muted-foreground">{record.clearance_reference}</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{record.status}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <p>Department: {record.department_name}</p>
                      <p>Stage: {record.stage_order}</p>
                      <p>Patient Type: {record.patient_type}</p>
                      <p>Updated: {new Date(record.updated_at).toLocaleString()}</p>
                    </div>
                    {record.remarks && <p className="mt-2 text-sm">{record.remarks}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No Prefect clearance records were returned from the database view yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Connection Settings</CardTitle>
            <CardDescription>Use the registrar integration base URL and shared API key when Prefect talks to registrar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Registrar API URL
                <Input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="http://localhost:3000/api/integrations" />
              </label>
              <label className="grid gap-2 text-sm">
                Integration API Key
                <Input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Optional shared key" />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Badge>Outgoing</Badge>
                  <span className="text-sm font-medium">Discipline Records</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">`POST {baseUrl}?resource=discipline-records`</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Incoming</Badge>
                  <span className="text-sm font-medium">Student Personal Info</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">`GET {baseUrl}?resource=student-personal-info&student_no=...`</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => runRequest("manifest", `${baseUrl}?resource=manifest`, { headers: authHeaders() })}
                disabled={busyAction !== ""}
              >
                <Link2 className="h-4 w-4" />
                {busyAction === "manifest" ? "Loading..." : "Load Manifest"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  runRequest(
                    "personal-info",
                    `${baseUrl}?resource=student-personal-info&student_no=${encodeURIComponent(studentNo)}`,
                    { headers: authHeaders() }
                  )
                }
                disabled={!studentNo || busyAction !== ""}
              >
                <ShieldAlert className="h-4 w-4" />
                {busyAction === "personal-info" ? "Fetching..." : "Fetch Student Info"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Preview</CardTitle>
            <CardDescription>Live payload preview from the registrar integration API.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="min-h-[380px] overflow-auto rounded-lg bg-muted p-4 text-xs leading-6">{responseText}</pre>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Discipline Record</CardTitle>
          <CardDescription>Push a discipline hold or incident-linked clearance note into registrar from Prefect.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="grid gap-2 text-sm">
              Status
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>Has Record</option>
                <option>Pending</option>
                <option>Cleared</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            Notes
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Incident summary, violation reference, or hold remarks" />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() =>
                runRequest(
                  "discipline-record",
                  baseUrl,
                  {
                    method: "POST",
                    headers: authHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({
                      resource: "discipline-records",
                      student_no: studentNo,
                      reference_no: referenceNo,
                      title,
                      status,
                      notes
                    })
                  }
                )
              }
              disabled={!studentNo || busyAction !== ""}
            >
              <Send className="h-4 w-4" />
              {busyAction === "discipline-record" ? "Sending..." : "Send To Registrar"}
            </Button>

            <a href={baseUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline">
              Open Registrar Endpoint
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
