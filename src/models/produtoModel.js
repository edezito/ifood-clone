// ============================================================
// MODEL: Produto
// Responsabilidade: toda comunicação com Supabase para produtos
// ============================================================
import { supabase } from '../services/Supabaseclient ';;

export const ProdutoModel = {
  async listarTodos() {
    const { data, error } = await supabase.from('produtos').select('*');
    if (error) throw error;
    return data;
  },

  async listarPorRestaurante(restauranteId) {
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .eq('restaurante_id', restauranteId);
    if (error) throw error;
    return data;
  },

  async criar(dados) {
    const { data, error } = await supabase
      .from('produtos')
      .insert([{ ...dados, disponivel: true }])
      .select();
    if (error) throw error;
    return data[0];
  },

  async atualizar(id, dados) {
    const { data, error } = await supabase
      .from('produtos')
      .update(dados)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async excluir(id) {
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw error;
  },
};