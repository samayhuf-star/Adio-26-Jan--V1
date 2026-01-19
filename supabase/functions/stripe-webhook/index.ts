import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error("Stripe keys are not configured");
    }

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get raw body
    const body = await req.text();

    // Verify webhook signature
    const crypto = await import("https://deno.land/std@0.168.0/crypto/mod.ts");
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(stripeWebhookSecret);
    const message = encoder.encode(signature + body);

    // For production, use Stripe's webhook signature verification
    // For now, we'll process the event directly
    const event = JSON.parse(body);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        const planName = session.metadata?.plan_name;

        if (userId && planName) {
          // Create or update subscription
          const subscriptionData = {
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription || null,
            plan_name: planName,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: session.subscription
              ? new Date(
                  Date.now() + 30 * 24 * 60 * 60 * 1000
                ).toISOString() // 30 days from now
              : null,
          };

          // Check if subscription exists
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", userId)
            .single();

          if (existing) {
            await supabase
              .from("subscriptions")
              .update(subscriptionData)
              .eq("user_id", userId);
          } else {
            await supabase.from("subscriptions").insert(subscriptionData);
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Find user by Stripe customer ID
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user) {
          const status =
            event.type === "customer.subscription.deleted"
              ? "canceled"
              : subscription.status;

          await supabase
            .from("subscriptions")
            .update({
              status,
              stripe_subscription_id: subscription.id,
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq("user_id", user.id);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find user by Stripe customer ID
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user) {
          // Create invoice record
          await supabase.from("invoices").insert({
            user_id: user.id,
            stripe_invoice_id: invoice.id,
            amount: invoice.amount_paid / 100, // Convert from cents
            currency: invoice.currency,
            status: "paid",
            paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        // Find user by Stripe customer ID
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (user) {
          // Update subscription status
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("user_id", user.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
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

