// ============================================================
// VIEW: LoginAdmin — FoodExpress (iFood Clone)
// Design: Split layout. Dark red left, white right.
// ============================================================
import React from 'react';
import { useAuthAdminController } from '../controllers/useAuthController';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
:root {
  --primary: #EA1D2C;
  --primary-dark: #C8101E;
  --dark-bg: #2B1A1A;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DM Sans',sans-serif; }

.login-field {
  width:100%; padding:14px 16px;
  border:1.5px solid #e5e7eb; border-radius:12px;
  background:#fff; font-family:'DM Sans',sans-serif; font-size:15px;
  color:#1f2937; outline:none;
  transition:border-color 0.2s, box-shadow 0.2s;
}
.login-field:focus {
  border-color:var(--primary);
  box-shadow:0 0 0 3px rgba(234,29,44,0.10);
}
.login-field::placeholder { color:#9ca3af; }

@keyframes float {
  0%,100% { transform:translateY(0); }
  50%     { transform:translateY(-10px); }
}
@keyframes slideRight {
  from { opacity:0; transform:translateX(-20px); }
  to   { opacity:1; transform:translateX(0); }
}
@keyframes slideLeft {
  from { opacity:0; transform:translateX(20px); }
  to   { opacity:1; transform:translateX(0); }
}
`;

function LoginAdmin({ onLoginSucesso }) {
  const ctrl = useAuthAdminController(onLoginSucesso);

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── LADO ESQUERDO ─────────────────────────────────── */}
        <div style={{
          flex: '0 0 44%',
          background: 'linear-gradient(135deg, #1a0808 0%, #2B1A1A 50%, #3E2020 100%)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 48px 40px',
          position: 'relative', overflow: 'hidden',
        }}
        className="hide-mobile"
        >
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(234,29,44,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, left: -40,
            width: 250, height: 250, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(234,29,44,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div style={{ position: 'relative', animation: 'slideRight 0.6s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(234,29,44,0.4)', fontSize: 22,
              }}>
                🍔
              </div>
              <div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 20, color: '#fff' }}>
                  Food<span style={{ color: 'var(--primary)' }}>Express</span>
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginTop: 1 }}>
                  PORTAL DO PARCEIRO
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo central */}
          <div style={{ position: 'relative', animation: 'slideRight 0.7s ease-out' }}>
            <div style={{
              fontSize: 72, marginBottom: 24,
              display: 'inline-block',
              animation: 'float 4s ease-in-out infinite',
              filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))',
            }}>
              🛵
            </div>

            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 900,
              fontSize: 38, color: '#fff', lineHeight: 1.05, marginBottom: 16,
            }}>
              Gerencie<br/>
              <span style={{ color: 'var(--primary)' }}>seu restaurante</span><br/>
              com facilidade.
            </h1>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 320 }}>
              Controle pedidos, cardápio e lojas em tempo real. Tudo numa plataforma simples e poderosa.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
              {['🚀 Pedidos em tempo real', '📊 Métricas claras', '🗺️ Mapa integrado'].map(f => (
                <span key={f} style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 99, padding: '6px 14px',
                  fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500,
                }}>{f}</span>
              ))}
            </div>
          </div>

          <p style={{ position: 'relative', fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
            © 2024 FoodExpress — Projeto Acadêmico
          </p>
        </div>

        {/* ── LADO DIREITO (form) ─────────────────────────── */}
        <div style={{
          flex: 1, background: '#fafafa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px', animation: 'slideLeft 0.6s ease-out',
        }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 28, color: '#1a1a1a', lineHeight: 1.1 }}>
                {ctrl.isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
              </p>
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
                {ctrl.isLogin
                  ? 'Acesse o painel administrativo do seu restaurante'
                  : 'Crie sua conta e comece a vender hoje'}
              </p>
            </div>

            <form onSubmit={ctrl.handleSubmitEmail} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>E-mail</label>
                <input type="email" placeholder="seu@email.com" value={ctrl.email}
                  onChange={e => ctrl.setEmail(e.target.value)} required className="login-field" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Senha</label>
                <input type="password" placeholder="••••••••" value={ctrl.senha}
                  onChange={e => ctrl.setSenha(e.target.value)} required className="login-field" />
              </div>
              <button type="submit" style={{
                padding: 16, borderRadius: 12, border: 'none',
                background: 'var(--primary)', color: '#fff',
                fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16,
                cursor: 'pointer', marginTop: 4,
                boxShadow: '0 6px 20px rgba(234,29,44,0.3)',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {ctrl.isLogin ? 'Entrar no Painel →' : 'Criar minha conta →'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>ou continue com</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            <button onClick={ctrl.handleGoogleLogin} style={{
              width: '100%', padding: 14, borderRadius: 12,
              border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#374151',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#9ca3af'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            {ctrl.mensagem && (
              <div style={{
                marginTop: 16, padding: '12px 16px',
                background: '#FEF2F2', color: '#991B1B',
                borderRadius: 12, border: '1px solid #FECACA',
                fontSize: 13, fontWeight: 500,
              }}>
                ⚠️ {ctrl.mensagem}
              </div>
            )}

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#6b7280' }}>
              {ctrl.isLogin ? 'Ainda não tem conta? ' : 'Já tem uma conta? '}
              <button onClick={ctrl.alternarModo} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--primary)', fontWeight: 700, fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>
                {ctrl.isLogin ? 'Cadastre-se' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`@media (max-width: 768px) { .hide-mobile { display: none !important; } }`}</style>
    </>
  );
}

export default LoginAdmin;