// Monthly points reset function
// This function is meant to be scheduled to run on the first day of each month at midnight

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Call the database function to reset monthly points
    const { data, error } = await supabase.rpc("reset_monthly_points");

    if (error) throw error;

    // Log the operation
    await supabase.from("system_logs").insert({
      operation: "monthly_points_reset",
      status: "success",
      details: "Monthly points reset completed successfully",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Monthly points reset completed successfully",
      }),
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        status: 200,
      },
    );
  } catch (error) {
    // Log the error
    await supabase
      .from("system_logs")
      .insert({
        operation: "monthly_points_reset",
        status: "error",
        details: error.message,
      })
      .catch(() => {});

    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      status: 400,
    });
  }
});
