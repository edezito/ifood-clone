// ============================================================
// COMPONENT: CheckoutModal
// Responsabilidade: Modal de checkout com seleção de entrega,
// forma de pagamento e processamento
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  X, Truck, Store, CreditCard, QrCode,
  ChevronRight, CheckCircle, ArrowLeft, Copy, Clock,
  MapPin, Shield, Zap, RefreshCw, ShoppingCart, Plus, Minus
} from 'lucide-react';
import StepPagamento from './StepPagamento';

/* ─── ESTILOS DO CHECKOUT ─────────────────────────────────── */
const CHECKOUT_STYLES = `
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(16px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes slideStep {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes pixPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 195, 0, 0.4); }
  50%       { box-shadow: 0 0 0 12px rgba(0, 195, 0, 0); }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes countDown {
  from { width: 100%; }
  to   { width: 0%; }
}
`;

/* ─── CONSTANTES ─────────────────────────────────────────── */
const STEPS = ['resumo', 'entrega', 'pagamento', 'processando', 'confirmado'];

/* ─── HELPERS ─────────────────────────────────────────────── */
function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val || 0);
}

/* ─── COMPONENTES DOS STEPS ──────────────────────────────── */

// Barra de Progresso
function ProgressBar({ step }) {
  const steps = ['Resumo', 'Entrega', 'Pagamento'];
  const idx = Math.min(STEPS.indexOf(step), 2);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, marginBottom: 28,
    }}>
      {steps.map((label, i) => (
        <React.Fragment key={label}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: i <= idx ? '#EA1D2C' : '#e5e7eb',
              color: i <= idx ? '#fff' : '#9ca3af',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, transition: 'all 0.3s',
              boxShadow: i <= idx ? '0 3px 8px rgba(234,29,44,0.35)' : 'none',
            }}>
              {i < idx ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
              color: i <= idx ? '#EA1D2C' : '#9ca3af',
            }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, borderRadius: 99, marginBottom: 14,
              background: i < idx ? '#EA1D2C' : '#e5e7eb',
              transition: 'background 0.3s',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// Step: Resumo do Pedido
function StepResumo({ carrinho, calcularTotal, endereco, onNext }) {
  const subtotal = calcularTotal();
  const taxa = 4.99;
  const total = subtotal + taxa;

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18,
        color: '#1f2937', marginBottom: 20,
      }}>
        Resumo do Pedido
      </h3>

      {/* Itens */}
      <div style={{
        background: '#f9fafb', borderRadius: 14, padding: '4px 16px',
        marginBottom: 20, border: '1px solid #e5e7eb',
      }}>
        {carrinho.map((item, i) => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0',
            borderBottom: i < carrinho.length - 1 ? '1px solid #e5e7eb' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                background: '#EA1D2C', color: '#fff',
                width: 22, height: 22, borderRadius: 6, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>{item.quantidade}</span>
              <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{item.nome}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', flexShrink: 0 }}>
              {formatCurrency(item.preco * item.quantidade)}
            </span>
          </div>
        ))}
      </div>

      {/* Totais */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
          <span>Taxa de entrega</span>
          <span>{formatCurrency(taxa)}</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 18, fontWeight: 900, color: '#1f2937',
          fontFamily: "'Syne', sans-serif",
          paddingTop: 8, borderTop: '2px solid #e5e7eb', marginTop: 4,
        }}>
          <span>Total</span>
          <span style={{ color: '#EA1D2C' }}>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Endereço */}
      {endereco && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#FFF0F0', borderRadius: 12, padding: '12px 16px',
          marginBottom: 24, border: '1px solid #fecaca',
        }}>
          <MapPin size={16} color="#EA1D2C" flexShrink={0} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#EA1D2C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Endereço de entrega
            </p>
            <p style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{endereco}</p>
          </div>
        </div>
      )}

      <button onClick={() => onNext(total)} style={{
        width: '100%', padding: '15px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, #EA1D2C, #C8101E)',
        color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: 15, cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(234,29,44,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  );
}

// Step: Tipo de Entrega
function StepEntrega({ tipoEntrega, setTipoEntrega, onNext, onBack }) {
  const options = [
    {
      key: 'Entrega',
      icon: Truck,
      label: 'Receber em casa',
      desc: 'Entrega no seu endereço — ~35 min',
      color: '#EA1D2C',
      bg: '#FFF0F0',
    },
    {
      key: 'Retirada',
      icon: Store,
      label: 'Retirar no restaurante',
      desc: 'Retire pessoalmente — ~15 min',
      color: '#50A773',
      bg: '#E8F5EE',
    },
  ];

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#f3f4f6', border: 'none', borderRadius: 10,
        padding: '7px 14px', cursor: 'pointer',
        color: '#6b7280', fontSize: 13, fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18,
        color: '#1f2937', margin: '16px 0 8px',
      }}>
        Como quer receber?
      </h3>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
        Escolha a modalidade de entrega
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {options.map(({ key, icon: Icon, label, desc, color, bg }) => (
          <button
            key={key}
            onClick={() => setTipoEntrega(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '18px 20px', borderRadius: 16, cursor: 'pointer',
              border: `2px solid ${tipoEntrega === key ? color : '#e5e7eb'}`,
              background: tipoEntrega === key ? bg : '#fff',
              transition: 'all 0.2s', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: tipoEntrega === key ? color : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={22} color={tipoEntrega === key ? '#fff' : '#9ca3af'} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: 15, fontWeight: 700,
                color: tipoEntrega === key ? color : '#1f2937',
              }}>{label}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{desc}</p>
            </div>
            {tipoEntrega === key && (
              <CheckCircle size={20} color={color} style={{ flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>

      <button onClick={onNext} disabled={!tipoEntrega} style={{
        width: '100%', padding: '15px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, #EA1D2C, #C8101E)',
        color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: 15, cursor: tipoEntrega ? 'pointer' : 'not-allowed',
        boxShadow: '0 6px 20px rgba(234,29,44,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: tipoEntrega ? 1 : 0.5,
      }}>
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  );
}

// Step: Processando PIX
function StepProcessandoPIX({ pixCode, qrcodeUrl, expiracao, total, onPixConfirmado, onCancelar }) {
  const [pixCopied, setPixCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(expiracao || 300);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = pixCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    });
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px 0', animation: 'slideStep 0.3s ease-out' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#E8F5EE', border: '1px solid #a7f3d0',
        borderRadius: 99, padding: '6px 16px', marginBottom: 20,
        fontSize: 12, fontWeight: 700, color: '#065f46',
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', 
          background: '#10b981',
          animation: 'pixPulse 2s infinite',
        }} />
        Aguardando pagamento PIX
      </div>

      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 20,
        color: '#1f2937', marginBottom: 16,
      }}>
        Escaneie o QR Code
      </h3>

      {/* Timer */}
      <div style={{
        color: timeLeft < 60 ? '#ef4444' : '#6b7280',
        fontWeight: 600, marginBottom: 8,
      }}>
        <Clock size={14} style={{ marginRight: 4, display: 'inline' }} />
        Expira em {formatTime(timeLeft)}
      </div>

      {/* QR Code */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <img 
          src={qrcodeUrl} 
          alt="QR Code PIX" 
          style={{ 
            width: 200, 
            height: 200, 
            borderRadius: 12, 
            border: '2px solid #e5e7eb'
          }}
        />
      </div>

      {/* Código PIX */}
      <div style={{
        background: '#f9fafb', borderRadius: 12, padding: '12px 14px',
        border: '1px solid #e5e7eb', marginBottom: 16, textAlign: 'left',
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', marginBottom: 6 }}>
          PIX Copia e Cola
        </p>
        <p style={{
          fontSize: 10, color: '#374151', wordBreak: 'break-all',
          fontFamily: 'monospace', lineHeight: 1.5,
          maxHeight: 60, overflow: 'hidden',
        }}>
          {pixCode}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleCopyPix} style={{
          flex: 1, padding: '12px', borderRadius: 12,
          border: '2px solid #e5e7eb', background: pixCopied ? '#E8F5EE' : '#fff',
          color: pixCopied ? '#065f46' : '#374151',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {pixCopied ? <CheckCircle size={15} style={{ marginRight: 4 }} /> : <Copy size={15} style={{ marginRight: 4 }} />}
          {pixCopied ? 'Copiado!' : 'Copiar código'}
        </button>
        <button onClick={onPixConfirmado} style={{
          flex: 1, padding: '12px', borderRadius: 12,
          background: '#50A773', color: '#fff',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          border: 'none', fontFamily: "'DM Sans', sans-serif",
        }}>
          <CheckCircle size={15} style={{ marginRight: 4 }} />
          Já paguei!
        </button>
      </div>
    </div>
  );
}

// Step: Confirmado
function StepConfirmado({ pedidoId, formaPagamento, tipoEntrega, total, onClose }) {
  return (
    <div style={{ textAlign: 'center', animation: 'slideStep 0.3s ease-out' }}>
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #50A773, #34d399)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px',
        boxShadow: '0 8px 24px rgba(80,167,115,0.4)',
      }}>
        <CheckCircle size={42} color="#fff" strokeWidth={2.5} />
      </div>

      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 24,
        color: '#1f2937', marginBottom: 8,
      }}>
        Pedido Confirmado! 🎉
      </h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>
        {tipoEntrega === 'Entrega'
          ? 'Estamos preparando seu pedido para entrega'
          : 'Prepare-se para ir buscar seu pedido'}
      </p>

      <div style={{
        background: '#f9fafb', borderRadius: 16, padding: '16px 20px',
        border: '1px solid #e5e7eb', marginBottom: 24, textAlign: 'left',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {[
          { label: 'Pedido', value: `#${pedidoId?.toString().slice(0,8).toUpperCase() || 'FE001234'}` },
          { label: 'Pagamento', value: formaPagamento },
          { label: 'Modalidade', value: tipoEntrega === 'Entrega' ? '🛵 Delivery' : '🏪 Retirada' },
          { label: 'Total', value: formatCurrency(total) },
          { label: 'Tempo estimado', value: tipoEntrega === 'Entrega' ? '~35 minutos' : '~15 minutos' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{value}</span>
          </div>
        ))}
      </div>

      <button onClick={onClose} style={{
        width: '100%', padding: '15px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, #EA1D2C, #C8101E)',
        color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: 15, cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(234,29,44,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        Acompanhar Pedido <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ─── MODAL PRINCIPAL ────────────────────────────────────── */
export default function CheckoutModal({
  carrinho,
  calcularTotal,
  usuarioLogado,
  onClose,
  onPedidoConfirmado,
}) {
  const [step, setStep] = useState('resumo');
  const [tipoEntrega, setTipoEntrega] = useState('Entrega');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [total, setTotal] = useState(0);
  const [totalFinal, setTotalFinal] = useState(0);
  const [cardData, setCardData] = useState(null);
  const [pedidoId, setPedidoId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para controle
  const [resultadoPedido, setResultadoPedido] = useState(null);
  const [pixData, setPixData] = useState(null);

  const subtotal = calcularTotal();
  const taxa = tipoEntrega === 'Entrega' ? 4.99 : 0;
  const desconto = formaPagamento === 'PIX' ? (subtotal + taxa) * 0.05 : 0;
  const totalComTaxa = subtotal + taxa;

  const handleResumoNext = (tot) => {
    setTotal(tot);
    setStep('entrega');
  };

  const handleEntregaNext = () => setStep('pagamento');

  const handlePagamentoNext = async (cd) => {
    setCardData(cd);
    const desc = formaPagamento === 'PIX' ? totalComTaxa * 0.05 : 0;
    const tf = totalComTaxa - desc;
    setTotalFinal(tf);
    
    // Iniciar processamento
    setStep('processando');
    setLoading(true);
    setErrorMsg('');

    try {
      // Chamar a função de finalizar pedido do controller
      const resultado = await onPedidoConfirmado({
        tipoEntrega,
        formaPagamento,
        total: tf,
        dadosCartao: cd
      });

      setResultadoPedido(resultado);

      if (resultado.sucesso) {
        setPedidoId(resultado.pedido.id);
        
        if (formaPagamento === 'PIX') {
          // Para PIX, mostrar a tela de processamento com QR Code
          setPixData({
            paymentId: resultado.pagamento.id,
            pixCode: resultado.pixCode,
            qrcodeUrl: resultado.qrcodeUrl,
            expiracao: resultado.expiracao
          });
          // Mantém na tela de processamento
        } else {
          // Para Cartão e Dinheiro, avançar direto para confirmação
          setStep('confirmado');
        }
      } else {
        setErrorMsg(resultado.mensagem);
        setStep('pagamento'); // Voltar para tentar novamente
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      setErrorMsg('Erro ao processar pagamento. Tente novamente.');
      setStep('pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handlePixConfirmado = () => {
    setStep('confirmado');
  };

  const handleFecharEAcompanhar = () => {
    // Limpar carrinho e fechar checkout
    if (onPedidoConfirmado) {
      onPedidoConfirmado({
        tipoEntrega,
        formaPagamento,
        total: totalFinal,
        acao: 'acompanhar',
        pedidoId: pedidoId
      });
    }
    onClose();
  };

  const handleFechar = () => {
    // Apenas fechar sem limpar (caso de erro)
    onClose();
  };

  return (
    <>
      <style>{CHECKOUT_STYLES}</style>

      <div
        onClick={step !== 'processando' ? handleFechar : undefined}
        style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: 24,
            width: '100%', maxWidth: 480,
            maxHeight: '90vh', overflowY: 'auto',
            padding: '28px 28px 32px',
            animation: 'modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
            position: 'relative',
          }}
        >
          {/* Close button - só mostra se não estiver processando */}
          {step !== 'processando' && (
            <button onClick={handleFechar} style={{
              position: 'absolute', top: 16, right: 16,
              width: 32, height: 32, borderRadius: 8, border: 'none',
              background: '#f3f4f6', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={15} color="#6b7280" />
            </button>
          )}

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <p style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 20,
              color: '#1f2937',
            }}>
              {step === 'confirmado' ? '✅ Pedido Confirmado' : '🛒 Finalizar Pedido'}
            </p>
          </div>

          {/* Progress */}
          {['resumo', 'entrega', 'pagamento'].includes(step) && (
            <ProgressBar step={step} />
          )}

          {/* Error */}
          {errorMsg && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 12, padding: '12px 16px',
              fontSize: 13, color: '#991b1b', fontWeight: 600,
              marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center',
            }}>
              ⚠️ {errorMsg}
              <button onClick={() => setErrorMsg('')} style={{ 
                background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' 
              }}>
                <X size={14} color="#991b1b" />
              </button>
            </div>
          )}

          {/* Steps */}
          {step === 'resumo' && (
            <StepResumo
              carrinho={carrinho}
              calcularTotal={calcularTotal}
              endereco={usuarioLogado?.endereco}
              onNext={handleResumoNext}
            />
          )}

          {step === 'entrega' && (
            <StepEntrega
              tipoEntrega={tipoEntrega}
              setTipoEntrega={setTipoEntrega}
              onNext={handleEntregaNext}
              onBack={() => setStep('resumo')}
            />
          )}

          {step === 'pagamento' && (
            <StepPagamento
              formaPagamento={formaPagamento}
              setFormaPagamento={setFormaPagamento}
              onNext={handlePagamentoNext}
              onBack={() => setStep('entrega')}
              total={totalComTaxa}
              loading={loading}
            />
          )}

          {step === 'processando' && formaPagamento === 'PIX' && pixData && (
            <StepProcessandoPIX
              pixCode={pixData.pixCode}
              qrcodeUrl={pixData.qrcodeUrl}
              expiracao={pixData.expiracao}
              total={totalFinal}
              onPixConfirmado={handlePixConfirmado}
              onCancelar={handleFechar}
            />
          )}

          {step === 'processando' && formaPagamento !== 'PIX' && loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                border: '4px solid #e5e7eb', borderTopColor: '#EA1D2C',
                margin: '0 auto 20px',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>
                {formaPagamento === 'Cartão' ? 'Processando pagamento...' : 'Confirmando pedido...'}
              </p>
            </div>
          )}

          {step === 'confirmado' && (
            <StepConfirmado
              pedidoId={pedidoId}
              formaPagamento={formaPagamento}
              tipoEntrega={tipoEntrega}
              total={totalFinal}
              onClose={handleFecharEAcompanhar}
            />
          )}
        </div>
      </div>
    </>
  );
}
