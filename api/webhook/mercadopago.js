// api/webhook/mercadopago.js (Backend)
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const payment = new Payment(client);
      const paymentInfo = await payment.get({ id: data.id });
      
      const pedidoId = paymentInfo.external_reference;
      
      if (paymentInfo.status === 'approved') {
        // Atualizar pedido no banco
        await PedidoModel.atualizarStatus(pedidoId, 'Pago');
        await PagamentoModel.atualizarStatus(pedidoId, 'confirmado');
        
        // Opcional: Enviar notificação ao cliente
        // await enviarNotificacao(pedidoId);
      } else if (paymentInfo.status === 'rejected') {
        await PedidoModel.atualizarStatus(pedidoId, 'Pagamento Recusado');
      }
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}