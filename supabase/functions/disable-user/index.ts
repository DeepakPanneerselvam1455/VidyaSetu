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

    console.log("[disable-user] ENV check:", {
      hasUrl: !!SUPABASE_URL,
      hasServiceKey: !!SERVICE_ROLE_KEY,
      hasAnonKey: !!ANON_KEY,
    });

    if (!SUPABASE_URL) {
      console.error("[disable-user] MISSING SUPABASE_URL — set in Edge Function secrets");
      return jsonResponse({ error: "Server misconfiguration — missing SUPABASE_URL" }, 500);
    }

    // Service role key is REQUIRED for admin operations (bypasses RLS)
    if (!SERVICE_ROLE_KEY) {
      console.error("[disable-user] MISSING SUPABASE_SERVICE_ROLE_KEY — set in Edge Function secrets");
      return jsonResponse({ 
        error: "Server misconfiguration — SUPABASE_SERVICE_ROLE_KEY required for admin operations",
        hint: "Get service role key from Supabase Dashboard → Settings → API → service_role key"
      }, 500);
    }

    // Anon key is also required for initial JWT validation
    if (!ANON_KEY) {
      console.error("[disable-user] MISSING SUPABASE_ANON_KEY — set in Edge Function secrets");
      return jsonResponse({ 
        error: "Server misconfiguration — SUPABASE_ANON_KEY required for JWT validation",
        hint: "Get anon key from Supabase Dashboard → Settings → API → anon key"
      }, 500);
    }

    // ================================================================
    // STEP 2: VALIDATE AUTHORIZATION HEADER
    // ================================================================
    const authHeader = req.headers.get("Authorization");
    console.log("[disable-user] Auth header:", authHeader ? `Bearer ${authHeader.substring(7, 20)}...` : "MISSING");

    if (!authHeader) {
      return jsonResponse({ error: "Missing Authorization header" }, 401);
    }

    // ================================================================
    // STEP 3: VALIDATE THE CALLER'S JWT (using anon key for JWT validation)
    // We use anon key for JWT validation, service role key for admin operations
    // ================================================================
    const supabaseWithAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log("[disable-user] Calling getUser() to validate JWT...");
    const { data: userData, error: userError } = await supabaseWithAuth.auth.getUser();

    if (userError) {
      console.error("[disable-user] getUser() failed:", userError.message);
      return jsonResponse({ error: `Invalid token: ${userError.message}` }, 401);
    }

    if (!userData?.user) {
      console.error("[disable-user] getUser() returned no user");
      return jsonResponse({ error: "Invalid token — no user found" }, 401);
    }

    const callerId = userData.user.id;
    console.log("[disable-user] JWT valid. Caller:", callerId, userData.user.email);

    // ================================================================
    // STEP 4: CHECK CALLER IS ADMIN (using service role key to bypass RLS)
    // ================================================================
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, name, email")
      .eq("id", callerId)
      .single();

    if (profileError) {
      console.error("[disable-user] Profile lookup failed:", profileError);
      return jsonResponse({ error: `Failed to verify your role: ${profileError.message}` }, 500);
    }

    if (!callerProfile || callerProfile.role !== "admin") {
      console.error("[disable-user] Not admin:", callerProfile?.role);
      return jsonResponse({ error: `Forbidden — role '${callerProfile?.role ?? "unknown"}' is not admin` }, 403);
    }

    console.log("[disable-user] Admin verified:", callerProfile.name);

    // ================================================================
    // STEP 5: PARSE AND VALIDATE REQUEST BODY
    // ================================================================
    let body: { targetUserId?: string; disable?: boolean };

    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body — expected { targetUserId: string, disable: boolean }" }, 400);
    }

    console.log("[disable-user] Request body:", JSON.stringify(body));

    const { targetUserId, disable } = body;

    if (!targetUserId || typeof targetUserId !== "string") {
      return jsonResponse({ error: "Missing or invalid targetUserId" }, 400);
    }

    if (typeof disable !== "boolean") {
      return jsonResponse({ error: "Missing or invalid disable (must be true or false)" }, 400);
    }

    // Prevent self-disable
    if (targetUserId === callerId) {
      return jsonResponse({ error: "Cannot disable your own account" }, 400);
    }

    // ================================================================
    // STEP 6: VERIFY TARGET USER EXISTS (using service role key)
    // ================================================================
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, accountStatus")
      .eq("id", targetUserId)
      .single();

    if (targetError) {
      console.error("[disable-user] Target lookup failed:", targetError);
      return jsonResponse({ error: `Target lookup failed: ${targetError.message}` }, 500);
    }

    if (!targetProfile) {
      return jsonResponse({ error: `No user found with id: ${targetUserId}` }, 404);
    }

    console.log("[disable-user] Target:", targetProfile.name, "current status:", targetProfile.accountStatus);

    // ================================================================
    // STEP 7: UPDATE PROFILE STATUS IN DATABASE (using service role key)
    // ================================================================
    const newStatus = disable ? "DISABLED" : "ENABLED";

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ accountStatus: newStatus })
      .eq("id", targetUserId)
      .select("id, name, email, accountStatus")
      .single();

    if (updateError) {
      console.error("[disable-user] UPDATE FAILED:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      return jsonResponse({ error: `Database update failed: ${updateError.message}` }, 500);
    }

    console.log("[disable-user] Profile updated:", updatedProfile);

    // ================================================================
    // STEP 8: UPDATE AUTH BAN STATE (using service role key)
    // ================================================================
    if (disable) {
      console.log("[disable-user] Banning user for 87600h...");
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: "87600h",
      });
      if (banError) {
        console.error("[disable-user] Ban failed (non-fatal):", banError.message);
      }
    } else {
      console.log("[disable-user] Unbanning user...");
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        ban_duration: "none",
      });
      if (unbanError) {
        console.error("[disable-user] Unban failed (non-fatal):", unbanError.message);
      }
    }

    // ================================================================
    // STEP 9: AUDIT LOG (non-fatal, using service role key)
    // ================================================================
    try {
      await supabaseAdmin.from("activity_logs").insert({
        type: `admin_user_${disable ? "disabled" : "enabled"}`,
        title: `${targetProfile.name} was ${disable ? "disabled" : "enabled"}`,
        details: {
          targetUserId,
          targetUserName: targetProfile.name,
          targetUserEmail: targetProfile.email,
          previousStatus: targetProfile.accountStatus,
          newStatus,
          adminId: callerId,
          adminEmail: callerProfile.email,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.error("[disable-user] Audit log failed (non-fatal):", e);
    }

    // ================================================================
    // STEP 10: RETURN SUCCESS
    // ================================================================
    console.log("[disable-user] SUCCESS:", { targetUserId, newStatus });
    return jsonResponse({
      success: true,
      data: updatedProfile,
    }, 200);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[disable-user] UNHANDLED ERROR:", error);
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(data: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
