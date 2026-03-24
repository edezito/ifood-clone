import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AcompanhamentoPedido from './AcompanhamentoPedido';
import HistoricoPedidos from './HistoricoPedidos';
import LoginCliente from './LoginCliente';
import {
  Search, MapPin, Star, ShoppingBag, Pizza, Coffee, Soup, Beef, X,
  Minus, Plus, ChevronRight, Home, User, Heart, LogOut, Clock
} from 'lucide-react';

const categoriasConfig = {
  pizza: { nome: 'Pizza', icone: Pizza },
  lanches: { nome: 'Lanches', icone: Coffee },
  japonesa: { nome: 'Japonesa', icone: Soup },
  brasileira: { nome: 'Brasileira', icone: Beef },
  massas: { nome: 'Massas', icone: Pizza },
  saudavel: { nome: 'Saudável', icone: Heart },
};

const ClienteApp = ({ onLogout }) => {
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [pedidoAtivoId, setPedidoAtivoId] = useState(null);
  const [verHistorico, setVerHistorico] = useState(false);
  const [precisaLogar, setPrecisaLogar] = useState(false);
  const [carrinhoPendente, setCarrinhoPendente] = useState(null);
  const [enderecoPadrao] = useState('Rua Augusta, 123 - Consolação');
  const [busca, setBusca] = useState('');
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [carrinho, setCarrinho] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [restauranteExpandido, setRestauranteExpandido] = useState(null);

  useEffect(() => {
    fetchDados();
    verificarSessao();
  }, []);

  const verificarSessao = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await buscarDadosCliente(session.user);
  };

  const buscarDadosCliente = async (user) => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('nome, endereco, complemento, telefone')
        .eq('id', user.id)
        .single();
      
      setUsuarioLogado({
        ...user,
        nome: data?.nome || user.user_metadata?.nome || 'Cliente',
        endereco: data?.endereco,
        complemento: data?.complemento,
        telefone: data?.telefone || user.phone
      });
    } catch (error) {
      setUsuarioLogado(user);
    }
  };

  const fetchDados = async () => {
    const { data: rests } = await supabase.from('restaurantes').select('*');
    if (rests) setRestaurantes(rests);
    
    const { data: prods } = await supabase.from('produtos').select('*');
    if (prods) setProdutos(prods);
  };

  const adicionarAoCarrinho = (produto, restId) => {
    if (carrinho.length > 0 && carrinho[0].restauranteId !== restId) {
      if (window.confirm('Sua sacola já tem itens de outro local. Limpar e adicionar este?')) {
        setCarrinho([{ ...produto, quantidade: 1, restauranteId: restId }]);
      }
      return;
    }
    const itemExist = carrinho.find(i => i.id === produto.id);
    if (itemExist) {
      setCarrinho(carrinho.map(i => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1, restauranteId: restId }]);
    }
  };

  const calcularTotal = () => carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  const finalizarPedido = async (carrinhoData = null) => {
    const carrinhoAtual = carrinhoData || carrinho;
    
    if (!usuarioLogado) {
      setCarrinhoPendente(carrinhoAtual);
      setPrecisaLogar(true);
      setCarrinhoAberto(false);
      return;
    }
    
    if (carrinhoAtual.length === 0) return alert('Carrinho vazio!');
    
    const restId = carrinhoAtual[0].restauranteId;
    const pinGerado = Math.floor(1000 + Math.random() * 9000).toString();
    const total = calcularTotal();

    try {
      const { data: pedData, error: pedError } = await supabase
        .from('pedidos')
        .insert([{
          restaurante_id: restId,
          cliente_nome: usuarioLogado.nome || "Cliente",
          cliente_id: usuarioLogado.id,
          total: total,
          forma_pagamento: 'Cartão',
          tipo_entrega: 'Entrega',
          status: 'Aguardando',
          telefone: usuarioLogado.telefone || usuarioLogado.phone,
          pin_entrega: pinGerado,
          email: usuarioLogado.email,
          endereco: usuarioLogado.endereco || enderecoPadrao
        }])
        .select().single();

      if (pedError) throw pedError;

      const itensParaInserir = carrinhoAtual.map(item => ({
        pedido_id: pedData.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco
      }));

      await supabase.from('itens_pedido').insert(itensParaInserir);

      setCarrinho([]);
      setCarrinhoPendente(null);
      setCarrinhoAberto(false);
      setPedidoAtivoId(pedData.id); 
    } catch (error) {
      alert(`Erro ao fazer pedido: ${error.message}`);
    }
  };

  if (pedidoAtivoId) return <AcompanhamentoPedido pedidoId={pedidoAtivoId} onVoltarAoMenu={() => setPedidoAtivoId(null)} />;
  if (verHistorico) return <HistoricoPedidos telefone={usuarioLogado?.telefone || usuarioLogado?.phone} onVoltar={() => setVerHistorico(false)} onVerDetalhes={(id) => { setPedidoAtivoId(id); setVerHistorico(false); }} />;
  if (precisaLogar) return <LoginCliente onLoginSucesso={async (user) => { await buscarDadosCliente(user); setPrecisaLogar(false); if (carrinhoPendente) { await finalizarPedido(carrinhoPendente); setCarrinhoPendente(null); } else { setCarrinhoAberto(true); } }} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-28">
      {/* Navbar Fixa com Glassmorphism */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-40 p-4 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition cursor-pointer">
              <MapPin className="text-red-500 w-4 h-4" />
              <span className="font-semibold text-gray-700 text-sm truncate max-w-[150px] sm:max-w-xs">
                {usuarioLogado?.endereco || enderecoPadrao}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setVerHistorico(true)} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-600 transition">
                <Clock size={18}/>
              </button>
              <button onClick={onLogout} className="p-2.5 bg-red-50 hover:bg-red-100 rounded-full text-red-600 transition">
                <LogOut size={18}/>
              </button>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-red-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Pratos ou restaurantes..."
              className="w-full bg-white border border-gray-200 p-3 pl-11 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-400 transition-all shadow-sm"
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
      </nav>

      <main className="pt-36 px-4 max-w-4xl mx-auto">
        {/* Categorias - Pílulas Modernas */}
        <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4">
          <button 
            onClick={() => setCategoriaAtiva('todos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 ${
              categoriaAtiva === 'todos' ? 'bg-slate-900 text-white shadow-md scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Home size={16} /> <span className="text-sm font-bold">Início</span>
          </button>
          {Object.keys(categoriasConfig).map(key => {
            const Icon = categoriasConfig[key].icone;
            const active = categoriaAtiva === key;
            return (
              <button 
                key={key} 
                onClick={() => setCategoriaAtiva(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 ${
                  active ? 'bg-red-600 text-white shadow-md shadow-red-500/30 scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={16} /> <span className="text-sm font-bold">{categoriasConfig[key].nome}</span>
              </button>
            );
          })}
        </div>

        {/* Restaurantes e Produtos */}
        <div className="space-y-5 mt-2">
          <h2 className="font-black text-slate-800 text-2xl tracking-tight">Lojas em destaque</h2>
          {restaurantes
            .filter(r => (categoriaAtiva === 'todos' || r.categoria === categoriaAtiva) && r.nome.toLowerCase().includes(busca.toLowerCase()))
            .map(rest => (
              <div key={rest.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div 
                  className="p-5 flex justify-between items-center cursor-pointer select-none"
                  onClick={() => setRestauranteExpandido(restauranteExpandido === rest.id ? null : rest.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl shadow-inner">
                      {categoriasConfig[rest.categoria?.toLowerCase()]?.icone ? <Store className="text-gray-400" size={24} /> : '🏪'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 leading-tight">{rest.nome}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                        <span className="flex items-center text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-md"><Star size={12} className="mr-1 fill-amber-500" /> 4.8</span>
                        <span>•</span>
                        <span className="uppercase tracking-wider">{rest.categoria}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className={`text-slate-300 transition-transform duration-300 ${restauranteExpandido === rest.id ? 'rotate-90' : ''}`} />
                </div>

                {/* Produtos Animados */}
                <div className={`transition-all duration-300 ease-in-out ${restauranteExpandido === rest.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="px-5 pb-5 pt-2 border-t border-slate-50 space-y-3 bg-slate-50/50">
                    {produtos.filter(p => p.restaurante_id === rest.id && p.disponivel !== false).map(prod => (
                      <div key={prod.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-red-100 transition-colors">
                        <div className="flex flex-col pr-4">
                          <span className="font-bold text-slate-700 text-[15px]">{prod.nome}</span>
                          <span className="text-slate-500 text-sm line-clamp-2 mt-0.5">{prod.descricao || 'Delicioso e preparado na hora para você.'}</span>
                          <span className="text-emerald-600 font-black mt-2">R$ {prod.preco.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); adicionarAoCarrinho(prod, rest.id); }}
                          className="min-w-[40px] h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all active:scale-95 group"
                        >
                          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </main>

      {/* Carrinho Flutuante - Modernizado */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 pointer-events-none">
          <button 
            onClick={() => setCarrinhoAberto(true)} 
            className="pointer-events-auto w-full max-w-md mx-auto bg-slate-900 text-white p-4 rounded-2xl font-black flex justify-between shadow-2xl shadow-slate-900/20 items-center active:scale-[0.98] transition-all hover:bg-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900">
                  {carrinho.reduce((acc, item) => acc + item.quantidade, 0)}
                </span>
              </div>
              <span className="text-sm font-bold tracking-wide">Ver Sacola</span>
            </div>
            <span className="text-lg bg-white/10 px-3 py-1 rounded-lg">R$ {calcularTotal().toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Checkout Modal (Estilo Bottom Sheet iOS) */}
      {carrinhoAberto && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setCarrinhoAberto(false)}></div>
          <div className="bg-white w-full rounded-t-[32px] p-6 shadow-2xl max-h-[85vh] flex flex-col relative z-10 animate-slide-up">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sua Sacola</h2>
              <button onClick={() => setCarrinhoAberto(false)} className="p-2 bg-slate-100 hover:bg-slate-200 transition rounded-full text-slate-500"><X size={20}/></button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-4 mb-6 pr-2 scrollbar-hide">
              {carrinho.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-white px-2 py-1 rounded-lg text-sm font-bold text-slate-500 shadow-sm border border-slate-100">
                      {item.quantidade}x
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{item.nome}</span>
                      <span className="text-xs text-slate-400 font-medium">R$ {item.preco.toFixed(2)} un</span>
                    </div>
                  </div>
                  <span className="font-black text-slate-800">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 mb-4">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-medium">Total a pagar</span>
                <span className="text-3xl font-black text-slate-800">R$ {calcularTotal().toFixed(2)}</span>
              </div>
              <button 
                onClick={() => finalizarPedido()} 
                className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-2xl font-black text-lg shadow-xl shadow-red-500/20 active:scale-[0.98] transition-all"
              >
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteApp;