// ============================================================
// VIEW: SelecaoEntregaPedido
// Responsabilidade: UI da tela de seleção de tipo de entrega
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
  ArrowRight
} from 'lucide-react';

// ============================================================
// COMPONENTES INTERNOS
// ============================================================

// Componente de Loading (Reaproveitado do seu padrão)
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin" />
          <PackageIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-red-500" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-800">Carregando opções...</p>
          <p className="text-sm text-gray-500 mt-1">Preparando seu carrinho</p>
        </div>
      </div>
    </div>
  );
}

// Toggle Animado (Entrega vs Retirada)
function DeliveryToggle({ tipoSelecionado, onSelecionar }) {
  return (
    <div className="bg-white p-6 pb-2">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Como deseja receber?</h2>
      
      <div className="flex p-1 bg-gray-100 rounded-2xl relative">
        <button
          onClick={() => onSelecionar('entrega')}
          className={`relative z-10 flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2
            ${tipoSelecionado === 'entrega' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Bike className="w-5 h-5" />
          Entrega
        </button>
        
        <button
          onClick={() => onSelecionar('retirada')}
          className={`relative z-10 flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2
            ${tipoSelecionado === 'retirada' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Store className="w-5 h-5" />
          Retirada
        </button>

        {/* Fundo animado (Pill) */}
        <div 
          className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-in-out"
          style={{ transform: tipoSelecionado === 'entrega' ? 'translateX(0)' : 'translateX(100%)' }}
        />
      </div>
    </div>
  );
}

// Lista de Endereços do Cliente
function AddressSelector({ enderecos, enderecoSelecionado, onSelecionarEndereco }) {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Endereço de Entrega
        </h3>
        <button className="text-sm font-medium text-red-500 hover:text-red-600">
          Adicionar novo
        </button>
      </div>

      <div className="space-y-3">
        {enderecos.map((endereco) => {
          const isSelected = enderecoSelecionado === endereco.id;
          return (
            <div 
              key={endereco.id}
              onClick={() => onSelecionarEndereco(endereco.id)}
              className={`relative cursor-pointer transition-all duration-200 rounded-2xl border p-4 flex items-start gap-4
                ${isSelected 
                  ? 'border-red-500 bg-red-50 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-red-200'}`}
            >
              <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${isSelected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              
              <div className="flex-1 pr-6">
                <p className={`font-medium ${isSelected ? 'text-red-900' : 'text-gray-800'}`}>
                  {endereco.logradouro}
                </p>
                <p className={`text-sm mt-0.5 ${isSelected ? 'text-red-700/80' : 'text-gray-500'}`}>
                  {endereco.complemento || 'Sem complemento'}
                </p>
              </div>

              {isSelected && (
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
                  <CheckCircle2 className="w-6 h-6 text-red-500 animate-in zoom-in duration-200" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Informações do Restaurante para Retirada
function PickupInfo() {
  return (
    <div className="p-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <Store className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-100/50 px-2 py-1 rounded-md mb-2 inline-block">
              Retirar no Local
            </span>
            <h3 className="font-bold text-amber-900 text-lg">Restaurante Saboroso</h3>
            <p className="text-amber-700 text-sm mt-1 flex items-start gap-1">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              Av. Paulista, 1000 - Bela Vista, São Paulo - SP
            </p>
            <p className="text-amber-600 text-sm mt-3 font-medium">
              ≈ 15-20 min para ficar pronto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Resumo de Valores
function PriceSummary({ subtotal, taxaFrete, totalPedido, tipoSelecionado }) {
  return (
    <div className="p-4">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-700">Resumo de Valores</h3>
        </div>
        
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Taxa de entrega</span>
            {tipoSelecionado === 'retirada' || taxaFrete === 0 ? (
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                Grátis
              </span>
            ) : (
              <span className="font-medium text-gray-600">
                R$ {taxaFrete.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-5 py-4 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="text-2xl font-bold text-gray-900">
            R$ {totalPedido.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export function SelecaoEntregaPedido({ carrinhoId, onVoltar, onAvancarPagamento }) {
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
    selecionarTipo,
    selecionarEndereco,
    confirmarSelecao
  } = useTipoEntregaController(carrinhoId);

  if (loading) {
    return <LoadingSpinner />;
  }

  const handleConfirmar = async () => {
    try {
      const sucesso = await confirmarSelecao();
      if (sucesso) onAvancarPagamento();
    } catch (error) {
      // O controller já lida com o log, aqui você poderia mostrar um Toast
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header Fixo */}
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

      {/* Conteúdo Rolável */}
      <main className="flex-1 pb-32"> {/* pb-32 para dar espaço ao botão flutuante */}
        <DeliveryToggle 
          tipoSelecionado={tipoSelecionado} 
          onSelecionar={selecionarTipo} 
        />
        
        {tipoSelecionado === 'entrega' ? (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <AddressSelector 
              enderecos={enderecos}
              enderecoSelecionado={enderecoSelecionado}
              onSelecionarEndereco={selecionarEndereco}
            />
          </div>
        ) : (
          <PickupInfo />
        )}

        <PriceSummary 
          subtotal={subtotal}
          taxaFrete={taxaFrete}
          totalPedido={totalPedido}
          tipoSelecionado={tipoSelecionado}
        />
      </main>

      {/* Footer Fixo com Botão de Ação */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-safe z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleConfirmar}
          disabled={!podeAvancar || salvando}
          className={`w-full max-w-lg mx-auto flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all duration-200
            ${!podeAvancar 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'}`}
        >
          {salvando ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Ir para Pagamento
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

export default SelecaoEntregaPedido;