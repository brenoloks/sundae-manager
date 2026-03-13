import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is owner or super_admin
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await supabaseClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: callerRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", caller.id);
    const callerRole = callerRoles?.[0]?.role;
    if (callerRole !== "owner" && callerRole !== "super_admin") {
      return new Response(JSON.stringify({ error: "Sem permissão" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { email, password, full_name, role, tenant_id, store_id } = await req.json();

    if (!email || !password || !full_name || !role || !tenant_id) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: email, password, full_name, role, tenant_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!["manager", "cashier"].includes(role)) {
      return new Response(JSON.stringify({ error: "Role deve ser manager ou cashier" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If caller is owner, verify they own this tenant
    if (callerRole === "owner") {
      const { data: callerProfile } = await supabaseAdmin.from("profiles").select("tenant_id").eq("id", caller.id).single();
      if (callerProfile?.tenant_id !== tenant_id) {
        return new Response(JSON.stringify({ error: "Você não pertence a este tenant" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Create user with admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userId = newUser.user.id;

    // Update profile with tenant_id and store_id
    await supabaseAdmin.from("profiles").update({
      tenant_id,
      store_id: store_id || null,
      full_name,
    }).eq("id", userId);

    // Assign role
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role,
    });

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
