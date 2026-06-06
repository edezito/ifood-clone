// src/services/Notificacaoservice.js
// VERSÃO ATUALIZADA — adiciona envio automático de nota fiscal ao confirmar pedido
import { supabase } from './Supabaseclient';
import { NotaFiscalService } from './notaFiscalService';

class NotificacaoService {

  static async enviarPinPorEmail(pedido) {
    console.log('📧 Enviando PIN para:', pedido?.email);

    if (!pedido?.email) {
      console.warn('❌ Pedido sem e-mail');
      return { success: false, error: 'Sem email' };
    }

    try {
      console.log('📡 Chamando Edge Function enviar-pin-seguro...');

      const { data, error } = await supabase.functions.invoke('enviar-pin-seguro', {
        body: {
          email: pedido.email,
          nome: pedido.cliente_nome || 'Cliente',
          pedidoId: pedido.id.toString().slice(0, 8).toUpperCase(),
          pin: pedido.pin_entrega,
          total: `R$ ${pedido.total?.toFixed(2)}`,
          endereco: pedido.endereco || 'Endereço não informado',
        },
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
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

  /**
   * Notifica mudança de status e dispara ações automáticas:
   * - "Em Trânsito" → envia PIN por email
   * - "Entregue"    → envia nota fiscal por email (não bloqueante)
   *
   * @param {string|number} pedidoId
   * @param {string|null} statusAntigo
   * @param {string} statusNovo
   * @param {object|null} pedidoCompleto - dados já carregados (evita segunda query)
   */
  static async notificarMudancaStatus(pedidoId, statusAntigo, statusNovo, pedidoCompleto = null) {
    console.log(`🔔 Pedido #${pedidoId}: ${statusAntigo ?? '?'} → ${statusNovo}`);

    // Registra notificação interna
    await supabase.from('notificacoes').insert([{
      pedido_id: pedidoId,
      tipo: 'mudanca_status',
      titulo: 'Atualização do Pedido',
      mensagem: `Status atualizado para: ${statusNovo}`,
      lida: false,
      criado_em: new Date(),
    }]);

    // Resolve o pedido completo uma vez (evita queries duplicadas)
    let pedido = pedidoCompleto;
    if (!pedido) {
      const { data } = await supabase
        .from('pedidos')
        .select('*')
        .eq('id', pedidoId)
        .single();
      pedido = data;
    }

    // ── PIN ao despachar ──────────────────────────────────────────────────
    if (statusNovo === 'Em Trânsito') {
      console.log('🚚 Pedido em trânsito — enviando PIN...');

      if (pedido?.email) {
        return await this.enviarPinPorEmail(pedido);
      } else {
        console.warn('⚠️ Pedido sem email — PIN não enviado!');
        alert('⚠️ Este pedido não tem e-mail cadastrado!');
      }
    }

    // ── Nota fiscal ao entregar ───────────────────────────────────────────
    if (statusNovo === 'Entregue') {
      console.log('🧾 Pedido entregue — enviando nota fiscal...');

      if (pedido?.email) {
        // Fire-and-forget: não bloqueia a UI se o envio falhar
        NotaFiscalService.enviarNotaFiscal(pedidoId).then((resultado) => {
          if (resultado.success) {
            console.log(`✅ Nota fiscal ${resultado.numeroNota} enviada para ${pedido.email}`);
          } else {
            console.warn('⚠️ Nota fiscal não enviada:', resultado.error);
          }
        });
      } else {
        console.warn('⚠️ Pedido sem email — nota fiscal não enviada');
      }
    }

    return { success: true };
  }

  /**
   * Reenvio manual da nota fiscal (botão no painel admin).
   *
   * @param {object} pedido - Objeto do pedido com id e email
   * @param {Function} [onSuccess] - Callback de sucesso (ex: mostrarMensagem)
   * @param {Function} [onError]   - Callback de erro
   */
  static async reenviarNotaFiscal(pedido, onSuccess, onError) {
    if (!pedido?.id) {
      onError?.('ID do pedido inválido');
      return;
    }

    if (!pedido?.email) {
      onError?.('Este pedido não possui e-mail cadastrado');
      return;
    }

    console.log(`📤 Reenvio manual da nota fiscal — pedido #${pedido.id}`);

    const resultado = await NotaFiscalService.enviarNotaFiscal(pedido.id);

    if (resultado.success) {
      onSuccess?.(
        `✅ Nota fiscal ${resultado.numeroNota} reenviada para ${pedido.email}`
      );
    } else {
      onError?.(`❌ Erro ao reenviar nota fiscal: ${resultado.error}`);
    }
  }
}

export default NotificacaoService;