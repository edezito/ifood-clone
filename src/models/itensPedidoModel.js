// ============================================================
// MODEL: ItensPedido
// Responsabilidade: comunicação com Supabase para itens do pedido
// ============================================================
import { supabase } from '../services/Supabaseclient ';

export const ItensPedidoModel = {
  async buscarPorPedido(pedidoId) {
    const { data, error } = await supabase
      .from('itens_pedido')
      .select('quantidade, preco_unitario, produtos(nome)')
      .eq('pedido_id', pedidoId);
    if (error) throw error;
    return data;
  },

  async inserirVarios(itens) {
    const { error } = await supabase.from('itens_pedido').insert(itens);
    if (error) throw error;
  },
};