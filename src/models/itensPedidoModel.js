// ============================================================
// MODEL: ItensPedidoModel
// Responsabilidade: Acesso a dados da tabela 'itens_pedido'
// ============================================================
import { supabase } from '../services/Supabaseclient';

export class ItensPedidoModel {
  /**
   * Busca itens de um pedido específico
   */
  static async buscarPorPedido(pedidoId) {
    try {
      // Tentativa com join na tabela produtos
      const { data, error } = await supabase
        .from('itens_pedido')
        .select(`
          id,
          quantidade,
          preco_unitario,
          produto_id,
          produtos:produto_id (
            id,
            nome,
            descricao,
            preco
          )
        `)
        .eq('pedido_id', pedidoId);

      if (error) throw error;
      return data;
      
    } catch (error) {
      console.warn('⚠️ [ItensPedidoModel] Join falhou, tentando sem relacionamento:', error);
      
      // Fallback: buscar apenas os itens
      const { data, error: fallbackError } = await supabase
        .from('itens_pedido')
        .select('*')
        .eq('pedido_id', pedidoId);

      if (fallbackError) throw fallbackError;
      return data;
    }
  }

  /**
   * Calcula o total dos itens
   */
  static calcularTotal(itens) {
    return itens.reduce((total, item) => {
      return total + (item.preco_unitario * item.quantidade);
    }, 0);
  }

  /**
   * Adiciona item ao pedido
   */
  static async adicionarItem(pedidoId, produtoId, quantidade, precoUnitario) {
    const { data, error } = await supabase
      .from('itens_pedido')
      .insert({
        pedido_id: pedidoId,
        produto_id: produtoId,
        quantidade,
        preco_unitario: precoUnitario
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Insere múltiplos itens de uma vez (batch insert)
   * Usado pelo useClienteController ao finalizar o pedido
   */
  static async inserirVarios(itens) {
    const { error } = await supabase
      .from('itens_pedido')
      .insert(itens);
    if (error) throw error;
  }
}