import { useState } from 'react';
import { supabase } from './supabaseClient';

function LoginCliente({ onLoginSucesso }) {
  const [metodo, setMetodo] = useState('email');
  const [etapa, setEtapa] = useState('contato');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [codigo, setCodigo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Dados para cadastro (só pede se for primeiro login)
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [complemento, setComplemento] = useState('');
  const [dadosUsuario, setDadosUsuario] = useState(null);

  // Configuração do tamanho do código
  const CODIGO_LENGTH = 8; // 8 dígitos para e-mail (conforme sua configuração)

  const formatarTelefone = (numero) => {
    let phoneFormatted = numero.trim().replace(/\D/g, '');
    if (!phoneFormatted.startsWith('55')) {
      phoneFormatted = '55' + phoneFormatted;
    }
    return '+' + phoneFormatted;
  };

  const handleEnviarCodigo = async (e) => {
    e.preventDefault();
    
    if (metodo === 'email' && !email.trim()) {
      setMensagem('❌ Digite seu e-mail');
      return;
    }
    if (metodo === 'telefone' && !telefone.trim()) {
      setMensagem('❌ Digite seu telefone');
      return;
    }
    
    setLoading(true);
    setMensagem('⏳ Enviando código...');
    
    try {
      if (metodo === 'email') {
        const { error } = await supabase.auth.signInWithOtp({ 
          email: email.trim(),
          options: { shouldCreateUser: true }
        });
        
        if (error) throw error;
        setMensagem(`✅ Código de ${CODIGO_LENGTH} dígitos enviado para ${email}`);
        setEtapa('codigo');
        
      } else {
        const phoneFormatted = formatarTelefone(telefone);
        
        const { error } = await supabase.auth.signInWithOtp({ 
          phone: phoneFormatted,
          options: { shouldCreateUser: true }
        });
        
        if (error) throw error;
        
        setMensagem(`✅ Código de 6 dígitos enviado por SMS para ${telefone}`);
        setEtapa('codigo');
      }
    } catch (error) {
      console.error('❌ Erro:', error);
      setMensagem(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('⏳ Verificando código...');
    
    try {
      let sessionData;
      
      if (metodo === 'email') {
        const { data, error } = await supabase.auth.verifyOtp({ 
          email: email.trim(), 
          token: codigo, 
          type: 'magiclink' // Para código numérico de e-mail
        });
        
        if (error) throw error;
        sessionData = data;
        
      } else {
        const phoneFormatted = formatarTelefone(telefone);
        
        const { data, error } = await supabase.auth.verifyOtp({ 
          phone: phoneFormatted, 
          token: codigo, 
          type: 'sms'
        });
        
        if (error) throw error;
        sessionData = data;
      }
      
      if (sessionData?.session) {
        // Verifica se o cliente já existe na tabela clientes
        const { data: clienteExistente, error: buscaError } = await supabase
          .from('clientes')
          .select('nome, endereco, complemento, telefone, email')
          .eq('id', sessionData.session.user.id)
          .maybeSingle();
        
        console.log('Cliente existente:', clienteExistente);
        
        // Se já tem endereço cadastrado, faz login direto
        if (clienteExistente && clienteExistente.endereco) {
          setMensagem('🎉 Login realizado!');
          onLoginSucesso({
            ...sessionData.session.user,
            nome: clienteExistente.nome,
            endereco: clienteExistente.endereco,
            complemento: clienteExistente.complemento,
            telefone: clienteExistente.telefone || sessionData.session.user.phone,
            email: clienteExistente.email || sessionData.session.user.email
          });
        } else {
          // NOVO CLIENTE: solicita nome e endereço
          setDadosUsuario({
            user: sessionData.session.user,
            email: metodo === 'email' ? email.trim() : sessionData.session.user.email,
            telefone: metodo === 'telefone' ? formatarTelefone(telefone) : sessionData.session.user.phone
          });
          setEtapa('cadastro');
          setMensagem('');
        }
      } else {
        setMensagem('❌ Código inválido ou expirado');
      }
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      setMensagem(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCadastroCompleto = async (e) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      setMensagem('❌ Digite seu nome completo');
      return;
    }
    if (!endereco.trim()) {
      setMensagem('❌ Digite seu endereço');
      return;
    }
    
    setLoading(true);
    setMensagem('⏳ Salvando dados...');
    
    try {
      // SÓ SALVA NOVO CLIENTE
      const { error } = await supabase
        .from('clientes')
        .upsert({
          id: dadosUsuario.user.id,
          nome: nome,
          telefone: dadosUsuario.telefone,
          email: dadosUsuario.email,
          endereco: endereco,
          complemento: complemento || null
        }, {
          onConflict: 'id'
        });
      
      if (error) throw error;
      
      setMensagem('🎉 Cadastro completo! Login realizado.');
      onLoginSucesso({
        ...dadosUsuario.user,
        nome: nome,
        endereco: endereco,
        complemento: complemento,
        telefone: dadosUsuario.telefone,
        email: dadosUsuario.email
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      setMensagem(`❌ ${error.message}`);
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🍔 DeliveryApp</h2>
        <p style={styles.subtitle}>
          {etapa === 'cadastro' ? 'Complete seu cadastro' : 'Faça login para continuar'}
        </p>

        {mensagem && (
          <div style={{ 
            ...styles.message, 
            background: mensagem.includes('✅') || mensagem.includes('🎉') ? '#dcfce7' : '#fee2e2',
            color: mensagem.includes('✅') || mensagem.includes('🎉') ? '#166534' : '#991b1b'
          }}>
            {mensagem}
          </div>
        )}

        {etapa === 'contato' ? (
          <>
            <div style={styles.tabContainer}>
              <button 
                onClick={() => { setMetodo('email'); setMensagem(''); }}
                style={{ 
                  ...styles.tab, 
                  background: metodo === 'email' ? 'white' : 'transparent',
                  color: metodo === 'email' ? '#ea1d2c' : '#64748b'
                }}
              >
                E-mail
              </button>
              <button 
                onClick={() => { setMetodo('telefone'); setMensagem(''); }}
                style={{ 
                  ...styles.tab, 
                  background: metodo === 'telefone' ? 'white' : 'transparent',
                  color: metodo === 'telefone' ? '#ea1d2c' : '#64748b'
                }}
              >
                SMS
              </button>
            </div>

            <form onSubmit={handleEnviarCodigo} style={styles.form}>
              {metodo === 'email' ? (
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Digite seu e-mail" 
                  required 
                  style={styles.input} 
                />
              ) : (
                <input 
                  type="tel" 
                  value={telefone} 
                  onChange={(e) => setTelefone(e.target.value)} 
                  placeholder="(11) 99999-9999" 
                  required 
                  style={styles.input} 
                />
              )}
              
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Enviando...' : `Receber Código por ${metodo === 'email' ? 'E-mail' : 'SMS'}`}
              </button>
            </form>
            
            {metodo === 'telefone' && (
              <p style={styles.helperText}>
                📱 Você receberá um SMS com código de 6 dígitos
              </p>
            )}
            {metodo === 'email' && (
              <p style={styles.helperText}>
                📧 Você receberá um e-mail com código de {CODIGO_LENGTH} dígitos
              </p>
            )}
          </>
        ) : etapa === 'codigo' ? (
          <form onSubmit={handleConfirmarCodigo} style={styles.form}>
            <p style={styles.infoText}>
              Código enviado para:<br/>
              <strong>{metodo === 'email' ? email : telefone}</strong>
              {metodo === 'email' && (
                <span style={styles.channelBadge}> via E-mail ({CODIGO_LENGTH} dígitos)</span>
              )}
              {metodo === 'telefone' && (
                <span style={styles.channelBadge}> via SMS (6 dígitos)</span>
              )}
            </p>
            <input 
              type="text" 
              value={codigo} 
              onChange={(e) => setCodigo(e.target.value)} 
              placeholder={`Digite o código de ${metodo === 'email' ? CODIGO_LENGTH : 6} dígitos`} 
              required 
              style={styles.input} 
              maxLength={metodo === 'email' ? CODIGO_LENGTH : 6}
            />
            <button type="submit" disabled={loading} style={{ ...styles.button, background: '#10b981' }}>
              {loading ? 'Verificando...' : 'Confirmar Código'}
            </button>
            <button type="button" onClick={resetarFluxo} style={styles.backButton}>
              Voltar e corrigir dados
            </button>
          </form>
        ) : (
          // Etapa de Cadastro (só aparece para NOVOS usuários)
          <form onSubmit={handleCadastroCompleto} style={styles.form}>
            <p style={styles.infoText}>
              Olá! Precisamos de mais alguns dados para completar seu cadastro.
            </p>
            
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
              placeholder="Seu nome completo" 
              required 
              style={styles.input} 
            />
            
            <input 
              type="text" 
              value={endereco} 
              onChange={(e) => setEndereco(e.target.value)} 
              placeholder="Rua, número, bairro" 
              required 
              style={styles.input} 
            />
            
            <input 
              type="text" 
              value={complemento} 
              onChange={(e) => setComplemento(e.target.value)} 
              placeholder="Complemento (apto, casa, bloco) - opcional" 
              style={styles.input} 
            />
            
            <button type="submit" disabled={loading} style={{ ...styles.button, background: '#10b981' }}>
              {loading ? 'Salvando...' : 'Finalizar Cadastro'}
            </button>
            
            <button type="button" onClick={resetarFluxo} style={styles.backButton}>
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
    fontFamily: 'Nunito, sans-serif'
  },
  card: { 
    background: 'white', 
    padding: '40px', 
    borderRadius: '16px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
    width: '100%', 
    maxWidth: '400px', 
    textAlign: 'center' 
  },
  title: { 
    color: '#ea1d2c', 
    margin: '0 0 10px 0', 
    fontSize: '24px', 
    fontWeight: '900' 
  },
  subtitle: { 
    color: '#64748b', 
    marginBottom: '20px',
    fontSize: '14px'
  },
  message: { 
    padding: '12px', 
    borderRadius: '8px', 
    marginBottom: '20px', 
    fontSize: '14px', 
    fontWeight: '600' 
  },
  tabContainer: { 
    display: 'flex', 
    gap: '10px', 
    marginBottom: '20px', 
    background: '#f1f5f9', 
    padding: '5px', 
    borderRadius: '12px' 
  },
  tab: { 
    flex: 1, 
    padding: '10px', 
    borderRadius: '8px', 
    border: 'none', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    transition: 'all 0.2s' 
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px' 
  },
  input: { 
    padding: '15px', 
    borderRadius: '12px', 
    border: '1px solid #cbd5e0', 
    fontSize: '1rem', 
    width: '100%', 
    boxSizing: 'border-box', 
    textAlign: 'center',
    outline: 'none',
    transition: 'all 0.2s'
  },
  button: { 
    padding: '15px', 
    background: '#ea1d2c', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    fontSize: '1.1rem', 
    width: '100%' 
  },
  infoText: { 
    fontSize: '14px', 
    color: '#64748b', 
    margin: '0 0 10px 0' 
  },
  backButton: { 
    background: 'none', 
    border: 'none', 
    color: '#64748b', 
    fontSize: '14px', 
    cursor: 'pointer', 
    textDecoration: 'underline', 
    marginTop: '10px' 
  },
  helperText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '10px',
    textAlign: 'center'
  },
  channelBadge: {
    display: 'inline-block',
    marginLeft: '5px',
    fontSize: '11px',
    background: '#e2e8f0',
    padding: '2px 6px',
    borderRadius: '10px',
    color: '#475569'
  }
};

export default LoginCliente;