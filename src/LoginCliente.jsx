import { useState, useEffect } from 'react';
import { auth } from './firebaseClient';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

function LoginCliente({ onLoginSucesso }) {
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [confirmacaoResult, setConfirmacaoResult] = useState(null);
  const [mensagem, setMensagem] = useState('');

  // 1. Inicializa o ReCaptcha Invisível assim que a tela abre
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA resolvido
        }
      });
    }
  }, []);

  // 2. Função para disparar o SMS
  const handleEnviarSms = async (e) => {
    e.preventDefault();
    setMensagem('⏳ Processando...');
    
    try {
      const appVerifier = window.recaptchaVerifier;
      // O Firebase exige o número no formato internacional (+55 DDD NUMERO)
      const confirmation = await signInWithPhoneNumber(auth, telefone, appVerifier);
      setConfirmacaoResult(confirmation);
      setMensagem('✅ SMS enviado! Digite o código abaixo.');
    } catch (error) {
      console.error(error);
      setMensagem('⚠️ Erro ao enviar SMS. Verifique o número.');
    }
  };

  // 3. Função para validar o código digitado
  const handleConfirmarCodigo = async (e) => {
    e.preventDefault();
    setMensagem('⏳ Verificando código...');
    
    try {
      const result = await confirmacaoResult.confirm(codigo);
      setMensagem('🎉 Login realizado com sucesso!');
      // Manda os dados do usuário logado de volta para o App principal
      onLoginSucesso(result.user);
    } catch (error) {
      setMensagem('⚠️ Código inválido ou expirado.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        
        <h2 style={{ color: '#ea1d2c', margin: '0 0 10px 0' }}>🍔 DeliveryApp</h2>
        <p style={{ color: '#64748b', marginBottom: '25px' }}>Faça login para fazer seu pedido</p>

        {mensagem && (
          <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', color: '#0f172a' }}>
            {mensagem}
          </div>
        )}

        {/* Div obrigatória para o ReCaptcha invisível funcionar */}
        <div id="recaptcha-container"></div>

        {!confirmacaoResult ? (
          // ETAPA 1: Pede o Telefone
          <form onSubmit={handleEnviarSms} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="tel" 
              value={telefone} 
              onChange={(e) => setTelefone(e.target.value)} 
              placeholder="+55 11 999999999" 
              required 
              style={inputStyle} 
            />
            <button type="submit" style={btnStyle}>Enviar Código por SMS</button>
          </form>
        ) : (
          // ETAPA 2: Pede o Código de Confirmação
          <form onSubmit={handleConfirmarCodigo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" 
              value={codigo} 
              onChange={(e) => setCodigo(e.target.value)} 
              placeholder="Código de 6 dígitos" 
              required 
              style={inputStyle} 
            />
            <button type="submit" style={{ ...btnStyle, background: '#10b981' }}>Confirmar e Entrar</button>
          </form>
        )}

      </div>
    </div>
  );
}

const inputStyle = { padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e0', fontSize: '1rem', width: '100%', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '1px' };
const btnStyle = { padding: '15px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', transition: '0.2s' };

export default LoginCliente;