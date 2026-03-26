// ============================================================
// MODEL: Restaurante
// Responsabilidade: toda comunicação com Supabase para restaurantes
// ============================================================
import { supabase } from '../services/Supabaseclient ';

export const RestauranteModel = {
  async listarTodos() {
    const { data, error } = await supabase.from('restaurantes').select('*');
    if (error) throw error;
    return data;
  },

  async criar(dados) {
    const { data, error } = await supabase
      .from('restaurantes')
      .insert([dados])
      .select();
    if (error) throw error;
    return data[0];
  },

  async atualizar(id, dados) {
    const { data, error } = await supabase
      .from('restaurantes')
      .update(dados)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async excluir(id) {
    const { error } = await supabase.from('restaurantes').delete().eq('id', id);
    if (error) throw error;
  },

  async buscarCoordenadas(endereco) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1&countrycodes=BR`
    );
    const data = await response.json();
    if (!data || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat).toFixed(6),
      lng: parseFloat(data[0].lon).toFixed(6),
    };
  },
};