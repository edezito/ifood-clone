// supabase/functions/send-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 📱 Funções auxiliares para Push
function getPushTitle(tipo: string): string {
  const titles: Record<string, string> = {
    'pedido_confirmado': '✅ Pedido Confirmado!',
    'pix_gerado': '💳 PIX Gerado',
    'pagamento_confirmado': '💰 Pagamento Aprovado!',
    'status_update': '📦 Pedido Atualizado',
    'entregue': '🎉 Pedido Entregue!'
  }
  return titles[tipo] || '🔔 FoodExpress'
}

function getPushMessage(tipo: string, nome: string, pedidoId: string, pin?: string): string {
  const messages: Record<string, string> = {
    'pedido_confirmado': `Olá ${nome}! Pedido #${pedidoId} confirmado. PIN: ${pin || 'N/A'}`,
    'pix_gerado': `${nome}, pague o PIX para confirmar o pedido #${pedidoId}`,
    'pagamento_confirmado': `Pagamento aprovado! Pedido #${pedidoId} será preparado.`,
    'entregue': `Pedido #${pedidoId} entregue! Bom apetite! 🍽️`
  }
  return messages[tipo] || `Pedido #${pedidoId} atualizado`
}

// 📤 Enviar Push Notification (não bloqueante)
async function enviarPushNotification(
  supabaseUrl: string,
  serviceRoleKey: string,
  body: any
) {
  try {
    const { usuario_id, pedidoId, nome, tipo, pin } = body
    
    // Se não tem usuario_id, não tenta enviar push
    if (!usuario_id) {
      console.log('⚠️ usuario_id não informado, pulando push')
      return { enviado: false, motivo: 'usuario_id ausente' }
    }

    const pushPayload = {
      usuario_id: usuario_id,
      pedido_id: pedidoId || null,
      titulo: getPushTitle(tipo),
      mensagem: getPushMessage(tipo, nome, pedidoId, pin),
      tipo: tipo,
      dados: {
        pedidoId: pedidoId || '',
        pin: pin || '',
        tipo: tipo || ''
      }
    }

    console.log('📱 Enviando push:', JSON.stringify(pushPayload))

    const pushResponse = await fetch(
      `${supabaseUrl}/functions/v1/send-push`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pushPayload)
      }
    )

    const pushResult = await pushResponse.json()
    console.log('📱 Resultado push:', JSON.stringify(pushResult))
    
    return { enviado: true, resultado: pushResult }
  } catch (error: any) {
    console.warn('⚠️ Push falhou (e-mail será enviado normalmente):', error.message)
    return { enviado: false, erro: error.message }
  }
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
      tipo,
      qrcodeUrl,
      valor,
      expiracao,
      usuario_id // 🆕 ID do usuário para push notification
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

    // ============================================================
    // 📧 PARTE 1: E-MAIL (mantido igual)
    // ============================================================
    let emailContent = '';
    
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
            <p style="color:#999;font-size:12px;margin-top:20px">📱 Baixe nosso app para receber notificações em tempo real!</p>
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
            <p style="color:#999;font-size:12px;margin-top:20px">📱 Acompanhe em tempo real pelo nosso app!</p>
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

    // Enviar e-mail
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

    // ============================================================
    // 📱 PARTE 2: PUSH NOTIFICATION (NOVO - não bloqueante)
    // ============================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // Envia push em paralelo, mas não falha se der erro
    const pushResult = await enviarPushNotification(
      supabaseUrl,
      serviceRoleKey,
      { ...body, usuario_id }
    )

    // ============================================================
    // ✅ RESPOSTA FINAL
    // ============================================================
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notificação enviada com sucesso', 
        email, 
        tipo,
        email_enviado: true,
        push_enviado: pushResult.enviado,
        push_detalhes: pushResult
      }),
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