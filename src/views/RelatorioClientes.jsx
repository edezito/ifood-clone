import React, { useState, useMemo } from 'react';
import { Download, Users, UserCheck, Clock } from 'lucide-react';

const RelatorioClientes = ({ clientes = [], pedidos = [], restaurantes = [] }) => {
  const [restauranteFiltro, setRestauranteFiltro] = useState('todos');

  const analiseClientes = useMemo(() => {
    if (!pedidos.length) return [];

    const clienteStats = {};

    pedidos.forEach(pedido => {
      const clienteId = pedido.cliente_id || pedido.usuario_id;
      if (!clienteId) return;

      if (!clienteStats[clienteId]) {
        const cliente = clientes.find(c => c.id === clienteId);
        clienteStats[clienteId] = {
          cliente_id: clienteId,
          nome: cliente?.nome || 'Cliente ' + clienteId,
          email: cliente?.email || 'N/D',
          total_pedidos: 0,
          total_gasto: 0,
          ultimo_pedido: null,
          restaurantes_frequentados: new Set(),
        };
      }

      clienteStats[clienteId].total_pedidos++;
      clienteStats[clienteId].total_gasto += Number(pedido.total || 0);
      
      if (pedido.restaurante_id) {
        clienteStats[clienteId].restaurantes_frequentados.add(pedido.restaurante_id);
      }

      const dataPedido = new Date(pedido.criado_em);
      if (!clienteStats[clienteId].ultimo_pedido || dataPedido > clienteStats[clienteId].ultimo_pedido) {
        clienteStats[clienteId].ultimo_pedido = dataPedido;
      }
    });

    return Object.values(clienteStats)
      .map(stat => ({
        ...stat,
        restaurantes_frequentados: stat.restaurantes_frequentados.size,
        ticket_medio: stat.total_gasto / stat.total_pedidos,
        ultimo_pedido: stat.ultimo_pedido?.toLocaleDateString('pt-BR') || 'N/D',
      }))
      .sort((a, b) => b.total_gasto - a.total_gasto);

  }, [pedidos, clientes]);

  const dadosFiltrados = restauranteFiltro === 'todos'
    ? analiseClientes
    : analiseClientes.filter(cliente => {
        // Filtra clientes que já compraram no restaurante selecionado
        return pedidos.some(p => 
          p.cliente_id === cliente.cliente_id && 
          String(p.restaurante_id) === String(restauranteFiltro)
        );
      });

  const exportarCSV = () => {
    if (!dadosFiltrados.length) return;

    const cabecalhos = ['Cliente', 'Email', 'Total Pedidos', 'Total Gasto', 'Ticket Médio', 'Último Pedido', 'Restaurantes Visitados'];
    const linhas = dadosFiltrados.map(c => [
      c.nome,
      c.email,
      c.total_pedidos,
      c.total_gasto.toFixed(2),
      c.ticket_medio.toFixed(2),
      c.ultimo_pedido,
      c.restaurantes_frequentados
    ]);

    const csvContent = [cabecalhos.join(','), ...linhas.map(l => l.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analise_clientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Estatísticas gerais
  const totalClientes = new Set(pedidos.map(p => p.cliente_id).filter(Boolean)).size;
  const clientesRecorrentes = analiseClientes.filter(c => c.total_pedidos > 1).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Análise de Clientes</h2>
            <p className="text-sm text-gray-500">Comportamento e frequência</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="border rounded-lg p-2 text-sm"
            value={restauranteFiltro}
            onChange={(e) => setRestauranteFiltro(e.target.value)}
          >
            <option value="todos">Todos os Restaurantes</option>
            {restaurantes.map(rest => (
              <option key={rest.id} value={rest.id}>{rest.nome}</option>
            ))}
          </select>

          <button
            onClick={exportarCSV}
            disabled={!dadosFiltrados.length}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
          <p className="text-purple-100 text-sm">Total de Clientes Únicos</p>
          <p className="text-3xl font-bold mt-2">{totalClientes}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
          <p className="text-blue-100 text-sm">Clientes Recorrentes</p>
          <p className="text-3xl font-bold mt-2">{clientesRecorrentes}</p>
          <p className="text-sm text-blue-200 mt-1">
            {totalClientes > 0 ? ((clientesRecorrentes / totalClientes) * 100).toFixed(1) : 0}% do total
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <p className="text-green-100 text-sm">Ticket Médio Geral</p>
          <p className="text-3xl font-bold mt-2">
            {(dadosFiltrados.reduce((acc, c) => acc + c.total_gasto, 0) / (dadosFiltrados.length || 1))
              .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Tabela de clientes */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 font-semibold">
            <tr>
              <th className="p-4 text-left">Cliente</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-center">Pedidos</th>
              <th className="p-4 text-right">Total Gasto</th>
              <th className="p-4 text-right">Ticket Médio</th>
              <th className="p-4 text-center">Último Pedido</th>
              <th className="p-4 text-center">Lojas Visitadas</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dadosFiltrados.map(cliente => (
              <tr key={cliente.cliente_id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{cliente.nome}</td>
                <td className="p-4 text-gray-600">{cliente.email}</td>
                <td className="p-4 text-center">{cliente.total_pedidos}</td>
                <td className="p-4 text-right text-green-600 font-medium">
                  {cliente.total_gasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 text-right">
                  {cliente.ticket_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 text-center text-gray-500">{cliente.ultimo_pedido}</td>
                <td className="p-4 text-center">{cliente.restaurantes_frequentados}</td>
              </tr>
            ))}
            {dadosFiltrados.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  Nenhum cliente encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RelatorioClientes;