import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 
// 🔥 1. IMPORTAÇÃO CORRIGIDA: Apontando para o arquivo que sobrou
import { auth } from './firebase'; 
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

function ClienteApp({ onLogout }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState('');

  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoRestauranteId, setCarrinhoRestauranteId] = useState(null);
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [etapaCheckout, setEtapaCheckout] = useState('resumo'); 
  const [telefone, setTelefone] = useState('');
  const [codigoSms, setCodigoSms] = useState('');
  const [confirmacaoResult, setConfirmacaoResult] = useState(null);

  const [clienteNome, setClienteNome] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');
  const [tipoEntrega, setTipoEntrega] = useState('Delivery');

  useEffect(() => { fetchDados(); }, []);

  const fetchDados = async () => {
    const { data: rests } = await supabase.from('restaurantes').select('*');
    if (rests) setRestaurantes(rests);
    const { data: prods } = await supabase.from('produtos').select('*');
    if (prods) setProdutos(prods);
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
    if (telefone.length < 10) return setMensagem('⚠️ Digite um telefone válido.');
    
    setMensagem('⏳ Conectando ao sistema de verificação...');
    
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }

    try {
      // 🔥 2. O TRUQUE DO NÚMERO DE TESTE
      // Se você digitar o número de teste no input, forçamos a formatação exata que o Firebase quer
      let numeroFormatado = '+55' + telefone; 
      
      if (telefone === '11999999999') {
        numeroFormatado = '+55 11 99999-9999'; // Exatamente como deve estar no Console
        console.log("Usando número de teste formatado:", numeroFormatado);
      }

      const confirmation = await signInWithPhoneNumber(auth, numeroFormatado, window.recaptchaVerifier);
      setConfirmacaoResult(confirmation);
      setMensagem('');
      setEtapaCheckout('codigo'); 
    } catch (error) {
      console.error("Erro no Firebase:", error);
      setMensagem('⚠️ Erro ao enviar SMS. Tente novamente.');
      
      // 🔥 3. LIMPANDO O RECAPTCHA PARA PERMITIR NOVA TENTATIVA
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear(); 
        window.recaptchaVerifier = null;
      }
    }
  };

  const handleConfirmarCodigo = async (e) => {
    e.preventDefault();
    setMensagem('⏳ Verificando...');
    try {
      const result = await confirmacaoResult.confirm(codigoSms);
      setUsuarioLogado(result.user);
      setMensagem('');
      setEtapaCheckout('dados_entrega'); 
    } catch (error) {
      setMensagem('⚠️ Código inválido ou expirado.');
    }
  };

  const finalizarPedido = async (e) => {
    e.preventDefault();
    setMensagem('⏳ Processando pedido...');
    const total = calcularTotal();

    const { data: pedData, error: pedErr } = await supabase.from('pedidos').insert([{
      restaurante_id: carrinhoRestauranteId, 
      cliente_nome: clienteNome, 
      telefone: usuarioLogado.phoneNumber, 
      total, 
      forma_pagamento: formaPagamento, 
      tipo_entrega: tipoEntrega, 
      status: 'Aguardando'
    }]).select();

    if (pedErr) return setMensagem(`Erro: ${pedErr.message}`);
    
    const itens = carrinho.map(i => ({ pedido_id: pedData[0].id, produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco }));
    await supabase.from('itens_pedido').insert(itens);

    setMensagem(`🎉 Pedido enviado! Acompanhe pelo seu WhatsApp.`);
    setCarrinho([]); setCarrinhoRestauranteId(null); setCheckoutAberto(false); 
    setEtapaCheckout('resumo'); setClienteNome(''); setTelefone(''); setCodigoSms('');
    setTimeout(() => setMensagem(''), 5000);
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

  return (
    <>
      <style>{`
        .cliente-layout { min-height: 100vh; background-color: #f8fafc; font-family: 'Nunito', sans-serif; padding-bottom: 90px; }
        .cliente-header { position: sticky; top: 0; background: #ffffff; padding: 15px 5vw; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); z-index: 10; }
        .cliente-container { padding: 25px 5vw; max-width: 800px; margin: 0 auto; }
        .rest-card { background: white; border-radius: 16px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; }
        .prod-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-top: 1px solid #f1f5f9; }
        .btn-add { background: #ea1d2c; color: white; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; cursor: pointer; transition: transform 0.1s, background 0.2s; }
        .fab-cart { position: fixed; bottom: 25px; right: 25px; background: #10b981; color: white; border: none; padding: 15px 25px; border-radius: 30px; font-size: 1.1rem; font-weight: bold; box-shadow: 0 6px 16px rgba(10, 185, 129, 0.4); cursor: pointer; z-index: 50; display: flex; align-items: center; gap: 10px; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: flex-end; z-index: 100; backdrop-filter: blur(3px); }
        .modal-content { background: white; width: 100%; max-width: 500px; border-radius: 24px 24px 0 0; padding: 30px; max-height: 85vh; overflow-y: auto; }
        @media (min-width: 600px) { .modal-overlay { align-items: center; } .modal-content { border-radius: 24px; } }
        .form-input { padding: 15px; border-radius: 12px; border: 1px solid #cbd5e0; font-size: 1rem; width: 100%; box-sizing: border-box; background: #f8fafc; transition: border 0.2s; text-align: center; font-weight: bold; letter-spacing: 1px; }
        .form-input:focus { outline: none; border-color: #10b981; background: white; }
        .btn-primary { padding: 18px; background: #10b981; color: white; border: none; border-radius: 12px; font-weight: bold; fontSize: 1.2rem; marginTop: 15px; cursor: pointer; width: 100%; }
        .alerta-sucesso { padding: 15px 20px; background: #d1fae5; color: #065f46; border-radius: 12px; margin-bottom: 20px; font-weight: bold; text-align: center; border: 1px solid #34d399; }
      `}</style>

      <div className="cliente-layout">
        <header className="cliente-header">
          <h1 style={{ fontSize: '1.3rem', margin: 0, color: '#ea1d2c' }}>🍔 DeliveryApp</h1>
        </header>

        <main className="cliente-container">
          {mensagem && checkoutAberto === false && <div className="alerta-sucesso">{mensagem}</div>}
          <h2 style={{ color: '#0f172a', marginBottom: '20px' }}>O que vamos pedir hoje?</h2>
          <div>
            {restaurantes.map(rest => (
              <div key={rest.id} className="rest-card">
                <h3 style={{ margin: '0 0 5px 0' }}>{rest.nome}</h3>
                <p style={{ margin: '0 0 20px 0', color: '#64748b' }}>📍 {rest.endereco}</p>
                <div>
                  {produtos.filter(p => p.restaurante_id === rest.id).map(prod => (
                    <div key={prod.id} className="prod-item">
                      <div><span style={{display: 'block', fontWeight: 'bold'}}>{prod.nome}</span><span style={{color: '#10b981', fontWeight: 'bold'}}>R$ {prod.preco.toFixed(2)}</span></div>
                      <button onClick={() => adicionarAoCarrinho(prod, rest.id)} className="btn-add">+ Add</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>

        {carrinho.length > 0 && !checkoutAberto && (
          <button onClick={abrirCheckout} className="fab-cart">
            🛒 <span>Ver Sacola</span> <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>R$ {calcularTotal().toFixed(2)}</span>
          </button>
        )}

        {checkoutAberto && (
          <div className="modal-overlay" onClick={() => setCheckoutAberto(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#0f172a' }}>
                  {etapaCheckout === 'resumo' && 'Sua Sacola'}
                  {etapaCheckout === 'telefone' && 'Seu WhatsApp'}
                  {etapaCheckout === 'codigo' && 'Código de Verificação'}
                  {etapaCheckout === 'dados_entrega' && 'Finalizar Pedido'}
                </h2>
                <button onClick={() => setCheckoutAberto(false)} style={{ background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              </div>

              {mensagem && <div style={{ padding: '10px', background: '#fef3c7', color: '#b45309', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{mensagem}</div>}

              <div id="recaptcha-container"></div>

              {etapaCheckout === 'resumo' && (
                <>
                  <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '25px' }}>
                    {carrinho.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#334155' }}>
                        <span><strong style={{ color: '#ea1d2c' }}>{item.quantidade}x</strong> {item.nome}</span>
                        <span style={{ fontWeight: 'bold' }}>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '2px dashed #cbd5e0', margin: '15px 0', padding: '15px 0 0 0', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', color: '#0f172a' }}>
                      <span>Total</span>
                      <span>R$ {calcularTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={continuarDoResumo} className="btn-primary">Continuar</button>
                </>
              )}

              {etapaCheckout === 'telefone' && (
                <form onSubmit={handleEnviarSms}>
                  <p style={{ color: '#64748b', marginBottom: '20px', textAlign: 'center' }}>Precisamos do seu WhatsApp para enviar atualizações do pedido.</p>
                  <input 
                    type="tel" 
                    value={telefone} 
                    onChange={handleTelefoneChange} 
                    placeholder="11999999999" 
                    required 
                    className="form-input" 
                  />
                  <button type="submit" className="btn-primary" style={{ background: '#0f172a' }}>Enviar SMS de Verificação</button>
                  <button type="button" onClick={() => setEtapaCheckout('resumo')} style={{ width: '100%', padding: '15px', background: 'transparent', border: 'none', color: '#64748b', marginTop: '10px', cursor: 'pointer' }}>Voltar</button>
                </form>
              )}

              {etapaCheckout === 'codigo' && (
                <form onSubmit={handleConfirmarCodigo}>
                  <p style={{ color: '#64748b', marginBottom: '20px', textAlign: 'center' }}>Digite o código de 6 dígitos que enviamos para {telefone}</p>
                  <input 
                    type="text" 
                    value={codigoSms} 
                    onChange={(e) => setCodigoSms(e.target.value.replace(/\D/g, '').slice(0,6))} 
                    placeholder="000000" 
                    required 
                    className="form-input" 
                    style={{ fontSize: '1.5rem', letterSpacing: '5px' }}
                  />
                  <button type="submit" className="btn-primary" style={{ background: '#0f172a' }}>Confirmar Código</button>
                  <button type="button" onClick={() => setEtapaCheckout('telefone')} style={{ width: '100%', padding: '15px', background: 'transparent', border: 'none', color: '#64748b', marginTop: '10px', cursor: 'pointer' }}>Corrigir número</button>
                </form>
              )}

              {etapaCheckout === 'dados_entrega' && (
                <form onSubmit={finalizarPedido} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Como você se chama?" required className="form-input" style={{ textAlign: 'left', letterSpacing: 'normal' }} />
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} className="form-input" style={{ textAlign: 'left', letterSpacing: 'normal', flex: 1 }}>
                      <option value="Pix">💳 Pix</option>
                      <option value="Cartão">💳 Cartão</option>
                      <option value="Dinheiro">💵 Dinheiro</option>
                    </select>
                    <select value={tipoEntrega} onChange={e => setTipoEntrega(e.target.value)} className="form-input" style={{ textAlign: 'left', letterSpacing: 'normal', flex: 1 }}>
                      <option value="Delivery">🛵 Delivery</option>
                      <option value="Retirada">🏪 Retirada</option>
                    </select>
                  </div>

                  <button type="submit" className="btn-primary">Confirmar Pedido - R$ {calcularTotal().toFixed(2)}</button>
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