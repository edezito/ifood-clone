// ============================================================
// UTIL: Status Normalizer
// Responsabilidade: Funções auxiliares para normalização
// ============================================================

export const normalizeStatus = (status) => {
  if (!status) return 'Aguardando';
  
  const statusStr = String(status).trim();
  
  const statusMap = {
    'aguardando': 'Aguardando',
    'pending': 'Aguardando',
    'pendente': 'Aguardando',
    'em preparação': 'Em Preparação',
    'preparando': 'Em Preparação',
    'preparing': 'Em Preparação',
    'em transito': 'Em Trânsito',
    'em trânsito': 'Em Trânsito',
    'transito': 'Em Trânsito',
    'em_trânsito': 'Em Trânsito',
    'delivering': 'Em Trânsito',
    'entregue': 'Entregue',
    'delivered': 'Entregue',
    'finalizado': 'Entregue',
    'concluido': 'Entregue',
    'concluído': 'Entregue'
  };
  
  return statusMap[statusStr.toLowerCase()] || statusStr;
};

export const getStatusColor = (status) => {
  const colors = {
    'Aguardando': 'blue',
    'Em Preparação': 'amber',
    'Em Trânsito': 'purple',
    'Entregue': 'emerald'
  };
  
  return colors[normalizeStatus(status)] || 'gray';
};

export const getStatusIcon = (status) => {
  // Retornar ícone apropriado
};