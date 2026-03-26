// ============================================================
// App.jsx — Ponto de entrada da aplicação
// Responsabilidade: roteamento entre as telas principais.
// Não contém lógica de negócio nem chamadas a APIs.
// ============================================================
import { useState } from 'react';
import { AuthModel } from './models/authModel'; 
import LoginAdmin from './views/Loginadmin';    
import AdminDashboard from './views/Admindashboard'; 
import ClienteApp from './views/Clienteapp';    

function App() {
  const [adminLogado, setAdminLogado] = useState(false);
  const [modoCliente, setModoCliente] = useState(false);

  const handleLogoutAdmin = async () => {
    await AuthModel.logout();
    setAdminLogado(false);
  };

  // 1. Modo cliente (app de delivery)
  if (modoCliente) {
    return <ClienteApp onLogout={() => setModoCliente(false)} />;
  }

  // 2. Admin autenticado → painel
  if (adminLogado) {
    return <AdminDashboard onLogout={handleLogoutAdmin} />;
  }

  // 3. Tela de login do admin com botão "Entrar como Cliente"
  return (
    <div>
      <LoginAdmin onLoginSucesso={() => setAdminLogado(true)} />

      <div style={clienteBtnWrapper}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#64748b' }}>
          Apenas querendo pedir comida?
        </p>
        <button onClick={() => setModoCliente(true)} style={clienteBtn}>
          🛍️ Entrar como Cliente
        </button>
      </div>
    </div>
  );
}

// Estilos inline simples para o botão de acesso como cliente
const clienteBtnWrapper = {
  position: 'fixed',
  bottom: '2rem',
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  zIndex: 100,
  background: 'white',
  padding: '1rem 1.5rem',
  borderRadius: '1.25rem',
  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
  border: '1px solid #e2e8f0',
  minWidth: '260px',
};

const clienteBtn = {
  background: '#10b981',
  color: 'white',
  border: 'none',
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  fontWeight: '600',
  fontSize: '1rem',
  cursor: 'pointer',
};

export default App;