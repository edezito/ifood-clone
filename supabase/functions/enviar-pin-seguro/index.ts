// supabase/functions/enviar-pin-seguro/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, nome, pedidoId, total, endereco } = await req.json()
    
    console.log('📥 Enviando PIN para:', email)
    console.log('📦 Pedido:', pedidoId)

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Método: Gerar link de reautenticação (envia email com token)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'reauthentication',  // Usando o template que você acabou de configurar
      email: email,
      options: {
        data: { 
          nome: nome || 'Cliente',
          pedidoId: pedidoId || 'N/A',
          total: total || '0.00',
          endereco: endereco || 'Endereço não informado'
        }
      }
    })

    if (error) {
      console.error('❌ Erro:', error)
      throw error
    }

    console.log('✅ Email enviado com sucesso!')
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'PIN enviado com sucesso',
        email: email 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})