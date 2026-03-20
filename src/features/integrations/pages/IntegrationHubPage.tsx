import { useMemo, useState } from "react";
import { ArrowUpRight, Filter, MoreHorizontal, RefreshCw, Search, Send, Sparkles } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  hubIntegrations,
  integrationCounterpartMeta,
  integrationDirectionMeta,
  integrationStatusMeta,
  type HubIntegration,
} from "../integrationHubConfig";

const STORAGE_KEYS = {
  baseUrl: "prefect.integrations.baseUrl",
  apiKey: "prefect.integrations.apiKey",
};

export default function IntegrationHubPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "receives" | "sends">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "attention" | "configured" | "ready">("all");
  const [counterpartFilter, setCounterpartFilter] = useState<"all" | "Registrar" | "Guidance" | "Clinic" | "PMED">("all");
  const [baseUrl, setBaseUrl] = useState(() => window.localStorage.getItem(STORAGE_KEYS.baseUrl) || "http://localhost:3000/api/integrations");
  const [apiKey, setApiKey] = useState(() => window.localStorage.getItem(STORAGE_KEYS.apiKey) || "");
  const [studentNo, setStudentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [entryTitle, setEntryTitle] = useState("Prefect Discipline Hold");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Has Record");
  const [responseText, setResponseText] = useState("Select a connection and run an action to preview the response.");
  const [busyKey, setBusyKey] = useState("");

  const visibleIntegrations = useMemo(
    () => hubIntegrations.filter((integration) => {
      const matchesDirection = activeFilter === "all" || integration.direction === activeFilter;
      const matchesStatus = statusFilter === "all" || integration.status === statusFilter;
      const matchesCounterpart = counterpartFilter === "all" || integration.counterpart === counterpartFilter;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const haystack = [
        integration.title,
        integration.counterpart,
        integration.description,
        integration.endpointLabel,
        integration.notes,
      ].join(" ").toLowerCase();
      const matchesSearch = normalizedSearch === "" || haystack.includes(normalizedSearch);

      return matchesDirection && matchesStatus && matchesCounterpart && matchesSearch;
    }),
    [activeFilter, counterpartFilter, searchTerm, statusFilter],
  );

  const stats = useMemo(() => ({
    total: hubIntegrations.length,
    receives: hubIntegrations.filter((item) => item.direction === "receives").length,
    sends: hubIntegrations.filter((item) => item.direction === "sends").length,
    ready: hubIntegrations.filter((item) => item.status === "ready").length,
  }), []);

  const authHeaders = useMemo(
    () => ({
      ...(apiKey ? { "x-integration-key": apiKey } : {}),
    }),
    [apiKey],
  );

  function persistSettings(nextBaseUrl: string, nextApiKey: string) {
    window.localStorage.setItem(STORAGE_KEYS.baseUrl, nextBaseUrl);
    window.localStorage.setItem(STORAGE_KEYS.apiKey, nextApiKey);
  }

  async function runIntegration(integration: HubIntegration) {
    setBusyKey(integration.key);
    try {
      const effectiveTitle = entryTitle || integration.defaultTitle || "Prefect Integration Entry";
      const effectiveStatus = status || integration.defaultStatus || "Pending";
      const request = integration.buildRequest(studentNo, referenceNo, effectiveTitle, notes, effectiveStatus, baseUrl);

      if (integration.mode === "function" && request.functionName) {
        const { data, error } = await supabase.functions.invoke(
          request.functionName,
          request.body ? { body: request.body } : undefined,
        );
        if (error) throw error;
        setResponseText(JSON.stringify(data, null, 2));
      } else if (request.url) {
        const response = await fetch(request.url, {
          credentials: "same-origin",
          ...(request.init ?? {}),
          headers: {
            ...authHeaders,
            ...((request.init?.headers as HeadersInit | undefined) ?? {}),
          },
        });
        const payload = await response.json();
        setResponseText(JSON.stringify(payload, null, 2));
      }
    } catch (error) {
      setResponseText(JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Request failed.",
      }, null, 2));
    } finally {
      setBusyKey("");
    }
  }

  return (
    <AppLayout>
      <PageHeader
        title="Integration Hub"
        description="Centralized receive and send connections for Prefect, with live endpoint actions and professional status tracking."
      />

      <section className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sky-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Integration Control Center
                </div>
                <h2 className="text-3xl font-semibold tracking-tight">One hub for every Prefect connection</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Manage inbound registrar data, outbound registrar records, and operational exports to Guidance, Clinic, and PMED from one polished workspace.
                </p>
              </div>
              <div className="hidden rounded-3xl border border-white/10 bg-white/5 p-4 lg:block">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Live Map</p>
                <div className="mt-3 space-y-3 text-sm">
                  <p className="text-slate-200">Registrar to Prefect</p>
                  <p className="text-slate-400">Prefect to Registrar, Guidance, Clinic, PMED</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Total Connections</p>
                <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Receives</p>
                <p className="mt-2 text-3xl font-semibold">{stats.receives}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Sends</p>
                <p className="mt-2 text-3xl font-semibold">{stats.sends}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Ready Feeds</p>
                <p className="mt-2 text-3xl font-semibold">{stats.ready}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_48%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)]">
          <CardHeader>
            <CardTitle>Connection Policy</CardTitle>
            <CardDescription>Status colors show operational readiness at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(integrationStatusMeta).map(([key, meta]) => (
              <div key={key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <span className="text-sm font-medium capitalize">{key}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mb-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Connection Endpoints</CardTitle>
            <CardDescription>Prefect receives one inbound feed and sends four outbound feeds.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as "all" | "receives" | "sends")}>
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="receives">Receives</TabsTrigger>
                  <TabsTrigger value="sends">Sends</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search connections in real time..."
                    className="pl-9"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <Filter className="h-4 w-4" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-2xl">
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("attention")}>Action Needed</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("configured")}>Configured</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("ready")}>Ready</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Counterpart</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setCounterpartFilter("all")}>All Counterparts</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCounterpartFilter("Registrar")}>Registrar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCounterpartFilter("Guidance")}>Guidance</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCounterpartFilter("Clinic")}>Clinic</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setCounterpartFilter("PMED")}>PMED</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("all");
                        setCounterpartFilter("all");
                        setSearchTerm("");
                      }}
                    >
                      Reset Filters
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead>Connection</TableHead>
                    <TableHead>Counterpart</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleIntegrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No connections match your current search and filter settings.
                      </TableCell>
                    </TableRow>
                  ) : visibleIntegrations.map((integration) => {
                    const counterpart = integrationCounterpartMeta[integration.counterpart];
                    const statusMeta = integrationStatusMeta[integration.status];
                    const directionMeta = integrationDirectionMeta[integration.direction];
                    const CounterpartIcon = counterpart.icon;
                    const IntegrationIcon = integration.icon;
                    const DirectionIcon = directionMeta.icon;
                    const requestUrl = integration.mode !== "function"
                      ? integration.buildRequest(studentNo, referenceNo, entryTitle, notes, status, baseUrl).url
                      : undefined;

                    return (
                      <TableRow key={integration.key}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                              <IntegrationIcon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{integration.title}</p>
                              <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">{integration.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                            <CounterpartIcon className="h-3.5 w-3.5" />
                            {integration.counterpart}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={directionMeta.className}>
                            <DirectionIcon className="mr-1 h-3.5 w-3.5" />
                            {directionMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusMeta.className}>{statusMeta.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-sm text-xs leading-5 text-slate-600">
                            {integration.endpointLabel}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => runIntegration(integration)}
                              disabled={busyKey !== ""}
                              size="sm"
                              className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
                            >
                              {integration.mode === "fetch" ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                              {busyKey === integration.key ? "Running..." : integration.mode === "fetch" ? "Fetch" : "Send"}
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl">
                                <DropdownMenuItem onClick={() => runIntegration(integration)}>
                                  {integration.mode === "fetch" ? "Run Fetch" : "Run Action"}
                                </DropdownMenuItem>
                                {requestUrl ? (
                                  <DropdownMenuItem asChild>
                                    <a href={requestUrl} target="_blank" rel="noreferrer">
                                      Open Endpoint
                                    </a>
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(integration.endpointLabel)}>
                                  Copy Endpoint Label
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1fr_0.9fr]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Action Console</CardTitle>
            <CardDescription>Use one form to drive incoming lookups and outgoing integration pushes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="grid gap-2 text-sm">
                Student Number
                <Input value={studentNo} onChange={(event) => setStudentNo(event.target.value)} placeholder="2025-0001" />
              </label>
              <label className="grid gap-2 text-sm">
                Reference No
                <Input value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} placeholder="PREF-2026-001" />
              </label>
              <label className="grid gap-2 text-sm">
                Entry Title
                <Input value={entryTitle} onChange={(event) => setEntryTitle(event.target.value)} placeholder="Prefect Discipline Hold" />
              </label>
              <label className="grid gap-2 text-sm xl:col-span-2">
                Integration API URL
                <Input
                  value={baseUrl}
                  onChange={(event) => {
                    const next = event.target.value;
                    setBaseUrl(next);
                    persistSettings(next, apiKey);
                  }}
                  placeholder="http://localhost:3000/api/integrations"
                />
              </label>
              <label className="grid gap-2 text-sm">
                Shared API Key
                <Input
                  value={apiKey}
                  onChange={(event) => {
                    const next = event.target.value;
                    setApiKey(next);
                    persistSettings(baseUrl, next);
                  }}
                  placeholder="Optional key"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <label className="grid gap-2 text-sm">
                Notes
                <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Integration notes, violation summary, or remarks" />
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
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-950 text-slate-100">
          <CardHeader>
            <CardTitle>Response Preview</CardTitle>
            <CardDescription className="text-slate-400">Latest payload or error from the selected connection.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="min-h-[320px] overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-6 text-slate-200">
              {responseText}
            </pre>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
