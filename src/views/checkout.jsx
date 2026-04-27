// ============================================================
// COMPONENT: CheckoutModal
// Responsabilidade: Modal de checkout com seleção de entrega,
// forma de pagamento e integração Mercado Pago
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Truck, Store, CreditCard, Banknote, QrCode,
  ChevronRight, CheckCircle, ArrowLeft, Copy, Clock,
  MapPin, Shield, Zap, RefreshCw,
} from 'lucide-react';

/* ─── Estilos ─────────────────────────────────────────────── */
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
.checkout-radio:checked { accent-color: #EA1D2C; }
`;

/* ─── Constantes ─────────────────────────────────────────── */
const MERCADO_PAGO_PUBLIC_KEY = 'TEST-your-public-key'; // substituir pela chave real

const STEPS = ['resumo', 'entrega', 'pagamento', 'processando', 'confirmado'];

/* ─── Helpers ─────────────────────────────────────────────── */
function formatCurrency(val) {
  return `R$ ${Number(val).toFixed(2)}`;
}

function generatePixCode(total, nome, pedidoId) {
  // Gera um código PIX copia-e-cola simulado (formato EMV real simplificado)
  const txid = pedidoId?.toString().slice(0, 8).toUpperCase().padEnd(8, '0') || 'FDEXP001';
  const amount = Number(total).toFixed(2);
  const merchantName = 'FoodExpress';
  const city = 'SAO PAULO';

  // Estrutura PIX simplificada para demonstração
  const pixKey = '11.234.567/0001-89'; // CNPJ fictício
  const payload = [
    '000201',
    '010212',
    `26${String(36 + pixKey.length).padStart(2,'0')}0014br.gov.bcb.pix01${String(pixKey.length).padStart(2,'0')}${pixKey}`,
    '52040000',
    '5303986',
    `54${String(amount.length).padStart(2,'0')}${amount}`,
    '5802BR',
    `59${String(merchantName.length).padStart(2,'0')}${merchantName}`,
    `60${String(city.length).padStart(2,'0')}${city}`,
    `62${String(txid.length + 4).padStart(2,'0')}05${String(txid.length).padStart(2,'0')}${txid}`,
    '6304',
  ].join('');

  // CRC16 simplificado
  const crc = Math.abs(payload.split('').reduce((acc, c) => acc ^ c.charCodeAt(0), 0xFFFF))
    .toString(16).toUpperCase().padStart(4, '0');

  return payload + crc;
}

/* ─── QR Code via API gratuita ────────────────────────────── */
function QRCodeDisplay({ value, size = 200 }) {
  const encoded = encodeURIComponent(value);
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=10&color=000000&bgcolor=FFFFFF`;

  return (
    <img
      src={url}
      alt="QR Code PIX"
      width={size}
      height={size}
      style={{ borderRadius: 12, border: '2px solid #e5e7eb', display: 'block' }}
    />
  );
}

/* ─── Step: Resumo ───────────────────────────────────────── */
function StepResumo({ carrinho, calcularTotal, endereco, onNext }) {
  const subtotal = calcularTotal();
  const taxa = 4.99;
  const total = subtotal + taxa;

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <h3 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18,
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
          fontFamily: 'Syne, sans-serif',
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

      <button onClick={() => onNext(total)} style={primaryBtnSt}>
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ─── Step: Entrega ──────────────────────────────────────── */
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
      <button onClick={onBack} style={backBtnSt}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <h3 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18,
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
              transition: 'all 0.2s',
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
        ...primaryBtnSt,
        opacity: tipoEntrega ? 1 : 0.5,
        cursor: tipoEntrega ? 'pointer' : 'not-allowed',
      }}>
        Continuar <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ─── Step: Pagamento ────────────────────────────────────── */
function StepPagamento({ formaPagamento, setFormaPagamento, onNext, onBack, total }) {
  const [cardData, setCardData] = useState({ numero: '', nome: '', validade: '', cvv: '' });
  const [errors, setErrors] = useState({});

  const methods = [
    {
      key: 'PIX',
      icon: QrCode,
      label: 'PIX',
      desc: 'Aprovação imediata — sem taxas',
      badge: '5% OFF',
      badgeColor: '#50A773',
      color: '#00b4d8',
    },
    {
      key: 'Cartão',
      icon: CreditCard,
      label: 'Cartão de Crédito/Débito',
      desc: 'Visa, Mastercard, Elo e mais',
      color: '#6366f1',
    },
    {
      key: 'Dinheiro',
      icon: Banknote,
      label: 'Dinheiro na entrega',
      desc: 'Pague ao receber o pedido',
      color: '#50A773',
    },
  ];

  const validateCard = () => {
    const errs = {};
    if (!cardData.numero || cardData.numero.replace(/\s/g, '').length < 16)
      errs.numero = 'Número inválido';
    if (!cardData.nome) errs.nome = 'Nome obrigatório';
    if (!cardData.validade || !/^\d{2}\/\d{2}$/.test(cardData.validade))
      errs.validade = 'Validade inválida';
    if (!cardData.cvv || cardData.cvv.length < 3) errs.cvv = 'CVV inválido';
    return errs;
  };

  const handleNext = () => {
    if (formaPagamento === 'Cartão') {
      const errs = validateCard();
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    onNext(cardData);
  };

  const formatCardNumber = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatValidade = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0,2)}/${digits.slice(2)}` : digits;
  };

  const desconto = formaPagamento === 'PIX' ? total * 0.05 : 0;
  const totalFinal = total - desconto;

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <button onClick={onBack} style={backBtnSt}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <h3 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18,
        color: '#1f2937', margin: '16px 0 8px',
      }}>
        Forma de Pagamento
      </h3>
      <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>
        Escolha como deseja pagar
      </p>

      {/* Métodos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {methods.map(({ key, icon: Icon, label, desc, badge, badgeColor, color }) => (
          <button
            key={key}
            onClick={() => { setFormaPagamento(key); setErrors({}); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
              border: `2px solid ${formaPagamento === key ? color : '#e5e7eb'}`,
              background: formaPagamento === key ? '#fafafa' : '#fff',
              transition: 'all 0.2s', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 11, flexShrink: 0,
              background: formaPagamento === key ? color : '#f3f4f6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              <Icon size={19} color={formaPagamento === key ? '#fff' : '#9ca3af'} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{
                  fontSize: 14, fontWeight: 700,
                  color: formaPagamento === key ? '#1f2937' : '#374151',
                }}>{label}</p>
                {badge && (
                  <span style={{
                    background: badgeColor, color: '#fff',
                    fontSize: 10, fontWeight: 800, padding: '2px 7px',
                    borderRadius: 99,
                  }}>{badge}</span>
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
          background: '#f9fafb', borderRadius: 16, padding: 20,
          border: '1px solid #e5e7eb', marginBottom: 20,
          animation: 'slideStep 0.25s ease-out',
        }}>
          <p style={{
            fontSize: 12, fontWeight: 700, color: '#6b7280',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16,
          }}>
            🔒 Dados do Cartão
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <input
                type="text"
                placeholder="Número do cartão"
                value={cardData.numero}
                onChange={e => setCardData(p => ({ ...p, numero: formatCardNumber(e.target.value) }))}
                maxLength={19}
                style={{ ...cardInputSt, borderColor: errors.numero ? '#ef4444' : '#e5e7eb' }}
              />
              {errors.numero && <p style={errorSt}>{errors.numero}</p>}
            </div>
            <div>
              <input
                type="text"
                placeholder="Nome no cartão"
                value={cardData.nome}
                onChange={e => setCardData(p => ({ ...p, nome: e.target.value.toUpperCase() }))}
                style={{ ...cardInputSt, borderColor: errors.nome ? '#ef4444' : '#e5e7eb' }}
              />
              {errors.nome && <p style={errorSt}>{errors.nome}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={cardData.validade}
                  onChange={e => setCardData(p => ({ ...p, validade: formatValidade(e.target.value) }))}
                  maxLength={5}
                  style={{ ...cardInputSt, borderColor: errors.validade ? '#ef4444' : '#e5e7eb' }}
                />
                {errors.validade && <p style={errorSt}>{errors.validade}</p>}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="CVV"
                  value={cardData.cvv}
                  onChange={e => setCardData(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0,4) }))}
                  maxLength={4}
                  style={{ ...cardInputSt, borderColor: errors.cvv ? '#ef4444' : '#e5e7eb' }}
                />
                {errors.cvv && <p style={errorSt}>{errors.cvv}</p>}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 12,
            color: '#9ca3af', fontSize: 11,
          }}>
            <Shield size={12} /> Seus dados são criptografados e protegidos
          </div>
        </div>
      )}

      {/* Info PIX */}
      {formaPagamento === 'PIX' && (
        <div style={{
          background: '#E8F5EE', borderRadius: 12, padding: '12px 16px',
          border: '1px solid #a7f3d0', marginBottom: 20, display: 'flex', gap: 10,
          animation: 'slideStep 0.25s ease-out',
        }}>
          <Zap size={16} color="#50A773" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#065f46' }}>
              5% de desconto no PIX!
            </p>
            <p style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
              De {formatCurrency(total)} por apenas <strong>{formatCurrency(totalFinal)}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Info Dinheiro */}
      {formaPagamento === 'Dinheiro' && (
        <div style={{
          background: '#fffbeb', borderRadius: 12, padding: '12px 16px',
          border: '1px solid #fde68a', marginBottom: 20, fontSize: 13, color: '#92400e',
          animation: 'slideStep 0.25s ease-out',
        }}>
          💵 Tenha o troco para <strong>{formatCurrency(total)}</strong>. Nosso entregador poderá não ter troco.
        </div>
      )}

      <button onClick={handleNext} disabled={!formaPagamento} style={{
        ...primaryBtnSt,
        opacity: formaPagamento ? 1 : 0.5,
        cursor: formaPagamento ? 'pointer' : 'not-allowed',
      }}>
        {formaPagamento === 'PIX' ? `Gerar PIX — ${formatCurrency(totalFinal)}`
          : formaPagamento === 'Cartão' ? `Pagar ${formatCurrency(total)}`
          : `Confirmar Pedido`}
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ─── Step: Processando ──────────────────────────────────── */
function StepProcessando({ formaPagamento, total, pixCode, pixKey, onSuccess, onError }) {
  const [pixCopied, setPixCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 min
  const [pixPago, setPixPago] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (formaPagamento === 'PIX') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }

    if (formaPagamento === 'Cartão') {
      // Simula processamento do cartão via Mercado Pago
      const t = setTimeout(() => {
        // Em produção: chamar API Mercado Pago aqui
        const success = Math.random() > 0.1; // 90% aprovação simulada
        if (success) onSuccess();
        else onError('Cartão recusado. Verifique os dados e tente novamente.');
      }, 2800);
      return () => clearTimeout(t);
    }

    if (formaPagamento === 'Dinheiro') {
      const t = setTimeout(() => onSuccess(), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode).catch(() => {
      // fallback
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

  const handlePixPago = () => {
    setPixPago(true);
    setTimeout(() => onSuccess(), 1500);
  };

  // PIX
  if (formaPagamento === 'PIX') {
    return (
      <div style={{ animation: 'slideStep 0.3s ease-out', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#E8F5EE', border: '1px solid #a7f3d0',
          borderRadius: 99, padding: '6px 16px', marginBottom: 20,
          fontSize: 12, fontWeight: 700, color: '#065f46',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: '#10b981',
            animation: 'pixPulse 2s infinite',
          }} />
          Aguardando pagamento PIX
        </div>

        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 20,
          color: '#1f2937', marginBottom: 6,
        }}>
          Escaneie o QR Code
        </h3>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 20 }}>
          ou copie o código abaixo
        </p>

        {/* Timer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 13, color: timeLeft < 60 ? '#ef4444' : '#6b7280',
          fontWeight: 600, marginBottom: 16,
        }}>
          <Clock size={14} />
          Expira em {formatTime(timeLeft)}
        </div>
        <div style={{
          height: 3, background: '#e5e7eb', borderRadius: 99, marginBottom: 24,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', background: timeLeft < 60 ? '#ef4444' : '#50A773',
            width: `${(timeLeft / 300) * 100}%`, transition: 'width 1s linear, background 0.3s',
          }} />
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            <QRCodeDisplay value={pixCode} size={200} />
            {pixPago && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(16,185,129,0.9)',
                borderRadius: 12, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <CheckCircle size={48} color="#fff" />
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>Pago!</p>
              </div>
            )}
          </div>
        </div>

        {/* Código copia-e-cola */}
        <div style={{
          background: '#f9fafb', borderRadius: 12, padding: '12px 14px',
          border: '1px solid #e5e7eb', marginBottom: 16, textAlign: 'left',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            PIX Copia e Cola
          </p>
          <p style={{
            fontSize: 10, color: '#374151', wordBreak: 'break-all',
            fontFamily: 'monospace', lineHeight: 1.5,
            maxHeight: 60, overflow: 'hidden',
          }}>
            {pixCode.slice(0, 80)}…
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleCopyPix} style={{
            flex: 1, padding: '12px', borderRadius: 12,
            border: '2px solid #e5e7eb', background: pixCopied ? '#E8F5EE' : '#fff',
            color: pixCopied ? '#065f46' : '#374151',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
          }}>
            {pixCopied ? <CheckCircle size={15} /> : <Copy size={15} />}
            {pixCopied ? 'Copiado!' : 'Copiar código'}
          </button>
          <button onClick={handlePixPago} style={{
            flex: 1, padding: '12px', borderRadius: 12, border: 'none',
            background: '#50A773', color: '#fff',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <CheckCircle size={15} /> Já paguei!
          </button>
        </div>

        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, textAlign: 'center' }}>
          Abra seu banco, escaneie o QR Code ou cole o código PIX
        </p>
      </div>
    );
  }

  // Cartão / Dinheiro — processando
  return (
    <div style={{ textAlign: 'center', padding: '20px 0', animation: 'slideStep 0.3s ease-out' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        border: '4px solid #e5e7eb', borderTopColor: '#EA1D2C',
        margin: '0 auto 24px',
        animation: 'spin 0.8s linear infinite',
      }} />
      <h3 style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20,
        color: '#1f2937', marginBottom: 8,
      }}>
        {formaPagamento === 'Cartão' ? 'Processando pagamento…' : 'Confirmando pedido…'}
      </h3>
      <p style={{ fontSize: 13, color: '#9ca3af' }}>
        {formaPagamento === 'Cartão'
          ? 'Estamos validando seu cartão com segurança'
          : 'Seu pedido está sendo registrado'}
      </p>
      {formaPagamento === 'Cartão' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 12, color: '#9ca3af', marginTop: 20,
        }}>
          <Shield size={12} /> Conexão segura — SSL
        </div>
      )}
    </div>
  );
}

/* ─── Step: Confirmado ───────────────────────────────────── */
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
        fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 24,
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

      <button onClick={onClose} style={primaryBtnSt}>
        Acompanhar Pedido <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ─── Barra de Progresso ─────────────────────────────────── */
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

  const subtotal = calcularTotal();
  const taxa = tipoEntrega === 'Entrega' ? 4.99 : 0;
  const desconto = formaPagamento === 'PIX' ? (subtotal + taxa) * 0.05 : 0;
  const totalComTaxa = subtotal + taxa;

  const pixCode = step === 'processando' && formaPagamento === 'PIX'
    ? generatePixCode(totalFinal, usuarioLogado?.nome, pedidoId)
    : '';

  const handleResumoNext = (tot) => {
    setTotal(tot);
    setStep('entrega');
  };

  const handleEntregaNext = () => setStep('pagamento');

  const handlePagamentoNext = (cd) => {
    setCardData(cd);
    const desc = formaPagamento === 'PIX' ? totalComTaxa * 0.05 : 0;
    const tf = totalComTaxa - desc;
    setTotalFinal(tf);
    setStep('processando');
  };

  const handleSuccess = () => {
    // Criar pedido no sistema
    const fakeId = Date.now();
    setPedidoId(fakeId);
    onPedidoConfirmado?.({
      tipoEntrega,
      formaPagamento,
      total: totalFinal,
      pedidoId: fakeId,
    });
    setStep('confirmado');
  };

  const handleError = (msg) => {
    setErrorMsg(msg);
    setStep('pagamento');
  };

  return (
    <>
      <style>{CHECKOUT_STYLES}</style>

      {/* Overlay */}
      <div
        onClick={step === 'processando' ? undefined : onClose}
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
          {/* Close */}
          {step !== 'processando' && (
            <button onClick={onClose} style={{
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
              fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 20,
              color: '#1f2937',
            }}>
              🛒 Finalizar Pedido
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
              <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>
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
            />
          )}

          {step === 'processando' && (
            <StepProcessando
              formaPagamento={formaPagamento}
              total={totalFinal}
              pixCode={pixCode}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          )}

          {step === 'confirmado' && (
            <StepConfirmado
              pedidoId={pedidoId}
              formaPagamento={formaPagamento}
              tipoEntrega={tipoEntrega}
              total={totalFinal}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Estilos reutilizáveis ──────────────────────────────── */
const primaryBtnSt = {
  width: '100%', padding: '15px', borderRadius: 14, border: 'none',
  background: 'linear-gradient(135deg, #EA1D2C, #C8101E)',
  color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 800,
  fontSize: 15, cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(234,29,44,0.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  transition: 'transform 0.15s, box-shadow 0.15s',
};

const backBtnSt = {
  display: 'flex', alignItems: 'center', gap: 6,
  background: '#f3f4f6', border: 'none', borderRadius: 10,
  padding: '7px 14px', cursor: 'pointer',
  color: '#6b7280', fontSize: 13, fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
};

const cardInputSt = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '1.5px solid #e5e7eb', background: '#fff',
  fontSize: 14, fontFamily: 'DM Sans, sans-serif', color: '#1f2937',
  outline: 'none', boxSizing: 'border-box',
};

const errorSt = {
  fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 4,
};