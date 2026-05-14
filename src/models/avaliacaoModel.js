import { supabase } from '../services/Supabaseclient';

export const AvaliacaoModel = {
  async criar(dados) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .insert([dados])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async buscarPorPedido(pedidoId) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('pedido_id', pedidoId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async buscarPorRestaurante(restauranteId) {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data;
  },
};