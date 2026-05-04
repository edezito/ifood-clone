// ============================================================
// MODEL: Pedido
// Responsabilidade: toda comunicação com Supabase para pedidos
// ============================================================
import { supabase } from '../services/Supabaseclient';

export const PedidoModel = {
  async listarTodos() {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data;
  },

  async buscarPorId(id) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async buscarPorTelefone(telefone) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, restaurantes(nome)')
      .eq('telefone', telefone)
      .order('id', { ascending: false });
    if (error) throw error;
    return data;
  },

  async buscarPorEmail(email) {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, restaurantes(nome)')
      .eq('email', email) // Note que o e-mail do Eder está preenchido!
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data;
  },

  async criar(dados) {
    const { data, error } = await supabase
      .from('pedidos')
      .insert([dados])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async atualizarStatus(id, novoStatus) {
    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', id);
    if (error) throw error;
  },

  assinarMudancas(pedidoId, callback) {
    return supabase
      .channel(`pedido-${pedidoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },

  cancelarAssinatura(channel) {
    supabase.removeChannel(channel);
  },
};