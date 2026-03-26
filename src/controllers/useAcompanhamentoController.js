// ============================================================
// CONTROLLER: useAcompanhamentoController
// Responsabilidade: busca dados do pedido e assina mudanças
// em tempo real via Supabase Realtime.
// ============================================================
import { useState, useEffect } from 'react';
import { PedidoModel } from '../models/pedidoModel';
import { ItensPedidoModel } from '../models/itensPedidoModel';

export function useAcompanhamentoController(pedidoId) {
  const [pedido, setPedido] = useState(null);
  const [itens, setItens] = useState([]);

  useEffect(() => {
    if (!pedidoId) return;

    const carregar = async () => {
      try {
        const [ped, its] = await Promise.all([
          PedidoModel.buscarPorId(pedidoId),
          ItensPedidoModel.buscarPorPedido(pedidoId),
        ]);
        setPedido(ped);
        setItens(its ?? []);
      } catch (err) {
        console.error('Erro ao carregar pedido:', err);
      }
    };

    carregar();

    const canal = PedidoModel.assinarMudancas(pedidoId, (novoPedido) =>
      setPedido(novoPedido)
    );

    return () => PedidoModel.cancelarAssinatura(canal);
  }, [pedidoId]);

  const STATUS_PASSOS = [
    { label: 'Pedido Recebido', key: 'Aguardando' },
    { label: 'Em Preparação', key: 'Em Preparação' },
    { label: 'A caminho', key: 'Em Trânsito' },
    { label: 'Entregue', key: 'Entregue' },
  ];

  const indiceStatusAtual = STATUS_PASSOS.findIndex((p) => p.key === pedido?.status);

  return { pedido, itens, STATUS_PASSOS, indiceStatusAtual };
}