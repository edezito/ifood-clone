// ============================================================
// CONTROLLER: useAcompanhamentoController
// Responsabilidade: Orquestrar models e gerenciar estado
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { PedidoModel } from '../models/pedidoModel';
import { ItensPedidoModel } from '../models/itensPedidoModel';
import { StatusModel } from '../models/statusModel';

export function useAcompanhamentoController(pedidoId) {
  const [pedido, setPedido] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusAnterior, setStatusAnterior] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  const [mostrarNotificacao, setMostrarNotificacao] = useState(false);

  // Ref para acessar o pedido atual dentro do handler sem criar
  // uma nova closure a cada render (resolve o stale closure).
  const pedidoRef = useRef(null);
  useEffect(() => {
    pedidoRef.current = pedido;
  }, [pedido]);

  // Carregar dados do pedido e itens
  const carregarDados = useCallback(async () => {
    if (!pedidoId) return;
    
    try {
      const [pedidoData, itensData] = await Promise.all([
        PedidoModel.buscarPorId(pedidoId),
        ItensPedidoModel.buscarPorPedido(pedidoId)
      ]);
      
      setPedido(pedidoData);
      setItens(itensData ?? []);
    } catch (error) {
      console.error('❌ [Controller] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [pedidoId]);

  // Handler ESTÁVEL — usa ref em vez de closure sobre `pedido`.
  // Sem `pedido` nas deps, o useEffect abaixo só roda quando
  // pedidoId muda, mantendo o canal Realtime sempre conectado.
  //
  // IMPORTANTE: payload.new do Supabase Realtime pode conter apenas
  // as colunas alteradas, não o objeto completo. Fazemos merge com
  // o pedido atual para não perder campos como pin_entrega e total.
  const handleAtualizacaoPedido = useCallback((novoPedido) => {
    console.log('📡 [Controller] Pedido atualizado (payload parcial):', novoPedido);
    
    const pedidoAtual = pedidoRef.current;

    // Merge: preserva campos do pedido atual que não vieram no payload
    const pedidoCompleto = pedidoAtual
      ? { ...pedidoAtual, ...novoPedido }
      : novoPedido;

    if (pedidoAtual && pedidoCompleto.status !== pedidoAtual.status) {
      setStatusAnterior(pedidoAtual.status);
      setAtualizando(true);
      setMostrarNotificacao(true);
      
      setTimeout(() => setAtualizando(false), 2000);
      
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    
    setPedido(pedidoCompleto);
  }, []); // sem deps → referência estável → canal nunca é recriado

  // Efeito inicial — roda UMA única vez por pedidoId.
  // handleAtualizacaoPedido e carregarDados são estáveis.
  useEffect(() => {
    if (!pedidoId) return;
    
    carregarDados();
    
    const canal = PedidoModel.assinarMudancas(pedidoId, handleAtualizacaoPedido);
    
    // Polling de fallback (30s) para cobrir casos onde Realtime falha
    const intervalo = setInterval(carregarDados, 30000);
    
    return () => {
      PedidoModel.cancelarAssinatura(canal);
      clearInterval(intervalo);
    };
  }, [pedidoId, carregarDados, handleAtualizacaoPedido]);

  // Dados derivados do status
  const statusNormalizado = StatusModel.normalizar(pedido?.status);
  const passoAtual = StatusModel.getPasso(pedido?.status);
  const configStatus = StatusModel.getConfig(pedido?.status);
  const indiceStatus = StatusModel.getIndice(pedido?.status);
  const progresso = StatusModel.calcularProgresso(pedido?.status);
  
  // Mensagem de transição (se houver mudança)
  const mensagemTransicao = statusAnterior 
    ? StatusModel.getMensagemTransicao(statusAnterior, pedido?.status)
    : null;

  // Actions disponíveis para a View
  const actions = {
    fecharNotificacao: () => setMostrarNotificacao(false),
    recarregar: carregarDados,
    atualizarStatus: async (novoStatus) => {
      try {
        await PedidoModel.atualizarStatus(pedidoId, novoStatus);
        await carregarDados();
      } catch (error) {
        console.error('❌ [Controller] Erro ao atualizar status:', error);
        throw error;
      }
    }
  };

  return {
    // Estado
    pedido,
    itens,
    loading,
    atualizando,
    mostrarNotificacao,
    
    // Dados processados
    statusNormalizado,
    passoAtual,
    configStatus,
    indiceStatus,
    indiceStatusAtual: indiceStatus,   // alias esperado pela View
    progresso,
    statusAnterior,
    mensagemTransicao,
    
    // Constantes (nomes duplicados para compatibilidade com a View)
    PASSOS: StatusModel.PASSOS,
    STATUS_PASSOS: StatusModel.PASSOS, // alias esperado pela View
    STATUS_CONFIG: StatusModel.CONFIG,
    
    // Actions
    ...actions
  };
}