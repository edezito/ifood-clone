import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 

function AdminDashboard({ onLogout }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
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
    setMensagem('📍 Buscando coordenadas no mapa...');
    const coordenadas = await obterCoordenadas(endereco);
    if (!coordenadas) return setMensagem('⚠️ Erro: Endereço não encontrado no mapa.');
    
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

  const prepararEdicaoRestaurante = (rest) => { setNomeRest(rest.nome); setCnpj(rest.cnpj); setEndereco(rest.endereco); setEditandoRestId(rest.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const prepararEdicaoProduto = (prod) => { setNomeProd(prod.nome); setPreco(prod.preco); setRestauranteSelecionado(prod.restaurante_id); setEditandoProdId(prod.id); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Nunito, sans-serif' }}>
      <header style={{ background: 'linear-gradient(135deg, #ea1d2c, #b31220)', padding: '15px 4vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
        <h1 style={{ fontSize: '22px', margin: 0 }}>🏪 Painel do Lojista</h1>
        <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>Sair</button>
      </header>

      <main style={{ padding: '40px 4vw', display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px' }}>
        
        {/* Lado Esquerdo: Formulários */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mensagem && <div style={{ padding: '15px', background: '#fff', borderRadius: '10px', border: '1px solid #cbd5e0' }}>{mensagem}</div>}
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>{editandoRestId ? '✏️ Editar Loja' : '🏠 Nova Loja'}</h3>
            <form onSubmit={handleSalvarRestaurante} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input value={nomeRest} onChange={e => setNomeRest(e.target.value)} placeholder="Nome" required style={inputStyle} />
              <input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="CNPJ" required style={inputStyle} />
              <input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Endereço" required style={inputStyle} />
              <button type="submit" style={btnStyle}>{editandoRestId ? 'Salvar' : 'Cadastrar'}</button>
            </form>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>{editandoProdId ? '✏️ Editar Produto' : '🛍️ Novo Produto'}</h3>
            <form onSubmit={handleSalvarProduto} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select value={restauranteSelecionado} onChange={e => setRestauranteSelecionado(e.target.value)} required style={inputStyle}>
                <option value="">Selecione a Loja</option>
                {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
              </select>
              <input value={nomeProd} onChange={e => setNomeProd(e.target.value)} placeholder="Produto" required style={inputStyle} />
              <input value={preco} onChange={e => setPreco(e.target.value)} placeholder="Preço" type="number" step="0.01" required style={inputStyle} />
              <button type="submit" style={btnStyle}>{editandoProdId ? 'Salvar' : 'Adicionar'}</button>
            </form>
          </div>
        </div>

        {/* Lado Direito: Gerenciamento (Sem Carrinho) */}
        <div style={{ background: 'white', padding: '30px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginTop: 0 }}>Suas Lojas Cadastradas</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {restaurantes.map(rest => (
              <div key={rest.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '10px' }}>
                  <strong>{rest.nome}</strong>
                  <div>
                    <button onClick={() => prepararEdicaoRestaurante(rest)} style={actionBtn}>✏️</button>
                    <button onClick={() => handleExcluirRestaurante(rest.id, rest.nome)} style={actionBtn}>🗑️</button>
                  </div>
                </div>
                {produtos.filter(p => p.restaurante_id === rest.id).map(prod => (
                  <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '14px' }}>
                    <span>{prod.nome} - R$ {prod.preco}</span>
                    <div>
                      <button onClick={() => prepararEdicaoProduto(prod)} style={actionBtn}>✏️</button>
                      <button onClick={() => handleExcluirProduto(prod.id, prod.nome)} style={actionBtn}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', width: '100%', boxSizing: 'border-box' };
const btnStyle = { padding: '12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const actionBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' };

export default AdminDashboard;