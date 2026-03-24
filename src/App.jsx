import { useState } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import AdminDashboard from './AdminDashboard';
import ClienteApp from './ClienteApp';

// OBSERVAÇÃO: Removi a importação da imagem local.

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [usuarioLogado, setUsuarioLogado] = useState(false);
  const [modoCliente, setModoCliente] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMensagem('Preencha todos os campos.');
      return;
    }
    
    setIsLoading(true);
    setMensagem('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setUsuarioLogado(true);
    } catch (error) {
      setMensagem(error.message.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setMensagem('');
    
    try {
      await signInWithPopup(auth, googleProvider);
      setUsuarioLogado(true);
    } catch (error) {
      setMensagem('Erro no login com Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoutAdmin = async () => {
    await signOut(auth);
    setUsuarioLogado(false);
  };

  // Se escolheu modo cliente, mostra o app do cliente
  if (modoCliente) {
    return <ClienteApp onVoltar={() => setModoCliente(false)} />;
  }

  // Se fez login como admin, mostra o dashboard
  if (usuarioLogado) {
    return <AdminDashboard onLogout={handleLogoutAdmin} />;
  }

  // Tela de login
  return (
    // ATUALIZAÇÃO: Usei uma URL da internet no estilo inline.
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: "url('https://images.unsplash.com/photo-1594179047519-f347310d3322?q=80&w=2070&auto=format&fit=crop')" 
      }}
    >
      {/* Mantenho o overlay escuro para garantir legibilidade */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Mantenho 'relative z-10' ao card de login */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20 relative z-10">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍔</div>
          <h1 className="text-3xl font-bold text-white mb-2">FoodExpress</h1>
          <p className="text-gray-300">
            {isLogin ? 'Acesse sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {isLoading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-gray-400">ou</span>
          </div>
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

        {/* Mensagem de erro */}
        {mensagem && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
            ⚠️ {mensagem}
          </div>
        )}

        {/* Alternar entre login/cadastro */}
        <p className="text-center text-gray-400 mt-6">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setMensagem('');
              setEmail('');
              setPassword('');
            }}
            className="ml-2 text-red-400 hover:text-red-300 font-semibold"
            disabled={isLoading}
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>

        {/* Botão modo cliente */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-center text-gray-400 text-sm mb-3">Quer fazer um pedido?</p>
          <button
            onClick={() => setModoCliente(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            🛍️ Entrar como Cliente
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;