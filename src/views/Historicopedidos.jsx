// ============================================================
// VIEW: HistoricoPedidos — FoodExpress (iFood Clone)
// Paleta: Vermelho iFood / Branco
// ============================================================
import React from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useHistoricoController } from '../controllers/useHistoricoController';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
:root { --primary: #EA1D2C; --primary-light: #FFF0F0; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DM Sans', sans-serif; }
@keyframes slideUp {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}
`;

function HistoricoPedidos({ telefone, onVoltar, onVerDetalhes }) {
  const { pedidos } = useHistoricoController(telefone);

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
            width: 160, height: 160, borderRadius: '50%',
            background: 'rgba(234,29,44,0.12)', pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 680, margin: '0 auto', position: 'relative' }}>
            <button onClick={onVoltar} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.1)', border: 'none',
              borderRadius: 10, padding: '7px 14px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600,
              marginBottom: 16,
            }}>
              <ChevronLeft size={16} /> Voltar
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={22} color="var(--primary)" />
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 24, color: '#fff' }}>
                Meus Pedidos
              </h2>
            </div>
          </div>
        </div>

        <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 24px 48px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pedidos.map((p, i) => (
              <div key={p.id} onClick={() => onVerDetalhes(p.id)} style={{
                background: '#fff', padding: '18px 20px',
                borderRadius: 16, border: '1px solid #e5e7eb',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                animation: `slideUp ${0.2 + i * 0.05}s ease-out`,
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#1f2937' }}>
                    {p.restaurantes?.nome ?? 'Restaurante'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 13 }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>R$ {p.total.toFixed(2)}</span>
                    <span style={{ color: '#d1d5db' }}>•</span>
                    <span style={{
                      fontWeight: 700,
                      color: p.status === 'Entregue' ? '#50A773' : 'var(--primary)',
                      background: p.status === 'Entregue' ? '#E8F5EE' : '#FFF0F0',
                      padding: '2px 10px', borderRadius: 99, fontSize: 11,
                    }}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} color="#d1d5db" />
              </div>
            ))}
            {pedidos.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '60px 24px',
                background: '#fff', borderRadius: 16,
                border: '1.5px dashed #d1d5db',
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#1f2937' }}>
                  Nenhum pedido encontrado
                </p>
                <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>Seus pedidos aparecerão aqui</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default HistoricoPedidos;