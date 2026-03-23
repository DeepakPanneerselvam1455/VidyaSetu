import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ================================================================
    // STEP 1: CHECK ENVIRONMENT VARIABLES
    // ================================================================
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    console.log("[delete-user] ENV check:", {
      hasUrl: !!SUPABASE_URL,
      hasServiceKey: !!SERVICE_ROLE_KEY,
      hasAnonKey: !!ANON_KEY,
    });

    if (!SUPABASE_URL) {
      console.error("[delete-user] MISSING SUPABASE_URL");
      return jsonResponse({ error: "Server misconfiguration — missing SUPABASE_URL" }, 500);
    }

    if (!SERVICE_ROLE_KEY) {
      console.error("[delete-user] MISSING SUPABASE_SERVICE_ROLE_KEY");
      return jsonResponse({
        error: "Server misconfiguration — SUPABASE_SERVICE_ROLE_KEY required",
        hint: "Get from Supabase Dashboard → Settings → API → service_role key"
      }, 500);
    }

    if (!ANON_KEY) {
      console.error("[delete-user] MISSING SUPABASE_ANON_KEY");
      return jsonResponse({
        error: "Server misconfiguration — SUPABASE_ANON_KEY required for JWT validation",
        hint: "Get from Supabase Dashboard → Settings → API → anon key"
      }, 500);
    }

    // ================================================================
    // STEP 2: VALIDATE AUTHORIZATION HEADER
    // ================================================================
    const authHeader = req.headers.get("Authorization");
    console.log("[delete-user] Auth header:", authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : "MISSING");

    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    // ================================================================
    // STEP 3: VALIDATE CALLER'S JWT (using anon key)
    // ================================================================
    const supabaseWithAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log("[delete-user] Validating JWT...");
    const { data: userData, error: userError } = await supabaseWithAuth.auth.getUser();

    if (userError) {
      console.error("[delete-user] getUser() failed:", userError.message);
      return jsonResponse({ error: `Invalid token: ${userError.message}` }, 401);
    }

    if (!userData?.user) {
      console.error("[delete-user] getUser() returned no user");
      return jsonResponse({ error: "Invalid token — no user found" }, 401);
    }

    const callerId = userData.user.id;
    console.log("[delete-user] JWT valid. Caller:", callerId, userData.user.email);

    // ================================================================
    // STEP 4: CHECK CALLER IS ADMIN (using service_role to bypass RLS)
    // ================================================================
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, name, email")
      .eq("id", callerId)
      .single();

    if (profileError) {
      console.error("[delete-user] Profile lookup failed:", profileError);
      return jsonResponse({ error: `Failed to verify role: ${profileError.message}` }, 500);
    }

    if (!callerProfile || callerProfile.role !== "admin") {
      console.error("[delete-user] Not admin:", callerProfile?.role);
      return jsonResponse({ error: `Forbidden — role '${callerProfile?.role ?? "unknown"}' is not admin` }, 403);
    }

    console.log("[delete-user] Admin verified:", callerProfile.name);

    // ================================================================
    // STEP 5: PARSE AND VALIDATE REQUEST BODY
    // ================================================================
    let body: { targetUserId?: string };

    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body — expected { targetUserId: string }" }, 400);
    }

    console.log("[delete-user] Request body:", JSON.stringify(body));

    const { targetUserId } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return jsonResponse({ error: "Missing or invalid targetUserId" }, 400);
    }

    // Prevent self-deletion
    if (targetUserId === callerId) {
      return jsonResponse({ error: "Cannot delete your own account" }, 400);
    }

    // ================================================================
    // STEP 6: VERIFY TARGET EXISTS (using service_role)
    // ================================================================
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email")
      .eq("id", targetUserId)
      .single();

    if (targetError) {
      console.error("[delete-user] Target lookup failed:", targetError);
      return jsonResponse({ error: `Target lookup failed: ${targetError.message}` }, 500);
    }

    if (!targetProfile) {
      return jsonResponse({ error: `No user found with id: ${targetUserId}` }, 404);
    }

    console.log("[delete-user] Target found:", targetProfile.name, targetProfile.email);

    // ================================================================
    // STEP 7: DELETE USER FROM AUTH (cascades to profiles via ON DELETE CASCADE)
    // ================================================================
    console.log("[delete-user] Deleting auth user:", targetUserId);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error("[delete-user] Auth delete FAILED:", deleteError.message);
      return jsonResponse({ error: `Failed to delete user: ${deleteError.message}` }, 500);
    }

    console.log("[delete-user] Auth user deleted successfully");

    // ================================================================
    // STEP 8: AUDIT LOG (non-fatal)
    // ================================================================
    try {
      await supabaseAdmin.from("activity_logs").insert({
        type: "admin_user_delete",
        title: `${targetProfile.name} (${targetProfile.email}) was deleted`,
        details: {
          deletedUserId: targetUserId,
          deletedUserName: targetProfile.name,
          deletedUserEmail: targetProfile.email,
          adminId: callerId,
          adminEmail: callerProfile.email,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[delete-user] Audit log failed (non-fatal):", e);
    }

    // ================================================================
    // STEP 9: RETURN SUCCESS
    // ================================================================
    console.log("[delete-user] SUCCESS:", { deletedUserId: targetUserId });
    return jsonResponse({ success: true }, 200);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[delete-user] UNHANDLED ERROR:", error);
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
