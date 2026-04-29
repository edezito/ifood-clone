// ============================================================
// VIEW: ClienteApp (ATUALIZADO) — FoodExpress
// Integra CheckoutModal com seleção de entrega e pagamento
// ============================================================
import React, { useState } from 'react';
import {
  Search, ShoppingCart, Plus, X, ChevronDown,
  Clock, MapPin, LogOut, ArrowRight, Utensils, Truck, Award,
  HelpCircle, ChevronUp, Minus,
} from 'lucide-react';
import { useClienteController } from '../controllers/useClienteController';
import AcompanhamentoPedido from './Acompanhamentopedido';
import HistoricoPedidos from './Historicopedidos';
import LoginCliente from './Logincliente';
import CheckoutModal from './checkout';

/* ─── Google Fonts ─────────────────────────────────────────── */
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
`;

const tokens = `
:root {
  --primary:    #EA1D2C;
  --primary-dark:#C8101E;
  --primary-light:#FFF0F0;
  --dark:       #3E3E3E;
  --dark-bg:    #2B1A1A;
  --white:      #FFFFFF;
  --gray-50:    #F7F7F7;
  --gray-100:   #F0F0F0;
  --gray-200:   #E0E0E0;
  --gray-300:   #CCCCCC;
  --gray-400:   #A0A0A0;
  --gray-500:   #717171;
  --gray-600:   #505050;
  --gray-700:   #3E3E3E;
  --gray-800:   #2B2B2B;
  --gray-900:   #1A1A1A;
  --green:      #50A773;
  --green-light:#E8F5EE;
  --yellow:     #FFB800;
  --radius-sm:  8px;
  --radius-md:  12px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full:9999px;
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:  0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.1);
}
* { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior: smooth; }
body { font-family:'DM Sans', 'Inter', sans-serif; background:var(--white); color:var(--gray-900); }
`;

const animations = `
@keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
@keyframes slideUp { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }
@keyframes slideInRight { from{transform:translateX(100%);} to{transform:translateX(0);} }
`;

const CATEGORIAS = [
  { key: 'todos',      label: 'Ver Tudo',   emoji: '🏠' },
  { key: 'pizza',      label: 'Pizzas',     emoji: '🍕' },
  { key: 'lanches',    label: 'Lanches',    emoji: '🍔' },
  { key: 'japonesa',   label: 'Japonesa',   emoji: '🍱' },
  { key: 'brasileira', label: 'Brasileira', emoji: '🥘' },
  { key: 'massas',     label: 'Massas',     emoji: '🍝' },
  { key: 'saudavel',   label: 'Saudável',   emoji: '🥗' },
];

const FAQ_DATA = [
  { q: 'Como faço um pedido?', a: 'Navegue pelo cardápio, adicione itens ao carrinho e finalize seu pedido. É fácil e rápido!' },
  { q: 'Quais formas de pagamento?', a: 'Aceitamos PIX (5% desconto!), cartão de crédito/débito e dinheiro na entrega.' },
  { q: 'Qual o tempo de entrega?', a: 'O tempo médio de entrega varia de 25 a 45 minutos. Retirada no local em ~15 minutos.' },
  { q: 'Posso acompanhar meu pedido?', a: 'Sim! Após finalizar o pedido você pode acompanhar em tempo real cada etapa, desde o preparo até a entrega.' },
  { q: 'Como funciona o PIX?', a: 'Escaneie o QR Code ou copie o código copia-e-cola no seu aplicativo bancário. Aprovação imediata com 5% de desconto.' },
];

/* ─── Navbar ─────────────────────────────────────────────── */
function Navbar({ cartCount, onCartClick, onHistorico, onLogout, usuarioLogado }) {
  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--gray-200)',
      height: 72,
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 32px',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>🍔</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: 'var(--gray-900)' }}>
            Food<span style={{ color: 'var(--primary)' }}>Express</span>
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Início', 'Cardápio', 'Sobre Nós', 'FAQ'].map((link, i) => (
            <a key={link} href={`#${link.toLowerCase().replace(' ', '-')}`} style={{
              textDecoration: 'none', fontSize: 15, fontWeight: 500,
              color: i === 0 ? 'var(--primary)' : 'var(--gray-600)',
              borderBottom: i === 0 ? '2px solid var(--primary)' : 'none',
              paddingBottom: 4, transition: 'color 0.2s',
            }}
              onMouseEnter={e => { if (i !== 0) e.target.style.color = 'var(--primary)'; }}
              onMouseLeave={e => { if (i !== 0) e.target.style.color = 'var(--gray-600)'; }}
            >{link}</a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {usuarioLogado && (
            <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 500 }}>
              Olá, {usuarioLogado.nome?.split(' ')[0] ?? 'Cliente'}
            </span>
          )}
          <button onClick={onHistorico} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            color: 'var(--gray-500)', fontSize: 13, fontWeight: 500,
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-500)'}
          >
            <Clock size={16} /> Pedidos
          </button>
          <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--gray-400)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-400)'}
          >
            <LogOut size={16} />
          </button>
          <button onClick={onCartClick} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
            <ShoppingCart size={22} color="var(--gray-700)" />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -4,
                background: 'var(--primary)', color: '#fff',
                fontSize: 10, fontWeight: 800,
                width: 18, height: 18, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── Hero ────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section id="início" style={{
      position: 'relative', marginTop: 72,
      background: 'linear-gradient(135deg, #1a0a0a 0%, #2B1A1A 40%, #3E2020 100%)',
      minHeight: 520, display: 'flex', alignItems: 'center', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(26,10,10,0.95) 0%, rgba(26,10,10,0.7) 50%, rgba(26,10,10,0.4) 100%)',
      }} />
      <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '0 32px', width: '100%' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(234,29,44,0.15)', border: '1px solid rgba(234,29,44,0.3)',
          borderRadius: 'var(--radius-full)', padding: '6px 16px', marginBottom: 24,
          animation: 'slideUp 0.5s ease-out',
        }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#FF6B6B', letterSpacing: '0.02em' }}>
            Entrega em minutos na sua porta
          </span>
        </div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 56,
          color: '#fff', lineHeight: 1.1, maxWidth: 600, marginBottom: 20,
          animation: 'slideUp 0.6s ease-out',
        }}>
          Tudo que você <span style={{ color: 'var(--primary)' }}>quer comer</span>, entregue na sua porta.
        </h1>
        <p style={{
          fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6,
          maxWidth: 520, marginBottom: 36, animation: 'slideUp 0.7s ease-out',
        }}>
          Restaurantes, pizzarias, hamburguerias e muito mais. Peça pelo app e receba com rapidez e qualidade.
        </p>
        <div style={{ display: 'flex', gap: 16, animation: 'slideUp 0.8s ease-out' }}>
          <a href="#cardápio" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--primary)', color: '#fff',
            padding: '14px 28px', borderRadius: 'var(--radius-full)',
            fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 15,
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(234,29,44,0.35)',
          }}>
            Ver Cardápio <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Category Pill ─────────────────────────────────────── */
function CategoryPill({ emoji, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 22px', borderRadius: 'var(--radius-full)',
      border: active ? 'none' : '1.5px solid var(--gray-200)',
      background: active ? 'var(--primary)' : 'var(--white)',
      color: active ? '#fff' : 'var(--gray-600)',
      fontFamily: 'DM Sans, sans-serif', fontWeight: active ? 700 : 500, fontSize: 14,
      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
      boxShadow: active ? '0 4px 12px rgba(234,29,44,0.25)' : 'var(--shadow-sm)',
      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
    }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      {label}
    </button>
  );
}

/* ─── Product Card ──────────────────────────────────────── */
function ProductCard({ produto, restaurante, onAdd }) {
  const categoryEmoji = {
    pizza: '🍕', lanches: '🍔', japonesa: '🍱',
    brasileira: '🥘', massas: '🍝', saudavel: '🥗',
  };
  const emoji = categoryEmoji[restaurante?.categoria] || '🍽️';

  return (
    <div style={{
      background: 'var(--white)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', border: '1px solid var(--gray-200)',
      transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-xl)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--gray-50), var(--gray-100))',
        fontSize: 56,
      }}>{emoji}</div>
      <div style={{ padding: '20px' }}>
        {restaurante?.nome && (
          <span style={{
            display: 'inline-block', fontSize: 11, fontWeight: 600,
            color: 'var(--primary)', background: 'var(--primary-light)',
            padding: '3px 10px', borderRadius: 'var(--radius-full)', marginBottom: 10,
          }}>{restaurante.nome}</span>
        )}
        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800,
          fontSize: 17, color: 'var(--gray-900)', lineHeight: 1.3, marginBottom: 8,
        }}>{produto.nome}</h3>
        <p style={{ fontSize: 13, color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: 16 }}>
          Preparado com ingredientes selecionados
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>PREÇO</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: 'var(--gray-900)' }}>
              R$ {Number(produto.preco).toFixed(2)}
            </p>
          </div>
          <button onClick={() => onAdd(produto, restaurante?.id)} style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--primary)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(234,29,44,0.35)',
            transition: 'transform 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sobre Nós ───────────────────────────────────────────── */
function SobreNos() {
  const features = [
    { icon: Utensils, title: 'Variedade de Restaurantes', desc: 'Milhares de opções de restaurantes, de fast food a comida gourmet, tudo na palma da mão.' },
    { icon: Truck, title: 'Entrega ou Retirada', desc: 'Receba em casa ou retire no restaurante. Você escolhe como quer!' },
    { icon: Award, title: 'PIX com 5% OFF', desc: 'Pague com PIX e ganhe 5% de desconto em todos os pedidos. Aprovação imediata.' },
  ];
  return (
    <section id="sobre-nós" style={{ padding: '80px 32px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 36, color: 'var(--gray-900)' }}>
          Por que escolher o <span style={{ color: 'var(--primary)' }}>FoodExpress</span>?
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} style={{
            background: 'var(--gray-50)', borderRadius: 'var(--radius-xl)',
            padding: '36px 28px', textAlign: 'center', border: '1px solid var(--gray-100)',
            transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <Icon size={24} color="var(--primary)" />
            </div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--gray-900)', marginBottom: 10 }}>{title}</h3>
            <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── FAQ ───────────────────────────────────────────────── */
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--gray-200)' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--gray-800)' }}>{question}</span>
        {open ? <ChevronUp size={18} color="var(--primary)" /> : <ChevronDown size={18} color="var(--gray-400)" />}
      </button>
      {open && (
        <div style={{ paddingBottom: 20, animation: 'fadeIn 0.2s ease-out' }}>
          <p style={{ fontSize: 14, color: 'var(--gray-500)', lineHeight: 1.7 }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

function FAQSection() {
  return (
    <section id="faq" style={{ padding: '80px 32px', background: 'var(--gray-50)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <HelpCircle size={22} color="var(--primary)" />
          </div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 32, color: 'var(--gray-900)' }}>
            Perguntas <span style={{ color: 'var(--primary)' }}>Frequentes</span>
          </h2>
        </div>
        <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '8px 32px', border: '1px solid var(--gray-200)' }}>
          {FAQ_DATA.map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
        </div>
      </div>
    </section>
  );
}

/* ─── Cart Slide-over ──────────────────────────────────────── */
function CartSlideOver({ carrinho, calcularTotal, onClose, onCheckout, onAdd, onRemove }) {
  const total = calcularTotal();
  const count = carrinho.reduce((a, i) => a + i.quantidade, 0);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 60, animation: 'fadeIn 0.2s ease-out',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: 420, maxWidth: '100vw', background: 'var(--white)',
        borderLeft: '1px solid var(--gray-200)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--gray-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingCart size={20} color="var(--gray-900)" />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--gray-900)' }}>
              Seu Carrinho
            </span>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'var(--gray-100)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} color="var(--gray-600)" />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {carrinho.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: 'var(--gray-400)',
            }}>
              <ShoppingCart size={48} strokeWidth={1} style={{ marginBottom: 16, opacity: 0.4 }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>Seu carrinho está vazio</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Adicione itens do cardápio</p>
            </div>
          ) : (
            carrinho.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center',
                padding: '14px 0', borderBottom: '1px solid var(--gray-100)', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--gray-900)' }}>{item.nome}</p>
                  <p style={{ fontSize: 13, color: 'var(--gray-400)', marginTop: 2 }}>
                    R$ {item.preco.toFixed(2)} / un.
                  </p>
                </div>
                {/* Controles de quantidade */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => onRemove(item.id)} style={{
                    width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e5e7eb',
                    background: '#fff', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Minus size={13} color="#374151" />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', minWidth: 20, textAlign: 'center' }}>
                    {item.quantidade}
                  </span>
                  <button onClick={() => onAdd(item, item.restauranteId)} style={{
                    width: 28, height: 28, borderRadius: 8, border: 'none',
                    background: 'var(--primary)', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Plus size={13} color="#fff" />
                  </button>
                </div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--gray-900)', minWidth: 60, textAlign: 'right' }}>
                  R$ {(item.preco * item.quantidade).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {carrinho.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--gray-200)' }}>
            {/* PIX badge */}
            <div style={{
              background: '#E8F5EE', borderRadius: 10, padding: '8px 14px',
              marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid #a7f3d0',
            }}>
              <span style={{ fontSize: 14 }}>💚</span>
              <p style={{ fontSize: 12, color: '#065f46', fontWeight: 600 }}>
                Pague com PIX e ganhe <strong>5% OFF</strong>
              </p>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
            }}>
              <span style={{ fontSize: 15, color: 'var(--gray-600)', fontWeight: 500 }}>
                Subtotal ({count} {count === 1 ? 'item' : 'itens'})
              </span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: 'var(--gray-900)' }}>
                R$ {total.toFixed(2)}
              </span>
            </div>
            <button onClick={onCheckout} style={{
              width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary), #C8101E)',
              color: '#fff', border: 'none',
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(234,29,44,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              Finalizar Pedido <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: 'var(--gray-900)', padding: '48px 32px 32px' }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🍔</div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff' }}>
            Food<span style={{ color: 'var(--primary)' }}>Express</span>
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>© 2024 FoodExpress — Projeto Acadêmico</p>
      </div>
    </footer>
  );
}

/* ─── COMPONENTE PRINCIPAL (ÚNICO - SEM DUPLICAÇÃO) ──────── */
function ClienteApp({ onLogout }) {
  const ctrl = useClienteController();

  // Verificações de estado
  if (ctrl.pedidoAtivoId) {
    return <AcompanhamentoPedido pedidoId={ctrl.pedidoAtivoId} onVoltarAoMenu={() => ctrl.setPedidoAtivoId(null)} />;
  }
  if (ctrl.verHistorico) {
    return (
      <HistoricoPedidos
        telefone={ctrl.usuarioLogado?.telefone ?? ctrl.usuarioLogado?.phone}
        onVoltar={() => ctrl.setVerHistorico(false)}
        onVerDetalhes={id => { ctrl.setPedidoAtivoId(id); ctrl.setVerHistorico(false); }}
      />
    );
  }
  if (ctrl.precisaLogar) {
    return <LoginCliente onLoginSucesso={ctrl.loginSucesso} />;
  }

  // Produtos filtrados
  const todosProdutos = ctrl.produtos
    .filter(p => p.disponivel !== false)
    .map(p => ({
      ...p,
      restaurante: ctrl.restaurantes.find(r => r.id === p.restaurante_id),
    }))
    .filter(p => {
      if (ctrl.categoriaAtiva !== 'todos' && p.restaurante?.categoria !== ctrl.categoriaAtiva) return false;
      if (ctrl.busca && !p.nome.toLowerCase().includes(ctrl.busca.toLowerCase())) return false;
      return true;
    });

  const cartCount = ctrl.carrinho.reduce((a, i) => a + i.quantidade, 0);

  // Handler para confirmação de pedido
  const handlePedidoConfirmado = async (dadosCheckout) => {
    return await ctrl.finalizarPedido(dadosCheckout);
  };

  return (
    <>
      <style>{FONTS + tokens + animations}</style>
      <div style={{ minHeight: '100vh', background: 'var(--white)' }}>
        <Navbar
          cartCount={cartCount}
          onCartClick={() => ctrl.setCarrinhoAberto(true)}
          onHistorico={() => ctrl.setVerHistorico(true)}
          onLogout={onLogout}
          usuarioLogado={ctrl.usuarioLogado}
        />
        <HeroSection />

        {/* Cardápio */}
        <section id="cardápio" style={{ padding: '80px 32px', maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 36, color: 'var(--gray-900)' }}>
              Nosso <span style={{ color: 'var(--primary)' }}>Cardápio</span>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--gray-500)', marginTop: 8 }}>
              Explore os melhores restaurantes e peça o que quiser.
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            margin: '32px 0 40px', flexWrap: 'wrap', gap: 16,
          }}>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {CATEGORIAS.map(cat => (
                <CategoryPill key={cat.key} emoji={cat.emoji} label={cat.label}
                  active={ctrl.categoriaAtiva === cat.key}
                  onClick={() => ctrl.setCategoriaAtiva(cat.key)} />
              ))}
            </div>
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search size={16} color="var(--gray-400)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text" value={ctrl.busca} placeholder="Buscar produtos..."
                onChange={e => ctrl.setBusca(e.target.value)}
                style={{
                  width: '100%', padding: '11px 16px 11px 40px', borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--gray-200)', background: 'var(--white)',
                  fontSize: 14, fontFamily: 'DM Sans, sans-serif', color: 'var(--gray-900)', outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(234,29,44,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--gray-200)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          {todosProdutos.length === 0 ? (
            <div style={{
              background: 'var(--gray-50)', borderRadius: 'var(--radius-xl)',
              padding: '60px 24px', textAlign: 'center', border: '1.5px dashed var(--gray-300)',
            }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🍽️</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: 'var(--gray-900)' }}>
                Nenhum produto encontrado
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {todosProdutos.map(prod => (
                <ProductCard key={prod.id} produto={prod} restaurante={prod.restaurante}
                  onAdd={ctrl.adicionarAoCarrinho} />
              ))}
            </div>
          )}
        </section>

        <SobreNos />
        <FAQSection />
        <Footer />

        {/* Cart Slide-over */}
        {ctrl.carrinhoAberto && (
          <CartSlideOver
            carrinho={ctrl.carrinho}
            calcularTotal={ctrl.calcularTotal}
            onClose={() => ctrl.setCarrinhoAberto(false)}
            onCheckout={ctrl.iniciarCheckout}
            onAdd={ctrl.adicionarAoCarrinho}
            onRemove={ctrl.removerDoCarrinho}
          />
        )}

        {/* Checkout Modal */}
        {ctrl.checkoutAberto && (
          <CheckoutModal
            carrinho={ctrl.carrinho}
            calcularTotal={ctrl.calcularTotal}
            usuarioLogado={ctrl.usuarioLogado}
            onClose={() => ctrl.setCheckoutAberto(false)}
            onPedidoConfirmado={handlePedidoConfirmado}
          />
        )}
      </div>
    </>
  );
}

export default ClienteApp;