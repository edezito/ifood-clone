// ============================================================
// VIEW: SelecaoEntregaPedido
// Responsabilidade: UI da tela de seleção de tipo de entrega
// Exibe tempo estimado e taxa calculados via OSRM
// ============================================================
import React from 'react';
import { useTipoEntregaController } from '../controllers/useTipoEntregaController';
import {
  ChevronLeft,
  Bike,
  Store,
  MapPin,
  CheckCircle2,
  Package as PackageIcon,
  Receipt,
  ArrowRight,
  Clock,
  Navigation,
  AlertCircle,
  Loader,
} from 'lucide-react';

// ── Loading ────────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin" />
          <PackageIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-red-500" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">Calculando opções...</p>
          <p className="text-sm text-gray-500 mt-1">Buscando a melhor rota</p>
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
        fontSize: 12, fontWeight: 600,
        background: '#f3f4f6', color: '#6b7280',
        padding: '3px 10px', borderRadius: 999,
      }}>
        <Loader size={11} className="animate-spin" />
        Calculando...
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 12, fontWeight: 700,
      background: '#FFF0F0', color: '#C8101E',
      padding: '3px 10px', borderRadius: 999,
    }}>
      <Clock size={11} />
      {tempoEstimado.texto}
    </span>
  );
}

// ── Toggle Entrega / Retirada ──────────────────────────────
function DeliveryToggle({ tipoSelecionado, onSelecionar, tempoEstimado, calculandoRota }) {
  return (
    <div style={{ background: 'white', padding: '20px 20px 8px' }}>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 17, color: '#1f2937', marginBottom: 14 }}>
        Como deseja receber?
      </h2>

      <div style={{ display: 'flex', gap: 10 }}>
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
                flex: 1, padding: '14px 12px', borderRadius: 16, cursor: 'pointer',
                border: `2px solid ${ativo ? '#EA1D2C' : '#e5e7eb'}`,
                background: ativo ? '#FFF0F0' : 'white',
                textAlign: 'left', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={16} color={ativo ? '#EA1D2C' : '#9ca3af'} />
                <span style={{
                  fontSize: 14, fontWeight: 700,
                  color: ativo ? '#EA1D2C' : '#374151',
                  fontFamily: 'DM Sans, sans-serif',
                }}>{label}</span>
              </div>
              <span style={{ fontSize: 12, color: ativo ? '#EA1D2C' : '#9ca3af', opacity: 0.8 }}>{desc}</span>
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
        margin: '0 16px', padding: '14px 16px', borderRadius: 14,
        background: '#f8fafc', border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Loader size={16} color="#EA1D2C" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
            Calculando rota pela melhor estrada...
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>
            Via OpenStreetMap Routing Machine
          </p>
        </div>
      </div>
    );
  }

  if (erroRota) {
    return (
      <div style={{
        margin: '0 16px', padding: '12px 14px', borderRadius: 14,
        background: '#fffbeb', border: '1px solid #fde68a',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>{erroRota}</p>
      </div>
    );
  }

  if (!rotaInfo) return null;

  return (
    <div style={{
      margin: '0 16px', padding: '14px 16px', borderRadius: 14,
      background: 'linear-gradient(135deg, #FFF0F0, #fff5f5)',
      border: '1px solid #fecaca',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Navigation size={14} color="#EA1D2C" />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#EA1D2C', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Rota calculada
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#1f2937', margin: 0, fontFamily: 'Syne, sans-serif' }}>
            {rotaInfo.distanciaKm} km
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>distância</p>
        </div>
        <div style={{ textAlign: 'center', borderLeft: '1px solid #fecaca', borderRight: '1px solid #fecaca' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#1f2937', margin: 0, fontFamily: 'Syne, sans-serif' }}>
            +{rotaInfo.duracaoMin} min
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>trânsito</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 900, color: '#EA1D2C', margin: 0, fontFamily: 'Syne, sans-serif' }}>
            {rotaInfo.tempoTotalMin} min
          </p>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>total est.</p>
        </div>
      </div>
      <p style={{ fontSize: 10, color: '#d1d5db', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
        inclui ~15 min de preparo · via OpenStreetMap
      </p>
    </div>
  );
}

// ── Seletor de endereços ────────────────────────────────────
function AddressSelector({ enderecos, enderecoSelecionado, onSelecionarEndereco, calculandoRota }) {
  if (enderecos.length === 0) {
    return (
      <div style={{ padding: '0 16px' }}>
        <div style={{
          padding: '14px 16px', borderRadius: 14, background: '#fffbeb',
          border: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', margin: 0 }}>
              Nenhum endereço cadastrado
            </p>
            <p style={{ fontSize: 12, color: '#b45309', margin: '2px 0 0' }}>
              Faça logout e refaça o cadastro para adicionar seu endereço.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
          Endereço de entrega
        </p>
        {calculandoRota && (
          <span style={{ fontSize: 11, color: '#EA1D2C', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Loader size={10} style={{ animation: 'spin 1s linear infinite' }} />
            recalculando taxa...
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
                cursor: 'pointer', transition: 'all 0.2s', borderRadius: 14,
                border: `2px solid ${selecionado ? '#EA1D2C' : '#e5e7eb'}`,
                background: selecionado ? '#FFF0F0' : 'white',
                padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: selecionado ? '#EA1D2C' : '#f3f4f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MapPin size={16} color={selecionado ? '#fff' : '#9ca3af'} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: 14, fontWeight: 700, margin: 0,
                  color: selecionado ? '#C8101E' : '#1f2937',
                }}>
                  {endereco.logradouro}
                </p>
                {endereco.complemento && (
                  <p style={{ fontSize: 12, color: selecionado ? '#EA1D2C' : '#9ca3af', margin: '2px 0 0' }}>
                    {endereco.complemento}
                  </p>
                )}
                {endereco.principal && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: selecionado ? '#EA1D2C' : '#9ca3af',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>principal</span>
                )}
              </div>
              {selecionado && <CheckCircle2 size={18} color="#EA1D2C" style={{ flexShrink: 0, marginTop: 2 }} />}
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
    <div style={{ padding: '0 16px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
        borderRadius: 16, border: '1px solid #fde68a', padding: 16,
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, background: '#fde68a', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Store size={22} color="#92400e" />
        </div>
        <div>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase',
            letterSpacing: '0.06em', background: '#fde68a', padding: '2px 8px',
            borderRadius: 6, display: 'inline-block', marginBottom: 6,
          }}>
            Retirar no local
          </span>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#78350f', margin: '0 0 4px' }}>
            Fique de olho no seu pedido
          </p>
          <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
            <MapPin size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 3 }} />
            Dirija-se ao restaurante após a confirmação.
          </p>
          <p style={{ fontSize: 12, color: '#92400e', margin: '4px 0 0', fontWeight: 600 }}>
            ⏱ Aprox. 15–25 min para ficar pronto
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Resumo de valores ────────────────────────────────────────
function PriceSummary({ subtotal, taxaFrete, totalPedido, tipoSelecionado, calculandoRota }) {
  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{
        background: 'white', borderRadius: 16, border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={16} color="#9ca3af" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#374151', fontFamily: 'DM Sans, sans-serif' }}>
            Resumo de valores
          </span>
        </div>

        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Subtotal</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>
              R$ {subtotal.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, color: '#6b7280' }}>Taxa de entrega</span>
              {calculandoRota && tipoSelecionado === 'entrega' && (
                <Loader size={12} color="#EA1D2C" style={{ animation: 'spin 1s linear infinite' }} />
              )}
            </div>
            {tipoSelecionado === 'retirada' || taxaFrete === 0 ? (
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#15803d',
                background: '#dcfce7', padding: '2px 10px', borderRadius: 999,
              }}>
                Grátis
              </span>
            ) : (
              <span style={{
                fontSize: 14, fontWeight: 600,
                color: calculandoRota ? '#9ca3af' : '#374151',
                transition: 'color 0.3s',
              }}>
                R$ {taxaFrete.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        </div>

        <div style={{
          background: '#f9fafb', padding: '14px 18px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid #f3f4f6',
        }}>
          <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Total</span>
          <span style={{
            fontSize: 22, fontWeight: 900, color: '#1f2937',
            fontFamily: 'Syne, sans-serif',
          }}>
            R$ {totalPedido.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────
export function SelecaoEntregaPedido({
  carrinhoItems,
  usuarioLogado,
  restauranteId,
  onVoltar,
  onAvancarPagamento,
}) {
  const {
    tipoSelecionado,
    enderecos,
    enderecoSelecionado,
    loading,
    salvando,
    subtotal,
    taxaFrete,
    totalPedido,
    podeAvancar,
    rotaInfo,
    calculandoRota,
    erroRota,
    tempoEstimado,
    selecionarTipo,
    selecionarEndereco,
    confirmarSelecao,
  } = useTipoEntregaController(carrinhoItems, usuarioLogado, restauranteId);

  if (loading) return <LoadingSpinner />;

  const handleConfirmar = async () => {
    try {
      const sucesso = await confirmarSelecao();
      if (sucesso) onAvancarPagamento({ tipoEntrega: tipoSelecionado, taxaFrete, tempoEstimado });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={onVoltar}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-800">Finalizar Pedido</h1>
              <p className="text-sm text-gray-500">Etapa 1 de 2</p>
            </div>
          </div>
        </header>

        {/* Conteúdo */}
        <main style={{ flex: 1, paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
          <DeliveryToggle
            tipoSelecionado={tipoSelecionado}
            onSelecionar={selecionarTipo}
            tempoEstimado={tempoEstimado}
            calculandoRota={calculandoRota}
          />

          {tipoSelecionado === 'entrega' ? (
            <>
              <RotaInfoCard
                rotaInfo={rotaInfo}
                calculandoRota={calculandoRota}
                erroRota={erroRota}
              />
              <AddressSelector
                enderecos={enderecos}
                enderecoSelecionado={enderecoSelecionado}
                onSelecionarEndereco={selecionarEndereco}
                calculandoRota={calculandoRota}
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
        </main>

        {/* Footer fixo */}
        <footer style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: 'white', borderTop: '1px solid #e5e7eb',
          padding: '16px', zIndex: 30,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.06)',
        }}>
          <button
            onClick={handleConfirmar}
            disabled={!podeAvancar || salvando || calculandoRota}
            style={{
              width: '100%', maxWidth: 520, margin: '0 auto', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15,
              transition: 'all 0.2s',
              background: (!podeAvancar || calculandoRota)
                ? '#e5e7eb'
                : 'linear-gradient(135deg, #EA1D2C, #C8101E)',
              color: (!podeAvancar || calculandoRota) ? '#9ca3af' : 'white',
              boxShadow: (podeAvancar && !calculandoRota)
                ? '0 4px 14px rgba(234,29,44,0.35)'
                : 'none',
            }}
          >
            {salvando || calculandoRota ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                {calculandoRota ? 'Calculando rota...' : 'Salvando...'}
              </>
            ) : (
              <>
                Ir para Pagamento
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </footer>
      </div>
    </>
  );
}

export default SelecaoEntregaPedido;