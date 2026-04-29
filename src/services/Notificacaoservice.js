// services/NotificacaoService.js
import { supabase } from './Supabaseclient';

class NotificacaoService {

  static async enviarPinPorEmail(pedido) {
    console.log('📧 Enviando PIN para:', pedido?.email);

    if (!pedido?.email) {
      console.warn('❌ Pedido sem e-mail');
      return { success: false, error: 'Sem email' };
    }

    try {
      console.log('📡 Chamando Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('enviar-pin-seguro', {
        body: {
          email: pedido.email,
          nome: pedido.cliente_nome || 'Cliente',
          pedidoId: pedido.id.toString().slice(0, 8).toUpperCase(),
          pin: pedido.pin_entrega,
          total: `R$ ${pedido.total?.toFixed(2)}`,
          endereco: pedido.endereco || 'Endereço não informado'
        },
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        // Tenta obter detalhes do corpo da resposta de erro
        let detalhe = error.message;
        if (error.context) {
          try {
            const res = await error.context.json?.();
            if (res?.error) detalhe = res.error;
          } catch (_) {}
        }
        throw new Error(detalhe);
      }
      
      console.log('✅ PIN enviado com sucesso!');
      alert(`✅ PIN ${pedido.pin_entrega} enviado para ${pedido.email}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro:', error);
      alert(`❌ Erro ao enviar PIN: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  static async notificarMudancaStatus(pedidoId, statusAntigo, statusNovo, pedidoCompleto = null) {
    console.log(`🔔 Pedido #${pedidoId}: ${statusAntigo} → ${statusNovo}`);

    await supabase.from('notificacoes').insert([{
      pedido_id: pedidoId,
      tipo: 'mudanca_status',
      titulo: 'Atualização do Pedido',
      mensagem: `Status atualizado para: ${statusNovo}`,
      lida: false,
      criado_em: new Date()
    }]);

    if (statusNovo === 'Em Trânsito') {
      console.log('🚚 Pedido em trânsito! Enviando PIN...');
      
      let pedido = pedidoCompleto;
      if (!pedido) {
        const { data } = await supabase
          .from('pedidos')
          .select('*')
          .eq('id', pedidoId)
          .single();
        pedido = data;
      }
      
      if (pedido?.email) {
        return await this.enviarPinPorEmail(pedido);
      } else {
        console.warn('⚠️ Pedido sem email!');
        alert('⚠️ Este pedido não tem e-mail cadastrado!');
      }
    }
    
    return { success: true };
  }
}

export default NotificacaoService;