// supabase/functions/send-notification/index.ts
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

    const { 
      email, 
      nome, 
      pedidoId, 
      pin, 
      total, 
      endereco,
      tipo, // 'pedido_confirmado', 'pix_gerado', 'pagamento_confirmado'
      qrcodeUrl,
      valor,
      expiracao
    } = body

    // Validação
    if (!email) {
      console.warn('⚠️ Email ausente')
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY')
    if (!SENDGRID_KEY) {
      console.error('❌ SENDGRID_API_KEY não configurada')
      throw new Error('SENDGRID_API_KEY ausente no servidor')
    }

    let emailContent = '';
    
    // Montar conteúdo do email baseado no tipo
    switch (tipo) {
      case 'pedido_confirmado':
        emailContent = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>Olá, ${nome || 'Cliente'}!</h2>
            <p>Seu pedido <strong>#${pedidoId || 'N/A'}</strong> foi confirmado!</p>
            ${total ? `<p><strong>Valor total:</strong> ${total}</p>` : ''}
            ${endereco ? `<p><strong>Endereço:</strong> ${endereco}</p>` : ''}
            <div style="background:#f4f4f4;padding:24px;text-align:center;border-radius:12px;margin:20px 0">
              <p style="font-size:14px;color:#888">SEU PIN DE ENTREGA</p>
              <h1 style="font-size:36px;letter-spacing:8px;margin:0;color:#333">${pin || 'N/A'}</h1>
            </div>
            <p style="color:#666">Apresente este código ao entregador.</p>
          </div>
        `;
        break;
        
      case 'pix_gerado':
        emailContent = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>Pagamento PIX Gerado</h2>
            <p>Olá, ${nome || 'Cliente'}!</p>
            <p>Seu pedido <strong>#${pedidoId || 'N/A'}</strong> aguarda pagamento.</p>
            ${valor ? `<p><strong>Valor:</strong> R$ ${valor}</p>` : ''}
            ${expiracao ? `<p><strong>Expira em:</strong> ${expiracao}</p>` : ''}
            <div style="background:#f4f4f4;padding:20px;text-align:center;border-radius:12px;margin:20px 0">
              <p style="color:#666">Escaneie o QR Code no app ou site para pagar</p>
            </div>
            <p style="color:#666">O pedido será confirmado após a aprovação do pagamento.</p>
          </div>
        `;
        break;
        
      case 'pagamento_confirmado':
        emailContent = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>✅ Pagamento Confirmado!</h2>
            <p>Olá, ${nome || 'Cliente'}!</p>
            <p>O pagamento do pedido <strong>#${pedidoId || 'N/A'}</strong> foi aprovado.</p>
            ${total ? `<p><strong>Valor:</strong> ${total}</p>` : ''}
            <p>Seu pedido está sendo preparado e logo será enviado.</p>
          </div>
        `;
        break;
        
      default:
        emailContent = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>Notificação FoodExpress</h2>
            <p>Olá, ${nome || 'Cliente'}!</p>
            <p>Pedido #${pedidoId || 'N/A'}</p>
            ${total ? `<p><strong>Total:</strong> ${total}</p>` : ''}
          </div>
        `;
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
        subject: `FoodExpress - ${tipo === 'pix_gerado' ? 'Pagamento PIX' : 'Pedido'} #${pedidoId || 'N/A'}`,
        content: [{ type: 'text/html', value: emailContent }],
      }),
    })

    if (!sendgridResponse.ok) {
      const err = await sendgridResponse.json()
      console.error('❌ Erro SendGrid:', JSON.stringify(err))
      throw new Error(err.errors?.[0]?.message || 'Falha ao enviar e-mail')
    }

    console.log('✅ E-mail enviado com sucesso')
    return new Response(
      JSON.stringify({ success: true, message: 'Notificação enviada com sucesso', email, tipo }),
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