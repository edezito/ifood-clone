// ============================================================
// App.jsx — FoodExpress (iFood Clone)
// Roteamento entre as telas principais.
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

  if (modoCliente) {
    return <ClienteApp onLogout={() => setModoCliente(false)} />;
  }

  if (adminLogado) {
    return <AdminDashboard onLogout={handleLogoutAdmin} />;
  }

  return (
    <div>
      <LoginAdmin onLoginSucesso={() => setAdminLogado(true)} />

      <div style={clienteBtnWrapper}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#6b7280' }}>
          Apenas querendo pedir comida?
        </p>
        <button onClick={() => setModoCliente(true)} style={clienteBtn}>
          🛍️ Entrar como Cliente
        </button>
      </div>
    </div>
  );
}

const clienteBtnWrapper = {
  position: 'fixed',
  bottom: '2rem',
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  zIndex: 100,
  background: 'white',
  padding: '1rem 1.5rem',
  borderRadius: '1rem',
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
  border: '1px solid #e5e7eb',
  minWidth: '260px',
};

const clienteBtn = {
  background: '#EA1D2C',
  color: 'white',
  border: 'none',
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '0.75rem',
  fontWeight: '700',
  fontSize: '1rem',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(234,29,44,0.3)',
  fontFamily: 'DM Sans, sans-serif',
};

export default App;