// ============================================================
// CONTROLLER: useAuthController
// Responsabilidade: lógica de autenticação (admin via Firebase
// e cliente via Supabase OTP).
// ============================================================
import { useState } from 'react';
import { AuthModel } from '../models/authModel';
import { ClienteModel } from '../models/clienteModel';

const CODIGO_LENGTH_EMAIL = 8;

// ------ Admin (Firebase) ------
export function useAuthAdminController(onLoginSucesso) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [mensagem, setMensagem] = useState('');

  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await AuthModel.loginComEmail(email, senha);
      } else {
        await AuthModel.cadastrarComEmail(email, senha);
      }
      onLoginSucesso();
    } catch (err) {
      setMensagem(err.message.replace('Firebase: ', ''));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await AuthModel.loginComGoogle();
      onLoginSucesso();
    } catch {
      setMensagem('Erro no login com Google');
    }
  };

  const handleLogout = async () => {
    await AuthModel.logout();
  };

  const alternarModo = () => {
    setIsLogin((v) => !v);
    setMensagem('');
    setEmail('');
    setSenha('');
  };

  return {
    email, setEmail,
    senha, setSenha,
    isLogin,
    mensagem,
    handleSubmitEmail,
    handleGoogleLogin,
    handleLogout,
    alternarModo,
  };
}

// ------ Cliente (Supabase OTP) ------
export function useAuthClienteController(onLoginSucesso) {
  const [metodo, setMetodo] = useState('email');
  const [etapa, setEtapa] = useState('contato');   // 'contato' | 'codigo' | 'cadastro'
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [complemento, setComplemento] = useState('');
  const [dadosUsuario, setDadosUsuario] = useState(null);

  const formatarTelefone = (numero) => {
    const digits = numero.trim().replace(/\D/g, '');
    return '+' + (digits.startsWith('55') ? digits : '55' + digits);
  };

  const enviarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('⏳ Enviando código...');
    try {
      if (metodo === 'email') {
        await AuthModel.enviarOtpEmail(email.trim());
        setMensagem(`✅ Código de ${CODIGO_LENGTH_EMAIL} dígitos enviado para ${email}`);
      } else {
        await AuthModel.enviarOtpSms(formatarTelefone(telefone));
        setMensagem(`✅ Código SMS enviado para ${telefone}`);
      }
      setEtapa('codigo');
    } catch (err) {
      setMensagem(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const confirmarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('⏳ Verificando...');
    try {
      let sessionData;
      if (metodo === 'email') {
        sessionData = await AuthModel.verificarOtpEmail(email.trim(), codigo);
      } else {
        sessionData = await AuthModel.verificarOtpSms(formatarTelefone(telefone), codigo);
      }

      if (sessionData?.session) {
        const cliente = await ClienteModel.buscarPorId(sessionData.session.user.id);
        if (cliente?.endereco) {
          onLoginSucesso({ ...sessionData.session.user, ...cliente });
        } else {
          setDadosUsuario({
            user: sessionData.session.user,
            email: metodo === 'email' ? email.trim() : sessionData.session.user.email,
            telefone: metodo === 'telefone' ? formatarTelefone(telefone) : sessionData.session.user.phone,
          });
          setEtapa('cadastro');
          setMensagem('');
        }
      } else {
        setMensagem('❌ Código inválido ou expirado');
      }
    } catch (err) {
      setMensagem(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const completarCadastro = async (e) => {
    e.preventDefault();
    if (!nome.trim()) return setMensagem('❌ Digite seu nome completo');
    if (!endereco.trim()) return setMensagem('❌ Digite seu endereço');

    setLoading(true);
    setMensagem('⏳ Salvando dados...');
    try {
      await ClienteModel.salvar({
        id: dadosUsuario.user.id,
        nome,
        telefone: dadosUsuario.telefone,
        email: dadosUsuario.email,
        endereco,
        complemento: complemento || null,
      });
      onLoginSucesso({ ...dadosUsuario.user, nome, endereco, complemento, telefone: dadosUsuario.telefone, email: dadosUsuario.email });
    } catch (err) {
      setMensagem(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetarFluxo = () => {
    setEtapa('contato');
    setCodigo('');
    setMensagem('');
    setNome('');
    setEndereco('');
    setComplemento('');
    setDadosUsuario(null);
  };

  return {
    metodo, setMetodo,
    etapa,
    email, setEmail,
    telefone, setTelefone,
    codigo, setCodigo,
    mensagem,
    loading,
    nome, setNome,
    endereco, setEndereco,
    complemento, setComplemento,
    codigoLength: metodo === 'email' ? CODIGO_LENGTH_EMAIL : 6,
    enviarCodigo,
    confirmarCodigo,
    completarCadastro,
    resetarFluxo,
  };
}