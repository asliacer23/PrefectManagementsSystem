import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Clock3, Network, RefreshCw, Search, Send } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  dispatchPrefectDepartmentFlowFromDatabase,
  getGuidanceDisciplineFeedFromDatabase,
  getDepartmentFlowStatusFromDatabase,
  getHrConductFeedFromDatabase,
  getIntegrationDatabaseManifest,
  getPrefectInboundEventsFromDatabase,
  type PrefectIntegrationConnection,
  type PrefectIntegrationEvent,
  type PrefectSharedRecord,
  type PrefectIntegrationManifest,
  type PrefectIntegrationRoute,
  type GuidanceDisciplineFeedRecord,
  type HrConductFeedRecord,
  getPrefectSharedRecordsFromDatabase,
  receiveExistingInboundEventFromDatabase,
  receiveGuidanceDisciplineReportFromDatabase,
  receiveHrConductClearanceFromDatabase,
} from "../services/databaseIntegrationService";

type RouteOption = PrefectIntegrationRoute & {
  department_key: string;
  department_name: string;
};

function formatDateTime(value: string | null) {
  if (!value) return "No activity yet";
  return new Date(value).toLocaleString();
}

function getConnectionStatus(connection: PrefectIntegrationConnection) {
  if (connection.failed_count > 0 || connection.latest_status === "failed") {
    return {
      label: "Needs Attention",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    };
  }

  if (connection.pending_count > 0 || connection.in_progress_count > 0) {
    return {
      label: "In Progress",
      className: "border-warning/30 bg-warning/10 text-warning",
    };
  }

  return {
    label: "Ready",
    className: "border-success/30 bg-success/10 text-success",
  };
}

function getSharedRecordDirectionClass(direction: PrefectSharedRecord["direction"]) {
  if (direction === "outbound") {
    return "border-cyan-300 bg-cyan-50 text-cyan-700";
  }

  if (direction === "inbound") {
    return "border-violet-300 bg-violet-50 text-violet-700";
  }

  return "border-slate-300 bg-slate-50 text-slate-700";
}

function buildDispatchPayload(
  route: RouteOption,
  {
    studentNo,
    referenceNo,
    entryTitle,
    notes,
    status,
  }: {
    studentNo: string;
    referenceNo: string;
    entryTitle: string;
    notes: string;
    status: string;
  },
) {
  const basePayload = {
    student_no: studentNo,
    reference_no: referenceNo,
    title: entryTitle || route.flow_name,
    notes,
    status,
    source_module: "integration_hub",
    route_key: route.route_key,
    dispatched_at: new Date().toISOString(),
  };

  if (route.event_code === "discipline_statistics") {
    return {
      ...basePayload,
      generated_at: new Date().toISOString(),
      total_incidents: 0,
      total_complaints: 0,
    };
  }

  return basePayload;
}

export default function IntegrationHubPage() {
  const { user } = useAuth();
  const [manifest, setManifest] = useState<PrefectIntegrationManifest | null>(null);
  const [guidanceFeed, setGuidanceFeed] = useState<GuidanceDisciplineFeedRecord[]>([]);
  const [hrFeed, setHrFeed] = useState<HrConductFeedRecord[]>([]);
  const [inboundEvents, setInboundEvents] = useState<PrefectIntegrationEvent[]>([]);
  const [sharedRecords, setSharedRecords] = useState<PrefectSharedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "sends" | "receives">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRouteKey, setSelectedRouteKey] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [entryTitle, setEntryTitle] = useState("Prefect Department Flow");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Pending");
  const [trackedEventId, setTrackedEventId] = useState("");
  const [trackedCorrelationId, setTrackedCorrelationId] = useState("");
  const [responseText, setResponseText] = useState("Select an outbound department route to dispatch or inspect status.");
  const [busyAction, setBusyAction] = useState("");

  async function loadManifest(silent = false) {
    if (!silent) {
      setLoading(true);
    }

    try {
      const [payload, nextGuidanceFeed, nextHrFeed, nextInboundEvents, nextSharedRecords] = await Promise.all([
        getIntegrationDatabaseManifest(),
        getGuidanceDisciplineFeedFromDatabase(4),
        getHrConductFeedFromDatabase(4),
        getPrefectInboundEventsFromDatabase(6),
        getPrefectSharedRecordsFromDatabase(10),
      ]);

      setManifest(payload);
      setGuidanceFeed(nextGuidanceFeed);
      setHrFeed(nextHrFeed);
      setInboundEvents(nextInboundEvents);
      setSharedRecords(nextSharedRecords);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load department integrations.";
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

  const connections = manifest?.connections ?? [];
  const recentEvents = manifest?.recentEvents ?? [];

  const outgoingRoutes = useMemo<RouteOption[]>(
    () =>
      connections.flatMap((connection) =>
        connection.routes
          .filter((route) => route.direction === "sends")
          .map((route) => ({
            ...route,
            department_key: connection.department_key,
            department_name: connection.department_name,
          })),
      ),
    [connections],
  );

  useEffect(() => {
    if (!outgoingRoutes.length) {
      setSelectedRouteKey("");
      return;
    }

    const routeStillExists = outgoingRoutes.some((route) => route.route_key === selectedRouteKey);
    if (!selectedRouteKey || !routeStillExists) {
      setSelectedRouteKey(outgoingRoutes[0].route_key);
    }
  }, [outgoingRoutes, selectedRouteKey]);

  const selectedRoute = outgoingRoutes.find((route) => route.route_key === selectedRouteKey) ?? null;

  const visibleConnections = useMemo(
    () =>
      connections.filter((connection) => {
        const matchesDirection =
          activeFilter === "all" ||
          (activeFilter === "sends" && connection.sends_route_count > 0) ||
          (activeFilter === "receives" && connection.receives_route_count > 0);

        const normalizedSearch = searchTerm.trim().toLowerCase();
        const haystack = [
          connection.department_name,
          connection.system_code,
          connection.purpose,
          ...connection.routes.map((route) => `${route.flow_name} ${route.event_code}`),
        ]
          .join(" ")
          .toLowerCase();

        return matchesDirection && (normalizedSearch === "" || haystack.includes(normalizedSearch));
      }),
    [activeFilter, connections, searchTerm],
  );

  const stats = useMemo(
    () => ({
      departments: connections.length,
      outbound: connections.reduce((sum, connection) => sum + connection.sends_route_count, 0),
      inbound: connections.reduce((sum, connection) => sum + connection.receives_route_count, 0),
      events: recentEvents.length,
    }),
    [connections, recentEvents],
  );

  async function handleDispatch() {
    if (!selectedRoute) {
      toast.error("Select an outbound route first.");
      return;
    }

    setBusyAction("dispatch");
    try {
      const result = await dispatchPrefectDepartmentFlowFromDatabase({
        targetDepartmentKey: selectedRoute.department_key,
        eventCode: selectedRoute.event_code,
        sourceRecordId: referenceNo || studentNo || selectedRoute.route_key,
        requestedBy: user?.id,
        payload: buildDispatchPayload(selectedRoute, {
          studentNo,
          referenceNo,
          entryTitle,
          notes,
          status,
        }),
      });

      setTrackedEventId(result.event_id ?? "");
      setTrackedCorrelationId(result.correlation_id ?? "");
      setResponseText(JSON.stringify(result, null, 2));
      await loadManifest(true);

      if (result.ok) {
        toast.success(`Queued ${selectedRoute.flow_name}.`);
      } else {
        toast.error(result.message || "Department flow could not be queued.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dispatch failed.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setBusyAction("");
    }
  }

  async function handleStatusRefresh() {
    if (!trackedEventId && !trackedCorrelationId) {
      toast.error("Dispatch a route first or use a tracked event.");
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
      const message = error instanceof Error ? error.message : "Unable to fetch flow status.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setBusyAction("");
    }
  }

  async function handleReceiveGuidanceRecord(record: GuidanceDisciplineFeedRecord) {
    setBusyAction(`receive-guidance-${record.id}`);
    try {
      const result = await receiveGuidanceDisciplineReportFromDatabase({
        id: record.id,
        caseReference: record.case_reference ?? undefined,
        sourceRecordId: String(record.id),
      });

      setTrackedEventId(result.event_id ?? "");
      setTrackedCorrelationId(result.correlation_id ?? "");
      setResponseText(JSON.stringify(result, null, 2));
      await loadManifest(true);

      if (result.ok) {
        toast.success("Guidance discipline record received into Prefect.");
      } else {
        toast.error(result.message || "Guidance discipline record could not be received.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Guidance receive failed.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setBusyAction("");
    }
  }

  async function handleReceiveHrRecord(record: HrConductFeedRecord) {
    setBusyAction(`receive-hr-${record.employee_id}`);
    try {
      const result = await receiveHrConductClearanceFromDatabase({
        employeeId: record.employee_id,
        employeeNumber: record.employee_number,
        sourceRecordId: record.employee_number,
      });

      setTrackedEventId(result.event_id ?? "");
      setTrackedCorrelationId(result.correlation_id ?? "");
      setResponseText(JSON.stringify(result, null, 2));
      await loadManifest(true);

      if (result.ok) {
        toast.success("HR conduct clearance received into Prefect.");
      } else {
        toast.error(result.message || "HR conduct clearance could not be received.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "HR receive failed.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setBusyAction("");
    }
  }

  async function handleReceiveInboundEvent(event: PrefectIntegrationEvent) {
    setBusyAction(`receive-event-${event.id}`);
    try {
      const result = await receiveExistingInboundEventFromDatabase({
        eventId: event.id,
        correlationId: event.correlation_id,
      });

      setTrackedEventId(result.event_id ?? "");
      setTrackedCorrelationId(result.correlation_id ?? "");
      setResponseText(JSON.stringify(result, null, 2));
      await loadManifest(true);

      if (result.ok) {
        toast.success("Inbound department event received into Prefect.");
      } else {
        toast.error(result.message || "Inbound event could not be received.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Inbound receive failed.";
      setResponseText(JSON.stringify({ ok: false, error: message }, null, 2));
      toast.error(message);
    } finally {
      setBusyAction("");
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Integration Hub"
        description="Live department connections for Prefect, powered by the shared database registry in the root Supabase workspace."
        actions={
          <Button variant="outline" onClick={() => void loadManifest()} disabled={loading || busyAction !== ""}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <section className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sky-100">
                  <Network className="h-3.5 w-3.5" />
                  Shared Department Registry
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">Prefect is now linked to the central department map</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This hub reads the live department registry, active routes, and recent cross-department events directly from the shared
                  `C:\xampp\htdocs\bpm commision\supabase` database.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Connected Departments</p>
                <p className="mt-2 text-3xl font-semibold">{stats.departments}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Outbound Routes</p>
                <p className="mt-2 text-3xl font-semibold">{stats.outbound}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Inbound Routes</p>
                <p className="mt-2 text-3xl font-semibold">{stats.inbound}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Recent Events</p>
                <p className="mt-2 text-3xl font-semibold">{stats.events}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Tracked Event</CardTitle>
            <CardDescription>The latest dispatched event can be rechecked without leaving the page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-2 text-sm">
              Event ID
              <Input value={trackedEventId} onChange={(event) => setTrackedEventId(event.target.value)} placeholder="Auto-filled after dispatch" />
            </label>
            <label className="grid gap-2 text-sm">
              Correlation ID
              <Input
                value={trackedCorrelationId}
                onChange={(event) => setTrackedCorrelationId(event.target.value)}
                placeholder="Auto-filled after dispatch"
              />
            </label>
            <Button variant="outline" onClick={() => void handleStatusRefresh()} disabled={busyAction !== ""}>
              <Clock3 className="h-4 w-4" />
              {busyAction === "status" ? "Checking..." : "Refresh Status"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mb-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Connected Departments</CardTitle>
            <CardDescription>Inbound and outbound routes generated from the live shared registry.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as "all" | "sends" | "receives")}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="sends">Sends</TabsTrigger>
                  <TabsTrigger value="receives">Receives</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative min-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search departments, routes, or events..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead>Department</TableHead>
                    <TableHead>Directions</TableHead>
                    <TableHead>Routes</TableHead>
                    <TableHead>Latest Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        Loading department connections...
                      </TableCell>
                    </TableRow>
                  ) : visibleConnections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No connected departments match your current filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleConnections.map((connection) => {
                      const statusMeta = getConnectionStatus(connection);
                      const primarySendRoute = connection.routes.find((route) => route.direction === "sends");

                      return (
                        <TableRow key={connection.department_key}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-slate-900">{connection.department_name}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{connection.purpose}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              {connection.receives_route_count > 0 ? (
                                <Badge variant="outline" className="border-violet-300 bg-violet-50 text-violet-700">
                                  <ArrowDownLeft className="mr-1 h-3.5 w-3.5" />
                                  Receives {connection.receives_route_count}
                                </Badge>
                              ) : null}
                              {connection.sends_route_count > 0 ? (
                                <Badge variant="outline" className="border-cyan-300 bg-cyan-50 text-cyan-700">
                                  <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                                  Sends {connection.sends_route_count}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs text-slate-600">
                              {connection.routes.map((route) => (
                                <p key={route.route_key}>
                                  {route.flow_name} ({route.event_code})
                                </p>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            <p>{connection.latest_event_code ?? "No events yet"}</p>
                            <p className="mt-1 text-slate-500">{formatDateTime(connection.latest_created_at)}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusMeta.className}>
                              {statusMeta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!primarySendRoute}
                              onClick={() => {
                                if (primarySendRoute) {
                                  setSelectedRouteKey(primarySendRoute.route_key);
                                  setEntryTitle(primarySendRoute.flow_name);
                                  setResponseText(
                                    JSON.stringify(
                                      {
                                        selected_department: connection.department_name,
                                        selected_route: primarySendRoute,
                                        latest_status: connection.latest_status,
                                      },
                                      null,
                                      2,
                                    ),
                                  );
                                }
                              }}
                            >
                              {primarySendRoute ? "Select Route" : "Inbound Only"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1fr_0.95fr]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Dispatch Console</CardTitle>
            <CardDescription>Queue shared department events from Prefect using the selected outbound route.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="grid gap-2 text-sm">
              Outbound Route
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedRouteKey}
                onChange={(event) => setSelectedRouteKey(event.target.value)}
              >
                {outgoingRoutes.length === 0 ? <option value="">No outbound routes available</option> : null}
                {outgoingRoutes.map((route) => (
                  <option key={route.route_key} value={route.route_key}>
                    {route.department_name} - {route.flow_name}
                  </option>
                ))}
              </select>
            </label>

            {selectedRoute ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                <p className="font-medium text-slate-900">{selectedRoute.flow_name}</p>
                <p className="mt-1 text-slate-600">
                  Event: {selectedRoute.event_code} | Endpoint: {selectedRoute.endpoint_path}
                </p>
                {selectedRoute.notes ? <p className="mt-2 text-slate-500">{selectedRoute.notes}</p> : null}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="grid gap-2 text-sm">
                Student Number
                <Input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="2026-0001" />
              </label>
              <label className="grid gap-2 text-sm">
                Reference No
                <Input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} placeholder="PREF-2026-001" />
              </label>
              <label className="grid gap-2 text-sm">
                Title
                <Input value={entryTitle} onChange={(event) => setEntryTitle(event.target.value)} placeholder="Department dispatch title" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <label className="grid gap-2 text-sm">
                Notes
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Summary, remarks, or payload notes" />
              </label>
              <label className="grid gap-2 text-sm">
                Status
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option>Pending</option>
                  <option>Has Record</option>
                  <option>Completed</option>
                  <option>Cleared</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void handleDispatch()} disabled={!selectedRoute || busyAction !== ""}>
                <Send className="h-4 w-4" />
                {busyAction === "dispatch" ? "Dispatching..." : "Dispatch Route"}
              </Button>
              <Button variant="outline" onClick={() => void handleStatusRefresh()} disabled={busyAction !== ""}>
                <RefreshCw className="h-4 w-4" />
                {busyAction === "status" ? "Checking..." : "Check Latest Status"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle>Response Preview</CardTitle>
            <CardDescription className="text-slate-400">Latest dispatch or flow-status payload from the shared backend.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="min-h-[360px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-slate-200">
              {responseText}
            </pre>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Guidance Feed</CardTitle>
            <CardDescription>Receive shared Guidance discipline follow-ups into Prefect.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {guidanceFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Guidance records are currently shared with Prefect.</p>
            ) : (
              guidanceFeed.map((record) => (
                <div key={String(record.id)} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{record.student_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{record.case_reference ?? `Guidance #${record.id}`}</p>
                    </div>
                    <Badge variant="outline">{record.priority_level ?? record.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{record.concern ?? "No concern summary provided."}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      onClick={() => void handleReceiveGuidanceRecord(record)}
                      disabled={busyAction !== ""}
                    >
                      <ArrowDownLeft className="h-4 w-4" />
                      {busyAction === `receive-guidance-${record.id}` ? "Receiving..." : "Receive"}
                    </Button>
                    <span className="text-xs text-slate-500">{formatDateTime(record.date_recorded ?? record.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>HR Feed</CardTitle>
            <CardDescription>Receive HR conduct clearance data into Prefect.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {hrFeed.length === 0 ? (
              <p className="text-sm text-muted-foreground">No HR conduct feed records are available yet.</p>
            ) : (
              hrFeed.map((record) => (
                <div key={record.employee_id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{record.employee_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{record.employee_number} | {record.position_title}</p>
                    </div>
                    <Badge variant="outline">{record.clearance_status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{record.department_name}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      onClick={() => void handleReceiveHrRecord(record)}
                      disabled={busyAction !== ""}
                    >
                      <ArrowDownLeft className="h-4 w-4" />
                      {busyAction === `receive-hr-${record.employee_id}` ? "Receiving..." : "Receive"}
                    </Button>
                    <span className="text-xs text-slate-500">{formatDateTime(record.updated_at)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Inbound Queue</CardTitle>
            <CardDescription>Queued events already targeted to Prefect can be received here end to end.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inboundEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No queued inbound events are waiting for Prefect.</p>
            ) : (
              inboundEvents.map((queuedEvent) => (
                <div key={queuedEvent.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{queuedEvent.flow_name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {queuedEvent.source_department_key} to {queuedEvent.target_department_key}
                      </p>
                    </div>
                    <Badge variant="outline">{queuedEvent.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{queuedEvent.event_code}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      onClick={() => void handleReceiveInboundEvent(queuedEvent)}
                      disabled={busyAction !== ""}
                    >
                      <ArrowDownLeft className="h-4 w-4" />
                      {busyAction === `receive-event-${queuedEvent.id}` ? "Receiving..." : "Receive"}
                    </Button>
                    <span className="font-mono text-xs text-slate-500">{queuedEvent.correlation_id}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Shared Department Records</CardTitle>
            <CardDescription>Real Postgres records created from Prefect send and receive flows.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead>Reference</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        No shared Postgres records have been materialized for Prefect yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sharedRecords.map((record) => (
                      <TableRow key={`${record.clearance_reference}-${record.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{record.clearance_reference}</p>
                            <p className="mt-1 text-xs text-slate-500">{record.event_code ?? record.route_key ?? "Shared record"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getSharedRecordDirectionClass(record.direction)}>
                            {record.direction}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{record.department_name}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{record.patient_name}</p>
                            <p className="mt-1 text-xs text-slate-500">{record.patient_code ?? "No code"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDateTime(record.updated_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Recent Department Events</CardTitle>
            <CardDescription>The newest cross-department events that involve Prefect.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead>Flow</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Correlation</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No department events have been recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{event.flow_name}</p>
                            <p className="mt-1 text-xs text-slate-500">{event.event_code}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              event.direction === "sends"
                                ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                                : "border-violet-300 bg-violet-50 text-violet-700"
                            }
                          >
                            {event.direction === "sends" ? (
                              <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
                            ) : (
                              <ArrowDownLeft className="mr-1 h-3.5 w-3.5" />
                            )}
                            {event.direction}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.status}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">{event.correlation_id}</TableCell>
                        <TableCell className="text-xs text-slate-600">{formatDateTime(event.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
