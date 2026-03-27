// ============================================================
// VIEW: AdminDashboard â€” FoodExpress (iFood Clone)
// Design: Dark sidebar + clean card-based layout
// Paleta: Vermelho iFood #EA1D2C / Branco
// ============================================================
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Store, ShoppingBag, Package, MapPin, Edit2, Trash2,
  CheckCircle, Clock, X, PlusCircle, AlertCircle, LogOut,
  ChevronRight, Flame, TrendingUp, Users, Zap,
} from 'lucide-react';
import { useAdminController } from '../controllers/useAdminController';

// Leaflet fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/* â”€â”€â”€ Estilos globais â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
:root {
  --primary:     #EA1D2C;
  --primary-dark:#C8101E;
  --dark-bg:   #2B1A1A;
  --primary-light:#FFF0F0;
  --green:    #50A773;
  --blue:     #3B82F6;
  --yellow:   #F59E0B;
}
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'DM Sans', sans-serif; background:#fafafa; color:#1f2937; }

.admin-input {
  width:100%; padding:12px 14px;
  border:1.5px solid #e5e7eb; border-radius:12px;
  background:#fff; font-family:'DM Sans',sans-serif; font-size:14px;
  color:#1f2937; outline:none;
  transition:border-color 0.2s, box-shadow 0.2s;
}
.admin-input:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(255,107,0,0.10); }
.admin-input::placeholder { color:#9ca3af; }

@keyframes slideIn {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes popIn {
  0%   { transform:scale(0.85); opacity:0; }
  70%  { transform:scale(1.03); }
  100% { transform:scale(1); opacity:1; }
}
.slide-in { animation:slideIn 0.3s ease-out; }
`;

/* â”€â”€â”€ Mapa â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const MapaLocalizacao = ({ latitude, longitude, endereco, nome }) => {
  if (!latitude || !longitude) {
    return (
      <div style={{
        background: '#f9fafb', borderRadius: 12, padding: 16,
        textAlign: 'center', color: '#9ca3af', fontSize: 13,
        border: '1.5px dashed #d1d5db',
      }}>
        <MapPin size={18} style={{ marginBottom: 6, opacity: 0.5, display: 'block', margin: '0 auto 6px' }} />
        LocalizaÃ§Ã£o nÃ£o disponÃ­vel
        <p style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Atualize o endereÃ§o para exibir o mapa</p>
      </div>
    );
  }
  const position = [parseFloat(latitude), parseFloat(longitude)];
  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer center={position} zoom={15} style={{ height: 180, width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup><div style={{ fontSize: 12 }}><strong>{nome}</strong><br />{endereco}</div></Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

/* â”€â”€â”€ Status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STATUS_CONFIG = {
  Aguardando:      { bg: '#FFF7E0', color: '#B45309', dot: '#F59E0B', label: 'Aguardando' },
  'Em PreparaÃ§Ã£o': { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6', label: 'Preparando' },
  'Em TrÃ¢nsito':   { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6', label: 'A caminho' },
  Entregue:        { bg: '#ECFDF5', color: '#065F46', dot: '#10B981', label: 'Entregue' },
  Cancelado:       { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'Cancelado' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: cfg.bg, color: cfg.color,
      padding: '4px 12px', borderRadius: 99,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label.toUpperCase()}
    </span>
  );
}

/* â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StatCard({ icon: Icon, value, label, color, bg }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      padding: '18px 20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: '#1f2937', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
      </div>
    </div>
  );
}

/* â”€â”€â”€ BotÃ£o de aÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ActionButton({ children, onClick, variant = 'primary', size = 'md', style: extraStyle = {} }) {
  const variants = {
    primary: { background: 'var(--primary)', color: '#fff', boxShadow: '0 4px 12px rgba(255,107,0,0.3)' },
    secondary: { background: '#f3f4f6', color: '#374151', boxShadow: 'none' },
    ghost: { background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)', boxShadow: 'none' },
    danger: { background: '#FEF2F2', color: '#DC2626', boxShadow: 'none' },
    success: { background: 'var(--green)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' },
    amber: { background: 'var(--yellow)', color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.3)' },
  };
  const sizes = {
    sm: { padding: '7px 14px', fontSize: 12, borderRadius: 10 },
    md: { padding: '10px 18px', fontSize: 13, borderRadius: 12 },
    lg: { padding: '14px 24px', fontSize: 15, borderRadius: 14 },
  };
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none', cursor: 'pointer',
        fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        transition: 'transform 0.15s, box-shadow 0.15s',
        ...variants[variant],
        ...sizes[size],
        ...extraStyle,
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {children}
    </button>
  );
}

/* â”€â”€â”€ Card de pedido â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PedidoCard({ ped, loja, onAtualizar }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      animation: 'slideIn 0.3s ease-out',
    }}>
      <div style={{
        height: 3,
        background: ped.status === 'Aguardando' ? '#F59E0B'
          : ped.status === 'Em PreparaÃ§Ã£o' ? '#3B82F6'
          : ped.status === 'Em TrÃ¢nsito' ? '#8B5CF6' : '#10B981',
      }} />
      <div style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <StatusBadge status={ped.status} />
              <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', fontWeight: 600 }}>
                #{ped.id.toString().slice(0, 8)}
              </span>
            </div>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: '#1f2937' }}>
              {ped.cliente_nome}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, color: '#9ca3af', fontSize: 12 }}>
              <MapPin size={11} />
              <span>{loja?.nome ?? 'Loja excluÃ­da'}</span>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
              ðŸ“ {ped.endereco}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
              {ped.tipo_entrega}
            </p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 24, color: 'var(--green)' }}>
              R$ {ped.total?.toFixed(2)}
            </p>
            <div style={{
              background: 'var(--primary-light)', borderRadius: 8,
              padding: '3px 10px', marginTop: 4, display: 'inline-block',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em' }}>
                PIN: {ped.pin_entrega}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {ped.status === 'Aguardando' && (
            <ActionButton variant="primary" onClick={() => onAtualizar(ped.id, 'Em PreparaÃ§Ã£o')}>
              <CheckCircle size={14} /> Aceitar Pedido
            </ActionButton>
          )}
          {ped.status === 'Em PreparaÃ§Ã£o' && (
            <ActionButton variant="amber" onClick={() => onAtualizar(ped.id, 'Em TrÃ¢nsito')}>
              <Zap size={14} /> Despachar
            </ActionButton>
          )}
          {ped.status === 'Em TrÃ¢nsito' && (
            <ActionButton variant="success" onClick={() => onAtualizar(ped.id, 'Entregue')}>
              <CheckCircle size={14} /> Confirmar Entrega
            </ActionButton>
          )}
          <ActionButton variant="danger" onClick={() => { if (window.confirm('Cancelar este pedido?')) onAtualizar(ped.id, 'Cancelado'); }}>
            <X size={14} /> Cancelar
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ FormulÃ¡rio genÃ©rico â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FormField({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* â”€â”€â”€ COMPONENTE PRINCIPAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AdminDashboard({ onLogout }) {
  const ctrl = useAdminController();

  const pedidosAtivos = ctrl.pedidos.filter(p => p.status !== 'Entregue' && p.status !== 'Cancelado');
  const pedidosHoje = ctrl.pedidos.filter(p => p.status === 'Entregue').length;
  const receitaTotal = ctrl.pedidos
    .filter(p => p.status === 'Entregue')
    .reduce((a, p) => a + (p.total ?? 0), 0);

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>

        {/* â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <aside style={{
          width: 240, flexShrink: 0,
          background: 'linear-gradient(180deg, #0f0f1a 0%, var(--primary-dark) 100%)',
          display: 'flex', flexDirection: 'column',
          padding: '28px 0',
          position: 'sticky', top: 0, height: '100vh',
        }}>
          {/* Logo */}
          <div style={{ padding: '0 24px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18 }}>🍔</span>
              </div>
              <div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff', lineHeight: 1 }}>
                  Food<span style={{ color: 'var(--primary)' }}>Express</span>
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.06em', marginTop: 2 }}>
                  PORTAL PARCEIRO
                </p>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'pedidos',   label: 'Pedidos Ativos', icon: Package,  badge: pedidosAtivos.length },
              { id: 'catalogo',  label: 'Meu CatÃ¡logo',   icon: ShoppingBag },
              { id: 'gerenciar', label: 'Gerenciar Lojas', icon: Store },
            ].map(({ id, label, icon: Icon, badge }) => {
              const active = ctrl.abaAtiva === id;
              return (
                <button
                  key={id}
                  onClick={() => { ctrl.setAbaAtiva(id); ctrl.setShowFormulario(false); ctrl.cancelarEdicaoRest(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(255,107,0,0.15)' : 'transparent',
                    color: active ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'DM Sans, sans-serif', fontWeight: active ? 700 : 500, fontSize: 14,
                    transition: 'all 0.2s',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon size={17} />
                    {label}
                  </div>
                  {badge > 0 && (
                    <span style={{
                      background: 'var(--primary)', color: '#fff',
                      fontSize: 10, fontWeight: 800,
                      padding: '2px 7px', borderRadius: 99,
                    }}>{badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div style={{ padding: '0 12px' }}>
            <button
              onClick={onLogout}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: 'rgba(255,255,255,0.35)',
                width: '100%', fontFamily: 'DM Sans, sans-serif', fontWeight: 500, fontSize: 14,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </div>
        </aside>

        {/* â”€â”€ CONTEÃšDO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

          {/* Header */}
          <header style={{
            background: '#fff', borderBottom: '1px solid #e5e7eb',
            padding: '18px 28px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 22, color: '#1f2937' }}>
                {ctrl.abaAtiva === 'pedidos' ? 'ðŸš€ Pedidos Ativos'
                  : ctrl.abaAtiva === 'catalogo' ? 'ðŸ›’ Meu CatÃ¡logo'
                  : 'ðŸª Gerenciar Lojas'}
              </p>
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 2 }}>
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--primary-light)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 18, color: 'var(--primary)' }}>{pedidosAtivos.length}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.04em' }}>ATIVOS</p>
              </div>
              <div style={{ background: '#ECFDF5', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 18, color: 'var(--green)' }}>{pedidosHoje}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.04em' }}>ENTREGUES</p>
              </div>
              <div style={{ background: '#FFF7E0', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 18, color: '#B45309' }}>R${receitaTotal.toFixed(0)}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.04em' }}>RECEITA</p>
              </div>
            </div>
          </header>

          {/* Toast */}
          {ctrl.mensagem && (
            <div style={{
              position: 'fixed', top: 20, right: 20, zIndex: 999,
              background: ctrl.tipoMensagem === 'success' ? '#ECFDF5' : ctrl.tipoMensagem === 'error' ? '#FEF2F2' : '#EFF6FF',
              color: ctrl.tipoMensagem === 'success' ? '#065F46' : ctrl.tipoMensagem === 'error' ? '#991B1B' : '#1D4ED8',
              border: `1px solid ${ctrl.tipoMensagem === 'success' ? '#A7F3D0' : ctrl.tipoMensagem === 'error' ? '#FECACA' : '#BFDBFE'}`,
              borderRadius: 14, padding: '12px 18px',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              fontWeight: 600, fontSize: 13,
              animation: 'popIn 0.3s ease-out',
              maxWidth: 320,
            }}>
              {ctrl.tipoMensagem === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {ctrl.mensagem}
            </div>
          )}

          {/* â”€â”€ ConteÃºdo da aba â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>

            {/* ABA PEDIDOS */}
            {ctrl.abaAtiva === 'pedidos' && (
              <div style={{ maxWidth: 800 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
                  <StatCard icon={Flame} value={pedidosAtivos.length} label="Pedidos Ativos" color="var(--primary)" bg="var(--primary-light)" />
                  <StatCard icon={TrendingUp} value={`R$ ${receitaTotal.toFixed(0)}`} label="Receita Total" color="var(--green)" bg="#D1FAE5" />
                  <StatCard icon={Users} value={ctrl.pedidos.length} label="Total de Pedidos" color="#3B82F6" bg="#EFF6FF" />
                </div>
                {pedidosAtivos.length === 0 ? (
                  <div style={{
                    background: '#fff', borderRadius: 16, padding: '48px 24px',
                    textAlign: 'center', border: '1.5px dashed #d1d5db',
                  }}>
                    <p style={{ fontSize: 48, marginBottom: 12 }}>ðŸŽ‰</p>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#1f2937' }}>
                      Sem pedidos no momento
                    </p>
                    <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
                      Quando chegar um pedido, aparece aqui!
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {pedidosAtivos.map(ped => (
                      <PedidoCard
                        key={ped.id}
                        ped={ped}
                        loja={ctrl.restaurantes.find(r => r.id === ped.restaurante_id)}
                        onAtualizar={ctrl.atualizarStatusPedido}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA CATÃLOGO */}
            {ctrl.abaAtiva === 'catalogo' && (
              <div style={{ maxWidth: 800 }}>
                {(ctrl.editandoProdId || ctrl.showFormulario) && (
                  <div style={{
                    background: '#fff', borderRadius: 16, padding: 24,
                    border: '2px solid rgba(255,107,0,0.2)',
                    boxShadow: '0 8px 24px rgba(255,107,0,0.08)',
                    marginBottom: 24, animation: 'slideIn 0.3s ease-out',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: '#1f2937' }}>
                        {ctrl.editandoProdId ? 'âœï¸ Editar Produto' : 'âž• Novo Produto'}
                      </p>
                      <button
                        onClick={() => { ctrl.cancelarEdicaoProd(); ctrl.setShowFormulario(false); }}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: '#f3f4f6', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <X size={15} color="#6b7280" />
                      </button>
                    </div>
                    <form onSubmit={ctrl.salvarProduto} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <FormField label="Restaurante">
                        <select value={ctrl.restauranteSelecionado} onChange={e => ctrl.setRestauranteSelecionado(e.target.value)} required className="admin-input">
                          <option value="">Selecione a lojaâ€¦</option>
                          {ctrl.restaurantes.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Nome do produto">
                        <input className="admin-input" type="text" value={ctrl.nomeProd} onChange={e => ctrl.setNomeProd(e.target.value)} placeholder="Ex: X-Burguer Especial" required />
                      </FormField>
                      <FormField label="PreÃ§o (R$)">
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>R$</span>
                          <input className="admin-input" type="number" step="0.01" value={ctrl.preco} onChange={e => ctrl.setPreco(e.target.value)} placeholder="0,00" required style={{ paddingLeft: 40 }} />
                        </div>
                      </FormField>
                      <ActionButton variant={ctrl.editandoProdId ? 'amber' : 'primary'} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
                        {ctrl.editandoProdId ? 'Atualizar Produto' : 'Adicionar ao CardÃ¡pio'}
                      </ActionButton>
                    </form>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {ctrl.restaurantes.map(rest => {
                    const prods = ctrl.produtos.filter(p => p.restaurante_id === rest.id);
                    return (
                      <div key={rest.id} style={{
                        background: '#fff', borderRadius: 16,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                      }}>
                        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: 10 }}>
                          <div>
                            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: '#1f2937' }}>{rest.nome}</p>
                            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{prods.length} produto(s)</p>
                          </div>
                          <ActionButton variant="primary" size="sm" onClick={() => { ctrl.setShowFormulario(true); ctrl.setRestauranteSelecionado(rest.id); ctrl.cancelarEdicaoProd(); }}>
                            <PlusCircle size={13} /> Adicionar
                          </ActionButton>
                        </div>
                        {prods.length === 0 ? (
                          <p style={{ padding: 20, color: '#9ca3af', fontSize: 13, textAlign: 'center', fontStyle: 'italic' }}>
                            Nenhum produto cadastrado.
                          </p>
                        ) : (
                          <div>
                            {prods.map((prod, i) => (
                              <div key={prod.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 20px',
                                borderBottom: i < prods.length - 1 ? '1px solid #f3f4f6' : 'none',
                                gap: 12,
                              }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{prod.nome}</p>
                                  <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: 'var(--green)', marginTop: 2 }}>
                                    R$ {Number(prod.preco).toFixed(2)}
                                  </p>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <ActionButton variant="secondary" size="sm" onClick={() => ctrl.prepararEdicaoProduto(prod)}>
                                    <Edit2 size={12} /> Editar
                                  </ActionButton>
                                  <ActionButton variant="danger" size="sm" onClick={() => ctrl.excluirProduto(prod.id, prod.nome)}>
                                    <Trash2 size={12} />
                                  </ActionButton>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ABA GERENCIAR LOJAS */}
            {ctrl.abaAtiva === 'gerenciar' && (
              <div style={{ maxWidth: 800 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                  <ActionButton variant="primary" size="md" onClick={() => { ctrl.cancelarEdicaoRest(); ctrl.setShowFormulario(true); }}>
                    <PlusCircle size={15} /> Nova Loja
                  </ActionButton>
                </div>

                {(ctrl.editandoRestId || ctrl.showFormulario) && (
                  <div style={{
                    background: '#fff', borderRadius: 16, padding: 24,
                    border: '2px solid rgba(255,107,0,0.2)',
                    boxShadow: '0 8px 24px rgba(255,107,0,0.08)',
                    marginBottom: 24, animation: 'slideIn 0.3s ease-out',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, color: '#1f2937' }}>
                        {ctrl.editandoRestId ? 'âœï¸ Editar Loja' : 'ðŸª Nova Loja'}
                      </p>
                      <button
                        onClick={() => { ctrl.cancelarEdicaoRest(); ctrl.setShowFormulario(false); }}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: 'none',
                          background: '#f3f4f6', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <X size={15} color="#6b7280" />
                      </button>
                    </div>
                    <form onSubmit={ctrl.salvarRestaurante} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <FormField label="Nome da Loja">
                          <input className="admin-input" type="text" value={ctrl.nomeRest} onChange={e => ctrl.setNomeRest(e.target.value)} placeholder="Ex: Burguer House" required />
                        </FormField>
                        <FormField label="CNPJ">
                          <input className="admin-input" type="text" value={ctrl.cnpj} onChange={e => ctrl.setCnpj(e.target.value)} placeholder="00.000.000/0001-00" required />
                        </FormField>
                      </div>
                      <FormField label="EndereÃ§o Completo">
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1, position: 'relative' }}>
                            <MapPin size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input className="admin-input" type="text" value={ctrl.endereco} onChange={e => ctrl.setEndereco(e.target.value)} placeholder="Rua, nÃºmero, bairro, cidade" required style={{ paddingLeft: 34 }} />
                          </div>
                          <button
                            type="button" onClick={ctrl.buscarCoordenadas} disabled={ctrl.buscandoCoordenadas}
                            style={{
                              padding: '12px 16px', borderRadius: 12, border: 'none',
                              background: 'var(--primary-dark)', color: '#fff',
                              fontWeight: 700, fontSize: 13, cursor: 'pointer',
                              whiteSpace: 'nowrap', flexShrink: 0,
                              opacity: ctrl.buscandoCoordenadas ? 0.6 : 1,
                            }}
                          >
                            {ctrl.buscandoCoordenadas ? 'â€¦' : 'ðŸ“ Mapa'}
                          </button>
                        </div>
                      </FormField>
                      {ctrl.latitude && ctrl.longitude && (
                        <div style={{ background: '#ECFDF5', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#065F46', fontWeight: 600 }}>
                          âœ… Coordenadas: {ctrl.latitude}, {ctrl.longitude}
                        </div>
                      )}
                      <MapaLocalizacao latitude={ctrl.latitude} longitude={ctrl.longitude} endereco={ctrl.endereco} nome={ctrl.nomeRest || 'Nova Loja'} />
                      <ActionButton variant={ctrl.editandoRestId ? 'amber' : 'primary'} size="lg" style={{ width: '100%', justifyContent: 'center' }}>
                        {ctrl.editandoRestId ? 'Salvar AlteraÃ§Ãµes' : 'Cadastrar Loja'}
                      </ActionButton>
                    </form>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {ctrl.restaurantes.length === 0 ? (
                    <div style={{
                      background: '#fff', borderRadius: 16, padding: '48px 24px',
                      textAlign: 'center', border: '1.5px dashed #d1d5db',
                    }}>
                      <p style={{ fontSize: 48, marginBottom: 12 }}>ðŸª</p>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18 }}>Nenhuma loja cadastrada</p>
                      <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>Clique em "Nova Loja" para comeÃ§ar</p>
                    </div>
                  ) : (
                    ctrl.restaurantes.map(rest => (
                      <div key={rest.id} style={{
                        background: '#fff', borderRadius: 16,
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                      }}>
                        <div style={{ padding: '18px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#1f2937' }}>{rest.nome}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, color: '#9ca3af', fontSize: 12 }}>
                                <MapPin size={12} /> {rest.endereco}
                              </div>
                              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>CNPJ: {rest.cnpj}</p>
                              <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                                <span style={{ background: '#f3f4f6', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#374151' }}>
                                  ðŸ“¦ {ctrl.produtos.filter(p => p.restaurante_id === rest.id).length} produtos
                                </span>
                                <span style={{ background: '#ECFDF5', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#065F46' }}>
                                  ðŸ›’ {ctrl.pedidos.filter(p => p.restaurante_id === rest.id && p.status !== 'Entregue').length} ativos
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <ActionButton variant="secondary" size="sm" onClick={() => ctrl.prepararEdicaoRestaurante(rest)}>
                                <Edit2 size={12} /> Editar
                              </ActionButton>
                              <ActionButton variant="danger" size="sm" onClick={() => ctrl.excluirRestaurante(rest.id, rest.nome)}>
                                <Trash2 size={12} />
                              </ActionButton>
                            </div>
                          </div>
                          <MapaLocalizacao latitude={rest.latitude} longitude={rest.longitude} endereco={rest.endereco} nome={rest.nome} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
