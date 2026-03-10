import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 

function Restaurantes({ onLogout }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState('');

  // Estados dos formulários
  const [nomeRest, setNomeRest] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  
  const [nomeProd, setNomeProd] = useState('');
  const [preco, setPreco] = useState('');
  const [restauranteSelecionado, setRestauranteSelecionado] = useState('');

  // Estados de Edição (Guardam o ID do que está sendo editado)
  const [editandoRestId, setEditandoRestId] = useState(null);
  const [editandoProdId, setEditandoProdId] = useState(null);

  // ==========================================
  // 1. READ (Buscar do Banco)
  // ==========================================
  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    const { data: rests } = await supabase.from('restaurantes').select('*');
    if (rests) setRestaurantes(rests);

    const { data: prods } = await supabase.from('produtos').select('*');
    if (prods) setProdutos(prods);
  };

  // ==========================================
  // FUNÇÃO DE GEOLOCALIZAÇÃO (OpenStreetMap)
  // ==========================================
  const obterCoordenadas = async (enderecoDigitado) => {
    try {
      // Faz a requisição para a API pública do Nominatim
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoDigitado)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        // Retorna o primeiro resultado encontrado
        return {
          lat: parseFloat(data[0].lat).toFixed(6),
          lng: parseFloat(data[0].lon).toFixed(6)
        };
      } else {
        return null; // Endereço não encontrado
      }
    } catch (error) {
      console.error("Erro ao buscar coordenadas:", error);
      return null;
    }
  };

  // ==========================================
  // 2. CREATE & UPDATE (Restaurante)
  // ==========================================
  const handleSalvarRestaurante = async (e) => {
    e.preventDefault();
    setMensagem('📍 Buscando coordenadas no mapa...');

    // Busca as coordenadas reais antes de salvar no banco
    const coordenadas = await obterCoordenadas(endereco);
    
    if (!coordenadas) {
      return setMensagem('⚠️ Erro: Endereço não encontrado no mapa. Tente ser mais específico (Ex: Avenida Paulista, 1578, São Paulo).');
    }
    
    if (editandoRestId) {
      // UPDATE (Atualizar)
      const { data, error } = await supabase
        .from('restaurantes')
        .update({ 
          nome: nomeRest, 
          cnpj, 
          endereco,
          latitude: coordenadas.lat,
          longitude: coordenadas.lng
        })
        .eq('id', editandoRestId)
        .select();

      if (error) return setMensagem(`Erro ao atualizar: ${error.message}`);
      
      setRestaurantes(restaurantes.map(r => r.id === editandoRestId ? data[0] : r));
      setMensagem(`Loja "${nomeRest}" atualizada com sucesso!`);
      setEditandoRestId(null);
    } else {
      // CREATE (Inserir Novo)
      const { data, error } = await supabase
        .from('restaurantes')
        .insert([{ 
          nome: nomeRest, 
          cnpj, 
          endereco, 
          latitude: coordenadas.lat, 
          longitude: coordenadas.lng 
        }])
        .select();

      if (error) {
        if (error.code === '23505' || error.message.includes('restaurantes_cnpj_key')) {
          setMensagem('⚠️ Erro: Este CNPJ já está cadastrado no sistema!');
        } else {
          setMensagem(`Erro ao cadastrar: ${error.message}`);
        }
        return;
      }

      setRestaurantes([...restaurantes, data[0]]);
      setMensagem(`Loja "${nomeRest}" cadastrada com sucesso (Lat: ${coordenadas.lat}, Lng: ${coordenadas.lng}) ✅`);
    }

    // Limpa formulário
    setNomeRest(''); setCnpj(''); setEndereco('');
  };

  // ==========================================
  // 3. CREATE & UPDATE (Produto)
  // ==========================================
  const handleSalvarProduto = async (e) => {
    e.preventDefault();
    if (!restauranteSelecionado) return setMensagem('Erro: Selecione uma loja!');

    if (editandoProdId) {
      // UPDATE (Atualizar)
      const { data, error } = await supabase
        .from('produtos')
        .update({ nome: nomeProd, preco: parseFloat(preco), restaurante_id: restauranteSelecionado })
        .eq('id', editandoProdId)
        .select();

      if (error) return setMensagem(`Erro ao atualizar produto: ${error.message}`);

      setProdutos(produtos.map(p => p.id === editandoProdId ? data[0] : p));
      setMensagem(`Produto "${nomeProd}" atualizado!`);
      setEditandoProdId(null);
    } else {
      // CREATE (Inserir Novo)
      const { data, error } = await supabase
        .from('produtos')
        .insert([{ nome: nomeProd, preco: parseFloat(preco), restaurante_id: restauranteSelecionado }])
        .select();

      if (error) return setMensagem(`Erro ao cadastrar produto: ${error.message}`);

      setProdutos([...produtos, data[0]]);
      setMensagem(`Produto "${nomeProd}" salvo no banco!`);
    }

    setNomeProd(''); setPreco('');
  };

  // ==========================================
  // 4. DELETE (Excluir) e PREPARAR EDIÇÃO
  // ==========================================
  const handleExcluirRestaurante = async (id, nome) => {
    if(!window.confirm(`Tem certeza que deseja apagar a loja ${nome} e todos os seus produtos?`)) return;
    
    const { error } = await supabase.from('restaurantes').delete().eq('id', id);
    if (error) return setMensagem(`Erro ao excluir: ${error.message}`);
    
    setRestaurantes(restaurantes.filter(r => r.id !== id));
    setProdutos(produtos.filter(p => p.restaurante_id !== id)); // Remove produtos vinculados da tela
    setMensagem(`Loja "${nome}" excluída com sucesso.`);
  };

  const handleExcluirProduto = async (id, nome) => {
    if(!window.confirm(`Deseja remover o produto ${nome}?`)) return;
    
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) return setMensagem(`Erro ao excluir: ${error.message}`);
    
    setProdutos(produtos.filter(p => p.id !== id));
    setMensagem(`Produto "${nome}" removido do cardápio.`);
  };

  const prepararEdicaoRestaurante = (rest) => {
    setNomeRest(rest.nome); setCnpj(rest.cnpj); setEndereco(rest.endereco);
    setEditandoRestId(rest.id);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe a tela suavemente
  };

  const prepararEdicaoProduto = (prod) => {
    setNomeProd(prod.nome); setPreco(prod.preco); setRestauranteSelecionado(prod.restaurante_id);
    setEditandoProdId(prod.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // INTERFACE (UI)
  // ==========================================
  return (
    <>
      <style>{`
        .dashboard-layout { min-height: 100vh; background-color: #f1f5f9; font-family: 'Nunito', sans-serif; overflow-x: hidden; }
        .dashboard-header { position: sticky; top: 0; z-index: 10; background: linear-gradient(135deg, #ea1d2c, #b31220); padding: 15px 4vw; display: flex; justify-content: space-between; align-items: center; color: white; box-shadow: 0 4px 20px rgba(234, 29, 44, 0.2); }
        .dashboard-main { width: 100%; padding: 40px 4vw; box-sizing: border-box; }
        .dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 30px; margin-top: 20px; align-items: start; }
        @media (min-width: 1024px) { .dashboard-grid { grid-template-columns: 400px 1fr; gap: 40px; } }
        @media (min-width: 1600px) { .dashboard-grid { grid-template-columns: 450px 1fr; gap: 50px; } }
        .card { background-color: white; padding: 30px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #e2e8f0; }
        .app-view-card { background-color: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; min-height: 600px; }
        .action-btn { background: transparent; border: none; cursor: pointer; padding: 5px; border-radius: 6px; transition: 0.2s; }
        .action-btn:hover { background: #f1f5f9; transform: scale(1.1); }
      `}</style>

      <div className="dashboard-layout">
        
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🏪</span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>FoodExpress <span style={{fontWeight: '400', opacity: 0.8}}>| Parceiros</span></h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: '20px' }}>ADMINISTRADOR</span>
            <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚪 <span style={{fontSize: '14px', fontWeight: 'bold'}}>Sair</span>
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          
          {mensagem && (
            <div style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '25px', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', ...(mensagem.includes('Erro') || mensagem.includes('⚠️') ? { backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #f87171' } : { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #34d399' }) }}>
              {mensagem.includes('Erro') || mensagem.includes('⚠️') ? '⚠️' : '✅'} {mensagem}
            </div>
          )}

          <div className="dashboard-grid">
            
            {/* FORMULÁRIOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              <div className="card" style={editandoRestId ? {border: '2px solid #ea1d2c'} : {}}>
                <h3 style={cardTitleStyle}>{editandoRestId ? '✏️ Editando Loja' : '🏠 Nova Loja'}</h3>
                <form onSubmit={handleSalvarRestaurante} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <input style={inputStyle} placeholder="Nome do Estabelecimento" value={nomeRest} onChange={e => setNomeRest(e.target.value)} required />
                  <input style={inputStyle} placeholder="CNPJ (Apenas números)" value={cnpj} onChange={e => setCnpj(e.target.value)} required />
                  <input style={inputStyle} placeholder="Endereço Completo" value={endereco} onChange={e => setEndereco(e.target.value)} required />
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button style={btnPrimaryStyle} type="submit">{editandoRestId ? 'Salvar Alterações' : 'Cadastrar Loja'}</button>
                    {editandoRestId && (
                      <button type="button" onClick={() => {setEditandoRestId(null); setNomeRest(''); setCnpj(''); setEndereco('');}} style={{...btnPrimaryStyle, background: '#64748b', flex: 0.4}}>Cancelar</button>
                    )}
                  </div>
                </form>
              </div>

              <div className="card" style={editandoProdId ? {border: '2px solid #ea1d2c'} : {}}>
                <h3 style={cardTitleStyle}>{editandoProdId ? '✏️ Editando Produto' : '🛍️ Novo Produto'}</h3>
                <form onSubmit={handleSalvarProduto} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <select style={inputStyle} value={restauranteSelecionado} onChange={e => setRestauranteSelecionado(e.target.value)} required>
                    <option value="">Selecione a Loja</option>
                    {restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                  <input style={inputStyle} placeholder="Nome do Produto (Ex: Pizza)" value={nomeProd} onChange={e => setNomeProd(e.target.value)} required />
                  <input style={inputStyle} type="number" step="0.01" placeholder="Preço (R$)" value={preco} onChange={e => setPreco(e.target.value)} required />
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button style={{...btnPrimaryStyle, background: '#ea1d2c'}} type="submit">{editandoProdId ? 'Salvar Produto' : 'Adicionar ao Cardápio'}</button>
                    {editandoProdId && (
                      <button type="button" onClick={() => {setEditandoProdId(null); setNomeProd(''); setPreco(''); setRestauranteSelecionado('');}} style={{...btnPrimaryStyle, background: '#64748b', flex: 0.4}}>Cancelar</button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* LISTAGEM (O APP) */}
            <div className="app-view-card">
              <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '25px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '22px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  📱 Catálogo do App
                </h3>
                <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>Lendo diretamente do Supabase PostgreSQL.</p>
              </div>
              
              {restaurantes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                  <span style={{ fontSize: '50px', opacity: 0.3 }}>🍽️</span>
                  <p style={{ marginTop: '15px', fontSize: '18px', fontWeight: '600' }}>O catálogo está vazio</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {restaurantes.map(rest => (
                    <div key={rest.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: '#f8fafc' }}>
                      
                      {/* Cabecalho do Card (Loja) */}
                      <div style={{ backgroundColor: '#fff', padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a', fontWeight: '800' }}>{rest.nome}</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' }}>CNPJ: {rest.cnpj}</p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#64748b' }}>📍 {rest.endereco}</p>
                          </div>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button className="action-btn" onClick={() => prepararEdicaoRestaurante(rest)} title="Editar Loja">✏️</button>
                            <button className="action-btn" onClick={() => handleExcluirRestaurante(rest.id, rest.nome)} title="Excluir Loja">🗑️</button>
                          </div>
                        </div>

                        {/* MINI MAPA INTUITIVO */}
                        {rest.latitude && rest.longitude && (
                          <div style={{ marginTop: '15px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '140px', backgroundColor: '#e2e8f0' }}>
                            <iframe
                              width="100%"
                              height="100%"
                              frameBorder="0"
                              scrolling="no"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(rest.longitude) - 0.005},${parseFloat(rest.latitude) - 0.005},${parseFloat(rest.longitude) + 0.005},${parseFloat(rest.latitude) + 0.005}&layer=mapnik&marker=${rest.latitude},${rest.longitude}`}
                              style={{ border: 'none' }}
                            ></iframe>
                          </div>
                        )}

                      </div>

                      {/* Corpo do Card (Produtos) */}
                      <div style={{ padding: '20px' }}>
                        <p style={{ margin: '0 0 15px 0', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '1px' }}>Cardápio</p>
                        {produtos.filter(p => p.restaurante_id === rest.id).length === 0 ? (
                          <p style={{ fontSize: '14px', color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>Sem produtos.</p>
                        ) : (
                          produtos.filter(p => p.restaurante_id === rest.id).map(prod => (
                            <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0', fontSize: '15px' }}>
                              <div>
                                <span style={{ color: '#334155', fontWeight: '500', display: 'block' }}>{prod.nome}</span>
                                <span style={{ fontWeight: '800', color: '#10b981', fontSize: '14px' }}>R$ {prod.preco}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '2px' }}>
                                <button className="action-btn" onClick={() => prepararEdicaoProduto(prod)} title="Editar Produto">✏️</button>
                                <button className="action-btn" onClick={() => handleExcluirProduto(prod.id, prod.nome)} title="Excluir Produto">🗑️</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

const cardTitleStyle = { margin: '0 0 25px 0', fontSize: '20px', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' };
const inputStyle = { height: '52px', padding: '0 18px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '15px', backgroundColor: '#f8fafc', outline: 'none', color: '#1e293b', transition: 'border 0.2s', width: '100%', boxSizing: 'border-box' };
const btnPrimaryStyle = { flex: 1, height: '52px', borderRadius: '12px', border: 'none', background: '#0f172a', color: 'white', fontSize: '16px', fontWeight: '800', cursor: 'pointer', transition: '0.2s', marginTop: '10px' };

export default Restaurantes;