import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const ASAAS_API_URL = "https://api.asaas.com/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      throw new Error("ASAAS_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { empresa_id, nome, email, cpf_cnpj } = body;

    if (!empresa_id || !nome || !email) {
      return new Response(JSON.stringify({ error: "Dados obrigatórios: empresa_id, nome, email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create or find customer in Asaas
    const customerRes = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify({
        name: nome,
        email: email,
        cpfCnpj: cpf_cnpj || undefined,
      }),
    });

    const customerData = await customerRes.json();
    
    if (!customerRes.ok && !customerData.id) {
      // Try to find existing customer by email
      const findRes = await fetch(`${ASAAS_API_URL}/customers?email=${encodeURIComponent(email)}`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      const findData = await findRes.json();
      
      if (!findData.data || findData.data.length === 0) {
        console.error("Asaas customer error:", customerData);
        return new Response(JSON.stringify({ error: "Erro ao criar cliente no Asaas" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      customerData.id = findData.data[0].id;
    }

    const customerId = customerData.id;

    // 2. Create payment in Asaas
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 days to pay
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": ASAAS_API_KEY,
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: "UNDEFINED", // Let customer choose PIX, boleto or card
        value: 39.90,
        dueDate: dueDateStr,
        description: "Guia Local BR - Plano Premium Vitalício",
        externalReference: empresa_id,
      }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok) {
      console.error("Asaas payment error:", paymentData);
      return new Response(JSON.stringify({ error: "Erro ao criar cobrança" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Save payment record in database
    await supabase.from("pagamentos").insert({
      empresa_id,
      user_id: user.id,
      asaas_customer_id: customerId,
      asaas_payment_id: paymentData.id,
      valor: 39.90,
      status: "pendente",
      invoice_url: paymentData.invoiceUrl,
    });

    return new Response(JSON.stringify({
      success: true,
      payment_id: paymentData.id,
      invoice_url: paymentData.invoiceUrl,
      status: paymentData.status,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
