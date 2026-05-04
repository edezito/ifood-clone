// src/models/statusModel.js
export const StatusModel = {
  PASSOS: [
    { key: 'Aguardando',    label: 'Pedido recebido',  hint: 'Aguardando confirmação' },
    { key: 'Em Preparação', label: 'Preparando',       hint: 'Cozinha em ação' },
    { key: 'Em Trânsito',   label: 'Saiu para entrega',  hint: 'A caminho' },
    { key: 'Entregue',      label: 'Entregue',           hint: 'Bom apetite!' },
  ],

  CONFIG: {
    'Aguardando': {
      label: 'Aguardando confirmação',
      eta: '~35 min',
      bgGradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      textColor: 'text-blue-700',
    },
    'Em Preparação': {
      label: 'Em preparação',
      eta: '~22 min',
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-100',
      textColor: 'text-amber-700',
    },
    'Em Trânsito': {
      label: 'Em trânsito',
      eta: '~10 min',
      bgGradient: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-100',
      textColor: 'text-purple-700',
    },
    'Entregue': {
      label: 'Entregue',
      eta: 'Concluído',
      bgGradient: 'from-emerald-50 to-green-50',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100',
      textColor: 'text-emerald-700',
    },
  },

  normalizar(status) {
    if (!status) return 'Aguardando';
    const mapa = {
      'aguardando':    'Aguardando',
      'confirmado':    'Aguardando', // 🔥 O SEGREDO ESTÁ AQUI: Agora ele entende que "Confirmado" é o passo inicial!
      'pending':       'Aguardando',
      'em preparação': 'Em Preparação',
      'preparando':    'Em Preparação',
      'em transito':   'Em Trânsito',
      'em trânsito':   'Em Trânsito',
      'entregue':      'Entregue',
      'delivered':     'Entregue',
    };
    return mapa[String(status).toLowerCase()] || status;
  },

  getConfig(status) {
    return this.CONFIG[this.normalizar(status)] || this.CONFIG['Aguardando'];
  },

  getPasso(status) {
    const normalizado = this.normalizar(status);
    return this.PASSOS.find(p => p.key === normalizado) || this.PASSOS[0];
  },

  getIndice(status) {
    return this.PASSOS.findIndex(p => p.key === this.normalizar(status));
  },

  calcularProgresso(status) {
    const indice = this.getIndice(status);
    if (indice < 0) return 0;
    return ((indice + 1) / this.PASSOS.length) * 100;
  },

  getMensagemTransicao(statusAntigo, statusNovo) {
    const mensagens = {
      'Aguardando→Em Preparação': 'Seu pedido foi aceito e está sendo preparado! 👨‍🍳',
      'Em Preparação→Em Trânsito': 'Seu pedido saiu para entrega! 🛵',
      'Em Trânsito→Entregue':     'Pedido entregue! Bom apetite! 🎉',
    };
    const chave = `${this.normalizar(statusAntigo)}→${this.normalizar(statusNovo)}`;
    return mensagens[chave] || `Status atualizado para: ${this.normalizar(statusNovo)}`;
  },
};

export default StatusModel;