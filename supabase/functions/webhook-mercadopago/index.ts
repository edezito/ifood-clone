import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("data.id") || url.searchParams.get("id");
    const type = url.searchParams.get("type");

    console.log(`🔔 Notificação recebida: ID ${id} | Tipo: ${type}`);

    // Se for apenas o teste do simulador com ID fake, respondemos 200 para o MP parar de tentar
    if (id === "123456") {
      return new Response(JSON.stringify({ message: "Teste recebido com sucesso" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "payment" && id) {
      const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

      // 1. Consulta o pagamento no Mercado Pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!mpResponse.ok) throw new Error("Erro ao consultar pagamento no MP");

      const paymentData = await mpResponse.json();

      // 2. Se aprovado, atualiza o banco
      if (paymentData.status === "approved") {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // O Supabase já injeta essa secret automaticamente
        );

        const pedidoId = paymentData.external_reference;

        const { error } = await supabase
          .from("pedidos")
          .update({ status: "pago", pago: true })
          .eq("id", pedidoId);

        if (error) throw error;
        console.log(`✅ Pedido ${pedidoId} atualizado para PAGO`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Erro no Webhook:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});