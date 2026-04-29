// ============================================================
// COMPONENT: StepPagamento
// Responsabilidade: Seleção da forma de pagamento no checkout
// ============================================================
import React, { useState } from 'react';
import { 
  QrCode, CreditCard, Banknote, ArrowLeft, 
  CheckCircle, Shield, Zap, RefreshCw, ChevronRight 
} from 'lucide-react';
import { ENV } from '../config/env';

// ==========================================
// ESTILOS
// ==========================================
const cardInputSt = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid #e5e7eb',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box'
};

const errorSt = {
  color: '#ef4444',
  fontSize: '11px',
  marginTop: '4px',
  fontWeight: '600'
};

const primaryBtnSt = {
  width: '100%',
  padding: '16px',
  borderRadius: '14px',
  background: '#ea1d2c',
  color: '#fff',
  border: 'none',
  fontWeight: '800',
  fontSize: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  marginTop: '10px',
  transition: 'opacity 0.2s',
  fontFamily: "'DM Sans', sans-serif"
};

const backBtnSt = {
  background: 'none',
  border: 'none',
  color: '#6b7280',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '0',
  marginBottom: '16px',
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: '500'
};

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatValidade(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function luhnCheck(numero) {
  let sum = 0;
  let alternate = false;
  for (let i = numero.length - 1; i >= 0; i--) {
    let digit = parseInt(numero.charAt(i), 10);
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function StepPagamento({ 
  formaPagamento, 
  setFormaPagamento, 
  onNext, 
  onBack, 
  total, 
  carrinho, 
  usuarioLogado 
}) {
  const [cardData, setCardData] = useState({ 
    numero: '', nome: '', validade: '', cvv: '' 
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const methods = [
    {
      key: 'PIX',
      icon: QrCode,
      label: 'PIX',
      desc: 'Aprovação imediata com 5% OFF',
      badge: '5% OFF',
      badgeColor: '#50A773',
      color: '#00b4d8'
    },
    {
      key: 'Cartão',
      icon: CreditCard,
      label: 'Cartão de Crédito/Débito',
      desc: 'Visa, Mastercard, Elo e mais',
      color: '#6366f1'
    },
    {
      key: 'Dinheiro',
      icon: Banknote,
      label: 'Dinheiro na entrega',
      desc: 'Pague ao receber o pedido',
      color: '#50A773'
    }
  ];

  // Adicionar Mercado Pago se configurado
  if (ENV.isMercadoPagoConfigured()) {
    methods.push({
      key: 'Mercado Pago',
      icon: CreditCard,
      label: 'Mercado Pago',
      desc: 'PIX, Cartão ou Boleto em um só lugar',
      color: '#009EE3'
    });
  }

  const handleNext = async () => {
    if (formaPagamento === 'Cartão') {
      const validationErrors = validateCardData(cardData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }
    
    onNext(formaPagamento === 'Cartão' ? cardData : null);
  };

  const validateCardData = (data) => {
    const errs = {};
    
    // Validar número
    const numero = data.numero.replace(/\s/g, '');
    if (numero.length < 13) errs.numero = 'Número muito curto';
    else if (!luhnCheck(numero)) errs.numero = 'Número inválido';
    
    // Validar validade
    if (data.validade) {
      const [mes, ano] = data.validade.split('/');
      const hoje = new Date();
      const anoAtual = hoje.getFullYear() % 100;
      const mesAtual = hoje.getMonth() + 1;
      
      if (parseInt(ano) < anoAtual || 
          (parseInt(ano) === anoAtual && parseInt(mes) < mesAtual)) {
        errs.validade = 'Cartão vencido';
      }
    } else {
      errs.validade = 'Data inválida';
    }
    
    // Validar CVV
    if (data.cvv.length < 3) errs.cvv = 'CVV inválido';
    
    // Validar nome
    if (!data.nome.trim()) errs.nome = 'Nome é obrigatório';
    
    return errs;
  };

  const desconto = formaPagamento === 'PIX' ? total * 0.05 : 0;
  const totalFinal = total - desconto;

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <button onClick={onBack} style={backBtnSt}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <h3 style={{
        fontFamily: "'Syne', sans-serif", 
        fontWeight: 800, 
        fontSize: 18,
        color: '#1f2937', 
        margin: '16px 0 8px',
      }}>
        Forma de Pagamento
      </h3>

      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
        Escolha como deseja pagar pelo seu pedido
      </p>

      {/* Métodos de pagamento */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {methods.map(({ key, icon: Icon, label, desc, badge, badgeColor, color }) => (
          <button
            key={key}
            onClick={() => { 
              setFormaPagamento(key); 
              setErrors({}); 
            }}
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: 14,
              padding: '14px 16px', 
              borderRadius: 14, 
              cursor: 'pointer',
              border: `2px solid ${formaPagamento === key ? color : '#e5e7eb'}`,
              background: formaPagamento === key ? '#fafafa' : '#fff',
              transition: 'all 0.2s', 
              textAlign: 'left', 
              width: '100%',
              fontFamily: "'DM Sans', sans-serif"
            }}
          >
            <div style={{
              width: 40, 
              height: 40, 
              borderRadius: 11, 
              flexShrink: 0,
              background: formaPagamento === key ? color : '#f3f4f6',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}>
              <Icon size={19} color={formaPagamento === key ? '#fff' : '#9ca3af'} />
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{
                  fontSize: 14, 
                  fontWeight: 700,
                  color: formaPagamento === key ? '#1f2937' : '#374151',
                }}>
                  {label}
                </p>
                {badge && (
                  <span style={{
                    background: badgeColor, 
                    color: '#fff',
                    fontSize: 10, 
                    fontWeight: 800, 
                    padding: '2px 7px',
                    borderRadius: 99,
                  }}>
                    {badge}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>{desc}</p>
            </div>
            
            {formaPagamento === key && (
              <CheckCircle size={18} color={color} style={{ flexShrink: 0 }} />
            )}
          </button>
        ))}
      </div>

      {/* Formulário Cartão */}
      {formaPagamento === 'Cartão' && (
        <div style={{
          background: '#f9fafb', 
          borderRadius: 16, 
          padding: 20,
          border: '1px solid #e5e7eb', 
          marginBottom: 20,
          animation: 'slideStep 0.25s ease-out'
        }}>
          <p style={{
            fontSize: 12, 
            fontWeight: 700, 
            color: '#6b7280',
            textTransform: 'uppercase', 
            letterSpacing: '0.06em',
            marginBottom: 16,
          }}>
            🔒 Dados do Cartão
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Número do cartão */}
            <div>
              <input
                type="text"
                placeholder="Número do cartão"
                value={cardData.numero}
                onChange={e => setCardData(p => ({ 
                  ...p, 
                  numero: formatCardNumber(e.target.value)
                }))}
                maxLength={19}
                style={{ 
                  ...cardInputSt, 
                  borderColor: errors.numero ? '#ef4444' : '#e5e7eb',
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = errors.numero ? '#ef4444' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.numero && <p style={errorSt}>{errors.numero}</p>}
            </div>
            
            {/* Nome no cartão */}
            <div>
              <input
                type="text"
                placeholder="Nome impresso no cartão"
                value={cardData.nome}
                onChange={e => setCardData(p => ({ 
                  ...p, 
                  nome: e.target.value.toUpperCase() 
                }))}
                style={{ 
                  ...cardInputSt, 
                  borderColor: errors.nome ? '#ef4444' : '#e5e7eb',
                  fontFamily: "'DM Sans', sans-serif"
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = errors.nome ? '#ef4444' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.nome && <p style={errorSt}>{errors.nome}</p>}
            </div>
            
            {/* Validade e CVV */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={cardData.validade}
                  onChange={e => setCardData(p => ({ 
                    ...p, 
                    validade: formatValidade(e.target.value)
                  }))}
                  maxLength={5}
                  style={{ 
                    ...cardInputSt, 
                    borderColor: errors.validade ? '#ef4444' : '#e5e7eb',
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = errors.validade ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.validade && <p style={errorSt}>{errors.validade}</p>}
              </div>
              
              <div>
                <input
                  type="password"
                  placeholder="CVV"
                  value={cardData.cvv}
                  onChange={e => setCardData(p => ({ 
                    ...p, 
                    cvv: e.target.value.replace(/\D/g, '').slice(0, 4)
                  }))}
                  maxLength={4}
                  style={{ 
                    ...cardInputSt, 
                    borderColor: errors.cvv ? '#ef4444' : '#e5e7eb',
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = errors.cvv ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                {errors.cvv && <p style={errorSt}>{errors.cvv}</p>}
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            marginTop: 12,
            color: '#9ca3af', 
            fontSize: 11,
          }}>
            <Shield size={12} /> 
            Seus dados são criptografados - não armazenamos números completos
          </div>
        </div>
      )}

      {/* Info PIX */}
      {formaPagamento === 'PIX' && (
        <div style={{
          background: '#E8F5EE', 
          borderRadius: 12, 
          padding: '12px 16px',
          border: '1px solid #a7f3d0', 
          marginBottom: 20,
          animation: 'slideStep 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Zap size={16} color="#50A773" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
                5% de desconto no PIX!
              </p>
              <p style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                De {formatCurrency(total)} por <strong>{formatCurrency(totalFinal)}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Dinheiro */}
      {formaPagamento === 'Dinheiro' && (
        <div style={{
          background: '#fffbeb', 
          borderRadius: 12, 
          padding: '12px 16px',
          border: '1px solid #fde68a', 
          marginBottom: 20, 
          fontSize: 13, 
          color: '#92400e',
          animation: 'slideStep 0.25s ease-out'
        }}>
          💵 Nosso entregador levará troco para até <strong>{formatCurrency(Math.ceil(total / 10) * 10)}</strong>
        </div>
      )}

      {/* Botão de confirmação */}
      <button 
        onClick={handleNext} 
        disabled={!formaPagamento || loading}
        style={{
          ...primaryBtnSt,
          opacity: formaPagamento && !loading ? 1 : 0.5,
          cursor: formaPagamento && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? (
          <>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Processando...
          </>
        ) : (
          <>
            {formaPagamento === 'PIX' ? `Gerar PIX — ${formatCurrency(totalFinal)}`
              : formaPagamento === 'Cartão' ? `Pagar ${formatCurrency(total)}`
              : `Confirmar Pedido — ${formatCurrency(total)}`}
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}