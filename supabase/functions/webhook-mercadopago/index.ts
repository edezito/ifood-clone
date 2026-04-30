// supabase/functions/webhook-mercadopago/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('data.id') || searchParams.get('id')
  const type = searchParams.get('type')

  if (type === 'payment' && id) {
    const MP_ACCESS_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    
    // 1. Consultar o status real no Mercado Pago
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
    })
    const paymentData = await res.json()

    if (paymentData.status === 'approved') {
      const pedidoId = paymentData.external_reference
      
      // 2. Atualizar seu banco de dados Supabase
      const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      await supabase
        .from('pedidos')
        .update({ status: 'pago', pago: true })
        .eq('id', pedidoId)
        
      console.log(`Pedido ${pedidoId} aprovado!`)
    }
  }

  return new Response("OK", { status: 200 })
})