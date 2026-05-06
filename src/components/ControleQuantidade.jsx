// ============================================================
// COMPONENTE: ControleQuantidade
// Responsabilidade: UI dos botões de + e -
// ============================================================
import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

export function ControleQuantidade({ quantidade, onAumentar, onDiminuir }) {
  const isRemocao = quantidade === 1;

  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1 shadow-inner w-fit">
      <button 
        onClick={onDiminuir}
        className={`w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm transition-colors
          ${isRemocao ? 'text-red-500 hover:bg-red-50' : 'text-gray-600 hover:text-gray-800'}`}
      >
        {isRemocao ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
      </button>

      <span className="w-4 text-center font-semibold text-gray-800 select-none">
        {quantidade}
      </span>

      <button 
        onClick={onAumentar}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-red-500 shadow-sm hover:bg-red-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}