import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📦 Body recebido:', JSON.stringify(body))

    const { email, nome, pedidoId, pin, total, endereco } = body

    // Validação
    if (!email || !pin) {
      const faltando = []
      if (!email) faltando.push('email')
      if (!pin) faltando.push('pin')
      console.warn('⚠️ Campos obrigatórios ausentes:', faltando.join(', '))
      return new Response(
        JSON.stringify({ error: `Campos obrigatórios: ${faltando.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY')
    if (!SENDGRID_KEY) {
      console.error('❌ SENDGRID_API_KEY não configurada')
      throw new Error('SENDGRID_API_KEY ausente no servidor')
    }

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: 'eder.bento@aluno.impacta.edu.br', name: 'FoodExpress' },
        subject: `🔐 Seu PIN de entrega - Pedido #${pedidoId || 'N/A'}`,
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2>Olá, ${nome || 'Cliente'}!</h2>
              <p>Seu pedido <strong>#${pedidoId || 'N/A'}</strong> está em trânsito.</p>
              <p><strong>Valor total:</strong> ${total || 'N/A'}</p>
              <p><strong>Endereço:</strong> ${endereco || 'Não informado'}</p>
              <div style="background:#f4f4f4;padding:24px;text-align:center;border-radius:12px;margin:20px 0">
                <p style="font-size:14px;color:#888">SEU PIN DE ENTREGA</p>
                <h1 style="font-size:36px;letter-spacing:8px;margin:0;color:#333">${pin}</h1>
              </div>
              <p style="color:#666">Apresente este código ao entregador.</p>
            </div>
          `,
        }],
      }),
    })

    if (!sendgridResponse.ok) {
      const err = await sendgridResponse.json()
      console.error('❌ Erro SendGrid:', JSON.stringify(err))
      throw new Error(err.errors?.[0]?.message || 'Falha ao enviar e-mail')
    }

    console.log('✅ E-mail enviado com sucesso')
    return new Response(
      JSON.stringify({ success: true, message: 'PIN enviado com sucesso', email }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('🔥 Erro capturado:', error?.message || error)
    return new Response(
      JSON.stringify({ error: error?.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})