import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { carrinho, tipoEntrega, taxaFrete, usuarioLogado, pedidoId } = body;

    // ✅ LOGS PARA DEBUG
    console.log("=== DADOS RECEBIDOS NA EDGE FUNCTION ===");
    console.log("tipoEntrega:", tipoEntrega);
    console.log("taxaFrete recebido:", taxaFrete);
    console.log("pedidoId:", pedidoId);
    console.log("usuarioLogado:", usuarioLogado?.email);

    // ✅ Usando as credenciais de teste
    // IMPORTANTE: Você precisa configurar a variável de ambiente no Supabase com o Access Token de teste
    // O Access Token de teste deve começar com "TEST-"
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN_TEST") || 
                            Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    
    // ✅ Verifica se é token de teste
    if (!MP_ACCESS_TOKEN) {
      console.error("❌ MERCADO_PAGO_ACCESS_TOKEN não configurado");
      throw new Error("Mercado Pago não configurado");
    }
    
    if (!MP_ACCESS_TOKEN.startsWith("TEST")) {
      console.warn("⚠️ ATENÇÃO: Token não é de teste! Use token que começa com TEST-");
      console.warn("Token atual (primeiros 10 chars):", MP_ACCESS_TOKEN.substring(0, 10));
    } else {
      console.log("✅ Token de TESTE detectado");
    }

    // ✅ Detecta ambiente
    const origin = req.headers.get("origin") || "";
    const isLocalhost = origin.includes("localhost") || origin.includes("127.0.0.1");
    const FRONTEND_URL = isLocalhost 
      ? "http://localhost:5173" 
      : "https://ifood-clone-xi.vercel.app";
    
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

    console.log(`🌍 Ambiente: ${isLocalhost ? "localhost (desenvolvimento)" : "produção"}`);
    console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);

    // ✅ Converte os itens do carrinho
    const items = carrinho.map((item: any) => ({
      id: item.id?.toString(),
      title: item.nome,
      quantity: Number(item.quantidade),
      unit_price: Number(item.preco),
      currency_id: "BRL",
    }));

    // ✅ Calcula o valor do frete
    const valorFrete = Number(taxaFrete) || 0;
    console.log("💰 valorFrete calculado:", valorFrete);
    
    // ✅ Adiciona o frete se for entrega
    const isEntrega = tipoEntrega === "Entrega" || tipoEntrega === "entrega";
    
    if (isEntrega && valorFrete > 0) {
      console.log(`✅ Adicionando frete de R$ ${valorFrete.toFixed(2)} ao pagamento`);
      items.push({
        title: "Taxa de Entrega",
        description: `Frete para entrega do pedido`,
        quantity: 1,
        unit_price: parseFloat(valorFrete.toFixed(2)),
        currency_id: "BRL",
      });
    }

    console.log("📦 Items finais enviados para MP:", JSON.stringify(items, null, 2));

    // ✅ Cria a preferência no Mercado Pago (configuração para TESTE)
    const preferenceBody = {
      items,
      payer: {
        name: usuarioLogado?.nome || "Cliente Teste",
        email: usuarioLogado?.email || "testuser@mercadopago.com.br",
      },
      back_urls: {
        success: `${FRONTEND_URL}/checkout?step=confirmado&pedidoId=${pedidoId}`,
        failure: `${FRONTEND_URL}/checkout?error=pagamento_recusado`,
        pending: `${FRONTEND_URL}/checkout?step=pendente`,
      },
      auto_return: "approved",
      external_reference: pedidoId,
      statement_descriptor: "IFOODCLONE_TEST",
      // 🔥 Configurações importantes para ambiente de teste
      binary_mode: true,  // Modo binário para testes
      // Força o ambiente de sandbox
      sandbox: true,
    };

    // ✅ Remove notification_url em ambiente de teste se não configurado
    if (SUPABASE_URL && !isLocalhost) {
      // @ts-ignore
      preferenceBody.notification_url = `${SUPABASE_URL}/functions/v1/webhook-mercadopago`;
    }

    console.log("📤 Enviando preferência para Mercado Pago (TESTE)...");
    console.log("Preference Body:", JSON.stringify(preferenceBody, null, 2));

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
        "X-Platform-Id": "MP",  // Identificador de plataforma
      },
      body: JSON.stringify(preferenceBody),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Erro Mercado Pago:", data);
      // 🔥 Mensagem de erro mais amigável
      if (data.message && data.message.includes("test")) {
        throw new Error("Configure o Access Token de teste no Supabase. O token deve começar com TEST-");
      }
      throw new Error(data.message || "Erro ao criar preferência");
    }

    console.log("✅ Preferência criada com sucesso!");
    console.log("🆔 Preference ID:", data.id);
    console.log("🔗 Init Point:", data.init_point);
    console.log("🏷️ Modo: TESTE (sandbox)");

    return new Response(
      JSON.stringify({ 
        preferenceId: data.id, 
        initPoint: data.init_point,
        mode: "test"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Erro na Edge Function:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: corsHeaders }
    );
  }
});