// src/Restaurantes.jsx
import { useState } from 'react';

function Restaurantes({ onLogout }) {
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [mensagem, setMensagem] = useState('');

  const [nomeRest, setNomeRest] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');

  const [nomeProd, setNomeProd] = useState('');
  const [preco, setPreco] = useState('');
  const [restauranteSelecionado, setRestauranteSelecionado] = useState('');

  const handleCadastrarRestaurante = (e) => {
    e.preventDefault();
    if (restaurantes.find(r => r.cnpj === cnpj)) {
      setMensagem('Erro: CNPJ já cadastrado no sistema!');
      return;
    }
    const novoRestaurante = { 
      id: Date.now().toString(), 
      nome: nomeRest, 
      cnpj, 
      endereco, 
      lat: (Math.random() * -10).toFixed(4), 
      lng: (Math.random() * -50).toFixed(4) 
    };
    setRestaurantes([...restaurantes, novoRestaurante]);
    setMensagem(`Loja "${nomeRest}" cadastrada com sucesso!`);
    setNomeRest(''); setCnpj(''); setEndereco('');
  };

  const handleCadastrarProduto = (e) => {
    e.preventDefault();
    if (!restauranteSelecionado) {
      setMensagem('Erro: Selecione uma loja!');
      return;
    }
    const novoProduto = { 
      id: Date.now().toString(), 
      nome: nomeProd, 
      preco: parseFloat(preco).toFixed(2), 
      restauranteId: restauranteSelecionado 
    };
    setProdutos([...produtos, novoProduto]);
    setMensagem(`Produto "${nomeProd}" adicionado ao catálogo!`);
    setNomeProd(''); setPreco('');
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .dashboard-layout { 
          min-height: 100vh; 
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        }

        .dashboard-header { 
          position: sticky; 
          top: 0; 
          z-index: 50; 
          background: linear-gradient(135deg, #dc2626, #b91c1c); 
          padding: 1rem 5%; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          color: white; 
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
          backdrop-filter: blur(10px);
        }

        .dashboard-main { 
          width: 100%; 
          padding: 2rem 5%; 
          max-width: 2000px;
          margin: 0 auto;
        }

        .dashboard-grid { 
          display: grid; 
          grid-template-columns: 1fr; 
          gap: 2rem; 
        }

        @media (min-width: 1024px) {
          .dashboard-grid { 
            grid-template-columns: 400px 1fr; 
            gap: 2.5rem; 
          }
        }

        @media (min-width: 1600px) {
          .dashboard-grid { 
            grid-template-columns: 450px 1fr; 
            gap: 3rem; 
          }
        }

        .form-card { 
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 2rem; 
          border-radius: 1.5rem; 
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.5);
          transition: transform 0.3s ease;
        }

        .form-card:hover {
          transform: translateY(-2px);
        }

        .catalog-card { 
          background: white;
          padding: 2rem; 
          border-radius: 1.5rem; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .restaurant-card {
          background: linear-gradient(135deg, #ffffff, #fafafa);
          border: 1px solid #e2e8f0;
          border-radius: 1.25rem;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .restaurant-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -15px rgba(220, 38, 38, 0.2);
          border-color: #dc2626;
        }

        .product-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s;
          border-radius: 0.5rem;
        }

        .product-item:hover {
          background: #f8fafc;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: #f8fafc;
          border-radius: 1rem;
          border: 2px dashed #e2e8f0;
        }
      `}</style>

      <div className="dashboard-layout">
        <header className="dashboard-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))' }}>🍔</span>
            <div>
              <h1 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                FoodExpress 
                <span style={{ fontWeight: '400', opacity: 0.8, marginLeft: '0.5rem' }}>Parceiros</span>
              </h1>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              backgroundColor: 'rgba(255,255,255,0.15)', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '2rem',
              backdropFilter: 'blur(5px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              ADMIN
            </span>
            
            <button 
              onClick={onLogout} 
              style={{ 
                background: 'rgba(255,255,255,0.1)', 
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white', 
                cursor: 'pointer', 
                padding: '0.5rem 1.25rem',
                borderRadius: '2rem',
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.3s',
                backdropFilter: 'blur(5px)'
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              <span>🚪</span> Sair
            </button>
          </div>
        </header>

        <main className="dashboard-main">
          {mensagem && (
            <div style={{ 
              padding: '1rem 1.5rem', 
              borderRadius: '1rem', 
              marginBottom: '2rem', 
              fontWeight: '600', 
              fontSize: '0.95rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              animation: 'slideDown 0.3s ease',
              ...(mensagem.startsWith('Erro') 
                ? { 
                    backgroundColor: '#fef2f2', 
                    color: '#991b1b', 
                    border: '1px solid #fecaca',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                  } 
                : { 
                    backgroundColor: '#f0fdf4', 
                    color: '#166534', 
                    border: '1px solid #bbf7d0',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.1)'
                  })
            }}>
              <span style={{ fontSize: '1.25rem' }}>{mensagem.startsWith('Erro') ? '⚠️' : '✅'}</span>
              {mensagem}
            </div>
          )}

          <div className="dashboard-grid">
            {/* Coluna Esquerda - Formulários */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Formulário de Loja */}
              <div className="form-card">
                <h3 style={{ 
                  margin: '0 0 1.5rem 0', 
                  fontSize: '1.5rem', 
                  color: '#0f172a', 
                  fontWeight: '700', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  borderBottom: '2px solid #f1f5f9',
                  paddingBottom: '1rem'
                }}>
                  <span style={{ fontSize: '2rem' }}>🏪</span>
                  Nova Loja
                </h3>
                
                <form onSubmit={handleCadastrarRestaurante} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🏢</span>
                    <input 
                      style={{ ...inputStyle, paddingLeft: '3rem' }} 
                      placeholder="Nome do Estabelecimento" 
                      value={nomeRest} 
                      onChange={e => setNomeRest(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>📋</span>
                    <input 
                      style={{ ...inputStyle, paddingLeft: '3rem' }} 
                      placeholder="CNPJ (apenas números)" 
                      value={cnpj} 
                      onChange={e => setCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))} 
                      required 
                    />
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>📍</span>
                    <input 
                      style={{ ...inputStyle, paddingLeft: '3rem' }} 
                      placeholder="Endereço Completo" 
                      value={endereco} 
                      onChange={e => setEndereco(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <button 
                    style={btnPrimaryStyle} 
                    type="submit"
                    onMouseEnter={e => e.target.style.background = '#1e293b'}
                    onMouseLeave={e => e.target.style.background = '#0f172a'}
                  >
                    Cadastrar Loja
                  </button>
                </form>
              </div>

              {/* Formulário de Produto */}
              <div className="form-card">
                <h3 style={{ 
                  margin: '0 0 1.5rem 0', 
                  fontSize: '1.5rem', 
                  color: '#0f172a', 
                  fontWeight: '700', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  borderBottom: '2px solid #f1f5f9',
                  paddingBottom: '1rem'
                }}>
                  <span style={{ fontSize: '2rem' }}>🛍️</span>
                  Novo Produto
                </h3>
                
                <form onSubmit={handleCadastrarProduto} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🏪</span>
                    <select 
                      style={{ ...inputStyle, paddingLeft: '3rem', appearance: 'none', cursor: 'pointer' }} 
                      value={restauranteSelecionado} 
                      onChange={e => setRestauranteSelecionado(e.target.value)} 
                      required
                    >
                      <option value="">Selecione a Loja</option>
                      {restaurantes.map(r => (
                        <option key={r.id} value={r.id}>{r.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>📦</span>
                    <input 
                      style={{ ...inputStyle, paddingLeft: '3rem' }} 
                      placeholder="Nome do Produto" 
                      value={nomeProd} 
                      onChange={e => setNomeProd(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>💰</span>
                    <input 
                      style={{ ...inputStyle, paddingLeft: '3rem' }} 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="Preço (R$)" 
                      value={preco} 
                      onChange={e => setPreco(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <button 
                    style={{...btnPrimaryStyle, background: '#dc2626'}}
                    type="submit"
                    onMouseEnter={e => e.target.style.background = '#b91c1c'}
                    onMouseLeave={e => e.target.style.background = '#dc2626'}
                  >
                    Adicionar ao Cardápio
                  </button>
                </form>
              </div>
            </div>

            {/* Coluna Direita - Catálogo */}
            <div className="catalog-card">
              <div style={{ 
                borderBottom: '2px solid #f1f5f9', 
                paddingBottom: '1.5rem', 
                marginBottom: '2rem' 
              }}>
                <h3 style={{ 
                  margin: '0 0 0.5rem 0', 
                  fontSize: 'clamp(1.25rem, 4vw, 1.75rem)', 
                  color: '#0f172a', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '1rem' 
                }}>
                  <span style={{ fontSize: '2rem' }}>📱</span>
                  Catálogo do App
                </h3>
                <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
                  Visualização em tempo real - {restaurantes.length} {restaurantes.length === 1 ? 'loja' : 'lojas'} cadastrada{restaurantes.length !== 1 && 's'}
                </p>
              </div>
              
              {restaurantes.length === 0 ? (
                <div className="empty-state">
                  <span style={{ fontSize: '5rem', opacity: 0.5, display: 'block', marginBottom: '1rem' }}>🍽️</span>
                  <p style={{ fontSize: '1.25rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
                    O catálogo está vazio
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>
                    Cadastre uma loja ao lado para começar.
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', 
                  gap: '1.5rem' 
                }}>
                  {restaurantes.map(rest => (
                    <div key={rest.id} className="restaurant-card">
                      <div style={{ 
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)', 
                        padding: '1.25rem',
                        color: 'white'
                      }}>
                        <h4 style={{ 
                          margin: 0, 
                          fontSize: '1.25rem', 
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>🏪</span> {rest.nome}
                        </h4>
                      </div>
                      
                      <div style={{ padding: '1.25rem' }}>
                        <div style={{ 
                          background: '#f8fafc', 
                          padding: '0.75rem', 
                          borderRadius: '0.75rem',
                          marginBottom: '1.25rem',
                          fontSize: '0.875rem'
                        }}>
                          <p style={{ margin: '0.25rem 0', color: '#475569' }}>
                            <strong>CNPJ:</strong> {rest.cnpj}
                          </p>
                          <p style={{ margin: '0.25rem 0', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <span>📍</span> {rest.endereco}
                          </p>
                        </div>
                        
                        <div>
                          <p style={{ 
                            margin: '0 0 1rem 0', 
                            fontSize: '0.875rem', 
                            fontWeight: '700', 
                            textTransform: 'uppercase', 
                            color: '#64748b',
                            letterSpacing: '0.5px'
                          }}>
                            Cardápio ({produtos.filter(p => p.restauranteId === rest.id).length})
                          </p>
                          
                          {produtos.filter(p => p.restauranteId === rest.id).length === 0 ? (
                            <p style={{ 
                              fontSize: '0.875rem', 
                              color: '#94a3b8', 
                              fontStyle: 'italic', 
                              margin: 0,
                              padding: '0.75rem',
                              background: '#f8fafc',
                              borderRadius: '0.75rem',
                              textAlign: 'center'
                            }}>
                              Nenhum produto cadastrado
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {produtos
                                .filter(p => p.restauranteId === rest.id)
                                .sort((a, b) => a.nome.localeCompare(b.nome))
                                .map(prod => (
                                  <div key={prod.id} className="product-item">
                                    <span style={{ color: '#334155', fontWeight: '500' }}>{prod.nome}</span>
                                    <span style={{ 
                                      fontWeight: '700', 
                                      color: '#059669',
                                      background: '#ecfdf5',
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '1rem',
                                      fontSize: '0.875rem'
                                    }}>
                                      R$ {prod.preco}
                                    </span>
                                  </div>
                              ))}
                            </div>
                          )}
                        </div>
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

const inputStyle = { 
  height: '3.25rem', 
  width: '100%',
  padding: '0 1.25rem', 
  borderRadius: '1rem', 
  border: '2px solid #e2e8f0', 
  fontSize: '1rem', 
  backgroundColor: '#ffffff', 
  outline: 'none', 
  color: '#1e293b', 
  transition: 'all 0.2s',
  boxSizing: 'border-box'
};

const btnPrimaryStyle = { 
  height: '3.25rem', 
  borderRadius: '1rem', 
  border: 'none', 
  background: '#0f172a', 
  color: 'white', 
  fontSize: '1rem', 
  fontWeight: '700', 
  cursor: 'pointer', 
  transition: 'all 0.3s',
  width: '100%',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)'
};

export default Restaurantes;