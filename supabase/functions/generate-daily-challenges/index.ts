// Generate daily challenges function
// This function is meant to be scheduled to run every day at midnight

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Challenge templates
const challengeTemplates = [
  {
    title: "Grocery Run",
    description: "Scan a receipt from a grocery store",
    points_reward: 50,
  },
  {
    title: "Big Spender",
    description: "Scan a receipt with a total over $50",
    points_reward: 75,
  },
  {
    title: "Early Bird",
    description: "Scan a receipt before 10am",
    points_reward: 50,
  },
  {
    title: "Night Owl",
    description: "Scan a receipt after 8pm",
    points_reward: 50,
  },
  {
    title: "Weekend Warrior",
    description: "Scan 3 receipts over the weekend",
    points_reward: 100,
  },
  {
    title: "Variety Shopper",
    description: "Scan receipts from 2 different stores today",
    points_reward: 75,
  },
  {
    title: "Healthy Choices",
    description: "Scan a receipt containing fruits or vegetables",
    points_reward: 50,
  },
  {
    title: "Bargain Hunter",
    description: "Scan a receipt with at least one discounted item",
    points_reward: 60,
  },
  {
    title: "Local Support",
    description: "Scan a receipt from a local business",
    points_reward: 80,
  },
  {
    title: "Quick Scan",
    description: "Scan a receipt within 1 hour of purchase",
    points_reward: 70,
  },
];

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
    // Deactivate yesterday's challenges
    const { error: deactivateError } = await supabase
      .from("daily_challenges")
      .update({ is_active: false })
      .lt("end_date", new Date().toISOString());

    if (deactivateError) throw deactivateError;

    // Select 3-5 random challenges for today
    const numChallenges = Math.floor(Math.random() * 3) + 3; // 3-5 challenges
    const shuffled = [...challengeTemplates].sort(() => 0.5 - Math.random());
    const selectedChallenges = shuffled.slice(0, numChallenges);

    // Set date range for challenges (today)
    const now = new Date();
    const startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    const endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();

    // Insert new challenges
    const { data, error } = await supabase.from("daily_challenges").insert(
      selectedChallenges.map((challenge) => ({
        ...challenge,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      })),
    );

    if (error) throw error;

    // Log the operation
    await supabase.from("system_logs").insert({
      operation: "generate_daily_challenges",
      status: "success",
      details: `Generated ${selectedChallenges.length} daily challenges`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${selectedChallenges.length} daily challenges`,
        challenges: selectedChallenges,
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
        operation: "generate_daily_challenges",
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
