// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js"

console.log("Iniciando Edge Function: api-dados-analista")

Deno.serve(async (req) => {
  // 1. Segurança: Pega a URL da requisição e verifica o token
  const url = new URL(req.url)
  const token = url.searchParams.get("token")

  // Validação simples (mude para a senha que preferir)
  if (token !== "123456") {
    return new Response(
      JSON.stringify({ erro: "Acesso não autorizado. Verifique o token." }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    // 2. Inicializa o Supabase ignorando as políticas de segurança (RLS) para poder ler tudo
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. Faz a consulta na tabela 'pedidos'
    // Trazemos os mais recentes primeiro e limitamos a 5000 para não estourar a memória
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(5000)

    if (error) {
      throw error
    }

    // 4. Retorna os dados formatados em JSON para o Power BI / Python / Excel
    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Erro ao processar a requisição:", error)
    return new Response(
      JSON.stringify({ erro: "Erro interno no servidor", detalhes: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})