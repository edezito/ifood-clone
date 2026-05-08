// ============================================================
// MODEL: Restaurante
// Responsabilidade: toda comunicação com Supabase para restaurantes
// + cálculo de rota via OSRM (OpenStreetMap Routing Machine)
// ============================================================
import { supabase } from '../services/Supabaseclient';

// Taxa base (R$) + custo por km
const TAXA_BASE = 2.0;
const CUSTO_POR_KM = 1.5;
const TAXA_MINIMA = 4.99;
const TAXA_MAXIMA = 19.99;
const TEMPO_PREPARO_MIN = 15; // minutos fixos de preparo

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

  // Geocoding via Nominatim (OpenStreetMap) — já utilizado no admin
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

  // ----------------------------------------------------------------
  // Roteamento via OSRM (OpenStreetMap Routing Machine)
  // Retorna: distanciaKm, duracaoMin, taxaEntrega, tempoTotalMin
  // ----------------------------------------------------------------
  async calcularRota(origemLat, origemLng, destinoLat, destinoLng) {
    // OSRM espera coordenadas no formato lng,lat
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origemLng},${origemLat};${destinoLng},${destinoLat}` +
      `?overview=false&steps=false`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao consultar rota OSRM');

    const data = await response.json();
    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('Rota não encontrada');
    }

    const rota = data.routes[0];
    const distanciaKm = rota.distance / 1000; // metros → km
    const duracaoMin = Math.ceil(rota.duration / 60); // segundos → minutos

    const taxaBruta = TAXA_BASE + distanciaKm * CUSTO_POR_KM;
    const taxaEntrega = Math.min(
      Math.max(taxaBruta, TAXA_MINIMA),
      TAXA_MAXIMA
    );

    const tempoTotalMin = duracaoMin + TEMPO_PREPARO_MIN;

    return {
      distanciaKm: Math.round(distanciaKm * 10) / 10,  // 1 casa decimal
      duracaoMin,                                        // só trânsito
      tempoTotalMin,                                     // preparo + trânsito
      taxaEntrega: Math.round(taxaEntrega * 100) / 100,  // 2 casas
    };
  },

  // Geocodifica um endereço e já calcula a rota a partir das coords do restaurante
  async calcularRotaPorEndereco(restauranteLat, restauranteLng, enderecoDestino) {
    const coords = await this.buscarCoordenadas(enderecoDestino);
    if (!coords) return null;

    return this.calcularRota(
      parseFloat(restauranteLat),
      parseFloat(restauranteLng),
      parseFloat(coords.lat),
      parseFloat(coords.lng)
    );
  },
};