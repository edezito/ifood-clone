// ============================================================
// VIEW: LoginCliente
// Responsabilidade: tela de login do cliente via OTP.
// Toda a lógica foi movida para useAuthClienteController.
// ============================================================
import React from 'react';
import { useAuthClienteController } from '../controllers/useAuthController';

function LoginCliente({ onLoginSucesso }) {
  const ctrl = useAuthClienteController(onLoginSucesso);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🍔 DeliveryApp</h2>
        <p style={styles.subtitle}>
          {ctrl.etapa === 'cadastro' ? 'Complete seu cadastro' : 'Faça login para continuar'}
        </p>

        {ctrl.mensagem && (
          <div style={{
            ...styles.message,
            background: ctrl.mensagem.includes('✅') || ctrl.mensagem.includes('🎉') ? '#dcfce7' : '#fee2e2',
            color:      ctrl.mensagem.includes('✅') || ctrl.mensagem.includes('🎉') ? '#166534' : '#991b1b',
          }}>
            {ctrl.mensagem}
          </div>
        )}

        {/* ---- Etapa: CONTATO ---- */}
        {ctrl.etapa === 'contato' && (
          <>
            <div style={styles.tabContainer}>
              {['email', 'telefone'].map((m) => (
                <button
                  key={m}
                  onClick={() => { ctrl.setMetodo(m); }}
                  style={{
                    ...styles.tab,
                    background: ctrl.metodo === m ? 'white' : 'transparent',
                    color:      ctrl.metodo === m ? '#ea1d2c' : '#64748b',
                  }}
                >
                  {m === 'email' ? 'E-mail' : 'SMS'}
                </button>
              ))}
            </div>

            <form onSubmit={ctrl.enviarCodigo} style={styles.form}>
              {ctrl.metodo === 'email' ? (
                <input
                  type="email"
                  value={ctrl.email}
                  onChange={(e) => ctrl.setEmail(e.target.value)}
                  placeholder="Digite seu e-mail"
                  required
                  style={styles.input}
                />
              ) : (
                <input
                  type="tel"
                  value={ctrl.telefone}
                  onChange={(e) => ctrl.setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                  style={styles.input}
                />
              )}
              <button type="submit" disabled={ctrl.loading} style={styles.button}>
                {ctrl.loading
                  ? 'Enviando...'
                  : `Receber Código por ${ctrl.metodo === 'email' ? 'E-mail' : 'SMS'}`}
              </button>
            </form>

            <p style={styles.helperText}>
              {ctrl.metodo === 'email'
                ? `📧 Você receberá um e-mail com código de ${ctrl.codigoLength} dígitos`
                : '📱 Você receberá um SMS com código de 6 dígitos'}
            </p>
          </>
        )}

        {/* ---- Etapa: CÓDIGO ---- */}
        {ctrl.etapa === 'codigo' && (
          <form onSubmit={ctrl.confirmarCodigo} style={styles.form}>
            <p style={styles.infoText}>
              Código enviado para:<br />
              <strong>{ctrl.metodo === 'email' ? ctrl.email : ctrl.telefone}</strong>
              <span style={styles.channelBadge}>
                {ctrl.metodo === 'email'
                  ? ` via E-mail (${ctrl.codigoLength} dígitos)`
                  : ' via SMS (6 dígitos)'}
              </span>
            </p>
            <input
              type="text"
              value={ctrl.codigo}
              onChange={(e) => ctrl.setCodigo(e.target.value)}
              placeholder={`Digite o código de ${ctrl.codigoLength} dígitos`}
              required
              maxLength={ctrl.codigoLength}
              style={styles.input}
            />
            <button type="submit" disabled={ctrl.loading} style={{ ...styles.button, background: '#10b981' }}>
              {ctrl.loading ? 'Verificando...' : 'Confirmar Código'}
            </button>
            <button type="button" onClick={ctrl.resetarFluxo} style={styles.backButton}>
              Voltar e corrigir dados
            </button>
          </form>
        )}

        {/* ---- Etapa: CADASTRO ---- */}
        {ctrl.etapa === 'cadastro' && (
          <form onSubmit={ctrl.completarCadastro} style={styles.form}>
            <p style={styles.infoText}>
              Olá! Precisamos de mais alguns dados para completar seu cadastro.
            </p>
            <input
              type="text"
              value={ctrl.nome}
              onChange={(e) => ctrl.setNome(e.target.value)}
              placeholder="Seu nome completo"
              required
              style={styles.input}
            />
            <input
              type="text"
              value={ctrl.endereco}
              onChange={(e) => ctrl.setEndereco(e.target.value)}
              placeholder="Rua, número, bairro"
              required
              style={styles.input}
            />
            <input
              type="text"
              value={ctrl.complemento}
              onChange={(e) => ctrl.setComplemento(e.target.value)}
              placeholder="Complemento (apto, casa, bloco) - opcional"
              style={styles.input}
            />
            <button type="submit" disabled={ctrl.loading} style={{ ...styles.button, background: '#10b981' }}>
              {ctrl.loading ? 'Salvando...' : 'Finalizar Cadastro'}
            </button>
            <button type="button" onClick={ctrl.resetarFluxo} style={styles.backButton}>
              Voltar e corrigir dados
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    fontFamily: 'Nunito, sans-serif',
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title:    { color: '#ea1d2c', margin: '0 0 10px 0', fontSize: '24px', fontWeight: '900' },
  subtitle: { color: '#64748b', marginBottom: '20px', fontSize: '14px' },
  message:  { padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '600' },
  tabContainer: {
    display: 'flex', gap: '10px', marginBottom: '20px',
    background: '#f1f5f9', padding: '5px', borderRadius: '12px',
  },
  tab: {
    flex: 1, padding: '10px', borderRadius: '8px',
    border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s',
  },
  form:   { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: {
    padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e0',
    fontSize: '1rem', width: '100%', boxSizing: 'border-box',
    textAlign: 'center', outline: 'none', transition: 'all 0.2s',
  },
  button: {
    padding: '15px', background: '#ea1d2c', color: 'white',
    border: 'none', borderRadius: '12px', cursor: 'pointer',
    fontWeight: 'bold', fontSize: '1.1rem', width: '100%',
  },
  infoText:     { fontSize: '14px', color: '#64748b', margin: '0 0 10px 0' },
  backButton:   { background: 'none', border: 'none', color: '#64748b', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' },
  helperText:   { fontSize: '12px', color: '#64748b', marginTop: '10px', textAlign: 'center' },
  channelBadge: { display: 'inline-block', marginLeft: '5px', fontSize: '11px', background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px', color: '#475569' },
};

export default LoginCliente;