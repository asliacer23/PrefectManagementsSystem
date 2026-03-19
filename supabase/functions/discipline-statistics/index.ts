import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const [incidents, complaints] = await Promise.all([
      supabase.from("incident_reports").select("severity, is_resolved"),
      supabase.from("complaints").select("status"),
    ]);

    if (incidents.error) throw incidents.error;
    if (complaints.error) throw complaints.error;

    const incidentsBySeverity = (incidents.data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.severity] = (acc[row.severity] || 0) + 1;
      return acc;
    }, {});

    const complaintsByStatus = (complaints.data ?? []).reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    const unresolvedIncidents = (incidents.data ?? []).filter((row) => !row.is_resolved).length;

    return new Response(JSON.stringify({
      ok: true,
      data: {
        generated_at: new Date().toISOString(),
        source: "PrefectManagementsSystem",
        totals: {
          incidents: incidents.data?.length ?? 0,
          complaints: complaints.data?.length ?? 0,
          unresolved_incidents: unresolvedIncidents,
        },
        incidents_by_severity: incidentsBySeverity,
        complaints_by_status: complaintsByStatus,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
