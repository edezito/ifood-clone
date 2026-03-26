// ============================================================
// VIEW: AdminDashboard
// Responsabilidade: renderização do painel administrativo.
// Toda a lógica foi movida para useAdminController.
// ============================================================
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Store, ShoppingBag, Package, MapPin, Edit2, Trash2,
  CheckCircle, Clock, X, PlusCircle, AlertCircle, LogOut,
} from 'lucide-react';
import { useAdminController } from '../controllers/useAdminController';

// Corrige ícone padrão do Leaflet no React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ---- Sub-componente: Mapa ----
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
      <MapContainer center={position} zoom={15} style={{ height: '200px', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup><div className="text-sm"><strong>{nome}</strong><br />{endereco}</div></Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

// ---- Sub-componente: Badge de status ----
const StatusBadge = ({ status }) => {
  const estilos = {
    Aguardando: 'bg-amber-100 text-amber-800 border-amber-200',
    'Em Preparação': 'bg-blue-100 text-blue-800 border-blue-200',
    'Em Trânsito': 'bg-purple-100 text-purple-800 border-purple-200',
    Entregue: 'bg-green-100 text-green-800 border-green-200',
    Cancelado: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-black tracking-wider border ${estilos[status] ?? 'bg-gray-100 text-gray-800 border-gray-200'}`}>
      {status}
    </span>
  );
};

// ============================================================
// VIEW PRINCIPAL
// ============================================================
function AdminDashboard({ onLogout }) {
  const ctrl = useAdminController();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20 lg:pb-0">

      {/* Header */}
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

      {/* Toast */}
      {ctrl.mensagem && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg font-bold text-sm text-white ${ctrl.tipoMensagem === 'success' ? 'bg-green-500' : ctrl.tipoMensagem === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}>
            {ctrl.tipoMensagem === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {ctrl.mensagem}
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="bg-white border-b sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-4 flex gap-6 overflow-x-auto scrollbar-hide">
          {[
            { id: 'pedidos', label: 'Pedidos Ativos', icon: Package },
            { id: 'catalogo', label: 'Meu Catálogo', icon: ShoppingBag },
            { id: 'gerenciar', label: 'Gerenciar Lojas', icon: Store },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { ctrl.setAbaAtiva(id); ctrl.setShowFormulario(false); ctrl.cancelarEdicaoRest(); }}
              className={`flex items-center gap-2 py-4 border-b-2 font-bold whitespace-nowrap transition-colors ${ctrl.abaAtiva === id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* ========== ABA: PEDIDOS ========== */}
        {ctrl.abaAtiva === 'pedidos' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-800">Pedidos em andamento</h2>
            {ctrl.pedidos.filter(p => p.status !== 'Entregue' && p.status !== 'Cancelado').length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 flex flex-col items-center justify-center text-gray-400">
                <Clock size={48} className="mb-4 opacity-50" />
                <p className="font-medium text-lg">Nenhum pedido ativo no momento.</p>
              </div>
            ) : (
              ctrl.pedidos
                .filter(p => p.status !== 'Entregue' && p.status !== 'Cancelado')
                .map(ped => {
                  const loja = ctrl.restaurantes.find(r => r.id === ped.restaurante_id);
                  return (
                    <div key={ped.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-4 border-b border-gray-50">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={ped.status} />
                            <span className="text-sm font-bold text-gray-400">#{ped.id.toString().slice(0, 8)}</span>
                          </div>
                          <h3 className="font-black text-lg text-gray-800">{ped.cliente_nome}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={12} /> {loja?.nome ?? 'Loja Excluída'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">Entrega: {ped.endereco}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-400 uppercase font-bold mb-1">{ped.tipo_entrega} • {ped.forma_pagamento}</p>
                          <p className="text-2xl font-black text-green-600">R$ {ped.total?.toFixed(2)}</p>
                          <p className="text-xs text-gray-400 mt-1">PIN: {ped.pin_entrega}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {ped.status === 'Aguardando' && (
                          <button onClick={() => ctrl.atualizarStatusPedido(ped.id, 'Em Preparação')} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95">Aceitar e Preparar</button>
                        )}
                        {ped.status === 'Em Preparação' && (
                          <button onClick={() => ctrl.atualizarStatusPedido(ped.id, 'Em Trânsito')} className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95">Despachar Pedido</button>
                        )}
                        {ped.status === 'Em Trânsito' && (
                          <button onClick={() => ctrl.atualizarStatusPedido(ped.id, 'Entregue')} className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95">Confirmar Entrega</button>
                        )}
                        <button onClick={() => { if (window.confirm('Cancelar este pedido?')) ctrl.atualizarStatusPedido(ped.id, 'Cancelado'); }} className="flex-1 sm:flex-none bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold py-2 px-6 rounded-xl transition-all active:scale-95">Cancelar</button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}

        {/* ========== ABA: CATÁLOGO ========== */}
        {ctrl.abaAtiva === 'catalogo' && (
          <div className="space-y-6">
            {(ctrl.editandoProdId || ctrl.showFormulario) && (
              <div className="bg-white rounded-2xl p-6 border border-amber-400 shadow-lg mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Package size={20} className="text-amber-500" />
                    {ctrl.editandoProdId ? 'Editando Produto' : 'Novo Produto'}
                  </h2>
                  <button onClick={() => { ctrl.cancelarEdicaoProd(); ctrl.setShowFormulario(false); }} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
                </div>
                <form onSubmit={ctrl.salvarProduto} className="space-y-3">
                  <select value={ctrl.restauranteSelecionado} onChange={e => ctrl.setRestauranteSelecionado(e.target.value)} required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500">
                    <option value="">Selecione a loja...</option>
                    {ctrl.restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                  <input type="text" value={ctrl.nomeProd} onChange={e => ctrl.setNomeProd(e.target.value)} placeholder="Nome do produto" required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" />
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-500 font-bold">R$</span>
                    <input type="number" step="0.01" value={ctrl.preco} onChange={e => ctrl.setPreco(e.target.value)} placeholder="0.00" required className="w-full bg-gray-50 pl-11 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" />
                  </div>
                  <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all active:scale-95">
                    {ctrl.editandoProdId ? 'Atualizar Produto' : 'Adicionar Produto'}
                  </button>
                </form>
              </div>
            )}

            {ctrl.restaurantes.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
                <Store size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma loja cadastrada.</p>
              </div>
            ) : (
              ctrl.restaurantes.map(rest => {
                const produtosDaLoja = ctrl.produtos.filter(p => p.restaurante_id === rest.id);
                return (
                  <div key={rest.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 p-5 border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-xl text-gray-800">{rest.nome}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} /> {rest.endereco}</p>
                        </div>
                        <button onClick={() => { ctrl.setShowFormulario(true); ctrl.setRestauranteSelecionado(rest.id); ctrl.cancelarEdicaoProd(); }} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
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
                                <p className="text-green-600 font-black text-sm">R$ {Number(prod.preco).toFixed(2)}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => ctrl.prepararEdicaoProduto(prod)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                                <button onClick={() => ctrl.excluirProduto(prod.id, prod.nome)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18} /></button>
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

        {/* ========== ABA: GERENCIAR LOJAS ========== */}
        {ctrl.abaAtiva === 'gerenciar' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => { ctrl.cancelarEdicaoRest(); ctrl.setShowFormulario(true); }} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-colors">
                <PlusCircle size={18} /> Nova Loja
              </button>
            </div>

            {(ctrl.editandoRestId || ctrl.showFormulario) && (
              <div className="bg-white rounded-2xl p-6 border border-amber-400 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <Store size={20} className="text-amber-500" />
                    {ctrl.editandoRestId ? 'Editando Loja' : 'Nova Loja'}
                  </h2>
                  <button onClick={() => { ctrl.cancelarEdicaoRest(); ctrl.setShowFormulario(false); }} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={18} /></button>
                </div>
                <form onSubmit={ctrl.salvarRestaurante} className="space-y-3">
                  <input type="text" value={ctrl.nomeRest} onChange={e => ctrl.setNomeRest(e.target.value)} placeholder="Nome da Loja" required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" />
                  <input type="text" value={ctrl.cnpj} onChange={e => ctrl.setCnpj(e.target.value)} placeholder="CNPJ" required className="w-full bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin size={18} className="absolute left-3 top-3.5 text-gray-400" />
                      <input type="text" value={ctrl.endereco} onChange={e => ctrl.setEndereco(e.target.value)} placeholder="Endereço completo" required className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-500" />
                    </div>
                    <button type="button" onClick={ctrl.buscarCoordenadas} disabled={ctrl.buscandoCoordenadas} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors whitespace-nowrap disabled:opacity-50">
                      {ctrl.buscandoCoordenadas ? 'Buscando...' : 'Buscar Mapa'}
                    </button>
                  </div>
                  {ctrl.latitude && ctrl.longitude && (
                    <div className="bg-green-50 p-3 rounded-xl text-sm text-green-700">📍 Coordenadas: {ctrl.latitude}, {ctrl.longitude}</div>
                  )}
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Visualização no mapa:</label>
                    <MapaLocalizacao latitude={ctrl.latitude} longitude={ctrl.longitude} endereco={ctrl.endereco} nome={ctrl.nomeRest || 'Nova Loja'} />
                  </div>
                  <button type="submit" className={`w-full text-white font-bold py-3 rounded-xl transition-all active:scale-95 ${ctrl.editandoRestId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-gray-900 hover:bg-black'}`}>
                    {ctrl.editandoRestId ? 'Atualizar Loja' : 'Salvar Loja'}
                  </button>
                </form>
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-lg font-black text-gray-800">Minhas Lojas</h2>
              {ctrl.restaurantes.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-100">
                  <Store size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhuma loja cadastrada.</p>
                </div>
              ) : (
                ctrl.restaurantes.map(rest => (
                  <div key={rest.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-black text-lg text-gray-800">{rest.nome}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} /> {rest.endereco}</p>
                        <p className="text-xs text-gray-400 mt-1">CNPJ: {rest.cnpj}</p>
                        {rest.latitude && <p className="text-xs text-gray-400 mt-1">📍 {rest.latitude}, {rest.longitude}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => ctrl.prepararEdicaoRestaurante(rest)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-bold text-sm transition-colors"><Edit2 size={16} /> Editar</button>
                        <button onClick={() => ctrl.excluirRestaurante(rest.id, rest.nome)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold text-sm transition-colors"><Trash2 size={16} /> Excluir</button>
                      </div>
                    </div>
                    <MapaLocalizacao latitude={rest.latitude} longitude={rest.longitude} endereco={rest.endereco} nome={rest.nome} />
                    <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-xs">
                      <span className="text-gray-500">📦 {ctrl.produtos.filter(p => p.restaurante_id === rest.id).length} produtos</span>
                      <span className="text-gray-500">🛒 {ctrl.pedidos.filter(p => p.restaurante_id === rest.id && p.status !== 'Entregue').length} pedidos ativos</span>
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