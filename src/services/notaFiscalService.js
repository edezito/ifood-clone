// src/services/notaFiscalService.js
// Responsabilidade: Orquestrar o envio de nota fiscal por email via Supabase Edge Function
import { supabase } from './Supabaseclient';

export const NotaFiscalService = {
  /**
   * Envia a nota fiscal de um pedido por email.
   *
   * @param {string|number} pedidoId - ID do pedido
   * @param {string} [emailOverride] - Email alternativo (substitui o do pedido se informado)
   * @returns {Promise<{ success: boolean, message?: string, numeroNota?: string, error?: string }>}
   */
  async enviarNotaFiscal(pedidoId, emailOverride = null) {
    if (!pedidoId) {
      return { success: false, error: 'ID do pedido é obrigatório' };
    }

    console.log(`📄 Enviando nota fiscal — pedido: ${pedidoId}`);

    try {
      const body = { pedidoId };
      if (emailOverride) body.email = emailOverride;

      const { data, error } = await supabase.functions.invoke('enviar-nota-fiscal', { body });

      if (error) {
        // Tenta extrair detalhes do erro retornado pela Edge Function
        let detalhe = error.message;
        try {
          const res = await error.context?.json?.();
          if (res?.error) detalhe = res.error;
        } catch (_) { /* sem detalhes adicionais */ }

        console.error('❌ Erro na Edge Function:', detalhe);
        return { success: false, error: detalhe };
      }

      console.log('✅ Nota fiscal enviada:', data);
      return {
        success: true,
        message: data?.message ?? 'Nota fiscal enviada com sucesso',
        numeroNota: data?.numeroNota,
        email: data?.email,
      };
    } catch (err) {
      console.error('❌ Erro inesperado ao enviar nota fiscal:', err);
      return { success: false, error: err?.message ?? 'Erro desconhecido' };
    }
  },

  /**
   * Envia a nota fiscal ao confirmar um pedido (chamado internamente pelo fluxo de checkout).
   * Silencia erros para não bloquear o fluxo principal.
   *
   * @param {{ id: string, email?: string, status?: string }} pedido
   */
  async enviarAposConfirmacao(pedido) {
    if (!pedido?.email) {
      console.warn('⚠️ [NotaFiscal] Pedido sem email — nota fiscal não enviada');
      return;
    }

    // Aguarda um curto delay para garantir que os itens do pedido já foram gravados no banco
    await new Promise((r) => setTimeout(r, 1500));

    const resultado = await this.enviarNotaFiscal(pedido.id);
    if (!resultado.success) {
      console.warn('⚠️ [NotaFiscal] Falha ao enviar após confirmação (não bloqueante):', resultado.error);
    }
  },
};

export default NotaFiscalService;