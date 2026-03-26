// ============================================================
// CONTROLLER: useHistoricoController
// Responsabilidade: busca histórico de pedidos por telefone
// ============================================================
import { useState, useEffect } from 'react';
import { PedidoModel } from '../models/pedidoModel';

export function useHistoricoController(telefone) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (!telefone) return;
    PedidoModel.buscarPorTelefone(telefone)
      .then((data) => setPedidos(data ?? []))
      .catch((err) => console.error('Erro ao buscar histórico:', err));
  }, [telefone]);

  return { pedidos };
}