import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  Store, ShoppingBag, Package, MapPin, Edit2, Trash2,
  CheckCircle, Clock, X, PlusCircle, AlertCircle, LogOut
} from 'lucide-react';

function AdminDashboard({ onLogout }) {
  // Estados de Dados
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  // Estados de UI
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('info');
  const [abaAtiva, setAbaAtiva] = useState('pedidos'); // pedidos, catalogo, gerenciar

  // Estados de Formulário
  const [nomeRest, setNomeRest] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [nomeProd, setNomeProd] = useState('');
  const [preco, setPreco] = useState('');
  const [restauranteSelecionado, setRestauranteSelecionado] = useState('');

  // Estados de Edição
  const [editandoRestId, setEditandoRestId] = useState(null);
  const [editandoProdId, setEditandoProdId] = useState(null);

  useEffect(() => {
    fetchDados();

    // Opcional: Escutar novos pedidos em tempo real (Descomente se quiser)
    /*
    const channel = supabase.channel('pedidos_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, payload => {
        fetchDados();
      }).subscribe();
    return () => supabase.removeChannel(channel);
    */
  }, []);

  const mostrarMensagem = (texto, tipo = 'info') => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    setTimeout(() => setMensagem(''), 5000);
  };

  const fetchDados = async () => {
    const { data: rests } = await supabase.from('restaurantes').select('*');
    if (rests) setRestaurantes(rests);

    const { data: prods } = await supabase.from('produtos').select('*');
    if (prods) setProdutos(prods);

    const { data: peds } = await supabase.from('pedidos').select('*').order('id', { ascending: false });
    if (peds) setPedidos(peds);
  };

  const obterCoordenadas = async (enderecoDigitado) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoDigitado)}`);
      const data = await response.json();
      if (data && data.length > 0) return { lat: parseFloat(data[0].lat).toFixed(6), lng: parseFloat(data[0].lon).toFixed(6) };
      return null;
    } catch (error) { return null; }
  };

  // --- FUNÇÕES DE RESTAURANTE ---
  const handleSalvarRestaurante = async (e) => {
    e.preventDefault();
    mostrarMensagem('Buscando coordenadas...', 'info');

    const coordenadas = await obterCoordenadas(endereco);
    if (!coordenadas) return mostrarMensagem('Endereço não encontrado pelo GPS. Tente ser mais específico.', 'error');

    try {
      if (editandoRestId) {
        const { data, error } = await supabase
          .from('restaurantes')
          .update({ nome: nomeRest, cnpj, endereco, latitude: coordenadas.lat, longitude: coordenadas.lng })
          .eq('id', editandoRestId)
          .select();
        if (error) throw error;
        setRestaurantes(restaurantes.map(r => r.id === editandoRestId ? data[0] : r));
        mostrarMensagem('Loja atualizada com sucesso!', 'success');
      } else {
        const { data, error } = await supabase
          .from('restaurantes')
          .insert([{ nome: nomeRest, cnpj, endereco, latitude: coordenadas.lat, longitude: coordenadas.lng }])
          .select();
        if (error) throw error;
        setRestaurantes([...restaurantes, data[0]]);
        mostrarMensagem('Loja cadastrada com sucesso!', 'success');
      }
      cancelarEdicaoRest();
    } catch (error) {
      mostrarMensagem(`Erro: ${error.message}`, 'error');
    }
  };

  const handleExcluirRestaurante = async (id, nome) => {
    if (!window.confirm(`ATENÇÃO: Deseja excluir "${nome}" e todos os produtos vinculados?`)) return;
    try {
      const { error } = await supabase.from('restaurantes').delete().eq('id', id);
      if (error) throw error;
      setRestaurantes(restaurantes.filter(r => r.id !== id));
      setProdutos(produtos.filter(p => p.restaurante_id !== id));
      mostrarMensagem('Loja excluída!', 'success');
    } catch (error) {
      mostrarMensagem(`Erro ao excluir: ${error.message}`, 'error');
    }
  };

  const prepararEdicaoRestaurante = (rest) => {
    setNomeRest(rest.nome); setCnpj(rest.cnpj); setEndereco(rest.endereco);
    setEditandoRestId(rest.id);
    setAbaAtiva('gerenciar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicaoRest = () => {
    setNomeRest(''); setCnpj(''); setEndereco(''); setEditandoRestId(null);
  };

  // --- FUNÇÕES DE PRODUTO ---
  const handleSalvarProduto = async (e) => {
    e.preventDefault();
    if (!restauranteSelecionado) return mostrarMensagem('Selecione uma loja para vincular o produto.', 'error');

    try {
      if (editandoProdId) {
        const { data, error } = await supabase
          .from('produtos')
          .update({ nome: nomeProd, preco: parseFloat(preco.replace(',', '.')), restaurante_id: restauranteSelecionado })
          .eq('id', editandoProdId)
          .select();
        if (error) throw error;
        setProdutos(produtos.map(p => p.id === editandoProdId ? data[0] : p));
        mostrarMensagem('Produto atualizado!', 'success');
      } else {
        const { data, error } = await supabase
          .from('produtos')
          .insert([{ nome: nomeProd, preco: parseFloat(preco.replace(',', '.')), restaurante_id: restauranteSelecionado }])
          .select();
        if (error) throw error;
        setProdutos([...produtos, data[0]]);
        mostrarMensagem('Produto salvo!', 'success');
      }
      cancelarEdicaoProd();
    } catch (error) {
      mostrarMensagem(`Erro: ${error.message}`, 'error');
    }
  };

  const handleExcluirProduto = async (id, nome) => {
    if (!window.confirm(`Remover o produto "${nome}"?`)) return;
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      setProdutos(produtos.filter(p => p.id !== id));
      mostrarMensagem('Produto removido!', 'success');
    } catch (error) {
      mostrarMensagem(`Erro ao remover: ${error.message}`, 'error');
    }
  };

  const prepararEdicaoProduto = (prod) => {
    setNomeProd(prod.nome); setPreco(prod.preco.toString()); setRestauranteSelecionado(prod.restaurante_id);
    setEditandoProdId(prod.id);
    setAbaAtiva('gerenciar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicaoProd = () => {
    setNomeProd(''); setPreco(''); setRestauranteSelecionado(''); setEditandoProdId(null);
  };

  // --- FUNÇÕES DE PEDIDO ---
  const handleAtualizarStatus = async (pedidoId, novoStatus) => {
    try {
      const { error } = await supabase.from('pedidos').update({ status: novoStatus }).eq('id', pedidoId);
      if (error) throw error;
      setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
      mostrarMensagem(`Pedido atualizado para: ${novoStatus}`, 'success');
    } catch (error) {
      mostrarMensagem(`Erro ao atualizar: ${error.message}`, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'Aguardando': 'bg-amber-100 text-amber-800 border-amber-200',
      'Em Preparação': 'bg-blue-100 text-blue-800 border-blue-200', // Ajustado para bater com o ClienteApp
      'Em Trânsito': 'bg-purple-100 text-purple-800 border-purple-200', // Ajustado para bater com o ClienteApp
      'Entregue': 'bg-green-100 text-green-800 border-green-200',
      'Cancelado': 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20 lg:pb-0">

      {/* HEADER FIXO */}
      <header className="bg-red-600 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">Portal do Parceiro</h1>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-red-700 hover:bg-red-800 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
            <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* MENSAGEM TOAST LATERAL */}
      {mensagem && (
        <div className="fixed top-20 right-4 z-50 animate-bounce-subtle">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg font-bold text-sm text-white ${tipoMensagem === 'success' ? 'bg-green-500' : tipoMensagem === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`}>
            {tipoMensagem === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {mensagem}
          </div>
        </div>
      )}

      {/* NAVEGAÇÃO DE ABAS (Mobile e Desktop) */}
      <div className="bg-white border-b sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'pedidos', label: 'Pedidos Ativos', icon: Package },
            { id: 'catalogo', label: 'Meu Catálogo', icon: ShoppingBag },
            { id: 'gerenciar', label: 'Gerenciar Lojas', icon: Store }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 font-bold whitespace-nowrap transition-colors ${isActive ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* COLUNA ESQUERDA: FORMULÁRIOS (Sempre visível no Desktop, ou se Aba Gerenciar no Mobile) */}
          <div className={`lg:col-span-4 space-y-6 ${abaAtiva === 'gerenciar' ? 'block' : 'hidden lg:block'}`}>

            {/* FORMULÁRIO DE LOJA */}
            <div className={`bg-white rounded-2xl p-6 border shadow-sm ${editandoRestId ? 'border-amber-400 ring-4 ring-amber-50' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <Store size={20} className={editandoRestId ? 'text-amber-500' : 'text-gray-400'} />
                  {editandoRestId ? 'Editando Loja' : 'Nova Loja'}
                </h2>
                {editandoRestId && (
                  <button onClick={cancelarEdicaoRest} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
                )}
              </div>

              <form onSubmit={handleSalvarRestaurante} className="space-y-3">
                <input type="text" value={nomeRest} onChange={(e) => setNomeRest(e.target.value)} placeholder="Nome da Loja" required
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all" />
                <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="CNPJ (Ex: 00.000.000/0000-00)" required
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all" />
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                  <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Endereço Completo com Número" required
                    className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all" />
                </div>
                <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl transition-all active:scale-95 ${editandoRestId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-black'}`}>
                  {editandoRestId ? 'Atualizar Loja' : 'Salvar Loja'}
                </button>
              </form>
            </div>

            {/* FORMULÁRIO DE PRODUTO */}
            <div className={`bg-white rounded-2xl p-6 border shadow-sm ${editandoProdId ? 'border-amber-400 ring-4 ring-amber-50' : 'border-gray-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <Package size={20} className={editandoProdId ? 'text-amber-500' : 'text-gray-400'} />
                  {editandoProdId ? 'Editando Produto' : 'Novo Produto'}
                </h2>
                {editandoProdId && (
                  <button onClick={cancelarEdicaoProd} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
                )}
              </div>

              <form onSubmit={handleSalvarProduto} className="space-y-3">
                <select value={restauranteSelecionado} onChange={(e) => setRestauranteSelecionado(e.target.value)} required
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all text-gray-700">
                  <option value="">Vincular à Loja...</option>
                  {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
                <input type="text" value={nomeProd} onChange={(e) => setNomeProd(e.target.value)} placeholder="Ex: Hambúrguer Duplo" required
                  className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all" />
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500 font-bold">R$</span>
                  <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0.00" required
                    className="w-full bg-gray-50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all" />
                </div>
                <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl transition-all active:scale-95 ${editandoProdId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-black'}`}>
                  {editandoProdId ? 'Atualizar Produto' : 'Adicionar Produto'}
                </button>
              </form>
            </div>
          </div>

          {/* COLUNA DIREITA: CONTEÚDO (Pedidos ou Catálogo) */}
          <div className="lg:col-span-8">

            {/* VIZUALIZAÇÃO: PEDIDOS */}
            {abaAtiva === 'pedidos' && (
              <div className="space-y-4">
                {pedidos.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center text-gray-400">
                    <Clock size={48} className="mb-4 opacity-50" />
                    <p className="font-medium text-lg">Nenhum pedido no momento.</p>
                  </div>
                ) : (
                  pedidos.map(ped => {
                    const loja = restaurantes.find(r => r.id === ped.restaurante_id);
                    return (
                      <div key={ped.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-4 border-b border-gray-50">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border ${getStatusBadge(ped.status)}`}>
                                {ped.status}
                              </span>
                              <span className="text-sm font-bold text-gray-400">#{ped.id.toString().slice(0, 6)}</span>
                            </div>
                            <h3 className="font-black text-lg text-gray-800">{ped.cliente_nome}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={12} /> {loja?.nome || 'Loja Excluída'}</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">{ped.tipo_entrega} • {ped.forma_pagamento}</p>
                            <p className="text-2xl font-black text-green-600">R$ {ped.total?.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Ações Rápidas do Pedido */}
                        <div className="flex flex-wrap gap-2">
                          {ped.status === 'Aguardando' && (
                            <button onClick={() => handleAtualizarStatus(ped.id, 'Em Preparação')} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all">
                              Aceitar e Preparar
                            </button>
                          )}
                          {ped.status === 'Em Preparação' && (
                            <button onClick={() => handleAtualizarStatus(ped.id, 'Em Trânsito')} className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all">
                              Despachar Pedido
                            </button>
                          )}
                          {ped.status === 'Em Trânsito' && (
                            <button onClick={() => handleAtualizarStatus(ped.id, 'Entregue')} className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all">
                              Confirmar Entrega
                            </button>
                          )}
                          {(ped.status !== 'Entregue' && ped.status !== 'Cancelado') && (
                            <button onClick={() => { if (window.confirm('Cancelar este pedido?')) handleAtualizarStatus(ped.id, 'Cancelado') }} className="flex-1 sm:flex-none bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold py-2 px-6 rounded-xl active:scale-95 transition-all">
                              Cancelar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* VIZUALIZAÇÃO: CATÁLOGO */}
            {abaAtiva === 'catalogo' && (
              <div className="space-y-6">
                {restaurantes.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 font-medium">Cadastre uma loja primeiro.</p>
                ) : (
                  restaurantes.map(rest => {
                    const produtosDaLoja = produtos.filter(p => p.restaurante_id === rest.id);
                    return (
                      <div key={rest.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50 p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <h3 className="font-black text-xl text-gray-800">{rest.nome}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} /> {rest.endereco}</p>
                            <p className="text-xs text-gray-400 mt-1">CNPJ: {rest.cnpj}</p>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => prepararEdicaoRestaurante(rest)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold text-sm transition-colors">
                              <Edit2 size={16} /> Editar
                            </button>
                            <button onClick={() => handleExcluirRestaurante(rest.id, rest.nome)} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-5">
                          {produtosDaLoja.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Nenhum produto cadastrado nesta loja.</p>
                          ) : (
                            <div className="divide-y divide-gray-50">
                              {produtosDaLoja.map(prod => (
                                <div key={prod.id} className="py-3 flex justify-between items-center group">
                                  <div>
                                    <p className="font-bold text-gray-800">{prod.nome}</p>
                                    <p className="text-green-600 font-black text-sm">R$ {Number(prod.preco).toFixed(2)}</p>
                                  </div>
                                  <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => prepararEdicaoProduto(prod)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                      <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleExcluirProduto(prod.id, prod.nome)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;