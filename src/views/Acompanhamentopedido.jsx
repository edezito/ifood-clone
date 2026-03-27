// ============================================================
// VIEW: AcompanhamentoPedido — FoodExpress (iFood Clone)
// Paleta: Vermelho iFood / Branco
// ============================================================
import React from 'react';
import { CheckCircle, ChevronLeft, ReceiptText } from 'lucide-react';
import { useAcompanhamentoController } from '../controllers/useAcompanhamentoController';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
:root {
  --primary:#EA1D2C; --primary-light:#FFF0F0;
  --green:#50A773;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DM Sans',sans-serif; background:#fafafa; }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
@keyframes slideUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
`;

const STATUS_STEPS = [
  { label: 'Pedido Recebido',    key: 'Aguardando',     icon: '📋', color: '#F59E0B' },
  { label: 'Em Preparação',      key: 'Em Preparação',  icon: '👨‍🍳', color: '#3B82F6' },
  { label: 'Saiu para Entrega',  key: 'Em Trânsito',    icon: '🛵', color: '#8B5CF6' },
  { label: 'Entregue',           key: 'Entregue',       icon: '✅', color: '#50A773' },
];

function AcompanhamentoPedido({ pedidoId, onVoltarAoMenu }) {
  const { pedido, itens } = useAcompanhamentoController(pedidoId);

  if (!pedido) {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          minHeight: '100vh', background: '#fafafa',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{ fontSize: 48, animation: 'pulse 1.5s infinite' }}>🛵</div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#1f2937' }}>Carregando seu pedido…</p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Aguarde um instante</p>
        </div>
      </>
    );
  }

  const stepIndex = STATUS_STEPS.findIndex(s => s.key === pedido.status);
  const activeStep = STATUS_STEPS[stepIndex] ?? STATUS_STEPS[0];

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: 'DM Sans, sans-serif' }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a0808, #2B1A1A, #3E2020)',
          padding: '20px 24px 28px',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -40, top: -40,
            width: 180, height: 180, borderRadius: '50%',
            background: 'rgba(234,29,44,0.12)', pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
            <button onClick={onVoltarAoMenu} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600,
              marginBottom: 20,
            }}>
              <ChevronLeft size={16} /> Voltar
            </button>

            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Pedido #{pedido.id.toString().slice(0, 8)}
            </p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 24, color: '#fff' }}>
              {activeStep.icon} {activeStep.label}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              para {pedido.cliente_nome}
            </p>
          </div>
        </div>

        <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 24px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Progress tracker */}
          <div style={{
            background: '#fff', borderRadius: 20,
            padding: 24, border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            animation: 'slideUp 0.4s ease-out',
          }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: '#9ca3af', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Acompanhe seu pedido
            </p>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STATUS_STEPS.map((step, i) => {
                const done = stepIndex >= i;
                const active = stepIndex === i;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: i < STATUS_STEPS.length - 1 ? 20 : 0, position: 'relative' }}>
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{
                        position: 'absolute', left: 17, top: 34, width: 2, height: 'calc(100% - 14px)',
                        background: done ? step.color : '#e5e7eb', transition: 'background 0.3s',
                      }} />
                    )}
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: done ? step.color : '#fff',
                      border: `2px solid ${done ? step.color : '#e5e7eb'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: done ? 16 : 14, transition: 'all 0.3s',
                      boxShadow: active ? `0 0 0 4px ${step.color}25` : 'none',
                      position: 'relative', zIndex: 1,
                    }}>
                      {done ? step.icon : <span style={{ color: '#9ca3af', fontSize: 12 }}>{i + 1}</span>}
                    </div>
                    <div style={{ paddingTop: 6 }}>
                      <p style={{ fontWeight: done ? 700 : 500, fontSize: 15, color: done ? '#1f2937' : '#9ca3af' }}>
                        {step.label}
                      </p>
                      {active && (
                        <p style={{ fontSize: 12, color: step.color, fontWeight: 600, marginTop: 2 }}>● Em andamento</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PIN card */}
          {pedido.status === 'Em Trânsito' && (
            <div style={{
              background: 'linear-gradient(135deg, #1a0808, #2B1A1A)',
              borderRadius: 20, padding: 24, textAlign: 'center',
              boxShadow: '0 8px 24px rgba(43,26,26,0.3)',
              animation: 'slideUp 0.5s ease-out',
            }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Mostre ao entregador
              </p>
              <p style={{
                fontFamily: 'Syne, sans-serif', fontWeight: 900,
                fontSize: 48, color: '#fff', letterSpacing: '0.3em',
                textShadow: '0 4px 20px rgba(234,29,44,0.4)',
              }}>
                {pedido.pin_entrega}
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
                background: 'rgba(234,29,44,0.2)', borderRadius: 99, padding: '5px 14px',
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#FF6B6B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  🔒 Código de segurança
                </span>
              </div>
            </div>
          )}

          {/* Entregue */}
          {pedido.status === 'Entregue' && (
            <div style={{
              background: 'linear-gradient(135deg,#E8F5EE,#D1FAE5)',
              borderRadius: 20, padding: 24, textAlign: 'center',
              border: '1.5px solid #A7F3D0',
              animation: 'slideUp 0.5s ease-out',
            }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>🎉</div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 20, color: '#065F46' }}>Pedido entregue!</p>
              <p style={{ fontSize: 13, color: '#047857', marginTop: 4 }}>Bom apetite! Esperamos que aproveite.</p>
            </div>
          )}

          {/* Resumo */}
          <div style={{
            background: '#fff', borderRadius: 20, overflow: 'hidden',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            animation: 'slideUp 0.6s ease-out',
          }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ReceiptText size={18} color="var(--primary)" />
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#1f2937' }}>Resumo do pedido</p>
            </div>
            <div style={{ padding: '4px 20px' }}>
              {itens.length > 0 ? itens.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: i < itens.length - 1 ? '1px solid #f3f4f6' : 'none', gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      background: 'var(--primary-light)', borderRadius: 8,
                      padding: '3px 8px', fontSize: 12, fontWeight: 700, color: 'var(--primary)',
                    }}>
                      {item.quantidade}×
                    </div>
                    <p style={{ fontSize: 14, color: '#1f2937', fontWeight: 500 }}>{item.produtos?.nome ?? 'Produto'}</p>
                  </div>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#1f2937', flexShrink: 0 }}>
                    R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                  </p>
                </div>
              )) : (
                <p style={{ padding: '16px 0', color: '#9ca3af', fontSize: 13, fontStyle: 'italic' }}>Detalhes não disponíveis.</p>
              )}
            </div>
            <div style={{
              padding: '16px 20px', background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Total</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: 'var(--primary)' }}>
                R$ {pedido.total.toFixed(2)}
              </p>
            </div>
          </div>

          <button onClick={onVoltarAoMenu} style={{
            padding: 14, borderRadius: 12, border: '1.5px solid #e5e7eb',
            background: '#fff', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
            fontSize: 14, color: '#374151', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
          >
            ← Voltar para o início
          </button>
        </main>
      </div>
    </>
  );
}

export default AcompanhamentoPedido;