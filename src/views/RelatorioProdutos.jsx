import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/Supabaseclient';
import { Download, Package } from 'lucide-react';

const CATEGORIAS_LABEL = {
  pizza:      '🍕 Pizza',
  lanches:    '🍔 Lanches',
  japonesa:   '🍣 Japonesa',
  brasileira: '🍖 Brasileira',
  massas:     '🍝 Massas',
  saudavel:   '🥗 Saudável',
  bebidas:    '🥤 Bebidas',
  sobremesas: '🍰 Sobremesas',
  outros:     '🍽️ Outros',
};

const RelatorioProdutos = () => {
  const [itensPedido, setItensPedido]             = useState([]);
  const [produtos, setProdutos]                   = useState([]);
  const [restaurantes, setRestaurantes]           = useState([]);
  const [pedidos, setPedidos]                     = useState([]);
  const [restauranteFiltro, setRestauranteFiltro] = useState('todos');
  const [ordenacao, setOrdenacao]                 = useState('quantidade');
  const [loading, setLoading]                     = useState(true);

  useEffect(() => {
    async function fetchDados() {
      setLoading(true);
      const [
        { data: rests },
        { data: prods },
        { data: itens },
        { data: peds },
      ] = await Promise.all([
        supabase.from('restaurantes').select('id, nome'),
        supabase.from('produtos').select('id, nome, preco, categoria, restaurante_id'),
        supabase.from('itens_pedido').select('id, pedido_id, produto_id, quantidade, preco_unitario'),
        supabase.from('pedidos').select('id, restaurante_id'),
      ]);
      if (rests) setRestaurantes(rests);
      if (prods) setProdutos(prods);
      if (itens) setItensPedido(itens);
      if (peds)  setPedidos(peds);
      setLoading(false);
    }
    fetchDados();
  }, []);

  const pedidoRestMap = useMemo(() => {
    const m = {};
    pedidos.forEach(p => { m[p.id] = p.restaurante_id; });
    return m;
  }, [pedidos]);

  const produtosVendidos = useMemo(() => {
    const vendasMap = {};
    itensPedido.forEach(item => {
      const pid = item.produto_id;
      if (!vendasMap[pid]) {
        vendasMap[pid] = { produto_id: pid, quantidade: 0, receita: 0, restaurante_id: pedidoRestMap[item.pedido_id] };
      }
      vendasMap[pid].quantidade += Number(item.quantidade || 1);
      vendasMap[pid].receita    += Number(item.preco_unitario || 0) * Number(item.quantidade || 1);
    });

    return Object.values(vendasMap).map(v => {
      const prod = produtos.find(p => p.id === v.produto_id);
      if (!prod) return null;
      const restId = v.restaurante_id || prod.restaurante_id;
      return {
        ...v,
        nome:             prod.nome,
        categoria:        prod.categoria || 'outros',
        preco_unitario:   prod.preco,
        restaurante_id:   restId,
        restaurante_nome: restaurantes.find(r => r.id === restId)?.nome || 'N/D',
      };
    }).filter(Boolean);
  }, [itensPedido, produtos, restaurantes, pedidoRestMap]);

  const dadosFiltrados = useMemo(() => {
    const base = restauranteFiltro === 'todos'
      ? produtosVendidos
      : produtosVendidos.filter(p => String(p.restaurante_id) === String(restauranteFiltro));
    return [...base].sort((a, b) =>
      ordenacao === 'quantidade' ? b.quantidade - a.quantidade : b.receita - a.receita
    );
  }, [produtosVendidos, restauranteFiltro, ordenacao]);

  const totalVendas  = dadosFiltrados.reduce((a, p) => a + p.quantidade, 0);
  const totalReceita = dadosFiltrados.reduce((a, p) => a + p.receita, 0);
  const topProduto   = dadosFiltrados[0] || null;

  const exportarCSV = () => {
    if (!dadosFiltrados.length) return;
    const cab  = ['Produto','Categoria','Restaurante','Qtd Vendida','Receita Total','Preço Unit.'];
    const lin  = dadosFiltrados.map(p => [p.nome, p.categoria, p.restaurante_nome, p.quantidade, p.receita.toFixed(2), p.preco_unitario]);
    const csv  = [cab.join(','), ...lin.map(l => l.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `produtos_mais_vendidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div style={{ width: 36, height: 36, border: '3px solid #f3f4f6', borderTop: '3px solid #ea1d2c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p className="text-gray-500 text-sm">Carregando produtos...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Produtos Mais Vendidos</h2>
            <p className="text-sm text-gray-500">Análise de performance por produto</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select className="border rounded-lg p-2 text-sm" value={ordenacao} onChange={e => setOrdenacao(e.target.value)}>
            <option value="quantidade">Ordenar por Quantidade</option>
            <option value="receita">Ordenar por Receita</option>
          </select>
          <select className="border rounded-lg p-2 text-sm" value={restauranteFiltro} onChange={e => setRestauranteFiltro(e.target.value)}>
            <option value="todos">Todos os Restaurantes</option>
            {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
          <button
            onClick={exportarCSV}
            disabled={!dadosFiltrados.length}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Download size={18} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
          <p className="text-orange-100 text-sm">Total de Itens Vendidos</p>
          <p className="text-3xl font-bold mt-2">{totalVendas}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
          <p className="text-green-100 text-sm">Receita Total</p>
          <p className="text-3xl font-bold mt-2">
            {totalReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-xl text-white shadow-lg">
          <p className="text-yellow-100 text-sm">Produto Campeão</p>
          <p className="text-xl font-bold mt-2 truncate">{topProduto?.nome || '—'}</p>
          {topProduto && (
            <p className="text-sm text-yellow-200 mt-1">{topProduto.quantidade} unidades vendidas</p>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 font-semibold">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">Produto</th>
              <th className="p-4 text-left">Categoria</th>
              <th className="p-4 text-left">Restaurante</th>
              <th className="p-4 text-center">Qtd. Vendida</th>
              <th className="p-4 text-right">Receita Total</th>
              <th className="p-4 text-right">Preço Unit.</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dadosFiltrados.map((p, i) => (
              <tr key={p.produto_id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-400 font-bold">{i + 1}</td>
                <td className="p-4 font-medium text-gray-800">{p.nome}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {CATEGORIAS_LABEL[p.categoria] || p.categoria}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{p.restaurante_nome}</td>
                <td className="p-4 text-center font-bold">{p.quantidade}</td>
                <td className="p-4 text-right text-green-600 font-medium">
                  {p.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 text-right text-gray-600">
                  {Number(p.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
            {dadosFiltrados.length === 0 && (
              <tr><td colSpan="7" className="p-8 text-center text-gray-400">Nenhum produto encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RelatorioProdutos;
