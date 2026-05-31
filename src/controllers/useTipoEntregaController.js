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
      console.log('⚠️ Sem coordenadas para calcular rota');
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
        console.log('✅ Rota calculada:', rota);
        setRotaInfo(rota);
        const freteCalculado = rota.taxaEntrega || TAXA_FALLBACK;
        console.log('💰 Frete calculado pela rota:', freteCalculado);
        setTaxaFrete(freteCalculado);
      } else {
        console.log('⚠️ Rota não encontrada, usando fallback');
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
        console.log('📊 Subtotal calculado:', sub);

        // Monta lista de endereços do usuário
        const lista = montarEnderecos(usuarioLogado);
        setEnderecos(lista);

        const endPrincipal = lista.find(e => e.principal);
        if (endPrincipal) {
          setEnderecoSelecionado(endPrincipal.id);
          console.log('📍 Endereço principal:', endPrincipal.logradouro);
        }

        // Busca dados do restaurante e calcula a rota inicial
        if (restauranteId && endPrincipal?.logradouro) {
          const todos = await RestauranteModel.listarTodos();
          const restaurante = todos.find(r => r.id === restauranteId);
          if (restaurante) {
            console.log('🏪 Restaurante encontrado:', restaurante.nome);
            await calcularRota(endPrincipal.logradouro, restaurante);
          } else {
            console.log('⚠️ Restaurante não encontrado, usando frete padrão');
            setTaxaFrete(TAXA_FALLBACK);
          }
        } else {
          console.log('⚠️ Sem endereço ou restaurante, usando frete padrão');
          setTaxaFrete(TAXA_FALLBACK);
        }
      } catch (err) {
        console.error('[useTipoEntregaController] Erro na inicialização:', err);
        setTaxaFrete(TAXA_FALLBACK);
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
    console.log('🔄 Mudando tipo de entrega para:', novoTipo);
    setTipoSelecionado(novoTipo);
    if (novoTipo === 'retirada') {
      setTaxaFrete(TAXA_RETIRADA);
      console.log('💰 Frete alterado para 0 (retirada)');
    } else {
      const frete = rotaInfo?.taxaEntrega ?? TAXA_FALLBACK;
      setTaxaFrete(frete);
      console.log('💰 Frete restaurado para:', frete);
    }
  }, [rotaInfo]);

  // ----------------------------------------------------------------
  // Handler: seleciona endereço e recalcula rota
  // ----------------------------------------------------------------
  const selecionarEndereco = useCallback(async (enderecoId) => {
    console.log('📍 Selecionando endereço:', enderecoId);
    setEnderecoSelecionado(enderecoId);

    const end = enderecos.find(e => e.id === enderecoId);
    if (!end?.logradouro || tipoSelecionado !== 'entrega') {
      console.log('⚠️ Não é possível calcular rota:', { endereco: end?.logradouro, tipo: tipoSelecionado });
      return;
    }

    if (restauranteId) {
      const todos = await RestauranteModel.listarTodos();
      const restaurante = todos.find(r => r.id === restauranteId);
      if (restaurante) {
        console.log('🔄 Recalculando rota para:', end.logradouro);
        await calcularRota(end.logradouro, restaurante);
      }
    }
  }, [enderecos, tipoSelecionado, restauranteId, calcularRota]);

  // ----------------------------------------------------------------
  // Dados derivados
  // ----------------------------------------------------------------
  const totalPedido = subtotal + (tipoSelecionado === 'retirada' ? 0 : taxaFrete);

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
      const dadosConfirmados = {
        tipoEntrega: tipoSelecionado,
        taxaFrete: tipoSelecionado === 'retirada' ? 0 : taxaFrete,
        tempoEstimado,
        rotaInfo,
        enderecoId: tipoSelecionado === 'entrega' ? enderecoSelecionado : null,
      };
      
      console.log('📡 [TipoEntrega] Seleção confirmada:', dadosConfirmados);
      return dadosConfirmados;
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