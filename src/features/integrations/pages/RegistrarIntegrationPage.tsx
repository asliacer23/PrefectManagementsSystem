import { useEffect, useMemo, useState } from "react";
import { Database, RefreshCw, Search, Send } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  dispatchPrefectDepartmentFlowFromDatabase,
  getDepartmentFlowStatusFromDatabase,
  getIntegrationDatabaseManifest,
  lookupRegistrarStudentsFromDatabase,
  receiveRegistrarStudentProfileFromDatabase,
  type PrefectIntegrationManifest,
  type RegistrarStudentLookupRecord,
} from "../services/databaseIntegrationService";

function formatDateTime(value: string | null) {
  if (!value) return "No activity yet";
  return new Date(value).toLocaleString();
}

export default function RegistrarIntegrationPage() {
  const { user } = useAuth();
  const [manifest, setManifest] = useState<PrefectIntegrationManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState<RegistrarStudentLookupRecord[]>([]);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [studentNo, setStudentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [title, setTitle] = useState("Prefect Discipline Record");
  const [status, setStatus] = useState("Has Record");
  const [notes, setNotes] = useState("");
  const [trackedEventId, setTrackedEventId] = useState("");
  const [trackedCorrelationId, setTrackedCorrelationId] = useState("");
  const [responseText, setResponseText] = useState("Registrar integration responses will appear here.");
  const [busyAction, setBusyAction] = useState("");

  async function loadManifest(silent = false) {
    if (!silent) {
      setLoading(true);
    }

    try {
      const payload = await getIntegrationDatabaseManifest();
      setManifest(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load registrar integration data.";
      toast.error(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void loadManifest();
  }, []);

  const registrarConnection = useMemo(
    () => manifest?.connections.find((connection) => connection.department_key === "registrar") ?? null,
    [manifest],
  );

  async function handleLookup() {
    setLookupBusy(true);
    try {
      const records = await lookupRegistrarStudentsFromDatabase(studentSearch, 8);
      setStudents(records);
      setResponseText(
        JSON.stringify(
          {
            ok: true,
            source: "registrar.student_directory",
            count: records.length,
            search: studentSearch,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registrar lookup failed.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setLookupBusy(false);
    }
  }

  async function handleDispatch() {
    setBusyAction("dispatch");
    try {
      const result = await dispatchPrefectDepartmentFlowFromDatabase({
        targetDepartmentKey: "registrar",
        eventCode: "discipline_records",
        sourceRecordId: referenceNo || studentNo || "registrar-dispatch",
        requestedBy: user?.id,
        payload: {
          student_no: studentNo,
          reference_no: referenceNo,
          title,
          status,
          notes,
          source_module: "registrar_integration",
          dispatched_at: new Date().toISOString(),
        },
      });

      setTrackedEventId(result.event_id ?? "");
      setTrackedCorrelationId(result.correlation_id ?? "");
      setResponseText(JSON.stringify(result, null, 2));
      await loadManifest(true);

      if (result.ok) {
        toast.success("Registrar dispatch queued.");
      } else {
        toast.error(result.message || "Registrar dispatch could not be queued.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registrar dispatch failed.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setBusyAction("");
    }
  }

  async function handleReceiveStudent(student: RegistrarStudentLookupRecord) {
    setBusyAction(`receive-${student.student_no}`);
    try {
      const result = await receiveRegistrarStudentProfileFromDatabase({
        studentNo: student.student_no,
        studentId: student.student_id,
        sourceRecordId: `registrar-student-${student.student_id}`,
      });

      setTrackedEventId(result.event_id ?? "");
      setTrackedCorrelationId(result.correlation_id ?? "");
      setStudentNo(student.student_no);
      setTitle(`Prefect Student Profile Sync - ${student.student_name}`);
      setResponseText(JSON.stringify(result, null, 2));
      await loadManifest(true);

      if (result.ok) {
        toast.success("Registrar student profile received into Prefect.");
      } else {
        toast.error(result.message || "Registrar student profile could not be received.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registrar receive failed.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setBusyAction("");
    }
  }

  async function handleStatusRefresh() {
    if (!trackedEventId && !trackedCorrelationId) {
      toast.error("Dispatch to Registrar first or enter a tracked event.");
      return;
    }

    setBusyAction("status");
    try {
      const result = await getDepartmentFlowStatusFromDatabase(
        trackedEventId || undefined,
        trackedCorrelationId || undefined,
      );
      setResponseText(JSON.stringify(result, null, 2));
      await loadManifest(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to fetch Registrar flow status.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setBusyAction("");
    }
  }

  const flowProfile = manifest?.flowProfile ?? null;
  const clearancePreview = manifest?.clearancePreview ?? [];

  return (
    <AppLayout>
      <PageHeader
        title="Registrar Integration"
        description="Registrar student directory access plus Prefect send and receive flows backed by the shared PostgreSQL department registry."
        actions={
          <Button variant="outline" onClick={() => void loadManifest()} disabled={loading || busyAction !== "" || lookupBusy}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Prefect Flow Profile</CardTitle>
            <CardDescription>Read from `prefect.department_flow_profiles` in the shared database.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading flow profile...</p>
            ) : flowProfile ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{flowProfile.department_name}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Flow Order</span>
                  <span className="font-medium">{flowProfile.flow_order ?? "Not set"}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-muted-foreground">Clearance Stage</span>
                  <span className="font-medium">{flowProfile.clearance_stage_order ?? "Not set"}</span>
                </div>
                {flowProfile.notes ? (
                  <div className="rounded-lg border p-3">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="mt-1">{flowProfile.notes}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No Prefect flow profile row is available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar Connection</CardTitle>
            <CardDescription>Live Registrar routes linked to Prefect in the shared integration registry.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading Registrar routes...</p>
            ) : registrarConnection ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-cyan-300 bg-cyan-50 text-cyan-700">
                    Sends {registrarConnection.sends_route_count}
                  </Badge>
                  <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-700">
                    Receives {registrarConnection.receives_route_count}
                  </Badge>
                  <Badge variant="outline">{registrarConnection.latest_status ?? "No events yet"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{registrarConnection.purpose}</p>
                <div className="space-y-2 rounded-lg border p-3">
                  {registrarConnection.routes.map((route) => (
                    <div key={route.route_key} className="rounded-lg border border-dashed p-3">
                      <p className="font-medium">{route.flow_name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {route.direction === "sends" ? "Prefect sends" : "Prefect receives"} | {route.event_code}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Latest activity: {formatDateTime(registrarConnection.latest_created_at)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Registrar is not yet visible in the Prefect route registry.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Student Directory</CardTitle>
            <CardDescription>Lookup student records from `registrar.student_directory` without leaving Prefect.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Search student number, name, or program"
                  className="pl-9"
                />
              </div>
              <Button onClick={() => void handleLookup()} disabled={lookupBusy}>
                <Database className="h-4 w-4" />
                {lookupBusy ? "Looking up..." : "Lookup"}
              </Button>
            </div>

            <div className="rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                        Run a lookup to preview Registrar student records.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={`${student.student_id}-${student.student_no}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.student_name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{student.student_no}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {student.program} {student.year_level ? `| Year ${student.year_level}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.enrollment_status ?? "Unknown"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busyAction !== ""}
                            onClick={() => {
                              setStudentNo(student.student_no);
                              setTitle(`Prefect Discipline Record - ${student.student_name}`);
                            }}
                          >
                            Use Student
                          </Button>
                          <Button
                            size="sm"
                            disabled={busyAction !== ""}
                            onClick={() => void handleReceiveStudent(student)}
                          >
                            {busyAction === `receive-${student.student_no}` ? "Receiving..." : "Receive"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle>Clearance Preview</CardTitle>
            <CardDescription className="text-slate-400">Latest Prefect clearance records exposed by the shared backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {clearancePreview.length === 0 ? (
              <p className="text-sm text-slate-400">No clearance records were returned yet.</p>
            ) : (
              clearancePreview.map((record) => (
                <div key={record.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{record.patient_name}</p>
                      <p className="mt-1 text-xs text-slate-400">{record.clearance_reference}</p>
                    </div>
                    <Badge variant="outline" className="border-white/15 text-slate-100">
                      {record.status}
                    </Badge>
                  </div>
                  {record.remarks ? <p className="mt-3 text-sm text-slate-300">{record.remarks}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[1fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Send Discipline Record to Registrar</CardTitle>
            <CardDescription>Queue a Prefect to Registrar discipline record and materialize it into the shared Postgres record registry.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                Student Number
                <Input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="2026-0001" />
              </label>
              <label className="grid gap-2 text-sm">
                Reference No
                <Input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} placeholder="PREF-2026-001" />
              </label>
              <label className="grid gap-2 text-sm md:col-span-2">
                Title
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <label className="grid gap-2 text-sm">
                Notes
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Hold reason, incident summary, or clearance note" />
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
                  <option>Completed</option>
                </select>
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              Tracked Event ID
              <Input value={trackedEventId} onChange={(event) => setTrackedEventId(event.target.value)} placeholder="Auto-filled after dispatch" />
            </label>

            <label className="grid gap-2 text-sm">
              Tracked Correlation ID
              <Input
                value={trackedCorrelationId}
                onChange={(event) => setTrackedCorrelationId(event.target.value)}
                placeholder="Auto-filled after dispatch"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void handleDispatch()} disabled={busyAction !== ""}>
                <Send className="h-4 w-4" />
                {busyAction === "dispatch" ? "Dispatching..." : "Send to Registrar"}
              </Button>
              <Button variant="outline" onClick={() => void handleStatusRefresh()} disabled={busyAction !== ""}>
                <RefreshCw className="h-4 w-4" />
                {busyAction === "status" ? "Checking..." : "Check Status"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle>Response Preview</CardTitle>
            <CardDescription className="text-slate-400">Latest lookup, dispatch, or flow-status payload.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="min-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-slate-200">
              {responseText}
            </pre>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
