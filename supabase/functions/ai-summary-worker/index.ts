// supabase/functions/create-staff/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceKey);

type Payload = {
  email: string;
  password?: string;
  clinicIds: string[];
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // === Authenticate doctor making request ===
    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");

    const { data: userInfo, error: userErr } = await supabase.auth.getUser(jwt);
    if (userErr || !userInfo?.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    const doctorUserId = userInfo.user.id;

    // === Parse payload ===
    const body = (await req.json()) as Payload;
    if (!body.email || !Array.isArray(body.clinicIds) || body.clinicIds.length === 0) {
      return new Response("Invalid payload", { status: 400 });
    }
    const defaultPassword = body.password || "123456";

    // === Lookup doctor and their org ===
    const { data: doctor, error: dErr } = await supabase
      .from("doctors")
      .select("id, owner_user_id")
      .eq("owner_user_id", doctorUserId)
      .single();
    if (dErr || !doctor) {
      return new Response("Doctor not found.", { status: 403 });
    }

    const { data: org, error: oErr } = await supabase
      .from("orgs")
      .select("id")
      .eq("owner_user_id", doctor.owner_user_id)
      .single();
    if (oErr || !org) {
      return new Response("Organization not found.", { status: 400 });
    }

    // === Create staff auth user ===
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email: body.email,
      password: defaultPassword,
      email_confirm: true,
    });
    if (cErr || !created?.user) {
      return new Response(`Create user failed: ${cErr?.message}`, { status: 400 });
    }
    const staffUserId = created.user.id;

    // === Add to org_members ===
    const { data: memberRows, error: mErr } = await supabase
      .from("org_members")
      .insert({
        org_id: org.id,
        user_id: staffUserId,
        role: "staff",
      })
      .select()
      .limit(1);
    if (mErr) {
      return new Response(`org_members insert failed: ${mErr.message}`, { status: 400 });
    }
    const member = memberRows?.[0];

    // === Assign staff to clinics ===
    const staffLinks = body.clinicIds.map((cid) => ({
      clinic_id: cid,
      user_id: staffUserId,
      role: "reception", // default role
      org_member_id: member?.id ?? null,
    }));

    const { error: csErr } = await supabase.from("clinic_staff").insert(staffLinks);
    if (csErr) {
      return new Response(`clinic_staff insert failed: ${csErr.message}`, { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    console.error(e);
    return new Response("Server error", { status: 500 });
  }
});
