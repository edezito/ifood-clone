// ============================================================
// VIEW: AcompanhamentoPedido
// Responsabilidade: exibir o acompanhamento em tempo real.
// Toda a lógica foi movida para useAcompanhamentoController.
// ============================================================
import React from 'react';
import { CheckCircle, ChevronLeft, Package, ReceiptText } from 'lucide-react';
import { useAcompanhamentoController } from '../controllers/useAcompanhamentoController';

function AcompanhamentoPedido({ pedidoId, onVoltarAoMenu }) {
  const { pedido, itens, STATUS_PASSOS, indiceStatusAtual } = useAcompanhamentoController(pedidoId);

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen animate-pulse">
        <Package className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Carregando detalhes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="bg-white px-4 py-6 shadow-sm border-b">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={onVoltarAoMenu} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="text-gray-700" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-gray-800">Acompanhamento</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Pedido #{pedido.id.toString().slice(0, 8)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4 pb-10">

        {/* Status */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col gap-6">
            {STATUS_PASSOS.map((passo, idx) => {
              const isDone = indiceStatusAtual >= idx;
              return (
                <div key={idx} className="flex items-start gap-4 relative">
                  {idx !== 3 && (
                    <div className={`absolute left-[11px] top-7 w-[2px] h-10 ${isDone ? 'bg-green-500' : 'bg-gray-100'}`} />
                  )}
                  <div className={`z-10 w-6 h-6 rounded-full flex items-center justify-center ${isDone ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                    <CheckCircle size={14} fill={isDone ? 'currentColor' : 'none'} />
                  </div>
                  <span className={`text-sm ${isDone ? 'font-bold text-gray-800' : 'text-gray-400'}`}>{passo.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PIN */}
        {pedido.status === 'Em Trânsito' && (
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-6 text-white text-center shadow-lg shadow-orange-200">
            <p className="text-sm font-medium opacity-90 mb-2">Mostre ao entregador</p>
            <h2 className="text-5xl font-black tracking-[12px] mb-1">{pedido.pin_entrega}</h2>
            <p className="text-[10px] uppercase font-bold opacity-80">Código de segurança para recebimento</p>
          </div>
        )}

        {/* Resumo */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-gray-800">
            <ReceiptText size={20} className="text-red-500" />
            <h3 className="font-bold">Resumo da Sacola</h3>
          </div>
          <div className="space-y-4">
            {itens.length > 0 ? (
              itens.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md font-bold text-xs">{item.quantidade}x</span>
                    <span className="text-gray-700">{item.produtos?.nome ?? 'Produto'}</span>
                  </div>
                  <span className="font-medium text-gray-900">R$ {(item.preco_unitario * item.quantidade).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">Detalhes dos itens não disponíveis.</p>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="text-xl font-black text-red-600">R$ {pedido.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button onClick={onVoltarAoMenu} className="w-full py-4 text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors">
          Voltar para o início
        </button>
      </div>
    </div>
  );
}

export default AcompanhamentoPedido;