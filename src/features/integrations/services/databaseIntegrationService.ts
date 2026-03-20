const INTEGRATIONS_DB_API_BASE_URL =
  import.meta.env.VITE_INTEGRATIONS_DB_API_BASE_URL || "/.netlify/functions/integrations-hub";

async function request<T>(resource: string, params?: Record<string, string>) {
  const url = new URL(INTEGRATIONS_DB_API_BASE_URL, window.location.origin);
  url.searchParams.set("resource", resource);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Database integration request failed.");
  }

  return payload as T;
}

export async function getPrefectFlowProfileFromDatabase() {
  const payload = await request<{ data: Record<string, unknown> | null }>("prefect-flow-profile");
  return payload.data;
}

export async function getPrefectRecentClearanceRecordsFromDatabase(limit = 5) {
  const payload = await request<{ data: Array<Record<string, unknown>> }>("prefect-clearance-records", {
    limit: String(limit),
  });
  return payload.data;
}

export async function getIntegrationDatabaseManifest() {
  return request<{
    backend: string;
    schema: string;
    capabilities: string[];
    flowProfile: Record<string, unknown> | null;
    clearancePreview: Array<Record<string, unknown>>;
  }>("manifest");
}
