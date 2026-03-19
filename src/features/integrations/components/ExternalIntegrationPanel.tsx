import { useMemo, useState } from "react";
import { ArrowUpRight, RefreshCw, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Mode = "fetch" | "post" | "function";

type IntegrationAction = {
  key: string;
  title: string;
  description: string;
  badge: string;
  mode: Mode;
  endpointLabel: string;
  buildRequest: (studentNo: string, referenceNo: string, title: string, notes: string, status: string) => {
    url?: string;
    init?: RequestInit;
    functionName?: string;
    body?: Record<string, unknown>;
  };
};

export function ExternalIntegrationPanel({
  title,
  description,
  baseUrl,
  apiKey,
  actions,
}: {
  title: string;
  description: string;
  baseUrl: string;
  apiKey: string;
  actions: IntegrationAction[];
}) {
  const [studentNo, setStudentNo] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Pending");
  const [responseText, setResponseText] = useState("Run an integration action to preview the response here.");
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
      const request = action.buildRequest(studentNo, referenceNo, entryTitle, notes, status);

      if (action.mode === "function" && request.functionName) {
        const { data, error } = await supabase.functions.invoke(request.functionName, request.body ? { body: request.body } : undefined);
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
      setResponseText(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }, null, 2));
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          <label className="grid gap-2 text-sm">
            API Base URL
            <Input value={baseUrl} readOnly />
          </label>
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
                <p className="mt-2 text-xs text-muted-foreground">{action.endpointLabel}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button onClick={() => runAction(action)} disabled={busyKey !== ""} size="sm">
                    {action.mode === "fetch" ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {busyKey === action.key ? "Running..." : action.mode === "fetch" ? "Fetch" : "Send"}
                  </Button>
                  {action.mode !== "function" ? (
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

          <pre className="min-h-[320px] overflow-auto rounded-lg bg-muted p-4 text-xs leading-6">{responseText}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
