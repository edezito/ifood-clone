// ============================================================
// CONTROLLER: useAcompanhamentoController
// Responsabilidade: Orquestrar models e gerenciar estado
// ============================================================
import { useState, useEffect, useCallback } from 'react';
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

  // Handler para atualizações em tempo real
  const handleAtualizacaoPedido = useCallback((novoPedido) => {
    console.log('📡 [Controller] Pedido atualizado:', novoPedido);
    
    // Verificar mudança de status
    if (pedido && novoPedido.status !== pedido.status) {
      setStatusAnterior(pedido.status);
      setAtualizando(true);
      setMostrarNotificacao(true);
      
      // Resetar estado de atualização após animação
      setTimeout(() => setAtualizando(false), 2000);
      
      // Feedback tátil (mobile)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    }
    
    setPedido(novoPedido);
  }, [pedido]);

  // Efeito inicial
  useEffect(() => {
    if (!pedidoId) return;
    
    carregarDados();
    
    // Assinar mudanças em tempo real
    const canal = PedidoModel.assinarMudancas(pedidoId, handleAtualizacaoPedido);
    
    // Polling de fallback
    const intervalo = setInterval(() => {
      console.log('🔄 [Controller] Polling de verificação');
      carregarDados();
    }, 30000);
    
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
    progresso,
    statusAnterior,
    mensagemTransicao,
    
    // Constantes
    PASSOS: StatusModel.PASSOS,
    STATUS_CONFIG: StatusModel.CONFIG,
    
    // Actions
    ...actions
  };
}