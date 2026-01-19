import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  priceId: string;
  planName: string;
  userId?: string;
  userEmail?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Get request body
    const { priceId, planName, userId, userEmail }: CheckoutRequest =
      await req.json();

    if (!priceId || !planName) {
      return new Response(
        JSON.stringify({ error: "priceId and planName are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    if (userId) {
      // Get user from database
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("stripe_customer_id, email")
        .eq("id", userId)
        .single();

      if (userError && userError.code !== "PGRST116") {
        console.error("Error fetching user:", userError);
      }

      if (user?.stripe_customer_id) {
        stripeCustomerId = user.stripe_customer_id;
      } else {
        // Create Stripe customer
        const stripeResponse = await fetch(
          "https://api.stripe.com/v1/customers",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${stripeSecretKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              email: userEmail || user?.email || "",
              metadata: JSON.stringify({ user_id: userId }),
            }),
          }
        );

        if (!stripeResponse.ok) {
          const error = await stripeResponse.text();
          throw new Error(`Failed to create Stripe customer: ${error}`);
        }

        const customer = await stripeResponse.json();
        stripeCustomerId = customer.id;

        // Save Stripe customer ID to database
        await supabase
          .from("users")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", userId);
      }
    }

    // Create Stripe checkout session
    const sessionParams: Record<string, string> = {
      payment_method_types: "card",
      mode: planName.includes("Monthly") ? "subscription" : "payment",
      line_items: JSON.stringify([
        {
          price: priceId,
          quantity: 1,
        },
      ]),
      success_url: `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get("SITE_URL") || "http://localhost:5173"}/billing?canceled=true`,
      metadata: JSON.stringify({
        plan_name: planName,
        user_id: userId || "",
      }),
    };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    }

    const sessionResponse = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(sessionParams),
      }
    );

    if (!sessionResponse.ok) {
      const error = await sessionResponse.text();
      throw new Error(`Failed to create checkout session: ${error}`);
    }

    const session = await sessionResponse.json();

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

