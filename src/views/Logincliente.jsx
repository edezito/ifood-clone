// ============================================================
// VIEW: LoginCliente — FoodExpress (iFood Clone)
// Paleta: Vermelho iFood / Branco
// ============================================================
import React from 'react';
import { useAuthClienteController } from '../controllers/useAuthController';

function LoginCliente({ onLoginSucesso }) {
  const ctrl = useAuthClienteController(onLoginSucesso);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        :root { --primary: #EA1D2C; --primary-light: #FFF0F0; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'DM Sans', sans-serif; }
      `}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        fontFamily: 'DM Sans, sans-serif', padding: 20,
      }}>
        <div style={{
          background: 'white', padding: '48px 40px',
          borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          width: '100%', maxWidth: 420, textAlign: 'center',
          border: '1px solid #e5e7eb',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--primary)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>
              🍔
            </div>
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 24,
              color: '#1a1a1a',
            }}>
              Food<span style={{ color: 'var(--primary)' }}>Express</span>
            </span>
          </div>

          <p style={{ color: '#6b7280', marginBottom: 28, fontSize: 14 }}>
            {ctrl.etapa === 'cadastro' ? 'Complete seu cadastro' : 'Faça login para pedir'}
          </p>

          {ctrl.mensagem && (
            <div style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: 14, fontWeight: 600,
              background: ctrl.mensagem.includes('✅') || ctrl.mensagem.includes('🎉') ? '#d1fae5' : '#fee2e2',
              color: ctrl.mensagem.includes('✅') || ctrl.mensagem.includes('🎉') ? '#065f46' : '#991b1b',
              border: `1px solid ${ctrl.mensagem.includes('✅') || ctrl.mensagem.includes('🎉') ? '#a7f3d0' : '#fecaca'}`,
            }}>
              {ctrl.mensagem}
            </div>
          )}

          {ctrl.etapa === 'contato' && (
            <>
              <div style={{
                display: 'flex', gap: 4, marginBottom: 24,
                background: '#f3f4f6', padding: 4, borderRadius: 12,
              }}>
                {['email', 'telefone'].map(m => (
                  <button key={m} onClick={() => ctrl.setMetodo(m)} style={{
                    flex: 1, padding: '10px', borderRadius: 8,
                    border: 'none', fontWeight: 700, cursor: 'pointer',
                    fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.2s',
                    background: ctrl.metodo === m ? 'white' : 'transparent',
                    color: ctrl.metodo === m ? 'var(--primary)' : '#6b7280',
                    boxShadow: ctrl.metodo === m ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  }}>
                    {m === 'email' ? 'E-mail' : 'SMS'}
                  </button>
                ))}
              </div>
              <form onSubmit={ctrl.enviarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {ctrl.metodo === 'email' ? (
                  <input type="email" value={ctrl.email} onChange={e => ctrl.setEmail(e.target.value)}
                    placeholder="Digite seu e-mail" required style={inputStyle} />
                ) : (
                  <input type="tel" value={ctrl.telefone} onChange={e => ctrl.setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999" required style={inputStyle} />
                )}
                <button type="submit" disabled={ctrl.loading} style={primaryBtnStyle}>
                  {ctrl.loading ? 'Enviando...' : `Receber Código por ${ctrl.metodo === 'email' ? 'E-mail' : 'SMS'}`}
                </button>
              </form>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
                {ctrl.metodo === 'email'
                  ? `📧 Você receberá um e-mail com código de ${ctrl.codigoLength} dígitos`
                  : '📱 Você receberá um SMS com código de 6 dígitos'}
              </p>
            </>
          )}

          {ctrl.etapa === 'codigo' && (
            <form onSubmit={ctrl.confirmarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: '#6b7280' }}>
                Código enviado para:<br/>
                <strong style={{ color: '#1a1a1a' }}>{ctrl.metodo === 'email' ? ctrl.email : ctrl.telefone}</strong>
              </p>
              <input type="text" value={ctrl.codigo} onChange={e => ctrl.setCodigo(e.target.value)}
                placeholder={`Código de ${ctrl.codigoLength} dígitos`}
                required maxLength={ctrl.codigoLength}
                style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center', fontSize: 20 }} />
              <button type="submit" disabled={ctrl.loading} style={{ ...primaryBtnStyle, background: '#50A773' }}>
                {ctrl.loading ? 'Verificando...' : 'Confirmar Código'}
              </button>
              <button type="button" onClick={ctrl.resetarFluxo} style={linkBtnStyle}>← Voltar e corrigir dados</button>
            </form>
          )}

          {ctrl.etapa === 'cadastro' && (
            <form onSubmit={ctrl.completarCadastro} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 4 }}>
                Precisamos de mais alguns dados para completar seu cadastro.
              </p>
              <input type="text" value={ctrl.nome} onChange={e => ctrl.setNome(e.target.value)}
                placeholder="Seu nome completo" required style={inputStyle} />
              <input type="text" value={ctrl.endereco} onChange={e => ctrl.setEndereco(e.target.value)}
                placeholder="Rua, número, bairro" required style={inputStyle} />
              <input type="text" value={ctrl.complemento} onChange={e => ctrl.setComplemento(e.target.value)}
                placeholder="Complemento (opcional)" style={inputStyle} />
              <button type="submit" disabled={ctrl.loading} style={{ ...primaryBtnStyle, background: '#50A773' }}>
                {ctrl.loading ? 'Salvando...' : 'Finalizar Cadastro'}
              </button>
              <button type="button" onClick={ctrl.resetarFluxo} style={linkBtnStyle}>← Voltar e corrigir dados</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  padding: '14px 16px', borderRadius: 12,
  border: '1.5px solid #e5e7eb', fontSize: 15,
  width: '100%', boxSizing: 'border-box',
  textAlign: 'center', outline: 'none',
  fontFamily: 'DM Sans, sans-serif', color: '#1f2937',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const primaryBtnStyle = {
  padding: '14px', background: '#EA1D2C', color: 'white',
  border: 'none', borderRadius: 12, cursor: 'pointer',
  fontWeight: 700, fontSize: 15, width: '100%',
  fontFamily: 'DM Sans, sans-serif',
  boxShadow: '0 4px 12px rgba(234,29,44,0.3)',
  transition: 'transform 0.15s',
};

const linkBtnStyle = {
  background: 'none', border: 'none', color: '#6b7280',
  fontSize: 14, cursor: 'pointer', textDecoration: 'underline',
  marginTop: 4, fontFamily: 'DM Sans, sans-serif',
};

export default LoginCliente;