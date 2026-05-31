import React, { useState } from 'react';
import {
  X, Truck, Store, CheckCircle, ArrowLeft,
  MapPin, ChevronRight, ExternalLink, Clock, Navigation
} from 'lucide-react';
import StepPagamento from './StepPagamento';
import {SelecaoEntregaPedido} from './SelecaoEntregaPedido';

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
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

const STEPS = ['resumo', 'entrega', 'pagamento', 'processando', 'confirmado'];

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

/* ─── PROGRESS BAR ───────────────────────────────────────── */
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
            <span style={{
              fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.04em',
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

/* ─── STEP RESUMO ─────────────────────────────────────────── */
function StepResumo({ carrinho, calcularTotal, onNext }) {
  const subtotal = calcularTotal();

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: 18, color: '#1f2937', marginBottom: 20,
      }}>
        Resumo do Pedido
      </h3>

      <div style={{
        background: '#f9fafb', borderRadius: 14,
        padding: '4px 16px', marginBottom: 20,
        border: '1px solid #e5e7eb',
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
                width: 22, height: 22, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, flexShrink: 0,
              }}>
                {item.quantidade}
              </span>
              <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                {item.nome}
              </span>
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
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: '#9ca3af', fontStyle: 'italic',
        }}>
          <span>Taxa de entrega</span>
          <span>calculada no próximo passo</span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 17, fontWeight: 900, color: '#1f2937',
          fontFamily: "'Syne', sans-serif",
          paddingTop: 8, borderTop: '2px solid #e5e7eb', marginTop: 4,
        }}>
          <span>Subtotal</span>
          <span style={{ color: '#EA1D2C' }}>{formatCurrency(subtotal)}</span>
        </div>
      </div>

      <button
        onClick={onNext}
        style={{
          width: '100%', padding: '15px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #EA1D2C, #C8101E)', color: '#fff',
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(234,29,44,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ─── STEP PROCESSANDO MERCADO PAGO ──────────────────────── */
function StepProcessandoMP({ initPoint, total, onCancelar }) {
  // ✅ Abre o link automaticamente quando o componente montar
  React.useEffect(() => {
    if (initPoint) {
      // Abre em nova aba
      window.open(initPoint, '_blank');
    }
  }, [initPoint]);

  return (
    <div style={{ textAlign: 'center', padding: '20px 0', animation: 'slideStep 0.3s ease-out' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: '#E3F2FD', border: '1px solid #90CAF9',
        borderRadius: 99, padding: '6px 16px', marginBottom: 20,
        fontSize: 12, fontWeight: 700, color: '#1565C0',
      }}>
        💳 Pagamento via Mercado Pago
      </div>

      <h3 style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 900,
        fontSize: 20, color: '#1f2937', marginBottom: 16,
      }}>
        Redirecionando para o Mercado Pago...
      </h3>

      <div style={{
        display: 'flex', justifyContent: 'center', marginBottom: 24,
      }}>
        <Loader size={48} color="#EA1D2C" style={{ animation: 'spin 1s linear infinite' }} />
      </div>

      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
        Você será redirecionado para o Mercado Pago.<br />
        Lá você pode pagar com <strong>PIX, Cartão ou Boleto</strong>.
      </p>

      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 20 }}>
        Se não for redirecionado automaticamente, clique no botão abaixo:
      </p>

      <a
        href={initPoint}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 28px',
          background: 'linear-gradient(135deg, #009EE3, #007BB5)',
          color: '#fff', borderRadius: 14, textDecoration: 'none',
          fontWeight: 700, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
          boxShadow: '0 4px 12px rgba(0,158,227,0.35)', marginBottom: 16,
        }}
      >
        <ExternalLink size={16} /> Abrir Pagamento
      </a>

      <button
        onClick={onCancelar}
        style={{
          width: '100%', padding: '12px', borderRadius: 12,
          background: '#f3f4f6', border: 'none', color: '#6b7280',
          fontWeight: 600, fontSize: 13, cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Cancelar e voltar
      </button>
    </div>
  );
}

/* ─── STEP CONFIRMADO ─────────────────────────────────────── */
function StepConfirmado({ pedidoId, formaPagamento, tipoEntrega, total, tempoEstimado, rotaInfo, onAcompanhar }) {
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
        fontFamily: "'Syne', sans-serif", fontWeight: 900,
        fontSize: 24, color: '#1f2937', marginBottom: 8,
      }}>
        Pedido Confirmado! 🎉
      </h3>

      <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
        {tipoEntrega === 'Entrega'
          ? 'Estamos preparando seu pedido para entrega'
          : 'Prepare-se para ir buscar seu pedido'}
      </p>

      {/* Card de detalhes */}
      <div style={{
        background: '#f9fafb', borderRadius: 16,
        padding: '16px 20px', border: '1px solid #e5e7eb',
        marginBottom: 20, textAlign: 'left',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {[
          { label: 'Pedido', value: `#${pedidoId?.toString().slice(0, 8).toUpperCase() || 'FE001234'}` },
          { label: 'Pagamento', value: formaPagamento },
          { label: 'Modalidade', value: tipoEntrega === 'Entrega' ? '🛵 Delivery' : '🏪 Retirada' },
          { label: 'Total', value: formatCurrency(total) },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#9ca3af', fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Card de tempo — destaque */}
      <div style={{
        background: 'linear-gradient(135deg, #FFF0F0, #fff5f5)',
        borderRadius: 16, border: '1px solid #fecaca',
        padding: '14px 18px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 14,
        animation: 'fadeInUp 0.4s ease-out 0.15s both',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: '#EA1D2C', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Clock size={22} color="#fff" />
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: 11, color: '#EA1D2C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Tempo estimado de entrega
          </p>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 22, color: '#1f2937', margin: '2px 0 0' }}>
            {tempoEstimado?.texto || (tipoEntrega === 'Entrega' ? '~35 minutos' : '~15 minutos')}
          </p>
          {rotaInfo && tipoEntrega === 'Entrega' && (
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Navigation size={10} />
              {rotaInfo.distanciaKm} km · via OpenStreetMap
            </p>
          )}
        </div>
      </div>

      <button
        onClick={() => onAcompanhar(pedidoId)}
        style={{
          width: '100%', padding: '15px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #EA1D2C, #C8101E)', color: '#fff',
          fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15,
          cursor: 'pointer', boxShadow: '0 6px 20px rgba(234,29,44,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
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
  onAcompanharPedido,
}) {
  const [step, setStep] = useState('resumo');
  const [tipoEntrega, setTipoEntrega] = useState('Entrega');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [totalFinal, setTotalFinal] = useState(0);
  const [taxaFrete, setTaxaFrete] = useState(0);
  const [tempoEstimado, setTempoEstimado] = useState(null);
  const [rotaInfo, setRotaInfo] = useState(null);
  const [pedidoId, setPedidoId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mpData, setMpData] = useState(null);

  // Restaurante do primeiro item do carrinho
  const restauranteId = carrinho?.[0]?.restauranteId ?? null;

  const subtotal = calcularTotal();

  // ── Handlers de navegação ──────────────────────────────
  const handleResumoNext = () => setStep('entrega');

  // Chamado pelo SelecaoEntregaPedido ao confirmar entrega
  const handleEntregaConfirmada = ({ tipoEntrega: tipo, taxaFrete: taxa, tempoEstimado: tempo, rotaInfo: rota }) => {
    // ✅ LOG para debug
    console.log('📦 [CheckoutModal] Recebendo do SelecaoEntrega:', { tipo, taxa, tempo, rota });
    
    // ✅ Converte e atualiza os estados
    const novoTipo = tipo === 'retirada' ? 'Retirada' : 'Entrega';
    const novoFrete = tipo === 'retirada' ? 0 : Number(taxa || 0);
    
    console.log('💰 [CheckoutModal] Frete recebido:', novoFrete);
    
    setTipoEntrega(novoTipo);
    setTaxaFrete(novoFrete);
    setTempoEstimado(tempo ?? null);
    setRotaInfo(rota ?? null);
    setStep('pagamento');
  };

  const totalComTaxa = subtotal + (tipoEntrega === 'Retirada' ? 0 : taxaFrete);

  const handlePagamentoNext = async () => {
    const freteFinal = tipoEntrega === 'Retirada' ? 0 : taxaFrete;
    const totalComTaxa = subtotal + freteFinal;
    
    console.log('📦 Enviando para processamento:', {
      tipoEntrega,
      formaPagamento,
      total: totalComTaxa,
      taxaFrete: freteFinal,
      subtotal,
      tempoEstimado
    });

    setTotalFinal(totalComTaxa);
    setLoading(true);
    setErrorMsg('');

    try {
      const resultado = await onPedidoConfirmado({
        tipoEntrega,
        formaPagamento,
        total: totalComTaxa,
        taxaFrete: freteFinal,
        tempoEstimado,
        rotaInfo,
        carrinho,
        usuarioLogado
      });

      console.log('✅ Resultado do processamento:', resultado);

      if (resultado.sucesso) {
        setPedidoId(resultado.pagamento?.pedido_id || resultado.pedido?.id || 'FE001');

        if (formaPagamento === 'Mercado Pago' && resultado.initPoint) {
          // ✅ Para Mercado Pago, mostra o step processando e depois redireciona
          setMpData({ 
            initPoint: resultado.initPoint, 
            preferenceId: resultado.preferenceId 
          });
          setStep('processando');
          
          // ✅ Abre o link em nova aba automaticamente após 500ms
          setTimeout(() => {
            window.open(resultado.initPoint, '_blank');
          }, 500);
        } else {
          setStep('confirmado');
        }
      } else {
        setErrorMsg(resultado.mensagem || 'Pagamento não processado. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      setErrorMsg('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFechar = () => onClose();

  return (
    <>
      <style>{CHECKOUT_STYLES}</style>

      {/* Backdrop */}
      <div
        onClick={step !== 'processando' ? handleFechar : undefined}
        style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}
      >
        {/* Modal */}
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
          {/* Botão fechar */}
          {step !== 'processando' && step !== 'confirmado' && (
            <button
              onClick={handleFechar}
              style={{
                position: 'absolute', top: 16, right: 16,
                width: 32, height: 32, borderRadius: 8, border: 'none',
                background: '#f3f4f6', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} color="#6b7280" />
            </button>
          )}

          {/* Progress bar agora engloba a entrega também */}
          {['resumo', 'entrega', 'pagamento'].includes(step) && (
            <ProgressBar step={step} />
          )}

          {/* Mensagem de erro */}
          {errorMsg && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FCA5A5',
              color: '#B91C1C', padding: 12, borderRadius: 12,
              marginBottom: 20, fontSize: 13, fontWeight: 600, textAlign: 'center',
            }}>
              {errorMsg}
            </div>
          )}

          {/* Steps */}
          {step === 'resumo' && (
            <StepResumo
              carrinho={carrinho}
              calcularTotal={calcularTotal}
              endereco={usuarioLogado?.endereco || endereco}
              onNext={handleResumoNext}
            />
          )}

          {/* STEP DE ENTREGA */}
          {step === 'entrega' && (
            <SelecaoEntregaPedido
              carrinhoItems={carrinho}
              usuarioLogado={usuarioLogado}
              restauranteId={restauranteId}
              onVoltar={() => setStep('resumo')}
              onAvancarPagamento={handleEntregaConfirmada}
            />
          )}

          {step === 'pagamento' && (
            <>
              {/* Resumo da entrega escolhida */}
              <div style={{
                background: '#f9fafb', borderRadius: 12,
                padding: '10px 14px', marginBottom: 20,
                border: '1px solid #e5e7eb',
                display: 'flex', alignItems: 'center', gap: 10,
                animation: 'fadeInUp 0.3s ease-out',
              }}>
                {tipoEntrega === 'Entrega'
                  ? <Truck size={16} color="#EA1D2C" style={{ flexShrink: 0 }} />
                  : <Store size={16} color="#50A773" style={{ flexShrink: 0 }} />
                }
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', margin: 0 }}>
                    {tipoEntrega === 'Entrega' ? '🛵 Entrega' : '🏪 Retirada no local'}
                  </p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: '1px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} />
                    {tempoEstimado?.texto || (tipoEntrega === 'Entrega' ? '~35 min' : '~15 min')}
                    {tipoEntrega === 'Entrega' && taxaFrete > 0 && (
                      <span style={{ marginLeft: 6, color: '#EA1D2C', fontWeight: 600 }}>
                        · +{formatCurrency(taxaFrete)} frete
                      </span>
                    )}
                    {tipoEntrega === 'Retirada' && (
                      <span style={{ marginLeft: 6, color: '#50A773', fontWeight: 600 }}>· Frete grátis</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setStep('entrega')}
                  style={{
                    fontSize: 11, color: '#EA1D2C', fontWeight: 700,
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px 8px', borderRadius: 6,
                    textDecoration: 'underline', flexShrink: 0,
                  }}
                >
                  alterar
                </button>
              </div>

              <StepPagamento
                formaPagamento={formaPagamento}
                setFormaPagamento={setFormaPagamento}
                onNext={handlePagamentoNext}
                onBack={() => setStep('entrega')}
                total={totalComTaxa}
                loading={loading}
              />
            </>
          )}

          {step === 'processando' && mpData && (
            <StepProcessandoMP
              initPoint={mpData.initPoint}
              total={totalComTaxa}
              onCancelar={() => setStep('pagamento')}
            />
          )}

          {step === 'confirmado' && (
            <StepConfirmado
              pedidoId={pedidoId}
              formaPagamento={formaPagamento}
              tipoEntrega={tipoEntrega}
              total={totalFinal}
              tempoEstimado={tempoEstimado}
              rotaInfo={rotaInfo}
              onAcompanhar={onAcompanharPedido}
            />
          )}
        </div>
      </div>
    </>
  );
}