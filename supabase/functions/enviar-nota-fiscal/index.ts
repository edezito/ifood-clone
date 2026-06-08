// supabase/functions/enviar-nota-fiscal/index.ts
// Coloque este arquivo em: supabase/functions/enviar-nota-fiscal/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Formata um valor para moeda BRL
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0)
}

// Gera o número da nota no formato NF-XXXXXXXX
function gerarNumeroNota(pedidoId: string): string {
  const hash = String(pedidoId).replace(/-/g, '').slice(0, 8).toUpperCase()
  return `NF-${hash}`
}

// Gera o HTML completo da nota fiscal
function gerarHtmlNotaFiscal(dados: {
  pedido: Record<string, unknown>
  itens: Array<Record<string, unknown>>
  restaurante: Record<string, unknown> | null
  numeroNota: string
  dataEmissao: string
}): string {
  const { pedido, itens, restaurante, numeroNota, dataEmissao } = dados

  const subtotal = Number(pedido.total ?? 0) - Number(pedido.taxa_entrega ?? 0)
  const taxaEntrega = Number(pedido.taxa_entrega ?? 0)
  const total = Number(pedido.total ?? 0)

  const linhasItens = itens.map((item) => {
    const nome = (item.produtos as Record<string, unknown>)?.nome ?? `Produto #${item.produto_id}`
    const qtd = Number(item.quantidade ?? 1)
    const preco = Number(item.preco_unitario ?? 0)
    const subtotalItem = qtd * preco
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;color:#374151;font-size:14px">${nome}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:center;color:#374151;font-size:14px">${qtd}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;color:#374151;font-size:14px">${formatCurrency(preco)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#1f2937;font-size:14px">${formatCurrency(subtotalItem)}</td>
      </tr>
    `
  }).join('')

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Nota Fiscal - ${numeroNota}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%">

        <!-- CABEÇALHO -->
        <tr>
          <td style="background:linear-gradient(135deg,#EA1D2C,#C8101E);padding:28px 32px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:10px">
                    <span style="font-size:28px">🍔</span>
                    <span style="font-family:Arial,sans-serif;font-weight:900;font-size:22px;color:#fff">
                      Food<span style="opacity:0.85">Express</span>
                    </span>
                  </div>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:12px;letter-spacing:0.08em;text-transform:uppercase">
                    Nota Fiscal Eletrônica
                  </p>
                </td>
                <td align="right">
                  <p style="margin:0;color:rgba(255,255,255,0.9);font-size:13px;font-weight:700">${numeroNota}</p>
                  <p style="margin:4px 0 0;color:rgba(255,255,255,0.65);font-size:12px">${dataEmissao}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DADOS DO PEDIDO E CLIENTE -->
        <tr>
          <td style="padding:24px 32px;background:#fafafa;border-bottom:1px solid #f0f0f0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="vertical-align:top;padding-right:16px">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em">Emitente</p>
                  <p style="margin:0;font-size:14px;font-weight:700;color:#1f2937">${restaurante?.nome ?? 'FoodExpress'}</p>
                  <p style="margin:2px 0 0;font-size:12px;color:#6b7280">${restaurante?.endereco ?? ''}</p>
                  ${restaurante?.cnpj ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280">CNPJ: ${restaurante.cnpj}</p>` : ''}
                </td>
                <td width="50%" style="vertical-align:top;padding-left:16px;border-left:1px solid #e5e7eb">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em">Destinatário</p>
                  <p style="margin:0;font-size:14px;font-weight:700;color:#1f2937">${pedido.cliente_nome ?? 'Cliente'}</p>
                  ${pedido.email ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280">${pedido.email}</p>` : ''}
                  ${pedido.telefone ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280">${pedido.telefone}</p>` : ''}
                  ${pedido.endereco ? `<p style="margin:2px 0 0;font-size:12px;color:#6b7280">${pedido.endereco}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- INFORMAÇÕES DO PEDIDO -->
        <tr>
          <td style="padding:20px 32px;border-bottom:1px solid #f0f0f0">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="text-align:center;padding:0 8px">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em">Pedido</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1f2937">#${String(pedido.id).slice(0, 8).toUpperCase()}</p>
                </td>
                <td style="text-align:center;padding:0 8px;border-left:1px solid #e5e7eb">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em">Modalidade</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1f2937">${pedido.tipo_entrega ?? 'Entrega'}</p>
                </td>
                <td style="text-align:center;padding:0 8px;border-left:1px solid #e5e7eb">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em">Pagamento</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#1f2937">${pedido.forma_pagamento ?? 'N/D'}</p>
                </td>
                <td style="text-align:center;padding:0 8px;border-left:1px solid #e5e7eb">
                  <p style="margin:0;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em">Status</p>
                  <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#15803d">${pedido.status ?? 'Entregue'}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TABELA DE ITENS -->
        <tr>
          <td style="padding:24px 32px 0">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em">Itens do pedido</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
              <thead>
                <tr style="background:#f9fafb">
                  <th style="padding:10px 14px;text-align:left;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em">Produto</th>
                  <th style="padding:10px 14px;text-align:center;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em">Qtd.</th>
                  <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em">Unit.</th>
                  <th style="padding:10px 14px;text-align:right;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em">Total</th>
                </tr>
              </thead>
              <tbody>
                ${linhasItens || '<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px">Nenhum item registrado</td></tr>'}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- TOTAIS -->
        <tr>
          <td style="padding:16px 32px 24px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td></td>
                <td width="220">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280">Subtotal</td>
                      <td style="padding:6px 0;font-size:13px;color:#374151;text-align:right">${formatCurrency(subtotal)}</td>
                    </tr>
                    ${taxaEntrega > 0 ? `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280">Taxa de entrega</td>
                      <td style="padding:6px 0;font-size:13px;color:#374151;text-align:right">${formatCurrency(taxaEntrega)}</td>
                    </tr>` : `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280">Taxa de entrega</td>
                      <td style="padding:6px 0;font-size:13px;color:#15803d;text-align:right;font-weight:600">Grátis</td>
                    </tr>`}
                    <tr>
                      <td colspan="2"><div style="height:1px;background:#e5e7eb;margin:6px 0"></div></td>
                    </tr>
                    <tr>
                      <td style="padding:6px 0;font-size:16px;font-weight:700;color:#1f2937">Total</td>
                      <td style="padding:6px 0;font-size:16px;font-weight:900;color:#EA1D2C;text-align:right">${formatCurrency(total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- RODAPÉ -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f0f0f0;padding:20px 32px;text-align:center">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              Este documento é um comprovante eletrônico gerado automaticamente pelo FoodExpress.<br>
              Em caso de dúvidas, entre em contato com o restaurante.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#d1d5db">
              Emitido em ${dataEmissao} • ${numeroNota}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    console.log('📦 Body recebido:', JSON.stringify({ pedidoId: body.pedidoId, email: body.email }))

    const { pedidoId, email: emailOverride } = body

    if (!pedidoId) {
      return new Response(
        JSON.stringify({ error: 'pedidoId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inicializa Supabase com service role para buscar todos os dados
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Busca o pedido completo
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single()

    if (pedidoError || !pedido) {
      console.error('❌ Pedido não encontrado:', pedidoError)
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Busca os itens do pedido com nomes dos produtos
    const { data: itens } = await supabaseAdmin
      .from('itens_pedido')
      .select('id, quantidade, preco_unitario, produto_id, produtos:produto_id(id, nome, preco)')
      .eq('pedido_id', pedidoId)

    // 3. Busca dados do restaurante
    const { data: restaurante } = await supabaseAdmin
      .from('restaurantes')
      .select('id, nome, endereco, cnpj')
      .eq('id', pedido.restaurante_id)
      .single()

    // 4. Resolve o email de destino
    const emailDestino = emailOverride || pedido.email
    if (!emailDestino) {
      return new Response(
        JSON.stringify({ error: 'Nenhum email disponível para este pedido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Gera os dados da nota
    const numeroNota = gerarNumeroNota(String(pedido.id))
    const dataEmissao = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const htmlNota = gerarHtmlNotaFiscal({
      pedido,
      itens: itens ?? [],
      restaurante: restaurante ?? null,
      numeroNota,
      dataEmissao,
    })

    // 6. Envia o email via SendGrid
    const SENDGRID_KEY = Deno.env.get('SENDGRID_API_KEY')
    if (!SENDGRID_KEY) {
      throw new Error('SENDGRID_API_KEY não configurada')
    }

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: emailDestino }] }],
        from: { email: 'eder.bento@aluno.impacta.edu.br', name: 'FoodExpress' },
        subject: `🧾 Nota Fiscal ${numeroNota} - Pedido #${String(pedido.id).slice(0, 8).toUpperCase()}`,
        content: [{ type: 'text/html', value: htmlNota }],
      }),
    })

    if (!sendgridResponse.ok) {
      const err = await sendgridResponse.json()
      console.error('❌ Erro SendGrid:', JSON.stringify(err))
      throw new Error(err.errors?.[0]?.message ?? 'Falha ao enviar email')
    }

    // 7. Registra o envio no banco (tabela opcional — cria se quiser histórico)
    try {
      await supabaseAdmin.from('notificacoes').insert([{
        pedido_id: pedidoId,
        tipo: 'nota_fiscal',
        titulo: 'Nota Fiscal enviada',
        mensagem: `Nota ${numeroNota} enviada para ${emailDestino}`,
        lida: false,
        criado_em: new Date().toISOString(),
      }])
    } catch (_) {
      // Silencia — a tabela de notificações pode não ter esse tipo, não é bloqueante
    }

    console.log(`✅ Nota fiscal ${numeroNota} enviada para ${emailDestino}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Nota fiscal enviada para ${emailDestino}`,
        numeroNota,
        email: emailDestino,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('🔥 Erro:', error?.message ?? error)
    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})