import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Store, ShoppingBag, Package, MapPin, Edit2, Trash2,
  CheckCircle, Clock, X, PlusCircle, AlertCircle, LogOut, Search
} from 'lucide-react';

// Correção do ícone padrão do Leaflet no React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente de Mapa
const MapaLocalizacao = ({ latitude, longitude, endereco, nome }) => {
  if (!latitude || !longitude) {
    return (
      <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-500 text-sm">
        <MapPin size={20} className="mx-auto mb-2 text-gray-400" />
        Localização não disponível
        <p className="text-xs mt-1">Atualize o endereço para gerar as coordenadas</p>
      </div>
    );
  }

  const position = [parseFloat(latitude), parseFloat(longitude)];

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 z-0">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '200px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <strong>{nome}</strong><br />
              {endereco}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

function AdminDashboard({ onLogout }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('info');
  const [abaAtiva, setAbaAtiva] = useState('pedidos');
  const [showFormulario, setShowFormulario] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [nomeRest, setNomeRest] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [nomeProd, setNomeProd] = useState('');
  const [preco, setPreco] = useState('');
  const [restauranteSelecionado, setRestauranteSelecionado] = useState('');
  const [editandoRestId, setEditandoRestId] = useState(null);
  const [editandoProdId, setEditandoProdId] = useState(null);
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);

  useEffect(() => {
    fetchDados();
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

    const { data: peds } = await supabase.from('pedidos').select('*').order('criado_em', { ascending: false });
    if (peds) setPedidos(peds);
  };

  const obterCoordenadas = async (enderecoDigitado) => {
    setBuscandoCoordenadas(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoDigitado)}&limit=1&countrycodes=BR`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lng = parseFloat(data[0].lon).toFixed(6);
        return { lat, lng };
      }
      return null;
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error);
      return null;
    } finally {
      setBuscandoCoordenadas(false);
    }
  };

  const buscarCoordenadas = async () => {
    if (!endereco) {
      mostrarMensagem('Digite um endereço primeiro', 'error');
      return;
    }
    
    mostrarMensagem('Buscando coordenadas...', 'info');
    const coordenadas = await obterCoordenadas(endereco);
    
    if (coordenadas) {
      setLatitude(coordenadas.lat);
      setLongitude(coordenadas.lng);
      mostrarMensagem(`Coordenadas encontradas: ${coordenadas.lat}, ${coordenadas.lng}`, 'success');
    } else {
      setLatitude('');
      setLongitude('');
      mostrarMensagem('Endereço não encontrado. Tente ser mais específico.', 'error');
    }
  };

  const handleSalvarRestaurante = async (e) => {
    e.preventDefault();
    
    if (!endereco) {
      mostrarMensagem('Digite o endereço completo', 'error');
      return;
    }
    
    let lat = latitude;
    let lng = longitude;
    
    if (!lat || !lng) {
      mostrarMensagem('Buscando coordenadas...', 'info');
      const coordenadas = await obterCoordenadas(endereco);
      if (coordenadas) {
        lat = coordenadas.lat;
        lng = coordenadas.lng;
      } else {
        return mostrarMensagem('Não foi possível localizar o endereço. Verifique e tente novamente.', 'error');
      }
    }

    try {
      if (editandoRestId) {
        const { data, error } = await supabase
          .from('restaurantes')
          .update({ nome: nomeRest, cnpj, endereco, latitude: lat, longitude: lng })
          .eq('id', editandoRestId)
          .select();
        if (error) throw error;
        setRestaurantes(restaurantes.map(r => r.id === editandoRestId ? data[0] : r));
        mostrarMensagem('Loja atualizada com sucesso!', 'success');
      } else {
        const { data, error } = await supabase
          .from('restaurantes')
          .insert([{ nome: nomeRest, cnpj, endereco, latitude: lat, longitude: lng }])
          .select();
        if (error) throw error;
        setRestaurantes([...restaurantes, data[0]]);
        mostrarMensagem('Loja cadastrada com sucesso!', 'success');
      }
      cancelarEdicaoRest();
      setShowFormulario(false);
    } catch (error) {
      mostrarMensagem(`Erro: ${error.message}`, 'error');
    }
  };

  const handleExcluirRestaurante = async (id, nome) => {
    if (!window.confirm(`ATENÇÃO: Deseja excluir "${nome}" e TODOS os produtos vinculados?\n\nEsta ação não pode ser desfeita!`)) return;
    try {
      const { error } = await supabase.from('restaurantes').delete().eq('id', id);
      if (error) throw error;
      setRestaurantes(restaurantes.filter(r => r.id !== id));
      setProdutos(produtos.filter(p => p.restaurante_id !== id));
      mostrarMensagem('Loja excluída com sucesso!', 'success');
    } catch (error) {
      mostrarMensagem(`Erro ao excluir: ${error.message}`, 'error');
    }
  };

  const prepararEdicaoRestaurante = (rest) => {
    setNomeRest(rest.nome);
    setCnpj(rest.cnpj);
    setEndereco(rest.endereco);
    setLatitude(rest.latitude || '');
    setLongitude(rest.longitude || '');
    setEditandoRestId(rest.id);
    setShowFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicaoRest = () => {
    setNomeRest('');
    setCnpj('');
    setEndereco('');
    setLatitude('');
    setLongitude('');
    setEditandoRestId(null);
  };

  const handleSalvarProduto = async (e) => {
    e.preventDefault();
    if (!restauranteSelecionado) {
      return mostrarMensagem('Selecione uma loja para vincular o produto.', 'error');
    }

    try {
      if (editandoProdId) {
        const { data, error } = await supabase
          .from('produtos')
          .update({ nome: nomeProd, preco: parseFloat(preco.replace(',', '.')), restaurante_id: restauranteSelecionado })
          .eq('id', editandoProdId)
          .select();
        if (error) throw error;
        setProdutos(produtos.map(p => p.id === editandoProdId ? data[0] : p));
        mostrarMensagem('Produto atualizado com sucesso!', 'success');
      } else {
        const { data, error } = await supabase
          .from('produtos')
          .insert([{ nome: nomeProd, preco: parseFloat(preco.replace(',', '.')), restaurante_id: restauranteSelecionado, disponivel: true }])
          .select();
        if (error) throw error;
        setProdutos([...produtos, data[0]]);
        mostrarMensagem('Produto adicionado com sucesso!', 'success');
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
      mostrarMensagem('Produto removido com sucesso!', 'success');
    } catch (error) {
      mostrarMensagem(`Erro ao remover: ${error.message}`, 'error');
    }
  };

  const prepararEdicaoProduto = (prod) => {
    setNomeProd(prod.nome);
    setPreco(prod.preco.toString());
    setRestauranteSelecionado(prod.restaurante_id);
    setEditandoProdId(prod.id);
    setAbaAtiva('catalogo');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicaoProd = () => {
    setNomeProd('');
    setPreco('');
    setRestauranteSelecionado('');
    setEditandoProdId(null);
  };

  const handleAtualizarStatus = async (pedidoId, novoStatus) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId);
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
      'Em Preparação': 'bg-blue-100 text-blue-800 border-blue-200',
      'Em Trânsito': 'bg-purple-100 text-purple-800 border-purple-200',
      'Entregue': 'bg-green-100 text-green-800 border-green-200',
      'Cancelado': 'bg-red-100 text-red-800 border-red-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const pedidosFiltrados = pedidos.filter(p => {
    if (abaAtiva === 'pedidos') {
      return p.status !== 'Entregue' && p.status !== 'Cancelado';
    }
    return true;
  });

  const restaurantesFiltrados = restaurantes.filter(rest =>
    rest.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rest.cnpj.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight">FoodExpress Partner</h1>
          </div>
          <button 
            onClick={onLogout} 
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold transition-all backdrop-blur-sm"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </header>

      {/* Toast Message */}
      {mensagem && (
        <div className="fixed top-20 right-4 z-50 animate-bounce-subtle">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg font-bold text-sm text-white backdrop-blur-md ${
            tipoMensagem === 'success' ? 'bg-green-500/90' : 
            tipoMensagem === 'error' ? 'bg-red-500/90' : 'bg-blue-500/90'
          }`}>
            {tipoMensagem === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {mensagem}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-[73px] z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {[
              { id: 'pedidos', label: 'Pedidos Ativos', icon: Package, count: pedidos.filter(p => p.status !== 'Entregue' && p.status !== 'Cancelado').length },
              { id: 'catalogo', label: 'Meu Catálogo', icon: ShoppingBag },
              { id: 'gerenciar', label: 'Gerenciar Lojas', icon: Store }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = abaAtiva === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setAbaAtiva(tab.id);
                    setShowFormulario(false);
                    cancelarEdicaoRest();
                  }}
                  className={`flex items-center gap-2 py-4 px-4 border-b-2 font-bold whitespace-nowrap transition-all ${
                    isActive ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} /> {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Pedidos Section */}
        {abaAtiva === 'pedidos' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800">Pedidos em andamento</h2>
              <div className="text-sm text-gray-500">
                Total: {pedidosFiltrados.length} pedido(s)
              </div>
            </div>
            
            {pedidosFiltrados.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-400 shadow-sm">
                <Clock size={64} className="mb-4 opacity-50" />
                <p className="font-medium text-lg">Nenhum pedido ativo no momento.</p>
                <p className="text-sm mt-1">Aguardando novos pedidos dos clientes</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pedidosFiltrados.map(ped => {
                  const loja = restaurantes.find(r => r.id === ped.restaurante_id);
                  return (
                    <div key={ped.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadge(ped.status)}`}>
                              {ped.status}
                            </span>
                            <span className="text-sm font-mono text-gray-400">#{ped.id.toString().slice(0, 8)}</span>
                          </div>
                          <h3 className="font-black text-xl text-gray-800">{ped.cliente_nome}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin size={14} /> {loja?.nome || 'Loja Excluída'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <span>📍 {ped.endereco}</span>
                          </p>
                        </div>
                        <div className="text-left lg:text-right">
                          <p className="text-xs text-gray-400 uppercase font-bold mb-1">
                            {ped.tipo_entrega} • {ped.forma_pagamento}
                          </p>
                          <p className="text-3xl font-black text-green-600">R$ {ped.total?.toFixed(2)}</p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">
                            PIN: {ped.pin_entrega}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {ped.status === 'Aguardando' && (
                          <button onClick={() => handleAtualizarStatus(ped.id, 'Em Preparação')} 
                            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95">
                            Aceitar e Preparar
                          </button>
                        )}
                        {ped.status === 'Em Preparação' && (
                          <button onClick={() => handleAtualizarStatus(ped.id, 'Em Trânsito')} 
                            className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95">
                            Despachar Pedido
                          </button>
                        )}
                        {ped.status === 'Em Trânsito' && (
                          <button onClick={() => handleAtualizarStatus(ped.id, 'Entregue')} 
                            className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95">
                            Confirmar Entrega
                          </button>
                        )}
                        {(ped.status !== 'Entregue' && ped.status !== 'Cancelado') && (
                          <button onClick={() => { if (window.confirm('Cancelar este pedido?')) handleAtualizarStatus(ped.id, 'Cancelado'); }} 
                            className="flex-1 sm:flex-none bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold py-2.5 px-6 rounded-xl transition-all">
                            Cancelar Pedido
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Catálogo Section */}
        {abaAtiva === 'catalogo' && (
          <div className="space-y-6">
            {/* Formulário de Produto */}
            {(editandoProdId || showFormulario) && (
              <div className="bg-white rounded-2xl p-6 border-2 border-amber-400 shadow-lg mb-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Package size={20} className="text-amber-500" />
                    {editandoProdId ? '✏️ Editando Produto' : '✨ Novo Produto'}
                  </h2>
                  <button onClick={() => { cancelarEdicaoProd(); setShowFormulario(false); }} 
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSalvarProduto} className="space-y-3">
                  <select 
                    value={restauranteSelecionado} 
                    onChange={(e) => setRestauranteSelecionado(e.target.value)} 
                    required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all">
                    <option value="">🏪 Selecione a loja...</option>
                    {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                  <input 
                    type="text" 
                    value={nomeProd} 
                    onChange={(e) => setNomeProd(e.target.value)} 
                    placeholder="🍽️ Nome do produto" 
                    required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all" 
                  />
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-500 font-bold">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={preco} 
                      onChange={(e) => setPreco(e.target.value)} 
                      placeholder="0.00" 
                      required
                      className="w-full bg-gray-50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all" 
                    />
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95">
                    {editandoProdId ? '💾 Atualizar Produto' : '➕ Adicionar Produto'}
                  </button>
                </form>
              </div>
            )}

            {/* Lista de Restaurantes com Produtos */}
            {restaurantes.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center text-gray-400 shadow-sm">
                <Store size={64} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma loja cadastrada.</p>
                <p className="text-sm mt-1">Vá para "Gerenciar Lojas" para começar.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {restaurantes.map(rest => {
                  const produtosDaLoja = produtos.filter(p => p.restaurante_id === rest.id);
                  return (
                    <div key={rest.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div>
                            <h3 className="font-black text-2xl text-gray-800">{rest.nome}</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                              <MapPin size={14} /> {rest.endereco}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setShowFormulario(true);
                              setRestauranteSelecionado(rest.id);
                              cancelarEdicaoProd();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl text-sm font-bold hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-[1.02] active:scale-95">
                            <PlusCircle size={18} /> Adicionar Produto
                          </button>
                        </div>
                      </div>

                      <div className="p-6">
                        {produtosDaLoja.length === 0 ? (
                          <div className="text-center py-8">
                            <Package size={48} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm text-gray-400">Nenhum produto cadastrado nesta loja.</p>
                            <button 
                              onClick={() => {
                                setShowFormulario(true);
                                setRestauranteSelecionado(rest.id);
                                cancelarEdicaoProd();
                              }}
                              className="mt-3 text-red-600 text-sm font-bold hover:text-red-700">
                              + Adicionar primeiro produto
                            </button>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {produtosDaLoja.map(prod => (
                              <div key={prod.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="flex-1">
                                  <p className="font-bold text-gray-800">{prod.nome}</p>
                                  <p className="text-green-600 font-black text-sm mt-1">R$ {Number(prod.preco).toFixed(2)}</p>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => prepararEdicaoProduto(prod)} 
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar">
                                    <Edit2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleExcluirProduto(prod.id, prod.nome)} 
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir">
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
                })}
              </div>
            )}
          </div>
        )}

        {/* Gerenciar Lojas Section */}
        {abaAtiva === 'gerenciar' && (
          <div className="space-y-6">
            {/* Header com busca */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl font-black text-gray-800">Minhas Lojas</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar loja..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                  />
                </div>
                <button 
                  onClick={() => {
                    cancelarEdicaoRest();
                    setShowFormulario(true);
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-5 py-2 rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95">
                  <PlusCircle size={18} /> Nova Loja
                </button>
              </div>
            </div>

            {/* Formulário de Loja */}
            {(editandoRestId || showFormulario) && (
              <div className="bg-white rounded-2xl p-6 border-2 border-amber-400 shadow-lg mb-6 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Store size={20} className="text-amber-500" />
                    {editandoRestId ? '✏️ Editando Loja' : '🏪 Nova Loja'}
                  </h2>
                  <button onClick={() => { cancelarEdicaoRest(); setShowFormulario(false); }} 
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSalvarRestaurante} className="space-y-3">
                  <input 
                    type="text" 
                    value={nomeRest} 
                    onChange={(e) => setNomeRest(e.target.value)} 
                    placeholder="Nome da Loja" 
                    required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" 
                  />
                  <input 
                    type="text" 
                    value={cnpj} 
                    onChange={(e) => setCnpj(e.target.value)} 
                    placeholder="CNPJ" 
                    required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" 
                  />
                  
                  {/* Container de Endereço + Botão de Mapa */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        value={endereco} 
                        onChange={(e) => setEndereco(e.target.value)} 
                        placeholder="Endereço completo (Rua, número, bairro, cidade)" 
                        required
                        className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500 transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={buscarCoordenadas}
                      disabled={buscandoCoordenadas}
                      className="bg-gray-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-gray-900 disabled:opacity-50 transition-all whitespace-nowrap"
                    >
                      {buscandoCoordenadas ? 'Buscando...' : '📍 Buscar Mapa'}
                    </button>
                  </div>

                  {/* Coordenadas visuais de status */}
                  {(latitude || longitude) && (
                    <div className="flex gap-4 text-xs font-mono text-gray-500 bg-gray-100 p-3 rounded-lg border border-gray-200">
                      <span><strong>Lat:</strong> {latitude}</span>
                      <span><strong>Lng:</strong> {longitude}</span>
                    </div>
                  )}

                  <button type="submit" className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white font-bold py-3 mt-2 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95">
                    {editandoRestId ? '💾 Atualizar Loja' : '➕ Adicionar Loja'}
                  </button>
                </form>
              </div>
            )}

            {/* Grid Listando as Lojas Gerenciadas */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurantesFiltrados.map(rest => (
                <div key={rest.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
                  <div className="p-5 flex-1 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-black text-xl text-gray-800 line-clamp-1">{rest.nome}</h3>
                        <p className="text-xs text-gray-500 font-mono mt-1">CNPJ: {rest.cnpj}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => prepararEdicaoRestaurante(rest)} 
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleExcluirRestaurante(rest.id, rest.nome)} 
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 flex items-start gap-2 line-clamp-2">
                      <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      {rest.endereco}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3">
                    <MapaLocalizacao 
                      latitude={rest.latitude} 
                      longitude={rest.longitude} 
                      endereco={rest.endereco} 
                      nome={rest.nome} 
                    />
                  </div>
                </div>
              ))}

              {/* Empty State se não houver lojas */}
              {restaurantesFiltrados.length === 0 && (
                <div className="col-span-full bg-white rounded-3xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
                  <Store size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-medium text-lg text-gray-600">Nenhuma loja encontrada.</p>
                  <p className="text-sm mt-1">Clique em "Nova Loja" para adicionar.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;