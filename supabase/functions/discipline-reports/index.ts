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
      supabase
        .from("incident_reports")
        .select("id, title, severity, is_resolved, incident_date, location, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("complaints")
        .select("id, subject, status, created_at, resolved_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (incidents.error) throw incidents.error;
    if (complaints.error) throw complaints.error;

    const payload = {
      generated_at: new Date().toISOString(),
      source: "PrefectManagementsSystem",
      summary: {
        incident_count: incidents.data?.length ?? 0,
        complaint_count: complaints.data?.length ?? 0,
      },
      incidents: incidents.data ?? [],
      complaints: complaints.data ?? [],
    };

    return new Response(JSON.stringify({ ok: true, data: payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Request failed." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
