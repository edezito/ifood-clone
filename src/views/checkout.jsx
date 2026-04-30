import React, { useState } from 'react';
import {
  X, Truck, Store, CheckCircle, ArrowLeft,
  MapPin, ChevronRight, ExternalLink
} from 'lucide-react';
import StepPagamento from './StepPagamento'; // Seu novo StepPagamento limpo

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
`;

/* ─── CONSTANTES & HELPERS ───────────────────────────────── */
const STEPS = ['resumo', 'entrega', 'pagamento', 'processando', 'confirmado'];

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(val || 0);
}

/* ─── COMPONENTES DOS STEPS ──────────────────────────────── */

function ProgressBar({ step }) {
  const steps = ['Resumo', 'Entrega', 'Pagamento'];
  const idx = Math.min(STEPS.indexOf(step), 2);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
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
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: i <= idx ? '#EA1D2C' : '#9ca3af' }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, borderRadius: 99, marginBottom: 14, background: i < idx ? '#EA1D2C' : '#e5e7eb', transition: 'background 0.3s' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StepResumo({ carrinho, calcularTotal, endereco, onNext }) {
  const subtotal = calcularTotal();
  const taxa = 4.99;
  const total = subtotal + taxa;

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: '#1f2937', marginBottom: 20 }}>Resumo do Pedido</h3>
      <div style={{ background: '#f9fafb', borderRadius: 14, padding: '4px 16px', marginBottom: 20, border: '1px solid #e5e7eb' }}>
        {carrinho.map((item, i) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < carrinho.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: '#EA1D2C', color: '#fff', width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{item.quantidade}</span>
              <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{item.nome}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', flexShrink: 0 }}>{formatCurrency(item.preco * item.quantidade)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}><span>Taxa de entrega</span><span>{formatCurrency(taxa)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 900, color: '#1f2937', fontFamily: "'Syne', sans-serif", paddingTop: 8, borderTop: '2px solid #e5e7eb', marginTop: 4 }}>
          <span>Total</span><span style={{ color: '#EA1D2C' }}>{formatCurrency(total)}</span>
        </div>
      </div>
      {endereco && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#FFF0F0', borderRadius: 12, padding: '12px 16px', marginBottom: 24, border: '1px solid #fecaca' }}>
          <MapPin size={16} color="#EA1D2C" flexShrink={0} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#EA1D2C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endereço de entrega</p>
            <p style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>{endereco}</p>
          </div>
        </div>
      )}
      <button onClick={() => onNext(total)} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #EA1D2C, #C8101E)', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 20px rgba(234,29,44,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepEntrega({ tipoEntrega, setTipoEntrega, onNext, onBack }) {
  const options = [
    { key: 'Entrega', icon: Truck, label: 'Receber em casa', desc: 'Entrega no seu endereço — ~35 min', color: '#EA1D2C', bg: '#FFF0F0' },
    { key: 'Retirada', icon: Store, label: 'Retirar no restaurante', desc: 'Retire pessoalmente — ~15 min', color: '#50A773', bg: '#E8F5EE' },
  ];

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', color: '#6b7280', fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
        <ArrowLeft size={14} /> Voltar
      </button>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: '#1f2937', margin: '16px 0 8px' }}>Como quer receber?</h3>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>Escolha a modalidade de entrega</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {options.map(({ key, icon: Icon, label, desc, color, bg }) => (
          <button key={key} onClick={() => setTipoEntrega(key)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', borderRadius: 16, cursor: 'pointer', border: `2px solid ${tipoEntrega === key ? color : '#e5e7eb'}`, background: tipoEntrega === key ? bg : '#fff', transition: 'all 0.2s', textAlign: 'left', width: '100%' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: tipoEntrega === key ? color : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={22} color={tipoEntrega === key ? '#fff' : '#9ca3af'} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: tipoEntrega === key ? color : '#1f2937' }}>{label}</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{desc}</p>
            </div>
            {tipoEntrega === key && <CheckCircle size={20} color={color} style={{ flexShrink: 0 }} />}
          </button>
        ))}
      </div>
      <button onClick={onNext} disabled={!tipoEntrega} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #EA1D2C, #C8101E)', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, cursor: tipoEntrega ? 'pointer' : 'not-allowed', boxShadow: '0 6px 20px rgba(234,29,44,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: tipoEntrega ? 1 : 0.5 }}>
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  );
}

function StepProcessandoMP({ initPoint, total, onCancelar }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0', animation: 'slideStep 0.3s ease-out' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#E3F2FD', border: '1px solid #90CAF9', borderRadius: 99, padding: '6px 16px', marginBottom: 20, fontSize: 12, fontWeight: 700, color: '#1565C0' }}>
        💳 Pagamento via Mercado Pago
      </div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 20, color: '#1f2937', marginBottom: 16 }}>Finalizar Pagamento</h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
        Você será redirecionado para o Mercado Pago.<br />
        Lá você pode pagar com <strong>PIX, Cartão ou Boleto</strong>.
      </p>
      <a href={initPoint} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', background: 'linear-gradient(135deg, #009EE3, #007BB5)', color: '#fff', borderRadius: 14, textDecoration: 'none', fontWeight: 800, fontSize: 16, fontFamily: "'DM Sans', sans-serif", boxShadow: '0 6px 20px rgba(0,158,227,0.35)', marginBottom: 16 }}>
        <ExternalLink size={18} /> Pagar {formatCurrency(total)}
      </a>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>Após o pagamento, você será redirecionado de volta</p>
      <button onClick={onCancelar} style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#f3f4f6', border: 'none', color: '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
        Cancelar e voltar
      </button>
    </div>
  );
}

function StepConfirmado({ pedidoId, formaPagamento, tipoEntrega, total, onClose }) {
  return (
    <div style={{ textAlign: 'center', animation: 'slideStep 0.3s ease-out' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #50A773, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(80,167,115,0.4)' }}>
        <CheckCircle size={42} color="#fff" strokeWidth={2.5} />
      </div>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 24, color: '#1f2937', marginBottom: 8 }}>Pedido Confirmado! 🎉</h3>
      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>
        {tipoEntrega === 'Entrega' ? 'Estamos preparando seu pedido para entrega' : 'Prepare-se para ir buscar seu pedido'}
      </p>
      <div style={{ background: '#f9fafb', borderRadius: 16, padding: '16px 20px', border: '1px solid #e5e7eb', marginBottom: 24, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
      <button onClick={onClose} style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #EA1D2C, #C8101E)', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 6px 20px rgba(234,29,44,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
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
  endereco,
  onClose,
  onPedidoConfirmado,
}) {
  const [step, setStep] = useState('resumo');
  const [tipoEntrega, setTipoEntrega] = useState('Entrega');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [totalFinal, setTotalFinal] = useState(0);
  const [pedidoId, setPedidoId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mpData, setMpData] = useState(null); // Guardar os dados do Mercado Pago

  const subtotal = calcularTotal();
  const taxa = tipoEntrega === 'Entrega' ? 4.99 : 0;
  const totalComTaxa = subtotal + taxa;

  const handleResumoNext = () => setStep('entrega');
  const handleEntregaNext = () => setStep('pagamento');

  const handlePagamentoNext = async () => {
    setTotalFinal(totalComTaxa);
    setLoading(true);
    setErrorMsg('');

    try {
      const resultado = await onPedidoConfirmado({
        tipoEntrega,
        formaPagamento,
        total: totalComTaxa
      });

      if (resultado.sucesso) {
        setPedidoId(resultado.pagamento?.pedido_id || 'FE001');
        
        if (formaPagamento === 'Mercado Pago') {
          setMpData({
            initPoint: resultado.initPoint,
            preferenceId: resultado.preferenceId
          });
          setStep('processando'); // Mostra a tela do Mercado Pago
        } else {
          // Cartão ou Dinheiro vai direto pra confirmado
          setStep('confirmado');
        }
      } else {
        setErrorMsg(resultado.mensagem);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      setErrorMsg('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFechar = () => onClose();

  return (
    <>
      <style>{CHECKOUT_STYLES}</style>
      <div onClick={step !== 'processando' ? handleFechar : undefined} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px 32px', animation: 'modalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', position: 'relative' }}>
          
          {step !== 'processando' && step !== 'confirmado' && (
            <button onClick={handleFechar} style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={15} color="#6b7280" />
            </button>
          )}

          {['resumo', 'entrega', 'pagamento'].includes(step) && (
            <ProgressBar step={step} />
          )}

          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px', borderRadius: 12, marginBottom: 20, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
              {errorMsg}
            </div>
          )}

          {/* RENDERIZAÇÃO CONDICIONAL DOS STEPS */}
          {step === 'resumo' && (
            <StepResumo carrinho={carrinho} calcularTotal={calcularTotal} endereco={endereco} onNext={handleResumoNext} />
          )}
          
          {step === 'entrega' && (
            <StepEntrega tipoEntrega={tipoEntrega} setTipoEntrega={setTipoEntrega} onNext={handleEntregaNext} onBack={() => setStep('resumo')} />
          )}
          
          {step === 'pagamento' && (
            <StepPagamento formaPagamento={formaPagamento} setFormaPagamento={setFormaPagamento} onNext={handlePagamentoNext} onBack={() => setStep('entrega')} total={totalComTaxa} loading={loading} />
          )}
          
          {step === 'processando' && mpData && (
            <StepProcessandoMP initPoint={mpData.initPoint} total={totalComTaxa} onCancelar={() => setStep('pagamento')} />
          )}
          
          {step === 'confirmado' && (
            <StepConfirmado pedidoId={pedidoId} formaPagamento={formaPagamento} tipoEntrega={tipoEntrega} total={totalFinal} onClose={handleFechar} />
          )}

        </div>
      </div>
    </>
  );
}