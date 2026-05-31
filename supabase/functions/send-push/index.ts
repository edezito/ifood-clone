import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    console.log("📱 Push payload:", JSON.stringify(body));

    const {
      usuario_id,
      pedido_id,
      titulo,
      mensagem,
      tipo,
      dados = {}
    } = body;

    // Validação
    if (!usuario_id || !titulo || !mensagem) {
      return new Response(
        JSON.stringify({ 
          error: "usuario_id, titulo e mensagem são obrigatórios" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar tokens do usuário
    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from("push_tokens")
      .select("token, plataforma")
      .eq("usuario_id", usuario_id);

    if (tokenError) {
      console.error("❌ Erro ao buscar tokens:", tokenError);
      throw tokenError;
    }

    // Salvar notificação no histórico (mesmo sem tokens)
    await supabaseAdmin.from("notificacoes_push").insert({
      usuario_id,
      pedido_id: pedido_id || null,
      titulo,
      mensagem,
      tipo: tipo || "geral",
      dados: dados
    });

    if (!tokens || tokens.length === 0) {
      console.log("⚠️ Nenhum token push encontrado para usuário:", usuario_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notificação salva, mas nenhum dispositivo encontrado",
          tokens_encontrados: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enviar push para cada token
    const resultados = await Promise.allSettled(
      tokens.map(async ({ token, plataforma }) => {
        const message = {
          to: token,
          sound: "default",
          title: titulo,
          body: mensagem,
          data: { 
            ...dados,
            pedido_id: pedido_id || "",
            tipo: tipo || "geral"
          },
          priority: "high",
          channelId: "default",
        };

        const response = await fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(`Expo API error: ${JSON.stringify(result)}`);
        }

        return { token, plataforma, result };
      })
    );

    // Remover tokens inválidos
    let tokensRemovidos = 0;
    for (let i = 0; i < resultados.length; i++) {
      const result = resultados[i];
      if (result.status === "rejected") {
        const errorMsg = result.reason?.message || String(result.reason);
        console.error(`❌ Token ${i} falhou:`, errorMsg);
        
        // Se for erro de dispositivo não registrado, remove o token
        if (errorMsg.includes("DeviceNotRegistered")) {
          await supabaseAdmin
            .from("push_tokens")
            .delete()
            .eq("token", tokens[i].token);
          tokensRemovidos++;
        }
      }
    }

    const sucessos = resultados.filter(r => r.status === "fulfilled").length;
    console.log(`✅ ${sucessos}/${tokens.length} push enviados, ${tokensRemovidos} tokens removidos`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${sucessos} de ${tokens.length} notificações enviadas`,
        total_tokens: tokens.length,
        enviadas: sucessos,
        tokens_removidos: tokensRemovidos
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("🔥 Erro:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});