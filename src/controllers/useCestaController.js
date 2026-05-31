// ============================================================
// CONTROLLER: useCestaController
// Responsabilidade: Fornecer os dados da cesta para as Views
// ============================================================
import { useContext } from 'react';
import { CestaContext } from '../contexts/CestaContext';

export function useCestaController() {
  const contexto = useContext(CestaContext);

  if (!contexto) {
    throw new Error('useCestaController deve ser usado dentro de um CestaProvider');
  }

  return contexto;
}