import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/Supabaseclient';
import { Download, Users } from 'lucide-react';

const SEGMENTOS = [
  { key: 'Fidelizado', cor: '#16a34a', bg: '#dcfce7', desc: '5+ pedidos' },
  { key: 'Engajado',   cor: '#2563eb', bg: '#dbeafe', desc: '3–4 pedidos' },
  { key: 'Novo',       cor: '#d97706', bg: '#fef9c3', desc: '1 pedido' },
  { key: 'Em risco',   cor: '#dc2626', bg: '#fee2e2', desc: 'Sem pedidos' },
];

const RISCO_ESTILO = {
  'Alto risco': { cor: '#dc2626', bg: '#fee2e2' },
  'Atenção':    { cor: '#d97706', bg: '#fef9c3' },
  'Ativo':      { cor: '#16a34a', bg: '#dcfce7' },
};

function getSegmento(total) {
  if (total >= 5) return 'Fidelizado';
  if (total >= 3) return 'Engajado';
  if (total === 1) return 'Novo';
  return 'Em risco';
}

function getRisco(ultimoPedidoEm) {
  if (!ultimoPedidoEm) return 'Alto risco';
  const dias = Math.floor((Date.now() - new Date(ultimoPedidoEm)) / (1000 * 60 * 60 * 24));
  if (dias > 15) return 'Alto risco';
  if (dias > 7)  return 'Atenção';
  return 'Ativo';
}

const RelatorioClientes = () => {
  const [pedidos, setPedidos]                     = useState([]);
  const [restaurantes, setRestaurantes]           = useState([]);
  const [restauranteFiltro, setRestauranteFiltro] = useState('todos');
  const [loading, setLoading]                     = useState(true);

  useEffect(() => {
    async function fetchDados() {
      setLoading(true);
      const { data: rests } = await supabase.from('restaurantes').select('id, nome');
      if (rests) setRestaurantes(rests);

      const { data: peds } = await supabase
        .from('pedidos')
        .select('id, total, cliente_nome, cliente_id, email, criado_em, restaurante_id, forma_pagamento')
        .order('criado_em', { ascending: false });

      if (peds) setPedidos(peds);
      setLoading(false);
    }
    fetchDados();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    if (restauranteFiltro === 'todos') return pedidos;
    return pedidos.filter(p => String(p.restaurante_id) === String(restauranteFiltro));
  }, [pedidos, restauranteFiltro]);

  const analiseClientes = useMemo(() => {
    const mapa = {};
    pedidosFiltrados.forEach(p => {
      const chave = p.cliente_id || p.cliente_nome || 'desconhecido';
      if (!mapa[chave]) {
        mapa[chave] = {
          cliente_id: chave,
          nome: p.cliente_nome || 'Cliente',
          email: p.email || 'N/D',
          pedidos: [],
          gastoTotal: 0,
          restaurantes: new Set(),
        };
      }
      mapa[chave].pedidos.push(p);
      mapa[chave].gastoTotal += Number(p.total || 0);
      if (p.restaurante_id) mapa[chave].restaurantes.add(p.restaurante_id);
    });

    return Object.values(mapa).map(c => {
      const total  = c.pedidos.length;
      const ticket = total ? c.gastoTotal / total : 0;
      const ultimo = c.pedidos[0]?.criado_em || null;
      return {
        ...c,
        total_pedidos: total,
        ticket_medio: ticket,
        ultimo_pedido: ultimo ? new Date(ultimo).toLocaleDateString('pt-BR') : 'N/D',
        restaurantes_visitados: c.restaurantes.size,
        segmento: getSegmento(total),
        risco: getRisco(ultimo),
      };
    }).sort((a, b) => b.gastoTotal - a.gastoTotal);
  }, [pedidosFiltrados]);

  const contSegmentos = useMemo(() => {
    const total = analiseClientes.length || 1;
    return SEGMENTOS.map(s => ({
      ...s,
      qtd: analiseClientes.filter(c => c.segmento === s.key).length,
      pct: Math.round((analiseClientes.filter(c => c.segmento === s.key).length / total) * 100),
    }));
  }, [analiseClientes]);

  const totalClientes       = analiseClientes.length;
  const clientesRecorrentes = analiseClientes.filter(c => c.total_pedidos > 1).length;
  const ticketMedioGeral    = totalClientes
    ? analiseClientes.reduce((a, c) => a + c.gastoTotal, 0) / totalClientes
    : 0;

  const exportarCSV = () => {
    if (!analiseClientes.length) return;
    const cab  = ['Cliente','Email','Pedidos','Total Gasto','Ticket Médio','Último Pedido','Lojas Visitadas','Segmento','Risco'];
    const lin  = analiseClientes.map(c => [
      c.nome, c.email, c.total_pedidos,
      c.gastoTotal.toFixed(2), c.ticket_medio.toFixed(2),
      c.ultimo_pedido, c.restaurantes_visitados,
      c.segmento, c.risco,
    ]);
    const csv  = [cab.join(','), ...lin.map(l => l.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analise_clientes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div style={{ width: 36, height: 36, border: '3px solid #f3f4f6', borderTop: '3px solid #ea1d2c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p className="text-gray-500 text-sm">Carregando análise de clientes...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Análise de Clientes</h2>
            <p className="text-sm text-gray-500">Comportamento, segmentação e frequência</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="border rounded-lg p-2 text-sm"
            value={restauranteFiltro}
            onChange={e => setRestauranteFiltro(e.target.value)}
          >
            <option value="todos">Todos os Restaurantes</option>
            {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
          <button
            onClick={exportarCSV}
            disabled={!analiseClientes.length}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Download size={18} /> Exportar CSV
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
          <p className="text-green-100 text-sm">Gasto Médio por Cliente</p>
          <p className="text-3xl font-bold mt-2">
            {ticketMedioGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Segmentação */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">👥 Segmentação de clientes</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {contSegmentos.map(s => (
            <div key={s.key} style={{ background: s.bg, border: `1.5px solid ${s.cor}22` }} className="rounded-xl p-4">
              <p style={{ color: s.cor }} className="text-xs font-bold uppercase tracking-wide mb-1">{s.key}</p>
              <p className="text-2xl font-black text-gray-900">{s.pct}%</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc} · {s.qtd} clientes</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela */}
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
              <th className="p-4 text-center">Lojas</th>
              <th className="p-4 text-center">Segmento</th>
              <th className="p-4 text-center">Risco</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {analiseClientes.map(c => {
              const seg  = SEGMENTOS.find(s => s.key === c.segmento);
              const risc = RISCO_ESTILO[c.risco];
              return (
                <tr key={c.cliente_id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{c.nome}</td>
                  <td className="p-4 text-gray-500 text-xs">{c.email}</td>
                  <td className="p-4 text-center font-bold">{c.total_pedidos}</td>
                  <td className="p-4 text-right text-green-600 font-medium">
                    {c.gastoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-4 text-right text-gray-600">
                    {c.ticket_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-4 text-center text-gray-500">{c.ultimo_pedido}</td>
                  <td className="p-4 text-center">{c.restaurantes_visitados}</td>
                  <td className="p-4 text-center">
                    <span style={{ background: seg?.bg, color: seg?.cor }} className="px-2 py-1 rounded-full text-xs font-bold">
                      {c.segmento}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span style={{ background: risc?.bg, color: risc?.cor }} className="px-2 py-1 rounded-full text-xs font-bold">
                      {c.risco}
                    </span>
                  </td>
                </tr>
              );
            })}
            {analiseClientes.length === 0 && (
              <tr><td colSpan="9" className="p-8 text-center text-gray-400">Nenhum cliente encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RelatorioClientes;
