// ============================================================
// MODEL: Cliente
// Responsabilidade: comunicação com Supabase para clientes
// ============================================================
import { supabase } from '../services/Supabaseclient';

export const ClienteModel = {
  async buscarPorId(userId) {
    const { data, error } = await supabase
      .from('clientes')
      .select('nome, endereco, complemento, telefone, email')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async salvar(dados) {
    const { error } = await supabase
      .from('clientes')
      .upsert(dados, { onConflict: 'id' });
    if (error) throw error;
  },
};