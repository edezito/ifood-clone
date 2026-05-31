import React from 'react';
import { useTipoEntregaController } from '../controllers/useTipoEntregaController';
import {
  Bike, Store, MapPin, CheckCircle2,
  Package as PackageIcon, ArrowRight, Clock,
  Navigation, AlertCircle, Loader, ChevronRight
} from 'lucide-react';

const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

// ── Loading Inline ─────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', minHeight: 300, alignItems: 'center', justifyContent: 'center', animation: 'slideStep 0.3s ease-out' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 56, height: 56 }}>
          <Loader size={56} color="#EA1D2C" style={{ animation: 'spin 1s linear infinite' }} />
          <PackageIcon size={20} color="#EA1D2C" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        </div>
        <div>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: '#1f2937', margin: '0 0 4px' }}>Calculando opções...</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Buscando a melhor rota</p>
        </div>
      </div>
    </div>
  );
}

// ── Badge de tempo estimado ────────────────────────────────
function TempoBadge({ tempoEstimado, calculandoRota }) {
  if (calculandoRota) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 700, background: '#f3f4f6', color: '#6b7280',
        padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em'
      }}>
        <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> Calculando...
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 800, background: '#FFF0F0', color: '#EA1D2C',
      padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.04em'
    }}>
      <Clock size={12} strokeWidth={2.5} /> {tempoEstimado.texto}
    </span>
  );
}

// ── Toggle Entrega / Retirada ──────────────────────────────
function DeliveryToggle({ tipoSelecionado, onSelecionar, tempoEstimado, calculandoRota }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { key: 'entrega', icon: Bike, label: 'Entrega', desc: 'No seu endereço' },
          { key: 'retirada', icon: Store, label: 'Retirada', desc: 'No restaurante' },
        ].map(({ key, icon: Icon, label, desc }) => {
          const ativo = tipoSelecionado === key;
          return (
            <button
              key={key}
              onClick={() => onSelecionar(key)}
              style={{
                flex: 1, padding: '16px', borderRadius: 14, cursor: 'pointer',
                border: `2px solid ${ativo ? '#EA1D2C' : '#e5e7eb'}`,
                background: ativo ? '#FFF0F0' : '#fff',
                textAlign: 'left', transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', gap: 6,
                boxShadow: ativo ? '0 4px 12px rgba(234,29,44,0.1)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, 
                  background: ativo ? '#EA1D2C' : '#f3f4f6', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  <Icon size={16} color={ativo ? '#fff' : '#9ca3af'} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: ativo ? '#C8101E' : '#374151' }}>
                  {label}
                </span>
              </div>
              <span style={{ fontSize: 12, color: ativo ? '#EA1D2C' : '#9ca3af', marginBottom: ativo ? 6 : 0 }}>{desc}</span>
              {ativo && <TempoBadge tempoEstimado={tempoEstimado} calculandoRota={calculandoRota} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Card de info da rota ────────────────────────────────────
function RotaInfoCard({ rotaInfo, calculandoRota, erroRota }) {
  if (calculandoRota) {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 14, background: '#f9fafb', border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20
      }}>
        <Loader size={16} color="#EA1D2C" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>Calculando rota...</p>
        </div>
      </div>
    );
  }

  if (erroRota) {
    return (
      <div style={{
        padding: '12px 16px', borderRadius: 14, background: '#fffbeb', border: '1px solid #fde68a',
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20
      }}>
        <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 12, fontWeight: 500, color: '#92400e', margin: 0 }}>{erroRota}</p>
      </div>
    );
  }

  if (!rotaInfo) return null;

  return (
    <div style={{
      padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg, #FFF0F0, #fff5f5)',
      border: '1px solid #fecaca', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Navigation size={12} color="#EA1D2C" />
        <span style={{ fontSize: 10, fontWeight: 800, color: '#EA1D2C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Detalhes da Rota
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 900, color: '#1f2937', margin: 0 }}>{rotaInfo.distanciaKm} km</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>distância</p>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid #fecaca', borderRight: '1px solid #fecaca' }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 900, color: '#1f2937', margin: 0 }}>+{rotaInfo.duracaoMin} min</p>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>trânsito</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 900, color: '#EA1D2C', margin: 0 }}>{rotaInfo.tempoTotalMin} min</p>
          <p style={{ fontSize: 11, color: '#EA1D2C', fontWeight: 600, margin: '2px 0 0' }}>total est.</p>
        </div>
      </div>
    </div>
  );
}

// ── Seletor de endereços ────────────────────────────────────
function AddressSelector({ enderecos, enderecoSelecionado, onSelecionarEndereco, calculandoRota }) {
  if (enderecos.length === 0) {
    return (
      <div style={{ padding: '16px', borderRadius: 14, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
        <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e', margin: 0 }}>Nenhum endereço</p>
          <p style={{ fontSize: 12, color: '#b45309', margin: '4px 0 0', lineHeight: 1.4 }}>Faça logout e refaça o cadastro para adicionar seu endereço.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Endereço de Entrega
        </span>
        {calculandoRota && (
          <span style={{ fontSize: 11, color: '#EA1D2C', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} /> atualizando...
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {enderecos.map((endereco) => {
          const selecionado = enderecoSelecionado === endereco.id;
          return (
            <div
              key={endereco.id}
              onClick={() => onSelecionarEndereco(endereco.id)}
              style={{
                cursor: 'pointer', transition: 'all 0.2s ease', borderRadius: 14,
                border: `2px solid ${selecionado ? '#EA1D2C' : '#e5e7eb'}`,
                background: selecionado ? '#FFF0F0' : '#f9fafb',
                padding: '14px', display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: selecionado ? '#EA1D2C' : '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MapPin size={16} color={selecionado ? '#fff' : '#9ca3af'} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: selecionado ? 700 : 600, color: selecionado ? '#C8101E' : '#374151', margin: 0 }}>
                  {endereco.logradouro}
                </p>
                {endereco.complemento && (
                  <p style={{ fontSize: 12, color: selecionado ? '#EA1D2C' : '#6b7280', margin: '2px 0 0' }}>{endereco.complemento}</p>
                )}
              </div>
              {selecionado && <CheckCircle2 size={18} color="#EA1D2C" style={{ flexShrink: 0 }} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Info de retirada ────────────────────────────────────────
function PickupInfo() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
      borderRadius: 14, border: '1px solid #e5e7eb', padding: '16px',
      display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20
    }}>
      <div style={{
        width: 38, height: 38, background: '#fff', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <Store size={18} color="#1f2937" />
      </div>
      <div>
        <span style={{
          fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase',
          letterSpacing: '0.06em', background: '#e5e7eb', padding: '3px 8px',
          borderRadius: 6, display: 'inline-block', marginBottom: 6,
        }}>
          Retirada Local
        </span>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: '#1f2937', margin: '0 0 2px' }}>
          Retire direto no restaurante
        </p>
        <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
          Após a confirmação, o endereço exato será liberado. <br/>
          <strong style={{ color: '#374151' }}>⏱ Aprox. 15–25 min de preparo.</strong>
        </p>
      </div>
    </div>
  );
}

// ── Resumo de valores ────────────────────────────────────────
function PriceSummary({ subtotal, taxaFrete, totalPedido, tipoSelecionado, calculandoRota }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
        <span>Subtotal</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#6b7280' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>Taxa de entrega</span>
          {calculandoRota && tipoSelecionado === 'entrega' && (
            <Loader size={12} color="#EA1D2C" style={{ animation: 'spin 1s linear infinite' }} />
          )}
        </div>
        {tipoSelecionado === 'retirada' || taxaFrete === 0 ? (
          <span style={{ fontSize: 12, fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Grátis</span>
        ) : (
          <span style={{ fontWeight: 500, color: calculandoRota ? '#9ca3af' : '#374151' }}>
            {formatCurrency(taxaFrete)}
          </span>
        )}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 8, borderTop: '2px solid #e5e7eb', marginTop: 4,
      }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937' }}>Total</span>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 900, color: '#EA1D2C' }}>
          {formatCurrency(totalPedido)}
        </span>
      </div>
    </div>
  );
}

// ── Componente Principal ─────────────────────────────────────
export function SelecaoEntregaPedido({ 
  carrinhoItems, 
  usuarioLogado, 
  restauranteId, 
  onVoltar, 
  onAvancarPagamento 
}) {
  const {
    loadingInicial,
    calculandoRota,
    tipoSelecionado,
    enderecoSelecionado,
    enderecos,
    taxaFrete,
    tempoEstimado,
    rotaInfo,
    erroRota,
    subtotal,
    totalPedido,
    setTipoSelecionado,
    setEnderecoSelecionado,
  } = useTipoEntregaController(carrinhoItems, usuarioLogado, restauranteId);

  if (loadingInicial) {
    return <LoadingSpinner />;
  }

  const handleAvancar = () => {
    onAvancarPagamento({
      tipoEntrega: tipoSelecionado,
      taxaFrete: tipoSelecionado === 'retirada' ? 0 : taxaFrete,
      tempoEstimado,
      rotaInfo
    });
  };

  const botaoDesabilitado = calculandoRota || (tipoSelecionado === 'entrega' && !enderecoSelecionado);

  return (
    <div style={{ animation: 'slideStep 0.3s ease-out' }}>
      <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 18, color: '#1f2937', marginBottom: 20 }}>
        Opções de Entrega
      </h3>

      <DeliveryToggle 
        tipoSelecionado={tipoSelecionado} 
        onSelecionar={setTipoSelecionado}
        tempoEstimado={tempoEstimado}
        calculandoRota={calculandoRota}
      />

      {tipoSelecionado === 'entrega' ? (
        <>
          <AddressSelector 
            enderecos={enderecos}
            enderecoSelecionado={enderecoSelecionado}
            onSelecionarEndereco={setEnderecoSelecionado}
            calculandoRota={calculandoRota}
          />
          <RotaInfoCard 
            rotaInfo={rotaInfo} 
            calculandoRota={calculandoRota} 
            erroRota={erroRota} 
          />
        </>
      ) : (
        <PickupInfo />
      )}

      <PriceSummary 
        subtotal={subtotal}
        taxaFrete={taxaFrete}
        totalPedido={totalPedido}
        tipoSelecionado={tipoSelecionado}
        calculandoRota={calculandoRota}
      />

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onVoltar}
          style={{
            padding: '15px', borderRadius: 14, border: 'none', background: '#f3f4f6', color: '#6b7280',
            fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          Voltar
        </button>
        <button
          onClick={handleAvancar}
          disabled={botaoDesabilitado}
          style={{
            flex: 1, padding: '15px', borderRadius: 14, border: 'none',
            background: botaoDesabilitado ? '#fca5a5' : 'linear-gradient(135deg, #EA1D2C, #C8101E)',
            color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15,
            cursor: botaoDesabilitado ? 'not-allowed' : 'pointer',
            boxShadow: botaoDesabilitado ? 'none' : '0 6px 20px rgba(234,29,44,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
          }}
        >
          {botaoDesabilitado ? 'Aguarde...' : 'Ir para Pagamento'} <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}