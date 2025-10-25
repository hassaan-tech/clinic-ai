// supabase/functions/create-staff/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Your project URL (safe to hardcode)
const PROJECT_URL = "https://fieclojjxbpojhvheznw.supabase.co";
// Service role — set once: npx supabase secrets set SERVICE_ROLE_KEY=...
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  // "https://your-prod-domain.com",
]);

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(
  status: number,
  origin: string | null,
  body: Record<string, unknown>
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  try {
    if (!SERVICE_ROLE_KEY) {
      console.error("CONFIG ERROR: SERVICE_ROLE_KEY missing");
      return json(500, origin, { error: "Server misconfigured" });
    }

    // Single admin client (bypasses RLS). We'll do auth/authorization ourselves.
    const admin = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- Authenticate caller by decoding JWT with admin client ---
    const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!jwt) return json(401, origin, { error: "No auth token (Bearer) provided" });

    const { data: authData, error: authErr } = await admin.auth.getUser(jwt);
    if (authErr || !authData?.user) {
      console.warn("AUTH: invalid token", authErr);
      return json(401, origin, { error: "Invalid session" });
    }
    const caller = authData.user;

    // Parse body
    const body = await req.json().catch(() => ({}));
    const {
      email,
      password = "123456",
      org_id,
      clinic_ids = [],
      role = "staff",
    } = body || {};

    if (!email) return json(400, origin, { error: "email is required" });
    if (!org_id) return json(400, origin, { error: "org_id is required" });

    // --- Authorization: caller must be org owner OR org member (admin/owner) ---
    const { data: orgRows, error: orgErr } = await admin
      .from("orgs")
      .select("id, owner_user_id")
      .eq("id", org_id)
      .limit(1);

    if (orgErr) {
      console.error("AUTHZ: orgs select failed", orgErr);
      return json(500, origin, { error: "orgs select failed", details: orgErr });
    }
    const org = Array.isArray(orgRows) && orgRows[0];
    if (!org) return json(404, origin, { error: "org not found" });

    let allowed = org.owner_user_id === caller.id;
    if (!allowed) {
      const { data: mem, error: memErr } = await admin
        .from("org_members")
        .select("id, role")
        .eq("org_id", org_id)
        .eq("user_id", caller.id)
        .in("role", ["admin", "owner"])
        .limit(1);
      if (memErr) {
        console.error("AUTHZ: org_members select failed", memErr);
        return json(500, origin, { error: "org_members select failed", details: memErr });
      }
      allowed = Array.isArray(mem) && mem.length > 0;
    }
    if (!allowed) return json(403, origin, { error: "Not allowed for this org" });

    // --- Create Auth user (handle duplicate nicely) ---
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { created_by: "create-staff", org_id },
    });
    if (createErr || !created?.user) {
      const msg = createErr?.message || "createUser failed";
      const status = /already/i.test(msg) ? 409 : 400;
      return json(status, origin, { error: msg });
    }
    const newUserId = created.user.id;

    // --- Add org membership ---
    const { error: memUpsertErr } = await admin
      .from("org_members")
      .upsert({ org_id, user_id: newUserId, role });
    if (memUpsertErr) {
      console.error("org_members upsert failed", memUpsertErr);
      return json(500, origin, { error: "org_members upsert failed", details: memUpsertErr });
    }

    // --- Assign clinics (optional) ---
    if (Array.isArray(clinic_ids) && clinic_ids.length) {
      const rows = clinic_ids.map((cid: string) => ({
        clinic_id: cid,
        user_id: newUserId,
        role: "reception",
      }));
      const { error: csErr } = await admin.from("clinic_staff").insert(rows);
      if (csErr) {
        console.error("clinic_staff insert failed", csErr);
        return json(500, origin, { error: "clinic_staff insert failed", details: csErr });
      }
    }

    return json(200, origin, { ok: true, user_id: newUserId });
  } catch (e) {
    console.error("UNHANDLED ERROR:", e);
    return json(500, origin, { error: String(e) });
  }
});
