// ============================================================
// VIEW: LoginAdmin
// Responsabilidade: tela de login do administrador via Firebase.
// Toda a lógica foi movida para useAuthAdminController.
// ============================================================
import React from 'react';
import { useAuthAdminController } from '../controllers/useAuthController';

function LoginAdmin({ onLoginSucesso }) {
  const ctrl = useAuthAdminController(onLoginSucesso);

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-20px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .login-page            { display: flex; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .login-banner          { display: none; }
        .login-form-container  { flex: 1; display: flex; align-items: center; justify-content: center; padding: 1.5rem; animation: slideIn 0.6s ease-out; }
        .form-wrapper          { width: 100%; max-width: 440px; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 2rem; padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.5); }

        @media (min-width: 1024px) {
          .login-page            { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
          .login-banner          { display: flex; flex: 1.2; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; flex-direction: column; justify-content: center; align-items: center; padding: 3rem; text-align: center; box-shadow: 20px 0 40px -15px rgba(220,38,38,0.3); position: relative; overflow: hidden; }
          .login-banner::before  { content: ''; position: absolute; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%); animation: float 6s ease-in-out infinite; }
          .login-form-container  { flex: 1; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        }

        .floating-food  { animation: float 3s ease-in-out infinite; }
        .input-group    { position: relative; margin-bottom: 1.25rem; }
        .input-icon     { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.25rem; }
        .toggle-link    { color: #dc2626; cursor: pointer; font-weight: 600; transition: all 0.3s; position: relative; }
        .toggle-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: #dc2626; transition: width 0.3s; }
        .toggle-link:hover::after { width: 100%; }
        .btn-cliente    { background: #10b981; color: white; border: none; width: 100%; padding: 1rem; border-radius: 1rem; font-weight: 600; font-size: 1rem; cursor: pointer; transition: 0.3s; margin-top: 1rem; }
        .btn-cliente:hover { background: #059669; transform: translateY(-2px); }
      `}</style>

      <div className="login-page">
        {/* Banner Desktop */}
        <div className="login-banner">
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div className="floating-food" style={{ fontSize: '8rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' }}>
              🍔
            </div>
            <h1 style={{ fontSize: 'clamp(3rem,6vw,4.5rem)', fontWeight: '900', margin: '0 0 1rem 0', letterSpacing: '-2px', textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
              FoodExpress
            </h1>
            <p style={{ fontSize: 'clamp(1rem,2vw,1.25rem)', maxWidth: '500px', lineHeight: '1.8', opacity: 0.95, margin: '0 auto' }}>
              Sistema completo para gestão de parceiros e catálogos
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', marginTop: '3rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
              {['🚀', '💼', '📊'].map((emoji, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emoji}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{['Agilidade','Segurança','Análises'][i]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="login-form-container">
          <div className="form-wrapper">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 20px -5px rgba(220,38,38,0.4)' }}>
                <span style={{ fontSize: '2.5rem' }}>🍔</span>
              </div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: '800', color: '#0f172a' }}>
                Bem-vindo(a)
              </h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
                {ctrl.isLogin ? 'Acesse o painel administrativo' : 'Crie sua conta corporativa'}
              </p>
            </div>

            <form onSubmit={ctrl.handleSubmitEmail}>
              <div className="input-group">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  placeholder="E-mail corporativo"
                  value={ctrl.email}
                  onChange={(e) => ctrl.setEmail(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={ctrl.senha}
                  onChange={(e) => ctrl.setSenha(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <button type="submit" style={btnPrimaryStyle}>
                {ctrl.isLogin ? 'Entrar no Painel' : 'Criar Conta'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0' }}>
              <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg,transparent,#e2e8f0,transparent)' }} />
              <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: '600' }}>ou</span>
              <div style={{ flex: 1, height: '2px', background: 'linear-gradient(90deg,transparent,#e2e8f0,transparent)' }} />
            </div>

            <button onClick={ctrl.handleGoogleLogin} style={btnGoogleStyle}>
              <svg style={{ width: '1.5rem', height: '1.5rem' }} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            {ctrl.mensagem && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '1rem', fontSize: '0.875rem', textAlign: 'center', border: '1px solid #fecaca' }}>
                ⚠️ {ctrl.mensagem}
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.95rem', color: '#64748b' }}>
              {ctrl.isLogin ? 'Ainda não tem acesso? ' : 'Já faz parte do time? '}
              <span onClick={ctrl.alternarModo} className="toggle-link">
                {ctrl.isLogin ? 'Cadastre-se' : 'Faça login'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  height: '3.5rem', width: '100%', padding: '0 1.25rem 0 3rem',
  borderRadius: '1rem', border: '2px solid #e2e8f0', fontSize: '1rem',
  outline: 'none', backgroundColor: '#ffffff', transition: 'all 0.3s', boxSizing: 'border-box',
};
const btnPrimaryStyle = {
  height: '3.5rem', width: '100%', borderRadius: '1rem', border: 'none',
  background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white',
  fontSize: '1rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s',
  boxShadow: '0 10px 20px -5px rgba(220,38,38,0.4)',
};
const btnGoogleStyle = {
  width: '100%', height: '3.5rem', borderRadius: '1rem', border: '2px solid #e2e8f0',
  backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '0.75rem', fontSize: '1rem', fontWeight: '600', color: '#1e293b', cursor: 'pointer', transition: 'all 0.3s',
};

export default LoginAdmin;