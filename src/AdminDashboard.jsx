import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 

function AdminDashboard({ onLogout }) {
  // ... (Estados e funções lógicas mantidas exatamente iguais ao seu código) ...
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [mensagem, setMensagem] = useState('');

  const [nomeRest, setNomeRest] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [nomeProd, setNomeProd] = useState('');
  const [preco, setPreco] = useState('');
  const [restauranteSelecionado, setRestauranteSelecionado] = useState('');

  const [editandoRestId, setEditandoRestId] = useState(null);
  const [editandoProdId, setEditandoProdId] = useState(null);

  useEffect(() => { fetchDados(); }, []);

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

  const handleSalvarRestaurante = async (e) => {
    e.preventDefault();
    setMensagem('📍 Buscando coordenadas...');
    const coordenadas = await obterCoordenadas(endereco);
    if (!coordenadas) return setMensagem('⚠️ Erro: Endereço não encontrado.');
    
    if (editandoRestId) {
      const { data, error } = await supabase.from('restaurantes').update({ nome: nomeRest, cnpj, endereco, latitude: coordenadas.lat, longitude: coordenadas.lng }).eq('id', editandoRestId).select();
      if (error) return setMensagem(`Erro: ${error.message}`);
      setRestaurantes(restaurantes.map(r => r.id === editandoRestId ? data[0] : r));
      setMensagem(`Loja atualizada com sucesso!`);
      setEditandoRestId(null);
    } else {
      const { data, error } = await supabase.from('restaurantes').insert([{ nome: nomeRest, cnpj, endereco, latitude: coordenadas.lat, longitude: coordenadas.lng }]).select();
      if (error) return setMensagem(error.code === '23505' ? '⚠️ CNPJ já cadastrado!' : `Erro: ${error.message}`);
      setRestaurantes([...restaurantes, data[0]]);
      setMensagem(`Loja cadastrada com sucesso ✅`);
    }
    setNomeRest(''); setCnpj(''); setEndereco('');
  };

  const handleSalvarProduto = async (e) => {
    e.preventDefault();
    if (!restauranteSelecionado) return setMensagem('Selecione uma loja!');

    if (editandoProdId) {
      const { data, error } = await supabase.from('produtos').update({ nome: nomeProd, preco: parseFloat(preco), restaurante_id: restauranteSelecionado }).eq('id', editandoProdId).select();
      if (error) return setMensagem(`Erro: ${error.message}`);
      setProdutos(produtos.map(p => p.id === editandoProdId ? data[0] : p));
      setMensagem(`Produto atualizado!`);
      setEditandoProdId(null);
    } else {
      const { data, error } = await supabase.from('produtos').insert([{ nome: nomeProd, preco: parseFloat(preco), restaurante_id: restauranteSelecionado }]).select();
      if (error) return setMensagem(`Erro: ${error.message}`);
      setProdutos([...produtos, data[0]]);
      setMensagem(`Produto salvo!`);
    }
    setNomeProd(''); setPreco('');
  };

  const handleExcluirRestaurante = async (id, nome) => {
    if(!window.confirm(`Apagar a loja ${nome} e seus produtos?`)) return;
    await supabase.from('restaurantes').delete().eq('id', id);
    setRestaurantes(restaurantes.filter(r => r.id !== id));
    setProdutos(produtos.filter(p => p.restaurante_id !== id));
    setMensagem(`Loja excluída.`);
  };

  const handleExcluirProduto = async (id, nome) => {
    if(!window.confirm(`Remover o produto ${nome}?`)) return;
    await supabase.from('produtos').delete().eq('id', id);
    setProdutos(produtos.filter(p => p.id !== id));
    setMensagem(`Produto removido.`);
  };

  const handleAtualizarStatus = async (pedidoId, novoStatus) => {
    const { error } = await supabase.from('pedidos').update({ status: novoStatus }).eq('id', pedidoId);
    if (error) return setMensagem(`Erro ao atualizar pedido: ${error.message}`);
    setPedidos(pedidos.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
  };

  const prepararEdicaoRestaurante = (rest) => { setNomeRest(rest.nome); setCnpj(rest.cnpj); setEndereco(rest.endereco); setEditandoRestId(rest.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const prepararEdicaoProduto = (prod) => { setNomeProd(prod.nome); setPreco(prod.preco); setRestauranteSelecionado(prod.restaurante_id); setEditandoProdId(prod.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <>
      {/* CSS Embutido para Responsividade e Design Profissional */}
      <style>{`
        .admin-layout { min-height: 100vh; background-color: #f8fafc; font-family: 'Nunito', sans-serif; }
        .admin-header { background: linear-gradient(135deg, #ea1d2c, #b31220); padding: 20px 5vw; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .admin-container { padding: 40px 5vw; max-width: 1400px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 30px; }
        .col-esquerda { flex: 1 1 350px; display: flex; flex-direction: column; gap: 20px; }
        .col-direita { flex: 2 1 600px; display: flex; flex-direction: column; gap: 30px; }
        
        .card { background: white; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .card-title { margin: 0 0 20px 0; color: #0f172a; font-size: 1.25rem; display: flex; align-items: center; gap: 8px; }
        
        .form-group { display: flex; flex-direction: column; gap: 12px; }
        .input-base { padding: 12px 15px; border-radius: 8px; border: 1px solid #cbd5e0; font-size: 1rem; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
        .input-base:focus { outline: none; border-color: #ea1d2c; }
        
        .btn-primary { padding: 12px; background: #0f172a; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background 0.2s; }
        .btn-primary:hover { background: #1e293b; }
        
        .msg-box { padding: 15px; background: #fff; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-weight: 600; }
        
        .pedido-card { border-left: 5px solid #e2e8f0; padding: 20px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .pedido-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 10px; }
        .badge { padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; }
        .badge-aguardando { background: #dbeafe; color: #1e40af; }
        .badge-preparando { background: #fef3c7; color: #b45309; }
        .badge-saiu { background: #e0e7ff; color: #4338ca; }
        .badge-concluido { background: #d1fae5; color: #065f46; }
        
        .btn-status { padding: 8px 16px; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: bold; transition: opacity 0.2s; }
        .btn-status:hover { opacity: 0.9; }
        
        .item-list { border: 1px solid #e2e8f0; border-radius: 10px; padding: 15px; background: #f8fafc; margin-bottom: 15px; }
        .btn-icon { background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; padding: 6px 10px; margin-left: 5px; transition: 0.2s; }
        .btn-icon:hover { background: #f1f5f9; }
      `}</style>

      <div className="admin-layout">
        <header className="admin-header">
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>🏪 Painel do Lojista</h1>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px' }}>Sair</button>
        </header>

        <main className="admin-container">
          
          {/* Lado Esquerdo: Formulários */}
          <div className="col-esquerda">
            {mensagem && <div className="msg-box">{mensagem}</div>}
            
            <div className="card">
              <h3 className="card-title">{editandoRestId ? '✏️ Editar Loja' : '🏠 Nova Loja'}</h3>
              <form onSubmit={handleSalvarRestaurante} className="form-group">
                <input value={nomeRest} onChange={e => setNomeRest(e.target.value)} placeholder="Nome da Loja" required className="input-base" />
                <input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="CNPJ" required className="input-base" />
                <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereço Completo" required className="input-base" />
                <button type="submit" className="btn-primary">{editandoRestId ? 'Salvar Alterações' : 'Cadastrar Loja'}</button>
              </form>
            </div>

            <div className="card">
              <h3 className="card-title">{editandoProdId ? '✏️ Editar Produto' : '🛍️ Novo Produto'}</h3>
              <form onSubmit={handleSalvarProduto} className="form-group">
                <select value={restauranteSelecionado} onChange={e => setRestauranteSelecionado(e.target.value)} required className="input-base">
                  <option value="">Selecione a Loja</option>
                  {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                </select>
                <input value={nomeProd} onChange={e => setNomeProd(e.target.value)} placeholder="Nome do Produto" required className="input-base" />
                <input value={preco} onChange={e => setPreco(e.target.value)} placeholder="Preço (Ex: 29.90)" type="number" step="0.01" required className="input-base" />
                <button type="submit" className="btn-primary">{editandoProdId ? 'Salvar Alterações' : 'Adicionar Produto'}</button>
              </form>
            </div>
          </div>

          {/* Lado Direito: Listas e Pedidos */}
          <div className="col-direita">
            
            <div className="card">
              <h2 className="card-title" style={{ color: '#ea1d2c' }}>🔔 Gestão de Pedidos</h2>
              {pedidos.length === 0 ? <p style={{ color: '#64748b' }}>Nenhum pedido recebido ainda.</p> : (
                <div>
                  {pedidos.map(ped => {
                    const loja = restaurantes.find(r => r.id === ped.restaurante_id);
                    let badgeClass = 'badge-aguardando';
                    let borderCol = '#3b82f6';
                    if(ped.status === 'Preparando') { badgeClass = 'badge-preparando'; borderCol = '#f59e0b'; }
                    if(ped.status === 'Saiu para Entrega') { badgeClass = 'badge-saiu'; borderCol = '#6366f1'; }
                    if(ped.status === 'Concluído') { badgeClass = 'badge-concluido'; borderCol = '#10b981'; }

                    return (
                      <div key={ped.id} className="pedido-card" style={{ borderLeftColor: borderCol }}>
                        <div className="pedido-header">
                          <strong style={{ fontSize: '1.1rem' }}>{ped.cliente_nome}</strong>
                          <span className={`badge ${badgeClass}`}>{ped.status}</span>
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
                          <p style={{ margin: 0 }}><strong>Loja:</strong> {loja ? loja.nome : 'Desconhecida'}</p>
                          <p style={{ margin: 0 }}><strong>Entrega:</strong> 🛵 {ped.tipo_entrega} | <strong>Pagamento:</strong> 💳 {ped.forma_pagamento}</p>
                          <p style={{ margin: '5px 0 0 0', fontSize: '1.1rem', color: '#0f172a' }}><strong>Total: R$ {ped.total.toFixed(2)}</strong></p>
                        </div>
                        
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          {ped.status === 'Aguardando' && <button onClick={() => handleAtualizarStatus(ped.id, 'Preparando')} className="btn-status" style={{ background: '#3b82f6' }}>Aceitar e Preparar</button>}
                          {ped.status === 'Preparando' && <button onClick={() => handleAtualizarStatus(ped.id, 'Saiu para Entrega')} className="btn-status" style={{ background: '#f59e0b' }}>Despachar Pedido</button>}
                          {ped.status === 'Saiu para Entrega' && <button onClick={() => handleAtualizarStatus(ped.id, 'Concluído')} className="btn-status" style={{ background: '#10b981' }}>Marcar como Entregue</button>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="card-title">📦 Seu Catálogo (Lojas e Produtos)</h2>
              <div>
                {restaurantes.map(rest => (
                  <div key={rest.id} className="item-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '12px', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>{rest.nome}</strong>
                      <div>
                        <button onClick={() => prepararEdicaoRestaurante(rest)} className="btn-icon" title="Editar Loja">✏️</button>
                        <button onClick={() => handleExcluirRestaurante(rest.id, rest.nome)} className="btn-icon" title="Excluir Loja">🗑️</button>
                      </div>
                    </div>
                    {produtos.filter(p => p.restaurante_id === rest.id).map(prod => (
                      <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#334155' }}>{prod.nome} <strong style={{ color: '#10b981', marginLeft: '8px' }}>R$ {prod.preco}</strong></span>
                        <div>
                          <button onClick={() => prepararEdicaoProduto(prod)} className="btn-icon">✏️</button>
                          <button onClick={() => handleExcluirProduto(prod.id, prod.nome)} className="btn-icon">🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

export default AdminDashboard;