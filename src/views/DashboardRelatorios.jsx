import React, { useState, useEffect, useMemo } from 'react';
import { Download, BarChart3, TrendingUp, AlertCircle, DollarSign, ShoppingCart } from 'lucide-react';

const DashboardRelatorios = ({ restaurantes = [], pedidos = [] }) => {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [restauranteFiltro, setRestauranteFiltro] = useState('todos');
  const [periodoFiltro, setPeriodoFiltro] = useState('ultima_semana');

  // Processa os dados para gerar o relatório de performance
  const dadosRelatorio = useMemo(() => {
    if (!pedidos || pedidos.length === 0) return [];

    const hoje = new Date();
    let dataInicio;

    switch (periodoFiltro) {
      case 'ultima_semana':
        dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'ultimo_mes':
        dataInicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'ultimo_trimestre':
        dataInicio = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        dataInicio = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Filtra pedidos por período
    const pedidosFiltrados = pedidos.filter(p => {
      const dataPedido = new Date(p.criado_em);
      return dataPedido >= dataInicio && dataPedido <= hoje;
    });

    // Agrupa por restaurante
    const dadosAgrupados = {};
    
    pedidosFiltrados.forEach(pedido => {
      const restId = pedido.restaurante_id || 'sem_restaurante';
      
      if (!dadosAgrupados[restId]) {
        dadosAgrupados[restId] = {
          restaurante_id: restId,
          restaurante_nome: restaurantes.find(r => r.id === restId)?.nome || 'Restaurante Removido',
          total_pedidos: 0,
          receita_total: 0,
          pedidos_aprovados: 0,
          pedidos_cancelados: 0,
        };
      }

      dadosAgrupados[restId].total_pedidos++;
      
      // Calcula receita (assumindo que existe um campo 'total' no pedido)
      const valorPedido = pedido.total || pedido.valor_total || 0;
      dadosAgrupados[restId].receita_total += Number(valorPedido);

      if (pedido.status === 'entregue' || pedido.status === 'aprovado') {
        dadosAgrupados[restId].pedidos_aprovados++;
      }
      if (pedido.status === 'cancelado') {
        dadosAgrupados[restId].pedidos_cancelados++;
      }
    });

    // Converte para array e calcula métricas
    return Object.values(dadosAgrupados).map(dado => ({
      ...dado,
      ticket_medio: dado.total_pedidos > 0 ? dado.receita_total / dado.total_pedidos : 0,
      taxa_aprovacao: dado.total_pedidos > 0 
        ? ((dado.pedidos_aprovados / dado.total_pedidos) * 100).toFixed(1) + '%'
        : '0%',
      periodo: `${dataInicio.toLocaleDateString('pt-BR')} - ${hoje.toLocaleDateString('pt-BR')}`,
    }));

  }, [pedidos, restaurantes, periodoFiltro]);

  const dadosFiltrados = restauranteFiltro === 'todos' 
    ? dadosRelatorio 
    : dadosRelatorio.filter(d => String(d.restaurante_id) === String(restauranteFiltro));

  // Calcula totais gerais
  const totaisGerais = useMemo(() => {
    return dadosFiltrados.reduce((acc, item) => ({
      total_pedidos: acc.total_pedidos + item.total_pedidos,
      receita_total: acc.receita_total + item.receita_total,
      ticket_medio: 0, // Será calculado depois
    }), { total_pedidos: 0, receita_total: 0 });

  }, [dadosFiltrados]);

  if (totaisGerais.total_pedidos > 0) {
    totaisGerais.ticket_medio = totaisGerais.receita_total / totaisGerais.total_pedidos;
  }

  const exportarParaCSV = () => {
    if (!dadosFiltrados || dadosFiltrados.length === 0) return;

    const cabecalhos = [
      'Restaurante',
      'Período',
      'Total Pedidos',
      'Receita Total',
      'Ticket Médio',
      'Taxa Aprovação',
      'Pedidos Aprovados',
      'Pedidos Cancelados'
    ];

    const linhas = dadosFiltrados.map(d => [
      d.restaurante_nome,
      d.periodo,
      d.total_pedidos,
      d.receita_total.toFixed(2),
      d.ticket_medio.toFixed(2),
      d.taxa_aprovacao,
      d.pedidos_aprovados,
      d.pedidos_cancelados
    ]);

    const csvContent = [cabecalhos.join(','), ...linhas.map(l => l.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho e Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <BarChart3 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Performance Financeira</h2>
            <p className="text-sm text-gray-500">Análise de vendas e receita</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select 
            className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={periodoFiltro}
            onChange={(e) => setPeriodoFiltro(e.target.value)}
          >
            <option value="ultima_semana">Última Semana</option>
            <option value="ultimo_mes">Último Mês</option>
            <option value="ultimo_trimestre">Último Trimestre</option>
          </select>

          <select 
            className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={restauranteFiltro}
            onChange={(e) => setRestauranteFiltro(e.target.value)}
          >
            <option value="todos">Todos os Restaurantes</option>
            {restaurantes.map(rest => (
              <option key={rest.id} value={rest.id}>{rest.nome}</option>
            ))}
          </select>

          <button 
            onClick={exportarParaCSV}
            disabled={dadosFiltrados.length === 0}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de Pedidos</p>
              <p className="text-3xl font-bold mt-1">{totaisGerais.total_pedidos}</p>
            </div>
            <ShoppingCart size={32} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Receita Total</p>
              <p className="text-3xl font-bold mt-1">
                {totaisGerais.receita_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <DollarSign size={32} className="text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Ticket Médio</p>
              <p className="text-3xl font-bold mt-1">
                {totaisGerais.ticket_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <TrendingUp size={32} className="text-purple-200" />
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
              <tr>
                <th className="p-4">Restaurante</th>
                <th className="p-4">Período</th>
                <th className="p-4 text-center">Pedidos</th>
                <th className="p-4 text-right">Receita</th>
                <th className="p-4 text-right">Ticket Médio</th>
                <th className="p-4 text-center">Taxa Aprovação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dadosFiltrados.length > 0 ? (
                dadosFiltrados.map((linha, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{linha.restaurante_nome}</td>
                    <td className="p-4 text-gray-600">{linha.periodo}</td>
                    <td className="p-4 text-center">{linha.total_pedidos}</td>
                    <td className="p-4 text-right text-green-600 font-medium">
                      {linha.receita_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 text-right">
                      {linha.ticket_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {linha.taxa_aprovacao}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Nenhum dado encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardRelatorios;