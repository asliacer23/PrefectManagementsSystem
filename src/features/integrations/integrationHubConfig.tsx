import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Building2,
  FileText,
  HeartPulse,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export type IntegrationDirection = "receives" | "sends";
export type IntegrationStatus = "attention" | "configured" | "ready";
export type IntegrationMode = "fetch" | "post" | "function";

export type HubIntegration = {
  key: string;
  title: string;
  counterpart: string;
  direction: IntegrationDirection;
  status: IntegrationStatus;
  mode: IntegrationMode;
  icon: LucideIcon;
  description: string;
  endpointLabel: string;
  notes: string;
  defaultTitle?: string;
  defaultStatus?: string;
  buildRequest: (studentNo: string, referenceNo: string, title: string, notes: string, status: string, baseUrl: string) => {
    url?: string;
    init?: RequestInit;
    functionName?: string;
    body?: Record<string, unknown>;
  };
};

export const hubIntegrations: HubIntegration[] = [
  {
    key: "student-personal-info",
    title: "Student Personal Information",
    counterpart: "Registrar",
    direction: "receives",
    status: "attention",
    mode: "fetch",
    icon: ArrowDownLeft,
    description: "Pull student personal information from Registrar for verification and clearance workflows.",
    endpointLabel: "GET /api/integrations?resource=student-personal-info&student_no=...",
    notes: "Inbound identity lookup used before discipline and clearance actions.",
    buildRequest: (studentNo, _referenceNo, _title, _notes, _status, baseUrl) => ({
      url: `${baseUrl}?resource=student-personal-info&student_no=${encodeURIComponent(studentNo)}`,
    }),
  },
  {
    key: "discipline-records",
    title: "Discipline Records",
    counterpart: "Registrar",
    direction: "sends",
    status: "configured",
    mode: "post",
    icon: ShieldAlert,
    description: "Send discipline holds and record updates from Prefect into Registrar.",
    endpointLabel: "POST /api/integrations { resource: discipline-records }",
    notes: "Outbound discipline synchronization for registrar-facing clearance impact.",
    defaultTitle: "Prefect Discipline Hold",
    defaultStatus: "Has Record",
    buildRequest: (studentNo, referenceNo, title, notes, status, baseUrl) => ({
      url: baseUrl,
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: "discipline-records",
          student_no: studentNo,
          reference_no: referenceNo,
          title,
          notes,
          status,
        }),
      },
    }),
  },
  {
    key: "discipline-reports",
    title: "Discipline Reports",
    counterpart: "Guidance",
    direction: "sends",
    status: "ready",
    mode: "function",
    icon: FileText,
    description: "Push discipline reports from Prefect to Guidance through the Supabase function endpoint.",
    endpointLabel: "Supabase Function: discipline-reports",
    notes: "Operational export for Guidance reporting and review.",
    buildRequest: () => ({
      functionName: "discipline-reports",
    }),
  },
  {
    key: "incident-reports",
    title: "Incident Reports",
    counterpart: "Clinic",
    direction: "sends",
    status: "ready",
    mode: "function",
    icon: HeartPulse,
    description: "Send incident reports from Prefect to Clinic for case awareness and follow-through.",
    endpointLabel: "Supabase Function: incident-reports",
    notes: "Operational handoff to Clinic for incident visibility.",
    buildRequest: () => ({
      functionName: "incident-reports",
    }),
  },
  {
    key: "discipline-statistics",
    title: "Discipline Statistics",
    counterpart: "PMED",
    direction: "sends",
    status: "ready",
    mode: "function",
    icon: BarChart3,
    description: "Send discipline analytics and summarized statistics to PMED.",
    endpointLabel: "Supabase Function: discipline-statistics",
    notes: "Aggregate reporting feed for planning and analysis.",
    buildRequest: () => ({
      functionName: "discipline-statistics",
    }),
  },
];

export const integrationStatusMeta: Record<IntegrationStatus, { label: string; className: string }> = {
  attention: {
    label: "Action Needed",
    className: "border-amber-300 bg-amber-50 text-amber-700",
  },
  configured: {
    label: "Configured",
    className: "border-sky-300 bg-sky-50 text-sky-700",
  },
  ready: {
    label: "Ready",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
};

export const integrationDirectionMeta: Record<IntegrationDirection, { label: string; className: string; icon: LucideIcon }> = {
  receives: {
    label: "Receives",
    className: "border-violet-300 bg-violet-50 text-violet-700",
    icon: ArrowDownLeft,
  },
  sends: {
    label: "Sends",
    className: "border-cyan-300 bg-cyan-50 text-cyan-700",
    icon: ArrowUpRight,
  },
};

export const integrationCounterpartMeta: Record<string, { icon: LucideIcon; accentClass: string }> = {
  Registrar: { icon: Building2, accentClass: "from-blue-500/15 to-cyan-500/10" },
  Guidance: { icon: FileText, accentClass: "from-fuchsia-500/15 to-rose-500/10" },
  Clinic: { icon: HeartPulse, accentClass: "from-red-500/15 to-orange-500/10" },
  PMED: { icon: Activity, accentClass: "from-emerald-500/15 to-lime-500/10" },
};
