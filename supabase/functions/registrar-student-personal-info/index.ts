const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-integration-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      return new Response(JSON.stringify({
        ok: true,
        message: "Prefect receiver endpoint is live.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const student = payload?.data?.student ?? null;

    if (!student) {
      return new Response(JSON.stringify({ ok: false, error: "Student payload is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      message: "Registrar student personal information received by Prefect.",
      data: {
        source: String(payload?.source ?? "Registrar"),
        sent_at: String(payload?.sent_at ?? new Date().toISOString()),
        student_no: String(student.student_no ?? ""),
        first_name: String(student.first_name ?? ""),
        last_name: String(student.last_name ?? ""),
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
