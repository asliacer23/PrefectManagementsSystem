import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    })
  : null;

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

async function queryFlowProfile(client) {
  const { rows } = await client.query(
    `
      select
        department_key,
        department_name,
        flow_order,
        clearance_stage_order,
        receives,
        sends,
        notes,
        created_at,
        updated_at
      from prefect.department_flow_profiles
      where department_key = $1
      limit 1
    `,
    ["prefect"],
  );

  return rows[0] ?? null;
}

async function queryClearanceRecords(client, limit) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 20) : 5;
  const { rows } = await client.query(
    `
      select
        id,
        department_key,
        department_name,
        patient_name,
        patient_type,
        clearance_reference,
        external_reference,
        stage_order,
        status,
        approver_name,
        approver_role,
        remarks,
        requested_by,
        decided_at,
        metadata,
        created_at,
        updated_at
      from prefect.department_clearance_records
      where department_key = $1
      order by created_at desc
      limit $2
    `,
    ["prefect", safeLimit],
  );

  return rows;
}

export async function handler(event) {
  if (!pool) {
    return json(500, {
      ok: false,
      error: "DATABASE_URL is not configured on the backend.",
    });
  }

  const resource = event.queryStringParameters?.resource ?? "manifest";

  let client;
  try {
    client = await pool.connect();

    if (resource === "manifest") {
      const [flowProfile, clearanceRecords] = await Promise.all([
        queryFlowProfile(client),
        queryClearanceRecords(client, 3),
      ]);

      return json(200, {
        ok: true,
        resource,
        backend: "postgres",
        schema: "prefect",
        capabilities: ["prefect-flow-profile", "prefect-clearance-records"],
        flowProfile,
        clearancePreview: clearanceRecords,
      });
    }

    if (resource === "prefect-flow-profile") {
      const flowProfile = await queryFlowProfile(client);
      return json(200, { ok: true, resource, data: flowProfile });
    }

    if (resource === "prefect-clearance-records") {
      const limit = Number.parseInt(event.queryStringParameters?.limit ?? "5", 10);
      const records = await queryClearanceRecords(client, limit);
      return json(200, { ok: true, resource, data: records });
    }

    return json(400, {
      ok: false,
      error: `Unsupported resource "${resource}".`,
    });
  } catch (error) {
    return json(500, {
      ok: false,
      error: error instanceof Error ? error.message : "Database request failed.",
    });
  } finally {
    client?.release();
  }
}
