// src/services/api.service.js
import { supabase } from '../services/Supabaseclient'; // Import ÚNICO no topo

export const ApiService = {
  /**
   * Criar preferência de pagamento no Mercado Pago
   */
  async criarPreferenciaMP(dados) {
    try {
      console.log('🔄 Chamando Edge Function criar-preferencia...');
      
      const { data, error } = await supabase.functions.invoke('criar-preferencia', {
        body: {
          carrinho: dados.carrinho,
          tipoEntrega: dados.tipoEntrega,
          usuarioLogado: dados.usuarioLogado
        }
      });

      if (error) {
        console.error('❌ Erro da Edge Function:', error);
        throw new Error(error.message || 'Erro ao criar preferência');
      }

      console.log('✅ Preferência criada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao criar preferência:', error);
      throw error;
    }
  },

  /**
   * Confirmar pagamento PIX
   */
  async confirmarPagamentoPIX(pagamentoId) {
    try {
      const { data, error } = await supabase.functions.invoke('confirmar-pix', {
        body: { pagamentoId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao confirmar PIX:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Enviar notificação via Supabase Edge Function
   */
  async enviarNotificacao(dados) {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: {
          email: dados.email,
          nome: dados.nome,
          pedidoId: dados.pedidoId,
          pin: dados.pin,
          total: dados.total,
          endereco: dados.endereco,
          tipo: dados.tipo || 'pedido_confirmado',
          valor: dados.valor,
          expiracao: dados.expiracao
        }
      });

      if (error) {
        console.error('❌ Erro ao enviar notificação:', error);
        throw error;
      }
      
      console.log('✅ Notificação enviada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Buscar status de um pagamento
   */
  async consultarStatusPagamento(paymentId) {
    try {
      const { data, error } = await supabase.functions.invoke('consultar-pagamento', {
        body: { paymentId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao consultar pagamento:', error);
      return { status: 'unknown', error: error.message };
    }
  },

  /**
   * Cancelar um pagamento pendente
   */
  async cancelarPagamento(paymentId) {
    try {
      const { data, error } = await supabase.functions.invoke('cancelar-pagamento', {
        body: { paymentId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
      return { success: false, error: error.message };
    }
  }
};