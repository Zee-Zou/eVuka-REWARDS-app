import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import * as OTPAuth from "https://esm.sh/otpauth@9.2.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, code, secret: setupSecret } = await req.json();

    if (!userId || !code) {
      throw new Error("User ID and verification code are required");
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If we're in setup mode, use the provided secret
    // Otherwise, fetch the user's stored secret
    let secret;
    if (setupSecret) {
      secret = setupSecret;
    } else {
      // Get the user's TOTP secret from the database
      const { data: profile, error: fetchError } = await supabase
        .from("user_profiles")
        .select("totp_secret, mfa_enabled")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        throw new Error(`Error fetching user profile: ${fetchError.message}`);
      }

      if (!profile.totp_secret) {
        throw new Error("TOTP secret not found for this user");
      }

      secret = profile.totp_secret;
    }

    // Get user email for the label
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);
    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    const email = userData.user?.email || "user";
    const issuer = "eVuka Rewards";

    // Create TOTP object with the secret
    const totp = new OTPAuth.TOTP({
      issuer,
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret,
    });

    // Verify the code
    const delta = totp.validate({ token: code, window: 1 });
    const isValid = delta !== null;

    // If this is a setup verification and it's valid, enable MFA for the user
    if (isValid && setupSecret) {
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ mfa_enabled: true })
        .eq("user_id", userId);

      if (updateError) {
        throw new Error(`Error enabling MFA: ${updateError.message}`);
      }
    }

    return new Response(JSON.stringify({ valid: isValid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
