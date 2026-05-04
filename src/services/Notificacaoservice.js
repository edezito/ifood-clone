// ============================================================
// SERVICE: NotificacaoService
// Responsabilidade: envio de notificações e notas fiscais
// ============================================================
import { supabase } from './Supabaseclient';

export const NotificacaoService = {
  async enviarNotaFiscal(pedidoId, emailCliente) {
    console.log(`📧 Enviando NF do pedido ${pedidoId} para ${emailCliente}`);

    const pdfSimulado = {
      id: pedidoId,
      data: new Date().toLocaleDateString(),
      link: `https://api.exemplo.com/nf/pedido-${pedidoId}.pdf`,
    };

    await supabase.from('notificacoes').insert([
      { pedido_id: pedidoId, tipo: 'nota_fiscal', conteudo: pdfSimulado, lida: false },
    ]);

    return pdfSimulado;
  },

  async notificarMudancaStatus(pedidoId, statusNovo) {
    console.log(`🔔 Pedido #${pedidoId} → ${statusNovo}`);

    const mensagens = {
      'Em Preparação': 'Seu pedido está sendo preparado! 👨‍🍳',
      'Em Trânsito': 'Seu pedido saiu para entrega! 🛵',
      Entregue: 'Pedido entregue! Bom apetite! 🎉',
    };

    await supabase.from('notificacoes').insert([
      {
        pedido_id: pedidoId,
        tipo: 'mudanca_status',
        titulo: 'Atualização do Pedido',
        mensagem: mensagens[statusNovo] || `Status: ${statusNovo}`,
        lida: false,
        criado_em: new Date(),
      },
    ]);
  },
};