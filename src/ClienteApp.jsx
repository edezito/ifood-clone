import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 

function ClienteApp({ onLogout }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState('');

  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoRestauranteId, setCarrinhoRestauranteId] = useState(null);
  const [checkoutAberto, setCheckoutAberto] = useState(false);
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
      if(window.confirm('Sua sacola tem itens de outra loja. Limpar e começar aqui?')) {
        setCarrinho([{ ...produto, quantidade: 1 }]);
        setCarrinhoRestauranteId(restId);
      }
      return;
    }
    setCarrinhoRestauranteId(restId);
    const itemExist = carrinho.find(i => i.id === produto.id);
    if (itemExist) {
      setCarrinho(carrinho.map(i => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
  };

  const alterarQuantidade = (produtoId, delta) => {
    const novoCarrinho = carrinho.map(item => {
      if (item.id === produtoId) return { ...item, quantidade: item.quantidade + delta };
      return item;
    }).filter(item => item.quantidade > 0);
    setCarrinho(novoCarrinho);
    if (novoCarrinho.length === 0) setCarrinhoRestauranteId(null);
  };

  const calcularTotal = () => carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  const finalizarPedido = async (e) => {
    e.preventDefault();
    setMensagem('⏳ Processando...');
    const total = calcularTotal();

    const { data: pedData, error: pedErr } = await supabase.from('pedidos').insert([{
      restaurante_id: carrinhoRestauranteId, cliente_nome: clienteNome, total, forma_pagamento: formaPagamento, tipo_entrega: tipoEntrega, status: 'Aguardando'
    }]).select();

    if (pedErr) return setMensagem(`Erro: ${pedErr.message}`);
    
    const itens = carrinho.map(i => ({ pedido_id: pedData[0].id, produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco }));
    await supabase.from('itens_pedido').insert(itens);

    setMensagem(`🎉 Sucesso! Pedido de R$ ${total.toFixed(2)} enviado!`);
    setCarrinho([]); setCarrinhoRestauranteId(null); setCheckoutAberto(false); setClienteNome('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Nunito, sans-serif' }}>
      <header style={{ position: 'sticky', top: 0, background: '#10b981', padding: '15px 4vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', zIndex: 10 }}>
        <h1 style={{ fontSize: '20px', margin: 0 }}>🍔 App Cliente</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          {carrinho.length > 0 && (
            <button onClick={() => setCheckoutAberto(true)} style={{ background: 'white', color: '#10b981', border: 'none', padding: '8px 15px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
              🛒 R$ {calcularTotal().toFixed(2)}
            </button>
          )}
          <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>Sair</button>
        </div>
      </header>

      <main style={{ padding: '20px 4vw', maxWidth: '800px', margin: '0 auto' }}>
        {mensagem && <div style={{ padding: '15px', background: '#ecfdf5', color: '#065f46', borderRadius: '10px', marginBottom: '20px' }}>{mensagem}</div>}

        <h2 style={{ color: '#0f172a' }}>Restaurantes Disponíveis</h2>
        <div style={{ display: 'grid', gap: '20px' }}>
          {restaurantes.map(rest => (
            <div key={rest.id} style={{ background: 'white', borderRadius: '15px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 5px 0' }}>{rest.nome}</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#64748b' }}>📍 {rest.endereco}</p>
              
              <div>
                {produtos.filter(p => p.restaurante_id === rest.id).map(prod => (
                  <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <strong style={{ display: 'block' }}>{prod.nome}</strong>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>R$ {prod.preco}</span>
                    </div>
                    <button onClick={() => adicionarAoCarrinho(prod, rest.id)} style={{ background: '#ea1d2c', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Modal Checkout mantido igual ao seu original, só simplifiquei o CSS visual aqui pro código não ficar gigante */}
      {checkoutAberto && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Finalizar Pedido</h2>
              <button onClick={() => setCheckoutAberto(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖️</button>
            </div>
            
            {carrinho.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>{item.quantidade}x {item.nome}</span>
                <span>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
              </div>
            ))}

            <form onSubmit={finalizarPedido} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              <input value={clienteNome} onChange={e => setClienteNome(e.target.value)} placeholder="Seu Nome" required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0' }} />
              <select value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                <option value="Pix">Pix</option><option value="Cartão">Cartão</option><option value="Dinheiro">Dinheiro</option>
              </select>
              <select value={tipoEntrega} onChange={e => setTipoEntrega(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0' }}>
                <option value="Delivery">Delivery</option><option value="Retirada">Retirada</option>
              </select>
              <button type="submit" style={{ padding: '15px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', cursor: 'pointer' }}>
                Pagar R$ {calcularTotal().toFixed(2)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClienteApp;