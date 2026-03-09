// src/App.jsx
import { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [mensagem, setMensagem] = useState('');

  // Lógica de Autenticação com Email/Senha
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setMensagem('Login realizado com sucesso!');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setMensagem('Cadastro realizado com sucesso!');
      }
    } catch (error) {
      setMensagem('Erro: ' + error.message);
    }
  };

  // Lógica de Integração Social (Google)
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setMensagem('Login com Google realizado com sucesso!');
    } catch (error) {
      setMensagem('Erro no Google Login: ' + error.message);
    }
  };

  // Lógica de Validação Mockada (SMS/Email)
  const handleMockValidation = () => {
    if (!telefone) {
      setMensagem('Digite um telefone para simular o SMS.');
      return;
    }
    const codigoGerado = Math.floor(1000 + Math.random() * 9000);
    console.log(`[MOCK INTEGRAÇÃO] SMS enviado para ${telefone}`);
    console.log(`[MOCK INTEGRAÇÃO] Seu código de validação é: ${codigoGerado}`);
    setMensagem(`SMS simulado! Olhe o console (F12) para ver o código enviado para ${telefone}.`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h2>{isLogin ? 'Login do Cliente' : 'Cadastro de Cliente'}</h2>
      
      <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Seu E-mail" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Sua Senha" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit">{isLogin ? 'Entrar' : 'Cadastrar'}</button>
      </form>

      <div style={{ margin: '20px 0' }}>
        <button onClick={handleGoogleLogin} style={{ backgroundColor: '#DB4437', color: 'white', width: '100%' }}>
          Entrar com o Google
        </button>
      </div>

      <hr />

      {/* Seção de Validação Mockada */}
      <div style={{ marginTop: '20px' }}>
        <h3>Validação de 2 Fatores (Mock)</h3>
        <input 
          type="text" 
          placeholder="Seu Telefone (ex: 11999999999)" 
          value={telefone} 
          onChange={(e) => setTelefone(e.target.value)} 
          style={{ width: '100%', marginBottom: '10px' }}
        />
        <button onClick={handleMockValidation} style={{ width: '100%' }}>
          Simular Envio de SMS
        </button>
      </div>

      {mensagem && <p style={{ color: 'blue', marginTop: '15px' }}><strong>Status:</strong> {mensagem}</p>}

      <p style={{ marginTop: '20px', cursor: 'pointer', color: '#ff4500' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Não tem conta? Cadastre-se aqui.' : 'Já tem conta? Faça login.'}
      </p>
    </div>
  );
}

export default App;