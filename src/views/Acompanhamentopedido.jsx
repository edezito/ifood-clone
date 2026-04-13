// ============================================================
// VIEW: AcompanhamentoPedido
// Responsabilidade: UI da tela de acompanhamento
// ============================================================
import React, { useState } from 'react';
import { useAcompanhamentoController } from '../controllers/useAcompanhamentoController';
import { 
  ChevronLeft, 
  Clock, 
  ChefHat, 
  Bike, 
  CheckCircle2,
  MapPin,
  CreditCard,
  Package as PackageIcon,
  AlertCircle,
  User,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';

// ============================================================
// COMPONENTES INTERNOS (Específicos desta tela)
// ============================================================

// Componente de Loading
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <PackageIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">Carregando seu pedido...</p>
          <p className="text-sm text-gray-500 mt-1">Aguarde um instante</p>
        </div>
      </div>
    </div>
  );
}

// Notificação de mudança de status
function StatusChangeNotification({ statusAntigo, statusNovo, mensagem, onClose }) {
  const [visible, setVisible] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  if (!visible) return null;
  
  const getGradient = () => {
    const status = String(statusNovo).toLowerCase();
    if (status.includes('prepar')) return 'from-amber-500 to-orange-500';
    if (status.includes('transito') || status.includes('trânsito')) return 'from-purple-500 to-pink-500';
    if (status.includes('entregue')) return 'from-emerald-500 to-green-500';
    return 'from-blue-500 to-indigo-500';
  };
  
  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-top-2 duration-300">
      <div className={`rounded-2xl shadow-2xl border-2 overflow-hidden bg-gradient-to-r ${getGradient()} border-white/20`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4" />
                <p className="text-sm font-semibold">ATUALIZAÇÃO DO PEDIDO</p>
              </div>
              <p className="text-lg font-bold mb-1">{mensagem}</p>
            </div>
            
            <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="text-white/70 hover:text-white">
              ✕
            </button>
          </div>
        </div>
        <div className="h-1 bg-white/20">
          <div className="h-full bg-white animate-[shrink_5s_linear]" />
        </div>
      </div>
    </div>
  );
}

// Barra de Progresso Animada
function AnimatedProgressBar({ progresso, status }) {
  const getGradient = () => {
    const statusStr = String(status).toLowerCase();
    if (statusStr.includes('prepar')) return 'from-amber-400 to-amber-600';
    if (statusStr.includes('transito') || statusStr.includes('trânsito')) return 'from-purple-400 to-purple-600';
    if (statusStr.includes('entregue')) return 'from-emerald-400 to-emerald-600';
    return 'from-blue-400 to-blue-600';
  };
  
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Progresso do pedido</span>
        <span className="text-sm font-bold text-gray-800">{Math.round(progresso)}%</span>
      </div>
      
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-1000`}
          style={{ width: `${progresso}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}

// Status Badge
function StatusBadge({ status, config, atualizando }) {
  const Icon = config?.icon || Clock;
  
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config?.bgGradient} border ${config?.borderColor} p-6 transition-all duration-500 ${atualizando ? 'scale-[1.02] shadow-lg' : ''}`}>
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <Icon className="w-full h-full" />
      </div>
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${config?.iconBg} ${config?.textColor} text-sm font-medium`}>
            <Clock className="w-4 h-4" />
            <span>{config?.eta}</span>
          </div>
          
          <h2 className={`text-2xl font-bold ${config?.textColor}`}>{config?.label}</h2>
        </div>
        
        <div className={`w-14 h-14 rounded-2xl ${config?.iconBg} flex items-center justify-center ${atualizando ? 'animate-bounce' : ''}`}>
          <Icon className={`w-7 h-7 ${config?.textColor}`} />
        </div>
      </div>
    </div>
  );
}

// Progress Tracker
function ProgressTracker({ statusAtual, passos, indiceAtual }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
        Etapas do Pedido
      </h3>
      
      <div className="space-y-1">
        {passos.map((passo, index) => {
          const isCompleted = index < indiceAtual;
          const isActive = index === indiceAtual;
          const Icon = passo.icon || Clock;
          
          return (
            <div key={passo.key} className="relative">
              <div className="flex items-start gap-4">
                <div className="relative flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                    ${isCompleted ? 'bg-emerald-100 text-emerald-600' : ''}
                    ${isActive ? 'bg-purple-100 text-purple-600 ring-4 ring-purple-50 scale-110' : ''}
                    ${!isCompleted && !isActive ? 'bg-gray-100 text-gray-400' : ''}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </div>
                  
                  {index < passos.length - 1 && (
                    <div className={`w-0.5 h-12 my-1 transition-all duration-500 ${isCompleted ? 'bg-emerald-200' : 'bg-gray-200'}`} />
                  )}
                </div>
                
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold ${isCompleted ? 'text-emerald-700' : ''} ${isActive ? 'text-purple-700 text-lg' : ''} ${!isCompleted && !isActive ? 'text-gray-400' : ''}`}>
                      {passo.label}
                    </p>
                    {isActive && (
                      <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full animate-pulse">
                        Agora
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${isCompleted ? 'text-emerald-600' : ''} ${isActive ? 'text-purple-600 font-medium' : ''} ${!isCompleted && !isActive ? 'text-gray-400' : ''}`}>
                    {isActive && '● '}{passo.hint}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// PIN de Entrega
function DeliveryPIN({ pin }) {
  return (
    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-purple-50">Código de Entrega</p>
        <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
          Mostre ao entregador
        </span>
      </div>
      
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-3">
        <p className="text-5xl font-mono font-bold tracking-wider text-center">
          {pin ? String(pin).split('').join(' ') : '— — — —'}
        </p>
      </div>
      
      <p className="text-sm text-purple-100 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        Confirme este código ao receber seu pedido
      </p>
    </div>
  );
}

// Card de Sucesso
function SuccessCard() {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 text-center border border-emerald-200">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>
      <h3 className="text-2xl font-bold text-emerald-800 mb-2">Pedido Entregue!</h3>
      <p className="text-emerald-600">Esperamos que aproveite cada mordida. Bom apetite! 🍽️</p>
    </div>
  );
}

// Informações do Cliente
function CustomerInfo({ pedido }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Informações do Cliente
      </h3>
      
      <div className="space-y-2">
        {pedido.cliente_nome && (
          <div className="flex items-center gap-3 text-gray-700">
            <User className="w-4 h-4 text-gray-400" />
            <span>{pedido.cliente_nome}</span>
          </div>
        )}
        
        {pedido.telefone && (
          <div className="flex items-center gap-3 text-gray-700">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{pedido.telefone}</span>
          </div>
        )}
        
        {pedido.email && (
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{pedido.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Resumo do Pedido
function OrderSummary({ itens, pedido }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs font-medium">Pagamento</span>
          </div>
          <p className="font-semibold text-gray-800">{pedido.forma_pagamento || 'Não informado'}</p>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <PackageIcon className="w-4 h-4" />
            <span className="text-xs font-medium">Tipo</span>
          </div>
          <p className="font-semibold text-gray-800">{pedido.tipo_entrega || 'Entrega'}</p>
        </div>
      </div>
      
      {pedido.endereco && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">Endereço de Entrega</span>
          </div>
          <p className="text-gray-700">{pedido.endereco}</p>
        </div>
      )}
      
      <CustomerInfo pedido={pedido} />
      
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Itens do Pedido</h3>
        </div>
        
        <div className="divide-y divide-gray-50">
          {itens.length === 0 ? (
            <p className="px-5 py-8 text-center text-gray-400 text-sm">Nenhum item encontrado</p>
          ) : (
            itens.map((item, index) => (
              <div key={index} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                    {item.quantidade}×
                  </span>
                  <span className="text-gray-700 font-medium">
                    {item.produtos?.nome || 'Produto'}
                  </span>
                </div>
                <span className="font-semibold text-gray-800">
                  R$ {(item.preco_unitario * item.quantidade).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
        
        <div className="bg-gray-50 px-5 py-4 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="text-2xl font-bold text-gray-800">
            R$ {pedido.total?.toFixed(2) ?? '0,00'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
function AcompanhamentoPedido({ pedidoId, onVoltarAoMenu }) {
  const [activeTab, setActiveTab] = useState('tracker');
  
  const {
    pedido,
    itens,
    loading,
    atualizando,
    mostrarNotificacao,
    statusNormalizado,
    configStatus,
    progresso,
    statusAnterior,
    mensagemTransicao,
    STATUS_PASSOS,
    indiceStatusAtual,
    fecharNotificacao
  } = useAcompanhamentoController(pedidoId);

  if (loading || !pedido) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      {/* Notificação de mudança de status */}
      {mostrarNotificacao && statusAnterior && (
        <StatusChangeNotification
          statusAntigo={statusAnterior}
          statusNovo={pedido.status}
          mensagem={mensagemTransicao}
          onClose={fecharNotificacao}
        />
      )}
      
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200">
          <div className="px-4 py-4 flex items-center gap-3">
            <button
              onClick={onVoltarAoMenu}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-800">Acompanhar Pedido</h1>
                {atualizando && (
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full animate-pulse">
                    Atualizando...
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                #{String(pedido.id).slice(0, 8).toUpperCase()}
              </p>
            </div>
            
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75" />
            </div>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {/* Barra de progresso */}
          <AnimatedProgressBar progresso={progresso} status={statusNormalizado} />
          
          {/* Status Banner */}
          <StatusBadge 
            status={statusNormalizado}
            config={{ ...configStatus, icon: STATUS_PASSOS[indiceStatusAtual]?.icon }}
            atualizando={atualizando}
          />

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${activeTab === 'tracker' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'}`}
            >
              Rastreamento
            </button>
            <button
              onClick={() => setActiveTab('resumo')}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${activeTab === 'resumo' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'}`}
            >
              Resumo
            </button>
          </div>

          {/* Conteúdo */}
          {activeTab === 'tracker' ? (
            <div className="space-y-4">
              <ProgressTracker 
                statusAtual={pedido.status}
                passos={STATUS_PASSOS.map((p, i) => ({ ...p, icon: p.key === 'Aguardando' ? Clock : p.key === 'Em Preparação' ? ChefHat : p.key === 'Em Trânsito' ? Bike : CheckCircle2 }))}
                indiceAtual={indiceStatusAtual}
              />
              
              {statusNormalizado === 'Em Trânsito' && <DeliveryPIN pin={pedido.pin_entrega} />}
              {statusNormalizado === 'Entregue' && <SuccessCard />}
            </div>
          ) : (
            <OrderSummary itens={itens} pedido={pedido} />
          )}

          {/* Botão voltar */}
          <button
            onClick={onVoltarAoMenu}
            className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            ← Voltar para o início
          </button>
        </main>
      </div>
    </div>
  );
}

export default AcompanhamentoPedido;