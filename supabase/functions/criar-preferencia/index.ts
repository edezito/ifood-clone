// supabase/functions/criar-preferencia/index.ts (CORRIGIDO)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("📦 Body recebido:", JSON.stringify(body));
    
    const { carrinho, tipoEntrega, usuarioLogado } = body;

    // VALIDAR carrinho
    if (!carrinho || carrinho.length === 0) {
      throw new Error("Carrinho vazio ou inválido");
    }

    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    if (!MP_ACCESS_TOKEN) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
    }

    // Mapear itens
    const items = carrinho.map((item: any) => ({
      id: item.id?.toString() || Math.random().toString(36).substring(7),
      title: item.nome || "Produto",
      description: item.descricao || `${item.quantidade || 1}x ${item.nome || "Produto"}`,
      quantity: Number(item.quantidade) || 1,
      unit_price: Number(item.preco) || 0,
      currency_id: "BRL",
    }));

    // Adicionar taxa de entrega SOMENTE se for Entrega
    if (tipoEntrega === "Entrega") {
      items.push({
        id: "taxa-entrega",
        title: "Taxa de Entrega",
        description: "Taxa de serviço de entrega",
        quantity: 1,
        unit_price: 4.99,
        currency_id: "BRL",
      });
    }

    console.log("📦 Itens processados:", JSON.stringify(items));

    // URLs de retorno (usar localhost como fallback)
    const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "http://localhost:5173";
    
    // Criar preferência
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items,
        payer: {
          name: usuarioLogado?.nome || "Cliente FoodExpress",
          email: usuarioLogado?.email || "cliente@foodexpress.com",
        },
        back_urls: {
          success: `${FRONTEND_URL}/pedido-confirmado`,
          failure: `${FRONTEND_URL}/erro-pagamento`,
          pending: `${FRONTEND_URL}/pagamento-pendente`,
        },
        auto_return: "approved",
        notification_url: `${FRONTEND_URL}/api/webhook-mercadopago`,
        external_reference: `pedido_${Date.now()}`,
        statement_descriptor: "FoodExpress",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erro MP:", JSON.stringify(data));
      throw new Error(data.message || "Erro ao criar preferência");
    }

    console.log("✅ Preferência criada:", data.id);

    return new Response(
      JSON.stringify({
        preferenceId: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🔥 Erro:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});