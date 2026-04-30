import React from 'react';
import { CreditCard, Zap, ChevronRight, ArrowLeft, Banknote } from 'lucide-react';

export default function StepPagamento({ 
  formaPagamento, 
  setFormaPagamento, 
  onNext, 
  onBack, 
  total, 
  loading 
}) {
  // Apenas Mercado Pago na opção Online
  const pagamentosOnline = [
    { id: 'Mercado Pago', nome: 'Pagar com Mercado Pago', icone: Zap, cor: '#009EE3' }
  ];

  // Cartão e Dinheiro no Presencial
  const pagamentosPresenciais = [
    { id: 'Cartão', nome: 'Máquina de Cartão', icone: CreditCard, cor: '#4b5563' },
    { id: 'Dinheiro', nome: 'Dinheiro Físico', icone: Banknote, cor: '#16a34a' }
  ];

  const renderOpcoes = (opcoes) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {opcoes.map(({ id, nome, icone: Icone, cor }) => (
        <button 
          key={id} 
          onClick={() => setFormaPagamento(id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px', borderRadius: 14, cursor: 'pointer',
            border: `2px solid ${formaPagamento === id ? '#EA1D2C' : '#e5e7eb'}`,
            background: formaPagamento === id ? '#FFF0F0' : '#fff',
            transition: 'all 0.2s', textAlign: 'left', width: '100%'
          }}
        >
          <Icone size={22} color={formaPagamento === id ? '#EA1D2C' : cor} />
          <span style={{ 
            fontSize: 15, 
            fontWeight: formaPagamento === id ? 700 : 500,
            color: formaPagamento === id ? '#EA1D2C' : '#374151',
            flex: 1
          }}>
            {nome}
          </span>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            border: `2px solid ${formaPagamento === id ? '#EA1D2C' : '#d1d5db'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff'
          }}>
            {formaPagamento === id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EA1D2C' }} />}
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#f3f4f6', border: 'none', borderRadius: 10,
        padding: '7px 14px', cursor: 'pointer', color: '#6b7280', 
        fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif"
      }}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: '#1f2937', margin: '16px 0 24px' }}>
        Como você prefere pagar?
      </h3>

      {/* Seção Online */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
          💻 Pelo App (Online)
        </p>
        {renderOpcoes(pagamentosOnline)}
      </div>

      {/* Seção Presencial */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
          🤝 No Local (Na hora)
        </p>
        {renderOpcoes(pagamentosPresenciais)}
      </div>

      <button onClick={() => onNext(null)} disabled={!formaPagamento || loading} style={{
        width: '100%', padding: '15px', borderRadius: 14, border: 'none',
        background: 'linear-gradient(135deg, #EA1D2C, #C8101E)',
        color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800,
        fontSize: 15, cursor: formaPagamento && !loading ? 'pointer' : 'not-allowed',
        boxShadow: '0 6px 20px rgba(234,29,44,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: formaPagamento && !loading ? 1 : 0.5
      }}>
        {loading ? 'Processando...' : 'Finalizar Pedido'} 
        {!loading && <ChevronRight size={16} />}
      </button>
    </div>
  );
}