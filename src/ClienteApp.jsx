import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import AcompanhamentoPedido from './AcompanhamentoPedido';
import NotificacaoService from './NotificacaoService';

function ClienteApp({ onLogout }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [tipoMensagem, setTipoMensagem] = useState('sucesso'); // 'sucesso', 'erro', 'info'

  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoRestauranteId, setCarrinhoRestauranteId] = useState(null);
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [etapaCheckout, setEtapaCheckout] = useState('resumo'); 
  const [telefone, setTelefone] = useState('');
  const [telefoneFormatado, setTelefoneFormatado] = useState('');
  const [codigoSms, setCodigoSms] = useState('');

  const [clienteNome, setClienteNome] = useState('');
  const [clienteEmail, setClienteEmail] = useState(''); // 🔥 NOVO: Para enviar NF por email
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [tipoEntrega, setTipoEntrega] = useState('Delivery');

  const [pedidoAtivoId, setPedidoAtivoId] = useState(null);
  const [mostrarAcompanhamento, setMostrarAcompanhamento] = useState(false);
  
  // 🔥 NOVO: Estado para notificações não lidas
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);
  const [listaNotificacoes, setListaNotificacoes] = useState([]);

  useEffect(() => { 
    fetchDados(); 
  }, []);

  // 🔥 NOVO: Buscar notificações quando usuário logar
  useEffect(() => {
    if (usuarioLogado && pedidoAtivoId) {
      buscarNotificacoes();
      inscreverNotificacoes();
    }
  }, [usuarioLogado, pedidoAtivoId]);

  const fetchDados = async () => {
    const { data: rests } = await supabase.from('restaurantes').select('*');
    if (rests) setRestaurantes(rests);
    const { data: prods } = await supabase.from('produtos').select('*');
    if (prods) setProdutos(prods);
  };

  // 🔥 NOVO: Buscar notificações do pedido
  const buscarNotificacoes = async () => {
    if (!pedidoAtivoId) return;
    
    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('pedido_id', pedidoAtivoId)
      .order('criado_em', { ascending: false });
    
    if (data) {
      setListaNotificacoes(data);
      const naoLidas = data.filter(n => !n.lida).length;
      setNotificacoesNaoLidas(naoLidas);
    }
  };

  // 🔥 NOVO: Inscrever em notificações em tempo real
  const inscreverNotificacoes = () => {
    const subscription = supabase
      .channel(`notificacoes-${pedidoAtivoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `pedido_id=eq.${pedidoAtivoId}`
        },
        (payload) => {
          console.log('Nova notificação!', payload.new);
          setListaNotificacoes(prev => [payload.new, ...prev]);
          setNotificacoesNaoLidas(prev => prev + 1);
          
          // Mostrar notificação toast
          mostrarMensagem(payload.new.mensagem || 'Nova atualização no pedido!', 'info');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  // 🔥 NOVO: Marcar notificação como lida
  const marcarNotificacaoComoLida = async (notificacaoId) => {
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', notificacaoId);
    
    setListaNotificacoes(prev =>
      prev.map(n => n.id === notificacaoId ? { ...n, lida: true } : n)
    );
    setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
  };

  // 🔥 NOVO: Função para mostrar mensagens com tipo
  const mostrarMensagem = (texto, tipo = 'sucesso') => {
    setMensagem(texto);
    setTipoMensagem(tipo);
    setTimeout(() => setMensagem(''), 5000);
  };

  const adicionarAoCarrinho = (produto, restId) => {
    if (carrinho.length > 0 && carrinhoRestauranteId !== restId) {
      if(window.confirm('Sua sacola tem itens de outra loja. Limpar e começar nova sacola?')) {
        setCarrinho([{ ...produto, quantidade: 1 }]);
        setCarrinhoRestauranteId(restId);
      }
      return;
    }
    setCarrinhoRestauranteId(restId);
    const itemExist = carrinho.find(i => i.id === produto.id);
    if (itemExist) setCarrinho(carrinho.map(i => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
    else setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
  };

  const calcularTotal = () => carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  const handleTelefoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, ''); 
    if (value.length > 11) value = value.slice(0, 11); 
    setTelefone(value); 
  };

  const handleEnviarSms = async (e) => {
    e.preventDefault();
    if (telefone.length < 10) return mostrarMensagem('⚠️ Digite um telefone válido.', 'erro');
    
    mostrarMensagem('⏳ Enviando SMS...', 'info');
    
    const numeroCompleto = '+55' + telefone; 
    setTelefoneFormatado(numeroCompleto); 

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: numeroCompleto,
      });

      if (error) throw error;

      setMensagem('');
      setEtapaCheckout('codigo'); 
    } catch (error) {
      console.error("Erro no envio do SMS:", error.message);
      mostrarMensagem('⚠️ Erro ao enviar SMS. Verifique o número e tente novamente.', 'erro');
    }
  };

  const handleConfirmarCodigo = async (e) => {
    e.preventDefault();
    mostrarMensagem('⏳ Verificando...', 'info');
    
    try {
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        phone: telefoneFormatado,
        token: codigoSms,
        type: 'sms',
      });

      if (error) throw error;

      setUsuarioLogado(session.user);
      setMensagem('');
      setEtapaCheckout('dados_entrega'); 
    } catch (error) {
      console.error("Erro na verificação:", error.message);
      mostrarMensagem('⚠️ Código inválido ou expirado.', 'erro');
    }
  };

  // 🔥 NOVO: Função para enviar nota fiscal simulada
  const enviarNotaFiscal = async (pedidoId) => {
    if (clienteEmail) {
      await NotificacaoService.enviarNotaFiscal(pedidoId, clienteEmail);
    }
  };

  const finalizarPedido = async (e) => {
    e.preventDefault();
    mostrarMensagem('⏳ Processando pedido...', 'info');
    const total = calcularTotal();
    
    // Gerar PIN aleatório de 4 dígitos
    const pinEntrega = Math.floor(1000 + Math.random() * 9000).toString();

    const { data: pedData, error: pedErr } = await supabase.from('pedidos').insert([{
      restaurante_id: carrinhoRestauranteId, 
      cliente_nome: clienteNome, 
      telefone: usuarioLogado?.phone || telefoneFormatado,
      email: clienteEmail, // 🔥 NOVO: Salvar email
      total, 
      forma_pagamento: formaPagamento, 
      tipo_entrega: tipoEntrega, 
      status: 'Aguardando',
      pin_entrega: pinEntrega
    }]).select();

    if (pedErr) return mostrarMensagem(`Erro: ${pedErr.message}`, 'erro');
    
    const itens = carrinho.map(i => ({ 
      pedido_id: pedData[0].id, 
      produto_id: i.id, 
      quantidade: i.quantidade, 
      preco_unitario: i.preco 
    }));
    
    await supabase.from('itens_pedido').insert(itens);

    // 🔥 NOVO: Enviar nota fiscal
    await enviarNotaFiscal(pedData[0].id);

    setPedidoAtivoId(pedData[0].id);
    
    mostrarMensagem(`🎉 Pedido #${pedData[0].id.slice(0,8)} realizado com sucesso!`, 'sucesso');
    setCarrinho([]); 
    setCarrinhoRestauranteId(null); 
    setCheckoutAberto(false); 
    setEtapaCheckout('resumo'); 
    setClienteNome(''); 
    setTelefone(''); 
    setCodigoSms('');
    
    // Redirecionar para tela de acompanhamento
    setTimeout(() => {
      setMostrarAcompanhamento(true);
    }, 2000);
  };

  const abrirCheckout = () => {
    setCheckoutAberto(true);
    setEtapaCheckout('resumo');
  };

  const continuarDoResumo = () => {
    if (usuarioLogado) {
      setEtapaCheckout('dados_entrega'); 
    } else {
      setEtapaCheckout('telefone'); 
    }
  };

  // 🔥 NOVO: Sair do acompanhamento
  const sairDoAcompanhamento = () => {
    setMostrarAcompanhamento(false);
    setPedidoAtivoId(null);
  };

  // Se estiver na tela de acompanhamento
  if (mostrarAcompanhamento && pedidoAtivoId) {
    return (
      <div className="cliente-layout">
        <header className="cliente-header">
          <h1 style={{ fontSize: '1.3rem', margin: 0, color: '#ea1d2c' }}>🍔 DeliveryApp</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {/* 🔥 NOVO: Ícone de notificações */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setMostrarNotificacoes(!mostrarNotificacoes)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                🔔
                {notificacoesNaoLidas > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: '#ea1d2c',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {notificacoesNaoLidas}
                  </span>
                )}
              </button>
              
              {/* 🔥 NOVO: Dropdown de notificações */}
              {mostrarNotificacoes && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: '0',
                  width: '300px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  padding: '15px',
                  zIndex: 1000,
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>Notificações</h4>
                  {listaNotificacoes.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center' }}>Nenhuma notificação</p>
                  ) : (
                    listaNotificacoes.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => marcarNotificacaoComoLida(notif.id)}
                        style={{
                          padding: '10px',
                          background: notif.lida ? '#f8fafc' : '#e0f2fe',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          cursor: 'pointer',
                          border: notif.lida ? '1px solid #e2e8f0' : '1px solid #7dd3fc'
                        }}
                      >
                        <p style={{ margin: '0 0 5px 0', fontWeight: notif.lida ? 'normal' : 'bold' }}>
                          {notif.titulo || 'Atualização'}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                          {notif.mensagem}
                        </p>
                        <small style={{ color: '#94a3b8' }}>
                          {new Date(notif.criado_em).toLocaleTimeString()}
                        </small>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className="cliente-container">
          <AcompanhamentoPedido 
            pedidoId={pedidoAtivoId} 
            onVoltarAoMenu={sairDoAcompanhamento}
          />
        </main>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .cliente-layout { min-height: 100vh; background-color: #f8fafc; font-family: 'Nunito', sans-serif; padding-bottom: 90px; }
        .cliente-header { position: sticky; top: 0; background: #ffffff; padding: 15px 5vw; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); z-index: 10; }
        .cliente-container { padding: 25px 5vw; max-width: 800px; margin: 0 auto; }
        .rest-card { background: white; border-radius: 16px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .prod-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 1px solid #f1f5f9; }
        .btn-add { background: #ea1d2c; color: white; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; transition: transform 0.1s, background 0.2s; }
        .btn-add:hover { background: #c41a27; transform: scale(1.05); }
        .fab-cart { position: fixed; bottom: 25px; right: 25px; background: #10b981; color: white; border: none; padding: 15px 25px; border-radius: 30px; font-size: 1.1rem; font-weight: bold; box-shadow: 0 6px 16px rgba(10, 185, 129, 0.4); cursor: pointer; z-index: 50; display: flex; align-items: center; gap: 10px; transition: transform 0.2s; }
        .fab-cart:hover { transform: scale(1.05); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: flex-end; z-index: 100; backdrop-filter: blur(3px); }
        .modal-content { background: white; width: 100%; max-width: 500px; border-radius: 24px 24px 0 0; padding: 30px; max-height: 85vh; overflow-y: auto; animation: slideUp 0.3s ease; }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @media (min-width: 600px) { 
          .modal-overlay { align-items: center; } 
          .modal-content { border-radius: 24px; }
          @keyframes slideUp {
            from { transform: translateY(100%) scale(0.9); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        }
        .form-input { padding: 15px; border-radius: 12px; border: 1px solid #cbd5e0; font-size: 1rem; width: 100%; box-sizing: border-box; background: #f8fafc; transition: border 0.2s, box-shadow 0.2s; text-align: center; font-weight: bold; letter-spacing: 1px; }
        .form-input:focus { outline: none; border-color: #10b981; background: white; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
        .btn-primary { padding: 18px; background: #10b981; color: white; border: none; border-radius: 12px; font-weight: bold; font-size: 1.2rem; margin-top: 15px; cursor: pointer; width: 100%; transition: background 0.2s, transform 0.1s; }
        .btn-primary:hover { background: #0f9e6e; transform: scale(1.02); }
        .btn-primary:active { transform: scale(0.98); }
        .btn-secondary { padding: 15px; background: #f1f5f9; color: #334155; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; width: 100%; transition: background 0.2s; }
        .btn-secondary:hover { background: #e2e8f0; }
        .mensagem { padding: 15px 20px; border-radius: 12px; margin-bottom: 20px; font-weight: bold; text-align: center; animation: fadeIn 0.3s; }
        .mensagem.sucesso { background: #d1fae5; color: #065f46; border: 1px solid #34d399; }
        .mensagem.erro { background: #fee2e2; color: #991b1b; border: 1px solid #f87171; }
        .mensagem.info { background: #dbeafe; color: #1e40af; border: 1px solid #60a5fa; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="cliente-layout">
        <header className="cliente-header">
          <h1 style={{ fontSize: '1.3rem', margin: 0, color: '#ea1d2c' }}>🍔 DeliveryApp</h1>
          {usuarioLogado && (
            <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
              {usuarioLogado.phone}
            </span>
          )}
        </header>

        <main className="cliente-container">
          {mensagem && (
            <div className={`mensagem ${tipoMensagem}`}>
              {mensagem}
            </div>
          )}
          
          <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>
            O que vamos pedir hoje?
          </h2>
          
          <div>
            {restaurantes.map(rest => (
              <div key={rest.id} className="rest-card">
                <h3 style={{ margin: '0 0 5px 0' }}>{rest.nome}</h3>
                <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>
                  📍 {rest.endereco}
                </p>
                <div>
                  {produtos
                    .filter(p => p.restaurante_id === rest.id)
                    .map(prod => (
                      <div key={prod.id} className="prod-item">
                        <div>
                          <span style={{display: 'block', fontWeight: 'bold'}}>
                            {prod.nome}
                          </span>
                          <span style={{color: '#10b981', fontWeight: 'bold'}}>
                            R$ {prod.preco.toFixed(2)}
                          </span>
                        </div>
                        <button 
                          onClick={() => adicionarAoCarrinho(prod, rest.id)} 
                          className="btn-add"
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {carrinho.length > 0 && !checkoutAberto && (
          <button onClick={abrirCheckout} className="fab-cart">
            🛒 <span>Ver Sacola</span> 
            <span style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '2px 8px', 
              borderRadius: '12px' 
            }}>
              R$ {calcularTotal().toFixed(2)}
            </span>
          </button>
        )}

        {checkoutAberto && (
          <div className="modal-overlay" onClick={() => setCheckoutAberto(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px' 
              }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>
                  {etapaCheckout === 'resumo' && 'Sua Sacola'}
                  {etapaCheckout === 'telefone' && 'Seu WhatsApp'}
                  {etapaCheckout === 'codigo' && 'Código de Verificação'}
                  {etapaCheckout === 'dados_entrega' && 'Finalizar Pedido'}
                </h2>
                <button 
                  onClick={() => setCheckoutAberto(false)} 
                  style={{ 
                    background: '#f1f5f9', 
                    border: 'none', 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    cursor: 'pointer', 
                    fontWeight: 'bold',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
                  onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
                >
                  ✕
                </button>
              </div>

              {etapaCheckout === 'resumo' && (
                <>
                  <div style={{ 
                    background: '#f8fafc', 
                    padding: '15px', 
                    borderRadius: '12px', 
                    marginBottom: '25px' 
                  }}>
                    {carrinho.map(item => (
                      <div key={item.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '10px', 
                        color: '#334155' 
                      }}>
                        <span>
                          <strong style={{ color: '#ea1d2c' }}>{item.quantidade}x</strong> {item.nome}
                        </span>
                        <span style={{ fontWeight: 'bold' }}>
                          R$ {(item.preco * item.quantidade).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div style={{ 
                      borderTop: '2px dashed #cbd5e0', 
                      margin: '15px 0', 
                      padding: '15px 0 0 0', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '1.2rem', 
                      fontWeight: '900', 
                      color: '#0f172a' 
                    }}>
                      <span>Total</span>
                      <span>R$ {calcularTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={continuarDoResumo} className="btn-primary">
                    Continuar
                  </button>
                </>
              )}

              {etapaCheckout === 'telefone' && (
                <form onSubmit={handleEnviarSms}>
                  <p style={{ color: '#64748b', marginBottom: '20px', textAlign: 'center' }}>
                    Precisamos do seu WhatsApp para enviar atualizações do pedido.
                  </p>
                  <input 
                    type="tel" 
                    value={telefone} 
                    onChange={handleTelefoneChange} 
                    placeholder="11999999999" 
                    required 
                    className="form-input" 
                  />
                  <button type="submit" className="btn-primary" style={{ background: '#0f172a' }}>
                    Enviar SMS de Verificação
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEtapaCheckout('resumo')} 
                    className="btn-secondary"
                    style={{ marginTop: '10px' }}
                  >
                    Voltar
                  </button>
                </form>
              )}

              {etapaCheckout === 'codigo' && (
                <form onSubmit={handleConfirmarCodigo}>
                  <p style={{ color: '#64748b', marginBottom: '20px', textAlign: 'center' }}>
                    Digite o código de 6 dígitos que enviamos para {telefone}
                  </p>
                  <input 
                    type="text" 
                    value={codigoSms} 
                    onChange={(e) => setCodigoSms(e.target.value.replace(/\D/g, '').slice(0,6))} 
                    placeholder="000000" 
                    required 
                    className="form-input" 
                    style={{ fontSize: '1.5rem', letterSpacing: '5px' }}
                  />
                  <button type="submit" className="btn-primary" style={{ background: '#0f172a' }}>
                    Confirmar Código
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEtapaCheckout('telefone')} 
                    className="btn-secondary"
                    style={{ marginTop: '10px' }}
                  >
                    Corrigir número
                  </button>
                </form>
              )}

              {etapaCheckout === 'dados_entrega' && (
                <form onSubmit={finalizarPedido} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input 
                    value={clienteNome} 
                    onChange={e => setClienteNome(e.target.value)} 
                    placeholder="Seu nome completo" 
                    required 
                    className="form-input" 
                    style={{ textAlign: 'left', letterSpacing: 'normal' }} 
                  />
                  
                  {/* 🔥 NOVO: Campo de email para nota fiscal */}
                  <input 
                    value={clienteEmail} 
                    onChange={e => setClienteEmail(e.target.value)} 
                    placeholder="Seu email (para nota fiscal)" 
                    type="email"
                    className="form-input" 
                    style={{ textAlign: 'left', letterSpacing: 'normal' }} 
                  />
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select 
                      value={formaPagamento} 
                      onChange={e => setFormaPagamento(e.target.value)} 
                      className="form-input" 
                      style={{ textAlign: 'left', letterSpacing: 'normal', flex: 1 }}
                    >
                      <option value="Pix">💳 Pix</option>
                      <option value="Cartão">💳 Cartão</option>
                      <option value="Dinheiro">💵 Dinheiro</option>
                    </select>
                    
                    <select 
                      value={tipoEntrega} 
                      onChange={e => setTipoEntrega(e.target.value)} 
                      className="form-input" 
                      style={{ textAlign: 'left', letterSpacing: 'normal', flex: 1 }}
                    >
                      <option value="Delivery">🛵 Delivery</option>
                      <option value="Retirada">🏪 Retirada</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-primary">
                    Confirmar Pedido - R$ {calcularTotal().toFixed(2)}
                  </button>
                </form>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ClienteApp;