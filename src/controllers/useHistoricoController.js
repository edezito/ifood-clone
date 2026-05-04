// ============================================================
// CONTROLLER: useHistoricoController
// ============================================================
import { useState, useEffect } from 'react';
import { PedidoModel } from '../models/pedidoModel';

// Mudamos o parâmetro de "telefone" para um objeto de "usuario"
export function useHistoricoController(usuario) {
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    // Pegamos o email e o telefone do usuário
    const email = usuario?.email;
    const telefone = usuario?.telefone ?? usuario?.phone;

    if (!email && !telefone) {
      setPedidos([]);
      return;
    }

    // Tenta buscar por e-mail primeiro (já que sabemos que está preenchido no seu banco)
    if (email) {
      PedidoModel.buscarPorEmail(email)
        .then((data) => setPedidos(data ?? []))
        .catch((err) => console.error('Erro ao buscar histórico por email:', err));
    } 
    // Se não tiver email, tenta pelo telefone (Fallback)
    else if (telefone) {
      PedidoModel.buscarPorTelefone(telefone)
        .then((data) => setPedidos(data ?? []))
        .catch((err) => console.error('Erro ao buscar histórico por telefone:', err));
    }
  }, [usuario]); // Dependência atualizada

  return { pedidos };
}