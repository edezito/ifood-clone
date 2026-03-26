// ============================================================
// VIEW: ClienteApp
// Responsabilidade: app de delivery para clientes.
// Toda a lógica foi movida para useClienteController.
// ============================================================
import React from 'react';
import {
  Search, MapPin, Star, ShoppingBag, Pizza, Coffee, Soup, Beef, X,
  ChevronRight, Home, Heart, LogOut, Clock,
} from 'lucide-react';
import { useClienteController } from '../controllers/useClienteController';
import AcompanhamentoPedido from './Acompanhamentopedido';
import HistoricoPedidos from './HistoricoPedidos';
import LoginCliente from './Logincliente';

const CATEGORIAS = {
  pizza:      { nome: 'Pizza',      icone: Pizza },
  lanches:    { nome: 'Lanches',    icone: Coffee },
  japonesa:   { nome: 'Japonesa',   icone: Soup },
  brasileira: { nome: 'Brasileira', icone: Beef },
  massas:     { nome: 'Massas',     icone: Pizza },
  saudavel:   { nome: 'Saudável',   icone: Heart },
};

function ClienteApp({ onLogout }) {
  const ctrl = useClienteController();

  // ---- Roteamento de telas ----
  if (ctrl.pedidoAtivoId) {
    return <AcompanhamentoPedido pedidoId={ctrl.pedidoAtivoId} onVoltarAoMenu={() => ctrl.setPedidoAtivoId(null)} />;
  }
  if (ctrl.verHistorico) {
    return (
      <HistoricoPedidos
        telefone={ctrl.usuarioLogado?.telefone ?? ctrl.usuarioLogado?.phone}
        onVoltar={() => ctrl.setVerHistorico(false)}
        onVerDetalhes={(id) => { ctrl.setPedidoAtivoId(id); ctrl.setVerHistorico(false); }}
      />
    );
  }
  if (ctrl.precisaLogar) {
    return <LoginCliente onLoginSucesso={ctrl.loginSucesso} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-24">

      {/* Navbar Fixa */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40 p-4 border-b">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-red-600 w-5 h-5" />
              <span className="font-bold text-gray-700 text-sm truncate max-w-[180px]">
                {ctrl.usuarioLogado?.endereco ?? 'Rua Augusta, 123 - Consolação'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {ctrl.usuarioLogado && (
                <span className="text-sm text-gray-600 mr-2">
                  Olá, {ctrl.usuarioLogado.nome?.split(' ')[0] ?? 'Cliente'}
                </span>
              )}
              <button onClick={() => ctrl.setVerHistorico(true)} className="p-2 bg-gray-50 rounded-full text-gray-600"><Clock size={20} /></button>
              <button onClick={onLogout} className="p-2 bg-red-50 rounded-full text-red-600"><LogOut size={18} /></button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pratos ou restaurantes"
              className="w-full bg-gray-100 p-2.5 pl-10 rounded-xl outline-none focus:ring-2 focus:ring-red-500/10"
              onChange={(e) => ctrl.setBusca(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="pt-36 px-4 max-w-4xl mx-auto">

        {/* Categorias */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => ctrl.setCategoriaAtiva('todos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${ctrl.categoriaAtiva === 'todos' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600'}`}
          >
            <Home size={16} /> <span className="text-sm font-bold">Início</span>
          </button>
          {Object.entries(CATEGORIAS).map(([key, { nome, icone: Icon }]) => (
            <button
              key={key}
              onClick={() => ctrl.setCategoriaAtiva(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all ${ctrl.categoriaAtiva === key ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              <Icon size={16} /> <span className="text-sm font-bold">{nome}</span>
            </button>
          ))}
        </div>

        {/* Lista de Restaurantes */}
        <div className="space-y-4">
          <h2 className="font-black text-gray-800 text-xl tracking-tight">Lojas</h2>
          {ctrl.restaurantes
            .filter(r =>
              (ctrl.categoriaAtiva === 'todos' || r.categoria === ctrl.categoriaAtiva) &&
              r.nome.toLowerCase().includes(ctrl.busca.toLowerCase())
            )
            .map(rest => (
              <div key={rest.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm" onClick={() => ctrl.toggleRestaurante(rest.id)}>
                <div className="flex justify-between items-center cursor-pointer">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 leading-tight">{rest.nome}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Star className="text-yellow-500 fill-yellow-500" size={12} />
                      <span className="font-bold text-yellow-600">4.8</span>
                      <span>•</span>
                      <span className="uppercase tracking-wide">{rest.categoria}</span>
                    </div>
                  </div>
                  <ChevronRight className={`text-gray-300 transition-transform ${ctrl.restauranteExpandido === rest.id ? 'rotate-90' : ''}`} />
                </div>

                {ctrl.restauranteExpandido === rest.id && (
                  <div className="mt-4 border-t border-gray-50 pt-4 space-y-3">
                    {ctrl.produtos
                      .filter(p => p.restaurante_id === rest.id && p.disponivel !== false)
                      .map(prod => (
                        <div key={prod.id} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-700">{prod.nome}</span>
                            <span className="text-green-600 font-black">R$ {prod.preco.toFixed(2)}</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); ctrl.adicionarAoCarrinho(prod, rest.id); }}
                            className="bg-white border-2 border-red-600 text-red-600 font-black px-4 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-90"
                          >
                            ADD
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      </main>

      {/* Botão flutuante do carrinho */}
      {ctrl.carrinho.length > 0 && (
        <button
          onClick={() => ctrl.setCarrinhoAberto(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-red-600 text-white p-4 rounded-2xl font-black flex justify-between shadow-2xl items-center active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={22} />
            <span className="text-sm font-bold uppercase tracking-wider">{ctrl.carrinho.length} itens</span>
          </div>
          <span className="text-lg">R$ {ctrl.calcularTotal().toFixed(2)}</span>
        </button>
      )}

      {/* Modal de Checkout */}
      {ctrl.carrinhoAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end backdrop-blur-[2px]">
          <div className="bg-white w-full rounded-t-[32px] p-6 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Sua sacola</h2>
              <button onClick={() => ctrl.setCarrinhoAberto(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-4 mb-6 pr-2">
              {ctrl.carrinho.map(item => (
                <div key={item.id} className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{item.nome}</span>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-tighter">{item.quantidade}x R$ {item.preco.toFixed(2)}</span>
                  </div>
                  <span className="font-black text-gray-900">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => ctrl.finalizarPedido()} className="w-full bg-red-600 text-white p-4 rounded-2xl font-black text-xl shadow-lg shadow-red-200 mb-2">
              Fazer Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClienteApp;