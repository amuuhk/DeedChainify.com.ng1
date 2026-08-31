import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, email, amount, reference, recipient_code, transfer_amount } = await req.json();

    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "PAYSTACK_SECRET_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const headers = {
      "Authorization": `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    };

    if (action === "initialize") {
      if (!email || !amount) {
        return new Response(
          JSON.stringify({ error: "Email and amount required for initialization" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const response = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          amount: amount * 100,
          reference: reference || `DC-${Date.now()}`,
          callback_url: `${req.headers.get("origin")}/verify`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: data.message || "Failed to initialize payment" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: true, authorization_url: data.data.authorization_url, reference: data.data.reference }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "verify") {
      if (!reference) {
        return new Response(
          JSON.stringify({ error: "Reference required for verification" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: data.message || "Failed to verify payment" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: data.data.status, amount: data.data.amount / 100 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "withdraw") {
      if (!recipient_code || !transfer_amount) {
        return new Response(
          JSON.stringify({ error: "Recipient code and amount required for withdrawal" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const response = await fetch("https://api.paystack.co/transfer", {
        method: "POST",
        headers,
        body: JSON.stringify({
          source: "balance",
          amount: transfer_amount * 100,
          recipient: recipient_code,
          reason: "DeedChainify landlord withdrawal",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: data.message || "Failed to initiate withdrawal" }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ success: true, transfer_code: data.data.transfer_code, status: data.data.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: initialize, verify, or withdraw" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
