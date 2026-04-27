// models/pagamentoModel.js
import { supabase } from '../lib/supabase';

export const PagamentoModel = {
  async criar(dados) {
    const { data, error } = await supabase
      .from('pagamentos')
      .insert({
        pedido_id: dados.pedido_id,
        forma_pagamento: dados.forma_pagamento,
        status: dados.forma_pagamento === 'Dinheiro' ? 'confirmado' : 'pendente',
        valor: dados.valor,
        valor_desconto: dados.valor_desconto || 0,
        ...dados.extras
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizarStatus(id, status, dados = {}) {
    const { data, error } = await supabase
      .from('pagamentos')
      .update({ 
        status,
        ...dados,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async buscarPorPedido(pedidoId) {
    const { data, error } = await supabase
      .from('pagamentos')
      .select('*')
      .eq('pedido_id', pedidoId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async confirmarPagamentoPIX(pagamentoId) {
    return this.atualizarStatus(pagamentoId, 'confirmado', {
      data_confirmacao: new Date().toISOString()
    });
  }
};