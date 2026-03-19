import { supabase } from "@/integrations/supabase/client";

export async function getPrefectFlowProfile() {
  const { data, error } = await supabase
    .schema("prefect")
    .from("department_flow_profiles")
    .select("*")
    .eq("department_key", "prefect")
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getPrefectRecentClearanceRecords() {
  const { data, error } = await supabase
    .schema("prefect")
    .from("department_clearance_records")
    .select("*")
    .eq("department_key", "prefect")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}
