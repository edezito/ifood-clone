// supabase/functions/criar-preferencia/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { carrinho, tipoEntrega, usuarioLogado, pedidoId } = body;

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const FRONTEND_URL = "https://ifood-clone-xi.vercel.app";
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    const items = carrinho.map((item: any) => ({
      id: item.id?.toString(),
      title: item.nome,
      quantity: Number(item.quantidade),
      unit_price: Number(item.preco),
      currency_id: "BRL",
    }));

    if (tipoEntrega === "Entrega") {
      items.push({
        title: "Taxa de Entrega",
        quantity: 1,
        unit_price: 4.99,
        currency_id: "BRL",
      });
    }

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        payer: {
          name: usuarioLogado?.nome || "Cliente",
          email: usuarioLogado?.email,
        },
        back_urls: {
          success: `${FRONTEND_URL}/checkout?step=confirmado&pedidoId=${pedidoId}`,
          failure: `${FRONTEND_URL}/checkout?error=pagamento_recusado`,
          pending: `${FRONTEND_URL}/checkout?step=pendente`,
        },
        auto_return: "approved",
        // O Mercado Pago enviará o POST de confirmação para esta URL:
        notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
        external_reference: pedidoId, // Guardamos o ID do seu banco aqui
      }),
    });

    const data = await response.json();

    return new Response(
      JSON.stringify({ 
        preferenceId: data.id, 
        initPoint: data.init_point 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});