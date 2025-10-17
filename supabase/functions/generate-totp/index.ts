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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user already has a TOTP secret
    const { data: existingProfile, error: fetchError } = await supabase
      .from("user_profiles")
      .select("totp_secret, mfa_enabled")
      .eq("user_id", userId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      throw new Error(`Error fetching user profile: ${fetchError.message}`);
    }

    // If MFA is already enabled, don't generate a new secret
    if (existingProfile?.mfa_enabled && existingProfile?.totp_secret) {
      throw new Error("MFA is already enabled for this user");
    }

    // Generate a new TOTP secret
    const issuer = "eVuka Rewards";

    // Get user email for the label
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);
    if (userError) {
      throw new Error(`Error fetching user: ${userError.message}`);
    }

    const email = userData.user?.email || "user";

    // Generate new TOTP
    const totp = new OTPAuth.TOTP({
      issuer,
      label: email,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.generate(20), // Generate a random secret
    });

    const secret = totp.secret.base32;

    // Store the secret in the user's profile
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ totp_secret: secret })
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(`Error updating user profile: ${updateError.message}`);
    }

    // Generate QR code URL
    const qrCodeUrl = totp.toString();

    return new Response(
      JSON.stringify({
        secret,
        qrCodeUrl: `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(qrCodeUrl)}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
