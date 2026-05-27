import React, { useState, useMemo } from 'react';
import { Download, Package, Star, TrendingUp } from 'lucide-react';

const RelatorioProdutos = ({ produtos = [], pedidos = [], restaurantes = [] }) => {
  const [restauranteFiltro, setRestauranteFiltro] = useState('todos');
  const [ordenacao, setOrdenacao] = useState('quantidade');

  const produtosVendidos = useMemo(() => {
    if (!pedidos.length || !produtos.length) return [];

    // Mapeia as vendas de produtos
    const vendasPorProduto = {};

    pedidos.forEach(pedido => {
      if (pedido.itens && Array.isArray(pedido.itens)) {
        pedido.itens.forEach(item => {
          const produtoId = item.produto_id || item.id;
          if (!vendasPorProduto[produtoId]) {
            vendasPorProduto[produtoId] = {
              produto_id: produtoId,
              quantidade: 0,
              receita: 0,
              restaurante_id: pedido.restaurante_id,
            };
          }
          vendasPorProduto[produtoId].quantidade += item.quantidade || 1;
          vendasPorProduto[produtoId].receita += (item.preco || 0) * (item.quantidade || 1);
        });
      }
    });

    // Enriquece com dados dos produtos
    return Object.values(vendasPorProduto)
      .map(venda => {
        const produto = produtos.find(p => p.id === venda.produto_id);
        if (!produto) return null;

        return {
          ...venda,
          nome: produto.nome,
          categoria: produto.categoria || 'Sem categoria',
          preco_unitario: produto.preco,
          restaurante_nome: restaurantes.find(r => r.id === venda.restaurante_id)?.nome || 'N/D',
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (ordenacao === 'quantidade') return b.quantidade - a.quantidade;
        if (ordenacao === 'receita') return b.receita - a.receita;
        return 0;
      });

  }, [pedidos, produtos, restaurantes, ordenacao]);

  const dadosFiltrados = restauranteFiltro === 'todos'
    ? produtosVendidos
    : produtosVendidos.filter(p => String(p.restaurante_id) === String(restauranteFiltro));

  const exportarCSV = () => {
    if (!dadosFiltrados.length) return;

    const cabecalhos = ['Produto', 'Categoria', 'Restaurante', 'Quantidade Vendida', 'Receita Total', 'Preço Unitário'];
    const linhas = dadosFiltrados.map(p => [
      p.nome,
      p.categoria,
      p.restaurante_nome,
      p.quantidade,
      p.receita.toFixed(2),
      p.preco_unitario
    ]);

    const csvContent = [cabecalhos.join(','), ...linhas.map(l => l.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `produtos_mais_vendidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
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
          <select
            className="border rounded-lg p-2 text-sm"
            value={ordenacao}
            onChange={(e) => setOrdenacao(e.target.value)}
          >
            <option value="quantidade">Ordenar por Quantidade</option>
            <option value="receita">Ordenar por Receita</option>
          </select>

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
            {dadosFiltrados.map((produto, index) => (
              <tr key={produto.produto_id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-400">{index + 1}</td>
                <td className="p-4 font-medium text-gray-800">{produto.nome}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {produto.categoria}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{produto.restaurante_nome}</td>
                <td className="p-4 text-center font-medium">{produto.quantidade}</td>
                <td className="p-4 text-right text-green-600 font-medium">
                  {produto.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="p-4 text-right text-gray-600">
                  {Number(produto.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
              </tr>
            ))}
            {dadosFiltrados.length === 0 && (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  Nenhum produto encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RelatorioProdutos;