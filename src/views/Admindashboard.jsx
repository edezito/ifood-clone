import React, { useState, useEffect } from 'react';
import { supabase } from '../services/Supabaseclient';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Store, ShoppingBag, Package, MapPin, Edit2, Trash2,
  CheckCircle, Clock, X, PlusCircle, AlertCircle, LogOut, Mail
} from 'lucide-react';
import NotificacaoService from '../services/Notificacaoservice';
import { StatusModel } from '../models/statusModel';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CATEGORIAS_PRODUTO = [
  { value: 'pizza', label: '🍕 Pizza' },
  { value: 'lanches', label: '🍔 Lanches' },
  { value: 'japonesa', label: '🍣 Japonesa' },
  { value: 'brasileira', label: '🍖 Brasileira' },
  { value: 'massas', label: '🍝 Massas' },
  { value: 'saudavel', label: '🥗 Saudável' },
  { value: 'bebidas', label: '🥤 Bebidas' },
  { value: 'sobremesas', label: '🍰 Sobremesas' },
  { value: 'outros', label: '🍽️ Outros' },
];

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
    <div className="rounded-xl overflow-hidden border border-gray-200">
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

  const [nomeRest, setNomeRest] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [nomeProd, setNomeProd] = useState('');
  const [preco, setPreco] = useState('');
  const [categoriaProd, setCategoriaProd] = useState('');
  const [restauranteSelecionado, setRestauranteSelecionado] = useState('');

  const [editandoRestId, setEditandoRestId] = useState(null);
  const [editandoProdId, setEditandoProdId] = useState(null);
  const [buscandoCoordenadas, setBuscandoCoordenadas] = useState(false);
  const [enviandoPin, setEnviandoPin] = useState(null);

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
        return {
          lat: parseFloat(data[0].lat).toFixed(6),
          lng: parseFloat(data[0].lon).toFixed(6),
        };
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
    if (!endereco) { mostrarMensagem('Digite um endereço primeiro', 'error'); return; }
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

  // --- RESTAURANTE ---
  const handleSalvarRestaurante = async (e) => {
    e.preventDefault();
    if (!endereco) { mostrarMensagem('Digite o endereço completo', 'error'); return; }

    let lat = latitude;
    let lng = longitude;

    if (!lat || !lng) {
      mostrarMensagem('Buscando coordenadas...', 'info');
      const coordenadas = await obterCoordenadas(endereco);
      if (coordenadas) { lat = coordenadas.lat; lng = coordenadas.lng; }
      else return mostrarMensagem('Não foi possível localizar o endereço. Verifique e tente novamente.', 'error');
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
    setNomeRest(''); setCnpj(''); setEndereco('');
    setLatitude(''); setLongitude(''); setEditandoRestId(null);
  };

  // --- PRODUTO (com categoria) ---
  const handleSalvarProduto = async (e) => {
    e.preventDefault();
    if (!restauranteSelecionado) return mostrarMensagem('Selecione uma loja para vincular o produto.', 'error');
    if (!categoriaProd) return mostrarMensagem('Selecione a categoria do produto.', 'error');

    try {
      const payload = {
        nome: nomeProd,
        preco: parseFloat(preco.replace(',', '.')),
        restaurante_id: restauranteSelecionado,
        categoria: categoriaProd,
      };

      if (editandoProdId) {
        const { data, error } = await supabase.from('produtos').update(payload).eq('id', editandoProdId).select();
        if (error) throw error;
        setProdutos(produtos.map(p => p.id === editandoProdId ? data[0] : p));
        mostrarMensagem('Produto atualizado com sucesso!', 'success');
      } else {
        const { data, error } = await supabase.from('produtos').insert([{ ...payload, disponivel: true }]).select();
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
    setCategoriaProd(prod.categoria || '');
    setEditandoProdId(prod.id);
    setAbaAtiva('catalogo');
    setShowFormulario(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicaoProd = () => {
    setNomeProd(''); setPreco(''); setRestauranteSelecionado('');
    setCategoriaProd(''); setEditandoProdId(null);
    setShowFormulario(false);
  };

  // --- PEDIDO ---
  const handleAtualizarStatus = async (pedidoId, novoStatus) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', pedidoId)
        .select()
        .single();
      if (error) throw error;

      setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
      mostrarMensagem(`Pedido atualizado para: ${novoStatus}`, 'success');

      // Envia PIN por e-mail quando despachar
      if (novoStatus === 'Em Trânsito') {
        await NotificacaoService.notificarMudancaStatus(pedidoId, null, novoStatus, data);
      } else {
        await NotificacaoService.notificarMudancaStatus(pedidoId, null, novoStatus);
      }
    } catch (error) {
      mostrarMensagem(`Erro ao atualizar: ${error.message}`, 'error');
    }
  };

  const handleEnviarPinManual = async (ped) => {
    if (!ped.email) {
      mostrarMensagem('Este pedido não possui e-mail cadastrado.', 'error');
      return;
    }
    setEnviandoPin(ped.id);
    try {
      await NotificacaoService.enviarPinPorEmail(ped);
      mostrarMensagem(`PIN enviado para ${ped.email}`, 'success');
    } catch {
      mostrarMensagem('Erro ao reenviar PIN.', 'error');
    } finally {
      setEnviandoPin(null);
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

  const getLabelCategoria = (value) => {
    const cat = CATEGORIAS_PRODUTO.find(c => c.value === value);
    return cat ? cat.label : value || '—';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20 lg:pb-0">

      {/* HEADER */}
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

      {/* TOAST */}
      {mensagem && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg font-bold text-sm text-white ${
            tipoMensagem === 'success' ? 'bg-green-500' :
            tipoMensagem === 'error' ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            {tipoMensagem === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {mensagem}
          </div>
        </div>
      )}

      {/* ABAS */}
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
                onClick={() => { setAbaAtiva(tab.id); setShowFormulario(false); cancelarEdicaoRest(); }}
                className={`flex items-center gap-2 py-4 border-b-2 font-bold whitespace-nowrap transition-colors ${
                  isActive ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={18} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">

       {/* ABA: PEDIDOS */}
        {abaAtiva === 'pedidos' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-800">Pedidos em andamento</h2>
            {pedidos.filter(p => StatusModel.normalizar(p.status) !== 'Entregue' && StatusModel.normalizar(p.status) !== 'Cancelado').length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center text-gray-400">
                <Clock size={48} className="mb-4 opacity-50" />
                <p className="font-medium text-lg">Nenhum pedido ativo no momento.</p>
              </div>
            ) : (
              pedidos.filter(p => StatusModel.normalizar(p.status) !== 'Entregue' && StatusModel.normalizar(p.status) !== 'Cancelado').map(ped => {
                const loja = restaurantes.find(r => r.id === ped.restaurante_id);
                
                // Normaliza o status do pedido atual para garantir que os botões funcionem
                const statusNormalizado = StatusModel.normalizar(ped.status);

                return (
                  <div key={ped.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-4 border-b border-gray-50">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border ${getStatusBadge(statusNormalizado)}`}>
                            {statusNormalizado}
                          </span>
                          <span className="text-sm font-bold text-gray-400">#{ped.id.toString().slice(0, 8)}</span>
                        </div>
                        <h3 className="font-black text-lg text-gray-800">{ped.cliente_nome}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin size={12} /> {loja?.nome || 'Loja Excluída'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Entrega: {ped.endereco}</p>
                        {ped.email && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Mail size={10} /> {ped.email}
                          </p>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">
                          {ped.tipo_entrega} • {ped.forma_pagamento}
                        </p>
                        <p className="text-2xl font-black text-green-600">R$ {ped.total?.toFixed(2)}</p>
                        {ped.pin_entrega && (
                          <p className="text-xs text-gray-400 mt-1 font-mono font-bold tracking-widest">
                            PIN: {ped.pin_entrega}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {statusNormalizado === 'Aguardando' && (
                        <button onClick={() => handleAtualizarStatus(ped.id, 'Em Preparação')}
                          className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all">
                          Aceitar e Preparar
                        </button>
                      )}
                      {statusNormalizado === 'Em Preparação' && (
                        <button onClick={() => handleAtualizarStatus(ped.id, 'Em Trânsito')}
                          className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all">
                          Despachar Pedido
                        </button>
                      )}
                      {statusNormalizado === 'Em Trânsito' && (
                        <>
                          <button onClick={() => handleAtualizarStatus(ped.id, 'Entregue')}
                            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-xl active:scale-95 transition-all">
                            Confirmar Entrega
                          </button>
                          {ped.email && (
                            <button
                              onClick={() => handleEnviarPinManual(ped)}
                              disabled={enviandoPin === ped.id}
                              className="flex items-center gap-1.5 bg-white border-2 border-purple-200 text-purple-700 hover:bg-purple-50 font-bold py-2 px-4 rounded-xl active:scale-95 transition-all disabled:opacity-50"
                              title="Reenviar PIN por e-mail"
                            >
                              <Mail size={15} />
                              {enviandoPin === ped.id ? 'Enviando...' : 'Reenviar PIN'}
                            </button>
                          )}
                        </>
                      )}
                      {(statusNormalizado !== 'Entregue' && statusNormalizado !== 'Cancelado') && (
                        <button onClick={() => { if (window.confirm('Cancelar este pedido?')) handleAtualizarStatus(ped.id, 'Cancelado'); }}
                          className="flex-1 sm:flex-none bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold py-2 px-6 rounded-xl active:scale-95 transition-all">
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

        {/* ABA: CATÁLOGO */}
        {abaAtiva === 'catalogo' && (
          <div className="space-y-6">

            {/* Botão Novo Produto */}
            {!showFormulario && !editandoProdId && (
              <div className="flex justify-end">
                <button
                  onClick={() => { cancelarEdicaoProd(); setShowFormulario(true); }}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-colors"
                >
                  <PlusCircle size={18} /> Novo Produto
                </button>
              </div>
            )}

            {/* Formulário de Produto */}
            {(editandoProdId || showFormulario) && (
              <div className="bg-white rounded-2xl p-6 border border-amber-400 shadow-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Package size={20} className="text-amber-500" />
                    {editandoProdId ? 'Editando Produto' : 'Novo Produto'}
                  </h2>
                  <button onClick={cancelarEdicaoProd} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSalvarProduto} className="space-y-3">
                  <select
                    value={restauranteSelecionado}
                    onChange={(e) => setRestauranteSelecionado(e.target.value)}
                    required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500">
                    <option value="">Selecione a loja...</option>
                    {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>

                  <input
                    type="text"
                    value={nomeProd}
                    onChange={(e) => setNomeProd(e.target.value)}
                    placeholder="Nome do produto"
                    required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                  />

                  {/* Seletor de Categoria */}
                  <select
                    value={categoriaProd}
                    onChange={(e) => setCategoriaProd(e.target.value)}
                    required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500">
                    <option value="">Selecione a categoria...</option>
                    {CATEGORIAS_PRODUTO.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>

                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full bg-gray-50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                    />
                  </div>

                  <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all active:scale-95">
                    {editandoProdId ? 'Atualizar Produto' : 'Adicionar Produto'}
                  </button>
                </form>
              </div>
            )}

            {/* Lista de Restaurantes com Produtos */}
            {restaurantes.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
                <Store size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma loja cadastrada.</p>
              </div>
            ) : (
              restaurantes.map(rest => {
                const produtosDaLoja = produtos.filter(p => p.restaurante_id === rest.id);
                return (
                  <div key={rest.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 p-5 border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-xl text-gray-800">{rest.nome}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin size={14} /> {rest.endereco}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowFormulario(true);
                            setRestauranteSelecionado(rest.id);
                            cancelarEdicaoProd();
                            setShowFormulario(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                        >
                          <PlusCircle size={16} /> Adicionar
                        </button>
                      </div>
                    </div>

                    <div className="p-5">
                      {produtosDaLoja.length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-4">Nenhum produto cadastrado.</p>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {produtosDaLoja.map(prod => (
                            <div key={prod.id} className="py-3 flex justify-between items-center group">
                              <div>
                                <p className="font-bold text-gray-800">{prod.nome}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-green-600 font-black text-sm">R$ {Number(prod.preco).toFixed(2)}</p>
                                  {prod.categoria && (
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                                      {getLabelCategoria(prod.categoria)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => prepararEdicaoProduto(prod)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleExcluirProduto(prod.id, prod.nome)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
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

        {/* ABA: GERENCIAR LOJAS */}
        {abaAtiva === 'gerenciar' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => { cancelarEdicaoRest(); setShowFormulario(true); }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-colors"
              >
                <PlusCircle size={18} /> Nova Loja
              </button>
            </div>

            {(editandoRestId || showFormulario) && (
              <div className="bg-white rounded-2xl p-6 border border-amber-400 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Store size={20} className="text-amber-500" />
                    {editandoRestId ? 'Editando Loja' : 'Nova Loja'}
                  </h2>
                  <button onClick={() => { cancelarEdicaoRest(); setShowFormulario(false); }} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSalvarRestaurante} className="space-y-3">
                  <input
                    type="text" value={nomeRest} onChange={(e) => setNomeRest(e.target.value)}
                    placeholder="Nome da Loja" required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                  />
                  <input
                    type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                    placeholder="CNPJ" required
                    className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                  />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                      <input
                        type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Endereço completo (Rua, número, bairro, cidade)" required
                        className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500"
                      />
                    </div>
                    <button type="button" onClick={buscarCoordenadas} disabled={buscandoCoordenadas}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors whitespace-nowrap disabled:opacity-50">
                      {buscandoCoordenadas ? 'Buscando...' : 'Buscar Mapa'}
                    </button>
                  </div>
                  {(latitude && longitude) && (
                    <div className="bg-green-50 p-3 rounded-xl text-sm text-green-700">
                      📍 Coordenadas: {latitude}, {longitude}
                    </div>
                  )}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visualização no mapa:</label>
                    <MapaLocalizacao latitude={latitude} longitude={longitude} endereco={endereco} nome={nomeRest || 'Nova Loja'} />
                  </div>
                  <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl transition-all active:scale-95 ${
                    editandoRestId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-black'
                  }`}>
                    {editandoRestId ? 'Atualizar Loja' : 'Salvar Loja'}
                  </button>
                </form>
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-lg font-black text-gray-800">Minhas Lojas</h2>
              {restaurantes.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-100">
                  <Store size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma loja cadastrada.</p>
                </div>
              ) : (
                restaurantes.map(rest => (
                  <div key={rest.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-black text-lg text-gray-800">{rest.nome}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={14} /> {rest.endereco}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">CNPJ: {rest.cnpj}</p>
                        {rest.latitude && (
                          <p className="text-xs text-gray-400 mt-1">📍 {rest.latitude}, {rest.longitude}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => prepararEdicaoRestaurante(rest)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-bold text-sm transition-colors">
                          <Edit2 size={16} /> Editar
                        </button>
                        <button onClick={() => handleExcluirRestaurante(rest.id, rest.nome)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-sm transition-colors">
                          <Trash2 size={16} /> Excluir
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <MapaLocalizacao latitude={rest.latitude} longitude={rest.longitude} endereco={rest.endereco} nome={rest.nome} />
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs">
                      <span className="text-gray-500">📦 {produtos.filter(p => p.restaurante_id === rest.id).length} produtos</span>
                      <span className="text-gray-500">🛒 {pedidos.filter(p => p.restaurante_id === rest.id && p.status !== 'Entregue').length} pedidos ativos</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;