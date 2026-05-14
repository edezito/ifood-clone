// ============================================================
// CONTROLLER: useTipoEntregaController
// Responsabilidade: Gerenciar a escolha entre Entrega e Retirada,
// calcular frete e tempo estimado via OSRM (OpenStreetMap Routing Machine)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { RestauranteModel } from '../models/restauranteModel';

const TAXA_RETIRADA = 0;
const TAXA_FALLBACK = 5.99; // usado se a rota falhar

export function useTipoEntregaController(carrinhoItems = [], usuarioLogado = null, restauranteId = null) {
  const [tipoSelecionado, setTipoSelecionado] = useState('entrega');
  const [taxaFrete, setTaxaFrete] = useState(TAXA_FALLBACK);
  const [subtotal, setSubtotal] = useState(0);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Dados de rota calculados pelo OSRM
  const [rotaInfo, setRotaInfo] = useState(null); // { distanciaKm, duracaoMin, tempoTotalMin, taxaEntrega }
  const [calculandoRota, setCalculandoRota] = useState(false);
  const [erroRota, setErroRota] = useState(null);

  // ----------------------------------------------------------------
  // Monta os endereços disponíveis a partir do usuário logado
  // ----------------------------------------------------------------
  const montarEnderecos = useCallback((usuario) => {
    if (!usuario) return [];
    const lista = [];
    if (usuario.endereco) {
      lista.push({
        id: 'principal',
        logradouro: usuario.endereco,
        complemento: usuario.complemento || '',
        principal: true,
      });
    }
    return lista;
  }, []);

  // ----------------------------------------------------------------
  // Calcula rota via OSRM usando coords do restaurante + endereço do cliente
  // ----------------------------------------------------------------
  const calcularRota = useCallback(async (enderecoDestino, restaurante) => {
    if (!restaurante?.latitude || !restaurante?.longitude || !enderecoDestino) {
      setRotaInfo(null);
      setTaxaFrete(TAXA_FALLBACK);
      return;
    }

    setCalculandoRota(true);
    setErroRota(null);

    try {
      const rota = await RestauranteModel.calcularRotaPorEndereco(
        restaurante.latitude,
        restaurante.longitude,
        enderecoDestino
      );

      if (rota) {
        setRotaInfo(rota);
        setTaxaFrete(rota.taxaEntrega);
      } else {
        setErroRota('Não foi possível calcular a rota para este endereço.');
        setTaxaFrete(TAXA_FALLBACK);
      }
    } catch (err) {
      console.warn('⚠️ Erro OSRM, usando taxa padrão:', err.message);
      setErroRota('Rota indisponível — usando taxa padrão.');
      setTaxaFrete(TAXA_FALLBACK);
    } finally {
      setCalculandoRota(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // Inicialização
  // ----------------------------------------------------------------
  useEffect(() => {
    const inicializar = async () => {
      setLoading(true);
      try {
        // Calcula subtotal a partir do carrinho
        const sub = (carrinhoItems || []).reduce(
          (acc, item) => acc + item.preco * item.quantidade,
          0
        );
        setSubtotal(sub);

        // Monta lista de endereços do usuário
        const lista = montarEnderecos(usuarioLogado);
        setEnderecos(lista);

        const endPrincipal = lista.find(e => e.principal);
        if (endPrincipal) setEnderecoSelecionado(endPrincipal.id);

        // Busca dados do restaurante e calcula a rota inicial
        if (restauranteId && endPrincipal?.logradouro) {
          const todos = await RestauranteModel.listarTodos();
          const restaurante = todos.find(r => r.id === restauranteId);
          if (restaurante) {
            await calcularRota(endPrincipal.logradouro, restaurante);
          }
        }
      } catch (err) {
        console.error('[useTipoEntregaController] Erro na inicialização:', err);
      } finally {
        setLoading(false);
      }
    };

    inicializar();
  }, [carrinhoItems, usuarioLogado, restauranteId, montarEnderecos, calcularRota]);

  // ----------------------------------------------------------------
  // Handler: troca tipo de entrega
  // ----------------------------------------------------------------
  const selecionarTipo = useCallback((novoTipo) => {
    setTipoSelecionado(novoTipo);
    if (novoTipo === 'retirada') {
      setTaxaFrete(TAXA_RETIRADA);
    } else {
      // Restaura a taxa calculada pela rota (ou fallback)
      setTaxaFrete(rotaInfo?.taxaEntrega ?? TAXA_FALLBACK);
    }
  }, [rotaInfo]);

  // ----------------------------------------------------------------
  // Handler: seleciona endereço e recalcula rota
  // ----------------------------------------------------------------
  const selecionarEndereco = useCallback(async (enderecoId) => {
    setEnderecoSelecionado(enderecoId);

    const end = enderecos.find(e => e.id === enderecoId);
    if (!end?.logradouro || tipoSelecionado !== 'entrega') return;

    if (restauranteId) {
      const todos = await RestauranteModel.listarTodos();
      const restaurante = todos.find(r => r.id === restauranteId);
      if (restaurante) {
        await calcularRota(end.logradouro, restaurante);
      }
    }
  }, [enderecos, tipoSelecionado, restauranteId, calcularRota]);

  // ----------------------------------------------------------------
  // Dados derivados
  // ----------------------------------------------------------------
  const totalPedido = subtotal + taxaFrete;

  const podeAvancar =
    tipoSelecionado === 'retirada' ||
    (tipoSelecionado === 'entrega' && enderecoSelecionado !== null);

  // Tempo estimado para exibição na UI
  const tempoEstimado = tipoSelecionado === 'retirada'
    ? { min: 15, max: 25, texto: '15–25 min' }
    : rotaInfo
      ? {
          min: rotaInfo.tempoTotalMin,
          max: rotaInfo.tempoTotalMin + 10,
          texto: `${rotaInfo.tempoTotalMin}–${rotaInfo.tempoTotalMin + 10} min`,
        }
      : { min: 30, max: 45, texto: '30–45 min' };

  // ----------------------------------------------------------------
  // Confirmar seleção (persistência futura se necessário)
  // ----------------------------------------------------------------
  const confirmarSelecao = async () => {
    if (!podeAvancar) return false;
    setSalvando(true);
    try {
      console.log('📡 [TipoEntrega] Seleção confirmada:', {
        tipoEntrega: tipoSelecionado,
        taxaFrete,
        tempoEstimado,
        rotaInfo,
        enderecoId: tipoSelecionado === 'entrega' ? enderecoSelecionado : null,
      });
      return true;
    } catch (error) {
      console.error('[TipoEntrega] Erro ao confirmar:', error);
      throw error;
    } finally {
      setSalvando(false);
    }
  };

  return {
    // Estado principal
    tipoSelecionado,
    enderecos,
    enderecoSelecionado,
    loading,
    salvando,

    // Valores calculados
    subtotal,
    taxaFrete,
    totalPedido,
    podeAvancar,

    // Dados de rota (OSRM)
    rotaInfo,
    calculandoRota,
    erroRota,
    tempoEstimado,

    // Actions
    selecionarTipo,
    selecionarEndereco,
    confirmarSelecao,
  };
}