// NotificacaoService.js
import { supabase } from './supabaseClient';

class NotificacaoService {
  
  // Simular envio de Nota Fiscal
  static async enviarNotaFiscal(pedidoId, emailCliente) {
    console.log(`📧 Enviando Nota Fiscal do pedido ${pedidoId} para ${emailCliente}`);
    
    // Simulação de geração de PDF
    const pdfSimulado = {
      id: pedidoId,
      data: new Date().toLocaleDateString(),
      link: `https://api.exemplo.com/nf/pedido-${pedidoId}.pdf`
    };
    
    // Aqui você poderia integrar com um serviço real de email
    // Ou apenas registrar no banco
    await supabase.from('notificacoes').insert([{
      pedido_id: pedidoId,
      tipo: 'nota_fiscal',
      conteudo: pdfSimulado,
      lida: false
    }]);
    
    return pdfSimulado;
  }

  // Criar notificação de mudança de status
  static async notificarMudancaStatus(pedidoId, statusAntigo, statusNovo) {
    console.log(`🔔 Pedido #${pedidoId} mudou: ${statusAntigo} → ${statusNovo}`);
    
    const mensagens = {
      'Em Preparação': 'Seu pedido está sendo preparado! 👨‍🍳',
      'Em Trânsito': 'Seu pedido saiu para entrega! 🛵',
      'Entregue': 'Pedido entregue! Bom apetite! 🎉'
    };

    await supabase.from('notificacoes').insert([{
      pedido_id: pedidoId,
      tipo: 'mudanca_status',
      titulo: 'Atualização do Pedido',
      mensagem: mensagens[statusNovo] || `Status atualizado para: ${statusNovo}`,
      lida: false,
      criado_em: new Date()
    }]);
  }
}

export default NotificacaoService;